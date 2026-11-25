import express from 'express';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api.ts';
import { db } from './server/database.ts';
import { migrateBase64Images } from './server/migrateImages.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Automatically migrate any legacy Base64 images to content-addressed object storage
  await migrateBase64Images().catch(err => console.warn('Image migration notice:', err));

  // Purge any orphaned uploads / media files not referenced by active spots
  try {
    const cleaned = db.cleanupUnreferencedMedia();
    if (cleaned.deletedImages > 0 || cleaned.deletedAudio > 0) {
      console.log(`[MediaManager] Cleaned ${cleaned.deletedImages} orphaned image folders, ${cleaned.deletedAudio} audio files (${(cleaned.freedBytes / 1024).toFixed(1)} KB freed).`);
    }
  } catch (err) {
    console.warn('[MediaManager] Startup cleanup error:', err);
  }

  // Static uploads directory with 1-year immutable caching for zero-egress/low-latency delivery
  const uploadsPath = path.resolve(__dirname, 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  // Intercept any request for an animated GIF asset requested as a static webp variant (e.g. from legacy caches)
  app.get('/uploads/images/:hash/:variant.webp', (req, res, next) => {
    const { hash } = req.params;
    const animPath = path.resolve(uploadsPath, 'images', hash, 'animated.gif');
    const origPath = path.resolve(uploadsPath, 'images', hash, 'original.gif');
    if (fs.existsSync(animPath)) {
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(animPath);
    }
    if (fs.existsSync(origPath)) {
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(origPath);
    }
    next();
  });

  app.use('/uploads', express.static(uploadsPath, {
    maxAge: '1y',
    immutable: true,
  }));

  // Body parser with 20MB limit for image uploads
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // API router
  app.use('/api', apiRouter);

  // Automatically free port in development if a zombie instance is still running
  if (process.env.NODE_ENV !== 'production') {
    try {
      if (process.platform === 'win32') {
        execSync(
          `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
          { stdio: 'ignore' }
        );
      }
    } catch {}
  }

  const httpServer = http.createServer(app);

  // In development, hook up Vite dev server middlewares with shared HTTP server for HMR
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
        watch: {
          ignored: [
            '**/uploads/**',
            '**/server-db*.json',
            '**/dev-dist/**',
            '**/.tmp/**',
            '**/dist/**',
          ],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    const interfaces = os.networkInterfaces();
    const networkIps: string[] = [];
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          networkIps.push(net.address);
        }
      }
    }
    console.log(`🚀 SpotPop server running:`);
    console.log(`   • Local:   http://localhost:${PORT}`);
    for (const ip of networkIps) {
      console.log(`   • Network: http://${ip}:${PORT} (Open on your phone)`);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
