import React, { useState } from 'react';
import { PlanDraft } from './types';
import { PhotoAdjustments } from '../../../types';

interface RetouchTabProps {
  currentDraft: PlanDraft;
  updatePhotoAdjustments: (updates: Partial<PhotoAdjustments>) => void;
}

type RetouchSubTool =
  | 'auto'
  | 'blemish'
  | 'glow'
  | 'whiten'
  | 'hair'
  | 'reshape';

export const RetouchTab: React.FC<RetouchTabProps> = ({
  currentDraft,
  updatePhotoAdjustments,
}) => {
  const adj = currentDraft.photoAdjustments || {};
  const [activeSubTool, setActiveSubTool] = useState<RetouchSubTool>('glow');

  const handleAutoBeautify = () => {
    updatePhotoAdjustments({
      blemishRemoval: 40,
      faceGlow: 30,
      teethWhitening: 45,
      brightness: (adj.brightness || 0) + 8,
      contrast: (adj.contrast || 0) + 5,
    });
  };

  const handleResetRetouch = () => {
    updatePhotoAdjustments({
      retouchSmooth: 0,
      blemishRemoval: 0,
      faceGlow: 0,
      teethWhitening: 0,
      reshapeAmount: 0,
      hairTint: 'none',
    });
  };

  const HAIR_TINTS = [
    { id: 'none', name: 'Natural', color: 'transparent', icon: '✨' },
    { id: 'blonde', name: 'Platinum', color: '#F6E05E', icon: '👱' },
    { id: 'pink', name: 'Rose Pink', color: '#ED64A6', icon: '🌸' },
    { id: 'cyan', name: 'Cyan', color: '#00F0FF', icon: '⚡' },
    { id: 'purple', name: 'Lavender', color: '#9F7AEA', icon: '💜' },
    { id: 'emerald', name: 'Emerald', color: '#38A169', icon: '🌲' },
    { id: 'auburn', name: 'Auburn', color: '#C53030', icon: '🔥' },
    { id: 'midnight', name: 'Midnight', color: '#1A202C', icon: '🖤' },
  ];

  const SUB_TOOLS: { id: RetouchSubTool; label: string; icon: string; hasValue: boolean }[] = [
    { id: 'auto', label: 'Auto Glow', icon: '🪄', hasValue: !!adj.faceGlow },
    { id: 'glow', label: 'Face Glow', icon: '🌟', hasValue: !!adj.faceGlow },
    { id: 'blemish', label: 'Blemish', icon: '🩹', hasValue: !!adj.blemishRemoval },
    { id: 'whiten', label: 'Whiten', icon: '😁', hasValue: !!adj.teethWhitening },
    { id: 'hair', label: 'Hair Color', icon: '💇', hasValue: (adj.hairTint && adj.hairTint !== 'none') || false },
    { id: 'reshape', label: 'Reshape', icon: '📐', hasValue: !!adj.reshapeAmount },
  ];

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
      {/* 1. Header with Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <div>
            <label className="text-xs font-bold text-white block">
              Portrait Retouch & Beautify
            </label>
            <span className="text-[10px] text-slate-400">
              Skin smoothing, teeth whitening, face glow & reshaping
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleResetRetouch}
          className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Reset
        </button>
      </div>

      {/* 2. Focused Single-Control Stage */}
      <div className="p-4 rounded-2xl bg-black/50 border border-white/15 space-y-3.5 shadow-inner">
        {/* Auto Glow */}
        {activeSubTool === 'auto' && (
          <div className="space-y-3 text-center py-2">
            <span className="text-3xl block">🪄</span>
            <div>
              <h4 className="text-sm font-bold text-white">One-Tap Portrait Auto Enhancement</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically balances skin tone, applies gentle radiance smoothing & whitens smile.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoBeautify}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg transition-all"
            >
              ✨ Apply Auto Glow Now
            </button>
          </div>
        )}


        {/* Blemish */}
        {activeSubTool === 'blemish' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🩹</span>
                <span className="text-sm font-bold text-white">Blemish Softening & Pore Blur</span>
              </div>
              <span className="font-mono text-sm font-bold text-rose-400">
                {adj.blemishRemoval || 0}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={adj.blemishRemoval || 0}
              onChange={(e) => updatePhotoAdjustments({ blemishRemoval: Number(e.target.value) })}
              className="w-full accent-rose-400 h-2 bg-white/20 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Face Glow */}
        {activeSubTool === 'glow' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌟</span>
                <span className="text-sm font-bold text-white">Ambient Face Luminance Glow</span>
              </div>
              <span className="font-mono text-sm font-bold text-amber-400">
                {adj.faceGlow || 0}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={adj.faceGlow || 0}
              onChange={(e) => updatePhotoAdjustments({ faceGlow: Number(e.target.value) })}
              className="w-full accent-amber-400 h-2 bg-white/20 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Teeth Whiten */}
        {activeSubTool === 'whiten' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">😁</span>
                <span className="text-sm font-bold text-white">Teeth Whitening</span>
              </div>
              <span className="font-mono text-sm font-bold text-cyan-400">
                {adj.teethWhitening || 0}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={adj.teethWhitening || 0}
              onChange={(e) => updatePhotoAdjustments({ teethWhitening: Number(e.target.value) })}
              className="w-full accent-cyan-400 h-2 bg-white/20 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Hair Color */}
        {activeSubTool === 'hair' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💇</span>
                <span className="text-sm font-bold text-white">Hair Color Tint</span>
              </div>
              <span className="font-mono text-xs text-pink-400 capitalize">
                {adj.hairTint || 'Natural'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {HAIR_TINTS.map((t) => {
                const isSelected = (adj.hairTint || 'none') === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updatePhotoAdjustments({ hairTint: t.id })}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-[#FF2E93] bg-[#FF2E93]/20 text-white font-bold ring-1 ring-[#FF2E93]'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="text-[10px] truncate w-full text-center">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Reshape */}
        {activeSubTool === 'reshape' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📐</span>
                <span className="text-sm font-bold text-white">Face & Jawline Slimming</span>
              </div>
              <span className="font-mono text-sm font-bold text-cyan-400">
                {adj.reshapeAmount || 0}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={adj.reshapeAmount || 0}
              onChange={(e) => updatePhotoAdjustments({ reshapeAmount: Number(e.target.value) })}
              className="w-full accent-cyan-400 h-2 bg-white/20 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 3. Sub-Tool Strip: Modern Picsart horizontal scrolling row */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block px-1">
          Tap Tool to Edit
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {SUB_TOOLS.map((tool) => {
            const isActive = activeSubTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveSubTool(tool.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex flex-col items-center gap-1 shrink-0 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg scale-105'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-base">{tool.icon}</span>
                <span className="text-[10px]">{tool.label}</span>
                {tool.hasValue && !isActive && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
