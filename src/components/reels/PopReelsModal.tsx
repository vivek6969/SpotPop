import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Spot } from '../../types';
import { SpotCard } from '../canvas/SpotCard';
import { SpotPopLogo } from '../brand/SpotPopLogo';
import { api } from '../../services/api';

interface PopReelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  spots: Spot[];
  onFlyToSpot?: (spot: Spot) => void;
  onSelectSpot?: (spot: Spot) => void;
  onOpenShareKit?: (spot: Spot) => void;
  onOpenCreatorProfile?: (username: string) => void;
  onStartCreate?: () => void;
  initialSpotId?: string | null;
}

export const PopReelsModal: React.FC<PopReelsModalProps> = ({
  isOpen,
  onClose,
  spots,
  onFlyToSpot,
  onSelectSpot,
  onOpenShareKit,
  onOpenCreatorProfile,
  onStartCreate,
  initialSpotId,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedSpotIds, setLikedSpotIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('spotpop_liked_spots');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [followedCreators, setFollowedCreators] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('spotpop_followed_creators');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [heartBurst, setHeartBurst] = useState<{ id: string; x: number; y: number } | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter approved/published spots
  const displaySpots = spots.filter(s => s.status !== 'hidden');

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  // Sync initial like counts from spots
  useEffect(() => {
    const counts: Record<string, number> = {};
    displaySpots.forEach(s => {
      counts[s.id] = (s.likesCount !== undefined ? s.likesCount : (s.sharesCount || 0));
    });
    setLikeCounts(prev => ({ ...counts, ...prev }));
  }, [spots]);

  // Initialize active index if initialSpotId passed
  useEffect(() => {
    if (initialSpotId && displaySpots.length > 0) {
      const idx = displaySpots.findIndex(s => s.id === initialSpotId || s.slug === initialSpotId);
      if (idx !== -1) {
        setActiveIndex(idx);
        setTimeout(() => {
          const el = document.getElementById(`reel-slide-${idx}`);
          el?.scrollIntoView({ behavior: 'auto' });
        }, 50);
      }
    }
  }, [initialSpotId, displaySpots.length]);

  // Audio manager for active reel
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const currentSpot = displaySpots[activeIndex];
    if (currentSpot?.content?.audio?.url && !isAudioMuted) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(currentSpot.content.audio.url);
      audio.loop = true;
      audio.play().catch(err => {
        console.warn('[ReelsAudio] Autoplay blocked, tap to play:', err);
      });
      audioRef.current = audio;
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [activeIndex, isOpen, isAudioMuted, displaySpots]);

  // Scroll listener using client height for smooth snap detection
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollPos = container.scrollTop;
    const slideHeight = container.clientHeight;
    if (slideHeight > 0) {
      const newIndex = Math.round(scrollPos / slideHeight);
      if (newIndex >= 0 && newIndex < displaySpots.length && newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    }
  }, [activeIndex, displaySpots.length]);

  // Keyboard navigation (ArrowUp, ArrowDown, Space, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = Math.min(displaySpots.length - 1, activeIndex + 1);
        document.getElementById(`reel-slide-${nextIdx}`)?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = Math.max(0, activeIndex - 1);
        document.getElementById(`reel-slide-${prevIdx}`)?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsAudioMuted(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, displaySpots.length, onClose]);

  // Handle Like Action & Double-tap with real backend sync and localStorage
  const handleToggleLike = async (spot: Spot) => {
    const spotId = spot.id;
    const currentlyLiked = likedSpotIds.has(spotId);
    const newLiked = !currentlyLiked;

    // Optimistic UI updates
    setLikedSpotIds(prev => {
      const next = new Set(prev);
      if (newLiked) {
        next.add(spotId);
      } else {
        next.delete(spotId);
      }
      try {
        localStorage.setItem('spotpop_liked_spots', JSON.stringify(Array.from(next)));
      } catch (_) {}
      return next;
    });

    setLikeCounts(c => {
      const cur = c[spotId] !== undefined ? c[spotId] : (spot.likesCount || spot.sharesCount || 0);
      return { ...c, [spotId]: newLiked ? cur + 1 : Math.max(0, cur - 1) };
    });

    if (newLiked) {
      confetti({
        particleCount: 28,
        spread: 60,
        origin: { y: 0.65, x: 0.85 },
        colors: ['#FF2E93', '#FF007F', '#FFB800'],
      });
    }

    // Real backend persistence
    try {
      const res = await api.toggleSpotLike(spotId, newLiked ? 'like' : 'unlike');
      if (res && res.likesCount !== undefined) {
        setLikeCounts(c => ({ ...c, [spotId]: res.likesCount }));
      }
    } catch (err) {
      console.warn('[PopReels] Like API failed:', err);
    }
  };

  // Toggle Creator Follow
  const handleToggleFollow = (creatorName: string) => {
    if (!creatorName) return;
    setFollowedCreators(prev => {
      const next = new Set(prev);
      const isFollowing = next.has(creatorName);
      if (isFollowing) {
        next.delete(creatorName);
        showToast(`Unfollowed @${creatorName}`);
      } else {
        next.add(creatorName);
        showToast(`Following @${creatorName}! ✨`);
      }
      try {
        localStorage.setItem('spotpop_followed_creators', JSON.stringify(Array.from(next)));
      } catch (_) {}
      return next;
    });
  };

  // Real Share Handler (Native Web Share + Clipboard fallback)
  const handleShare = async (spot: Spot) => {
    const url = `${window.location.origin}/?spot=${spot.slug || spot.id}`;
    const title = spot.content?.headline || `Pop by @${spot.creatorName}`;
    const text = spot.content?.text || 'Check out this Pop on SpotPop!';

    api.recordShare(spot.id);

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        showToast('Shared successfully!');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard! 📋');
    } catch {
      showToast('Link ready: ' + url);
    }
    onOpenShareKit?.(spot);
  };

  const handleSlideTouch = (e: React.MouseEvent | React.TouchEvent, spot: Spot) => {
    const now = Date.now();
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;

    if (now - lastTapRef.current.time < 320) {
      // Double-tap detected -> trigger heart burst and like
      handleToggleLike(spot);
      setHeartBurst({ id: spot.id, x: clientX, y: clientY });
      setTimeout(() => setHeartBurst(null), 900);
      lastTapRef.current = { time: 0, x: 0, y: 0 };
    } else {
      lastTapRef.current = { time: now, x: clientX, y: clientY };
    }
  };

  const currentSpot = displaySpots[activeIndex];
  if (!isOpen || displaySpots.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden touch-none font-sans">
      {/* Dynamic Ambient Background Blur */}
      {currentSpot && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-35 scale-125 transition-all duration-700 pointer-events-none"
          style={{
            backgroundImage: currentSpot.content?.imageUrl ? `url(${currentSpot.content.imageUrl})` : undefined,
            backgroundColor: currentSpot.background || '#111',
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85 pointer-events-none z-10" />

      {/* Floating In-Reel Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 z-50 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 z-40 px-4 py-3 sm:py-4 pt-safe flex items-center justify-between bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <SpotPopLogo variant="icon" size={28} />
          <div className="flex items-center gap-2">
            <span className="font-outfit font-black text-white text-lg tracking-tight drop-shadow-md">
              Pops <span className="bg-gradient-to-r from-[#FF2E93] to-purple-400 bg-clip-text text-transparent">Reels</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 font-mono font-bold">
              {activeIndex + 1}/{displaySpots.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Mute/Unmute toggle */}
          {currentSpot?.content?.audio && (
            <button
              onClick={() => setIsAudioMuted(prev => !prev)}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-lg"
              title={isAudioMuted ? 'Unmute' : 'Mute'}
              aria-label="Toggle Audio"
            >
              {isAudioMuted ? (
                <span className="text-sm">🔇</span>
              ) : (
                <span className="text-sm animate-pulse">🔊</span>
              )}
            </button>
          )}

          {/* Close Reels Button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all cursor-pointer shadow-lg"
            title="Close Reels"
            aria-label="Close"
          >
            <span className="text-lg font-bold leading-none">✕</span>
          </button>
        </div>
      </div>

      {/* Main Vertical Snap Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full max-w-[460px] mx-auto overflow-y-scroll snap-y snap-mandatory scroll-smooth relative z-20 no-scrollbar touch-pan-y"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displaySpots.map((spot, idx) => {
          const isLiked = likedSpotIds.has(spot.id);
          const likeCount = likeCounts[spot.id] !== undefined
            ? likeCounts[spot.id]
            : (spot.likesCount || spot.sharesCount || 0);
          const hasAudio = Boolean(spot.content?.audio?.url);
          const isCurrentActive = idx === activeIndex;
          const isFollowing = spot.creatorName ? followedCreators.has(spot.creatorName) : false;

          return (
            <div
              key={spot.id}
              id={`reel-slide-${idx}`}
              className="h-full w-full snap-start relative shrink-0 overflow-hidden select-none"
            >
              {/* Double-Tap Big Heart Animation Burst */}
              {heartBurst && heartBurst.id === spot.id && (
                <div
                  className="fixed pointer-events-none z-50 text-7xl animate-ping drop-shadow-[0_0_25px_rgba(255,46,147,0.8)]"
                  style={{
                    left: heartBurst.x - 36,
                    top: heartBurst.y - 36,
                  }}
                >
                  ❤️
                </div>
              )}

              {/* HERO CENTER STAGE: The Pop Card Centered Full-Screen */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-4"
                onClick={(e) => handleSlideTouch(e, spot)}
              >
                <div
                  className="pointer-events-auto transform scale-[1.75] xs:scale-[1.9] sm:scale-[2.05] md:scale-[2.2] transition-transform duration-300 drop-shadow-[0_25px_60px_rgba(0,0,0,0.85)] filter cursor-pointer"
                  style={{ transformOrigin: 'center center' }}
                >
                  <SpotCard
                    tier={spot.tier}
                    shape={spot.shape}
                    background={spot.background}
                    borderColor={spot.borderColor}
                    content={spot.content}
                    creatorName={spot.creatorName}
                    interactive={false}
                  />
                </div>
              </div>

              {/* Right Side: Instagram-Style Floating Vertical Action Rail */}
              <div className="absolute right-3.5 sm:right-5 bottom-20 sm:bottom-24 z-30 flex flex-col items-center gap-4.5 select-none pointer-events-auto">
                {/* Like Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLike(spot);
                  }}
                  className="flex flex-col items-center gap-1 group active:scale-75 transition-transform cursor-pointer"
                  aria-label="Like Pop"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                      isLiked
                        ? 'bg-rose-600/30 border-rose-500 text-rose-500 shadow-lg shadow-rose-500/40'
                        : 'bg-black/60 border-white/20 text-white group-hover:bg-white/20'
                    }`}
                  >
                    <svg
                      className="w-6 h-6 fill-current transition-colors"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-white font-mono drop-shadow">
                    {likeCount}
                  </span>
                </button>

                {/* Details Button (Opens Full Pop Details) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onSelectSpot?.(spot);
                  }}
                  className="flex flex-col items-center gap-1 group active:scale-75 transition-transform cursor-pointer"
                  title="View Pop Details"
                  aria-label="Details"
                >
                  <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center group-hover:bg-white/20 transition-all shadow-md">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold text-white drop-shadow">Details</span>
                </button>

                {/* Share Button (Web Share / Copy Link) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(spot);
                  }}
                  className="flex flex-col items-center gap-1 group active:scale-75 transition-transform cursor-pointer"
                  title="Share Pop"
                  aria-label="Share"
                >
                  <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center group-hover:bg-white/20 transition-all shadow-md">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold text-white drop-shadow">Share</span>
                </button>

                {/* Fly to Wall Button (Canvas Teleport) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onFlyToSpot?.(spot);
                  }}
                  className="flex flex-col items-center gap-1 group active:scale-75 transition-transform cursor-pointer"
                  title="Teleport to coordinate on Wall"
                  aria-label="Fly to Spot"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/40 group-hover:scale-105 transition-all">
                    <svg className="w-5 h-5 fill-none stroke-white stroke-2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="white" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black text-pink-300 drop-shadow uppercase tracking-wider">On Wall</span>
                </button>

                {/* Rotating Vinyl Disc for Audio */}
                {hasAudio && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAudioMuted(prev => !prev);
                    }}
                    className={`w-11 h-11 rounded-full border-2 border-white/40 bg-black flex items-center justify-center shadow-lg overflow-hidden cursor-pointer ${
                      isCurrentActive && !isAudioMuted ? 'animate-spin' : ''
                    }`}
                    style={{ animationDuration: '4s' }}
                    title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-black" />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Info Bar: Creator Profile, Headline, and Audio */}
              <div className="absolute left-4 right-20 sm:right-24 bottom-6 sm:bottom-8 z-30 flex flex-col items-start gap-1 select-none pointer-events-auto text-left">
                {/* Creator Chip with Interactive Follow */}
                <div className="flex items-center gap-2 mb-1">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (spot.creatorName) {
                        onClose();
                        onOpenCreatorProfile?.(spot.creatorName);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 cursor-pointer transition-colors shadow-md"
                  >
                    <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-500 text-white flex items-center justify-center text-[10px] font-black">
                      {spot.creatorName?.[0]?.toUpperCase() || 'P'}
                    </span>
                    <span className="text-xs font-bold text-white tracking-wide">
                      @{spot.creatorName || 'creator'}
                    </span>
                  </div>

                  {spot.creatorName && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFollow(spot.creatorName);
                      }}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer backdrop-blur-md border ${
                        isFollowing
                          ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                          : 'bg-pink-500/30 border-pink-500/60 text-pink-300 hover:bg-pink-500/40'
                      }`}
                    >
                      {isFollowing ? '✓ Following' : '+ Follow'}
                    </button>
                  )}
                </div>

                {/* Headline */}
                {spot.content?.headline && (
                  <h2 className="text-white font-extrabold text-base sm:text-lg leading-snug line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    {spot.content.headline}
                  </h2>
                )}

                {/* Subtext description */}
                {spot.content?.text && (
                  <p className="text-white/85 text-xs sm:text-sm line-clamp-2 leading-snug drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                    {spot.content.text}
                  </p>
                )}

                {/* Audio Ticker if Present */}
                {hasAudio && (
                  <div className="flex items-center gap-2 mt-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-pink-300 text-[11px] font-mono font-medium">
                    <span className="animate-spin text-xs">🎵</span>
                    <span className="truncate max-w-[180px] sm:max-w-[220px]">
                      Original Audio • {spot.creatorName || 'creator'}
                    </span>
                    <span className="text-white/60">({Math.round(spot.content.audio?.duration || 15)}s)</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Add Pop Prompt when at the end of Reels */}
      {activeIndex === displaySpots.length - 1 && onStartCreate && (
        <div className="absolute bottom-20 inset-x-4 z-40 flex justify-center pointer-events-auto">
          <button
            onClick={() => {
              onClose();
              onStartCreate();
            }}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#FF007F] text-white font-bold text-sm shadow-xl shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>+ Add Your Pop to Reels</span>
          </button>
        </div>
      )}
    </div>
  );
};
