import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { User, Spot, FollowRequestItem } from '../../types';
import { api } from '../../services/api';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  authToken?: string | null;
  allSpots: Spot[];
  onSelectSpot: (spot: Spot) => void;
  onOpenCreatorProfile?: (username: string) => void;
  onRequireLogin?: () => void;
  onFollowChange?: (creatorName: string, isFollowing: boolean) => void;
  onRefreshSpots?: () => void;
}

type NetworkUser = { id: string; username: string; displayName: string; avatarUrl?: string };
type DiscoverUser = { id: string; username: string; displayName: string; avatarUrl?: string; spotCount: number };

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  authToken,
  allSpots,
  onSelectSpot,
  onOpenCreatorProfile,
  onRequireLogin,
  onFollowChange,
  onRefreshSpots,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'feed' | 'discover'>('friends');
  const [following, setFollowing] = useState<NetworkUser[]>([]);
  const [followers, setFollowers] = useState<NetworkUser[]>([]);
  const [requests, setRequests] = useState<FollowRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [discoverResults, setDiscoverResults] = useState<DiscoverUser[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchNetworkData = async () => {
    if (!currentUser?.username) return;
    setLoading(true);
    try {
      const [networkRes, requestsRes] = await Promise.allSettled([
        api.getUserNetwork(currentUser.username),
        api.getFollowRequests(currentUser.username, authToken || undefined),
      ]);

      if (networkRes.status === 'fulfilled') {
        setFollowing(networkRes.value.following || []);
        setFollowers(networkRes.value.followers || []);
      }
      if (requestsRes.status === 'fulfilled') {
        setRequests(requestsRes.value.requests || []);
      }
    } catch (e: any) {
      console.warn('Network fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNetworkData();
    }
  }, [isOpen, currentUser?.username]);

  // Handle Accept Friend Request
  const handleAcceptRequest = async (requestId: string) => {
    if (!currentUser?.username) return;
    setActionLoadingId(requestId);
    try {
      const res = await api.acceptFollowRequest(requestId, currentUser.username, authToken || undefined);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      showToast(`Accepted ${res.followerName}'s friend request! 🎉`, 'success');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00F0FF', '#FF2E93', '#FFE600'],
      });
      fetchNetworkData();
      onRefreshSpots?.();
    } catch (e: any) {
      showToast(e.message || 'Failed to accept request', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Decline Friend Request
  const handleDeclineRequest = async (requestId: string) => {
    if (!currentUser?.username) return;
    setActionLoadingId(requestId);
    try {
      await api.declineFollowRequest(requestId, currentUser.username, authToken || undefined);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      showToast('Friend request declined', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to decline request', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Unfollow
  const handleUnfollow = async (targetUsername: string) => {
    setActionLoadingId(targetUsername);
    try {
      await api.unfollowUser(targetUsername, authToken || undefined);
      setFollowing(prev => prev.filter(u => u.username !== targetUsername && u.id !== targetUsername));
      showToast(`Unfollowed @${targetUsername}`, 'success');
      onFollowChange?.(targetUsername, false);
      onRefreshSpots?.();
    } catch (e: any) {
      showToast(e.message || 'Failed to unfollow', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Follow from Discover
  const handleFollowFromDiscover = async (targetUsername: string) => {
    if (!currentUser) {
      onRequireLogin?.();
      return;
    }
    setActionLoadingId(targetUsername);
    try {
      const res = await api.followUser(targetUsername, authToken || undefined);
      if (res.followStatus === 'accepted' || res.isFollowing) {
        showToast(`Now following @${targetUsername}! ✨`, 'success');
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FF2E93', '#00F0FF'],
        });
        onFollowChange?.(targetUsername, true);
        fetchNetworkData();
        onRefreshSpots?.();
      } else if (res.followStatus === 'pending' || res.isRequested) {
        showToast(`Friend request sent to @${targetUsername}! 📩`, 'success');
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to follow user', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Search Discover
  useEffect(() => {
    if (activeTab !== 'discover' || !searchQuery.trim()) {
      setDiscoverResults([]);
      return;
    }
    const clean = searchQuery.trim().replace(/^@/, '');
    setLoadingDiscover(true);
    api.getSuggestions(clean, 'users')
      .then(res => {
        const users = (res.users || []).filter(u => u.username !== currentUser?.username);
        setDiscoverResults(users);
      })
      .catch(() => setDiscoverResults([]))
      .finally(() => setLoadingDiscover(false));
  }, [searchQuery, activeTab, currentUser?.username]);

  if (!isOpen) return null;

  // Filtered following
  const filteredFollowing = following.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Friends' spots
  const followingUsernames = new Set(following.map(u => u.username.toLowerCase()));
  const followingIds = new Set(following.map(u => u.id.toLowerCase()));
  const friendsSpots = allSpots.filter(s =>
    followingUsernames.has(s.creatorName.toLowerCase()) ||
    (s.ownerId && followingIds.has(s.ownerId.toLowerCase()))
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#141724] to-[#0A0C14] border border-white/15 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00F0FF]/20 to-[#FF2E93]/20 border border-white/15 flex items-center justify-center text-xl shadow-inner">
              👥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-outfit font-bold text-base text-white tracking-tight">
                  Friends & Connections
                </h3>
                {requests.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#00F0FF] text-black text-[10px] font-black uppercase tracking-wider animate-pulse">
                    {requests.length} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Mutual connections & unlocked Friends-Only canvas spots
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Floating Toast inside Modal */}
        {toast && (
          <div className={`mx-4 mt-3 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border animate-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          }`}>
            <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Tab Navigation Pill Bar */}
        <div className="px-4 pt-3 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'friends'
                  ? 'bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>👥 Friends</span>
              <span className="text-[10px] opacity-75">({following.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-[#00F0FF] to-[#0095F6] text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📬 Requests</span>
              {requests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#FF2E93] text-white text-[9px] font-black">
                  {requests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'feed'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🌟 Pops</span>
              <span className="text-[10px] opacity-75">({friendsSpots.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'discover'
                  ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🔍 Find</span>
            </button>
          </div>
        </div>

        {/* Tab Contents Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {!currentUser ? (
            <div className="py-12 text-center space-y-3">
              <div className="text-3xl">🔒</div>
              <h4 className="text-sm font-bold text-white">Sign In to Connect with Friends</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Sign in to your account to follow friends, unlock their Friends-Only pops, and share private memories.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequireLogin?.();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white font-bold text-xs shadow-lg shadow-pink-500/25 active:scale-95 transition-all cursor-pointer"
              >
                Sign In to SpotPop →
              </button>
            </div>
          ) : activeTab === 'friends' ? (
            // ================= 1. FRIENDS / FOLLOWING TAB =================
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search following..."
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:border-[#FF2E93] focus:bg-white/10 focus:outline-hidden transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {loading ? (
                <div className="py-10 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#FF2E93] border-t-transparent rounded-full animate-spin" />
                  <span>Loading connections...</span>
                </div>
              ) : filteredFollowing.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                  <div className="text-2xl">👥</div>
                  <p>
                    {searchQuery ? 'No matching friends found.' : "You haven't followed any creators yet."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('discover')}
                    className="text-[#00F0FF] hover:underline font-bold text-xs"
                  >
                    Find creators to follow →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFollowing.map((u) => {
                    const friendSpots = allSpots.filter(s =>
                      s.creatorName.toLowerCase() === u.username.toLowerCase() ||
                      (s.ownerId && s.ownerId.toLowerCase() === u.id.toLowerCase())
                    );
                    const firstSpot = friendSpots[0];

                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                      >
                        <div
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          onClick={() => {
                            onClose();
                            onOpenCreatorProfile?.(u.username);
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-xs ring-1 ring-white/20">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              u.displayName?.charAt(0).toUpperCase() || u.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="text-xs font-bold text-white truncate group-hover:text-pink-300 transition-colors">
                              {u.displayName || u.username}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              @{u.username} • {friendSpots.length} {friendSpots.length === 1 ? 'Pop' : 'Pops'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {firstSpot && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectSpot(firstSpot);
                                onClose();
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="Fly to their spot on canvas"
                            >
                              <span>🎯</span>
                              <span className="hidden sm:inline">Wall</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={actionLoadingId === u.username}
                            onClick={() => handleUnfollow(u.username)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-semibold transition-all cursor-pointer group/btn"
                            title="Click to unfollow"
                          >
                            {actionLoadingId === u.username ? (
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                            ) : (
                              <span>Following ⌵</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'requests' ? (
            // ================= 2. FRIEND REQUESTS TAB =================
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/25 flex items-center gap-2 text-xs text-[#00F0FF]">
                <span>📬</span>
                <span>
                  Incoming friend requests. Once accepted, you both unlock each other&apos;s Friends-Only Pops on the canvas!
                </span>
              </div>

              {requests.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                  <div className="text-2xl">✨</div>
                  <p>No pending friend requests. You are all caught up!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/15 shadow-sm"
                    >
                      <div
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                        onClick={() => {
                          onClose();
                          onOpenCreatorProfile?.(req.username);
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00F0FF] to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                          {req.avatarUrl ? (
                            <img src={req.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            req.displayName?.charAt(0).toUpperCase() || req.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="text-xs font-bold text-white truncate">{req.displayName}</div>
                          <div className="text-[10px] text-slate-400 truncate">@{req.username}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleAcceptRequest(req.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0095F6] to-[#00F0FF] text-black font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                        >
                          {actionLoadingId === req.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span>Confirm</span>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleDeclineRequest(req.id)}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'feed' ? (
            // ================= 3. FRIENDS' POPS TAB =================
            <div className="space-y-3">
              {friendsSpots.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                  <div className="text-2xl">🌟</div>
                  <p>Your friends haven&apos;t posted any Pops yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {friendsSpots.map((spot) => (
                    <div
                      key={spot.id}
                      onClick={() => {
                        onSelectSpot(spot);
                        onClose();
                      }}
                      className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/40 transition-all cursor-pointer group flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-pink-400">@{spot.creatorName}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300 uppercase font-semibold text-[9px]">
                          {spot.visibility === 'friends_only' ? '👥 Friends Only' : '🌍 Public'}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-2">
                        {spot.content?.headline || spot.title || 'Untitled Pop'}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                        <span>{spot.tier === 'big_pop' ? 'Big Pop' : 'Mini Pop'}</span>
                        <span className="text-[#00F0FF] font-semibold group-hover:underline">
                          View on Canvas →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // ================= 4. FIND / DISCOVER FRIENDS TAB =================
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type @username or creator name..."
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:border-[#FF2E93] focus:bg-white/10 focus:outline-hidden transition-all"
                  autoFocus
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
              </div>

              {loadingDiscover ? (
                <div className="py-10 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#FF2E93] border-t-transparent rounded-full animate-spin" />
                  <span>Searching creators...</span>
                </div>
              ) : discoverResults.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  {searchQuery ? 'No matching creators found.' : 'Search creators to send friend requests!'}
                </div>
              ) : (
                <div className="space-y-2">
                  {discoverResults.map((u) => {
                    const isAlreadyFollowing = followingUsernames.has(u.username.toLowerCase());
                    return (
                      <div
                        key={u.id || u.username}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
                      >
                        <div
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          onClick={() => {
                            onClose();
                            onOpenCreatorProfile?.(u.username);
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF2E93] to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              u.displayName?.charAt(0).toUpperCase() || u.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="text-xs font-bold text-white truncate">{u.displayName || u.username}</div>
                            <div className="text-[10px] text-slate-400 truncate">@{u.username}</div>
                          </div>
                        </div>

                        <div>
                          {isAlreadyFollowing ? (
                            <span className="px-3 py-1.5 rounded-xl bg-white/10 text-slate-400 text-xs font-semibold">
                              Friends ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={actionLoadingId === u.username}
                              onClick={() => handleFollowFromDiscover(u.username)}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white font-bold text-xs shadow-md shadow-pink-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                            >
                              {actionLoadingId === u.username ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span>+ Follow</span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
