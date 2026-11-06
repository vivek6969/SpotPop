import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { storage } from './storage.ts';

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

    // 1. Content Hashing for Instant Deduplication
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);

    // If identical asset was already uploaded, increment refCount and reuse immediately
    const existing = this.registry.get(hash);
    if (existing) {
      existing.refCount++;
      this.duplicateAvoidedCount++;
      this.duplicateBytesSaved += buffer.length;
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

    // 3. Smart Multi-Resolution Variants:
    // A) Thumbnail: 100x130 WebP (~8-18 KB) for zoomed-out overview
    const thumbBuffer = await sharp(buffer)
      .rotate()
      .resize(100, 130, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 72, effort: 4 })
      .toBuffer();

    // B) Canvas Preview: 340x420 WebP (~20-55 KB, exact 2x retina size for 170x210 card frame)
    const previewBuffer = await sharp(buffer)
      .rotate()
      .resize(340, 420, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();

    // C) High-Res: 800x1000 WebP (~70-130 KB) for detail modal inspection & share kits
    const highresBuffer = await sharp(buffer)
      .rotate()
      .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    // 4. Save Variants in Content-Addressed Object Storage
    const thumbKey = `${hash}/thumb.webp`;
    const previewKey = `${hash}/preview.webp`;
    const highresKey = `${hash}/highres.webp`;

    const thumbUrl = await storage.save(thumbKey, thumbBuffer, 'image/webp');
    const previewUrl = await storage.save(previewKey, previewBuffer, 'image/webp');
    const highresUrl = await storage.save(highresKey, highresBuffer, 'image/webp');

    // Optionally store original if requested
    const originalKey = `${hash}/original.${meta.format || 'jpg'}`;
    const originalUrl = await storage.save(originalKey, buffer, mimeType);

    // 5. Commit Metadata to Registry
    const record: ImageAssetRecord = {
      hash,
      originalSize: buffer.length,
      mimeType,
      width: originalWidth,
      height: originalHeight,
      variants: {
        thumb: {
          key: thumbKey,
          url: thumbUrl,
          size: thumbBuffer.length,
          width: 100,
          height: 130,
          format: 'webp',
        },
        preview: {
          key: previewKey,
          url: previewUrl,
          size: previewBuffer.length,
          width: 340,
          height: 420,
          format: 'webp',
        },
        highres: {
          key: highresKey,
          url: highresUrl,
          size: highresBuffer.length,
          width: Math.min(800, originalWidth),
          height: Math.min(1000, originalHeight),
          format: 'webp',
        },
        original: {
          key: originalKey,
          url: originalUrl,
          size: buffer.length,
          width: originalWidth,
          height: originalHeight,
          format: meta.format || 'jpg',
        },
      },
      refCount: 1,
      createdAt: new Date().toISOString(),
    };

    this.registry.set(hash, record);
    this.saveRegistry();

    return {
      imageUrl: previewUrl,
      thumbnailUrl: thumbUrl,
      highResUrl: highresUrl,
      hash,
      width: originalWidth,
      height: originalHeight,
      size: previewBuffer.length,
      isDuplicate: false,
    };
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
      if (asset.variants.original) {
        originalStorageBytes += asset.variants.original.size;
      }
      previewStorageBytes += asset.variants.preview.size;
      thumbStorageBytes += asset.variants.thumb.size;
      highResStorageBytes += asset.variants.highres.size;
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

