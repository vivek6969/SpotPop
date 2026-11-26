import React, { useState, useEffect } from 'react';
import { PlanDraft } from './types';
import { MentionHashtagPopover } from '../../common/MentionHashtagPopover';
import { api } from '../../../services/api';
import { Spot } from '../../../types';

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
  const currentTaggedUsers = currentDraft.taggedUsers || [];

  // Active mention/hashtag popover states for tag input
  const [tagInput, setTagInput] = useState('');
  const [showTagPopover, setShowTagPopover] = useState(false);

  // Active mention popover states for friend tagging
  const [friendInput, setFriendInput] = useState('');
  const [showFriendPopover, setShowFriendPopover] = useState(false);

  // Location auto-suggestions
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Description cursor-aware auto-suggestions (@ and #)
  const [descTrigger, setDescTrigger] = useState<'@' | '#' | null>(null);
  const [descToken, setDescToken] = useState('');
  const [descCursorIndex, setDescCursorIndex] = useState(0);

  // Title cursor-aware auto-suggestions (@ and #)
  const [titleTrigger, setTitleTrigger] = useState<'@' | '#' | null>(null);
  const [titleToken, setTitleToken] = useState('');
  const [titleCursorIndex, setTitleCursorIndex] = useState(0);

  // Connected spots auto-suggestions
  const [availableSpots, setAvailableSpots] = useState<Spot[]>([]);
  const [showSpotDropdown, setShowSpotDropdown] = useState(false);

  useEffect(() => {
    // Load existing spots for easy memory thread connection
    api.getExploreSpots({ limit: 12 }).then((res) => {
      setAvailableSpots(res.spots || []);
    }).catch(() => {});
  }, []);

  const handleTagToggle = (tag: string) => {
    const formatted = tag.startsWith('#') ? tag : `#${tag}`;
    if (currentTags.some((t) => t.toLowerCase() === formatted.toLowerCase())) {
      updateDraft({ tags: currentTags.filter((t) => t.toLowerCase() !== formatted.toLowerCase()) });
    } else {
      updateDraft({ tags: [...currentTags, formatted] });
    }
  };

  const handleAddTag = (rawTag: string) => {
    const clean = rawTag.trim();
    if (!clean) return;
    const formatted = clean.startsWith('#') ? clean : `#${clean}`;
    if (!currentTags.some((t) => t.toLowerCase() === formatted.toLowerCase())) {
      updateDraft({ tags: [...currentTags, formatted] });
    }
    setTagInput('');
    setShowTagPopover(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateDraft({ tags: currentTags.filter((t) => t !== tagToRemove) });
  };

  const handleAddFriend = (userHandle: string) => {
    const clean = userHandle.trim().replace(/^@/, '');
    if (!clean) return;
    if (!currentTaggedUsers.some((u) => u.toLowerCase() === clean.toLowerCase())) {
      updateDraft({ taggedUsers: [...currentTaggedUsers, clean] });
    }
    setFriendInput('');
    setShowFriendPopover(false);
  };

  const handleRemoveFriend = (userToRemove: string) => {
    updateDraft({ taggedUsers: currentTaggedUsers.filter((u) => u !== userToRemove) });
  };

  const handleToggleConnectedSpot = (spotId: string) => {
    const existing = currentDraft.connectedSpotIds || [];
    if (existing.includes(spotId)) {
      updateDraft({ connectedSpotIds: existing.filter((id) => id !== spotId) });
    } else {
      updateDraft({ connectedSpotIds: [...existing, spotId] });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    updateDraft({ description: val });
    const cursor = e.target.selectionStart || 0;
    setDescCursorIndex(cursor);

    const before = val.slice(0, cursor);
    const match = before.match(/([@#][a-zA-Z0-9_]*)$/);
    if (match) {
      const t = match[1];
      setDescTrigger(t[0] as '@' | '#');
      setDescToken(t);
    } else {
      setDescTrigger(null);
      setDescToken('');
    }
  };

  const handleSelectDescSuggestion = (completed: string) => {
    const desc = currentDraft.description || '';
    const before = desc.slice(0, descCursorIndex);
    const after = desc.slice(descCursorIndex);
    const updatedBefore = before.replace(/([@#][a-zA-Z0-9_]*)$/, completed);
    updateDraft({ description: updatedBefore + after });
    setDescTrigger(null);
    setDescToken('');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateDraft({ title: val });
    const cursor = e.target.selectionStart || 0;
    setTitleCursorIndex(cursor);

    const before = val.slice(0, cursor);
    const match = before.match(/([@#][a-zA-Z0-9_]*)$/);
    if (match) {
      const t = match[1];
      setTitleTrigger(t[0] as '@' | '#');
      setTitleToken(t);
    } else {
      setTitleTrigger(null);
      setTitleToken('');
    }
  };

  const handleSelectTitleSuggestion = (completed: string) => {
    const title = currentDraft.title || '';
    const before = title.slice(0, titleCursorIndex);
    const after = title.slice(titleCursorIndex);
    const updatedBefore = before.replace(/([@#][a-zA-Z0-9_]*)$/, completed);
    updateDraft({ title: updatedBefore + after });
    setTitleTrigger(null);
    setTitleToken('');
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
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 focus-within:border-[#FF2E93] transition-colors relative">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>🏷️</span>
            <span>Pop Title (Optional)</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            {(currentDraft.title || '').length}/60
          </span>
        </div>
        <div className="relative">
          {titleTrigger && (
            <MentionHashtagPopover
              trigger={titleTrigger}
              token={titleToken}
              onSelect={handleSelectTitleSuggestion}
              onClose={() => setTitleTrigger(null)}
              position="bottom"
              className="w-full"
            />
          )}
          <input
            type="text"
            maxLength={60}
            value={currentDraft.title || ''}
            onChange={handleTitleChange}
            placeholder="e.g. Sunset in Paris, College Farewell, Coffee Vibes..."
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#FF2E93]"
          />
        </div>
      </div>

      {/* 2. Optional Description / Caption */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 focus-within:border-cyan-400 transition-colors relative">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>📝</span>
            <span>Description & Story (Optional)</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            {(currentDraft.description || '').length}/300
          </span>
        </div>
        <div className="relative">
          {descTrigger && (
            <MentionHashtagPopover
              trigger={descTrigger}
              token={descToken}
              onSelect={handleSelectDescSuggestion}
              onClose={() => setDescTrigger(null)}
              position="bottom"
              className="w-full"
            />
          )}
          <textarea
            rows={2}
            maxLength={300}
            value={currentDraft.description || ''}
            onChange={handleDescriptionChange}
            placeholder="Write a caption, memory, or story behind this Pop..."
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-normal placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
          />
        </div>
      </div>

      {/* 3. Optional Location with Live Suggestions */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 focus-within:border-amber-400 transition-colors relative">
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
        <div className="relative">
          {showLocationDropdown && (
            <MentionHashtagPopover
              trigger="location"
              token={currentDraft.location || ''}
              onSelect={(loc) => {
                updateDraft({ location: loc });
                setShowLocationDropdown(false);
              }}
              onClose={() => setShowLocationDropdown(false)}
              position="bottom"
              className="w-full"
            />
          )}
          <input
            type="text"
            maxLength={60}
            value={currentDraft.location || ''}
            onFocus={() => setShowLocationDropdown(true)}
            onChange={(e) => {
              updateDraft({ location: e.target.value });
              setShowLocationDropdown(true);
            }}
            placeholder="e.g. Paris, France · Central Park, NYC · Mumbai"
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

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

      {/* 4. Hashtags with Live # Auto-Suggestions */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 focus-within:border-purple-400 transition-colors relative">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>#️⃣</span>
            <span># Hashtags & Topics (Auto-Suggested)</span>
          </label>
          {currentTags.length > 0 && (
            <span className="text-[10px] text-slate-400 font-mono">
              {currentTags.length} tag{currentTags.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Tag input with auto-suggestions popover */}
        <div className="relative">
          {showTagPopover && (
            <MentionHashtagPopover
              trigger="#"
              token={tagInput.startsWith('#') ? tagInput : `#${tagInput}`}
              onSelect={(completed) => handleAddTag(completed)}
              onClose={() => setShowTagPopover(false)}
              position="bottom"
              className="w-full"
            />
          )}
          <input
            type="text"
            value={tagInput}
            onFocus={() => setShowTagPopover(true)}
            onChange={(e) => {
              setTagInput(e.target.value);
              setShowTagPopover(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                e.preventDefault();
                handleAddTag(tagInput);
              }
            }}
            placeholder="#travel #photography #music #love"
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Active Tag Chips with Remove (✕) */}
        {currentTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {currentTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/30 border border-purple-500/50 text-purple-200 text-xs font-mono font-bold"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-white cursor-pointer ml-0.5 text-[10px]"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Popular Tag Pills */}
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

      {/* 5. Tag Friends with Live @ User Auto-Suggestions */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 focus-within:border-pink-400 transition-colors relative">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>👥</span>
            <span>Tag Friends (@users Auto-Suggested)</span>
          </label>
          {currentTaggedUsers.length > 0 && (
            <span className="text-[10px] text-slate-400 font-mono">
              {currentTaggedUsers.length} tagged
            </span>
          )}
        </div>

        <div className="relative">
          {showFriendPopover && (
            <MentionHashtagPopover
              trigger="@"
              token={friendInput.startsWith('@') ? friendInput : `@${friendInput}`}
              onSelect={(completed) => handleAddFriend(completed)}
              onClose={() => setShowFriendPopover(false)}
              position="bottom"
              className="w-full"
            />
          )}
          <input
            type="text"
            value={friendInput}
            onFocus={() => setShowFriendPopover(true)}
            onChange={(e) => {
              setFriendInput(e.target.value);
              setShowFriendPopover(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                e.preventDefault();
                handleAddFriend(friendInput);
              }
            }}
            placeholder="e.g. @jay @sarah @vivek"
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-pink-400 font-medium"
          />
        </div>

        {/* Active Tagged Friends Chips */}
        {currentTaggedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {currentTaggedUsers.map((user) => (
              <span
                key={user}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-200 text-xs font-bold"
              >
                <span>@{user}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFriend(user)}
                  className="hover:text-white cursor-pointer text-[10px]"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <p className="text-[10px] text-slate-400">
          Tagged friends can see this Pop and connect their own pops to this memory thread.
        </p>
      </div>

      {/* 6. Connect to Existing Pop (Memory Thread) */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 focus-within:border-cyan-400 transition-colors">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>🔗</span>
            <span>Connect to Existing Pop (Memory Thread)</span>
          </label>
          <button
            type="button"
            onClick={() => setShowSpotDropdown(!showSpotDropdown)}
            className="text-[11px] text-cyan-400 hover:underline font-bold cursor-pointer"
          >
            {showSpotDropdown ? 'Hide Pops ▲' : 'Browse Pops ▼'}
          </button>
        </div>
        <p className="text-[10px] text-slate-400">
          Link this Pop to another Pop so viewers can travel between them on the canvas.
        </p>

        {/* Available Pops Picker */}
        {showSpotDropdown && availableSpots.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-black/40 rounded-xl border border-white/10 scrollbar-thin">
            {availableSpots.map((s) => {
              const isConnected = (currentDraft.connectedSpotIds || []).includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => handleToggleConnectedSpot(s.id)}
                  className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    isConnected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {s.content?.imageUrl ? (
                      <img
                        src={s.content.imageUrl}
                        alt="thumb"
                        className="w-7 h-7 rounded-lg object-cover shrink-0 border border-white/10"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-300 flex items-center justify-center text-xs shrink-0 font-bold">
                        Pop
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {s.content.headline || s.title || s.creatorName}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">@{s.creatorName}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold">{isConnected ? '🔗 Linked' : '+ Link'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Visibility Selector */}
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

      {/* 8. Allow Comments Toggle */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between transition-colors">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>💬</span>
            <span>Allow Comments</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {(currentDraft.allowComments ?? true)
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
