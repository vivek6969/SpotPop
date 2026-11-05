import React, { useState, useEffect } from 'react';
import { ActivityEvent, Spot } from '../../types';
import { api } from '../../services/api';

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSpotById: (spotId: string) => void;
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSpotById,
}) => {
  if (!isOpen) return null;

  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getActivity()
      .then(res => setActivities(res.activity || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden mt-6 animate-fade-in">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="font-outfit font-bold text-base text-white">Live Activity</h3>
              <p className="text-[11px] text-slate-400">Real-time canvas events & claims</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Activity Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading recent activity...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No recent activity yet. Be the first to claim a spot!
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                onClick={() => {
                  if (act.spotId) {
                    onSelectSpotById(act.spotId);
                    onClose();
                  }
                }}
                className={`p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-start gap-3 ${
                  act.spotId ? 'cursor-pointer' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500/20 to-yellow-500/20 border border-white/10 flex items-center justify-center shrink-0 text-base">
                  {act.type === 'claimed' ? '🎯' : act.type === 'shared' ? '🚀' : '✨'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white leading-snug">
                    {act.message}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {act.spotId && (
                  <span className="text-xs text-[#FF2E93] shrink-0 font-medium">View →</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
