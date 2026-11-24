import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Spot } from '../../types';
import { SpotCard } from '../canvas/SpotCard';
import { SpotPopLogo } from '../brand/SpotPopLogo';

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
  const [likedSpotIds, setLikedSpotIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [heartBurst, setHeartBurst] = useState<{ id: string; x: number; y: number } | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

  // Filter approved/published spots
  const displaySpots = spots.filter(s => s.status !== 'hidden');

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

  // Scroll listener using IntersectionObserver for smooth snap detection
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

  // Handle Like Action & Double-tap
  const handleToggleLike = (spotId: string) => {
    setLikedSpotIds(prev => {
      const next = new Set(prev);
      const isLiked = next.has(spotId);
      if (isLiked) {
        next.delete(spotId);
        setLikeCounts(c => ({ ...c, [spotId]: Math.max(0, (c[spotId] || 1) - 1) }));
      } else {
        next.add(spotId);
        setLikeCounts(c => ({ ...c, [spotId]: (c[spotId] || 0) + 1 }));
        // Confetti burst for viral delight
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.75, x: 0.88 },
          colors: ['#FF2E93', '#FF007F', '#FFB800'],
        });
      }
      return next;
    });
  };

  const handleSlideTouch = (e: React.MouseEvent | React.TouchEvent, spot: Spot) => {
    const now = Date.now();
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;

    if (now - lastTapRef.current.time < 300) {
      // Double-tap detected -> trigger heart burst and like
      handleToggleLike(spot.id);
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
      {currentSpot?.content?.imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-35 scale-125 transition-all duration-700 pointer-events-none"
          style={{ backgroundImage: `url(${currentSpot.content.imageUrl})` }}
        />
      )}

      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 z-40 p-4 pt-safe flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
        <div className="flex items-center gap-2">
          <SpotPopLogo variant="icon" size={28} />
          <span className="font-outfit font-black text-white text-lg tracking-tight drop-shadow-md flex items-center gap-1.5">
            Pops <span className="bg-gradient-to-r from-[#FF2E93] to-purple-400 bg-clip-text text-transparent">Reels</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-pink-500/30 border border-pink-500/40 text-pink-300 font-mono font-bold">
              {activeIndex + 1}/{displaySpots.length}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Mute/Unmute toggle */}
          {currentSpot?.content?.audio && (
            <button
              onClick={() => setIsAudioMuted(prev => !prev)}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all"
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
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
            title="Close Reels"
            aria-label="Close"
          >
            <span className="text-xl font-bold leading-none">✕</span>
          </button>
        </div>
      </div>

      {/* Main Vertical Snap Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full max-w-md mx-auto overflow-y-scroll snap-y snap-mandatory scroll-smooth relative z-20 no-scrollbar touch-pan-y"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displaySpots.map((spot, idx) => {
          const isLiked = likedSpotIds.has(spot.id);
          const likeCount = (spot.sharesCount || 1) + (likeCounts[spot.id] || 0);
          const hasAudio = Boolean(spot.content?.audio?.url);
          const isCurrentActive = idx === activeIndex;

          return (
            <div
              key={spot.id}
              id={`reel-slide-${idx}`}
              className="h-full w-full snap-start relative flex flex-col justify-between py-16 px-4 shrink-0 overflow-hidden"
              onClick={(e) => handleSlideTouch(e, spot)}
            >
              {/* Double-Tap Floating Heart Animation */}
              {heartBurst && heartBurst.id === spot.id && (
                <div
                  className="fixed pointer-events-none z-50 text-6xl animate-ping"
                  style={{
                    left: heartBurst.x - 30,
                    top: heartBurst.y - 30,
                  }}
                >
                  ❤️
                </div>
              )}

              {/* Top Spacing to clear top bar */}
              <div className="h-6" />

              {/* Center Stage: The Pop Card */}
              <div className="flex-1 flex items-center justify-center relative">
                <div className="transform scale-[1.3] sm:scale-[1.45] transition-transform duration-300 drop-shadow-2xl">
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

              {/* Bottom Info & Right Action Rail Container */}
              <div className="relative z-30 flex items-end justify-between pb-8 pt-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
                {/* Left Side: Creator Profile & Headline Info */}
                <div className="flex-1 pr-4 select-none">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (spot.creatorName) onOpenCreatorProfile?.(spot.creatorName);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 cursor-pointer mb-2 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-500 text-white flex items-center justify-center text-[10px] font-black">
                      {spot.creatorName?.[0]?.toUpperCase() || 'P'}
                    </span>
                    <span className="text-xs font-bold text-white tracking-wide">
                      @{spot.creatorName || 'creator'}
                    </span>
                    <span className="text-[10px] text-pink-400 font-semibold">• Follow</span>
                  </div>

                  {/* Headline & Subtext */}
                  {spot.content?.headline && (
                    <h2 className="text-white font-extrabold text-base sm:text-lg leading-tight line-clamp-2 drop-shadow-md">
                      {spot.content.headline}
                    </h2>
                  )}
                  {spot.content?.text && (
                    <p className="text-slate-300 text-xs sm:text-sm line-clamp-2 mt-0.5 leading-snug">
                      {spot.content.text}
                    </p>
                  )}

                  {/* Audio Track Tag if Present */}
                  {hasAudio && (
                    <div className="flex items-center gap-2 mt-2 text-pink-300 text-[11px] font-mono font-medium">
                      <span className="animate-spin text-xs">🎵</span>
                      <span className="truncate max-w-[200px]">
                        Original Audio • {Math.round(spot.content.audio?.duration || 15)}s
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Side: Instagram Vertical Action Stack */}
                <div className="flex flex-col items-center gap-4 shrink-0 pl-2">
                  {/* Like Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLike(spot.id);
                    }}
                    className="flex flex-col items-center gap-1 group active:scale-75 transition-transform"
                    aria-label="Like Pop"
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
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
                    <span className="text-[11px] font-bold text-white font-mono">
                      {likeCount}
                    </span>
                  </button>

                  {/* Details / Comments Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSpot?.(spot);
                    }}
                    className="flex flex-col items-center gap-1 group active:scale-75 transition-transform"
                    title="View Pop Details"
                    aria-label="Details"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center group-hover:bg-white/20 transition-all">
                      <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-white">Details</span>
                  </button>

                  {/* Viral Share Kit Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenShareKit?.(spot);
                    }}
                    className="flex flex-col items-center gap-1 group active:scale-75 transition-transform"
                    title="Share Pop"
                    aria-label="Share"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center group-hover:bg-white/20 transition-all">
                      <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-white">Share</span>
                  </button>

                  {/* Fly to Wall Button (Canvas Teleport) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      onFlyToSpot?.(spot);
                    }}
                    className="flex flex-col items-center gap-1 group active:scale-75 transition-transform"
                    title="Fly to coordinate on Canvas Wall"
                    aria-label="Fly to Spot"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#FF2E93] text-white flex items-center justify-center shadow-lg shadow-pink-500/40 group-hover:scale-105 transition-all">
                      <svg className="w-5 h-5 fill-none stroke-white stroke-2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="white" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-pink-300">On Wall</span>
                  </button>

                  {/* Rotating Vinyl Disc for Audio */}
                  {hasAudio && (
                    <div
                      className={`w-10 h-10 rounded-full border-2 border-white/40 bg-black flex items-center justify-center shadow-lg overflow-hidden ${
                        isCurrentActive && !isAudioMuted ? 'animate-spin' : ''
                      }`}
                      style={{ animationDuration: '4s' }}
                    >
                      <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-600 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-black" />
                      </div>
                    </div>
                  )}
                </div>
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
