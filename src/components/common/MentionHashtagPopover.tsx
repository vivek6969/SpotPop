import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';

export interface UserSuggestion {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isPrivate?: boolean;
  spotCount: number;
}

export interface HashtagSuggestion {
  tag: string;
  count: number;
}

export interface LocationSuggestion {
  name: string;
  spotCount: number;
}

interface MentionHashtagPopoverProps {
  token: string; // The token being typed, e.g. "@vi", "#art", or "Mumbai"
  trigger: '@' | '#' | 'location';
  onSelect: (completedText: string) => void;
  onClose: () => void;
  position?: 'top' | 'bottom';
  className?: string;
}

const DEFAULT_POPULAR_LOCATIONS: LocationSuggestion[] = [
  { name: 'Mumbai, India', spotCount: 1 },
  { name: 'Delhi, India', spotCount: 1 },
  { name: 'Bengaluru, India', spotCount: 1 },
  { name: 'Goa, India', spotCount: 1 },
  { name: 'Paris, France', spotCount: 1 },
  { name: 'New York, USA', spotCount: 1 },
  { name: 'Tokyo, Japan', spotCount: 1 },
  { name: 'London, UK', spotCount: 1 },
];

export const MentionHashtagPopover: React.FC<MentionHashtagPopoverProps> = ({
  token,
  trigger,
  onSelect,
  onClose,
  position = 'top',
  className = '',
}) => {
  const [users, setUsers] = useState<UserSuggestion[]>([]);
  const [hashtags, setHashtags] = useState<HashtagSuggestion[]>([]);
  const [locations, setLocations] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch live suggestions
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        if (trigger === 'location') {
          const clean = (token || '').trim();
          const data = await api.getSuggestions(clean, 'locations', 6);
          if (!cancelled) {
            const locList = (data.locations && data.locations.length > 0)
              ? data.locations
              : DEFAULT_POPULAR_LOCATIONS.filter((l) =>
                  !clean || l.name.toLowerCase().includes(clean.toLowerCase())
                );
            setLocations(locList);
            setSelectedIndex(0);
          }
        } else {
          const type = trigger === '@' ? 'users' : 'hashtags';
          const data = await api.getSuggestions(token, type, 6);
          if (!cancelled) {
            if (trigger === '@') {
              setUsers(data.users || []);
            } else {
              setHashtags(data.hashtags || []);
            }
            setSelectedIndex(0);
          }
        }
      } catch (err) {
        if (!cancelled) console.warn('[MentionHashtag] Suggestion fetch error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 60);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token, trigger]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const itemsCount =
        trigger === '@' ? users.length : trigger === '#' ? hashtags.length : locations.length;
      if (itemsCount === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < itemsCount - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : itemsCount - 1));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (trigger === '@' && users[selectedIndex]) {
          onSelect(`@${users[selectedIndex].username} `);
        } else if (trigger === '#' && hashtags[selectedIndex]) {
          const t = hashtags[selectedIndex].tag;
          onSelect(`${t.startsWith('#') ? t : `#${t}`} `);
        } else if (trigger === 'location' && locations[selectedIndex]) {
          onSelect(locations[selectedIndex].name);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trigger, users, hashtags, locations, selectedIndex, onSelect, onClose]);

  const hasItems =
    trigger === '@' ? users.length > 0 : trigger === '#' ? hashtags.length > 0 : locations.length > 0;
  if (!hasItems && !loading) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute z-50 w-64 max-h-56 overflow-y-auto bg-[#101426] border border-white/20 rounded-2xl shadow-2xl p-1.5 text-xs text-slate-200 animate-in fade-in zoom-in-95 scrollbar-thin ${
        position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
      } ${className}`}
    >
      <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-white/10 flex items-center justify-between">
        <span>
          {trigger === '@'
            ? '👥 Mention User'
            : trigger === '#'
            ? '#️⃣ Suggest Hashtag'
            : '📍 Suggest Location'}
        </span>
        {loading && <span className="animate-spin text-pink-400">⚡</span>}
      </div>

      <div className="pt-1 space-y-0.5">
        {trigger === '@' &&
          users.map((u, idx) => (
            <button
              key={u.id || u.username}
              type="button"
              onClick={() => onSelect(`@${u.username} `)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                selectedIndex === idx ? 'bg-pink-500/25 text-white' : 'hover:bg-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={u.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`}
                  alt={u.username}
                  className="w-5 h-5 rounded-full object-cover bg-slate-800 border border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-bold truncate text-white leading-tight">@{u.username}</div>
                  <div className="text-[10px] text-slate-400 truncate leading-tight">{u.displayName}</div>
                </div>
              </div>
              {u.spotCount > 0 && (
                <span className="text-[9px] font-mono font-bold text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                  {u.spotCount} pops
                </span>
              )}
            </button>
          ))}

        {trigger === '#' &&
          hashtags.map((h, idx) => (
            <button
              key={h.tag}
              type="button"
              onClick={() => onSelect(`${h.tag.startsWith('#') ? h.tag : `#${h.tag}`} `)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                selectedIndex === idx ? 'bg-purple-500/25 text-white' : 'hover:bg-white/10 text-slate-300'
              }`}
            >
              <div className="font-mono font-bold text-purple-300 truncate">
                {h.tag.startsWith('#') ? h.tag : `#${h.tag}`}
              </div>
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded-md shrink-0">
                {h.count} pop{h.count === 1 ? '' : 's'}
              </span>
            </button>
          ))}

        {trigger === 'location' &&
          locations.map((loc, idx) => (
            <button
              key={loc.name}
              type="button"
              onClick={() => onSelect(loc.name)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                selectedIndex === idx ? 'bg-amber-400/25 text-white' : 'hover:bg-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-amber-400">📍</span>
                <span className="text-xs font-medium text-slate-200 truncate">{loc.name}</span>
              </div>
              {loc.spotCount > 0 && (
                <span className="text-[9px] font-mono text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-md shrink-0">
                  {loc.spotCount} pops
                </span>
              )}
            </button>
          ))}
      </div>
    </div>
  );
};
