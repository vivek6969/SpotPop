import fs from 'fs';
import path from 'path';
import { imageService } from './imageService.ts';

const DB_FILE = path.resolve(process.cwd(), 'server-db.json');
export async function migrateBase64Images(): Promise<{
  migratedSpots: number;
  migratedOrders: number;
  originalSizeBytes: number;
  newSizeBytes: number;
}> {
  if (!fs.existsSync(DB_FILE)) {
    return { migratedSpots: 0, migratedOrders: 0, originalSizeBytes: 0, newSizeBytes: 0 };
  }

  const originalContent = fs.readFileSync(DB_FILE, 'utf-8');
  if (!originalContent.includes('data:image')) {
    // Zero legacy base64 images present: no migration or backup file needed
    return { migratedSpots: 0, migratedOrders: 0, originalSizeBytes: 0, newSizeBytes: 0 };
  }

  const originalSizeBytes = fs.statSync(DB_FILE).size;
  const db = JSON.parse(originalContent);
  let migratedSpots = 0;
  let migratedOrders = 0;

  // 2. Migrate Base64 Images in Spots
  if (Array.isArray(db.spots)) {
    for (const spot of db.spots) {
      if (spot.content?.imageUrl && spot.content.imageUrl.startsWith('data:image')) {
        try {
          const isGif = spot.content.imageUrl.startsWith('data:image/gif');
          const result = await imageService.processAndStore(spot.content.imageUrl, `${spot.id}.${isGif ? 'gif' : 'webp'}`);
          spot.content.imageUrl = result.imageUrl;
          migratedSpots++;
          console.log(`[Migration] Migrated spot ${spot.id} to ${result.imageUrl} (${(result.size / 1024).toFixed(1)} KB)`);
        } catch (err) {
          console.error(`[Migration] Error migrating spot ${spot.id}:`, err);
        }
      } else if (spot.content?.imageUrl && spot.content.imageUrl.includes('/uploads/images/')) {
        const match = spot.content.imageUrl.match(/\/uploads\/images\/([a-f0-9]+)\//);
        if (match) {
          const hash = match[1];
          const diskDir = path.resolve(process.cwd(), 'uploads', 'images', hash);
          const hasGif = fs.existsSync(path.join(diskDir, 'animated.gif')) || fs.existsSync(path.join(diskDir, 'original.gif'));
          if (hasGif && !spot.content.imageUrl.endsWith('.gif')) {
            spot.content.imageUrl = `/uploads/images/${hash}/animated.gif`;
            migratedSpots++;
            console.log(`[Migration] Upgraded spot ${spot.id} to animated GIF (${spot.content.imageUrl})`);
          }
        }
      }
    }
  }

  // 3. Migrate Base64 Images in Orders
  if (Array.isArray(db.orders)) {
    for (const order of db.orders) {
      if (order.spotDraft?.content?.imageUrl && order.spotDraft.content.imageUrl.startsWith('data:image')) {
        try {
          const result = await imageService.processAndStore(order.spotDraft.content.imageUrl, `${order.id}.webp`);
          order.spotDraft.content.imageUrl = result.imageUrl;
          migratedOrders++;
        } catch (err) {
          console.error(`[Migration] Error migrating order ${order.id}:`, err);
        }
      }
      if (order.spotDraft?.imageUrl && order.spotDraft.imageUrl.startsWith('data:image')) {
        try {
          const result = await imageService.processAndStore(order.spotDraft.imageUrl, `${order.id}.webp`);
          order.spotDraft.imageUrl = result.imageUrl;
          migratedOrders++;
        } catch (err) {
          console.error(`[Migration] Error migrating order ${order.id}:`, err);
        }
      }
    }
  }

  // 4. Save compact clean database
  if (migratedSpots > 0 || migratedOrders > 0) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }

  const newSizeBytes = fs.statSync(DB_FILE).size;
  console.log(`[Migration] Done! Migrated ${migratedSpots} spots, ${migratedOrders} orders.`);
  console.log(`[Migration] Database size shrunk from ${(originalSizeBytes / 1024).toFixed(1)} KB -> ${(newSizeBytes / 1024).toFixed(1)} KB`);

  return {
    migratedSpots,
    migratedOrders,
    originalSizeBytes,
    newSizeBytes,
  };
}

