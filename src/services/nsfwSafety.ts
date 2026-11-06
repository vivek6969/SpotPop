import type { NSFWJS, PredictionType } from 'nsfwjs';

export interface SafetyFilterConfig {
  pornThreshold: number;
  hentaiThreshold: number;
  combinedAdultThreshold: number;
  sexyStrictThreshold: number;
  neutralSafeBuffer: number;
}

export const DEFAULT_SAFETY_CONFIG: SafetyFilterConfig = {
  pornThreshold: 0.55,
  hentaiThreshold: 0.55,
  combinedAdultThreshold: 0.65,
  sexyStrictThreshold: 0.88,
  neutralSafeBuffer: 0.30,
};

export interface SafetyCheckResult {
  safe: boolean;
  reason?: string;
  predictions: Array<{ className: string; probability: number }>;
  topPrediction?: { className: string; probability: number };
}

// In-memory model cache so MobileNetV2 is loaded only once across uploads
let cachedModel: NSFWJS | null = null;
let modelLoadingPromise: Promise<NSFWJS> | null = null;

/**
 * Lazy loads and caches the lightweight MobileNetV2 NSFWJS model in the user's browser.
 * Only downloaded when the user selects an image for upload.
 */
export async function getNSFWModel(): Promise<NSFWJS> {
  if (cachedModel) {
    return cachedModel;
  }

  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  modelLoadingPromise = (async () => {
    try {
      // Dynamic import ensures NSFWJS & TensorFlow.js are not in the main bundle
      const nsfw = await import('nsfwjs');
      // Load lightweight MobileNetV2 model
      const model = await nsfw.load();
      cachedModel = model;
      return model;
    } catch (err) {
      console.error('Failed to load NSFWJS model:', err);
      modelLoadingPromise = null;
      throw err;
    }
  })();

  return modelLoadingPromise;
}

/**
 * Creates an in-memory HTMLImageElement from a File, Blob, or Data/HTTP URL
 */
function loadImageElement(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (e) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for safety inspection'));
    };

    if (source instanceof File || source instanceof Blob) {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else if (typeof source === 'string') {
      img.src = source;
    } else {
      reject(new Error('Invalid image source'));
    }
  });
}

/**
 * Performs local client-side safety classification using NSFWJS (MobileNetV2).
 *
 * Rules:
 * 1. Reject high-confidence Porn (>= 0.55) or Hentai (>= 0.55)
 * 2. Reject combined adult probability (Porn + Hentai >= 0.65)
 * 3. Configurable Sexy threshold: Only reject if Sexy >= 0.88 AND safe categories (Neutral/Drawing) < 0.30
 * 4. Safe drawings, artwork, anime, beach photos and portraits are preserved.
 */
export async function checkImageSafety(
  source: File | Blob | string,
  config: SafetyFilterConfig = DEFAULT_SAFETY_CONFIG
): Promise<SafetyCheckResult> {
  try {
    const [model, imgElement] = await Promise.all([
      getNSFWModel(),
      loadImageElement(source),
    ]);

    const predictions: PredictionType[] = await model.classify(imgElement);

    const scores: Record<string, number> = {
      Porn: 0,
      Hentai: 0,
      Sexy: 0,
      Neutral: 0,
      Drawing: 0,
    };

    for (const pred of predictions) {
      scores[pred.className] = pred.probability;
    }

    const pornScore = scores.Porn || 0;
    const hentaiScore = scores.Hentai || 0;
    const sexyScore = scores.Sexy || 0;
    const neutralScore = scores.Neutral || 0;
    const drawingScore = scores.Drawing || 0;

    const topPrediction = predictions.reduce((prev, current) =>
      current.probability > prev.probability ? current : prev
    );

    // Rule 1: High-confidence Porn
    if (pornScore >= config.pornThreshold) {
      return {
        safe: false,
        reason: `Explicit content detected (${Math.round(pornScore * 100)}% confidence). Prohibited on the public canvas.`,
        predictions,
        topPrediction,
      };
    }

    // Rule 2: High-confidence Hentai
    if (hentaiScore >= config.hentaiThreshold) {
      return {
        safe: false,
        reason: `Explicit animated/hentai content detected (${Math.round(hentaiScore * 100)}% confidence). Prohibited on the public canvas.`,
        predictions,
        topPrediction,
      };
    }

    // Rule 3: Combined adult content (Porn + Hentai)
    if (pornScore + hentaiScore >= config.combinedAdultThreshold) {
      return {
        safe: false,
        reason: 'Adult content detected. Please choose a community-friendly image or artwork.',
        predictions,
        topPrediction,
      };
    }

    // Rule 4: Sexy category with strict protection for safe ordinary photos
    // If neutral or drawing scores are substantial, ordinary photos (swimwear, gym, statues, portraits) are ALLOWED.
    const safeBuffer = neutralScore + drawingScore;
    if (sexyScore >= config.sexyStrictThreshold && safeBuffer < config.neutralSafeBuffer) {
      return {
        safe: false,
        reason: 'Suggestive or explicit content detected. Please choose a community-friendly photo.',
        predictions,
        topPrediction,
      };
    }

    // Image is safe!
    return {
      safe: true,
      predictions,
      topPrediction,
    };
  } catch (err: any) {
    console.warn('NSFW check warning:', err);
    // Fail-open with warning if model encounters an unreadable format
    return {
      safe: true,
      predictions: [],
    };
  }
}

