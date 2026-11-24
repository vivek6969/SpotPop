import React from 'react';
import { PlanDraft } from './types';

interface AudienceTabProps {
  currentDraft: PlanDraft;
  updateDraft: (updates: Partial<PlanDraft>) => void;
}

const POPULAR_TAGS = [
  '#art',
  '#photography',
  '#travel',
  '#love',
  '#friends',
  '#memories',
  '#music',
  '#summer',
  '#vibes',
  '#cool',
];

const POPULAR_LOCATIONS = [
  'Mumbai, India',
  'Delhi, India',
  'Bengaluru, India',
  'Goa, India',
  'Paris, France',
  'New York, USA',
  'Tokyo, Japan',
  'London, UK',
];

export const AudienceTab: React.FC<AudienceTabProps> = ({
  currentDraft,
  updateDraft,
}) => {
  const currentTags = currentDraft.tags || [];

  const handleTagToggle = (tag: string) => {
    const formatted = tag.startsWith('#') ? tag : `#${tag}`;
    if (currentTags.includes(formatted)) {
      updateDraft({ tags: currentTags.filter((t) => t.toLowerCase() !== formatted.toLowerCase()) });
    } else {
      updateDraft({ tags: [...currentTags, formatted] });
    }
  };

  return (
    <div className="space-y-4 p-1 animate-fade-in text-left">
      <div>
        <h4 className="text-sm font-bold text-white font-outfit">Pop Details & Discovery</h4>
        <p className="text-xs text-slate-400 mt-0.5">
          Add optional title, description, location, and tags so anyone can search and discover your pop.
        </p>
      </div>

      {/* 1. Optional Title */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 focus-within:border-[#FF2E93] transition-colors">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>🏷️</span>
            <span>Pop Title (Optional)</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            {(currentDraft.title || '').length}/60
          </span>
        </div>
        <input
          type="text"
          maxLength={60}
          value={currentDraft.title || ''}
          onChange={(e) => updateDraft({ title: e.target.value })}
          placeholder="e.g. Sunset in Paris, College Farewell, Coffee Vibes..."
          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#FF2E93]"
        />
      </div>

      {/* 2. Optional Description / Caption */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 focus-within:border-cyan-400 transition-colors">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>📝</span>
            <span>Description & Story (Optional)</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            {(currentDraft.description || '').length}/300
          </span>
        </div>
        <textarea
          rows={2}
          maxLength={300}
          value={currentDraft.description || ''}
          onChange={(e) => updateDraft({ description: e.target.value })}
          placeholder="Write a caption, memory, or story behind this Pop..."
          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-normal placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
        />
      </div>

      {/* 3. Optional Location */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 focus-within:border-amber-400 transition-colors">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>📍</span>
            <span>Location (Optional)</span>
          </label>
          {currentDraft.location && (
            <button
              type="button"
              onClick={() => updateDraft({ location: '' })}
              className="text-[10px] text-slate-400 hover:text-rose-400 font-semibold cursor-pointer"
            >
              ✕ Clear
            </button>
          )}
        </div>
        <input
          type="text"
          maxLength={60}
          value={currentDraft.location || ''}
          onChange={(e) => updateDraft({ location: e.target.value })}
          placeholder="e.g. Paris, France · Central Park, NYC · Mumbai"
          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
        />
        {/* Quick Location Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {POPULAR_LOCATIONS.map((loc) => {
            const isSelected = currentDraft.location === loc;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => updateDraft({ location: isSelected ? '' : loc })}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-black shadow-sm font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                📍 {loc}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Hashtags for Discovery */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 focus-within:border-purple-400 transition-colors">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>#️⃣</span>
            <span># Hashtags & Topics (Optional)</span>
          </label>
          {currentTags.length > 0 && (
            <span className="text-[10px] text-slate-400 font-mono">
              {currentTags.length} tag{currentTags.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <input
          type="text"
          value={currentTags.join(' ')}
          onChange={(e) => {
            const raw = e.target.value;
            const tagsArray = raw
              .split(/\s+/)
              .filter(Boolean)
              .map((t) => (t.startsWith('#') ? t : `#${t}`));
            updateDraft({ tags: tagsArray });
          }}
          placeholder="#travel #photography #music #love"
          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
        />
        {/* Quick Tag Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {POPULAR_TAGS.map((tag) => {
            const isSelected = currentTags.some((t) => t.toLowerCase() === tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white font-bold shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {tag} {isSelected ? '✓' : '+'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Visibility Selector */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
          Audience & Privacy
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'public', label: 'Public', icon: '🌍', desc: 'Anyone can view & search' },
            { id: 'friends_only', label: 'Friends Only', icon: '👥', desc: 'Followers can unlock' },
            { id: 'private', label: 'Private', icon: '🔒', desc: 'Only you can view' },
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

      {/* 6. Allow Comments Toggle */}
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
    </div>
  );
};
