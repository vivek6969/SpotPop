import React, { useState, useEffect, useRef } from 'react';
import { Spot } from '../../types';
import { api } from '../../services/api';

interface CreatorResult {
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  spotCount: number;
  totalViews: number;
}

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSpot: (spot: Spot) => void;
  onSelectCreator?: (username: string) => void;
}

const SUGGESTIONS = [
  '🔥 Trending',
  '📸 Photos',
  '📝 Notes',
  '👑 Big Pop',
  'Vivek',
  'Travel',
  'Art',
  'Love',
];

export const SearchDrawer: React.FC<SearchDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSpot,
  onSelectCreator,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [creators, setCreators] = useState<CreatorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('spotpop_recent_searches');
        if (saved) {
          setRecentSearches(JSON.parse(saved).slice(0, 8));
        }
      } catch (e) {
        console.warn('Failed to parse recent searches', e);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Save query to recent searches
  const saveRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem('spotpop_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const removeRecentSearch = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== itemToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem('spotpop_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('spotpop_recent_searches');
  };

  // Debounced search query
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await api.search(query, filter);
        if (!cancelled) {
          setSpots(data.spots || data.results || []);
          setCreators(data.creators || []);
          setSelectedIndex(-1);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Search query error', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, filter, isOpen]);

  // Keyboard navigation (ESC to close, Up/Down to navigate, Enter to choose)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < spots.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < spots.length) {
          e.preventDefault();
          const target = spots[selectedIndex];
          if (query) saveRecentSearch(query);
          onSelectSpot(target);
          onClose();
        } else if (query.trim().length > 0) {
          saveRecentSearch(query);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, spots, query, onClose, onSelectSpot]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden mt-2 sm:mt-8 animate-fade-in text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/40">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-slate-400">
            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search spot ID, creator name, memory title, quote or keyword..."
            className="flex-1 bg-transparent text-white text-base sm:text-lg placeholder-slate-500 focus:outline-hidden"
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2.5 bg-black/20 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'trending', label: '🔥 Trending' },
            { id: 'big', label: '📸 Big Pop' },
            { id: 'mini', label: '📝 Mini Pop' },
            { id: 'photo', label: '🖼️ Photos' },
            { id: 'notes', label: '📌 Notes' },
            { id: 'featured', label: '⭐ Featured' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF5EAA] text-white shadow-md shadow-pink-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Quick Suggestions & Recent Searches when query is empty */}
          {!query && (
            <div className="space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2 px-1">
                    <span>Recent Searches</span>
                    <button
                      onClick={clearAllRecent}
                      className="text-slate-500 hover:text-rose-400 transition-colors text-[11px]"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        onClick={() => setQuery(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all group"
                      >
                        <span className="text-slate-500 group-hover:text-slate-300">🕒</span>
                        <span>{item}</span>
                        <span
                          onClick={(e) => removeRecentSearch(item, e)}
                          className="text-slate-500 hover:text-rose-400 text-[10px] ml-1 p-0.5 rounded-sm"
                        >
                          ✕
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div>
                <div className="text-xs text-slate-400 font-semibold mb-2 px-1">
                  Popular Suggestions
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((sug) => {
                    const cleanText = sug.replace(/^[^\w\s]+/, '').trim();
                    return (
                      <button
                        key={sug}
                        onClick={() => setQuery(cleanText)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-xs text-slate-300 hover:text-[#FF2E93] transition-all"
                      >
                        {sug}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Creators Matching Section */}
          {creators.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-2 flex items-center justify-between">
                <span>Creators ({creators.length})</span>
                <span className="text-[10px] text-slate-500 font-normal">Tap to view profile</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {creators.map((c) => (
                  <div
                    key={c.username}
                    onClick={() => {
                      saveRecentSearch(c.displayName || c.username);
                      if (onSelectCreator) {
                        onSelectCreator(c.username);
                        onClose();
                      }
                    }}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FF2E93]/40 cursor-pointer transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF2E93] to-purple-600 flex items-center justify-center shrink-0 overflow-hidden text-white font-bold text-sm shadow-sm">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.displayName} className="w-full h-full object-cover" />
                      ) : (
                        c.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-sm truncate group-hover:text-[#FF5EAA] transition-colors">
                          {c.displayName}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">@{c.username}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{c.spotCount} {c.spotCount === 1 ? 'spot' : 'spots'}</span>
                        <span>·</span>
                        <span>{c.totalViews.toLocaleString()} views</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 group-hover:text-white transition-colors">→</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spots Results Section */}
          <div>
            {query && (
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-2 flex items-center justify-between">
                <span>Spots {loading ? '' : `(${spots.length})`}</span>
                <span className="text-[10px] text-slate-500 font-normal">Fly smoothly to canvas position</span>
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                <span className="w-6 h-6 rounded-full border-2 border-[#FF2E93] border-t-transparent animate-spin" />
                <span>Searching canvas spots...</span>
              </div>
            ) : spots.length === 0 ? (
              query ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No spots found matching &quot;{query}&quot;. Try a creator name, topic or keyword.
                </div>
              ) : null
            ) : (
              <div className="space-y-2">
                {spots.map((spot, idx) => {
                  const isKeyboardActive = selectedIndex === idx;
                  return (
                    <div
                      key={spot.id}
                      onClick={() => {
                        saveRecentSearch(query || spot.content.headline || spot.creatorName);
                        onSelectSpot(spot);
                        onClose();
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                        isKeyboardActive
                          ? 'bg-white/15 border-[#FF2E93]'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {/* Real Stored Thumbnail */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-white/10"
                        style={{
                          backgroundColor: spot.shape === 'polaroid' ? '#FFFFFF' : spot.background || '#FEF08A',
                        }}
                      >
                        {spot.content.imageUrl ? (
                          <img
                            src={spot.content.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-xl">
                            {spot.content.stickers?.[0]?.emojiOrIcon || '✨'}
                          </span>
                        )}
                      </div>

                      {/* Content details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm truncate">
                            {spot.content.headline || spot.creatorName}
                          </span>
                          {spot.tier === 'big_pop' ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-[#FF2E93]/20 text-[#FF5EAA] border border-[#FF2E93]/30">
                              BIG POP
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                              MINI POP
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          By <span className="text-slate-200">{spot.creatorName}</span>
                          {spot.content.text ? ` · "${spot.content.text}"` : ''}
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>#{spot.id}</span>
                          <span>·</span>
                          <span>{new Date(spot.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          <span>·</span>
                          <span>{(spot.viewsCount || 0).toLocaleString()} views</span>
                        </div>
                      </div>

                      {/* Jump button */}
                      <div className="text-slate-500 group-hover:text-white transition-colors shrink-0 text-xs font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-xl group-hover:bg-white/10">
                        <span>Fly</span>
                        <span>→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2 border-t border-white/10 bg-black/30 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">↵</kbd> Fly</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">esc</kbd> Close</span>
          </div>
          <span>Instant infinite canvas flight</span>
        </div>
      </div>
    </div>
  );
};
