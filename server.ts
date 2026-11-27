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

  // Resilient fallback for any missing upload image: return a sleek SVG placeholder instead of 404/HTML
  const FALLBACK_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#181824"/>
        <stop offset="50%" stop-color="#241a3e"/>
        <stop offset="100%" stop-color="#121024"/>
      </linearGradient>
      <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF2E93"/>
        <stop offset="100%" stop-color="#FF8A00"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#g)"/>
    <circle cx="300" cy="270" r="80" fill="url(#neon)" opacity="0.15"/>
    <rect x="230" y="225" width="140" height="100" rx="14" fill="none" stroke="url(#neon)" stroke-width="5"/>
    <circle cx="300" cy="275" r="28" fill="none" stroke="#FFFFFF" stroke-width="4"/>
    <circle cx="340" cy="245" r="6" fill="#00F2FE"/>
    <text x="300" y="380" fill="#FFFFFF" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="20" font-weight="700" text-anchor="middle" letter-spacing="3">SPOTPOP</text>
    <text x="300" y="410" fill="#94A3B8" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="14" text-anchor="middle">Photo Preview</text>
  </svg>`;

  app.get('/uploads/images/:hash/:file', (req, res) => {
    const { hash, file } = req.params;
    const requestedPath = path.resolve(uploadsPath, 'images', hash, file);
    if (fs.existsSync(requestedPath)) {
      return res.sendFile(requestedPath);
    }
    // Check if any variant exists in the asset folder
    const hashDir = path.resolve(uploadsPath, 'images', hash);
    if (fs.existsSync(hashDir)) {
      try {
        const files = fs.readdirSync(hashDir);
        for (const candidate of ['animated.gif', 'preview.webp', 'highres.webp', 'thumb.webp', 'original.gif', 'original.jpg', 'original.png']) {
          if (files.includes(candidate)) {
            const candidatePath = path.join(hashDir, candidate);
            const mime = candidate.endsWith('.gif') ? 'image/gif' : candidate.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
            res.setHeader('Content-Type', mime);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return res.sendFile(candidatePath);
          }
        }
      } catch {}
    }
    // If not found at all, return the clean SVG placeholder with HTTP 200 (never broken image)
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).send(FALLBACK_IMAGE_SVG);
  });

  // Automatically create a rolling snapshot backup of database on boot
  try {
    const backupFile = db.createBackup();
    if (backupFile) console.log(`[BackupManager] Automatic database snapshot created: ${path.basename(backupFile)}`);
  } catch (e) {
    console.warn('[BackupManager] Snapshot warning:', e);
  }

  // Security Headers: X-Content-Type-Options, Frame protection, Referrer Policy
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
    next();
  });

  // Operational Health Check Endpoint for Container Liveness & SRE Monitoring
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      databaseSpots: db.getSpots().length,
      timestamp: new Date().toISOString(),
    });
  });

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
    } catch { }
  }

  const httpServer = http.createServer(app);

  // In development, hook up Vite dev server middlewares
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
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

    // Graceful Shutdown & Uncaught Exception Handlers
    const gracefulShutdown = (signal: string) => {
      console.log(`\n[Process] Received ${signal}. Starting graceful shutdown...`);
      try {
        db.save();
        console.log('[Process] Database flushed to disk.');
      } catch (e) {
        console.error('[Process] Error saving db on shutdown:', e);
      }
      httpServer.close(() => {
        console.log('[Process] HTTP server closed cleanly. Exiting.');
        process.exit(0);
      });
      setTimeout(() => {
        console.error('[Process] Forcefully exiting after 5s timeout.');
        process.exit(1);
      }, 5000).unref();
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (err) => {
      console.error('[Process] Uncaught Exception:', err);
    });
    process.on('unhandledRejection', (reason) => {
      console.error('[Process] Unhandled Rejection:', reason);
    });
  }

startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
