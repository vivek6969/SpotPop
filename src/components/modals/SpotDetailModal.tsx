import React, { useState } from 'react';
import { Spot, User } from '../../types';
import { api } from '../../services/api';
import { SpotCard } from '../canvas/SpotCard';
import { SpotAudioPlayer } from '../audio/SpotAudioPlayer';

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
      currentUser.ownedSpotIds?.includes(spot.id) ||
      spot.creatorName.toLowerCase() === currentUser.displayName.toLowerCase() ||
      spot.creatorName.toLowerCase() === currentUser.username.toLowerCase()
    )
  );

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
            />
          </div>
        </div>

        {/* Details & Metadata */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
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
          {spot.content?.audio && (
            <SpotAudioPlayer
              audio={spot.content.audio}
              creatorName={spot.creatorName}
            />
          )}

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Views</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {(spot.viewsCount || 1).toLocaleString()}
              </div>
            </div>
            <div className="border-x border-white/10">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Shares</div>
              <div className="text-sm font-bold text-[#FF2E93] mt-0.5">
                {(spot.sharesCount || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Claimed</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">
                {new Date(spot.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

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
