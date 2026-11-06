import React from 'react';
import { ProductTier } from '../../types';

interface BottomDockProps {
  onStartCreate: (tier?: ProductTier) => void;
  selectedTier?: ProductTier;
  onChangeSelectedTier?: (tier: ProductTier) => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  onStartCreate,
  selectedTier = 'big_pop',
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-safe pointer-events-none flex justify-center">
      {/* Floating Action Button */}
      <div className="pointer-events-auto">
        <button
          onClick={() => onStartCreate(selectedTier)}
          className="group relative px-6 py-3 sm:px-7 sm:py-3.5 rounded-full bg-gradient-to-r from-[#FF2E93] via-[#FF007F] to-[#E6007A] hover:from-[#FF45A2] hover:to-[#FF1493] text-white font-outfit font-extrabold text-sm sm:text-base tracking-wide shadow-2xl shadow-pink-500/40 hover:shadow-pink-500/60 border border-white/25 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          {/* Subtle pulse / glow ring */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#FFB800] opacity-30 group-hover:opacity-70 blur-md transition duration-300 pointer-events-none" />

          {/* Plus icon */}
          <span className="relative w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold leading-none shadow-xs group-hover:rotate-90 transition-transform duration-300">
            +
          </span>

          {/* Button text */}
          <span className="relative font-bold drop-shadow-sm">
            Add Your Spot
          </span>

          <span className="relative text-base group-hover:translate-x-1 transition-transform">
            →
          </span>
        </button>
      </div>
    </div>
  );
};
