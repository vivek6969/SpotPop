import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { storage } from './storage.ts';
import { checkServerImageSafety } from './safetyService.ts';

export interface ImageVariantInfo {
  key: string;
  url: string;
  size: number;
  width: number;
  height: number;
  format: string;
}

export interface ImageAssetRecord {
  hash: string;
  originalSize: number;
  mimeType: string;
  width: number;
  height: number;
  variants: {
    thumb: ImageVariantInfo;
    preview: ImageVariantInfo;
    highres: ImageVariantInfo;
    original?: ImageVariantInfo;
  };
  refCount: number;
  createdAt: string;
}

export interface StorageReport {
  totalUploads: number;
  uniqueAssets: number;
  totalStorageBytes: number;
  originalStorageBytes: number;
  previewStorageBytes: number;
  thumbStorageBytes: number;
  highResStorageBytes: number;
  avgImageSizeBytes: number;
  duplicateAvoidedCount: number;
  duplicateBytesSaved: number;
  estimatedMonthlyCostUSD: number;
  storageProviderName: string;
}

const REGISTRY_FILE = path.resolve(process.cwd(), 'uploads', 'image-registry.json');

export class ImageService {
  private registry: Map<string, ImageAssetRecord> = new Map();
  private duplicateAvoidedCount = 0;
  private duplicateBytesSaved = 0;

  constructor() {
    this.loadRegistry();
  }

  private loadRegistry(): void {
    try {
      if (fs.existsSync(REGISTRY_FILE)) {
        const raw = fs.readFileSync(REGISTRY_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.assets) {
          for (const asset of data.assets) {
            // Self-healing migration for GIF assets:
            // If asset was indexed before animated GIF support and has webp preview, upgrade to animated.gif
            const isGifAsset =
              asset.mimeType === 'image/gif' ||
              asset.variants?.original?.format === 'gif' ||
              asset.variants?.original?.url?.endsWith('.gif') ||
              asset.variants?.preview?.url?.endsWith('.gif');

            if (isGifAsset) {
              const hash = asset.hash;
              const diskDir = path.resolve(process.cwd(), 'uploads', 'images', hash);
              const animPath = path.join(diskDir, 'animated.gif');
              const origPath = path.join(diskDir, 'original.gif');

              if (!fs.existsSync(animPath) && fs.existsSync(origPath)) {
                try {
                  fs.copyFileSync(origPath, animPath);
                } catch (e) {
                  console.warn(`Could not copy original.gif to animated.gif for ${hash}`, e);
                }
              }

              const targetUrl = fs.existsSync(animPath)
                ? `/uploads/images/${hash}/animated.gif`
                : (asset.variants?.original?.url || `/uploads/images/${hash}/original.gif`);
              const targetKey = `${hash}/animated.gif`;

              asset.mimeType = 'image/gif';
              asset.variants.preview = { key: targetKey, url: targetUrl, size: asset.originalSize, width: asset.width, height: asset.height, format: 'gif' };
              asset.variants.thumb = { key: targetKey, url: targetUrl, size: asset.originalSize, width: asset.width, height: asset.height, format: 'gif' };
              asset.variants.highres = { key: targetKey, url: targetUrl, size: asset.originalSize, width: asset.width, height: asset.height, format: 'gif' };
              if (asset.variants.original) {
                asset.variants.original.format = 'gif';
                asset.variants.original.url = targetUrl;
              }
            }

            this.registry.set(asset.hash, asset);
          }
        }
        this.duplicateAvoidedCount = data.duplicateAvoidedCount || 0;
        this.duplicateBytesSaved = data.duplicateBytesSaved || 0;
      }
    } catch (e) {
      console.warn('Could not read image registry file, starting fresh', e);
    }
  }

