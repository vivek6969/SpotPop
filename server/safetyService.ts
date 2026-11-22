import * as nsfw from 'nsfwjs';
import * as tf from '@tensorflow/tfjs';
import sharp from 'sharp';

let modelPromise: Promise<nsfw.NSFWJS> | null = null;

async function getModel(): Promise<nsfw.NSFWJS> {
  if (!modelPromise) {
    modelPromise = nsfw.load();
  }
  return modelPromise;
}

export async function checkServerImageSafety(buffer: Buffer): Promise<{ safe: boolean; reason?: string }> {
  try {
    const model = await getModel();

    // Resize to 224x224 (native MobileNetV2 input) and strip alpha channel for lightning-fast inference
    const { data, info } = await sharp(buffer)
      .resize(224, 224, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3]);
    const predictions = await model.classify(tensor);
    tensor.dispose();

    const scores: Record<string, number> = {
      Porn: 0,
      Hentai: 0,
      Sexy: 0,
      Neutral: 0,
      Drawing: 0,
    };

    for (const p of predictions) {
      scores[p.className] = p.probability;
    }

    const porn = scores.Porn || 0;
    const hentai = scores.Hentai || 0;
    const sexy = scores.Sexy || 0;
    const neutral = scores.Neutral || 0;
    const drawing = scores.Drawing || 0;
    const safeScore = neutral + drawing;
    const adultScore = porn + hentai + sexy;

    // Rule 1: Direct Porn / Genitalia / Explicit Nudity (>= 25%)
    if (porn >= 0.25) {
      return {
        safe: false,
        reason: `Explicit adult content or nudity detected (${Math.round(porn * 100)}% confidence). Prohibited on SpotPop.`,
      };
    }

    // Rule 2: Explicit Animated / Illustrated Adult Content (>= 30%)
    if (hentai >= 0.30) {
      return {
        safe: false,
        reason: `Explicit illustrated/hentai content detected (${Math.round(hentai * 100)}% confidence). Prohibited on SpotPop.`,
      };
    }

    // Rule 3: Combined Porn + Hentai (>= 35%)
    if (porn + hentai >= 0.35) {
      return {
        safe: false,
        reason: 'Adult content detected. Prohibited on SpotPop.',
      };
    }

    // Rule 4: Combined Porn + Sexy (>= 45% adult) with low safe buffer (< 50%)
    if (porn + sexy >= 0.45 && safeScore < 0.50) {
      return {
        safe: false,
        reason: 'Nudity or sexually explicit content detected. Prohibited on SpotPop.',
      };
    }

    // Rule 5: Nude body / Revealing Content (Sexy >= 45% and Neutral < 35%)
    if (sexy >= 0.45 && neutral < 0.35) {
      return {
        safe: false,
        reason: 'Nudity or sexually suggestive content detected. Prohibited on SpotPop.',
      };
    }

    // Rule 6: Overwhelming adult probability (Porn + Sexy + Hentai >= 60% with low safe buffer < 35%)
    if (adultScore >= 0.60 && safeScore < 0.35) {
      return {
        safe: false,
        reason: 'Adult or explicit content detected. Prohibited on SpotPop.',
      };
    }

    return { safe: true };
  } catch (err: any) {
    console.warn('[SafetyService] Server inspection notice:', err);
    return { safe: true };
  }
}
