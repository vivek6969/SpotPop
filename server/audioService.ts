import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { SpotAudio } from '../src/types/index.ts';

const AUDIO_DIR = path.resolve(process.cwd(), 'uploads', 'audio');

// Max audio size: 500 KB
export const MAX_AUDIO_BYTES = 500 * 1024;
// Max audio duration: 15.0 seconds (+ 0.5s tolerance for clock jitter)
export const MAX_AUDIO_DURATION_SECONDS = 15.5;

export class AudioService {
  constructor() {
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(AUDIO_DIR)) {
      fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }
  }

  /**
   * Process, validate, and store an audio asset in object storage.
   * Never stores Base64 in database records.
   */
  async processAndStoreAudio(
    base64Data: string,
    duration: number,
    mimeType: string,
    type: 'voice' | 'music'
  ): Promise<SpotAudio> {
    this.ensureDirectory();

    // Strip data URL scheme if included
    const cleanBase64 = base64Data.replace(/^data:audio\/[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    // Strict Size Limit: Maximum 500 KB
    if (buffer.length > MAX_AUDIO_BYTES) {
      throw new Error(`Audio file size (${Math.round(buffer.length / 1024)} KB) exceeds the strict 500 KB limit.`);
    }

    // Strict Duration Limit: Maximum 15 seconds
    if (duration > MAX_AUDIO_DURATION_SECONDS) {
      throw new Error(`Audio duration (${duration.toFixed(1)}s) exceeds the strict 15 seconds limit.`);
    }

    // Determine clean file extension
    let ext = '.webm';
    if (mimeType.includes('mp4') || mimeType.includes('m4a') || mimeType.includes('aac')) {
      ext = '.m4a';
    } else if (mimeType.includes('ogg')) {
      ext = '.ogg';
    } else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
      ext = '.mp3';
    } else if (mimeType.includes('wav')) {
      ext = '.wav';
    }

    // Generate unique content hash
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 12);
    const storageKey = `aud_${Date.now()}_${hash}${ext}`;
    const filePath = path.join(AUDIO_DIR, storageKey);

    await fs.promises.writeFile(filePath, buffer);

    const roundedDuration = Math.min(15.0, Math.round(duration * 10) / 10);

    return {
      url: `/uploads/audio/${storageKey}`,
      storageKey,
      duration: roundedDuration,
      mimeType: mimeType || 'audio/webm',
      size: buffer.length,
      type: type || 'voice',
    };
  }

  /**
   * Safely delete orphaned audio files that are not referenced by any published Big Pop.
   */
  cleanOrphanedAudio(activeKeys: Set<string>): { deletedCount: number; freedBytes: number } {
    this.ensureDirectory();
    let deletedCount = 0;
    let freedBytes = 0;

    try {
      const files = fs.readdirSync(AUDIO_DIR);
      const now = Date.now();
      const ONE_HOUR_MS = 60 * 60 * 1000;

      for (const file of files) {
        if (!activeKeys.has(file)) {
          const filePath = path.join(AUDIO_DIR, file);
          try {
            const stats = fs.statSync(filePath);
            // Protect recent uploads (within last hour) from race conditions during creation
            if (now - stats.mtimeMs > ONE_HOUR_MS) {
              freedBytes += stats.size;
              fs.unlinkSync(filePath);
              deletedCount++;
            }
          } catch (e) {
            console.warn(`Could not examine or unlink audio file: ${file}`, e);
          }
        }
      }
    } catch (err) {
      console.warn('Error during orphaned audio cleanup:', err);
    }

    return { deletedCount, freedBytes };
  }
}

export const audioService = new AudioService();

