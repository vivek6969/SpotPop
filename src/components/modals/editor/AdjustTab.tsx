import React, { useState } from 'react';
import { PlanDraft } from './types';
import { PhotoAdjustments } from '../../../types';
import { FILTER_PRESETS, EFFECT_PRESETS, CURVE_PRESETS } from '../../../utils/photoFilters';

interface AdjustTabProps {
  currentDraft: PlanDraft;
  updateDraft: (updates: Partial<PlanDraft>) => void;
  updatePhotoAdjustments: (updates: Partial<PhotoAdjustments>) => void;
}

type AdjustSubTool =
  | 'brightness'
  | 'contrast'
  | 'exposure'
  | 'saturation'
  | 'temperature'
  | 'tint'
  | 'hue'
  | 'highlights'
  | 'shadows'
  | 'blur'
  | 'vignette'
  | 'grain'
  | 'sharpen'
  | 'curves'
  | 'hsl';

export const AdjustTab: React.FC<AdjustTabProps> = ({
  currentDraft,
  updatePhotoAdjustments,
}) => {
  const adj = currentDraft.photoAdjustments || {};

  // Primary mode: 'adjust' (Picsart single slider) or 'fx' (Filter presets & Glitch)
  const [activeMode, setActiveMode] = useState<'adjust' | 'fx'>('adjust');

  // Active single adjustment sub-tool
  const [activeSubTool, setActiveSubTool] = useState<AdjustSubTool>('brightness');

  // HSL channel
  const [activeHslColor, setActiveHslColor] = useState<'red' | 'green' | 'blue' | 'yellow'>('red');

  const handleResetAdjustments = () => {
    updatePhotoAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      temperature: 0,
      tint: 0,
      hue: 0,
      highlights: 0,
      shadows: 0,
      vignette: 0,
      grain: 0,
      sharpen: 0,
      blur: 0,
      blurType: 'gaussian',
      curveRgb: 'linear',
      hslRed: 0,
      hslGreen: 0,
      hslBlue: 0,
      hslYellow: 0,
      filter: 'none',
      effect: 'none',
    });
  };

  const SUB_TOOLS: { id: AdjustSubTool; label: string; icon: string; hasValue: boolean }[] = [
    { id: 'brightness', label: 'Brightness', icon: '☀️', hasValue: !!adj.brightness },
    { id: 'contrast', label: 'Contrast', icon: '◐', hasValue: !!adj.contrast },
    { id: 'exposure', label: 'Exposure', icon: '⚡', hasValue: !!adj.exposure },
    { id: 'saturation', label: 'Saturate', icon: '🌈', hasValue: !!adj.saturation },
    { id: 'temperature', label: 'Warmth', icon: '🌡️', hasValue: !!adj.temperature },
    { id: 'tint', label: 'Tint', icon: '🎨', hasValue: !!adj.tint },
    { id: 'hue', label: 'Hue', icon: '🎡', hasValue: !!adj.hue },
    { id: 'highlights', label: 'Highlights', icon: '💡', hasValue: !!adj.highlights },
    { id: 'shadows', label: 'Shadows', icon: '🌑', hasValue: !!adj.shadows },
    { id: 'blur', label: 'Blur', icon: '💧', hasValue: !!adj.blur },
    { id: 'vignette', label: 'Vignette', icon: '🔘', hasValue: !!adj.vignette },
    { id: 'grain', label: 'Grain', icon: '🌾', hasValue: !!adj.grain },
    { id: 'sharpen', label: 'Sharpen', icon: '✨', hasValue: !!adj.sharpen },
    { id: 'curves', label: 'Curves', icon: '📈', hasValue: (adj.curveRgb && adj.curveRgb !== 'linear') || false },
    { id: 'hsl', label: 'HSL', icon: '🎯', hasValue: !!(adj.hslRed || adj.hslGreen || adj.hslBlue || adj.hslYellow) },
  ];

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
      {/* 1. Header with Mode Toggle & Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveMode('adjust')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeMode === 'adjust'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚙️</span>
            <span>Adjust</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('fx')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeMode === 'fx'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>✨</span>
            <span>FX & Filters</span>
            {adj.filter && adj.filter !== 'none' && (
              <span className="w-1.5 h-1.5 rounded-full bg-pink-300 animate-pulse" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={handleResetAdjustments}
          className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>↺</span>
          <span>Reset All</span>
        </button>
      </div>

      {/* 2. MODE A: PICSART SINGLE-CONTROL ADJUST STAGE */}
      {activeMode === 'adjust' && (
        <div className="space-y-4">
          {/* Active Control Card (ONE slider / control rendered at a time!) */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/15 space-y-3.5 shadow-inner">
            {/* Brightness */}
            {activeSubTool === 'brightness' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">☀️</span>
                    <span className="text-sm font-bold text-white">Brightness</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-400">
                      {(adj.brightness || 0) > 0 ? `+${adj.brightness}` : adj.brightness || 0}%
                    </span>
                    {adj.brightness !== 0 && (
                      <button
                        type="button"
                        onClick={() => updatePhotoAdjustments({ brightness: 0 })}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.brightness || 0}
                  onChange={(e) => updatePhotoAdjustments({ brightness: Number(e.target.value) })}
                  className="w-full accent-amber-400 h-2 bg-white/20 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-100 (Darker)</span>
                  <span>0 (Original)</span>
                  <span>+100 (Brighter)</span>
                </div>
              </div>
            )}

            {/* Contrast */}
            {activeSubTool === 'contrast' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">◐</span>
                    <span className="text-sm font-bold text-white">Contrast</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-400">
                      {(adj.contrast || 0) > 0 ? `+${adj.contrast}` : adj.contrast || 0}%
                    </span>
                    {adj.contrast !== 0 && (
                      <button
                        type="button"
                        onClick={() => updatePhotoAdjustments({ contrast: 0 })}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.contrast || 0}
                  onChange={(e) => updatePhotoAdjustments({ contrast: Number(e.target.value) })}
                  className="w-full accent-amber-400 h-2 bg-white/20 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-100 (Softer)</span>
                  <span>0 (Original)</span>
                  <span>+100 (Punchy)</span>
                </div>
              </div>
            )}

            {/* Exposure */}
            {activeSubTool === 'exposure' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <span className="text-sm font-bold text-white">Exposure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-400">
                      {(adj.exposure || 0) > 0 ? `+${adj.exposure}` : adj.exposure || 0}%
                    </span>
                    {adj.exposure !== 0 && (
                      <button
                        type="button"
                        onClick={() => updatePhotoAdjustments({ exposure: 0 })}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.exposure || 0}
                  onChange={(e) => updatePhotoAdjustments({ exposure: Number(e.target.value) })}
                  className="w-full accent-amber-400 h-2 bg-white/20 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-100 (Under)</span>
                  <span>0 (Neutral)</span>
                  <span>+100 (Over)</span>
                </div>
              </div>
            )}

            {/* Saturation */}
            {activeSubTool === 'saturation' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌈</span>
                    <span className="text-sm font-bold text-white">Saturation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-400">
                      {(adj.saturation || 0) > 0 ? `+${adj.saturation}` : adj.saturation || 0}%
                    </span>
                    {adj.saturation !== 0 && (
                      <button
                        type="button"
                        onClick={() => updatePhotoAdjustments({ saturation: 0 })}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.saturation || 0}
                  onChange={(e) => updatePhotoAdjustments({ saturation: Number(e.target.value) })}
                  className="w-full accent-amber-400 h-2 bg-white/20 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-100 (Monochrome)</span>
                  <span>0 (Original)</span>
                  <span>+100 (Vibrant)</span>
                </div>
              </div>
            )}

            {/* Temperature / Warmth */}
            {activeSubTool === 'temperature' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌡️</span>
                    <span className="text-sm font-bold text-white">Warmth & Temperature</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-400">
                      {(adj.temperature || 0) > 0 ? `+${adj.temperature}` : adj.temperature || 0}
                    </span>
                    {adj.temperature !== 0 && (
                      <button
                        type="button"
                        onClick={() => updatePhotoAdjustments({ temperature: 0 })}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.temperature || 0}
                  onChange={(e) => updatePhotoAdjustments({ temperature: Number(e.target.value) })}
                  className="w-full accent-orange-400 h-2 bg-gradient-to-r from-blue-500 via-white/20 to-amber-500 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Cool (Blue)</span>
                  <span>Neutral</span>
                  <span>Warm (Gold)</span>
                </div>
              </div>
            )}

            {/* Tint */}
            {activeSubTool === 'tint' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎨</span>
                    <span className="text-sm font-bold text-white">Tint (Green ↔ Magenta)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-pink-400">
                      {(adj.tint || 0) > 0 ? `+${adj.tint}` : adj.tint || 0}
                    </span>
                    {adj.tint !== 0 && (
                      <button
                        type="button"
                        onClick={() => updatePhotoAdjustments({ tint: 0 })}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.tint || 0}
                  onChange={(e) => updatePhotoAdjustments({ tint: Number(e.target.value) })}
                  className="w-full accent-pink-500 h-2 bg-gradient-to-r from-emerald-500 via-white/20 to-pink-500 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Green</span>
                  <span>Neutral</span>
                  <span>Magenta</span>
                </div>
              </div>
            )}

            {/* Hue */}
            {activeSubTool === 'hue' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎡</span>
                    <span className="text-sm font-bold text-white">Color Hue Rotation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-cyan-400">
                      {adj.hue || 0}°
                    </span>
                    {adj.hue !== 0 && (
                      <button
                        type="button"
                        onClick={() => updatePhotoAdjustments({ hue: 0 })}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={adj.hue || 0}
                  onChange={(e) => updatePhotoAdjustments({ hue: Number(e.target.value) })}
                  className="w-full accent-cyan-400 h-2 bg-gradient-to-r from-red-500 via-green-500 via-blue-500 to-red-500 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-180°</span>
                  <span>0° Original</span>
                  <span>+180°</span>
                </div>
              </div>
            )}

            {/* Highlights */}
            {activeSubTool === 'highlights' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    <span className="text-sm font-bold text-white">Highlights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-400">
                      {(adj.highlights || 0) > 0 ? `+${adj.highlights}` : adj.highlights || 0}%
                    </span>
                    {adj.highlights !== 0 && (
                      <button
                        type="button"
                        onClick={() => updatePhotoAdjustments({ highlights: 0 })}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.highlights || 0}
                  onChange={(e) => updatePhotoAdjustments({ highlights: Number(e.target.value) })}
                  className="w-full accent-amber-400 h-2 bg-white/20 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-100 (Recover)</span>
                  <span>0</span>
                  <span>+100 (Brighten)</span>
                </div>
              </div>
            )}

            {/* Shadows */}
            {activeSubTool === 'shadows' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌑</span>
                    <span className="text-sm font-bold text-white">Shadows</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-purple-400">
                      {(adj.shadows || 0) > 0 ? `+${adj.shadows}` : adj.shadows || 0}%
                    </span>
                    {adj.shadows !== 0 && (
                      <button
                        type="button"
                        onClick={() => updatePhotoAdjustments({ shadows: 0 })}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.shadows || 0}
                  onChange={(e) => updatePhotoAdjustments({ shadows: Number(e.target.value) })}
                  className="w-full accent-purple-400 h-2 bg-white/20 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-100 (Deepen)</span>
                  <span>0</span>
                  <span>+100 (Lift / Fill)</span>
                </div>
              </div>
            )}

            {/* Blur Studio */}
            {activeSubTool === 'blur' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💧</span>
                    <span className="text-sm font-bold text-white">Blur Studio</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-cyan-400">
                    {adj.blur || 0}px
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {(['gaussian', 'motion', 'radial', 'background'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updatePhotoAdjustments({ blurType: type })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                        (adj.blurType || 'gaussian') === type
                          ? 'bg-cyan-500 text-black'
                          : 'bg-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min={0}
                  max={25}
                  value={adj.blur || 0}
                  onChange={(e) => updatePhotoAdjustments({ blur: Number(e.target.value) })}
                  className="w-full accent-cyan-400 h-2 bg-white/20 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Vignette */}
            {activeSubTool === 'vignette' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔘</span>
                    <span className="text-sm font-bold text-white">Vignette Edge Falloff</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-amber-400">
                    {adj.vignette || 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={adj.vignette || 0}
                  onChange={(e) => updatePhotoAdjustments({ vignette: Number(e.target.value) })}
                  className="w-full accent-amber-400 h-2 bg-white/20 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Grain */}
            {activeSubTool === 'grain' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌾</span>
                    <span className="text-sm font-bold text-white">Film Grain Texture</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-amber-400">
                    {adj.grain || 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={adj.grain || 0}
                  onChange={(e) => updatePhotoAdjustments({ grain: Number(e.target.value) })}
                  className="w-full accent-amber-400 h-2 bg-white/20 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Sharpen */}
            {activeSubTool === 'sharpen' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <span className="text-sm font-bold text-white">Sharpen Detail</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-cyan-400">
                    {adj.sharpen || 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={adj.sharpen || 0}
                  onChange={(e) => updatePhotoAdjustments({ sharpen: Number(e.target.value) })}
                  className="w-full accent-cyan-400 h-2 bg-white/20 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* RGB Tone Curves */}
            {activeSubTool === 'curves' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📈</span>
                    <span className="text-sm font-bold text-white">RGB Tone Curves</span>
                  </div>
                  <span className="font-mono text-xs text-amber-400 capitalize">
                    {adj.curveRgb || 'linear'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {CURVE_PRESETS.map((cp) => {
                    const isSelected = (adj.curveRgb || 'linear') === cp.id;
                    return (
                      <button
                        key={cp.id}
                        type="button"
                        onClick={() => updatePhotoAdjustments({ curveRgb: cp.id })}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400/20 text-white font-bold ring-1 ring-amber-400'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <span className="text-base block">{cp.icon}</span>
                        <span className="text-[10px] block truncate">{cp.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* HSL Channels */}
            {activeSubTool === 'hsl' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <span className="text-sm font-bold text-white">HSL Color Tuning</span>
                  </div>
                  <span className="text-xs font-mono text-white capitalize">
                    {activeHslColor}: {activeHslColor === 'red' ? adj.hslRed || 0 : activeHslColor === 'green' ? adj.hslGreen || 0 : activeHslColor === 'blue' ? adj.hslBlue || 0 : adj.hslYellow || 0}
                  </span>
                </div>

                {/* HSL Channel Selector Pills */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveHslColor('red')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      activeHslColor === 'red' ? 'bg-red-500 text-white shadow-md ring-2 ring-white/20' : 'bg-red-950/40 text-red-300 border border-red-500/30'
                    }`}
                  >
                    <span>🔴</span>
                    <span>Red</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHslColor('green')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      activeHslColor === 'green' ? 'bg-emerald-500 text-white shadow-md ring-2 ring-white/20' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <span>🟢</span>
                    <span>Green</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHslColor('blue')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      activeHslColor === 'blue' ? 'bg-blue-500 text-white shadow-md ring-2 ring-white/20' : 'bg-blue-950/40 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    <span>🔵</span>
                    <span>Blue</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHslColor('yellow')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      activeHslColor === 'yellow' ? 'bg-yellow-500 text-black shadow-md ring-2 ring-white/20' : 'bg-yellow-950/40 text-yellow-300 border border-yellow-500/30'
                    }`}
                  >
                    <span>🟡</span>
                    <span>Yellow</span>
                  </button>
                </div>

                {/* Single slider for the selected HSL channel */}
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={
                    activeHslColor === 'red'
                      ? adj.hslRed || 0
                      : activeHslColor === 'green'
                      ? adj.hslGreen || 0
                      : activeHslColor === 'blue'
                      ? adj.hslBlue || 0
                      : adj.hslYellow || 0
                  }
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (activeHslColor === 'red') updatePhotoAdjustments({ hslRed: val });
                    else if (activeHslColor === 'green') updatePhotoAdjustments({ hslGreen: val });
                    else if (activeHslColor === 'blue') updatePhotoAdjustments({ hslBlue: val });
                    else updatePhotoAdjustments({ hslYellow: val });
                  }}
                  className="w-full accent-amber-400 h-2 bg-white/20 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Sub-Tool Strip: Modern Picsart horizontal scrolling row */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block px-1">
              Tap Tool to Adjust
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
                        ? 'bg-amber-400 text-black shadow-lg scale-105'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{tool.icon}</span>
                    <span className="text-[10px]">{tool.label}</span>
                    {tool.hasValue && !isActive && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. MODE B: FILTER PRESETS & CREATIVE FX */}
      {activeMode === 'fx' && (
        <div className="space-y-4">
          {/* Filter Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🎨</span>
                <span>Color Grading Presets (16 Filters)</span>
              </span>
              <span className="text-[10px] text-pink-400 font-bold uppercase">
                {adj.filter || 'Normal'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto no-scrollbar p-0.5">
              {FILTER_PRESETS.map((fp) => {
                const isSelected = (adj.filter || 'none') === fp.id;
                return (
                  <button
                    key={fp.id}
                    type="button"
                    onClick={() => updatePhotoAdjustments({ filter: fp.id })}
                    className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FF2E93] bg-[#FF2E93]/20 text-white ring-1 ring-[#FF2E93] shadow-md scale-102'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <span className="text-base">{fp.icon}</span>
                    <span className="text-[11px] font-bold mt-1 truncate w-full">{fp.name}</span>
                    <span className="text-[9px] text-slate-400 truncate w-full">{fp.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Creative Effects */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>✨</span>
                <span>Creative Effects & Glitch</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-bold uppercase">
                {adj.effect || 'None'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EFFECT_PRESETS.map((ep) => {
                const isSelected = (adj.effect || 'none') === ep.id;
                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => updatePhotoAdjustments({ effect: ep.id as any })}
                    className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-500/20 text-white ring-1 ring-cyan-400 shadow-md'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <span className="text-base">{ep.icon}</span>
                    <span className="text-[11px] font-bold mt-1 truncate w-full">{ep.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
