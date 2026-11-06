import React from 'react';
import { User, CanvasStats } from '../../types';
import { SpotPopLogo } from '../brand/SpotPopLogo';

interface HeaderProps {
  stats?: CanvasStats | null;
  currentUser?: User | null;
  unreadActivityCount?: number;
  onOpenSearch: () => void;
  onOpenActivity: () => void;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  currentUser,
  unreadActivityCount = 0,
  onOpenSearch,
  onOpenActivity,
  onOpenAccount,
  onOpenAdmin,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none pt-safe">
      {/* Main Top Nav Bar */}
      <div className="w-full bg-[#090A0F]/85 backdrop-blur-md border-b border-white/10 pointer-events-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand Logo Only (Icon only, no font/text) */}
          <div
            className="flex items-center cursor-pointer select-none py-1 hover:scale-105 active:scale-95 transition-transform"
            onClick={() => window.location.href = '/'}
            title="SpotPop Home"
          >
            <SpotPopLogo variant="icon" size={38} />
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-slate-200 hover:text-white flex items-center justify-center transition-all"
              title="Search spots, creators and tags"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Activity Bell Trigger */}
            <button
              onClick={onOpenActivity}
              className="relative w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-slate-200 hover:text-white flex items-center justify-center transition-all"
              title="Live Canvas Activity"
              aria-label="Activity Feed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Unread pink indicator badge */}
              {unreadActivityCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#FF2E93] ring-2 ring-[#090A0F] text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadActivityCount > 9 ? '9+' : unreadActivityCount}
                </span>
              ) : null}
            </button>

            {/* User Account / Login */}
            <button
              onClick={onOpenAccount}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-slate-200 hover:text-white flex items-center justify-center transition-all overflow-hidden"
              title={currentUser ? currentUser.displayName : 'Sign In'}
              aria-label="Account"
            >
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>

            {/* Admin shortcut if logged in as admin */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={onOpenAdmin}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition-colors uppercase tracking-wider"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
