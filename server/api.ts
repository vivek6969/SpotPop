import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import { db } from './database.ts';
import { createRazorpayOrder, verifyPaymentSignature } from './razorpay.ts';
import type { ProductTier, Spot, Order, User, ModerationReport } from '../src/types/index.ts';
import { PRODUCTS } from '../src/types/index.ts';
import { imageService } from './imageService.ts';
import { audioService } from './audioService.ts';
import { validateInstagramUsername } from '../src/utils/instagramUsername.ts';

export const apiRouter = Router();

// Password hashing & constant-time verification using native Node.js crypto
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// Simple in-memory session token mapping
const SESSIONS = new Map<string, string>(); // token -> userId

function getAuthenticatedUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const userId = SESSIONS.get(token);
  if (!userId) return null;
  return db.getUserById(userId) || null;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in as administrator.' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
  }
  next();
}

function getViewerIdentifier(req: Request): string | undefined {
  const user = getAuthenticatedUser(req);
  if (user) return user.id;
  const headerViewer = req.headers['x-viewer-id'] as string;
  if (headerViewer) return headerViewer;
  const queryViewer = (req.query.viewerId || req.query.viewer) as string;
  if (queryViewer) return queryViewer;
  return undefined;
}

// =================== REAL-TIME LIVE STREAM (SSE) ===================
const liveClients = new Set<Response>();

export function broadcastSpotEvent(
  event: 'spot_created' | 'spot_updated' | 'spot_deleted' | 'user_follow_updated',
  data: unknown
) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of liveClients) {
    try {
      client.write(payload);
    } catch {
      liveClients.delete(client);
    }
  }
}

// 25-second keepalive ping to prevent reverse proxies and browsers from timing out
setInterval(() => {
  for (const client of liveClients) {
    try {
      client.write(': keep-alive\n\n');
    } catch {
      liveClients.delete(client);
    }
  }
}, 25000).unref();

apiRouter.get('/spots/live', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  res.write(`event: connected\ndata: {"status":"connected","timestamp":${Date.now()}}\n\n`);
  liveClients.add(res);

  req.on('close', () => {
    liveClients.delete(res);
  });
});

// =================== SPOTS ===================

