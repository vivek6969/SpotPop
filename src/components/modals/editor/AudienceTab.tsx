import React from 'react';
import { PlanDraft } from './types';

interface AudienceTabProps {
  currentDraft: PlanDraft;
  updateDraft: (updates: Partial<PlanDraft>) => void;
}

export const AudienceTab: React.FC<AudienceTabProps> = ({
  currentDraft,
  updateDraft,
}) => {
  return (
    <div className="space-y-4 p-1 animate-fade-in text-left">
      <div>
        <h4 className="text-sm font-bold text-white font-outfit">Audience & Privacy</h4>
        <p className="text-xs text-slate-400 mt-0.5">
          Control who can see your card on the canvas and who can interact with it.
        </p>
      </div>

      {/* Visibility Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
          Who can view this Pop
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'public', label: 'Public', icon: '🌍', desc: 'Anyone on the canvas can view' },
            { id: 'friends_only', label: 'Friends Only', icon: '👥', desc: 'Only your followers can unlock' },
            { id: 'private', label: 'Private', icon: '🔒', desc: 'Only you can view this pop' },
          ].map((opt) => {
            const isSelected = (currentDraft.visibility || 'public') === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateDraft({ visibility: opt.id as any })}
                className={`p-3 rounded-2xl border text-left flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#FF2E93]/25 to-purple-600/25 border-[#FF2E93] text-white shadow-lg shadow-pink-500/20 ring-1 ring-[#FF2E93]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-xs font-bold leading-tight">{opt.label}</span>
                <span className="text-[10px] opacity-75 leading-tight">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Allow Comments Toggle */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between transition-colors">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>💬</span>
            <span>Allow Comments</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {currentDraft.allowComments ?? true
              ? 'Anyone with access can comment and reply'
              : 'Comments are turned off on this Pop'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => updateDraft({ allowComments: !(currentDraft.allowComments ?? true) })}
          className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
            (currentDraft.allowComments ?? true) ? 'bg-[#FF2E93]' : 'bg-slate-700'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5.5 h-5.5 rounded-full bg-white transition-transform shadow-md ${
              (currentDraft.allowComments ?? true) ? 'translate-x-5.5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Hashtags for Discovery */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
        <label className="text-xs font-bold text-white flex items-center gap-1.5">
          <span>🏷️</span>
          <span>Hashtags & Topics</span>
        </label>
        <p className="text-[11px] text-slate-400">
          Add tags to help people find your pop in Search and Explore.
        </p>
        <input
          type="text"
          value={(currentDraft.tags || []).join(' ')}
          onChange={(e) => {
            const raw = e.target.value;
            const tagsArray = raw
              .split(/\s+/)
              .filter(Boolean)
              .map(t => (t.startsWith('#') ? t : `#${t}`));
            updateDraft({ tags: tagsArray });
          }}
          placeholder="#photography #art #music #travel"
          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-hidden focus:border-[#FF2E93]"
        />
      </div>
    </div>
  );
};
