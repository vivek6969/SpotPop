import React from 'react';
import { PlanDraft, BackgroundOption } from './types';
import { THEMED_BACKGROUNDS } from '../CreateSpotModal';

interface ThemesTabProps {
  currentDraft: PlanDraft;
  updateDraft: (updates: Partial<PlanDraft>) => void;
  selectedBgCategory: string;
  setSelectedBgCategory: (cat: any) => void;
}

export const ThemesTab: React.FC<ThemesTabProps> = ({
  currentDraft,
  updateDraft,
  selectedBgCategory,
  setSelectedBgCategory,
}) => {
  const filteredBgs = THEMED_BACKGROUNDS.filter(
    (b) => selectedBgCategory === 'all' || b.category === selectedBgCategory
  );

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
      {/* 1. Header with Current Color & Picker */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🎨</span>
          <div>
            <label className="text-xs font-bold text-white block">
              Canvas Background Color & Themes
            </label>
            <span className="text-[10px] text-slate-400">
              Gradients, solid swatches & seasonal festive palettes
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-300">
            {currentDraft.backgroundColor === 'transparent' ? 'Transparent' : currentDraft.backgroundColor}
          </span>
          <input
            type="color"
            value={currentDraft.backgroundColor.startsWith('#') ? currentDraft.backgroundColor : '#FFFFFF'}
            onChange={(e) => updateDraft({ backgroundColor: e.target.value })}
            className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
          />
        </div>
      </div>

      {/* 2. Theme Category Filters */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'all', name: 'All Themes' },
          { id: 'classic', name: 'Classic' },
          { id: 'love', name: '💖 Love' },
          { id: 'retro', name: '📼 Retro 80s' },
          { id: 'halloween', name: '🎃 Spooky' },
          { id: 'christmas', name: '🎄 Festive' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedBgCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedBgCategory === cat.id
                ? 'bg-white text-black shadow-xs'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 3. Background Swatches Grid */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto no-scrollbar p-0.5">
          {filteredBgs.map((bg) => {
            const isSelected = currentDraft.backgroundColor === bg.value;
            const isTrans = bg.value === 'transparent';

            return (
              <button
                key={bg.name}
                type="button"
                onClick={() => {
                  if (isTrans) {
                    updateDraft({
                      shape: 'transparent',
                      backgroundColor: 'transparent',
                      textColor: '#FFFFFF',
                    });
                  } else {
                    updateDraft({
                      backgroundColor: bg.value,
                      textColor: bg.text || currentDraft.textColor,
                    });
                  }
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all min-h-[70px] relative overflow-hidden ${
                  isSelected
                    ? 'border-[#FF2E93] ring-2 ring-[#FF2E93]/60 shadow-md scale-102'
                    : 'border-white/10 hover:border-white/20'
                }`}
                style={{
                  background: isTrans ? 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 12px 12px' : bg.value,
                }}
              >
                <div className="w-full flex justify-between items-center z-10">
                  <span className="text-[10px] font-bold truncate" style={{ color: isTrans ? '#FFF' : bg.text }}>
                    {bg.name}
                  </span>
                  {isSelected && <span className="text-xs">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

