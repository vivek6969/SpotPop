import React from 'react';
import { PlanDraft, ShapeOption } from './types';
import { ProductTier, FrameStyle } from '../../../types';
import { AVAILABLE_SHAPES, MINI_FRAMES, BIG_FRAMES } from '../CreateSpotModal';

interface FramesTabProps {
  currentDraft: PlanDraft;
  updateDraft: (updates: Partial<PlanDraft>) => void;
  tier: ProductTier;
  handleSelectShape: (shape: ShapeOption) => void;
}

export const FramesTab: React.FC<FramesTabProps> = ({
  currentDraft,
  updateDraft,
  tier,
  handleSelectShape,
}) => {
  const isTransparent = currentDraft.shape === 'transparent';
  const framesList = tier === 'big_pop' ? BIG_FRAMES : MINI_FRAMES;

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
      {/* 1. Transparent Canvas 1-Click Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/60 to-pink-950/60 border border-purple-500/40 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🌟</span>
          <div>
            <h4 className="text-xs font-bold text-white">Transparent Canvas (PNG Cutout)</h4>
            <p className="text-[10px] text-slate-300">
              Removes rectangular card borders! Your photo, stickers & doodles float freely.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isTransparent) {
              updateDraft({ shape: tier === 'big_pop' ? 'polaroid' : 'sticky', backgroundColor: '#FFFFFF' });
            } else {
              updateDraft({ shape: 'transparent', backgroundColor: 'transparent', textColor: '#FFFFFF' });
            }
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 ${
            isTransparent
              ? 'bg-emerald-500 text-black'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
          }`}
        >
          {isTransparent ? '✓ Transparent ON' : 'Enable Transparent'}
        </button>
      </div>

      {/* 2. 11 Card Shapes & Frames Gallery */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>🖼️</span>
            <span>Card Shape & Picture Frames ({AVAILABLE_SHAPES.length} Styles)</span>
          </label>
          <span className="text-[10px] text-pink-400 font-bold capitalize">
            {currentDraft.shape}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto no-scrollbar p-0.5">
          {AVAILABLE_SHAPES.map((shape) => {
            const isSelected = currentDraft.shape === shape.id;
            return (
              <div
                key={shape.id}
                onClick={() => handleSelectShape(shape)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#FF2E93] bg-[#FF2E93]/15 text-white ring-1 ring-[#FF2E93] shadow-md'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{shape.icon}</span>
                    <span className="text-xs font-bold">{shape.name}</span>
                  </div>
                  {shape.badge && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-pink-300 font-bold">
                      {shape.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{shape.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Tape Accents & Top Pins */}
      {!isTransparent && (
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
          <label className="text-xs font-bold text-slate-300 block">
            📌 Frame Accents & Hanging Tape
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {framesList.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => updateDraft({ frameStyle: f.id as FrameStyle })}
                className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all ${
                  currentDraft.frameStyle === f.id
                    ? 'border-amber-400 bg-amber-400/20 text-white'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                }`}
              >
                <span>{f.label.split(' ')[0]}</span>
                <span className="text-[10px] mt-0.5 truncate w-full text-center">
                  {f.label.split(' ').slice(1).join(' ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