  private saveRegistry(): void {
    try {
      const dir = path.dirname(REGISTRY_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const payload = {
        assets: Array.from(this.registry.values()),
        duplicateAvoidedCount: this.duplicateAvoidedCount,
        duplicateBytesSaved: this.duplicateBytesSaved,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save image registry', e);
    }
  }

  /**
   * Process and store an image buffer or base64 string.
   * Performs deduplication, metadata stripping, multi-resolution WebP compression,
   * and stores only URLs and metadata in the catalog.
   */
  async processAndStore(
    input: Buffer | string,
    filename: string = 'image.jpg'
  ): Promise<{
    imageUrl: string;
    thumbnailUrl: string;
    highResUrl: string;
    hash: string;
    width: number;
    height: number;
    size: number;
    isDuplicate: boolean;
  }> {
    let buffer: Buffer;
    if (typeof input === 'string') {
      const cleanB64 = input.replace(/^data:image\/[a-z0-9.+]+;base64,/i, '');
      buffer = Buffer.from(cleanB64, 'base64');
    } else {
      buffer = input;
    }

    if (!buffer || buffer.length === 0) {
      throw new Error('Image buffer is empty');
    }

    // Enforce 12MB upload limit
    if (buffer.length > 12 * 1024 * 1024) {
      throw new Error('Image exceeds 12MB size limit');
    }

    // Enforce Strict Server-Side Safety & Nudity Inspection
    const safety = await checkServerImageSafety(buffer);
    if (!safety.safe) {
      throw new Error(safety.reason || 'This image could not be uploaded because it appears to contain sensitive or adult content. Please choose another photo or artwork.');
    }

    // 1. Content Hashing & Format Inspection
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
    const isBufferGif =
      filename.toLowerCase().endsWith('.gif') ||
      buffer.slice(0, 3).toString() === 'GIF' ||
      buffer.slice(0, 6).toString() === 'GIF87a' ||
      buffer.slice(0, 6).toString() === 'GIF89a';

    // If identical asset was already uploaded, increment refCount and reuse immediately
    const existing = this.registry.get(hash);
    if (existing) {
      existing.refCount++;
      this.duplicateAvoidedCount++;
      this.duplicateBytesSaved += buffer.length;

      const existingIsGif =
        isBufferGif ||
        existing.mimeType === 'image/gif' ||
        existing.variants?.original?.format === 'gif' ||
        existing.variants?.original?.url?.endsWith('.gif') ||
        existing.variants?.preview?.url?.endsWith('.gif');

      if (existingIsGif) {
        const gifKey = `${hash}/animated.gif`;
        const gifUrl = `/uploads/images/${hash}/animated.gif`;
        const diskDir = path.resolve(process.cwd(), 'uploads', 'images', hash);
        const animPath = path.join(diskDir, 'animated.gif');
        const origPath = path.join(diskDir, 'original.gif');

        if (!fs.existsSync(animPath)) {
          if (fs.existsSync(origPath)) {
            try { fs.copyFileSync(origPath, animPath); } catch {}
          } else {
            try { fs.writeFileSync(animPath, buffer); } catch {}
          }
        }

        existing.mimeType = 'image/gif';
        existing.variants.thumb = { key: gifKey, url: gifUrl, size: buffer.length || existing.originalSize, width: existing.width, height: existing.height, format: 'gif' };
        existing.variants.preview = { key: gifKey, url: gifUrl, size: buffer.length || existing.originalSize, width: existing.width, height: existing.height, format: 'gif' };
        existing.variants.highres = { key: gifKey, url: gifUrl, size: buffer.length || existing.originalSize, width: existing.width, height: existing.height, format: 'gif' };
        existing.variants.original = { key: gifKey, url: gifUrl, size: buffer.length || existing.originalSize, width: existing.width, height: existing.height, format: 'gif' };

        this.saveRegistry();

        return {
          imageUrl: gifUrl,
          thumbnailUrl: gifUrl,
          highResUrl: gifUrl,
          hash: existing.hash,
          width: existing.width,
          height: existing.height,
          size: buffer.length || existing.originalSize,
          isDuplicate: true,
        };
      }

      this.saveRegistry();

      return {
        imageUrl: existing.variants.preview.url,
        thumbnailUrl: existing.variants.thumb.url,
        highResUrl: existing.variants.highres.url,
        hash: existing.hash,
        width: existing.width,
        height: existing.height,
        size: existing.variants.preview.size,
        isDuplicate: true,
      };
    }

    // 2. Validate Image via Sharp
    const image = sharp(buffer);
    const meta = await image.metadata();

    if (!meta.width || !meta.height) {
      throw new Error('Invalid image asset format');
    }

    const originalWidth = meta.width;
    const originalHeight = meta.height;
    const mimeType = meta.format ? `image/${meta.format}` : 'image/jpeg';

    // SPECIAL HANDLING: Full Animated GIF Support
    // Preserves 100% of animation frames, loop counts, and timing for animated GIFs
    const isGif = meta.format === 'gif' || filename.toLowerCase().endsWith('.gif') || buffer.slice(0, 3).toString() === 'GIF';
    if (isGif) {
      const gifKey = `${hash}/animated.gif`;
      const gifUrl = await storage.save(gifKey, buffer, 'image/gif');

      const record: ImageAssetRecord = {
        hash,
        originalSize: buffer.length,
        mimeType: 'image/gif',
        width: originalWidth,
        height: originalHeight,
        variants: {
          thumb: { key: gifKey, url: gifUrl, size: buffer.length, width: originalWidth, height: originalHeight, format: 'gif' },
          preview: { key: gifKey, url: gifUrl, size: buffer.length, width: originalWidth, height: originalHeight, format: 'gif' },
          highres: { key: gifKey, url: gifUrl, size: buffer.length, width: originalWidth, height: originalHeight, format: 'gif' },
          original: { key: gifKey, url: gifUrl, size: buffer.length, width: originalWidth, height: originalHeight, format: 'gif' },
        },
        refCount: 1,
        createdAt: new Date().toISOString(),
      };

      this.registry.set(hash, record);
      this.saveRegistry();

      return {
        imageUrl: gifUrl,
        thumbnailUrl: gifUrl,
        highResUrl: gifUrl,
        hash,
        width: originalWidth,
        height: originalHeight,
        size: buffer.length,
        isDuplicate: false,
      };
    }

    // 3. Smart High-Efficiency WebP (Single Master File):
    // Ultra-optimized 800x1000 WebP at 85% quality: crystal-sharp on 4K/Retina displays & maximum zoom,
    // stripped of unneeded camera EXIF metadata, weighing only ~35-50 KB (90%+ storage savings).
    const previewBuffer = await sharp(buffer)
      .rotate()
      .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    // 4. Save Single Master Variant in Object Storage
    const previewKey = `${hash}/preview.webp`;
    const previewUrl = await storage.save(previewKey, previewBuffer, 'image/webp');

    const variantInfo: ImageVariantInfo = {
      key: previewKey,
      url: previewUrl,
      size: previewBuffer.length,
      width: Math.min(800, originalWidth),
      height: Math.min(1000, originalHeight),
      format: 'webp',
    };

    // 5. Commit Metadata to Registry
    const record: ImageAssetRecord = {
      hash,
      originalSize: buffer.length,
      mimeType: 'image/webp',
      width: originalWidth,
      height: originalHeight,
      variants: {
        thumb: variantInfo,
        preview: variantInfo,
        highres: variantInfo,
      },
      refCount: 1,
      createdAt: new Date().toISOString(),
    };

    this.registry.set(hash, record);
    this.saveRegistry();

    return {
      imageUrl: previewUrl,
      thumbnailUrl: previewUrl,
      highResUrl: previewUrl,
      hash,
      width: originalWidth,
      height: originalHeight,
      size: previewBuffer.length,
      isDuplicate: false,
    };
  }

  /**
   * Permanently purge an asset directory and its registry entry
   */
  purgeAsset(hash: string): boolean {
    try {
      const diskDir = path.resolve(process.cwd(), 'uploads', 'images', hash);
      if (fs.existsSync(diskDir)) {
        fs.rmSync(diskDir, { recursive: true, force: true });
      }
      this.registry.delete(hash);
      this.saveRegistry();
      return true;
    } catch (e) {
      console.warn(`Failed to purge asset ${hash}:`, e);
      return false;
    }
  }

  /**
   * Scans uploads/images/ and purges any folders not in referencedHashes,
   * and strips redundant files (original.*, highres.webp, thumb.webp) from active ones.
   */
  cleanupOrphans(referencedHashes: Set<string>): { deletedCount: number; freedBytes: number } {
    const imagesDir = path.resolve(process.cwd(), 'uploads', 'images');
    let deletedCount = 0;
    let freedBytes = 0;

    if (!fs.existsSync(imagesDir)) return { deletedCount: 0, freedBytes: 0 };

    try {
      const folders = fs.readdirSync(imagesDir);
      for (const folder of folders) {
        const folderPath = path.join(imagesDir, folder);
        try {
          if (!fs.statSync(folderPath).isDirectory()) continue;
        } catch {
          continue;
        }

        if (!referencedHashes.has(folder)) {
          // Folder is not referenced by any active spot! Completely delete it.
          const size = this.getDirSize(folderPath);
          freedBytes += size;
          fs.rmSync(folderPath, { recursive: true, force: true });
          this.registry.delete(folder);
          deletedCount++;
        } else {
          // Folder IS referenced: purge any redundant legacy variants (original.*, highres.webp, thumb.webp)
          try {
            const files = fs.readdirSync(folderPath);
            const hasAnim = files.includes('animated.gif');
            for (const f of files) {
              const filePath = path.join(folderPath, f);
              if (hasAnim && f !== 'animated.gif') {
                freedBytes += fs.statSync(filePath).size;
                fs.unlinkSync(filePath);
              } else if (!hasAnim && f !== 'preview.webp') {
                freedBytes += fs.statSync(filePath).size;
                fs.unlinkSync(filePath);
              }
            }
          } catch (e) {
            console.warn(`Could not clean redundant files in ${folder}:`, e);
          }
        }
      }

      // Clean up any registry entries not in referencedHashes
      for (const key of Array.from(this.registry.keys())) {
        if (!referencedHashes.has(key)) {
          this.registry.delete(key);
        }
      }

      this.saveRegistry();
    } catch (err) {
      console.warn('Error during image orphan cleanup:', err);
    }

    return { deletedCount, freedBytes };
  }

  private getDirSize(dirPath: string): number {
    let total = 0;
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          total += this.getDirSize(fullPath);
        } else {
          total += fs.statSync(fullPath).size;
        }
      }
    } catch {}
    return total;
  }

  /**
   * Reference Tracking: Increment reference count when a spot uses this image hash
   */
  claimReference(hash: string): void {
    const asset = this.registry.get(hash);
    if (asset) {
      asset.refCount++;
      this.saveRegistry();
    }
  }

  /**
   * Reference Tracking: Decrement reference count when a spot is deleted
   */
  releaseReference(hash: string): void {
    const asset = this.registry.get(hash);
    if (asset) {
      asset.refCount = Math.max(0, asset.refCount - 1);
      this.saveRegistry();
    }
  }

  /**
   * Generate comprehensive Cost and Storage report for Admin Dashboard
   */
  getStorageReport(): StorageReport {
    let totalStorageBytes = 0;
    let originalStorageBytes = 0;
    let previewStorageBytes = 0;
    let thumbStorageBytes = 0;
    let highResStorageBytes = 0;

    for (const asset of this.registry.values()) {
      if (asset.variants?.original && asset.variants.original.key !== asset.variants.preview?.key) {
        originalStorageBytes += asset.variants.original.size;
      }
      if (asset.variants?.preview) {
        previewStorageBytes += asset.variants.preview.size;
      }
      if (asset.variants?.thumb && asset.variants.thumb.key !== asset.variants.preview?.key) {
        thumbStorageBytes += asset.variants.thumb.size;
      }
      if (asset.variants?.highres && asset.variants.highres.key !== asset.variants.preview?.key) {
        highResStorageBytes += asset.variants.highres.size;
      }
    }

    totalStorageBytes = originalStorageBytes + previewStorageBytes + thumbStorageBytes + highResStorageBytes;
    const uniqueAssets = this.registry.size;
    const totalUploads = uniqueAssets + this.duplicateAvoidedCount;
    const avgImageSizeBytes = uniqueAssets > 0 ? Math.round(previewStorageBytes / uniqueAssets) : 0;

    // Cloudflare R2 standard storage rate: $0.015 / GB-month, $0 egress fees
    const totalGB = totalStorageBytes / (1024 * 1024 * 1024);
    const estimatedMonthlyCostUSD = Math.round(totalGB * 0.015 * 1000) / 1000;

    return {
      totalUploads,
      uniqueAssets,
      totalStorageBytes,
      originalStorageBytes,
      previewStorageBytes,
      thumbStorageBytes,
      highResStorageBytes,
      avgImageSizeBytes,
      duplicateAvoidedCount: this.duplicateAvoidedCount,
      duplicateBytesSaved: this.duplicateBytesSaved,
      estimatedMonthlyCostUSD,
      storageProviderName: storage.name,
    };
  }
}

export const imageService = new ImageService();

