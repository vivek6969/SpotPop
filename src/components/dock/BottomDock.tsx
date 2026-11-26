import React from 'react';
import { ProductTier, User } from '../../types';

export type NavTab = 'home' | 'search' | 'friends' | 'create' | 'stories' | 'reels' | 'profile';

interface BottomDockProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  onStartCreate: (tier?: ProductTier) => void;
  onOpenSearch?: () => void;
  onOpenFriends?: () => void;
  onOpenStories?: () => void;
  onOpenReels?: () => void; // backwards-compatible alias
  onOpenAccount?: () => void;
  onHomeClick?: () => void;
  selectedTier?: ProductTier;
  onChangeSelectedTier?: (tier: ProductTier) => void;
  currentUser?: User | null;
  pendingRequestsCount?: number;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeTab = 'home',
  onTabChange,
  onStartCreate,
  onOpenSearch,
  onOpenFriends,
  onOpenStories,
  onOpenReels,
  onOpenAccount,
  onHomeClick,
  selectedTier = 'big_pop',
  currentUser,
  pendingRequestsCount = 0,
}) => {
  const handleHome = () => {
    onTabChange?.('home');
    onHomeClick?.();
  };

  const handleSearch = () => {
    onTabChange?.('search');
    onOpenSearch?.();
  };

  const handleFriends = () => {
    onTabChange?.('friends');
    onOpenFriends?.();
  };

  const handleCreate = () => {
    onTabChange?.('create');
    onStartCreate(selectedTier);
  };

  const handleStories = () => {
    onTabChange?.('stories');
    if (onOpenStories) {
      onOpenStories();
    } else if (onOpenReels) {
      onOpenReels();
    }
  };

  const handleProfile = () => {
    onTabChange?.('profile');
    onOpenAccount?.();
  };

  return (
    <nav
      role="navigation"
      aria-label="Instagram-style Navigation"
      className="fixed bottom-0 inset-x-0 z-40 pb-safe pointer-events-auto"
    >
      {/* Outer Floating Shell */}
      <div className="w-full max-w-md mx-auto px-4 sm:px-0 sm:pb-3">
        <div className="bg-black/90 dark:bg-[#0c0d14]/95 backdrop-blur-xl border border-white/15 sm:rounded-full shadow-2xl shadow-black/80 px-4 py-2 sm:py-2.5 flex items-center justify-between">
          
          {/* 1. Home Tab */}
          <button
            type="button"
            onClick={handleHome}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-full transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'text-white scale-105'
                : 'text-slate-400 hover:text-white active:scale-90'
            }`}
            title="Home Wall"
            aria-label="Home"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className={`w-1 h-1 rounded-full bg-white mt-1 transition-opacity ${activeTab === 'home' ? 'opacity-100' : 'opacity-0'}`} />
          </button>

          {/* 2. Search / Explore Tab */}
          <button
            type="button"
            onClick={handleSearch}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-full transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'text-white scale-105'
                : 'text-slate-400 hover:text-white active:scale-90'
            }`}
            title="Search & Explore"
            aria-label="Search"
          >
            <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" strokeWidth="2.5" />
            </svg>
            <span className={`w-1 h-1 rounded-full bg-white mt-1 transition-opacity ${activeTab === 'search' ? 'opacity-100' : 'opacity-0'}`} />
          </button>

          {/* 3. Friends Button */}
          <button
            type="button"
            onClick={handleFriends}
            className={`relative flex flex-col items-center justify-center w-12 h-11 rounded-full transition-all cursor-pointer ${
              activeTab === 'friends'
                ? 'text-[#00F0FF] scale-105'
                : 'text-slate-400 hover:text-white active:scale-90'
            }`}
            title="Friends & Connections"
            aria-label="Friends"
          >
            <div className="relative">
              <span className="text-xl leading-none">👥</span>
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-[#FF2E93] text-white text-[8px] font-black flex items-center justify-center animate-pulse">
                  {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                </span>
              )}
            </div>
            <span className={`w-1 h-1 rounded-full bg-[#00F0FF] mt-1 transition-opacity ${activeTab === 'friends' ? 'opacity-100' : 'opacity-0'}`} />
          </button>

          {/* 4. Center Create (+) Button - Instagram Post Icon */}
          <button
            type="button"
            onClick={handleCreate}
            className="group relative flex items-center justify-center w-12 h-11 cursor-pointer transition-transform active:scale-90"
            title="Add Your Spot"
            aria-label="Create Pop"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF2E93] to-[#FF007F] hover:from-[#FF45A2] hover:to-[#FF1493] text-white flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:shadow-pink-500/60 transition-all border border-white/20">
              <svg className="w-5 h-5 fill-none stroke-white stroke-2.5" viewBox="0 0 24 24">
                <line x1="12" y1="6" x2="12" y2="18" strokeLinecap="round" />
                <line x1="6" y1="12" x2="18" y2="12" strokeLinecap="round" />
              </svg>
            </div>
          </button>

          {/* 4. Stories Tab - Watch All Stories */}
          <button
            type="button"
            onClick={handleStories}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-full transition-all cursor-pointer ${
              activeTab === 'stories' || (activeTab as string) === 'reels'
                ? 'text-[#FF2E93] scale-105'
                : 'text-slate-400 hover:text-white active:scale-90'
            }`}
            title="Pop Stories (Watch All Pops)"
            aria-label="Stories"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {/* Clapperboard / Story frame */}
              <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
              <line x1="3" y1="8" x2="21" y2="8" strokeWidth="1.8" />
              <line x1="8" y1="3" x2="6" y2="8" strokeWidth="1.8" />
              <line x1="16" y1="3" x2="14" y2="8" strokeWidth="1.8" />
              <polygon points="10 11.5 15.5 14.5 10 17.5 10 11.5" fill="currentColor" stroke="none" />
            </svg>
            <span className={`w-1 h-1 rounded-full bg-[#FF2E93] mt-1 transition-opacity ${activeTab === 'stories' || (activeTab as string) === 'reels' ? 'opacity-100' : 'opacity-0'}`} />
          </button>

          {/* 5. Profile Tab */}
          <button
            type="button"
            onClick={handleProfile}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-full transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-white scale-105'
                : 'text-slate-400 hover:text-white active:scale-90'
            }`}
            title={currentUser ? `@${currentUser.username}` : 'Sign In / Profile'}
            aria-label="Profile"
          >
            {currentUser ? (
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-500 text-white flex items-center justify-center text-xs font-black shadow-xs ring-1 ring-white/40">
                {currentUser.username?.[0]?.toUpperCase() || 'U'}
              </div>
            ) : (
              <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                <circle cx="12" cy="7" r="4" />
                <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
              </svg>
            )}
            <span className={`w-1 h-1 rounded-full bg-white mt-1 transition-opacity ${activeTab === 'profile' ? 'opacity-100' : 'opacity-0'}`} />
          </button>

        </div>
      </div>
    </nav>
  );
};