// GET spots: backward-compatible full list OR high-performance bounding box viewport query
apiRouter.get('/spots', (req: Request, res: Response) => {
  try {
    const minX = req.query.minX !== undefined ? parseFloat(req.query.minX as string) : undefined;
    const minY = req.query.minY !== undefined ? parseFloat(req.query.minY as string) : undefined;
    const maxX = req.query.maxX !== undefined ? parseFloat(req.query.maxX as string) : undefined;
    const maxY = req.query.maxY !== undefined ? parseFloat(req.query.maxY as string) : undefined;
    const zoom = req.query.zoom !== undefined ? parseFloat(req.query.zoom as string) : 1;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit as string, 10) : 2000;
    const viewer = getViewerIdentifier(req);

    // Viewport-based query if bounding coordinates are provided
    if (minX !== undefined && minY !== undefined && maxX !== undefined && maxY !== undefined) {
      let spots = db.queryViewport(minX, minY, maxX, maxY, limit, viewer);

      // Level of Detail (LOD) optimization: when zoomed far out, strip heavy asset payloads
      if (zoom < 0.4) {
        spots = spots.map(s => ({
          ...s,
          content: {
            ...s.content,
            drawingData: undefined, // remove heavy freehand vector paths
            stickers: s.content.stickers?.slice(0, 2) || [], // truncate stickers for overview
          },
        }));
      }

      res.setHeader('Cache-Control', 'public, max-age=5, stale-while-revalidate=15');
      return res.json({
        spots,
        stats: db.getStats(),
        bbox: { minX, minY, maxX, maxY },
        count: spots.length,
      });
    }

    // Default backward-compatible fallback: returns full spots and stats exactly as before
    const spots = db.getSpots(viewer);
    const stats = db.getStats();
    res.json({ spots, stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dedicated GET /spots/viewport for explicit spatial chunk loading
apiRouter.get('/spots/viewport', (req: Request, res: Response) => {
  try {
    const minX = parseFloat((req.query.minX as string) || '-1000');
    const minY = parseFloat((req.query.minY as string) || '-1000');
    const maxX = parseFloat((req.query.maxX as string) || '1000');
    const maxY = parseFloat((req.query.maxY as string) || '1000');
    const zoom = req.query.zoom ? parseFloat(req.query.zoom as string) : 1;
    const limit = req.query.limit ? Math.min(2000, parseInt(req.query.limit as string, 10)) : 1000;
    const viewer = getViewerIdentifier(req);

    let spots = db.queryViewport(minX, minY, maxX, maxY, limit, viewer);

    // Level of Detail (LOD) filtering
    if (zoom < 0.4) {
      spots = spots.map(s => ({
        ...s,
        content: {
          ...s.content,
          drawingData: undefined,
          stickers: s.content.stickers?.slice(0, 2) || [],
        },
      }));
    }

    res.setHeader('Cache-Control', 'public, max-age=5, stale-while-revalidate=15');
    res.json({
      spots,
      stats: db.getStats(),
      bbox: { minX, minY, maxX, maxY },
      count: spots.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== IMAGE ASSET OPTIMIZATION & THUMBNAILS ===================
apiRouter.get('/images/thumbnail', (req: Request, res: Response) => {
  try {
    const rawUrl = req.query.url as string;
    const targetWidth = parseInt((req.query.w as string) || '800', 10);
    const quality = parseInt((req.query.q as string) || '85', 10);

    if (!rawUrl) {
      return res.status(400).json({ error: 'Missing image url' });
    }

    // For Unsplash images, dynamically rewrite dimension queries to serve lightweight thumbnails
    if (rawUrl.includes('images.unsplash.com')) {
      const urlObj = new URL(rawUrl);
      urlObj.searchParams.set('w', targetWidth.toString());
      urlObj.searchParams.set('q', quality.toString());
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      return res.redirect(302, urlObj.toString());
    }

    // Pass-through with caching for external/uploaded assets (preserves originals 100%)
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.redirect(302, rawUrl);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== EXPLORE FILTERS ===================

apiRouter.get('/spots/explore', (req: Request, res: Response) => {
  try {
    const sort = (req.query.sort as string) || 'newest';
    const tier = (req.query.tier as string) || 'all';
    const category = (req.query.category as string) || 'all';
    const time = (req.query.time as string) || 'all';
    const limit = Math.min(100, parseInt((req.query.limit as string) || '24', 10));
    const offset = parseInt((req.query.offset as string) || '0', 10);

    let spots = db.getSpots().filter(s => s.status === 'published' && s.moderationStatus === 'approved');

    // Tier filter
    if (tier === 'mini_pop' || tier === 'mini') {
      spots = spots.filter(s => s.tier === 'mini_pop');
    } else if (tier === 'big_pop' || tier === 'big') {
      spots = spots.filter(s => s.tier === 'big_pop');
    }

    // Category filter
    if (category === 'photo' || category === 'photography') {
      spots = spots.filter(s => !!s.content?.imageUrl);
    } else if (category === 'art' || category === 'artwork' || category === 'drawings') {
      spots = spots.filter(s => !!s.content?.drawingData || (s.content?.stickers && s.content.stickers.length > 1) || s.shape === 'graffiti' || s.shape === 'poster');
    } else if (category === 'notes') {
      spots = spots.filter(s => s.shape === 'sticky' || (!s.content?.imageUrl && !s.content?.drawingData));
    } else if (category === 'quotes') {
      spots = spots.filter(s => !!s.content?.author || (s.content?.text && (s.content.text.includes('"') || s.content.text.length > 20)));
    } else if (category === 'memories') {
      spots = spots.filter(s => (s.content?.headline?.toLowerCase().includes('memory') || s.content?.text?.toLowerCase().includes('memory') || s.shape === 'polaroid'));
    }

    // Time filter
    if (time !== 'all') {
      const now = Date.now();
      let threshold = 0;
      if (time === 'today') threshold = now - 24 * 60 * 60 * 1000;
      else if (time === 'week') threshold = now - 7 * 24 * 60 * 60 * 1000;
      else if (time === 'month') threshold = now - 30 * 24 * 60 * 60 * 1000;

      if (threshold > 0) {
        spots = spots.filter(s => new Date(s.createdAt).getTime() >= threshold);
      }
    }

    // Sorting
    if (sort === 'views') {
      spots.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    } else if (sort === 'shares') {
      spots.sort((a, b) => (b.sharesCount || 0) - (a.sharesCount || 0));
    } else if (sort === 'trending') {
      spots.sort((a, b) => ((b.viewsCount || 0) + (b.sharesCount || 0) * 3) - ((a.viewsCount || 0) + (a.sharesCount || 0) * 3));
    } else {
      // Newest
      spots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = spots.length;
    const paginated = spots.slice(offset, offset + limit);

    res.json({
      spots: paginated,
      total,
      hasMore: offset + limit < total,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single spot by ID or Slug
apiRouter.get('/spots/:idOrSlug', (req: Request, res: Response) => {
  try {
    const rawSpot = db.getSpotByIdOrSlug(req.params.idOrSlug);
    if (!rawSpot) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    const viewer = getViewerIdentifier(req);
    const rawViewer = viewer?.toLowerCase();
    const isOwner = Boolean(
      rawViewer &&
      (rawSpot.ownerId?.toLowerCase() === rawViewer ||
        rawSpot.creatorName.toLowerCase() === rawViewer)
    );

    // Private spot: only owner or creator can view
    if (rawSpot.visibility === 'private' && !isOwner) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    // Friends-only or Private creator: calculate lock state
    const creatorUser = rawSpot.ownerId ? db.getUserById(rawSpot.ownerId) : db.getUserByUsername(rawSpot.creatorName);
    const isPrivateCreator = creatorUser?.isPrivate ?? false;

    let isLocked = false;
    if (rawSpot.visibility === 'friends_only' || isPrivateCreator) {
      if (!isOwner) {
        const isFollowing = rawViewer
          ? (db.isUserFollowing(rawViewer, rawSpot.creatorName) || (rawSpot.ownerId ? db.isUserFollowing(rawViewer, rawSpot.ownerId) : false))
          : false;
        isLocked = !isFollowing;
      }
    }

    db.incrementSpotViews(rawSpot.id);

    const spot = {
      ...rawSpot,
      isLocked,
      content: isLocked
        ? {
          ...rawSpot.content,
          audio: undefined,
        }
        : rawSpot.content,
    };

    res.json({ spot });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST claim preview coordinates (non-blocking coordinate reservation preview)
apiRouter.post('/spots/claim-preview', (req: Request, res: Response) => {
  try {
    const { tier } = req.body as { tier: ProductTier };
    const product = PRODUCTS[tier] || PRODUCTS.mini_pop;
    const allocation = db.allocateCoordinate(product.width, product.height);
    res.json({ allocation, product });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST record view event
apiRouter.post('/spots/:id/view', (req: Request, res: Response) => {
  try {
    const updated = db.incrementSpotViews(req.params.id);
    if (updated) {
      // Return updated count without broadcasting full SSE event to avoid client re-render storms
      res.json({ success: true, viewsCount: updated.viewsCount });
    } else {
      res.status(404).json({ error: 'Spot not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST record share event
apiRouter.post('/spots/:id/share', (req: Request, res: Response) => {
  try {
    db.incrementSpotShares(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST record like event
apiRouter.post('/spots/:id/like', (req: Request, res: Response) => {
  try {
    const { action } = req.body || {};
    const increment = action !== 'unlike';
    const updatedSpot = db.toggleSpotLike(req.params.id, increment);
    if (updatedSpot) {
      broadcastSpotEvent('spot_updated', { spot: updatedSpot });
      res.json({ success: true, likesCount: updatedSpot.likesCount || 0, spot: updatedSpot });
    } else {
      res.status(404).json({ error: 'Spot not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== CONNECTED POPS & MEMORY THREADS ===================

// GET connected pops for a spot
apiRouter.get('/spots/:id/connected', (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    const viewerKey = user?.username || (req.query.viewer as string) || undefined;
    const connectedSpots = db.getConnectedSpots(req.params.id, viewerKey);
    res.json({ success: true, connectedSpots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET connectable pops for the user
apiRouter.get('/spots/connectable', (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    const userKey = user?.username || user?.id || (req.query.viewer as string) || undefined;
    if (!userKey) {
      return res.status(401).json({ error: 'Sign in or username required to view connectable Pops' });
    }
    const currentSpotId = (req.query.currentSpotId as string) || undefined;
    const spots = db.getConnectableSpots(userKey, currentSpotId);
    res.json({ success: true, spots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST connect two pops together
apiRouter.post('/spots/:id/connect', (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    const userKey = user ? (user.username || user.id) : (req.body.userKey || undefined);
    const { targetSpotId } = req.body;
    if (!targetSpotId) {
      return res.status(400).json({ error: 'Target Pop ID is required' });
    }

    const result = db.connectSpots(req.params.id, targetSpotId, userKey);
    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }

    if (result.spotA) broadcastSpotEvent('spot_updated', { spot: result.spotA });
    if (result.spotB) broadcastSpotEvent('spot_updated', { spot: result.spotB });

    const connectedSpots = db.getConnectedSpots(req.params.id, userKey);
    res.json({ success: true, spot: result.spotA, connectedSpots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST disconnect two pops
apiRouter.post('/spots/:id/disconnect', (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    const userKey = user ? (user.username || user.id) : (req.body.userKey || undefined);
    const { targetSpotId } = req.body;
    if (!targetSpotId) {
      return res.status(400).json({ error: 'Target Pop ID is required' });
    }

    const result = db.disconnectSpots(req.params.id, targetSpotId, userKey);
    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }

    if (result.spotA) broadcastSpotEvent('spot_updated', { spot: result.spotA });
    if (result.spotB) broadcastSpotEvent('spot_updated', { spot: result.spotB });

    const connectedSpots = db.getConnectedSpots(req.params.id, userKey);
    res.json({ success: true, spot: result.spotA, connectedSpots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET comments for a spot
apiRouter.get('/spots/:id/comments', (req: Request, res: Response) => {
  try {
    const comments = db.getCommentsBySpotId(req.params.id);
    res.json({ comments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST add comment or reply
apiRouter.post('/spots/:id/comments', (req: Request, res: Response) => {
  try {
    const { authorName, text, replyToId, authorAvatar } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty' });
    }

    const spot = db.getSpotById(req.params.id);
    if (!spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    if (spot.allowComments === false) {
      return res.status(403).json({ error: 'Comments are turned off for this Pop' });
    }

    const comment = db.addComment(req.params.id, {
      authorName: authorName || 'Spotter',
      text,
      replyToId,
      authorAvatar,
    });

    const updatedSpot = db.getSpotById(req.params.id);
    if (updatedSpot) {
      broadcastSpotEvent('spot_updated', { spot: updatedSpot });
    }

    res.json({ success: true, comment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST like a comment
apiRouter.post('/comments/:id/like', (req: Request, res: Response) => {
  try {
    const updated = db.likeComment(req.params.id);
    if (updated) {
      res.json({ success: true, likesCount: updated.likesCount });
    } else {
      res.status(404).json({ error: 'Comment not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST react with emoji to a spot
apiRouter.post('/spots/:id/react', (req: Request, res: Response) => {
  try {
    const { emoji } = req.body || {};
    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'Valid emoji required' });
    }
    const result = db.addReaction(req.params.id, emoji.trim());
    if (result) {
      broadcastSpotEvent('spot_updated', { spot: result.spot });
      res.json({ success: true, reactions: result.reactions });
    } else {
      res.status(404).json({ error: 'Spot not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== SEARCH & DISCOVERY ===================

// Universal auto-suggestions for @mentions, #hashtags, locations, and spots
apiRouter.get('/suggestions', (req: Request, res: Response) => {
  try {
    const rawQ = ((req.query.q as string) || '').trim();
    const type = ((req.query.type as string) || 'all').toLowerCase();
    const limit = Math.min(25, Math.max(1, parseInt((req.query.limit as string) || '8', 10)));

    const result = db.getSuggestions(rawQ, type, limit);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/search', (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').toLowerCase().trim();
    const filter = (req.query.filter as string) || 'all';
    const limit = Math.min(100, parseInt((req.query.limit as string) || '30', 10));

    const allSpots = db.getSpots().filter(s => s.status === 'published' && s.moderationStatus === 'approved');
    const allUsers = db.getUsers();

    let matchingSpots = allSpots;

    if (q) {
      const cleanQ = q.startsWith('#') ? q.slice(1) : q;
      matchingSpots = matchingSpots.filter(s => {
        const title = (s.title || s.content?.title || '').toLowerCase();
        const description = (s.description || s.content?.description || '').toLowerCase();
        const location = (s.location || s.content?.location || '').toLowerCase();
        const headline = (s.content?.headline || '').toLowerCase();
        const text = (s.content?.text || '').toLowerCase();
        const creator = (s.creatorName || '').toLowerCase();
        const id = s.id.toLowerCase();
        const slug = (s.slug || '').toLowerCase();
        const tags = [
          ...(s.tags || []),
          ...(s.content?.tags || []),
        ].map(t => t.toLowerCase()).join(' ');
        const badge = (s.content?.badge || '').toLowerCase();

        return (
          id.includes(q) ||
          creator.includes(q) ||
          slug.includes(q) ||
          title.includes(q) ||
          (cleanQ && title.includes(cleanQ)) ||
          description.includes(q) ||
          (cleanQ && description.includes(cleanQ)) ||
          location.includes(q) ||
          (cleanQ && location.includes(cleanQ)) ||
          headline.includes(q) ||
          (cleanQ && headline.includes(cleanQ)) ||
          text.includes(q) ||
          tags.includes(q) ||
          (cleanQ && tags.includes(cleanQ)) ||
          badge.includes(q)
        );
      });
    }

    if (filter === 'mini') {
      matchingSpots = matchingSpots.filter(s => s.tier === 'mini_pop');
    } else if (filter === 'big') {
      matchingSpots = matchingSpots.filter(s => s.tier === 'big_pop');
    } else if (filter === 'photo') {
      matchingSpots = matchingSpots.filter(s => !!s.content?.imageUrl);
    } else if (filter === 'notes') {
      matchingSpots = matchingSpots.filter(s => s.tier === 'mini_pop' && !s.content?.imageUrl);
    } else if (filter === 'trending') {
      matchingSpots = matchingSpots.sort((a, b) => (b.viewsCount + b.sharesCount * 2) - (a.viewsCount + a.sharesCount * 2));
    } else if (filter === 'featured') {
      matchingSpots = matchingSpots.filter(s => s.content?.badge || s.tier === 'big_pop');
    } else {
      matchingSpots = matchingSpots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Matching creators
    let matchingCreators: Array<{
      username: string;
      displayName: string;
      avatarUrl?: string;
      bio?: string;
      spotCount: number;
      totalViews: number;
    }> = [];

    if (q) {
      const creatorMap = new Map<string, { username: string; displayName: string; avatarUrl?: string; bio?: string; spotCount: number; totalViews: number }>();

      // Check registered users
      for (const u of allUsers) {
        if (u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)) {
          const userSpots = allSpots.filter(s => s.ownerId === u.id || s.creatorName.toLowerCase() === u.displayName.toLowerCase() || s.creatorName.toLowerCase() === u.username.toLowerCase());
          creatorMap.set(u.username.toLowerCase(), {
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            bio: u.bio,
            spotCount: userSpots.length,
            totalViews: userSpots.reduce((acc, s) => acc + (s.viewsCount || 0), 0),
          });
        }
      }

      // Also check creators from spots
      for (const s of allSpots) {
        const cName = s.creatorName;
        if (cName && cName.toLowerCase().includes(q)) {
          const uname = cName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          if (!creatorMap.has(uname)) {
            const sameCreatorSpots = allSpots.filter(sp => sp.creatorName.toLowerCase() === cName.toLowerCase());
            creatorMap.set(uname, {
              username: uname,
              displayName: cName,
              avatarUrl: s.content?.imageUrl || undefined,
              spotCount: sameCreatorSpots.length,
              totalViews: sameCreatorSpots.reduce((acc, sp) => acc + (sp.viewsCount || 0), 0),
            });
          }
        }
      }

      matchingCreators = Array.from(creatorMap.values()).slice(0, 8);
    }

    res.json({
      results: matchingSpots.slice(0, limit),
      spots: matchingSpots.slice(0, limit),
      creators: matchingCreators,
      total: matchingSpots.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== CREATOR PROFILES ===================

apiRouter.get('/creators/:username', (req: Request, res: Response) => {
  try {
    const rawUsername = (req.params.username || '').trim().replace(/^@/, '');
    if (!rawUsername) {
      return res.status(400).json({ error: 'Username required' });
    }

    const allUsers = db.getUsers();
    const allSpots = db.getSpots().filter(s => s.status === 'published' && s.moderationStatus === 'approved');

    // Find matched user
    const user = allUsers.find(
      u => u.username.toLowerCase() === rawUsername.toLowerCase() ||
        u.displayName.toLowerCase() === rawUsername.toLowerCase()
    );

    // Find all spots belonging to this creator
    const creatorSpots = allSpots.filter(s => {
      if (user && s.ownerId === user.id) return true;
      if (s.creatorName.toLowerCase() === rawUsername.toLowerCase()) return true;
      if (user && s.creatorName.toLowerCase() === user.displayName.toLowerCase()) return true;
      return false;
    });

    if (!user && creatorSpots.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const displayName = user?.displayName || (creatorSpots[0]?.creatorName) || rawUsername;
    const username = user?.username || rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const avatarUrl = user?.avatarUrl || creatorSpots.find(s => s.content?.imageUrl)?.content?.imageUrl;
    const bio = user?.bio || `Creator on SpotPop. Claimed ${creatorSpots.length} spot${creatorSpots.length === 1 ? '' : 's'} on the permanent canvas.`;
    const websiteUrl = user?.websiteUrl;
    const category = user?.category || 'Creator';
    const isPrivate = user?.isPrivate ?? false;
    const createdAt = user?.createdAt || creatorSpots[creatorSpots.length - 1]?.createdAt || new Date().toISOString();

    const totalViews = creatorSpots.reduce((sum, s) => sum + (s.viewsCount || 0), 0);
    const totalShares = creatorSpots.reduce((sum, s) => sum + (s.sharesCount || 0), 0);
    const followCounts = db.getFollowCounts(username);
    const viewer = getViewerIdentifier(req);
    const rawViewer = (viewer || '').trim().toLowerCase();
    const isOwner = Boolean(
      rawViewer &&
      (user?.id?.toLowerCase() === rawViewer ||
        username.toLowerCase() === rawViewer ||
        displayName.toLowerCase() === rawViewer)
    );
    const followStatus = viewer ? db.getFollowStatus(viewer, username) : 'not_following';
    const isFollowing = followStatus === 'accepted';
    const isRequested = followStatus === 'pending';
    const isLockedAccount = isPrivate && !isOwner && !isFollowing;

    const spots = isLockedAccount
      ? creatorSpots.map(s => ({
        ...s,
        isLocked: true,
        content: {
          ...s.content,
          audio: undefined,
        },
      }))
      : creatorSpots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      user: {
        id: user?.id || `usr_${username}`,
        username,
        displayName,
        avatarUrl,
        bio,
        websiteUrl,
        category,
        isPrivate,
        createdAt,
        role: user?.role || 'user',
        followersCount: followCounts.followersCount,
        followingCount: followCounts.followingCount,
      },
      stats: {
        totalSpots: creatorSpots.length,
        totalViews,
        totalShares,
        followersCount: followCounts.followersCount,
        followingCount: followCounts.followingCount,
      },
      followStatus,
      isFollowing,
      isRequested,
      isLockedAccount,
      spots,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET check Instagram username availability
apiRouter.get('/users/check-username', (req: Request, res: Response) => {
  try {
    const rawUsername = (req.query.username as string || '').trim();
    const validation = validateInstagramUsername(rawUsername);
    if (!validation.isValid) {
      return res.json({ available: false, error: validation.error, cleanUsername: validation.cleanUsername });
    }

    const authUser = getAuthenticatedUser(req);
    const existing = db.getUserByUsername(validation.cleanUsername);

    if (existing) {
      if (authUser && existing.id === authUser.id) {
        return res.json({ available: true, isCurrent: true, cleanUsername: validation.cleanUsername });
      }
      return res.json({
        available: false,
        error: `The username '@${validation.cleanUsername}' isn't available. Please choose another.`,
        cleanUsername: validation.cleanUsername,
      });
    }

    return res.json({ available: true, cleanUsername: validation.cleanUsername });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/creators/me', (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { username, displayName, bio, avatarUrl, websiteUrl, category, isPrivate } = req.body;
    const updates: Partial<User> = {};

    // Instagram username validation and uniqueness check
    if (username && typeof username === 'string') {
      const validation = validateInstagramUsername(username);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      const existing = db.getUserByUsername(validation.cleanUsername);
      if (existing && existing.id !== user.id) {
        return res.status(400).json({
          error: `The username '@${validation.cleanUsername}' isn't available. Please choose another.`,
        });
      }
      updates.username = validation.cleanUsername;
    }

    if (displayName && typeof displayName === 'string') updates.displayName = displayName.trim().slice(0, 40);
    if (bio !== undefined && typeof bio === 'string') updates.bio = bio.trim().slice(0, 280);
    if (avatarUrl && typeof avatarUrl === 'string') updates.avatarUrl = avatarUrl.trim();
    if (websiteUrl !== undefined && typeof websiteUrl === 'string') updates.websiteUrl = websiteUrl.trim().slice(0, 150);
    if (category !== undefined && typeof category === 'string') updates.category = category.trim().slice(0, 50);
    if (isPrivate !== undefined && typeof isPrivate === 'boolean') updates.isPrivate = isPrivate;

    const updated = db.updateUser(user.id, updates);
    res.json({ user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== FOLLOWERS & SOCIAL GRAPH ===================

// POST toggle follow/unfollow user (or cancel request)
apiRouter.post('/users/:username/follow', (req: Request, res: Response) => {
  try {
    const targetUsername = (req.params.username || '').trim().replace(/^@/, '');
    if (!targetUsername) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const authUser = getAuthenticatedUser(req);
    const viewerId =
      authUser?.id ||
      authUser?.username ||
      (req.headers['x-viewer-id'] as string) ||
      (req.body.viewerId as string) ||
      'v_guest_visitor';

    const result = db.followUser(viewerId, targetUsername);

    // Broadcast SSE event
    broadcastSpotEvent('user_follow_updated', {
      targetUsername: (result as any).targetUsername || targetUsername,
      followerId: viewerId,
      followerUsername: (result as any).followerUsername || authUser?.username || viewerId,
      followerDisplayName: (result as any).followerDisplayName || authUser?.displayName || viewerId,
      followerAvatar: (result as any).followerAvatar || authUser?.avatarUrl,
      followStatus: result.followStatus,
      isFollowing: result.isFollowing,
      isRequested: result.isRequested,
      followersCount: result.followersCount,
      followingCount: result.followingCount,
    });

    res.json({
      success: true,
      followStatus: result.followStatus,
      isFollowing: result.isFollowing,
      isRequested: result.isRequested,
      followersCount: result.followersCount,
      followingCount: result.followingCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST / DELETE explicit unfollow user (idempotent unfollow)
const handleUnfollow = (req: Request, res: Response) => {
  try {
    const targetUsername = (req.params.username || '').trim().replace(/^@/, '');
    if (!targetUsername) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const authUser = getAuthenticatedUser(req);
    const viewerId =
      authUser?.id ||
      authUser?.username ||
      (req.headers['x-viewer-id'] as string) ||
      (req.body.viewerId as string) ||
      'v_guest_visitor';

    const result = db.unfollowUser(viewerId, targetUsername);

    // Broadcast SSE update
    broadcastSpotEvent('user_follow_updated', {
      targetUsername,
      followerId: viewerId,
      followStatus: 'not_following',
      isFollowing: false,
      isRequested: false,
      followersCount: result.followersCount,
      followingCount: result.followingCount,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

apiRouter.post('/users/:username/unfollow', handleUnfollow);
apiRouter.delete('/users/:username/follow', handleUnfollow);

// GET pending follow requests for a user
apiRouter.get('/users/:username/follow-requests', (req: Request, res: Response) => {
  try {
    const targetUsername = (req.params.username || '').trim().replace(/^@/, '');
    if (!targetUsername) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const requests = db.getFollowRequests(targetUsername);
    res.json({ requests, count: requests.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST accept follow request
apiRouter.post('/users/follow-requests/:requestId/accept', (req: Request, res: Response) => {
  try {
    const requestId = req.params.requestId;
    const authUser = getAuthenticatedUser(req);
    const targetUsername =
      authUser?.username ||
      authUser?.id ||
      (req.body.targetUsername as string) ||
      (req.headers['x-viewer-id'] as string);

    if (!targetUsername) {
      return res.status(400).json({ error: 'Target user identity is required' });
    }

    const result = db.acceptFollowRequest(requestId, targetUsername);
    if (!result) {
      return res.status(404).json({ error: 'Follow request not found or already processed' });
    }

    broadcastSpotEvent('user_follow_updated', {
      targetUsername: (result as any).targetUsername || targetUsername,
      followerId: result.followerId,
      followerUsername: (result as any).followerUsername || result.followerName,
      followerDisplayName: result.followerName,
      followStatus: 'accepted',
      isFollowing: true,
      isRequested: false,
      followersCount: result.followersCount,
      followingCount: result.followingCount,
    });

    res.json({
      success: true,
      followerName: result.followerName,
      followersCount: result.followersCount,
      followingCount: result.followingCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST decline follow request
apiRouter.post('/users/follow-requests/:requestId/decline', (req: Request, res: Response) => {
  try {
    const requestId = req.params.requestId;
    const authUser = getAuthenticatedUser(req);
    const targetUsername =
      authUser?.username ||
      authUser?.id ||
      (req.body.targetUsername as string) ||
      (req.headers['x-viewer-id'] as string);

    if (!targetUsername) {
      return res.status(400).json({ error: 'Target user identity is required' });
    }

    const success = db.declineFollowRequest(requestId, targetUsername);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE remove a follower
apiRouter.delete('/users/:username/followers/:followerId', (req: Request, res: Response) => {
  try {
    const targetUsername = (req.params.username || '').trim().replace(/^@/, '');
    const followerId = req.params.followerId;

    const success = db.removeFollower(followerId, targetUsername);
    const counts = db.getFollowCounts(targetUsername);

    broadcastSpotEvent('user_follow_updated', {
      targetUsername,
      followerId,
      followStatus: 'not_following',
      isFollowing: false,
      isRequested: false,
      followersCount: counts.followersCount,
      followingCount: counts.followingCount,
    });

    res.json({ success, followersCount: counts.followersCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update account privacy
apiRouter.put('/users/:username/privacy', (req: Request, res: Response) => {
  try {
    const targetUsername = (req.params.username || '').trim().replace(/^@/, '');
    const { isPrivate } = req.body;

    db.setAccountPrivacy(targetUsername, Boolean(isPrivate));
    res.json({ success: true, isPrivate: Boolean(isPrivate) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET user followers and following network
apiRouter.get('/users/:username/network', (req: Request, res: Response) => {
  try {
    const targetUsername = (req.params.username || '').trim().replace(/^@/, '');
    if (!targetUsername) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const authUser = getAuthenticatedUser(req);
    const viewerId =
      authUser?.id ||
      authUser?.username ||
      (req.headers['x-viewer-id'] as string) ||
      (req.query.viewerId as string);

    const followers = db.getUserFollowers(targetUsername);
    const following = db.getUserFollowing(targetUsername);
    const counts = db.getFollowCounts(targetUsername);
    const followStatus = viewerId ? db.getFollowStatus(viewerId, targetUsername) : 'not_following';
    const isFollowing = followStatus === 'accepted';
    const isRequested = followStatus === 'pending';
    const followRequests = db.getFollowRequests(targetUsername);

    res.json({
      followers,
      following,
      followersCount: counts.followersCount,
      followingCount: counts.followingCount,
      followStatus,
      isFollowing,
      isRequested,
      pendingRequestsCount: followRequests.length,
      followRequests,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== ACTIVITY & STATS ===================

apiRouter.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = db.getStats();
    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/activity', (req: Request, res: Response) => {
  try {
    const activity = db.getActivity();
    res.json({ activity });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== AUTHENTICATION ===================

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { email, username, displayName, password } = req.body;
    if (!email || !username || !displayName) {
      return res.status(400).json({ error: 'Display name, username, and email are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const validation = validateInstagramUsername(username);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }
    const cleanUsername = validation.cleanUsername;

    const existingEmail = db.getUserByEmail(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const existingUsername = db.getUserByUsername(cleanUsername);
    if (existingUsername) {
      return res.status(400).json({ error: `The username '@${cleanUsername}' isn't available. Please choose another.` });
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      username: cleanUsername,
      displayName: displayName.trim(),
      role: 'user',
      passwordHash: password ? hashPassword(password) : undefined,
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    };

    // Attach any spots created with this name or username
    const allSpots = db.getSpots();
    for (const s of allSpots) {
      if (
        s.creatorName.toLowerCase() === newUser.displayName.toLowerCase() ||
        s.creatorName.toLowerCase() === newUser.username.toLowerCase()
      ) {
        if (!newUser.ownedSpotIds.includes(s.id)) {
          newUser.ownedSpotIds.push(s.id);
        }
      }
    }

    db.addUser(newUser);

    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    SESSIONS.set(token, newUser.id);

    res.json({ user: newUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email or username is required' });
    }

    const query = email.trim().toLowerCase();
    let user = db.getUserByEmail(query);
    if (!user) {
      user = db.getUserByUsername(query);
    }

    if (!user) {
      // Auto-provision user for seamless onboarding if valid email
      const isEmail = query.includes('@');
      const cleanUsername = (isEmail ? query.split('@')[0] : query).replace(/[^a-z0-9_]/g, '');
      const userEmail = isEmail ? query : `${cleanUsername}@spotpop.in`;

      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: userEmail,
        username: cleanUsername || `user${Math.floor(Math.random() * 9000 + 1000)}`,
        displayName: cleanUsername ? (cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1)) : 'Spot Creator',
        role: 'user',
        passwordHash: password ? hashPassword(password) : undefined,
        createdAt: new Date().toISOString(),
        ownedSpotIds: [],
      };
      db.addUser(user);
    } else {
      // Validate credentials if user has a passwordHash
      if (user.passwordHash) {
        if (!password || !verifyPassword(password, user.passwordHash)) {
          return res.status(401).json({ error: 'Incorrect password. Please check your credentials.' });
        }
      } else if (password) {
        // Safe first-time adoption: set password for legacy seed accounts
        user.passwordHash = hashPassword(password);
      }
    }

    // Associate spots with creator name matching this user
    const allSpots = db.getSpots();
    for (const s of allSpots) {
      if (
        s.ownerId === user.id ||
        s.creatorName.toLowerCase() === user.displayName.toLowerCase() ||
        s.creatorName.toLowerCase() === user.username.toLowerCase()
      ) {
        if (!user.ownedSpotIds.includes(s.id)) {
          user.ownedSpotIds.push(s.id);
        }
      }
    }
    db.save();

    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    SESSIONS.set(token, user.id);

    res.json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user });
});

// GET all spots owned by current authenticated user
apiRouter.get('/user/my-spots', (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const allSpots = db.getSpots();
    const mySpots = allSpots.filter(s =>
      s.ownerId === user.id ||
      user.ownedSpotIds?.includes(s.id) ||
      s.creatorName.toLowerCase() === user.displayName.toLowerCase() ||
      s.creatorName.toLowerCase() === user.username.toLowerCase()
    );
    res.json({ spots: mySpots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE user's own spot
apiRouter.put('/spots/:id', (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'You must be logged in to update your Pop' });
    }

    const spot = db.getSpotByIdOrSlug(req.params.id);
    if (!spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    const isOwner =
      user.role === 'admin' ||
      spot.ownerId === user.id ||
      user.ownedSpotIds?.includes(spot.id);

    if (!isOwner) {
      return res.status(403).json({ error: 'You do not have permission to edit this Pop' });
    }

    const { content, background, borderColor, shape, creatorName, allowComments, visibility, title, description, location, tags, taggedUsers, connectedSpotIds } = req.body;
    const updates: Partial<Spot> = {};

    if (background) updates.background = background;
    if (borderColor !== undefined) updates.borderColor = borderColor;
    if (shape) updates.shape = shape;
    if (creatorName) updates.creatorName = creatorName.trim();
    if (allowComments !== undefined) updates.allowComments = allowComments;
    if (visibility !== undefined) updates.visibility = visibility;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (tags !== undefined) updates.tags = tags;
    if (taggedUsers !== undefined) updates.taggedUsers = taggedUsers;
    if (connectedSpotIds !== undefined) updates.connectedSpotIds = connectedSpotIds;
    if (content) {
      updates.content = {
        ...spot.content,
        ...content,
      };
      if (content.title !== undefined) updates.title = content.title;
      if (content.description !== undefined) updates.description = content.description;
      if (content.location !== undefined) updates.location = content.location;
      if (content.tags !== undefined) updates.tags = content.tags;
      if (content.taggedUsers !== undefined) updates.taggedUsers = content.taggedUsers;
      if (content.connectedSpotIds !== undefined) updates.connectedSpotIds = content.connectedSpotIds;
    }

    const updated = db.updateSpot(spot.id, updates);
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update Pop' });
    }

    broadcastSpotEvent('spot_updated', { spot: updated });

    res.json({ success: true, spot: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user's own spot
apiRouter.delete('/spots/:id', (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'You must be logged in to delete your Pop' });
    }

    const spot = db.getSpotByIdOrSlug(req.params.id);
    if (!spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    const isOwner =
      user.role === 'admin' ||
      spot.ownerId === user.id ||
      user.ownedSpotIds?.includes(spot.id);

    if (!isOwner) {
      return res.status(403).json({ error: 'You do not have permission to delete this Pop' });
    }

    const deleted = db.deleteSpot(spot.id);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete Pop from canvas' });
    }

    if (user.ownedSpotIds) {
      user.ownedSpotIds = user.ownedSpotIds.filter(id => id !== spot.id);
      db.save();
    }

    broadcastSpotEvent('spot_deleted', { id: spot.id, stats: db.getStats() });

    res.json({ success: true, spotId: spot.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== PAYMENTS & ORDERS ===================

// Create a pending order for Razorpay - strictly enforces login
apiRouter.post('/orders/create', (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'You must be logged in to claim a spot. Please sign in or create an account.' });
    }

    const { productId, spotDraft, creatorName } = req.body;
    if (!productId || !PRODUCTS[productId as ProductTier]) {
      return res.status(400).json({ error: 'Invalid product selection' });
    }

    const tier = productId as ProductTier;
    const product = PRODUCTS[tier];
    const userId = user.id;

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const rzpOrder = createRazorpayOrder(orderId, tier);

    const order: Order = {
      id: orderId,
      userId,
      productId: tier,
      amountINR: product.priceINR,
      currency: 'INR',
      status: 'pending',
      razorpayOrderId: rzpOrder.razorpayOrderId,
      spotDraft: {
        ...spotDraft,
        creatorName: creatorName || spotDraft.creatorName || 'Anonymous Pop',
      },
      createdAt: new Date().toISOString(),
    };

    db.addOrder(order);

    res.json({
      order,
      razorpayConfig: {
        keyId: rzpOrder.keyId,
        orderId: order.id,
        razorpayOrderId: rzpOrder.razorpayOrderId,
        amountINR: rzpOrder.amountINR,
        amountPaise: rzpOrder.amountPaise,
        currency: rzpOrder.currency,
        name: rzpOrder.name,
        description: rzpOrder.description,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Verify payment and place the Spot onto the canvas
apiRouter.post('/orders/verify', (req: Request, res: Response) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!orderId || !razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({ error: 'Missing payment verification parameters' });
    }

    const order = db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'paid') {
      // Idempotency: order was already processed
      const existingSpot = order.allocatedSpotId ? db.getSpotByIdOrSlug(order.allocatedSpotId) : null;
      return res.json({ success: true, spot: existingSpot, order });
    }

    // Verify cryptographic signature
    const isValid = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || 'simulated_test_pass',
    });

    if (!isValid) {
      db.updateOrder(orderId, { status: 'failed' });
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    // Calculate non-overlapping coordinates on canvas using concurrency reservation lock
    const product = PRODUCTS[order.productId];
    const { x, y, rotation, reservationId } = db.allocateCoordinate(product.width, product.height, true);

    const draft = order.spotDraft || {};
    const slugBase = (draft.creatorName || 'spot')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 20);
    const slug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;

    const newSpot: Spot = {
      id: `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ownerId: order.userId,
      creatorName: draft.creatorName || 'Pop Creator',
      slug,
      tier: order.productId,
      title: draft.title || draft.content?.title || draft.content?.headline || undefined,
      description: draft.description || draft.content?.description || undefined,
      location: draft.location || draft.content?.location || undefined,
      tags: draft.tags || draft.content?.tags || [],
      taggedUsers: draft.taggedUsers || draft.content?.taggedUsers || [],
      connectedSpotIds: draft.connectedSpotIds || draft.content?.connectedSpotIds || [],
      x,
      y,
      width: product.width,
      height: product.height,
      rotation,
      shape: draft.shape || (order.productId === 'big_pop' ? 'polaroid' : 'sticky'),
      background: draft.background || '#FFF8E7',
      borderColor: draft.borderColor,
      content: {
        ...(draft.content || {}),
        title: draft.title || draft.content?.title || draft.content?.headline || undefined,
        description: draft.description || draft.content?.description || undefined,
        location: draft.location || draft.content?.location || undefined,
        tags: draft.tags || draft.content?.tags || [],
        taggedUsers: draft.taggedUsers || draft.content?.taggedUsers || [],
        connectedSpotIds: draft.connectedSpotIds || draft.content?.connectedSpotIds || [],
        headline: draft.content?.headline !== undefined ? draft.content.headline : '',
        headlineX: draft.content?.headlineX,
        headlineY: draft.content?.headlineY,
        text: draft.content?.text !== undefined ? draft.content.text : '',
        subtextX: draft.content?.subtextX,
        subtextY: draft.content?.subtextY,
        subtextSize: draft.content?.subtextSize,
        subtextFontFamily: draft.content?.subtextFontFamily,
        subtextColor: draft.content?.subtextColor,
        subtextOpacity: draft.content?.subtextOpacity,
        subtextStroke: draft.content?.subtextStroke,
        subtextGlow: draft.content?.subtextGlow,
        subtext3D: draft.content?.subtext3D,
        subtextGradient: draft.content?.subtextGradient,
        subtextLetterSpacing: draft.content?.subtextLetterSpacing,
        author: draft.content?.author !== undefined ? draft.content.author : (draft.creatorName || ''),
        authorX: draft.content?.authorX,
        authorY: draft.content?.authorY,
        authorSize: draft.content?.authorSize,
        authorOpacity: draft.content?.authorOpacity,
        authorFontFamily: draft.content?.authorFontFamily,
        authorColor: draft.content?.authorColor,
        authorStroke: draft.content?.authorStroke,
        authorGlow: draft.content?.authorGlow,
        author3D: draft.content?.author3D,
        textColor: draft.content?.textColor || '#1E293B',
        fontFamily: draft.content?.fontFamily || 'Caveat',
        fontSize: draft.content?.fontSize || 24,
        textOpacity: draft.content?.textOpacity ?? 1,
        alignment: draft.content?.alignment || 'center',
        imageUrl: order.productId === 'big_pop' ? draft.content?.imageUrl : undefined,
        imageFit: draft.content?.imageFit || 'cover',
        photoOpacity: draft.content?.photoOpacity ?? 1,
        photoZoom: draft.content?.photoZoom ?? 1,
        photoOffsetX: draft.content?.photoOffsetX ?? 0,
        photoOffsetY: draft.content?.photoOffsetY ?? 0,
        stickers: draft.content?.stickers || [],
        drawingData: draft.content?.drawingData || undefined,
        drawingOpacity: draft.content?.drawingOpacity ?? 1,
        frameStyle: draft.content?.frameStyle || 'tape',
        badge: 'NEW',
        photoAdjustments: draft.content?.photoAdjustments || undefined,
        layers: draft.content?.layers || [],
        isCurvedText: draft.content?.isCurvedText || false,
        curveRadius: draft.content?.curveRadius,
        textStroke: draft.content?.textStroke,
        textGlow: draft.content?.textGlow,
        text3D: draft.content?.text3D,
        textGradient: draft.content?.textGradient,
        letterSpacing: draft.content?.letterSpacing || 0,
        lineHeight: draft.content?.lineHeight,
        badgeColor: draft.content?.badgeColor,
        audio: order.productId === 'big_pop' ? draft.content?.audio : undefined,
      },
      createdAt: new Date().toISOString(),
      status: 'published',
      visibility: draft.visibility || 'public',
      allowComments: draft.allowComments ?? true,
      moderationStatus: 'approved',
      viewsCount: 1,
      sharesCount: 0,
      orderId: order.id,
    };

    db.addSpot(newSpot);

    // Establish mutual connection links if creator chained existing pops
    if (newSpot.connectedSpotIds && newSpot.connectedSpotIds.length > 0) {
      for (const targetId of newSpot.connectedSpotIds) {
        db.connectSpots(newSpot.id, targetId, 'usr_admin');
      }
    }

    broadcastSpotEvent('spot_created', { spot: newSpot, stats: db.getStats() });
    if (reservationId) {
      db.releaseReservation(reservationId);
    }

    // Update order with paid status and link allocated spot
    db.updateOrder(orderId, {
      status: 'paid',
      razorpayPaymentId,
      razorpaySignature,
      allocatedSpotId: newSpot.id,
      paidAt: new Date().toISOString(),
    });

    // Update user's owned spots if logged in
    const user = db.getUserById(order.userId);
    if (user) {
      user.ownedSpotIds.push(newSpot.id);
    }

    res.json({
      success: true,
      spot: newSpot,
      order,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// High-performance image upload with deduplication, metadata stripping, WebP compression & object storage
apiRouter.post('/upload', async (req: Request, res: Response) => {
  try {
    const { imageBase64, filename } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Process through extreme cost-optimised image pipeline
    const result = await imageService.processAndStore(imageBase64, filename || 'user_upload.jpg');

    res.json({
      success: true,
      imageUrl: result.imageUrl, // WebP preview asset (~20-55KB)
      thumbnailUrl: result.thumbnailUrl, // Tiny WebP thumbnail (~8-18KB)
      highResUrl: result.highResUrl,
      hash: result.hash,
      width: result.width,
      height: result.height,
      size: result.size,
      isDuplicate: result.isDuplicate,
      filename: filename || 'user_upload.webp',
    });
  } catch (err: any) {
    console.error('Image upload error:', err);
    res.status(400).json({ error: err.message || 'Image processing failed. Please try another photo.' });
  }
});

// High-performance, isolated audio upload for Big Pop voice messages & sound clips
// Strictly enforces max 15 seconds and max 500 KB limits
apiRouter.post('/upload-audio', async (req: Request, res: Response) => {
  try {
    const { audioBase64, duration, mimeType, type } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const audio = await audioService.processAndStoreAudio(
      audioBase64,
      typeof duration === 'number' ? duration : 0,
      mimeType || 'audio/webm',
      type === 'music' ? 'music' : 'voice'
    );

    res.json({
      success: true,
      audio,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Audio upload failed' });
  }
});

// Admin endpoint: safely delete orphaned audio not referenced by any published Big Pop
apiRouter.delete('/admin/clean-orphaned-audio', requireAdmin, (req: Request, res: Response) => {
  try {
    const spots = db.getSpots();
    const activeKeys = new Set<string>();
    for (const s of spots) {
      if (s.content?.audio?.storageKey) {
        activeKeys.add(s.content.audio.storageKey);
      }
    }

    const result = audioService.cleanOrphanedAudio(activeKeys);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Storage & Cost Intelligence Report
apiRouter.get('/admin/storage-stats', requireAdmin, (req: Request, res: Response) => {
  try {
    const report = imageService.getStorageReport();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== MODERATION & REPORTS ===================

apiRouter.post('/reports', (req: Request, res: Response) => {
  try {
    const { spotId, reason, details, reporterEmail } = req.body;
    if (!spotId || !reason) {
      return res.status(400).json({ error: 'Spot ID and reason are required' });
    }

    const report: ModerationReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spotId,
      reporterEmail,
      reason,
      details: details || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.addReport(report);
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== ADMIN MANAGEMENT ===================

apiRouter.get('/admin/metrics', requireAdmin, (req: Request, res: Response) => {
  try {
    const stats = db.getStats();
    const orders = db.getOrders();
    const spots = db.getAllSpotsForAdmin();
    const users = db.getUsers();
    const reports = db.getReports();

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const failedOrders = orders.filter(o => o.status === 'failed').length;
    const paidOrders = orders.filter(o => o.status === 'paid').length;

    res.json({
      stats,
      totalUsers: users.length,
      totalOrders: orders.length,
      paidOrders,
      pendingOrders,
      failedOrders,
      totalSpots: spots.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/spots', requireAdmin, (req: Request, res: Response) => {
  try {
    const spots = db.getAllSpotsForAdmin();
    res.json({ spots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/spots/:id/moderate', requireAdmin, (req: Request, res: Response) => {
  try {
    const { status, moderationStatus } = req.body;
    const updated = db.updateSpot(req.params.id, {
      ...(status ? { status } : {}),
      ...(moderationStatus ? { moderationStatus } : {}),
    });
    if (!updated) {
      return res.status(404).json({ error: 'Spot not found' });
    }
    broadcastSpotEvent('spot_updated', { spot: updated });
    res.json({ success: true, spot: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single spot delete
apiRouter.delete('/admin/spots/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const deleted = db.deleteSpot(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Spot not found' });
    }
    broadcastSpotEvent('spot_deleted', { id: req.params.id, stats: db.getStats() });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Multiple spots batch delete
apiRouter.post('/admin/spots/batch-delete', requireAdmin, (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array required' });
    }
    const count = db.deleteSpots(ids);
    for (const id of ids) {
      broadcastSpotEvent('spot_deleted', { id, stats: db.getStats() });
    }
    res.json({ success: true, deletedCount: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all spots
apiRouter.post('/admin/spots/delete-all', requireAdmin, (_req: Request, res: Response) => {
  try {
    const count = db.deleteAllSpots();
    res.json({ success: true, deletedCount: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add new spot directly from admin
apiRouter.post('/admin/spots/create', requireAdmin, (req: Request, res: Response) => {
  try {
    const { tier = 'mini_pop', creatorName = 'SpotPop Admin', shape = 'sticky', background = '#FFF8E7', headline = 'Admin Spot', text = '', imageUrl } = req.body;
    const product = PRODUCTS[tier as ProductTier] || PRODUCTS.mini_pop;
    const { x, y, rotation, reservationId } = db.allocateCoordinate(product.width, product.height, true);

    const newSpot: Spot = {
      id: `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ownerId: 'usr_admin',
      creatorName,
      slug: `${creatorName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`,
      tier: tier as ProductTier,
      x,
      y,
      width: product.width,
      height: product.height,
      rotation,
      shape,
      background,
      content: {
        headline,
        text,
        imageUrl: tier === 'big_pop' ? imageUrl : undefined,
        fontFamily: 'Caveat',
        fontSize: 20,
        textColor: '#1E293B',
        alignment: 'center',
        frameStyle: 'tape',
        stickers: [],
      },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 0,
      sharesCount: 0,
    };

    db.addSpot(newSpot);

    // Establish mutual connection links if creator chained existing pops
    if (newSpot.connectedSpotIds && newSpot.connectedSpotIds.length > 0) {
      for (const targetId of newSpot.connectedSpotIds) {
        db.connectSpots(newSpot.id, targetId, 'usr_admin');
      }
    }

    broadcastSpotEvent('spot_created', { spot: newSpot, stats: db.getStats() });
    if (reservationId) {
      db.releaseReservation(reservationId);
    }
    res.json({ success: true, spot: newSpot });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/reports', requireAdmin, (req: Request, res: Response) => {
  try {
    const reports = db.getReports();
    res.json({ reports });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/reports/:id/resolve', requireAdmin, (req: Request, res: Response) => {
  try {
    const { action } = req.body; // 'dismiss' or 'hide_spot'
    const report = db.getReports().find(r => r.id === req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (action === 'hide_spot') {
      db.updateSpot(report.spotId, { status: 'hidden', moderationStatus: 'removed' });
    }

    db.updateReport(report.id, {
      status: action === 'hide_spot' ? 'resolved' : 'dismissed',
      reviewedBy: 'Admin',
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/orders', requireAdmin, (req: Request, res: Response) => {
  try {
    const orders = db.getOrders();
    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/users', requireAdmin, (req: Request, res: Response) => {
  try {
    const users = db.getUsers();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== ADVANCED GOD-MODE ADMIN ENDPOINTS ===================

// Create user as Admin
apiRouter.post('/admin/users', requireAdmin, (req: Request, res: Response) => {
  try {
    const { email, username, displayName, role = 'user', bio, website, password, isPrivate = false, avatarUrl } = req.body;
    if (!email || !username) {
      return res.status(400).json({ error: 'Email and username are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    if (db.getUserByEmail(cleanEmail)) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    if (db.getUserByUsername(cleanUsername)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      username: cleanUsername,
      displayName: (displayName || username).trim(),
      role: role === 'admin' ? 'admin' : 'user',
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`,
      bio: (bio || '').trim(),
      websiteUrl: (website || '').trim(),
      isPrivate: Boolean(isPrivate),
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
      passwordHash: password ? hashPassword(password) : undefined,
    };

    db.addUser(newUser);
    res.json({ success: true, user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update user as Admin
apiRouter.put('/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = db.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { email, username, displayName, role, bio, website, isPrivate, password, avatarUrl } = req.body;
    const updates: Partial<User> = {};

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const existing = db.getUserByEmail(cleanEmail);
      if (existing && existing.id !== id) {
        return res.status(409).json({ error: 'Email already in use by another account' });
      }
      updates.email = cleanEmail;
    }

    if (username) {
      const cleanUsername = username.trim().toLowerCase();
      const existing = db.getUserByUsername(cleanUsername);
      if (existing && existing.id !== id) {
        return res.status(409).json({ error: 'Username already in use by another account' });
      }
      updates.username = cleanUsername;
    }

    if (displayName !== undefined) updates.displayName = displayName.trim();
    if (role !== undefined) updates.role = role === 'admin' ? 'admin' : 'user';
    if (bio !== undefined) updates.bio = bio.trim();
    if (website !== undefined) updates.websiteUrl = website.trim();
    if (isPrivate !== undefined) updates.isPrivate = Boolean(isPrivate);
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (password) updates.passwordHash = hashPassword(password);

    const updated = db.updateUser(id, updates);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user as Admin (with full spot cascade & SSE broadcast)
apiRouter.delete('/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (id === 'usr_admin') {
      return res.status(403).json({ error: 'Cannot delete primary root administrator account' });
    }
    const success = db.deleteUser(id);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    const deletedSpotIds = db.lastDeletedSpotIds || [];
    for (const spotId of deletedSpotIds) {
      broadcastSpotEvent('spot_deleted', { id: spotId, stats: db.getStats() });
    }
    res.json({ success: true, deletedSpotIds });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch delete users as Admin (with full spot cascade & SSE broadcast)
apiRouter.post('/admin/users/batch-delete', requireAdmin, (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array required' });
    }
    const safeIds = ids.filter(id => id !== 'usr_admin');
    const deletedCount = db.deleteUsers(safeIds);
    const deletedSpotIds = db.lastDeletedSpotIds || [];
    for (const spotId of deletedSpotIds) {
      broadcastSpotEvent('spot_deleted', { id: spotId, stats: db.getStats() });
    }
    res.json({ success: true, deletedCount, deletedSpotIds });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// User deletes their own account (GDPR complete data & spot erasure)
apiRouter.delete('/users/me', (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (user.id === 'usr_admin') {
      return res.status(403).json({ error: 'Primary administrator account cannot be deleted' });
    }
    const success = db.deleteUser(user.id);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    const deletedSpotIds = db.lastDeletedSpotIds || [];
    for (const spotId of deletedSpotIds) {
      broadcastSpotEvent('spot_deleted', { id: spotId, stats: db.getStats() });
    }
    res.json({ success: true, message: 'Account and all associated spots permanently deleted', deletedSpotIds });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// God-Mode Edit Spot: Update any spot property (coordinates, rotation, content, styling, status)
apiRouter.put('/admin/spots/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.getSpotById(id) || db.getAllSpotsForAdmin().find(s => s.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    const {
      title,
      creatorName,
      ownerId,
      tier,
      shape,
      background,
      borderColor,
      x,
      y,
      rotation,
      status,
      moderationStatus,
      visibility,
      allowComments,
      content,
    } = req.body;

    const updates: Partial<Spot> = {};
    if (title !== undefined) updates.title = title;
    if (creatorName !== undefined) updates.creatorName = creatorName;
    if (ownerId !== undefined) updates.ownerId = ownerId;
    if (tier !== undefined) updates.tier = tier;
    if (shape !== undefined) updates.shape = shape;
    if (background !== undefined) updates.background = background;
    if (borderColor !== undefined) updates.borderColor = borderColor;
    if (typeof x === 'number') updates.x = x;
    if (typeof y === 'number') updates.y = y;
    if (typeof rotation === 'number') updates.rotation = rotation;
    if (status !== undefined) updates.status = status;
    if (moderationStatus !== undefined) updates.moderationStatus = moderationStatus;
    if (visibility !== undefined) updates.visibility = visibility;
    if (allowComments !== undefined) updates.allowComments = allowComments;

    if (content) {
      updates.content = {
        ...existing.content,
        ...content,
      };
    }

    const updated = db.updateSpot(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Failed to update spot' });
    }

    broadcastSpotEvent('spot_updated', { spot: updated });
    res.json({ success: true, spot: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Reposition Spot
apiRouter.post('/admin/spots/:id/reposition', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { x, y, rotation } = req.body;
    if (typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ error: 'x and y numeric coordinates required' });
    }
    const updated = db.updateSpot(id, {
      x,
      y,
      rotation: typeof rotation === 'number' ? rotation : 0,
    });
    if (!updated) return res.status(404).json({ error: 'Spot not found' });
    broadcastSpotEvent('spot_updated', { spot: updated });
    res.json({ success: true, spot: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Order as Admin
apiRouter.put('/admin/orders/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updates: Partial<Order> = {};
    if (status) updates.status = status;

    const updated = db.updateOrder(id, updates);
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Order as Admin
apiRouter.delete('/admin/orders/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = db.deleteOrder(id);
    if (!success) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Comments Admin Management
apiRouter.get('/admin/comments', requireAdmin, (_req: Request, res: Response) => {
  try {
    const comments = db.getAllComments();
    res.json({ comments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/admin/comments/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = db.deleteComment(id);
    if (!success) return res.status(404).json({ error: 'Comment not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Database Backups Admin Management
apiRouter.get('/admin/backups', requireAdmin, (_req: Request, res: Response) => {
  try {
    const backups = db.getBackupsList();
    res.json({ backups });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/backups/create', requireAdmin, (_req: Request, res: Response) => {
  try {
    const backupPath = db.createBackup();
    if (!backupPath) return res.status(500).json({ error: 'Failed to create backup' });
    res.json({ success: true, path: backupPath, filename: path.basename(backupPath) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/backups/restore', requireAdmin, (req: Request, res: Response) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'Backup filename required' });
    const success = db.restoreBackup(filename);
    if (!success) return res.status(500).json({ error: 'Failed to restore backup snapshot' });
    res.json({ success: true, message: `Successfully restored database snapshot ${filename}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// System Activity Log
apiRouter.get('/admin/activities', requireAdmin, (_req: Request, res: Response) => {
  try {
    const activities = db.getActivity();
    res.json({ activities });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
