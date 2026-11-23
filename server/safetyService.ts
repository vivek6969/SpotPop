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

    // Rule 1: Explicit Pornography / Genitalia / Sexual Acts (>= 60%, or >= 50% when dominant over swimwear/sexy)
    if (porn >= 0.60 || (porn >= 0.50 && porn > sexy)) {
      return {
        safe: false,
        reason: 'This image could not be uploaded because it appears to contain explicit content or nudity. Please choose another photo or artwork.',
      };
    }

    // Rule 2: Explicit Animated / Illustrated Adult Content (>= 55%)
    if (hentai >= 0.55) {
      return {
        safe: false,
        reason: 'This image could not be uploaded because it appears to contain sensitive or adult artwork. Please choose another image.',
      };
    }

    // Rule 3: Combined Explicit (Porn + Hentai >= 65%)
    if (porn + hentai >= 0.65) {
      return {
        safe: false,
        reason: 'This image could not be uploaded because it appears to contain adult content. Please choose another photo or artwork.',
      };
    }

    // Note: Shirtless male photos, gym selfies, fitness modelling, and swimwear
    // have high 'Sexy' scores and moderate ambiguous skin scores, which are allowed on SpotPop.

    return { safe: true };
  } catch (err: any) {
    console.warn('[SafetyService] Server inspection notice:', err);
    return { safe: true };
  }
}
