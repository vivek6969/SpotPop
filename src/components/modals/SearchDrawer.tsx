import React, { useState, useEffect } from 'react';
import { Spot } from '../../types';
import { api } from '../../services/api';

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSpot: (spot: Spot) => void;
}

export const SearchDrawer: React.FC<SearchDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSpot,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [results, setResults] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await api.search(query, filter);
        if (!cancelled) {
          setResults(data.results || []);
        }
      } catch (e) {
        console.error('Search error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 200);
    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [query, filter]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden mt-6 animate-fade-in">
        
        {/* Search Bar Input */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/30">
          <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators, quotes, spot IDs..."
            autoFocus
            className="flex-1 bg-transparent text-white text-base placeholder-slate-500 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'trending', label: '🔥 Trending' },
            { id: 'featured', label: '⭐ Featured' },
            { id: 'big', label: '📸 Big Pop' },
            { id: 'mini', label: '📝 Mini Pop' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <span className="w-5 h-5 rounded-full border-2 border-[#FF2E93] border-t-transparent animate-spin inline-block mr-2 align-middle" />
              Searching the canvas...
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No spots found matching &quot;{query}&quot;. Try another search!
            </div>
          ) : (
            results.map((spot) => (
              <div
                key={spot.id}
                onClick={() => {
                  onSelectSpot(spot);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                {/* Visual Thumbnail */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
                  style={{
                    backgroundColor: spot.shape === 'polaroid' ? '#FFFFFF' : spot.background || '#FEF08A',
                  }}
                >
                  {spot.content.imageUrl ? (
                    <img src={spot.content.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">
                      {spot.content.stickers?.[0]?.emojiOrIcon || '✨'}
                    </span>
                  )}
                </div>

                {/* Content text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm truncate">
                      {spot.content.headline || spot.creatorName}
                    </span>
                    {spot.tier === 'big_pop' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-[#FF2E93]/20 text-[#FF5EAA]">
                        BIG POP
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">
                    By {spot.creatorName} {spot.content.text ? `· "${spot.content.text}"` : ''}
                  </div>
                </div>

                {/* Jump arrow */}
                <div className="text-slate-500 group-hover:text-white transition-colors shrink-0 text-xs font-semibold flex items-center gap-1">
                  <span>Fly to spot</span>
                  <span>→</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
