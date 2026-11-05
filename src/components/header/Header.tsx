import React from 'react';
import { User, CanvasStats } from '../../types';

interface HeaderProps {
  stats?: CanvasStats | null;
  currentUser?: User | null;
  onOpenSearch: () => void;
  onOpenActivity: () => void;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  currentUser,
  onOpenSearch,
  onOpenActivity,
  onOpenAccount,
  onOpenAdmin,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#090A0F]/95 via-[#090A0F]/80 to-transparent backdrop-blur-xs pb-3 pt-safe">
      {/* Main Top Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => window.location.href = '/'}>
          {/* Gold Crown Emblem */}
          <div className="w-8 h-8 flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(255,200,0,0.5)]">
            <svg viewBox="0 0 100 80" className="w-7 h-7 fill-[#FFE600] stroke-[#FFB800] stroke-[3]">
              <path d="M10 70 L0 25 L30 45 L50 15 L70 45 L100 25 L90 70 Z" />
            </svg>
          </div>

          {/* Typography */}
          <div className="flex items-center tracking-tight font-outfit text-2xl font-extrabold leading-none">
            <span className="text-white">Spot</span>
            <span className="text-[#FF2E93] bg-gradient-to-r from-[#FF2E93] to-[#FF5EAA] bg-clip-text text-transparent">
              Pop
            </span>
          </div>
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
            {/* Unread pink indicator */}
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FF2E93] ring-2 ring-[#090A0F] animate-pulse" />
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

      {/* Live Canvas Stat Bar (As in mockup screenshot) */}
      <div className="max-w-md mx-auto px-4 mt-0.5">
        <div className="flex items-center justify-around py-1.5 px-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs shadow-lg">
          {/* Online count */}
          <div className="flex items-center gap-1.5 text-slate-300 font-medium whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{stats ? stats.onlineCount.toLocaleString('en-IN') : '2,486'} online</span>
          </div>

          <span className="text-white/20">|</span>

          {/* Claimed count */}
          <div className="flex items-center gap-1.5 text-slate-300 font-medium whitespace-nowrap">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{stats ? stats.claimedCount.toLocaleString('en-IN') : '2,34,721'} claimed</span>
          </div>

          <span className="text-white/20">|</span>

          {/* Spots left */}
          <div className="flex items-center gap-1.5 text-slate-300 font-medium whitespace-nowrap">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>{stats ? stats.spotsLeft.toLocaleString('en-IN') : '65,279'} left</span>
          </div>
        </div>
      </div>
    </header>
  );
};
