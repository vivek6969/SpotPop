import { Router, type Request, type Response } from 'express';
import { db } from './database.ts';
import { createRazorpayOrder, verifyPaymentSignature } from './razorpay.ts';
import type { ProductTier, Spot, Order, User, ModerationReport } from '../src/types/index.ts';
import { PRODUCTS } from '../src/types/index.ts';
import { imageService } from './imageService.ts';
import { audioService } from './audioService.ts';

export const apiRouter = Router();

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

    // Viewport-based query if bounding coordinates are provided
    if (minX !== undefined && minY !== undefined && maxX !== undefined && maxY !== undefined) {
      let spots = db.queryViewport(minX, minY, maxX, maxY, limit);

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
    const spots = db.getSpots();
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

    let spots = db.queryViewport(minX, minY, maxX, maxY, limit);

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
    const targetWidth = parseInt((req.query.w as string) || '200', 10);
    const quality = parseInt((req.query.q as string) || '75', 10);

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
    const spot = db.getSpotByIdOrSlug(req.params.idOrSlug);
    if (!spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }
    db.incrementSpotViews(spot.id);
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

// POST record share event
apiRouter.post('/spots/:id/share', (req: Request, res: Response) => {
  try {
    db.incrementSpotShares(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== SEARCH & DISCOVERY ===================

apiRouter.get('/search', (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').toLowerCase().trim();
    const filter = (req.query.filter as string) || 'all';
    const limit = Math.min(100, parseInt((req.query.limit as string) || '30', 10));

    const allSpots = db.getSpots().filter(s => s.status === 'published' && s.moderationStatus === 'approved');
    const allUsers = db.getUsers();

    let matchingSpots = allSpots;

    if (q) {
      matchingSpots = matchingSpots.filter(s => {
        const headline = (s.content?.headline || '').toLowerCase();
        const text = (s.content?.text || '').toLowerCase();
        const creator = (s.creatorName || '').toLowerCase();
        const id = s.id.toLowerCase();
        const slug = (s.slug || '').toLowerCase();
        const tags = (s.content?.tags || []).map(t => t.toLowerCase()).join(' ');
        const badge = (s.content?.badge || '').toLowerCase();

        return (
          id.includes(q) ||
          creator.includes(q) ||
          slug.includes(q) ||
          headline.includes(q) ||
          text.includes(q) ||
          tags.includes(q) ||
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
    const createdAt = user?.createdAt || creatorSpots[creatorSpots.length - 1]?.createdAt || new Date().toISOString();

    const totalViews = creatorSpots.reduce((sum, s) => sum + (s.viewsCount || 0), 0);
    const totalShares = creatorSpots.reduce((sum, s) => sum + (s.sharesCount || 0), 0);

    res.json({
      user: {
        id: user?.id || `usr_${username}`,
        username,
        displayName,
        avatarUrl,
        bio,
        createdAt,
        role: user?.role || 'user',
      },
      stats: {
        totalSpots: creatorSpots.length,
        totalViews,
        totalShares,
      },
      spots: creatorSpots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    });
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

    const { displayName, bio, avatarUrl } = req.body;
    const updates: Partial<User> = {};
    if (displayName && typeof displayName === 'string') updates.displayName = displayName.trim().slice(0, 40);
    if (bio !== undefined && typeof bio === 'string') updates.bio = bio.trim().slice(0, 280);
    if (avatarUrl && typeof avatarUrl === 'string') updates.avatarUrl = avatarUrl.trim();

    const updated = db.updateUser(user.id, updates);
    res.json({ user: updated });
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
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      displayName: displayName.trim(),
      role: email.includes('admin') ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    };

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
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let user = db.getUserByEmail(email);
    if (!user) {
      // Auto-provision user for seamless onboarding
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: email.trim().toLowerCase(),
        username: username || `user${Math.floor(Math.random() * 9000 + 1000)}`,
        displayName: username ? (username.charAt(0).toUpperCase() + username.slice(1)) : 'Spot Creator',
        role: email.includes('admin') ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        ownedSpotIds: [],
      };
      db.addUser(user);
    }

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

// =================== PAYMENTS & ORDERS ===================

// Create a pending order for Razorpay
apiRouter.post('/orders/create', (req: Request, res: Response) => {
  try {
    const { productId, spotDraft, creatorName } = req.body;
    if (!productId || !PRODUCTS[productId as ProductTier]) {
      return res.status(400).json({ error: 'Invalid product selection' });
    }

    const tier = productId as ProductTier;
    const product = PRODUCTS[tier];
    const user = getAuthenticatedUser(req);
    const userId = user ? user.id : `anon_${Date.now()}`;

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
      x,
      y,
      width: product.width,
      height: product.height,
      rotation,
      shape: draft.shape || (order.productId === 'big_pop' ? 'polaroid' : 'sticky'),
      background: draft.background || '#FFF8E7',
      borderColor: draft.borderColor,
      content: {
        headline: draft.content?.headline || '',
        headlineX: draft.content?.headlineX,
        headlineY: draft.content?.headlineY,
        text: draft.content?.text || '',
        subtextX: draft.content?.subtextX,
        subtextY: draft.content?.subtextY,
        subtextSize: draft.content?.subtextSize,
        author: draft.creatorName || draft.content?.author || 'Anonymous',
        authorX: draft.content?.authorX,
        authorY: draft.content?.authorY,
        authorSize: draft.content?.authorSize,
        authorOpacity: draft.content?.authorOpacity,
        textColor: draft.content?.textColor || '#1E293B',
        fontFamily: draft.content?.fontFamily || 'Caveat',
        fontSize: draft.content?.fontSize || 24,
        textOpacity: draft.content?.textOpacity ?? 1,
        alignment: draft.content?.alignment || 'center',
        imageUrl: draft.content?.imageUrl,
        imageFit: draft.content?.imageFit || 'cover',
        photoOpacity: draft.content?.photoOpacity ?? 1,
        photoZoom: draft.content?.photoZoom ?? 1,
        photoOffsetX: draft.content?.photoOffsetX ?? 0,
        photoOffsetY: draft.content?.photoOffsetY ?? 0,
        stickers: draft.content?.stickers || [],
        drawingData: draft.content?.drawingData,
        drawingOpacity: draft.content?.drawingOpacity ?? 1,
        frameStyle: draft.content?.frameStyle || 'tape',
        badge: 'NEW',
        audio: order.productId === 'big_pop' ? draft.content?.audio : undefined,
      },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 1,
      sharesCount: 0,
      orderId: order.id,
    };

    db.addSpot(newSpot);
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
    res.status(500).json({ error: err.message });
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
apiRouter.delete('/admin/clean-orphaned-audio', (req: Request, res: Response) => {
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
apiRouter.get('/admin/storage-stats', (req: Request, res: Response) => {
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

apiRouter.get('/admin/metrics', (req: Request, res: Response) => {
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

apiRouter.get('/admin/spots', (req: Request, res: Response) => {
  try {
    const spots = db.getAllSpotsForAdmin();
    res.json({ spots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/spots/:id/moderate', (req: Request, res: Response) => {
  try {
    const { status, moderationStatus } = req.body;
    const updated = db.updateSpot(req.params.id, {
      ...(status ? { status } : {}),
      ...(moderationStatus ? { moderationStatus } : {}),
    });
    if (!updated) {
      return res.status(404).json({ error: 'Spot not found' });
    }
    res.json({ success: true, spot: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single spot delete
apiRouter.delete('/admin/spots/:id', (req: Request, res: Response) => {
  try {
    const deleted = db.deleteSpot(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Spot not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Multiple spots batch delete
apiRouter.post('/admin/spots/batch-delete', (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array required' });
    }
    const count = db.deleteSpots(ids);
    res.json({ success: true, deletedCount: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all spots
apiRouter.post('/admin/spots/delete-all', (_req: Request, res: Response) => {
  try {
    const count = db.deleteAllSpots();
    res.json({ success: true, deletedCount: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add new spot directly from admin
apiRouter.post('/admin/spots/create', (req: Request, res: Response) => {
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
    if (reservationId) {
      db.releaseReservation(reservationId);
    }
    res.json({ success: true, spot: newSpot });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/reports', (req: Request, res: Response) => {
  try {
    const reports = db.getReports();
    res.json({ reports });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/reports/:id/resolve', (req: Request, res: Response) => {
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

apiRouter.get('/admin/orders', (req: Request, res: Response) => {
  try {
    const orders = db.getOrders();
    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/users', (req: Request, res: Response) => {
  try {
    const users = db.getUsers();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
