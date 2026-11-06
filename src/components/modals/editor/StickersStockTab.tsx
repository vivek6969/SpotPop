import React, { useState } from 'react';
import { PlanDraft } from './types';
import { STICKER_CATEGORIES } from '../CreateSpotModal';

interface StickersStockTabProps {
  currentDraft: PlanDraft;
  updateDraft: (updates: Partial<PlanDraft>) => void;
  handleAddSticker: (emoji: string) => void;
  onCustomStickerUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedItemId?: string | null;
  onUpdateSticker?: (id: string, updates: { size?: number; rotation?: number; opacity?: number }) => void;
  onDeleteSticker?: (id: string) => void;
}

export const StickersStockTab: React.FC<StickersStockTabProps> = ({
  currentDraft,
  handleAddSticker,
  onCustomStickerUpload,
  selectedItemId,
  onUpdateSticker,
  onDeleteSticker,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('love');

  // Currently selected sticker on the canvas
  const selectedSticker = (currentDraft.stickers || []).find((s) => s.id === selectedItemId);

  // Filter stickers by search query
  const filteredCategories = STICKER_CATEGORIES.map((cat) => ({
    ...cat,
    emojis: cat.emojis.filter((e) =>
      e.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((c) => c.emojis.length > 0);

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">💖</span>
          <div>
            <label className="text-xs font-bold text-white block">
              Stickers & Doodles
            </label>
            <span className="text-[10px] text-slate-400">
              Tap any sticker to place on your spot · Drag freely & pull to resize
            </span>
          </div>
        </div>
      </div>

      {/* 2. Selected Sticker Direct Controls (If a sticker is selected on canvas) */}
      {selectedSticker && onUpdateSticker && onDeleteSticker && (
        <div className="p-3.5 rounded-xl bg-pink-950/40 border border-[#FF2E93]/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <span className="text-lg">{selectedSticker.emojiOrIcon}</span>
              <span>Selected Sticker</span>
            </span>
            <button
              type="button"
              onClick={() => onDeleteSticker(selectedSticker.id)}
              className="px-2 py-0.5 rounded-md bg-rose-600/80 hover:bg-rose-600 text-white text-[10px] font-bold transition-colors"
            >
              ✕ Delete
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>Size</span>
                <span className="font-mono text-pink-400 font-bold">{selectedSticker.size}px</span>
              </div>
              <input
                type="range"
                min={16}
                max={100}
                value={selectedSticker.size}
                onChange={(e) => onUpdateSticker(selectedSticker.id, { size: Number(e.target.value) })}
                className="w-full accent-[#FF2E93]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>Rotation</span>
                <span className="font-mono text-pink-400 font-bold">{selectedSticker.rotation}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={selectedSticker.rotation}
                onChange={(e) => onUpdateSticker(selectedSticker.id, { rotation: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>Opacity</span>
                <span className="font-mono text-pink-400 font-bold">{Math.round((selectedSticker.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round((selectedSticker.opacity ?? 1) * 100)}
                onChange={(e) => onUpdateSticker(selectedSticker.id, { opacity: Number(e.target.value) / 100 })}
                className="w-full accent-amber-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Search & Quick Categories */}
      <div className="space-y-2">
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 500+ stickers, emojis & badges..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-pink-400 placeholder:text-slate-500"
          />
        </div>

        {/* Category Pills Strip */}
        {!searchQuery && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {STICKER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-white text-black shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>


      {/* 5. Stickers Grid */}
      <div className="p-3 rounded-xl bg-black/40 border border-white/10 max-h-60 overflow-y-auto no-scrollbar">
        {searchQuery ? (
          <div className="space-y-3">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  {cat.name}
                </span>
                <div className="flex flex-wrap gap-2">
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleAddSticker(emoji)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#FF2E93]/20 hover:scale-115 hover:border-[#FF2E93] border border-white/10 text-white text-base transition-all cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {STICKER_CATEGORIES.find((c) => c.id === activeCategory)?.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleAddSticker(emoji)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#FF2E93]/20 hover:scale-115 hover:border-[#FF2E93] border border-white/10 text-white text-lg transition-all cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
