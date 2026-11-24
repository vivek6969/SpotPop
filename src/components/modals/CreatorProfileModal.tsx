import React, { useState, useEffect } from 'react';
import { Spot, User, FollowStatus, FollowRequestItem } from '../../types';
import { api } from '../../services/api';

interface CreatorProfileModalProps {
  username: string | null;
  currentUser?: User | null;
  authToken?: string | null;
  onClose: () => void;
  onSelectSpot: (spot: Spot) => void;
  onProfileUpdated?: (updatedUser: User) => void;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({
  username,
  currentUser,
  authToken,
  onClose,
  onSelectSpot,
  onProfileUpdated,
}) => {
  const [profileData, setProfileData] = useState<{
    user: User;
    stats: { totalSpots: number; totalViews: number; totalShares: number; followersCount?: number; followingCount?: number };
    followStatus?: FollowStatus;
    isFollowing?: boolean;
    isRequested?: boolean;
    isLockedAccount?: boolean;
    spots: Spot[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'tagged'>('posts');
  const [copiedLink, setCopiedLink] = useState(false);

  // Social & Follow state (Instagram logic)
  const [followStatus, setFollowStatus] = useState<FollowStatus>('not_following');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Network Modal (Followers / Following list)
  const [networkModalType, setNetworkModalType] = useState<'followers' | 'following' | null>(null);
  const [networkUsers, setNetworkUsers] = useState<Array<{ id: string; username: string; displayName: string; avatarUrl?: string }>>([]);
  const [networkSearch, setNetworkSearch] = useState('');
  const [networkLoading, setNetworkLoading] = useState(false);

  // Pending Follow Requests (when viewing self on Instagram)
  const [pendingRequests, setPendingRequests] = useState<FollowRequestItem[]>([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch creator profile
  const fetchProfile = () => {
    if (!username) return;
    setLoading(true);
    setError(null);

    api.getCreatorProfile(username)
      .then((data: any) => {
        setProfileData(data);
        setFollowStatus(data.followStatus || (data.isFollowing ? 'accepted' : 'not_following'));
        setFollowersCount(data.user?.followersCount ?? data.stats?.followersCount ?? 0);
        setFollowingCount(data.user?.followingCount ?? data.stats?.followingCount ?? 0);
        setEditDisplayName(data.user.displayName || '');
        setEditBio(data.user.bio || '');
        setEditAvatarUrl(data.user.avatarUrl || '');
        setEditWebsiteUrl(data.user.websiteUrl || '');
        setEditCategory(data.user.category || 'Creator');
        setEditIsPrivate(Boolean(data.user.isPrivate));
      })
      .catch((err) => {
        setError(err.message || 'Could not load creator profile');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  // Check if current user is viewing their own profile
  const isSelf = Boolean(
    currentUser && profileData?.user && (
      currentUser.id === profileData.user.id ||
      currentUser.username.toLowerCase() === profileData.user.username.toLowerCase()
    )
  );

  // If viewing self, load pending follow requests
  useEffect(() => {
    if (isSelf && profileData?.user?.username) {
      api.getFollowRequests(profileData.user.username, authToken || undefined)
        .then(res => setPendingRequests(res.requests || []))
        .catch(() => {});
    }
  }, [isSelf, profileData?.user?.username]);

  // Toggle Follow / Requested / Unfollow
  const handleToggleFollow = async () => {
    if (!profileData?.user?.username || followLoading) return;
    setFollowLoading(true);

    const prevStatus = followStatus;
    const prevFollowers = followersCount;

    // Optimistic UI update
    if (followStatus === 'not_following') {
      if (profileData.user.isPrivate) {
        setFollowStatus('pending');
      } else {
        setFollowStatus('accepted');
        setFollowersCount(prev => prev + 1);
      }
    } else {
      // Cancelling request or unfollowing
      setFollowStatus('not_following');
      if (followStatus === 'accepted') {
        setFollowersCount(prev => Math.max(0, prev - 1));
      }
    }

    try {
      const res = await api.followUser(profileData.user.username, authToken || undefined);
      setFollowStatus(res.followStatus);
      setFollowersCount(res.followersCount);
      setFollowingCount(res.followingCount);
      // Re-fetch profile spots if unlocked
      if (res.followStatus === 'accepted') {
        fetchProfile();
      }
    } catch {
      setFollowStatus(prevStatus);
      setFollowersCount(prevFollowers);
    } finally {
      setFollowLoading(false);
    }
  };

  // Open Network Modal
  const handleOpenNetwork = async (type: 'followers' | 'following') => {
    if (!profileData?.user?.username) return;
    setNetworkModalType(type);
    setNetworkLoading(true);
    setNetworkSearch('');
    try {
      const net = await api.getUserNetwork(profileData.user.username, authToken || undefined);
      setNetworkUsers(type === 'followers' ? net.followers : net.following);
    } catch (e) {
      console.warn('Network fetch error:', e);
    } finally {
      setNetworkLoading(false);
    }
  };

  // Accept a pending follow request
  const handleAcceptRequest = async (requestId: string) => {
    if (!profileData?.user?.username) return;
    setRequestsLoading(true);
    try {
      const res = await api.acceptFollowRequest(requestId, profileData.user.username, authToken || undefined);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      setFollowersCount(res.followersCount);
    } catch (e: any) {
      alert(e.message || 'Failed to accept request');
    } finally {
      setRequestsLoading(false);
    }
  };

  // Decline a pending follow request
  const handleDeclineRequest = async (requestId: string) => {
    if (!profileData?.user?.username) return;
    try {
      await api.declineFollowRequest(requestId, profileData.user.username, authToken || undefined);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (e: any) {
      alert(e.message || 'Failed to decline request');
    }
  };

  // Remove a follower (owner action)
  const handleRemoveFollower = async (followerId: string) => {
    if (!profileData?.user?.username) return;
    try {
      const res = await api.removeFollower(profileData.user.username, followerId, authToken || undefined);
      setNetworkUsers(prev => prev.filter(u => u.id !== followerId));
      setFollowersCount(res.followersCount);
    } catch (e: any) {
      alert(e.message || 'Failed to remove follower');
    }
  };

  // Share profile URL
  const handleShareProfile = async () => {
    const url = `${window.location.origin}?creator=${encodeURIComponent(username || '')}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileData?.user.displayName || username}'s SpotPop Profile`,
          text: `Check out ${profileData?.user.displayName || username}'s spots on the infinite SpotPop canvas!`,
          url,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {}
  };

  // Save profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    setSavingEdit(true);
    try {
      const res = await api.updateCreatorProfile(authToken, {
        displayName: editDisplayName,
        bio: editBio,
        avatarUrl: editAvatarUrl,
        websiteUrl: editWebsiteUrl,
        category: editCategory,
        isPrivate: editIsPrivate,
      });

      if (profileData) {
        setProfileData({
          ...profileData,
          user: {
            ...profileData.user,
            ...res.user,
          },
        });
      }

      if (onProfileUpdated) {
        onProfileUpdated(res.user);
      }
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSavingEdit(false);
    }
  };

  if (!username) return null;

  // Filter spots by tab
  const displayedSpots = (profileData?.spots || []).filter((s) => {
    if (activeTab === 'posts') return true;
    if (activeTab === 'reels') return s.tier === 'big_pop';
    return true;
  });

  // Check if account is locked to this viewer
  const isAccountLocked = Boolean(
    profileData?.user?.isPrivate &&
    !isSelf &&
    followStatus !== 'accepted'
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-[#10121C] border border-white/15 rounded-3xl shadow-2xl overflow-hidden mt-3 sm:mt-8 animate-fade-in text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Instagram Handle Bar */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/50">
          <div className="flex items-center gap-2 min-w-0">
            {profileData?.user?.isPrivate && (
              <span className="text-xs text-amber-400" title="Private Account">🔒</span>
            )}
            <span className="text-base font-bold text-white font-outfit tracking-tight truncate">
              {profileData?.user?.username || username}
            </span>
            {isSelf && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-slate-400 hover:text-white text-sm ml-1 transition-colors"
                title="Profile Settings"
              >
                ⚙️
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareProfile}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{copiedLink ? '✓ Copied' : '🔗 Share'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 no-scrollbar">
          {loading ? (
            <div className="py-24 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
              <span className="w-7 h-7 rounded-full border-2 border-[#FF2E93] border-t-transparent animate-spin" />
              <span>Loading profile...</span>
            </div>
          ) : error || !profileData ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              <p className="text-base text-white font-bold mb-1">Creator Not Found</p>
              <p className="text-xs text-slate-500">{error || 'This creator does not exist on the canvas.'}</p>
            </div>
          ) : (
            <>
              {/* Instagram Profile Header Strip */}
              <div className="flex items-center gap-4 sm:gap-8">
                {/* Profile Avatar with Instagram Gradient Ring & Note Bubble */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-[2.5px] bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] shadow-xl">
                    <div className="w-full h-full rounded-full bg-[#10121C] p-0.5 overflow-hidden flex items-center justify-center">
                      {profileData.user.avatarUrl ? (
                        <img
                          src={profileData.user.avatarUrl}
                          alt={profileData.user.displayName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-3xl font-black font-outfit text-white">
                          {profileData.user.displayName?.charAt(0).toUpperCase() || 'P'}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Instagram Note Bubble ("Note...") */}
                  <div className="absolute -top-3.5 -right-1 px-2 py-0.5 rounded-full bg-[#1E2235] border border-white/20 text-[10px] text-slate-200 shadow-md flex items-center gap-1 select-none pointer-events-none">
                    <span>💭</span>
                    <span className="font-medium text-[9px]">Note...</span>
                  </div>
                </div>

                {/* 3 Metric Columns: Posts | Followers | Following */}
                <div className="flex-1 flex items-center justify-around text-center">
                  <div>
                    <div className="text-base sm:text-lg font-bold text-white font-outfit">
                      {profileData.stats.totalSpots}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">posts</div>
                  </div>

                  <button
                    onClick={() => handleOpenNetwork('followers')}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="text-base sm:text-lg font-bold text-white font-outfit">
                      {followersCount.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">followers</div>
                  </button>

                  <button
                    onClick={() => handleOpenNetwork('following')}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="text-base sm:text-lg font-bold text-white font-outfit">
                      {followingCount.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">following</div>
                  </button>
                </div>
              </div>

              {/* User Bio Details */}
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white font-outfit">
                    {profileData.user.displayName}
                  </h2>
                  {profileData.user.isPrivate && (
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold">
                      Private
                    </span>
                  )}
                </div>

                {/* Category Badge (e.g. Product/service, Creator) */}
                <div className="text-xs text-slate-400 font-medium">
                  {profileData.user.category || 'Product/service'}
                </div>

                {/* Website Link */}
                {profileData.user.websiteUrl && (
                  <a
                    href={profileData.user.websiteUrl.startsWith('http') ? profileData.user.websiteUrl : `https://${profileData.user.websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#0095F6] hover:underline flex items-center gap-1"
                  >
                    <span>🔗</span>
                    <span>{profileData.user.websiteUrl.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}

                {/* Bio text */}
                <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed pt-0.5">
                  {profileData.user.bio || 'visit spotpop.in to get your pops online now.'}
                </p>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 pt-1">
                {isSelf ? (
                  <>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all text-center cursor-pointer border border-white/10"
                    >
                      {isEditing ? 'Cancel Edit' : 'Edit profile'}
                    </button>
                    <button
                      onClick={handleShareProfile}
                      className="flex-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all text-center cursor-pointer border border-white/10"
                    >
                      View archive
                    </button>
                  </>
                ) : (
                  <>
                    {/* Instagram Follow / Requested / Following Button */}
                    <button
                      onClick={handleToggleFollow}
                      disabled={followLoading}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-sm flex items-center justify-center gap-1.5 ${
                        followStatus === 'accepted'
                          ? 'bg-white/10 hover:bg-rose-500/20 text-white border border-white/20 hover:border-rose-500/40'
                          : followStatus === 'pending'
                          ? 'bg-white/15 hover:bg-white/25 text-amber-300 border border-amber-400/40'
                          : 'bg-[#0095F6] hover:bg-[#1877F2] text-white active:scale-98'
                      }`}
                    >
                      {followLoading ? (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : followStatus === 'accepted' ? (
                        <span>Following ⌵</span>
                      ) : followStatus === 'pending' ? (
                        <span>Requested ⏳</span>
                      ) : (
                        <span>Follow</span>
                      )}
                    </button>

                    <button
                      onClick={handleShareProfile}
                      className="flex-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all text-center cursor-pointer border border-white/10"
                    >
                      Share profile
                    </button>
                  </>
                )}
              </div>

              {/* Pending Follow Requests Banner (if owner and has requests) */}
              {isSelf && pendingRequests.length > 0 && (
                <div
                  onClick={() => setShowRequestsModal(true)}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#FF2E93]/20 to-purple-600/20 border border-amber-400/40 flex items-center justify-between cursor-pointer hover:brightness-110 transition-all shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">📬</span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Follow Requests</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-[#FF2E93] text-white text-[10px] font-bold">
                          {pendingRequests.length}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        {pendingRequests[0]?.displayName} and {pendingRequests.length - 1} others want to follow you
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-300">Review →</span>
                </div>
              )}

              {/* Edit Profile Form */}
              {isEditing && (
                <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 animate-fade-in text-left">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Edit Profile & Privacy</h3>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Category (e.g. Product/service, Creator)</label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      placeholder="Product/service"
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Website URL</label>
                    <input
                      type="text"
                      value={editWebsiteUrl}
                      onChange={(e) => setEditWebsiteUrl(e.target.value)}
                      placeholder="https://chatdora.in"
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Avatar Image URL</label>
                    <input
                      type="url"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Bio (max 280 chars)</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={2}
                      maxLength={280}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>

                  {/* Instagram Private Account Toggle */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>🔒 Private Account</span>
                      </div>
                      <p className="text-[10px] text-slate-400 max-w-xs mt-0.5">
                        When active, users must request to follow you. Only approved followers can see your pops.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditIsPrivate(!editIsPrivate)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        editIsPrivate ? 'bg-[#0095F6]' : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          editIsPrivate ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="px-4 py-1.5 rounded-xl bg-[#0095F6] hover:bg-[#1877F2] text-white text-xs font-bold"
                    >
                      {savingEdit ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              )}

              {/* Story Highlights Circles Row (Matching uploaded screenshot) */}
              <div className="flex items-center gap-4 overflow-x-auto py-2 no-scrollbar">
                {[
                  { name: 'affordable', img: '🏷️' },
                  { name: username || 'spotpop.in', img: '🌐' },
                  { name: 'exciting offer', img: '⚡' },
                  { name: 'New', img: '+', isAdd: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
                    <div className="w-14 h-14 rounded-full p-[2px] border border-white/20 group-hover:border-white/50 transition-colors flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-[#181B2A] flex items-center justify-center text-lg text-slate-200">
                        {item.img}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium truncate max-w-[64px]">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Instagram Post Tabs Bar: [Posts] [Reels] [Tagged] */}
              <div className="border-t border-white/10 pt-1">
                <div className="flex items-center justify-around">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`py-3 flex-1 flex items-center justify-center gap-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'posts'
                        ? 'border-white text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span>▦</span>
                    <span className="uppercase text-[11px]">POSTS</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('reels')}
                    className={`py-3 flex-1 flex items-center justify-center gap-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'reels'
                        ? 'border-white text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span>▶</span>
                    <span className="uppercase text-[11px]">REELS</span>
                  </button>
                </div>

                {/* Content Area: Private Account Screen VS Spots Grid */}
                {isAccountLocked ? (
                  /* Instagram Private Account Lock Screen */
                  <div className="py-16 text-center space-y-3 px-4">
                    <div className="w-16 h-16 rounded-full border-2 border-white/20 mx-auto flex items-center justify-center text-3xl">
                      🔒
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-outfit">
                        This account is private
                      </h3>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                        Follow this account to see their photos and canvas pops.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={handleToggleFollow}
                        disabled={followLoading}
                        className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
                          followStatus === 'pending'
                            ? 'bg-white/15 text-amber-300 border border-amber-400/30'
                            : 'bg-[#0095F6] hover:bg-[#1877F2] text-white'
                        }`}
                      >
                        {followStatus === 'pending' ? 'Requested ⏳' : '+ Follow to Unlock'}
                      </button>
                    </div>
                  </div>
                ) : displayedSpots.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs">
                    No pops published yet.
                  </div>
                ) : (
                  /* Instagram 3-Column Square Grid */
                  <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-3">
                    {displayedSpots.map((spot) => (
                      <div
                        key={spot.id}
                        onClick={() => {
                          onSelectSpot(spot);
                          onClose();
                        }}
                        className="aspect-square relative bg-[#1E2235] rounded-xl overflow-hidden cursor-pointer group shadow-sm border border-white/5"
                      >
                        {spot.content.imageUrl ? (
                          <img
                            src={spot.content.imageUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
                            style={{ background: spot.background || '#FEF08A' }}
                          >
                            <span className="text-2xl">
                              {spot.content.stickers?.[0]?.emojiOrIcon || '✨'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-900 truncate max-w-full mt-1">
                              {spot.content.headline || spot.creatorName}
                            </span>
                          </div>
                        )}

                        {/* Top Tier Badge or Audio Badge */}
                        {spot.tier === 'big_pop' && (
                          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold backdrop-blur-xs">
                            ▶
                          </span>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                          <span>❤️ {spot.likesCount || 0}</span>
                          <span>💬 {spot.commentsCount || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Network Users (Followers / Following) Sheet */}
        {networkModalType && (
          <div
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:justify-center p-3 sm:p-6 animate-fade-in"
            onClick={() => setNetworkModalType(null)}
          >
            <div
              className="bg-[#181B2A] border border-white/15 rounded-3xl p-5 w-full max-w-sm mx-auto shadow-2xl flex flex-col max-h-[75vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="text-sm font-bold text-white capitalize font-outfit flex items-center gap-2">
                  <span>{networkModalType === 'followers' ? 'Followers' : 'Following'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                    {networkUsers.length}
                  </span>
                </h4>
                <button
                  onClick={() => setNetworkModalType(null)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Search Bar */}
              <div className="pt-3">
                <input
                  type="text"
                  value={networkSearch}
                  onChange={(e) => setNetworkSearch(e.target.value)}
                  placeholder={`Search ${networkModalType}...`}
                  className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-hidden focus:border-[#0095F6]"
                />
              </div>

              {/* User List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2 no-scrollbar">
                {networkLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-[#0095F6] border-t-transparent animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : networkUsers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No {networkModalType} yet.
                  </div>
                ) : (
                  networkUsers
                    .filter(u =>
                      u.displayName.toLowerCase().includes(networkSearch.toLowerCase()) ||
                      u.username.toLowerCase().includes(networkSearch.toLowerCase())
                    )
                    .map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                            ) : (
                              u.displayName?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="text-xs font-bold text-white truncate">{u.displayName}</div>
                            <div className="text-[10px] text-slate-400 truncate font-mono">@{u.username}</div>
                          </div>
                        </div>

                        {/* If viewing own followers: Remove Button */}
                        {isSelf && networkModalType === 'followers' && (
                          <button
                            onClick={() => handleRemoveFollower(u.id)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 text-[11px] font-semibold transition-all cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Follow Requests Modal (When owner clicks banner) */}
        {showRequestsModal && (
          <div
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center p-3 sm:p-6 animate-fade-in"
            onClick={() => setShowRequestsModal(false)}
          >
            <div
              className="bg-[#181B2A] border border-white/15 rounded-3xl p-5 w-full max-w-md mx-auto shadow-2xl flex flex-col max-h-[75vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
                  <span>📬 Pending Follow Requests</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF2E93] text-white">
                    {pendingRequests.length}
                  </span>
                </h4>
                <button
                  onClick={() => setShowRequestsModal(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 no-scrollbar">
                {pendingRequests.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No pending follow requests right now.
                  </div>
                ) : (
                  pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF2E93] to-amber-500 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                          {req.avatarUrl ? (
                            <img src={req.avatarUrl} alt={req.displayName} className="w-full h-full object-cover" />
                          ) : (
                            req.displayName?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate">{req.displayName}</div>
                          <div className="text-[10px] text-slate-400 truncate font-mono">@{req.username}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          disabled={requestsLoading}
                          className="px-3 py-1 rounded-xl bg-[#0095F6] hover:bg-[#1877F2] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req.id)}
                          disabled={requestsLoading}
                          className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorProfileModal;
