import { Spot, CanvasStats, ActivityEvent, ProductTier, Order, User, ModerationReport, Comment, FollowStatus, FollowRequestItem, FollowResponse } from '../types';

const API_BASE = '/api';

function getClientHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const token = localStorage.getItem('spotpop_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    let viewerId = localStorage.getItem('spotpop_viewer_id');
    if (!viewerId) {
      viewerId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      localStorage.setItem('spotpop_viewer_id', viewerId);
    }
    headers['x-viewer-id'] = viewerId;
  } catch (_) { }
  return headers;
}

export const api = {
  async getSpots(bbox?: { minX: number; minY: number; maxX: number; maxY: number; zoom?: number }): Promise<{ spots: Spot[]; stats: CanvasStats }> {
    const url = bbox
      ? `${API_BASE}/spots?minX=${bbox.minX}&minY=${bbox.minY}&maxX=${bbox.maxX}&maxY=${bbox.maxY}&zoom=${bbox.zoom || 1}`
      : `${API_BASE}/spots`;
    const res = await fetch(url, { headers: getClientHeaders() });
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
    const res = await fetch(`${API_BASE}/spots/viewport?${params}`, {
      headers: getClientHeaders(),
      signal,
    });
    if (!res.ok) throw new Error('Failed to fetch viewport spots');
    return res.json();
  },

  async getSpot(idOrSlug: string): Promise<{ spot: Spot }> {
    const res = await fetch(`${API_BASE}/spots/${idOrSlug}`);
    if (!res.ok) throw new Error('Spot not found');
    return res.json();
  },

  async getConnectedSpots(spotId: string, viewer?: string): Promise<{ connectedSpots: Spot[] }> {
    const params = viewer ? `?viewer=${encodeURIComponent(viewer)}` : '';
    const res = await fetch(`${API_BASE}/spots/${spotId}/connected${params}`, {
      headers: getClientHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch connected spots');
    return res.json();
  },

  async getConnectableSpots(currentSpotId?: string, token?: string): Promise<{ spots: Spot[] }> {
    const headers = getClientHeaders();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const params = currentSpotId ? `?currentSpotId=${encodeURIComponent(currentSpotId)}` : '';
    const res = await fetch(`${API_BASE}/spots/connectable${params}`, {
      headers,
    });
    if (!res.ok) throw new Error('Failed to fetch connectable spots');
    return res.json();
  },

  async connectSpots(
    spotId: string,
    targetSpotId: string,
    token?: string
  ): Promise<{ success: boolean; spot: Spot; connectedSpots: Spot[] }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...getClientHeaders(),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/spots/${spotId}/connect`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetSpotId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to connect spots');
    }
    return res.json();
  },

  async disconnectSpots(
    spotId: string,
    targetSpotId: string,
    token?: string
  ): Promise<{ success: boolean; spot: Spot; connectedSpots: Spot[] }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...getClientHeaders(),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/spots/${spotId}/disconnect`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetSpotId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to disconnect spots');
    }
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

  async getSuggestions(query: string, type: 'all' | 'users' | 'hashtags' | 'locations' | 'spots' = 'all', limit: number = 8): Promise<{
    users: Array<{ id: string; username: string; displayName: string; avatarUrl?: string; isPrivate?: boolean; spotCount: number }>;
    hashtags: Array<{ tag: string; count: number }>;
    locations: Array<{ name: string; spotCount: number }>;
    spots: Array<{ id: string; headline: string; title?: string; creatorName: string; imageUrl?: string; tier: string }>;
  }> {
    const params = new URLSearchParams({ q: query, type, limit: limit.toString() });
    const res = await fetch(`${API_BASE}/suggestions?${params}`);
    if (!res.ok) throw new Error('Failed to fetch suggestions');
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
    stats: { totalSpots: number; totalViews: number; totalShares: number; followersCount?: number; followingCount?: number };
    followStatus?: FollowStatus;
    isFollowing?: boolean;
    isRequested?: boolean;
    isLockedAccount?: boolean;
    spots: Spot[];
  }> {
    const res = await fetch(`${API_BASE}/creators/${encodeURIComponent(username)}`, {
      headers: getClientHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Creator not found');
    }
    return res.json();
  },

  async checkUsername(
    username: string,
    token?: string
  ): Promise<{ available: boolean; error?: string; cleanUsername?: string; isCurrent?: boolean }> {
    const headers = getClientHeaders();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/users/check-username?username=${encodeURIComponent(username)}`, {
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to check username');
    }
    return res.json();
  },

  async updateCreatorProfile(
    token: string,
    updates: { username?: string; displayName?: string; bio?: string; avatarUrl?: string; websiteUrl?: string; category?: string; isPrivate?: boolean }
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

  async toggleSpotLike(spotId: string, action: 'like' | 'unlike' = 'like'): Promise<{ success: boolean; likesCount: number; spot?: Spot } | null> {
    try {
      const res = await fetch(`${API_BASE}/spots/${spotId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Could not record like event', e);
    }
    return null;
  },

  async recordView(spotId: string): Promise<{ success: boolean; viewsCount: number } | null> {
    try {
      const res = await fetch(`${API_BASE}/spots/${spotId}/view`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Could not record view event', e);
    }
    return null;
  },

  async getComments(spotId: string): Promise<Comment[]> {
    try {
      const res = await fetch(`${API_BASE}/spots/${spotId}/comments`);
      if (res.ok) {
        const data = await res.json();
        return data.comments || [];
      }
    } catch (e) {
      console.warn('Could not fetch comments', e);
    }
    return [];
  },

  async addComment(spotId: string, text: string, replyToId?: string, authorName?: string, authorAvatar?: string): Promise<Comment | null> {
    try {
      const res = await fetch(`${API_BASE}/spots/${spotId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, replyToId, authorName, authorAvatar }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.comment || null;
      }
    } catch (e) {
      console.warn('Could not post comment', e);
    }
    return null;
  },

  async likeComment(commentId: string): Promise<number | null> {
    try {
      const res = await fetch(`${API_BASE}/comments/${commentId}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        return data.likesCount;
      }
    } catch (e) {
      console.warn('Could not like comment', e);
    }
    return null;
  },

  async sendReaction(spotId: string, emoji: string): Promise<Record<string, number> | null> {
    try {
      const res = await fetch(`${API_BASE}/spots/${spotId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.reactions || null;
      }
    } catch (e) {
      console.warn('Could not send reaction', e);
    }
    return null;
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
  async login(email: string, password?: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(params: { email: string; username: string; displayName: string; password?: string }): Promise<{ user: User; token: string }> {
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

  // User Spot Management (See, Update, Delete own pops)
  async getMySpots(token: string): Promise<{ spots: Spot[] }> {
    const res = await fetch(`${API_BASE}/user/my-spots`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch your spots');
    }
    return res.json();
  },

  async updateSpot(id: string, updates: Partial<Spot>, token?: string): Promise<{ success: boolean; spot: Spot }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/spots/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update Pop');
    }
    return res.json();
  },

  async deleteSpot(id: string, token?: string): Promise<{ success: boolean; spotId: string }> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/spots/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete Pop');
    }
    return res.json();
  },

  // Social & Follows
  async followUser(username: string, token?: string): Promise<FollowResponse> {
    const headers: Record<string, string> = { ...getClientHeaders(), 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}/follow`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to follow user');
    }
    return res.json();
  },

  async unfollowUser(username: string, token?: string): Promise<FollowResponse> {
    const cleanUsername = username.replace(/^@/, '');
    const headers: Record<string, string> = { ...getClientHeaders(), 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(cleanUsername)}/unfollow`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to unfollow user');
    }
    return res.json();
  },

  async getFollowRequests(username: string, token?: string): Promise<{ requests: FollowRequestItem[]; count: number }> {
    const headers: Record<string, string> = { ...getClientHeaders() };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}/follow-requests`, {
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load follow requests');
    }
    return res.json();
  },

  async acceptFollowRequest(
    requestId: string,
    targetUsername?: string,
    token?: string
  ): Promise<{ success: boolean; followerName: string; followersCount: number; followingCount: number }> {
    const headers: Record<string, string> = { ...getClientHeaders(), 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/users/follow-requests/${encodeURIComponent(requestId)}/accept`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetUsername }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to accept follow request');
    }
    return res.json();
  },

  async declineFollowRequest(
    requestId: string,
    targetUsername?: string,
    token?: string
  ): Promise<{ success: boolean }> {
    const headers: Record<string, string> = { ...getClientHeaders(), 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/users/follow-requests/${encodeURIComponent(requestId)}/decline`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetUsername }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to decline follow request');
    }
    return res.json();
  },

  async removeFollower(
    username: string,
    followerId: string,
    token?: string
  ): Promise<{ success: boolean; followersCount: number }> {
    const headers: Record<string, string> = { ...getClientHeaders() };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}/followers/${encodeURIComponent(followerId)}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to remove follower');
    }
    return res.json();
  },

  async updateAccountPrivacy(
    username: string,
    isPrivate: boolean,
    token?: string
  ): Promise<{ success: boolean; isPrivate: boolean }> {
    const headers: Record<string, string> = { ...getClientHeaders(), 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}/privacy`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ isPrivate }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update privacy');
    }
    return res.json();
  },

  async getUserNetwork(username: string, token?: string): Promise<{
    followers: Array<{ id: string; username: string; displayName: string; avatarUrl?: string }>;
    following: Array<{ id: string; username: string; displayName: string; avatarUrl?: string }>;
    followersCount: number;
    followingCount: number;
    followStatus: FollowStatus;
    isFollowing: boolean;
    isRequested: boolean;
    pendingRequestsCount?: number;
    followRequests?: FollowRequestItem[];
  }> {
    const headers: Record<string, string> = { ...getClientHeaders() };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}/network`, {
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load user network');
    }
    return res.json();
  },

  // Admin
  async getAdminMetrics(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/metrics`, { headers: getClientHeaders() });
    if (!res.ok) throw new Error('Failed to load admin metrics');
    return res.json();
  },

  async getAdminSpots(): Promise<{ spots: Spot[] }> {
    const res = await fetch(`${API_BASE}/admin/spots`, { headers: getClientHeaders() });
    if (!res.ok) throw new Error('Failed to load spots');
    return res.json();
  },

  async moderateSpot(id: string, updates: { status?: string; moderationStatus?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/spots/${id}/moderate`, {
      method: 'POST',
      headers: { ...getClientHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update spot');
    return res.json();
  },

  async deleteAdminSpot(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/spots/${id}`, {
      method: 'DELETE',
      headers: getClientHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete spot');
    return res.json();
  },

  async deleteAdminSpotsBatch(ids: string[]): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/spots/batch-delete`, {
      method: 'POST',
      headers: { ...getClientHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Failed to delete selected spots');
    return res.json();
  },

  async deleteAllAdminSpots(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/spots/delete-all`, {
      method: 'POST',
      headers: getClientHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete all spots');
    return res.json();
  },

  async createAdminSpot(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/spots/create`, {
      method: 'POST',
      headers: { ...getClientHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create admin spot');
    return res.json();
  },

  async getAdminReports(): Promise<{ reports: ModerationReport[] }> {
    const res = await fetch(`${API_BASE}/admin/reports`, { headers: getClientHeaders() });
    if (!res.ok) throw new Error('Failed to load reports');
    return res.json();
  },

  async resolveReport(id: string, action: 'dismiss' | 'hide_spot'): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/reports/${id}/resolve`, {
      method: 'POST',
      headers: { ...getClientHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error('Failed to resolve report');
    return res.json();
  },

  async getAdminOrders(): Promise<{ orders: Order[] }> {
    const res = await fetch(`${API_BASE}/admin/orders`, { headers: getClientHeaders() });
    if (!res.ok) throw new Error('Failed to load orders');
    return res.json();
  },

  async getAdminUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getClientHeaders() });
    if (!res.ok) throw new Error('Failed to load users');
    return res.json();
  },

  // Advanced Admin User Management
  async createAdminUser(data: Partial<User> & { password?: string }): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: { ...getClientHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create user');
    }
    return res.json();
  },

  async updateAdminUser(id: string, updates: Partial<User> & { password?: string }): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: { ...getClientHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update user');
    }
    return res.json();
  },

  async deleteAdminUser(id: string): Promise<{ success: boolean; deletedSpotIds?: string[] }> {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getClientHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete user');
    }
    return res.json();
  },

  async deleteMyAccount(): Promise<{ success: boolean; message: string; deletedSpotIds?: string[] }> {
    const res = await fetch(`${API_BASE}/users/me`, {
      method: 'DELETE',
      headers: getClientHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete account');
    }
    return res.json();
  },

  async deleteAdminUsersBatch(ids: string[]): Promise<{ success: boolean; deletedCount: number; deletedSpotIds?: string[] }> {
    const res = await fetch(`${API_BASE}/admin/users/batch-delete`, {
      method: 'POST',
      headers: { ...getClientHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete selected users');
    }
    return res.json();
  },

  // Advanced Admin Spot God-Mode
  async updateAdminSpot(id: string, updates: Partial<Spot>): Promise<{ success: boolean; spot: Spot }> {
    const res = await fetch(`${API_BASE}/admin/spots/${id}`, {
      method: 'PUT',
      headers: { ...getClientHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update spot');
    }
    return res.json();
  },

  async repositionAdminSpot(id: string, coords: { x: number; y: number; rotation?: number }): Promise<{ success: boolean; spot: Spot }> {
    const res = await fetch(`${API_BASE}/admin/spots/${id}/reposition`, {
      method: 'POST',
      headers: { ...getClientHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(coords),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reposition spot');
    }
    return res.json();
  },

  // Advanced Admin Orders Management
  async updateAdminOrder(id: string, updates: Partial<Order>): Promise<{ success: boolean; order: Order }> {
    const res = await fetch(`${API_BASE}/admin/orders/${id}`, {
      method: 'PUT',
      headers: { ...getClientHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update order');
    }
    return res.json();
  },

  async deleteAdminOrder(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/orders/${id}`, {
      method: 'DELETE',
      headers: getClientHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete order');
    }
    return res.json();
  },

  // Advanced Admin Comments Management
  async getAdminComments(): Promise<{ comments: (Comment & { spotTitle?: string })[] }> {
    const res = await fetch(`${API_BASE}/admin/comments`, { headers: getClientHeaders() });
    if (!res.ok) throw new Error('Failed to load comments');
    return res.json();
  },

  async deleteAdminComment(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/comments/${id}`, {
      method: 'DELETE',
      headers: getClientHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete comment');
    return res.json();
  },

  // Advanced Admin Backups Management
  async getAdminBackups(): Promise<{ backups: { filename: string; sizeBytes: number; createdAt: string }[] }> {
    const res = await fetch(`${API_BASE}/admin/backups`, { headers: getClientHeaders() });
    if (!res.ok) throw new Error('Failed to load backups');
    return res.json();
  },

  async createAdminBackup(): Promise<{ success: boolean; filename: string }> {
    const res = await fetch(`${API_BASE}/admin/backups/create`, {
      method: 'POST',
      headers: getClientHeaders(),
    });
    if (!res.ok) throw new Error('Failed to create backup');
    return res.json();
  },

  async restoreAdminBackup(filename: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/admin/backups/restore`, {
      method: 'POST',
      headers: { ...getClientHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });
    if (!res.ok) throw new Error('Failed to restore backup');
    return res.json();
  },

  async getAdminActivities(): Promise<{ activities: any[] }> {
    const res = await fetch(`${API_BASE}/admin/activities`, { headers: getClientHeaders() });
    if (!res.ok) throw new Error('Failed to load activities');
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
    const res = await fetch(`${API_BASE}/admin/storage-stats`, { headers: getClientHeaders() });
    if (!res.ok) throw new Error('Failed to load storage report');
    return res.json();
  },
};
