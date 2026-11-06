import React, { useState, useEffect } from 'react';
import { Spot } from '../../types';
import { api } from '../../services/api';

interface ExploreBarProps {
  onSelectSpot: (spot: Spot) => void;
}

export const ExploreBar: React.FC<ExploreBarProps> = ({ onSelectSpot }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSort, setActiveSort] = useState<'newest' | 'trending' | 'views' | 'shares'>('trending');
  const [activeTier, setActiveTier] = useState<'all' | 'mini_pop' | 'big_pop'>('all');
  const [activeCategory, setActiveCategory] = useState<'all' | 'photo' | 'art' | 'notes' | 'quotes'>('all');
  const [activeTime, setActiveTime] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [spots, setSpots] = useState<Spot[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Fetch explore spots from backend
  useEffect(() => {
    if (!isExpanded) return;

    let cancelled = false;
    setLoading(true);

    api.getExploreSpots({
      sort: activeSort,
      tier: activeTier,
      category: activeCategory,
      time: activeTime,
      limit: 30,
    })
      .then((res) => {
        if (!cancelled) {
          setSpots(res.spots || []);
          setTotalCount(res.total || 0);
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('Explore fetch failed', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isExpanded, activeSort, activeTier, activeCategory, activeTime]);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 max-w-4xl w-[94vw] sm:w-auto pointer-events-none transition-all">
      {/* Compact Main Bar Pill */}
      <div className="pointer-events-auto flex items-center justify-between gap-1.5 p-1.5 rounded-2xl bg-[#090A0F]/85 backdrop-blur-md border border-white/10 shadow-xl overflow-x-auto no-scrollbar mx-auto">
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            isExpanded
              ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF5EAA] text-white shadow-md shadow-pink-500/20'
              : 'bg-white/10 text-slate-200 hover:bg-white/15 hover:text-white'
          }`}
        >
          <span>🧭 Explore</span>
          <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-md font-mono">
            {isExpanded ? 'Hide ▲' : 'Open ▼'}
          </span>
        </button>

        {/* Quick Filter Chips directly visible on the bar */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'trending', label: '🔥 Trending', sort: 'trending', cat: 'all', tier: 'all' },
            { id: 'newest', label: '⚡ Newest', sort: 'newest', cat: 'all', tier: 'all' },
            { id: 'photos', label: '📸 Photos', sort: 'trending', cat: 'photo', tier: 'big_pop' },
            { id: 'notes', label: '📝 Sticky Notes', sort: 'trending', cat: 'notes', tier: 'mini_pop' },
            { id: 'art', label: '🎨 Artwork', sort: 'views', cat: 'art', tier: 'big_pop' },
            { id: 'quotes', label: '💬 Quotes', sort: 'views', cat: 'quotes', tier: 'all' },
          ].map((chip) => {
            const isChipActive =
              isExpanded &&
              activeSort === chip.sort &&
              activeCategory === chip.cat &&
              activeTier === chip.tier;

            return (
              <button
                key={chip.id}
                onClick={() => {
                  setActiveSort(chip.sort as any);
                  setActiveCategory(chip.cat as any);
                  setActiveTier(chip.tier as any);
                  if (!isExpanded) setIsExpanded(true);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isChipActive
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded Discovery Panel */}
      {isExpanded && (
        <div className="pointer-events-auto mt-2 p-3 sm:p-4 rounded-3xl bg-[#12141F]/95 backdrop-blur-xl border border-white/15 shadow-2xl animate-fade-in text-slate-100 flex flex-col max-h-[65vh]">
          {/* Secondary Filter Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Found {totalCount} spots</span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">· Tap any card to fly camera directly</span>
            </div>

            {/* Sorting & Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Product Tier */}
              <div className="flex items-center bg-black/40 p-0.5 rounded-xl border border-white/10 text-xs">
                {(['all', 'big_pop', 'mini_pop'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTier(t)}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      activeTier === t ? 'bg-[#FF2E93] text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 'all' ? 'All' : t === 'big_pop' ? 'Big Pop' : 'Mini Pop'}
                  </button>
                ))}
              </div>

              {/* Time */}
              <div className="flex items-center bg-black/40 p-0.5 rounded-xl border border-white/10 text-xs">
                {(['all', 'today', 'week', 'month'] as const).map((time) => (
                  <button
                    key={time}
                    onClick={() => setActiveTime(time)}
                    className={`px-2 py-1 rounded-lg capitalize transition-all ${
                      activeTime === time ? 'bg-white/20 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {time === 'all' ? 'All Time' : time}
                  </button>
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs"
                title="Collapse"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Results Grid / Horizontal Carousel */}
          <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2 no-scrollbar">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                <span className="w-5 h-5 rounded-full border-2 border-[#FF2E93] border-t-transparent animate-spin" />
                <span>Loading spots...</span>
              </div>
            ) : spots.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No spots found for this filter. Try choosing &quot;All Time&quot; or another category!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {spots.map((spot) => (
                  <div
                    key={spot.id}
                    onClick={() => {
                      onSelectSpot(spot);
                      setIsExpanded(false);
                    }}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/12 border border-white/5 hover:border-[#FF2E93]/40 cursor-pointer transition-all flex items-center gap-3 group"
                  >
                    {/* Thumbnail */}
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

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs truncate group-hover:text-[#FF5EAA] transition-colors">
                          {spot.content.headline || spot.creatorName}
                        </span>
                        {spot.tier === 'big_pop' ? (
                          <span className="text-[8px] font-bold px-1 rounded-xs bg-[#FF2E93]/20 text-[#FF5EAA]">
                            BIG
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold px-1 rounded-xs bg-yellow-400/20 text-yellow-300">
                            MINI
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {spot.creatorName} {spot.content.text ? `· "${spot.content.text}"` : ''}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                        <span>{(spot.viewsCount || 0).toLocaleString()} views</span>
                        <span>·</span>
                        <span>{(spot.sharesCount || 0).toLocaleString()} shares</span>
                      </div>
                    </div>

                    <div className="text-slate-500 group-hover:text-white transition-colors text-xs shrink-0 font-bold">
                      Fly →
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

