import React from 'react';
import { ProductTier } from '../../types';

interface BottomDockProps {
  onStartCreate: (tier?: ProductTier) => void;
  selectedTier: ProductTier;
  onChangeSelectedTier: (tier: ProductTier) => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  onStartCreate,
  selectedTier,
  onChangeSelectedTier,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-safe pointer-events-none flex justify-center">
      {/* Floating Dock Bar */}
      <div className="pointer-events-auto max-w-md w-full bg-[#12141E]/90 backdrop-blur-xl border border-white/15 rounded-3xl p-2 shadow-2xl flex items-center justify-between gap-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
        {/* Mini Pop Pill */}
        <button
          onClick={() => {
            onChangeSelectedTier('mini_pop');
            onStartCreate('mini_pop');
          }}
          className={`flex-1 py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
            selectedTier === 'mini_pop'
              ? 'bg-white/10 text-white border border-white/20 shadow-inner'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="2" />
          </svg>
          <div className="text-left leading-tight">
            <div className="text-[11px] font-medium text-slate-300">Mini Pop</div>
            <div className="text-xs font-bold text-white">₹29</div>
          </div>
        </button>

        {/* Big Pop Pill */}
        <button
          onClick={() => {
            onChangeSelectedTier('big_pop');
            onStartCreate('big_pop');
          }}
          className={`flex-1 py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
            selectedTier === 'big_pop'
              ? 'bg-white/10 text-white border border-white/20 shadow-inner'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <svg className="w-5 h-5 text-[#FF2E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-left leading-tight">
            <div className="text-[11px] font-medium text-slate-300">Big Pop</div>
            <div className="text-xs font-bold text-white">₹99</div>
          </div>
        </button>

        {/* Primary CTA: Add Your Spot */}
        <button
          onClick={() => onStartCreate(selectedTier)}
          className="py-3 px-5 rounded-2xl bg-gradient-to-r from-[#FF2E93] to-[#E6007A] hover:from-[#FF45A2] hover:to-[#FF1493] text-white font-outfit font-bold text-sm tracking-wide shadow-lg shadow-pink-500/30 flex items-center gap-1.5 active:scale-95 transition-all whitespace-nowrap"
        >
          <span>Add Your Spot</span>
          <span className="text-base">→</span>
        </button>
      </div>
    </div>
  );
};
