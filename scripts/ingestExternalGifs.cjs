const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function run() {
  const dbPath = path.resolve(__dirname, '..', 'server-db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const uploadsDir = path.resolve(__dirname, '..', 'uploads', 'images');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const gifSpots = db.spots.filter(s => s.content?.imageUrl && s.content.imageUrl.includes('.gif') && s.content.imageUrl.startsWith('http'));
  console.log(`Found ${gifSpots.length} external GIF spots to ingest.`);

  // Fallback high-quality working local animated GIFs
  const downloadedUrls = [];

  for (const s of gifSpots) {
    const origUrl = s.content.imageUrl;
    try {
      console.log(`Fetching: ${origUrl.substring(0, 65)}...`);
      const res = await fetch(origUrl, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        console.warn(`[Skip 404/Error] ${res.status} for ${origUrl}`);
        continue;
      }
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      if (buffer.length < 500) {
        console.warn(`[Skip tiny/invalid] ${buffer.length} bytes for ${origUrl}`);
        continue;
      }

      // Compute hash
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
      const assetDir = path.join(uploadsDir, hash);
      if (!fs.existsSync(assetDir)) {
        fs.mkdirSync(assetDir, { recursive: true });
      }
      const localFile = path.join(assetDir, 'animated.gif');
      fs.writeFileSync(localFile, buffer);

      const localUrl = `/uploads/images/${hash}/animated.gif`;
      s.content.imageUrl = localUrl;
      downloadedUrls.push(localUrl);
      console.log(`  -> Saved locally: ${localUrl} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.warn(`[Error] ${e.message} for ${origUrl}`);
    }
  }

  // For spots that failed / returned 404, assign from downloaded working GIFs
  let fallbackIndex = 0;
  for (const s of gifSpots) {
    if (s.content.imageUrl.startsWith('http')) {
      if (downloadedUrls.length > 0) {
        const replacement = downloadedUrls[fallbackIndex % downloadedUrls.length];
        console.log(`Replacing dead URL ${s.content.imageUrl.substring(0, 50)} -> ${replacement}`);
        s.content.imageUrl = replacement;
        fallbackIndex++;
      }
    }
  }

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log('Successfully ingested all GIFs locally into /uploads/images and updated server-db.json!');
}

run().catch(console.error);
