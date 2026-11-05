import { Router, type Request, type Response } from 'express';
import { db } from './database.ts';
import { createRazorpayOrder, verifyPaymentSignature } from './razorpay.ts';
import type { ProductTier, Spot, Order, User, ModerationReport } from '../src/types/index.ts';
import { PRODUCTS } from '../src/types/index.ts';

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

// GET all visible spots
apiRouter.get('/spots', (req: Request, res: Response) => {
  try {
    const spots = db.getSpots();
    const stats = db.getStats();
    res.json({ spots, stats });
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

    let spots = db.getSpots();

    if (q) {
      spots = spots.filter(s =>
        s.id.toLowerCase().includes(q) ||
        s.creatorName.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.content.headline && s.content.headline.toLowerCase().includes(q)) ||
        (s.content.text && s.content.text.toLowerCase().includes(q))
      );
    }

    if (filter === 'mini') {
      spots = spots.filter(s => s.tier === 'mini_pop');
    } else if (filter === 'big') {
      spots = spots.filter(s => s.tier === 'big_pop');
    } else if (filter === 'trending') {
      spots = spots.sort((a, b) => (b.viewsCount + b.sharesCount * 2) - (a.viewsCount + a.sharesCount * 2));
    } else if (filter === 'featured') {
      spots = spots.filter(s => s.content.badge || s.tier === 'big_pop');
    } else {
      // Default: newest first
      spots = spots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json({ results: spots.slice(0, 30) });
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

    // Calculate non-overlapping coordinates on canvas
    const product = PRODUCTS[order.productId];
    const { x, y, rotation } = db.allocateCoordinate(product.width, product.height);

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
      },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 1,
      sharesCount: 0,
      orderId: order.id,
    };

    db.addSpot(newSpot);

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

// Image upload endpoint (stores base64 or optimized image)
apiRouter.post('/upload', (req: Request, res: Response) => {
  try {
    const { imageBase64, filename } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Validate size (max 8MB base64)
    if (imageBase64.length > 8 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image exceeds maximum 8MB size limit' });
    }

    // In local dev/fullstack, return data URI directly for seamless instant rendering
    res.json({
      success: true,
      imageUrl: imageBase64,
      filename: filename || 'user_upload.jpg',
    });
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
