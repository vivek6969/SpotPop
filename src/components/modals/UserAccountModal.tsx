import React, { useState, useEffect } from 'react';
import { User, Spot } from '../../types';
import { api } from '../../services/api';
import { SpotPopLogo } from '../brand/SpotPopLogo';
import { validateInstagramUsername } from '../../utils/instagramUsername';
import { ConfirmModal } from '../common/ConfirmModal';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  allSpots: Spot[];
  noticeMessage?: string | null;
  onLoginSuccess: (user: User, token: string) => void;
  onLogout: () => void;
  onSelectSpot: (spot: Spot) => void;
  onEditSpot?: (spot: Spot) => void;
  onDeleteSpot?: (spot: Spot) => void;
  onStartCreate?: () => void;
  onOpenCreatorProfile?: (username: string) => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allSpots,
  noticeMessage,
  onLoginSuccess,
  onLogout,
  onSelectSpot,
  onEditSpot,
  onDeleteSpot,
  onStartCreate,
  onOpenCreatorProfile,
}) => {
  if (!isOpen) return null;

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regUsernameCheck, setRegUsernameCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
  }>({ checking: false, available: null, error: null });

  // Debounced check for registration username
  useEffect(() => {
    if (!username) {
      setRegUsernameCheck({ checking: false, available: null, error: null });
      return;
    }

    const val = validateInstagramUsername(username);
    if (!val.isValid) {
      setRegUsernameCheck({ checking: false, available: false, error: val.error || null });
      return;
    }

    setRegUsernameCheck({ checking: true, available: null, error: null });
    const timer = setTimeout(async () => {
      try {
        const res = await api.checkUsername(username);
        setRegUsernameCheck({
          checking: false,
          available: res.available,
          error: res.error || null,
        });
      } catch {
        setRegUsernameCheck({ checking: false, available: null, error: null });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username]);

  // Social & Follow stats
  const [networkModalType, setNetworkModalType] = useState<'followers' | 'following' | null>(null);
  const [networkUsers, setNetworkUsers] = useState<Array<{ id: string; username: string; displayName: string; avatarUrl?: string }>>([]);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkCounts, setNetworkCounts] = useState<{ followers: number; following: number }>({ followers: 0, following: 0 });
  const [isPrivateAccount, setIsPrivateAccount] = useState<boolean>(Boolean(currentUser?.isPrivate));

  const handleTogglePrivacy = async () => {
    if (!currentUser?.username) return;
    const nextVal = !isPrivateAccount;
    setIsPrivateAccount(nextVal);
    try {
      await api.updateAccountPrivacy(currentUser.username, nextVal);
    } catch {
      setIsPrivateAccount(!nextVal);
    }
  };

  useEffect(() => {
    if (!currentUser?.username) return;
    api.getUserNetwork(currentUser.username)
      .then(res => {
        setNetworkCounts({ followers: res.followersCount || 0, following: res.followingCount || 0 });
      })
      .catch(() => { });
  }, [currentUser?.username]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deletion confirmation dialog
  const [spotToDelete, setSpotToDelete] = useState<Spot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await api.deleteMyAccount();
      setShowDeleteAccountConfirm(false);
      onLogout();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email, password || undefined);
      if (rememberMe) {
        localStorage.setItem('spotpop_token', res.token);
      }
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setError(null);
    setEmail(demoEmail);
    setPassword('demo123');
    setLoading(true);
    try {
      const res = await api.login(demoEmail, 'demo123');
      if (rememberMe) {
        localStorage.setItem('spotpop_token', res.token);
      }
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Quick demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !displayName) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password && confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.register({
        email,
        username,
        displayName,
        password: password || undefined,
      });
      if (rememberMe) {
        localStorage.setItem('spotpop_token', res.token);
      }
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!spotToDelete) return;
    setIsDeleting(true);
    try {
      if (onDeleteSpot) {
        await onDeleteSpot(spotToDelete);
      }
      setSpotToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete Pop.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Find user's owned spots
  const userSpots = currentUser
    ? allSpots.filter(s =>
      s.ownerId === currentUser.id ||
      currentUser.ownedSpotIds?.includes(s.id) ||
      s.creatorName.toLowerCase() === currentUser.displayName.toLowerCase() ||
      s.creatorName.toLowerCase() === currentUser.username.toLowerCase()
    )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto animate-fade-in">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/40">
          <div className="flex items-center gap-2.5">
            <SpotPopLogo variant="icon" size={26} />
            <div>
              <h3 className="font-outfit font-bold text-base text-white leading-tight">
                {currentUser ? 'Your SpotPop Account' : 'Welcome to SpotPop'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentUser
                  ? 'Manage your personal spots and canvas profile'
                  : 'Join thousands of creators leaving their mark'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {/* Guest Action Prompt Banner if directed from an action */}
          {!currentUser && noticeMessage && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FF2E93]/20 to-purple-600/20 border border-[#FF2E93]/40 text-pink-100 text-xs flex items-center gap-3 shadow-lg">
              <span className="text-xl shrink-0">🔒</span>
              <div className="font-medium leading-relaxed">{noticeMessage}</div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-300 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {currentUser ? (
            // ================= LOGGED IN USER VIEW =================
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#FF2E93] via-purple-500 to-amber-400 flex items-center justify-center text-xl font-bold text-white shadow-md shrink-0 overflow-hidden">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base truncate">
                      {currentUser.displayName}
                    </span>
                    {currentUser.role === 'admin' && (
                      <span className="px-2 py-0.5 rounded-md bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[10px] font-bold uppercase shrink-0">
                        Admin
                      </span>
                    )}
                    {onOpenCreatorProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCreatorProfile(currentUser.username);
                        }}
                        className="ml-auto px-2.5 py-1 rounded-xl bg-white/10 hover:bg-[#FF2E93]/20 text-slate-200 hover:text-white text-xs font-semibold transition-all border border-white/10 cursor-pointer"
                      >
                        View Profile →
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">
                    @{currentUser.username} · {currentUser.email}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Member since {new Date(currentUser.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!currentUser?.username) return;
                        setNetworkModalType('followers');
                        setNetworkLoading(true);
                        try {
                          const net = await api.getUserNetwork(currentUser.username);
                          setNetworkUsers(net.followers);
                        } finally {
                          setNetworkLoading(false);
                        }
                      }}
                      className="text-xs font-semibold text-slate-300 hover:text-[#FF2E93] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span className="font-bold text-white">{networkCounts.followers}</span> Followers
                      <span className="text-[8px] opacity-60">↗</span>
                    </button>
                    <span className="text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!currentUser?.username) return;
                        setNetworkModalType('following');
                        setNetworkLoading(true);
                        try {
                          const net = await api.getUserNetwork(currentUser.username);
                          setNetworkUsers(net.following);
                        } finally {
                          setNetworkLoading(false);
                        }
                      }}
                      className="text-xs font-semibold text-slate-300 hover:text-purple-400 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span className="font-bold text-white">{networkCounts.following}</span> Following
                      <span className="text-[8px] opacity-60">↗</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Instagram Private Account Setting */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🔒</span>
                  <div>
                    <div className="text-xs font-bold text-white">Private Account</div>
                    <div className="text-[10px] text-slate-400">
                      When active, users must request to follow you. Only approved followers can see your pops.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePrivacy}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${isPrivateAccount ? 'bg-[#0095F6]' : 'bg-white/20'
                    }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isPrivateAccount ? 'right-0.5' : 'left-0.5'
                      }`}
                  />
                </button>
              </div>

              {/* Owned Spots List Header */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <span>Your Claimed Pops</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FF2E93]/20 text-[#FF5EAA] text-[10px] font-bold">
                      {userSpots.length}
                    </span>
                  </h4>

                  {onStartCreate && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onStartCreate();
                      }}
                      className="text-xs font-bold text-[#FF2E93] hover:text-[#FF5EAA] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Create Another Pop</span>
                    </button>
                  )}
                </div>

                {userSpots.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center space-y-3">
                    <div className="text-2xl">🎨</div>
                    <div className="text-xs text-slate-300 font-medium">
                      You haven&apos;t claimed a spot yet!
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Place your permanent note, photo, drawing, or voice message on the world canvas.
                    </p>
                    {onStartCreate && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onStartCreate();
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white font-bold text-xs shadow-lg shadow-pink-500/20 active:scale-95 transition-all cursor-pointer"
                      >
                        Claim Your First Spot →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                    {userSpots.map((spot) => (
                      <div
                        key={spot.id}
                        className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/10 transition-all flex items-center justify-between gap-3 group"
                      >
                        {/* Spot Info */}
                        <div
                          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                          onClick={() => {
                            onSelectSpot(spot);
                            onClose();
                          }}
                          title="Fly to this spot on canvas"
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border border-white/15 shadow-sm"
                            style={{
                              background: spot.background?.startsWith('#') ? spot.background : '#1E293B',
                            }}
                          >
                            {spot.tier === 'big_pop' ? (spot.content.imageUrl ? '📸' : spot.content.audio ? '🎙️' : '🎨') : '📝'}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white text-xs truncate group-hover:text-[#FF5EAA] transition-colors">
                              {spot.content.headline || spot.creatorName}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-semibold text-slate-300">
                                {spot.tier === 'big_pop' ? 'Big Pop' : 'Mini Pop'}
                              </span>
                              <span>•</span>
                              <span>{(spot.viewsCount || 0).toLocaleString()} views</span>
                              {spot.content.audio && <span>• 🎙️ Audio</span>}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Fly, Edit, Delete */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Fly to spot */}
                          <button
                            type="button"
                            onClick={() => {
                              onSelectSpot(spot);
                              onClose();
                            }}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
                            title="Center & Highlight on Canvas"
                          >
                            🎯
                          </button>

                          {/* Edit spot */}
                          {onEditSpot && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onEditSpot(spot);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF2E93]/20 to-purple-600/20 hover:from-[#FF2E93]/40 hover:to-purple-600/40 text-pink-200 border border-[#FF2E93]/30 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                              title="Edit headline, stickers, photo, background, and audio"
                            >
                              <span>✏️</span>
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                          )}

                          {/* Delete spot */}
                          {onDeleteSpot && (
                            <button
                              type="button"
                              onClick={() => setSpotToDelete(spot)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/20 transition-colors cursor-pointer text-xs"
                              title="Delete Pop"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Account Actions & Danger Zone */}
              <div className="pt-3 border-t border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Signed in as @{currentUser.username}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>Danger Zone</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Permanently delete account & all owned canvas spots
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteAccountConfirm(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // ================= GUEST LOGIN / REGISTER VIEW =================
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${tab === 'login'
                    ? 'bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${tab === 'register'
                    ? 'bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Create Account
                </button>
              </div>

              {tab === 'login' ? (
                // SIGN IN FORM
                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email or Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. vivek@spotpop.in or vivek"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-[#FF2E93] focus:bg-white/10 focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Password
                      </label>
                      <span className="text-[10px] text-slate-500">
                        (Demo accounts can use any password)
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-[#FF2E93] focus:bg-white/10 focus:outline-hidden transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded-md accent-[#FF2E93] cursor-pointer"
                      />
                      <span className="text-xs text-slate-300 font-medium">Remember me</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white font-bold text-sm shadow-lg shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <span>Sign In to SpotPop →</span>
                    )}
                  </button>

                  {/* 1-Click Demo Accounts */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider text-center">
                      Quick 1-Click Demo Sign In
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin('vivek@spotpop.in')}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all cursor-pointer group"
                      >
                        <div className="text-base group-hover:scale-110 transition-transform">⚡</div>
                        <div className="text-xs font-bold text-white mt-0.5">Vivek</div>
                        <div className="text-[9px] text-slate-400">Creator</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin('admin@spotpop.in')}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all cursor-pointer group"
                      >
                        <div className="text-base group-hover:scale-110 transition-transform">👑</div>
                        <div className="text-xs font-bold text-white mt-0.5">Admin</div>
                        <div className="text-[9px] text-slate-400">Moderator</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin('riya@spotpop.in')}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all cursor-pointer group"
                      >
                        <div className="text-base group-hover:scale-110 transition-transform">🌸</div>
                        <div className="text-xs font-bold text-white mt-0.5">Riya</div>
                        <div className="text-[9px] text-slate-400">Artist</div>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                // REGISTER FORM
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Vivek Rathod"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-[#FF2E93] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Username (Instagram Handle)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {username.length}/30
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">@</span>
                      <input
                        type="text"
                        value={username}
                        maxLength={30}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                        placeholder="vivek"
                        required
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm font-mono focus:border-[#FF2E93] focus:outline-hidden"
                      />
                    </div>
                    {/* Live Validation & Availability Status Badge */}
                    <div className="mt-1 text-[11px] min-h-[16px]">
                      {regUsernameCheck.checking ? (
                        <span className="text-slate-400 flex items-center gap-1">
                          <span>⏳</span>
                          <span>Checking availability...</span>
                        </span>
                      ) : regUsernameCheck.available === true ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <span>✓</span>
                          <span>@{username} is available</span>
                        </span>
                      ) : regUsernameCheck.error ? (
                        <span className="text-rose-400 font-medium flex items-center gap-1">
                          <span>✕</span>
                          <span>{regUsernameCheck.error}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          3-30 letters, numbers, periods, and underscores.
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. vivek@gmail.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-[#FF2E93] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Choose a password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-[#FF2E93] focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        {showPassword ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type your password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-[#FF2E93] focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white font-bold text-sm shadow-lg shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <span>Create Account & Join SpotPop →</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Spot Confirmation Modal */}
      <ConfirmModal
        isOpen={!!spotToDelete}
        title="Delete This Pop?"
        message={spotToDelete ? `Are you sure you want to permanently delete "${spotToDelete.content.headline || spotToDelete.creatorName}"? This will permanently remove the Pop and free up its space on the canvas.` : ''}
        confirmText="Yes, Delete Pop"
        cancelText="Cancel"
        danger={true}
        warningBadge="Permanent action. The spot and all its content will be removed."
        icon="🗑️"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSpotToDelete(null)}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Log Out of SpotPop?"
        message={`Are you sure you want to log out from @${currentUser?.username}? You can log back in anytime.`}
        confirmText="Log Out"
        cancelText="Cancel"
        danger={false}
        icon="🚪"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
          onClose();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Delete Account Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteAccountConfirm}
        title="Delete Your Account Permanently?"
        message={`Are you sure you want to permanently delete your account (@${currentUser?.username})?`}
        confirmText="Yes, Delete Everything"
        cancelText="Cancel"
        danger={true}
        warningBadge="⚠️ PERMANENT DANGER: All your published Spots on the canvas, likes, comments, and profile data will be permanently wiped immediately. This cannot be undone."
        icon="💥"
        isLoading={isDeletingAccount}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteAccountConfirm(false)}
      />
      {/* Network Modal Sheet (Followers / Following) */}
      {networkModalType && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setNetworkModalType(null)}
        >
          <div
            className="bg-[#1A1D2D] border border-white/15 rounded-3xl p-5 w-full max-w-sm shadow-2xl flex flex-col max-h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-bold text-white capitalize font-outfit flex items-center gap-2">
                <span>{networkModalType === 'followers' ? '👥 Followers' : '✨ Following'}</span>
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

            <div className="flex-1 overflow-y-auto py-3 space-y-2 no-scrollbar">
              {networkLoading ? (
                <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-[#FF2E93] border-t-transparent animate-spin" />
                  <span>Loading network...</span>
                </div>
              ) : networkUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No {networkModalType} yet.
                </div>
              ) : (
                networkUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                        ) : (
                          u.displayName?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{u.displayName}</div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">@{u.username}</div>
                      </div>
                    </div>

                    {networkModalType === 'followers' && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!currentUser?.username) return;
                          try {
                            await api.removeFollower(currentUser.username, u.id);
                            setNetworkUsers(prev => prev.filter(x => x.id !== u.id));
                            setNetworkCounts(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
                          } catch (e: any) {
                            setError(e.message || 'Failed to remove follower');
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    )}

                    {networkModalType === 'following' && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const target = u.username || u.id;
                            await api.unfollowUser(target);
                            setNetworkUsers(prev => prev.filter(x => x.id !== u.id && x.username !== u.username));
                            setNetworkCounts(prev => ({ ...prev, following: Math.max(0, prev.following - 1) }));
                            try {
                              const saved = localStorage.getItem('spotpop_followed_creators');
                              const set = saved ? new Set(JSON.parse(saved)) : new Set();
                              set.delete(target);
                              if (u.username) set.delete(u.username);
                              if (u.id) set.delete(u.id);
                              localStorage.setItem('spotpop_followed_creators', JSON.stringify(Array.from(set)));
                            } catch { }
                          } catch (e: any) {
                            setError(e.message || 'Failed to unfollow user');
                          }
                        }}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/15 hover:border-rose-500/40 text-[10px] font-semibold transition-all cursor-pointer group flex items-center gap-1"
                        title="Click to unfollow this creator"
                      >
                        <span className="group-hover:hidden">Following ⌵</span>
                        <span className="hidden group-hover:inline text-rose-400">Unfollow</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
