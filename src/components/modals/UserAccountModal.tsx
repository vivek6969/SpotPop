import React, { useState } from 'react';
import { User, Spot } from '../../types';
import { api } from '../../services/api';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  allSpots: Spot[];
  onLoginSuccess: (user: User, token: string) => void;
  onLogout: () => void;
  onSelectSpot: (spot: Spot) => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allSpots,
  onLoginSuccess,
  onLogout,
  onSelectSpot,
}) => {
  if (!isOpen) return null;

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email);
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !displayName) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.register({ email, username, displayName });
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Find user's owned spots
  const userSpots = currentUser
    ? allSpots.filter(s => s.ownerId === currentUser.id || currentUser.ownedSpotIds?.includes(s.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF2E93]" />
            <h3 className="font-outfit font-bold text-base text-white">
              {currentUser ? 'Your SpotPop Account' : 'Welcome to SpotPop'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {currentUser ? (
            // LOGGED IN USER PROFILE
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF2E93] to-amber-400 flex items-center justify-center text-xl font-bold text-white shadow-md">
                  {currentUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-base leading-tight truncate">
                    {currentUser.displayName}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    @{currentUser.username} · {currentUser.email}
                  </div>
                </div>
                {currentUser.role === 'admin' && (
                  <span className="px-2 py-0.5 rounded-md bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[10px] font-bold uppercase">
                    Admin
                  </span>
                )}
              </div>

              {/* Owned Spots List */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Your Claimed Spots ({userSpots.length})
                </h4>
                {userSpots.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-white/5 text-center text-xs text-slate-400">
                    You haven&apos;t claimed a spot yet. Click &quot;Add Your Spot&quot; below to claim one!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userSpots.map((spot) => (
                      <div
                        key={spot.id}
                        onClick={() => {
                          onSelectSpot(spot);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{spot.tier === 'big_pop' ? '📸' : '📝'}</span>
                          <div>
                            <div className="font-bold text-white text-xs truncate max-w-[180px]">
                              {spot.content.headline || spot.creatorName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {spot.tier === 'big_pop' ? 'Big Pop (₹99)' : 'Mini Pop (₹29)'}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-[#FF2E93] font-semibold group-hover:translate-x-0.5 transition-transform">
                          Fly to spot →
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sign out */}
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-xs transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            // LOGIN / REGISTRATION FORM
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    tab === 'login'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    tab === 'register'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {tab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. vivek@spotpop.in"
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#FF2E93] focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white font-bold text-xs shadow-lg shadow-pink-500/25 active:scale-95 transition-all"
                  >
                    {loading ? 'Signing in...' : 'Sign In to SpotPop'}
                  </button>

                  <div className="text-[11px] text-slate-400 text-center pt-2">
                    Demo accounts: <span className="text-white underline cursor-pointer" onClick={() => setEmail('vivek@spotpop.in')}>vivek@spotpop.in</span> or <span className="text-white underline cursor-pointer" onClick={() => setEmail('admin@spotpop.in')}>admin@spotpop.in</span>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Vivek Rathod"
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. vivek"
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. vivek@gmail.com"
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white font-bold text-xs shadow-lg shadow-pink-500/25 active:scale-95 transition-all"
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
