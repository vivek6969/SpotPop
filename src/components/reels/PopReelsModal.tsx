import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Spot, Comment } from '../../types';
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

const QUICK_REACTIONS = ['🔥', '❤️', '👏', '😂', '😮', '🚀', '💯'];

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
  const [shuffleKey, setShuffleKey] = useState(0);
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
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [reactionCounts, setReactionCounts] = useState<Record<string, Record<string, number>>>({});
  const [heartBurst, setHeartBurst] = useState<{ id: string; x: number; y: number } | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Comments Drawer State
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsSpotId, setCommentsSpotId] = useState<string | null>(null);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Quick Reactions Bar Toggle
  const [showReactionsBar, setShowReactionsBar] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const viewedSpotsRef = useRef<Set<string>>(new Set());

  // Discovery / Perspective Algorithm:
  // Show random perspective or user perspective just like Instagram Reels
  const displaySpots = useMemo(() => {
    const published = spots.filter(s => s.status !== 'hidden');
    if (shuffleKey === 0) {
      // First open: keep initialSpotId at index 0 if specified, otherwise shuffle
      if (initialSpotId) {
        const found = published.find(s => s.id === initialSpotId || s.slug === initialSpotId);
        const rest = published.filter(s => s.id !== initialSpotId && s.slug !== initialSpotId);
        return found ? [found, ...rest] : published;
      }
      // Algorithmic discovery mix: shuffle array so user sees fresh perspective on reels
      const copy = [...published];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }
    // Re-shuffle on user demand
    const copy = [...published];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [spots, shuffleKey, initialSpotId]);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  // Sync initial like, view, and reaction counts
  useEffect(() => {
    const likes: Record<string, number> = {};
    const views: Record<string, number> = {};
    const reacts: Record<string, Record<string, number>> = {};
    displaySpots.forEach(s => {
      likes[s.id] = (s.likesCount !== undefined ? s.likesCount : (s.sharesCount || 0));
      views[s.id] = s.viewsCount || 0;
      reacts[s.id] = s.reactions || {};
    });
    setLikeCounts(prev => ({ ...likes, ...prev }));
    setViewCounts(prev => ({ ...views, ...prev }));
    setReactionCounts(prev => ({ ...reacts, ...prev }));
  }, [spots, displaySpots]);

  // Record 100% Real View Event when spot becomes active
  useEffect(() => {
    if (!isOpen || displaySpots.length === 0) return;
    const currentSpot = displaySpots[activeIndex];
    if (currentSpot && !viewedSpotsRef.current.has(currentSpot.id)) {
      viewedSpotsRef.current.add(currentSpot.id);
      setViewCounts(prev => ({ ...prev, [currentSpot.id]: (prev[currentSpot.id] || currentSpot.viewsCount || 0) + 1 }));
      api.recordView(currentSpot.id).then(res => {
        if (res?.viewsCount) {
          setViewCounts(prev => ({ ...prev, [currentSpot.id]: res.viewsCount }));
        }
      });
    }
  }, [activeIndex, isOpen, displaySpots]);

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
        setIsCommentsOpen(false);
        setShowReactionsBar(false);
      }
    }
  }, [activeIndex, displaySpots.length]);

  // Keyboard navigation (ArrowUp, ArrowDown, Space, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCommentsOpen) {
          setIsCommentsOpen(false);
        } else {
          onClose();
        }
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
  }, [isOpen, activeIndex, displaySpots.length, isCommentsOpen, onClose]);

  // Instant Double-Click / Double-Tap Like Action
  const handleToggleLike = async (spot: Spot, clientX?: number, clientY?: number) => {
    const spotId = spot.id;
    const currentlyLiked = likedSpotIds.has(spotId);
    const newLiked = !currentlyLiked;

    // Heart burst animation
    if (clientX && clientY) {
      setHeartBurst({ id: spotId, x: clientX, y: clientY });
      setTimeout(() => setHeartBurst(null), 850);
    }

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
        particleCount: 30,
        spread: 60,
        origin: { y: 0.65, x: 0.82 },
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

  // Pop React: Emoji reaction trigger
  const handleEmojiReaction = async (spot: Spot, emoji: string) => {
    const spotId = spot.id;
    // Add floating emoji animation
    const id = `${Date.now()}_${Math.random()}`;
    const x = window.innerWidth / 2 + (Math.random() * 80 - 40);
    const y = window.innerHeight * 0.7;
    setFloatingEmojis(prev => [...prev, { id, emoji, x, y }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 1200);

    // Optimistic reaction count update
    setReactionCounts(prev => {
      const curSpotReacts = prev[spotId] || {};
      return {
        ...prev,
        [spotId]: {
          ...curSpotReacts,
          [emoji]: (curSpotReacts[emoji] || 0) + 1,
        },
      };
    });

    showToast(`Reacted with ${emoji}!`);

    // Backend sync
    try {
      const res = await api.sendReaction(spotId, emoji);
      if (res) {
        setReactionCounts(prev => ({ ...prev, [spotId]: res }));
      }
    } catch (e) {
      console.warn('Reaction failed:', e);
    }
  };

  // Open Comments Drawer
  const handleOpenComments = async (spot: Spot) => {
    setCommentsSpotId(spot.id);
    setIsCommentsOpen(true);
    setReplyingTo(null);
    try {
      const comments = await api.getComments(spot.id);
      setCommentsList(comments);
    } catch (err) {
      console.warn('Could not load comments:', err);
    }
  };

  // Submit Comment
  const handlePostComment = async () => {
    if (!commentInput.trim() || !commentsSpotId || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const newComment = await api.addComment(
        commentsSpotId,
        commentInput.trim(),
        replyingTo?.id,
        'You',
      );
      if (newComment) {
        setCommentsList(prev => {
          if (replyingTo) {
            return prev.map(c => {
              if (c.id === replyingTo.id) {
                return { ...c, replies: [...(c.replies || []), newComment] };
              }
              return c;
            });
          }
          return [newComment, ...prev];
        });
        setCommentInput('');
        setReplyingTo(null);
        showToast('Comment posted! ✨');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
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

  // Real Share Handler
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

    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard! 📋');
    } catch {
      showToast('Link: ' + url);
    }
    onOpenShareKit?.(spot);
  };

  // Slide Double-Tap / Click Detection
  const handleSlideTouch = (e: React.MouseEvent | React.TouchEvent, spot: Spot) => {
    const now = Date.now();
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;

    if (now - lastTapRef.current.time < 350) {
      // Instant Double-Click / Double-Tap Like
      handleToggleLike(spot, clientX, clientY);
      lastTapRef.current = { time: 0, x: 0, y: 0 };
    } else {
      lastTapRef.current = { time: now, x: clientX, y: clientY };
    }
  };

  // Helper to format text with clickable @mentions and #hashtags
  const renderRichText = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, i) => {
      if (word.startsWith('@') && word.length > 1) {
        const username = word.slice(1).replace(/[^a-zA-Z0-9_]/g, '');
        return (
          <span
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              onOpenCreatorProfile?.(username);
            }}
            className="text-pink-400 font-bold hover:underline cursor-pointer"
          >
            {word}
          </span>
        );
      }
      if (word.startsWith('#') && word.length > 1) {
        return (
          <span key={i} className="text-cyan-400 font-semibold">
            {word}
          </span>
        );
      }
      return word;
    });
  };

  const currentSpot = displaySpots[activeIndex];
  if (!isOpen || displaySpots.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center select-none overflow-hidden touch-none font-sans">
      {/* Dynamic Ambient Background Blur */}
      {currentSpot && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 scale-125 transition-all duration-700 pointer-events-none"
          style={{
            backgroundImage: currentSpot.content?.imageUrl ? `url(${currentSpot.content.imageUrl})` : undefined,
            backgroundColor: currentSpot.background || '#090a0f',
          }}
        />
      )}
      <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/90 pointer-events-none z-10" />

      {/* Floating In-Reel Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 z-50 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Emojis Reaction Animation */}
      {floatingEmojis.map((item) => (
        <div
          key={item.id}
          className="fixed pointer-events-none z-50 text-4xl animate-float-up drop-shadow-lg"
          style={{
            left: item.x,
            top: item.y,
            animation: 'floatUp 1.2s ease-out forwards',
          }}
        >
          {item.emoji}
        </div>
      ))}

      {/* DOUBLE-TAP BURSTING HEART */}
      {heartBurst && (
        <div
          className="fixed pointer-events-none z-50 text-7xl animate-ping drop-shadow-[0_0_30px_rgba(255,46,147,0.9)]"
          style={{
            left: heartBurst.x - 36,
            top: heartBurst.y - 36,
          }}
        >
          ❤️
        </div>
      )}

      {/* MAIN PHONE CONTAINER: Native App-Like 9:16 Aspect Stage */}
      <div className="w-full sm:max-w-[430px] h-full sm:h-[94vh] sm:max-h-[850px] sm:rounded-[36px] bg-black border-0 sm:border sm:border-white/15 relative overflow-hidden flex flex-col justify-between shadow-[0_0_80px_rgba(0,0,0,0.9)] z-20">
        {/* Top Header Bar: SpotPop Brand & Discovery Shuffle */}
        <div className="absolute top-0 inset-x-0 z-40 px-4 py-3 sm:py-3.5 pt-safe flex items-center justify-between bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <SpotPopLogo variant="icon" size={26} />
            <div className="flex items-center gap-2">
              <span className="font-outfit font-black text-white text-base tracking-tight drop-shadow-md">
                Spot<span className="text-[#FF2E93]">Pop</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/80 font-medium">
                Reels
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 font-mono font-bold">
                {activeIndex + 1}/{displaySpots.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Perspective Shuffle / Discover Button */}
            <button
              onClick={() => {
                setShuffleKey(prev => prev + 1);
                showToast('Shuffled Reels discovery feed! 🔀');
              }}
              className="px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/90 text-xs font-bold hover:bg-white/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-md"
              title="Shuffle / Discover New Pops"
              aria-label="Discover"
            >
              <span>🔀</span>
              <span className="hidden xs:inline text-[11px]">Mix</span>
            </button>

            {/* Audio Mute/Unmute toggle */}
            {currentSpot?.content?.audio && (
              <button
                onClick={() => setIsAudioMuted(prev => !prev)}
                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-md"
                title={isAudioMuted ? 'Unmute' : 'Mute'}
                aria-label="Toggle Audio"
              >
                {isAudioMuted ? <span className="text-xs">🔇</span> : <span className="text-xs animate-pulse">🔊</span>}
              </button>
            )}

            {/* Close Reels Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all cursor-pointer shadow-md"
              title="Close Reels"
              aria-label="Close"
            >
              <span className="text-base font-bold leading-none">✕</span>
            </button>
          </div>
        </div>

        {/* Vertical Snap Scroll Container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth relative z-20 no-scrollbar touch-pan-y"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displaySpots.map((spot, idx) => {
            const isLiked = likedSpotIds.has(spot.id);
            const likeCount = likeCounts[spot.id] !== undefined
              ? likeCounts[spot.id]
              : (spot.likesCount || spot.sharesCount || 0);
            const viewCount = viewCounts[spot.id] !== undefined ? viewCounts[spot.id] : (spot.viewsCount || 0);
            const spotReactions = reactionCounts[spot.id] || spot.reactions || {};
            const totalReactions = Object.values(spotReactions).reduce((a, b) => a + b, 0);
            const hasAudio = Boolean(spot.content?.audio?.url);
            const isCurrentActive = idx === activeIndex;
            const isFollowing = spot.creatorName ? followedCreators.has(spot.creatorName) : false;
            const commentsDisabled = spot.allowComments === false;

            return (
              <div
                key={spot.id}
                id={`reel-slide-${idx}`}
                className="h-full w-full snap-start relative shrink-0 overflow-hidden select-none flex flex-col justify-between"
                onClick={(e) => handleSlideTouch(e, spot)}
              >
                {/* 
                  STAGE CONTAINER:
                  Notice: We add `pr-16 pl-3` so the Pop card is framed cleanly in the left-and-center!
                  The right action rail has its own dedicated column and NEVER covers the Pop!
                */}
                <div className="absolute inset-0 flex items-center justify-center pr-16 pl-4 pointer-events-none z-10">
                  <div
                    className="pointer-events-auto transform scale-[1.38] xs:scale-[1.48] sm:scale-[1.58] transition-transform duration-300 drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)] filter cursor-pointer"
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

                {/* Right Side: Instagram Vertical Floating Action Rail (In dedicated gutter) */}
                <div className="absolute right-2.5 sm:right-3 bottom-20 z-30 flex flex-col items-center gap-3.5 select-none pointer-events-auto">
                  {/* Like Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLike(spot, e.clientX, e.clientY);
                    }}
                    className="flex flex-col items-center gap-0.5 group active:scale-75 transition-transform cursor-pointer"
                    aria-label="Like Pop"
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                        isLiked
                          ? 'bg-rose-600/30 border-rose-500 text-rose-500 shadow-lg shadow-rose-500/40'
                          : 'bg-black/60 border-white/20 text-white group-hover:bg-white/20'
                      }`}
                    >
                      <svg className="w-5 h-5 fill-current transition-colors" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-white font-mono drop-shadow">
                      {likeCount}
                    </span>
                  </button>

                  {/* Comments / Replies Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (commentsDisabled) {
                        showToast('Comments are turned off for this Pop');
                      } else {
                        handleOpenComments(spot);
                      }
                    }}
                    className="flex flex-col items-center gap-0.5 group active:scale-75 transition-transform cursor-pointer"
                    title={commentsDisabled ? 'Comments Disabled' : 'Comments & Replies'}
                    aria-label="Comments"
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                        commentsDisabled
                          ? 'bg-black/40 border-white/10 text-white/30'
                          : 'bg-black/60 border-white/20 text-white group-hover:bg-white/20'
                      }`}
                    >
                      <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow">
                      {commentsDisabled ? 'Off' : (spot.commentsCount || 'Chat')}
                    </span>
                  </button>

                  {/* Pop React Emoji Trigger Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReactionsBar(prev => !prev);
                    }}
                    className="flex flex-col items-center gap-0.5 group active:scale-75 transition-transform cursor-pointer"
                    title="Pop React"
                    aria-label="React"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center group-hover:bg-white/20 transition-all shadow-md">
                      <span className="text-base">🔥</span>
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow">
                      {totalReactions > 0 ? totalReactions : 'React'}
                    </span>
                  </button>

                  {/* Share Button (Web Share / Direct Copy Link) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(spot);
                    }}
                    className="flex flex-col items-center gap-0.5 group active:scale-75 transition-transform cursor-pointer"
                    title="Share Pop"
                    aria-label="Share"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center group-hover:bg-white/20 transition-all shadow-md">
                      <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow">Share</span>
                  </button>

                  {/* Fly to Wall Button (Canvas Teleport) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      onFlyToSpot?.(spot);
                    }}
                    className="flex flex-col items-center gap-0.5 group active:scale-75 transition-transform cursor-pointer"
                    title="Teleport to coordinate on Wall"
                    aria-label="Fly to Spot"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/40 group-hover:scale-105 transition-all">
                      <svg className="w-5 h-5 fill-none stroke-white stroke-2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="white" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-black text-pink-300 drop-shadow uppercase tracking-wider">Wall</span>
                  </button>

                  {/* Rotating Vinyl Disc for Audio */}
                  {hasAudio && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAudioMuted(prev => !prev);
                      }}
                      className={`w-10 h-10 rounded-full border-2 border-white/40 bg-black flex items-center justify-center shadow-lg overflow-hidden cursor-pointer ${
                        isCurrentActive && !isAudioMuted ? 'animate-spin' : ''
                      }`}
                      style={{ animationDuration: '4s' }}
                      title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-600 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-black" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Emoji Reactions Floating Bar (When Toggled) */}
                {showReactionsBar && isCurrentActive && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-16 bottom-28 z-40 p-1.5 rounded-full bg-black/90 backdrop-blur-xl border border-white/20 flex items-center gap-1.5 shadow-2xl animate-fade-in"
                  >
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiReaction(spot, emoji)}
                        className="w-8 h-8 rounded-full hover:bg-white/20 active:scale-125 transition-transform text-lg flex items-center justify-center cursor-pointer"
                        title={`React ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bottom Info Bar: Creator, Caption, Description, Tags, Audio, Views */}
                <div className="absolute left-3.5 right-18 bottom-5 z-30 flex flex-col items-start gap-1 select-none pointer-events-auto text-left">
                  {/* Creator Pill with Interactive Follow & View Count */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (spot.creatorName) {
                          onClose();
                          onOpenCreatorProfile?.(spot.creatorName);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/20 cursor-pointer transition-colors shadow-md"
                    >
                      <span className="w-4.5 h-4.5 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-500 text-white flex items-center justify-center text-[9px] font-black">
                        {spot.creatorName?.[0]?.toUpperCase() || 'P'}
                      </span>
                      <span className="text-[11px] font-bold text-white tracking-wide">
                        @{spot.creatorName || 'creator'}
                      </span>
                    </div>

                    {spot.creatorName && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFollow(spot.creatorName);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer backdrop-blur-md border ${
                          isFollowing
                            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                            : 'bg-pink-500/30 border-pink-500/60 text-pink-300 hover:bg-pink-500/40'
                        }`}
                      >
                        {isFollowing ? '✓ Following' : '+ Follow'}
                      </button>
                    )}

                    {/* Real View Count Tag */}
                    <span className="text-[10px] font-mono text-white/70 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 flex items-center gap-1">
                      <span>👁️</span>
                      <span>{viewCount}</span>
                    </span>
                  </div>

                  {/* Headline */}
                  {spot.content?.headline && (
                    <h2 className="text-white font-extrabold text-sm sm:text-base leading-snug line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                      {renderRichText(spot.content.headline)}
                    </h2>
                  )}

                  {/* Subtext description with @mentions and #hashtags */}
                  {spot.content?.text && (
                    <p className="text-white/85 text-xs line-clamp-2 leading-snug drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                      {renderRichText(spot.content.text)}
                    </p>
                  )}

                  {/* Tags & Community Hashtags */}
                  {spot.content?.tags && spot.content.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      {spot.content.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-bold text-cyan-300 px-1.5 py-0.2 rounded-md bg-cyan-900/30 border border-cyan-500/30"
                        >
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Audio Ticker if Present */}
                  {hasAudio && (
                    <div className="flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-pink-300 text-[10px] font-mono font-medium">
                      <span className="animate-spin text-xs">🎵</span>
                      <span className="truncate max-w-[150px]">
                        Original Audio • {spot.creatorName || 'creator'}
                      </span>
                      <span className="text-white/50">({Math.round(spot.content.audio?.duration || 15)}s)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 
          COMMENTS & REPLIES BOTTOM SHEET DRAWER
          Interactive native drawer sliding up from the bottom!
        */}
        {isCommentsOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 max-h-[72%] h-[480px] bg-[#10121C]/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/20 z-50 flex flex-col shadow-2xl animate-slide-up"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Comments</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">
                  {commentsList.length}
                </span>
              </div>
              <button
                onClick={() => setIsCommentsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 text-white/80 hover:bg-white/20 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Comment List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
              {commentsList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <span className="text-3xl mb-2">💬</span>
                  <p className="text-xs font-semibold text-slate-300">No comments yet</p>
                  <p className="text-[11px] text-slate-500">Be the first to share your thoughts, tag @friends, or #tags!</p>
                </div>
              ) : (
                commentsList.map((c) => (
                  <div key={c.id} className="space-y-2">
                    <div className="flex items-start gap-2.5 text-left">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                        {c.authorName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">@{c.authorName}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 mt-0.5 leading-snug">
                          {renderRichText(c.text)}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-semibold">
                          <button
                            onClick={() => setReplyingTo({ id: c.id, authorName: c.authorName })}
                            className="text-pink-400 hover:underline cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Nested Replies */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="pl-9 space-y-2 border-l border-white/10 ml-3.5">
                        {c.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start gap-2 text-left">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                              {reply.authorName?.[0]?.toUpperCase() || 'R'}
                            </div>
                            <div className="flex-1">
                              <span className="text-[11px] font-bold text-white">@{reply.authorName}</span>
                              <p className="text-[11px] text-slate-300 mt-0.5">{renderRichText(reply.text)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Replying banner */}
            {replyingTo && (
              <div className="px-4 py-1.5 bg-pink-500/10 border-t border-pink-500/20 flex items-center justify-between text-xs text-pink-300">
                <span>Replying to @{replyingTo.authorName}</span>
                <button onClick={() => setReplyingTo(null)} className="font-bold hover:underline cursor-pointer">
                  Cancel
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-white/10 bg-black/60 flex items-center gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                placeholder={replyingTo ? `Reply to @${replyingTo.authorName}...` : 'Add comment... tag @people or #tags'}
                className="flex-1 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF2E93]"
              />
              <button
                onClick={handlePostComment}
                disabled={!commentInput.trim() || isSubmittingComment}
                className="px-4 py-2 rounded-full bg-[#FF2E93] text-white font-bold text-xs hover:bg-[#FF007F] active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
