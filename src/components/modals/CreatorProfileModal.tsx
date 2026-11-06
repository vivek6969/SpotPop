import React, { useState, useEffect } from 'react';
import { Spot, User } from '../../types';
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
    stats: { totalSpots: number; totalViews: number; totalShares: number };
    spots: Spot[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'big_pop' | 'mini_pop'>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    api.getCreatorProfile(username)
      .then((data) => {
        if (!cancelled) {
          setProfileData(data);
          setEditDisplayName(data.user.displayName || '');
          setEditBio(data.user.bio || '');
          setEditAvatarUrl(data.user.avatarUrl || '');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Could not load creator profile');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  if (!username) return null;

  const isSelf = currentUser && profileData?.user && (
    currentUser.id === profileData.user.id ||
    currentUser.username.toLowerCase() === profileData.user.username.toLowerCase()
  );

  const handleShareProfile = async () => {
    const url = `${window.location.origin}?creator=${encodeURIComponent(username)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileData?.user.displayName || username}'s SpotPop Profile`,
          text: `Check out ${profileData?.user.displayName || username}'s spots on the infinite SpotPop canvas!`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      console.warn('Clipboard write failed');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    setSavingEdit(true);
    try {
      const res = await api.updateCreatorProfile(authToken, {
        displayName: editDisplayName,
        bio: editBio,
        avatarUrl: editAvatarUrl,
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

  const displayedSpots = (profileData?.spots || []).filter((s) => {
    if (activeTab === 'all') return true;
    return s.tier === activeTab;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden mt-4 sm:mt-10 animate-fade-in text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-slate-400">spotpop.in/@{username}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareProfile}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
            >
              <span>{copiedLink ? '✓ Copied Link' : '🔗 Share Profile'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 no-scrollbar">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
              <span className="w-6 h-6 rounded-full border-2 border-[#FF2E93] border-t-transparent animate-spin" />
              <span>Loading creator profile...</span>
            </div>
          ) : error || !profileData ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              <p className="text-base text-white font-bold mb-1">Creator Not Found</p>
              <p className="text-xs text-slate-500">{error || 'This creator does not have any public spots yet.'}</p>
            </div>
          ) : (
            <>
              {/* Creator Header Profile Card */}
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF2E93] via-purple-600 to-amber-400 p-0.5 shadow-xl">
                      <div className="w-full h-full rounded-[14px] bg-[#12141F] flex items-center justify-center overflow-hidden">
                        {profileData.user.avatarUrl ? (
                          <img
                            src={profileData.user.avatarUrl}
                            alt={profileData.user.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-bold font-outfit text-white">
                            {profileData.user.displayName?.charAt(0).toUpperCase() || 'P'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <h2 className="text-xl font-bold font-outfit text-white truncate">
                            {profileData.user.displayName}
                          </h2>
                          <span className="text-xs bg-[#FF2E93]/20 text-[#FF5EAA] px-2 py-0.5 rounded-full font-bold border border-[#FF2E93]/30">
                            Verified Creator
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">@{profileData.user.username}</p>
                      </div>

                      {/* Edit Button if viewing own profile */}
                      {isSelf && (
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition-all self-center sm:self-start"
                        >
                          {isEditing ? 'Cancel Edit' : '✎ Edit Profile'}
                        </button>
                      )}
                    </div>

                    {/* Bio */}
                    {isEditing ? (
                      <form onSubmit={handleSaveProfile} className="mt-4 space-y-3">
                        <div>
                          <label className="text-[11px] text-slate-400 font-semibold block mb-1">Display Name</label>
                          <input
                            type="text"
                            value={editDisplayName}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-hidden focus:border-[#FF2E93]"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 font-semibold block mb-1">Avatar Image URL</label>
                          <input
                            type="url"
                            value={editAvatarUrl}
                            onChange={(e) => setEditAvatarUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-hidden focus:border-[#FF2E93]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 font-semibold block mb-1">Bio (max 280 chars)</label>
                          <textarea
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            rows={2}
                            maxLength={280}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-hidden focus:border-[#FF2E93]"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
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
                            className="px-4 py-1.5 rounded-xl bg-[#FF2E93] hover:bg-[#FF5EAA] text-white text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {savingEdit ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        {profileData.user.bio || 'Creator on SpotPop canvas.'}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-500 font-mono mt-2 flex items-center justify-center sm:justify-start gap-3">
                      <span>Joined {new Date(profileData.user.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}</span>
                      <span>·</span>
                      <span>Canvas Pioneer</span>
                    </div>
                  </div>
                </div>

                {/* Verified Genuine Metrics Row */}
                <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10 text-center">
                  <div className="p-2 rounded-2xl bg-black/30 border border-white/5">
                    <div className="text-base sm:text-lg font-bold font-outfit text-white">
                      {profileData.stats.totalSpots}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Spots Claimed
                    </div>
                  </div>
                  <div className="p-2 rounded-2xl bg-black/30 border border-white/5">
                    <div className="text-base sm:text-lg font-bold font-outfit text-white">
                      {profileData.stats.totalViews.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Total Views
                    </div>
                  </div>
                  <div className="p-2 rounded-2xl bg-black/30 border border-white/5">
                    <div className="text-base sm:text-lg font-bold font-outfit text-white">
                      {profileData.stats.totalShares.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Viral Shares
                    </div>
                  </div>
                </div>
              </div>

              {/* Spots Tabs & Gallery */}
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Published Spots ({displayedSpots.length})
                  </h3>

                  <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/10 text-xs">
                    {(['all', 'big_pop', 'mini_pop'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          activeTab === t
                            ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF5EAA] text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {t === 'all' ? 'All' : t === 'big_pop' ? 'Big Pop 📸' : 'Mini Pop 📝'}
                      </button>
                    ))}
                  </div>
                </div>

                {displayedSpots.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No spots in this tab.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {displayedSpots.map((spot) => (
                      <div
                        key={spot.id}
                        onClick={() => {
                          onSelectSpot(spot);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#FF2E93]/40 cursor-pointer transition-all flex items-center gap-3.5 group"
                      >
                        {/* Thumbnail */}
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-white/10"
                          style={{
                            backgroundColor: spot.shape === 'polaroid' ? '#FFFFFF' : spot.background || '#FEF08A',
                          }}
                        >
                          {spot.content.imageUrl ? (
                            <img
                              src={spot.content.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-2xl">
                              {spot.content.stickers?.[0]?.emojiOrIcon || '✨'}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate group-hover:text-[#FF5EAA] transition-colors">
                              {spot.content.headline || spot.creatorName}
                            </span>
                            {spot.tier === 'big_pop' ? (
                              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-xs bg-[#FF2E93]/20 text-[#FF5EAA]">
                                BIG
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-xs bg-yellow-400/20 text-yellow-300">
                                MINI
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 truncate mt-1">
                            {spot.content.text || spot.content.author || 'Permanent spot'}
                          </div>

                          <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-2">
                            <span>{(spot.viewsCount || 0).toLocaleString()} views</span>
                            <span>·</span>
                            <span>{(spot.sharesCount || 0).toLocaleString()} shares</span>
                          </div>
                        </div>

                        <div className="text-slate-500 group-hover:text-white text-xs font-bold shrink-0">
                          Fly →
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

