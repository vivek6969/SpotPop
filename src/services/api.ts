import { Spot, CanvasStats, ActivityEvent, ProductTier, Order, User, ModerationReport } from '../types';

const API_BASE = '/api';

export const api = {
  async getSpots(bbox?: { minX: number; minY: number; maxX: number; maxY: number; zoom?: number }): Promise<{ spots: Spot[]; stats: CanvasStats }> {
    const url = bbox
      ? `${API_BASE}/spots?minX=${bbox.minX}&minY=${bbox.minY}&maxX=${bbox.maxX}&maxY=${bbox.maxY}&zoom=${bbox.zoom || 1}`
      : `${API_BASE}/spots`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch spots');
    return res.json();
  },

  async getViewportSpots(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    zoom: number = 1,
    signal?: AbortSignal
  ): Promise<{ spots: Spot[]; stats: CanvasStats; count: number }> {
    const params = new URLSearchParams({
      minX: Math.round(minX).toString(),
      minY: Math.round(minY).toString(),
      maxX: Math.round(maxX).toString(),
      maxY: Math.round(maxY).toString(),
      zoom: zoom.toFixed(2),
    });
    const res = await fetch(`${API_BASE}/spots/viewport?${params}`, { signal });
    if (!res.ok) throw new Error('Failed to fetch viewport spots');
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

  async search(query: string, filter: string = 'all'): Promise<{
    results: Spot[];
    spots: Spot[];
    creators: Array<{
      username: string;
      displayName: string;
      avatarUrl?: string;
      bio?: string;
      spotCount: number;
      totalViews: number;
    }>;
    total: number;
  }> {
    const params = new URLSearchParams({ q: query, filter });
    const res = await fetch(`${API_BASE}/search?${params}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async getExploreSpots(params: {
    sort?: string;
    tier?: string;
    category?: string;
    time?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ spots: Spot[]; total: number; hasMore: boolean }> {
    const searchParams = new URLSearchParams();
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.tier) searchParams.set('tier', params.tier);
    if (params.category) searchParams.set('category', params.category);
    if (params.time) searchParams.set('time', params.time);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());

    const res = await fetch(`${API_BASE}/spots/explore?${searchParams}`);
    if (!res.ok) throw new Error('Failed to load explore spots');
    return res.json();
  },

  async getCreatorProfile(username: string): Promise<{
    user: User;
    stats: { totalSpots: number; totalViews: number; totalShares: number };
    spots: Spot[];
  }> {
    const res = await fetch(`${API_BASE}/creators/${encodeURIComponent(username)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Creator not found');
    }
    return res.json();
  },

  async updateCreatorProfile(
    token: string,
    updates: { displayName?: string; bio?: string; avatarUrl?: string }
  ): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/creators/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update profile');
    }
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

  async uploadAudio(params: {
    audioBase64: string;
    duration: number;
    mimeType: string;
    type: 'voice' | 'music';
  }): Promise<{ success: boolean; audio: import('../types').SpotAudio }> {
    const res = await fetch(`${API_BASE}/upload-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload audio');
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

  async deleteAdminSpot(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/spots/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete spot');
    return res.json();
  },

  async deleteAdminSpotsBatch(ids: string[]): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/spots/batch-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Failed to delete selected spots');
    return res.json();
  },

  async deleteAllAdminSpots(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/spots/delete-all`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to delete all spots');
    return res.json();
  },

  async createAdminSpot(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/spots/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create admin spot');
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

  async getStorageStats(): Promise<{
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
  }> {
    const res = await fetch(`${API_BASE}/admin/storage-stats`);
    if (!res.ok) throw new Error('Failed to load storage report');
    return res.json();
  },
};
