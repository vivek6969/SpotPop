import { Spot, CanvasStats, ActivityEvent, ProductTier, Order, User, ModerationReport } from '../types';

const API_BASE = '/api';

export const api = {
  async getSpots(): Promise<{ spots: Spot[]; stats: CanvasStats }> {
    const res = await fetch(`${API_BASE}/spots`);
    if (!res.ok) throw new Error('Failed to fetch spots');
    return res.json();
  },

  async getSpot(idOrSlug: string): Promise<{ spot: Spot }> {
    const res = await fetch(`${API_BASE}/spots/${idOrSlug}`);
    if (!res.ok) throw new Error('Spot not found');
    return res.json();
  },

  async getStats(): Promise<{ stats: CanvasStats }> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async getActivity(): Promise<{ activity: ActivityEvent[] }> {
    const res = await fetch(`${API_BASE}/activity`);
    if (!res.ok) throw new Error('Failed to fetch activity');
    return res.json();
  },

  async search(query: string, filter: string = 'all'): Promise<{ results: Spot[] }> {
    const params = new URLSearchParams({ q: query, filter });
    const res = await fetch(`${API_BASE}/search?${params}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async recordShare(spotId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/spots/${spotId}/share`, { method: 'POST' });
    } catch (e) {
      console.warn('Could not record share event', e);
    }
  },

  async createOrder(params: {
    productId: ProductTier;
    spotDraft: Partial<Spot>;
    creatorName: string;
    token?: string;
  }): Promise<{ order: Order; razorpayConfig: any }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (params.token) headers['Authorization'] = `Bearer ${params.token}`;

    const res = await fetch(`${API_BASE}/orders/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create order');
    }
    return res.json();
  },

  async verifyPayment(params: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{ success: boolean; spot: Spot; order: Order }> {
    const res = await fetch(`${API_BASE}/orders/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Payment verification failed');
    }
    return res.json();
  },

  async uploadImage(imageBase64: string, filename?: string): Promise<{ imageUrl: string }> {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, filename }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload image');
    }
    return res.json();
  },

  async submitReport(params: {
    spotId: string;
    reason: string;
    details: string;
    reporterEmail?: string;
  }): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to submit report');
    return res.json();
  },

  // Auth
  async login(email: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(params: { email: string; username: string; displayName: string }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async getMe(token: string): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  // Admin
  async getAdminMetrics(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/metrics`);
    if (!res.ok) throw new Error('Failed to load admin metrics');
    return res.json();
  },

  async getAdminSpots(): Promise<{ spots: Spot[] }> {
    const res = await fetch(`${API_BASE}/admin/spots`);
    if (!res.ok) throw new Error('Failed to load spots');
    return res.json();
  },

  async moderateSpot(id: string, updates: { status?: string; moderationStatus?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/spots/${id}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update spot');
    return res.json();
  },

  async getAdminReports(): Promise<{ reports: ModerationReport[] }> {
    const res = await fetch(`${API_BASE}/admin/reports`);
    if (!res.ok) throw new Error('Failed to load reports');
    return res.json();
  },

  async resolveReport(id: string, action: 'dismiss' | 'hide_spot'): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/reports/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error('Failed to resolve report');
    return res.json();
  },

  async getAdminOrders(): Promise<{ orders: Order[] }> {
    const res = await fetch(`${API_BASE}/admin/orders`);
    if (!res.ok) throw new Error('Failed to load orders');
    return res.json();
  },

  async getAdminUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${API_BASE}/admin/users`);
    if (!res.ok) throw new Error('Failed to load users');
    return res.json();
  },
};
