import React, { useState, useEffect } from 'react';
import { ActivityEvent } from '../../types';
import { api } from '../../services/api';

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSpotById: (spotId: string) => void;
  onUpdateUnreadCount?: (count: number) => void;
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSpotById,
  onUpdateUnreadCount,
}) => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('spotpop_last_activity_read');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Fetch activity & poll
  const fetchActivity = async () => {
    try {
      const res = await api.getActivity();
      const list = res.activity || [];
      setActivities(list);

      // Calculate unread count
      const unread = list.filter(a => new Date(a.timestamp).getTime() > lastReadTimestamp).length;
      if (onUpdateUnreadCount) {
        onUpdateUnreadCount(unread);
      }
    } catch (err) {
      console.warn('Activity fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 12000);
    return () => clearInterval(interval);
  }, [lastReadTimestamp]);

  const markAllAsRead = () => {
    const now = Date.now();
    setLastReadTimestamp(now);
    localStorage.setItem('spotpop_last_activity_read', now.toString());
    if (onUpdateUnreadCount) onUpdateUnreadCount(0);
  };

  const unreadCount = activities.filter(a => new Date(a.timestamp).getTime() > lastReadTimestamp).length;
  const displayedActivities = filter === 'unread'
    ? activities.filter(a => new Date(a.timestamp).getTime() > lastReadTimestamp)
    : activities;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden mt-4 sm:mt-12 animate-fade-in text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF2E93] to-amber-500 flex items-center justify-center text-lg shadow-sm">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-outfit font-bold text-base text-white">Live Activity</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF2E93] text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Real-time canvas claims & milestones</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all font-semibold"
              >
                Mark read
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-5 py-2.5 bg-black/20 border-b border-white/10 flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All Activity ({activities.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF5EAA] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Activity Feed List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
          {loading ? (
            <div className="py-14 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
              <span className="w-5 h-5 rounded-full border-2 border-[#FF2E93] border-t-transparent animate-spin" />
              <span>Loading recent activity...</span>
            </div>
          ) : displayedActivities.length === 0 ? (
            <div className="py-14 text-center text-slate-500 text-sm">
              {filter === 'unread'
                ? 'No unread notifications. You are all caught up!'
                : 'No recent activity yet. Be the first to claim a spot on the canvas!'}
            </div>
          ) : (
            displayedActivities.map((act) => {
              const isUnread = new Date(act.timestamp).getTime() > lastReadTimestamp;

              return (
                <div
                  key={act.id}
                  onClick={() => {
                    if (act.spotId) {
                      onSelectSpotById(act.spotId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                    isUnread
                      ? 'bg-white/10 border-[#FF2E93]/40'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20'
                  } ${act.spotId ? 'cursor-pointer group' : ''}`}
                >
                  {/* Icon Indicator */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-yellow-500/20 border border-white/10 flex items-center justify-center shrink-0 text-lg shadow-sm">
                    {act.type === 'claimed'
                      ? act.tier === 'big_pop' ? '👑' : '🎯'
                      : act.type === 'shared' ? '🚀'
                      : '✨'}
                  </div>

                  {/* Body text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white group-hover:text-[#FF5EAA] transition-colors">
                        {act.creatorName}
                      </span>
                      {act.tier && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-xs ${
                          act.tier === 'big_pop'
                            ? 'bg-[#FF2E93]/20 text-[#FF5EAA] border border-[#FF2E93]/30'
                            : 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                        }`}>
                          {act.tier === 'big_pop' ? 'BIG POP' : 'MINI POP'}
                        </span>
                      )}
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#FF2E93] animate-pulse" />
                      )}
                    </div>

                    <div className="text-xs text-slate-300 leading-snug mt-1">
                      {act.message}
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono mt-1.5 flex items-center gap-2">
                      <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span>{new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Action arrow */}
                  {act.spotId && (
                    <div className="text-slate-500 group-hover:text-[#FF2E93] text-xs font-bold shrink-0 self-center transition-colors">
                      Fly →
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
