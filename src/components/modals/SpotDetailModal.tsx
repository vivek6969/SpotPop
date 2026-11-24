import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Spot, User, Comment } from '../../types';
import { api } from '../../services/api';
import { SpotCard } from '../canvas/SpotCard';
import { SpotAudioPlayer } from '../audio/SpotAudioPlayer';

const QUICK_REACTIONS = ['🔥', '❤️', '👏', '😂', '😮', '🚀', '💯'];

interface SpotDetailModalProps {
  spot: Spot | null;
  currentUser: User | null;
  authToken?: string | null;
  onClose: () => void;
  onOpenShareKit: (spot: Spot) => void;
  onFlyToSpot: (spot: Spot) => void;
  onOpenCreatorProfile?: (username: string) => void;
  onEditSpot?: (spot: Spot) => void;
  onDeleteSpot?: (spot: Spot) => void;
  onFollowChange?: (creatorName: string, isFollowing: boolean) => void;
}

export const SpotDetailModal: React.FC<SpotDetailModalProps> = ({
  spot,
  currentUser,
  authToken,
  onClose,
  onOpenShareKit,
  onFlyToSpot,
  onOpenCreatorProfile,
  onEditSpot,
  onDeleteSpot,
  onFollowChange,
}) => {
  if (!spot) return null;

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportDetails, setReportDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const publicUrl = `${window.location.origin}?spot=${spot.slug || spot.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isOwner = Boolean(
    currentUser && (
      currentUser.role === 'admin' ||
      spot.ownerId === currentUser.id ||
      currentUser.ownedSpotIds?.includes(spot.id)
    )
  );

  const [isFollowing, setIsFollowing] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('spotpop_followed_creators');
      const set = saved ? new Set(JSON.parse(saved)) : new Set();
      return set.has(spot.creatorName);
    } catch {
      return false;
    }
  });
  const [isRequested, setIsRequested] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [unlockedLocally, setUnlockedLocally] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('spotpop_followed_creators');
      const set = saved ? new Set(JSON.parse(saved)) : new Set();
      setIsFollowing(set.has(spot.creatorName));
    } catch {}
  }, [spot.creatorName]);

  const isSpotLocked = Boolean(spot.isLocked && !isOwner && !isFollowing && !unlockedLocally);

  const handleFollowToUnlock = async () => {
    if (!spot.creatorName || isFollowingLoading) return;
    setIsFollowingLoading(true);
    try {
      const res = await api.followUser(spot.creatorName, authToken || undefined);
      if (res.followStatus === 'accepted' || res.isFollowing) {
        setIsFollowing(true);
        setIsRequested(false);
        setUnlockedLocally(true);
        try {
          const saved = localStorage.getItem('spotpop_followed_creators');
          const set = saved ? new Set(JSON.parse(saved)) : new Set();
          set.add(spot.creatorName);
          localStorage.setItem('spotpop_followed_creators', JSON.stringify(Array.from(set)));
        } catch {}
        onFollowChange?.(spot.creatorName, true);
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6, x: 0.5 },
          colors: ['#FF2E93', '#7928CA', '#00F0FF'],
        });
      } else if (res.followStatus === 'pending' || res.isRequested) {
        setIsRequested(true);
        setIsFollowing(false);
        setUnlockedLocally(false);
      }
    } catch (e) {
      console.warn('Follow error in modal:', e);
    } finally {
      setIsFollowingLoading(false);
    }
  };

  // Social Interactions: Likes
  const [isLiked, setIsLiked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('spotpop_liked_spots');
      const set = saved ? new Set(JSON.parse(saved)) : new Set();
      return set.has(spot.id);
    } catch {
      return false;
    }
  });
  const [likeCount, setLikeCount] = useState<number>(spot.likesCount || spot.sharesCount || 0);

  const handleToggleLike = async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      const saved = localStorage.getItem('spotpop_liked_spots');
      const set = saved ? new Set(JSON.parse(saved)) : new Set();
      if (nextLiked) set.add(spot.id);
      else set.delete(spot.id);
      localStorage.setItem('spotpop_liked_spots', JSON.stringify(Array.from(set)));
    } catch {}

    if (nextLiked) {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.65, x: 0.35 },
        colors: ['#FF2E93', '#FF007F', '#FFB800'],
      });
    }

    try {
      const res = await api.toggleSpotLike(spot.id, nextLiked ? 'like' : 'unlike');
      if (res?.likesCount !== undefined) {
        setLikeCount(res.likesCount);
      }
    } catch (e) {
      console.warn('Like toggle error:', e);
    }
  };

  // Social Interactions: Pop React Emojis
  const [reactions, setReactions] = useState<Record<string, number>>(spot.reactions || {});
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);

  const handleEmojiReaction = async (emoji: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    const x = window.innerWidth / 2 + (Math.random() * 80 - 40);
    const y = window.innerHeight * 0.6;
    setFloatingEmojis(prev => [...prev, { id, emoji, x, y }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 1200);

    setReactions(prev => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1,
    }));

    try {
      const res = await api.sendReaction(spot.id, emoji);
      if (res) {
        setReactions(res);
      }
    } catch (e) {
      console.warn('Reaction error:', e);
    }
  };

  // Social Interactions: Comments & Replies
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentCount, setCommentCount] = useState<number>(spot.commentsCount || 0);

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await api.getComments(spot.id);
      setCommentsList(res || []);
      setCommentCount((res || []).length);
    } catch (err) {
      console.warn('Failed to load comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [spot.id]);

  const handlePostComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentInput.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const authorName = currentUser?.displayName || currentUser?.username || 'You';
      const authorAvatar = currentUser?.avatarUrl;
      const newComment = await api.addComment(
        spot.id,
        commentInput.trim(),
        replyingTo?.id,
        authorName,
        authorAvatar
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
          return [...prev, newComment];
        });
        setCommentCount(c => c + 1);
        setCommentInput('');
        setReplyingTo(null);
      }
    } catch (err) {
      console.warn('Failed to post comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

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

  const handleDelete = async () => {
    if (!onDeleteSpot) return;
    setIsDeleting(true);
    try {
      await onDeleteSpot(spot);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to delete Pop');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportStatus('submitting');
    try {
      await api.submitReport({
        spotId: spot.id,
        reason: reportReason,
        details: reportDetails,
        reporterEmail: reporterEmail || undefined,
      });
      setReportStatus('submitted');
    } catch (e) {
      alert('Could not submit report. Please try again.');
      setReportStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
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

      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/30">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF2E93] shrink-0" />
            <button
              onClick={() => {
                if (onOpenCreatorProfile) {
                  onClose();
                  onOpenCreatorProfile(spot.creatorName);
                }
              }}
              className="font-outfit font-bold text-base text-white hover:text-[#FF5EAA] truncate max-w-[200px] sm:max-w-[260px] text-left transition-colors flex items-center gap-1 group cursor-pointer"
              title="View Creator Profile"
            >
              <span>{spot.creatorName}&apos;s Spot</span>
              <span className="text-xs text-slate-500 group-hover:text-white transition-colors">↗</span>
            </button>
            {spot.tier === 'big_pop' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FF2E93]/20 text-[#FF5EAA] border border-[#FF2E93]/30 shrink-0">
                BIG POP
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Spot Visual Showcase */}
        <div className="p-6 flex flex-col items-center justify-center bg-[#090A0F] border-b border-white/10 relative overflow-hidden">
          {/* Glowing backdrop */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[#FF2E93]/15 filter blur-3xl pointer-events-none" />

          {/* Render Spot */}
          <div className="relative shadow-2xl transition-transform hover:scale-102">
            <SpotCard
              tier={spot.tier}
              shape={spot.shape}
              background={spot.background}
              borderColor={spot.borderColor}
              content={spot.content}
              creatorName={spot.creatorName}
              rotation={spot.rotation || 0}
              width={spot.width}
              height={spot.height}
              isLocked={isSpotLocked}
            />
          </div>
        </div>

        {/* Details & Metadata */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {/* FRIENDS ONLY UNLOCK PROMPT */}
          {isSpotLocked && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900/40 border border-pink-500/40 flex flex-col items-center text-center gap-2.5 shadow-xl animate-fade-in">
              <div className="w-11 h-11 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-2xl animate-bounce shadow-lg shadow-pink-500/30">
                🔒
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-outfit">Friends Only Pop</h4>
                <p className="text-xs text-white/70 max-w-xs mt-0.5 leading-snug">
                  Only followers of @{spot.creatorName} can see this photo, drawing, and voice memory.
                </p>
              </div>
              {isRequested ? (
                <div className="mt-1 flex flex-col items-center gap-1.5 w-full">
                  <div className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-2">
                    <span>⏳</span>
                    <span>Follow Requested — Waiting for Approval</span>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center max-w-xs">
                    This account is private. As soon as @{spot.creatorName} accepts your request, this Pop will unlock.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isFollowingLoading}
                  onClick={handleFollowToUnlock}
                  className="mt-1 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF2E93] to-purple-600 hover:from-[#FF4EAA] hover:to-purple-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-pink-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>{isFollowingLoading ? 'Sending Request...' : `+ Follow @${spot.creatorName} to Unlock`}</span>
                </button>
              )}
            </div>
          )}

          {/* OWNER ACTION TOOLBAR */}
          {isOwner && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/30 via-[#FF2E93]/20 to-pink-900/30 border border-[#FF2E93]/40 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-pink-200">
                  <span>✨</span>
                  <span>You own this Pop</span>
                </div>
                <span className="text-[10px] text-slate-400">Owner Controls</span>
              </div>

              <div className="flex items-center gap-2">
                {onEditSpot && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditSpot(spot);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF2E93] to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>✏️ Edit My Pop</span>
                  </button>
                )}

                {onDeleteSpot && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🗑️ Delete</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Optional Voice Message / Sound Clip (Big Pop Exclusive) */}
          {spot.content?.audio && !isSpotLocked && (
            <SpotAudioPlayer
              audio={spot.content.audio}
              creatorName={spot.creatorName}
            />
          )}

          {/* ================= SOCIAL ENGAGEMENT & REACTION BAR ================= */}
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Like Button */}
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                    isLiked
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-md shadow-rose-500/20'
                      : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10'
                  }`}
                  title={isLiked ? 'Unlike' : 'Like'}
                >
                  <svg className={`w-4 h-4 fill-current ${isLiked ? 'text-rose-500' : 'text-white/70'}`} viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>{likeCount}</span>
                </button>

                {/* Comments Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsCommentsOpen(prev => !prev)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                    isCommentsOpen
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/20'
                      : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10'
                  }`}
                  title={isCommentsOpen ? 'Hide Comments' : 'View Comments'}
                >
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{commentCount}</span>
                </button>
              </div>

              {/* Quick Pop Reactions */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {QUICK_REACTIONS.map((emoji) => {
                  const count = reactions[emoji] || 0;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiReaction(emoji)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs transition-transform active:scale-90 cursor-pointer"
                      title={`React with ${emoji}`}
                    >
                      <span>{emoji}</span>
                      {count > 0 && <span className="text-[10px] text-white/70 font-mono font-bold">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Likes</div>
              <div className="text-sm font-bold text-rose-400 mt-0.5">
                {likeCount.toLocaleString()}
              </div>
            </div>
            <div className="border-x border-white/10">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Views</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {(spot.viewsCount || 1).toLocaleString()}
              </div>
            </div>
            <div className="border-r border-white/10">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Comments</div>
              <div className="text-sm font-bold text-cyan-400 mt-0.5">
                {commentCount.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Shares</div>
              <div className="text-sm font-bold text-[#FF2E93] mt-0.5">
                {(spot.sharesCount || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* ================= IN-MODAL COMMENTS & REPLIES THREAD ================= */}
          {isCommentsOpen && (
            <div className="rounded-2xl bg-black/40 border border-white/15 p-3.5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">💬 Comments</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono font-bold">
                    {commentsList.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCommentsOpen(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {/* Comment List */}
              <div className="max-h-56 overflow-y-auto space-y-3 no-scrollbar pr-1">
                {commentsLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading comments...</div>
                ) : commentsList.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 space-y-1">
                    <p className="text-xs font-semibold text-slate-300">No comments yet</p>
                    <p className="text-[11px] text-slate-500">Be the first to share your thoughts, tag @friends, or #tags!</p>
                  </div>
                ) : (
                  commentsList.map((c) => (
                    <div key={c.id} className="space-y-1.5 text-left">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF2E93] to-purple-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          {c.authorName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">@{c.authorName}</span>
                            <span className="text-[9px] text-slate-500">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 mt-0.5 leading-snug">
                            {renderRichText(c.text)}
                          </p>
                          <div className="mt-1">
                            <button
                              type="button"
                              onClick={() => setReplyingTo({ id: c.id, authorName: c.authorName })}
                              className="text-[10px] font-semibold text-pink-400 hover:underline cursor-pointer"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Nested Replies */}
                      {c.replies && c.replies.length > 0 && (
                        <div className="pl-8 space-y-1.5 border-l border-white/10 ml-3">
                          {c.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2 text-left">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                                {reply.authorName?.[0]?.toUpperCase() || 'R'}
                              </div>
                              <div className="flex-1 min-w-0">
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
                <div className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-between text-xs text-pink-300">
                  <span>Replying to @{replyingTo.authorName}</span>
                  <button type="button" onClick={() => setReplyingTo(null)} className="font-bold hover:underline cursor-pointer">
                    Cancel
                  </button>
                </div>
              )}

              {/* Comment Input */}
              {spot.allowComments === false ? (
                <div className="text-xs text-slate-400 text-center py-2 bg-white/5 rounded-xl">
                  Comments are disabled for this Pop
                </div>
              ) : (
                <form onSubmit={handlePostComment} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder={replyingTo ? `Reply to @${replyingTo.authorName}...` : 'Add a comment, @mention, #tag...'}
                    maxLength={280}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                  <button
                    type="submit"
                    disabled={!commentInput.trim() || isSubmittingComment}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF2E93] to-purple-600 hover:from-[#FF4EAA] hover:to-purple-500 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <span>{isSubmittingComment ? '...' : 'Post'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFlyToSpot(spot)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🎯 Center on Canvas</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{copiedLink ? 'Copied! ✓' : '🔗 Link'}</span>
            </button>
          </div>

          {/* Report Content Accordion */}
          {!showReportForm ? (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowReportForm(true)}
                className="text-xs text-slate-500 hover:text-slate-400 underline transition-colors cursor-pointer"
              >
                Report this spot for inappropriate content
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-white">Report Spot</h5>
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="text-xs text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {reportStatus === 'submitted' ? (
                <div className="text-xs text-emerald-400 py-2">
                  Thank you. Your report has been submitted to the moderation team for review.
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-2">
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  >
                    <option value="inappropriate">Inappropriate or offensive content</option>
                    <option value="hate_speech">Hate speech or harassment</option>
                    <option value="copyright">Copyright or trademark violation</option>
                    <option value="spam">Spam or commercial abuse</option>
                    <option value="other">Other reason</option>
                  </select>

                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide brief details..."
                    rows={2}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />

                  <button
                    type="submit"
                    disabled={reportStatus === 'submitting'}
                    className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                  >
                    {reportStatus === 'submitting' ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Primary Share CTA */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenShareKit(spot)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white font-outfit font-bold text-sm shadow-lg shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🚀 Open Viral Share Kit</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#171A29] border border-rose-500/30 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="text-2xl">🗑️</span>
              <h4 className="font-outfit font-bold text-base text-white">Delete Your Pop?</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this Pop from the canvas? This action cannot be undone.
            </p>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/30"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Pop</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
