import React, { useState } from 'react';
import { PlanDraft } from './types';
import { ALL_FONTS } from '../CreateSpotModal';
import { CAPTION_PRESETS, loadGoogleFont, speakText } from '../../../utils/photoFilters';

interface TextStudioTabProps {
  currentDraft: PlanDraft;
  updateDraft: (updates: Partial<PlanDraft>) => void;
  selectedFontCategory: string;
  setSelectedFontCategory: (cat: string) => void;
}

type TextSubTool = 'font' | 'color' | 'effects' | 'spacing' | 'curve' | 'captions';

export const TextStudioTab: React.FC<TextStudioTabProps> = ({
  currentDraft,
  updateDraft,
  selectedFontCategory,
  setSelectedFontCategory,
}) => {
  const [activeSubTool, setActiveSubTool] = useState<TextSubTool>('font');
  const [activeCaptionCategory, setActiveCaptionCategory] = useState(CAPTION_PRESETS[0].category);

  const GRADIENTS = [
    { label: 'None', value: '' },
    { label: 'Sunset Glow', value: 'linear-gradient(135deg, #FF512F, #DD2476)' },
    { label: 'Neon Cyber', value: 'linear-gradient(135deg, #00F0FF, #FF2E93)' },
    { label: 'Golden Luxury', value: 'linear-gradient(135deg, #FFE000, #799F0C)' },
    { label: 'Deep Ocean', value: 'linear-gradient(135deg, #2E3192, #1BFFFF)' },
    { label: 'Purple Haze', value: 'linear-gradient(135deg, #8E2DE2, #4A00E0)' },
  ];

  const TEXT_COLORS = [
    '#FFFFFF', '#000000', '#FF2E93', '#FFE600', '#00F0FF',
    '#10B981', '#A855F7', '#F97316', '#EF4444', '#EC4899',
  ];

  const SUB_TOOLS: { id: TextSubTool; label: string; icon: string }[] = [
    { id: 'font', label: 'Font', icon: '🔤' },
    { id: 'color', label: 'Color', icon: '🎨' },
    { id: 'effects', label: '3D & Glow', icon: '⚡' },
    { id: 'spacing', label: 'Spacing', icon: '📐' },
    { id: 'curve', label: 'Curve', icon: '🔄' },
    { id: 'captions', label: 'Quotes & Ideas', icon: '💡' },
  ];

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
      {/* 1. Text Inputs (Headline & Secondary Subtext) */}
      <div className="space-y-2.5">
        {/* Main Headline */}
        <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5 focus-within:border-[#FF2E93] transition-colors">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <span>💬</span>
              <span>Main Headline</span>
            </label>
            <div className="flex items-center gap-2">
              {currentDraft.headline && (
                <button
                  type="button"
                  onClick={() => speakText(currentDraft.headline)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                  title="Text to speech preview"
                >
                  <span>🔊</span>
                  <span>Hear Aloud</span>
                </button>
              )}
              {currentDraft.headline && (
                <button
                  type="button"
                  onClick={() => updateDraft({ headline: '' })}
                  className="text-[10px] text-slate-400 hover:text-rose-400 font-semibold cursor-pointer"
                >
                  ✕ Clear
                </button>
              )}
              <span className="text-[10px] text-slate-500 font-mono">
                {currentDraft.headline.length}/48
              </span>
            </div>
          </div>
          <input
            type="text"
            maxLength={48}
            value={currentDraft.headline}
            onChange={(e) => updateDraft({ headline: e.target.value })}
            placeholder="Type your message..."
            className="w-full bg-transparent text-white text-sm font-medium focus:outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Subtext */}
        <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5 focus-within:border-cyan-400 transition-colors">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <span>📝</span>
              <span>Subtext / Secondary Message (Optional)</span>
            </label>
            {currentDraft.secondaryText && (
              <button
                type="button"
                onClick={() => updateDraft({ secondaryText: '' })}
                className="text-[10px] text-slate-400 hover:text-rose-400 font-semibold cursor-pointer"
              >
                ✕ Clear
              </button>
            )}
          </div>
          <input
            type="text"
            maxLength={80}
            value={currentDraft.secondaryText || ''}
            onChange={(e) => updateDraft({ secondaryText: e.target.value })}
            placeholder="e.g. Can't wait to see you there! ♡"
            className="w-full bg-transparent text-white text-xs font-medium focus:outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* 2. Focused Single-Control Stage */}
      <div className="p-4 rounded-2xl bg-black/50 border border-white/15 space-y-3.5 shadow-inner">
        {/* Font Studio */}
        {activeSubTool === 'font' && (
          <div className="space-y-3">
            {(() => {
              const activeFontObj = ALL_FONTS.find(
                (f) => f.id === currentDraft.fontFamily || f.name === currentDraft.fontFamily
              );
              const activeFontName = activeFontObj ? activeFontObj.id : (currentDraft.fontFamily || 'Caveat');
              const activeFontKind = activeFontObj
                ? activeFontObj.name.match(/\((.*?)\)/)?.[1] || activeFontObj.category
                : null;
              return (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                    <span>🔤</span>
                    <span>
                      Font: <span className="text-[#FF2E93]">{activeFontName}</span>
                    </span>
                    {activeFontKind && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF2E93]/20 text-pink-300 border border-[#FF2E93]/30 font-medium">
                        {activeFontKind}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    Size: {currentDraft.fontSize || 22}px
                  </span>
                </div>
              );
            })()}

            {/* Font Size Slider */}
            <input
              type="range"
              min={14}
              max={48}
              value={currentDraft.fontSize || 22}
              onChange={(e) => updateDraft({ fontSize: Number(e.target.value) })}
              className="w-full accent-[#FF2E93] h-1.5 bg-white/20 rounded-lg cursor-pointer"
            />

            {/* Font Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {['All', 'Handwriting', 'Display', 'Modern', 'Retro', 'Elegant'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedFontCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                    selectedFontCategory === cat
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Fonts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto no-scrollbar p-0.5">
              {ALL_FONTS.filter((f) => {
                if (selectedFontCategory === 'All') return true;
                if (selectedFontCategory === 'Handwriting' && (f.category === 'Handwritten' || f.category === 'Handwriting')) return true;
                if (selectedFontCategory === 'Elegant' && (f.category === 'Serif' || f.category === 'Elegant')) return true;
                return f.category === selectedFontCategory;
              }).map((font) => {
                const isSelected =
                  (currentDraft.fontFamily || 'Caveat') === font.id ||
                  (currentDraft.fontFamily || 'Caveat') === font.name;
                const fontKind = font.name.match(/\((.*?)\)/)?.[1] || font.category;

                return (
                  <button
                    key={font.id || font.name}
                    type="button"
                    onClick={() => {
                      loadGoogleFont(font.id);
                      updateDraft({ fontFamily: font.id });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all group flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#FF2E93] bg-[#FF2E93]/20 text-white font-bold ring-1 ring-[#FF2E93] shadow-md shadow-[#FF2E93]/20'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold truncate text-white">
                        {font.id}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 font-medium tracking-tight ${
                          isSelected
                            ? 'bg-[#FF2E93]/40 text-pink-200'
                            : 'bg-white/10 text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {fontKind}
                      </span>
                    </div>
                    <div
                      className={`text-sm truncate leading-snug pt-0.5 ${
                        isSelected ? 'text-pink-200 font-semibold' : 'text-slate-200'
                      }`}
                      style={{ fontFamily: font.family }}
                    >
                      SpotPop ✨
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Color & Gradients */}
        {activeSubTool === 'color' && (
          <div className="space-y-3">
            <span className="text-xs font-bold text-white block">Solid Colors</span>
            <div className="flex flex-wrap gap-2">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => updateDraft({ textColor: c, textGradient: '' })}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    currentDraft.textColor === c && !currentDraft.textGradient
                      ? 'border-white scale-110 shadow-md ring-2 ring-[#FF2E93]'
                      : 'border-white/20'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label className="w-7 h-7 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center cursor-pointer text-xs hover:border-white">
                <span>🎨</span>
                <input
                  type="color"
                  value={currentDraft.textColor || '#FFFFFF'}
                  onChange={(e) => updateDraft({ textColor: e.target.value, textGradient: '' })}
                  className="sr-only"
                />
              </label>
            </div>

            <span className="text-xs font-bold text-white block pt-2 border-t border-white/10">Gradient Styles</span>
            <div className="grid grid-cols-3 gap-2">
              {GRADIENTS.map((g) => {
                const isSelected = currentDraft.textGradient === g.value;
                return (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => updateDraft({ textGradient: g.value })}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                      isSelected
                        ? 'border-white ring-2 ring-white/30 text-white'
                        : 'border-white/10 text-slate-300 hover:border-white/20'
                    }`}
                    style={g.value ? { background: g.value, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : undefined}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3D & Glow Effects */}
        {activeSubTool === 'effects' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">3D Text Extrusion</span>
                <span className="text-[10px] text-slate-400">Adds bold depth shadow</span>
              </div>
              <button
                type="button"
                onClick={() => updateDraft({ text3D: !currentDraft.text3D })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  currentDraft.text3D ? 'bg-amber-400 text-black shadow-md' : 'bg-white/10 text-slate-400'
                }`}
              >
                {currentDraft.text3D ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Neon Glow */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="flex justify-between text-xs text-slate-200">
                <span className="font-bold">Neon Glow Color</span>
                <span className="text-[10px] text-cyan-400">{currentDraft.textGlow ? 'Active' : 'None'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateDraft({ textGlow: '' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    !currentDraft.textGlow ? 'bg-white text-black' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  None
                </button>
                {['#FF2E93', '#00F0FF', '#FFE600', '#10B981', '#A855F7'].map((glow) => (
                  <button
                    key={glow}
                    type="button"
                    onClick={() => updateDraft({ textGlow: glow })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      currentDraft.textGlow === glow ? 'border-white scale-125' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: glow, boxShadow: `0 0 8px ${glow}` }}
                  />
                ))}
              </div>
            </div>

            {/* Text Stroke / Outline */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="flex justify-between text-xs text-slate-200">
                <span className="font-bold">Outline Stroke</span>
                <span className="text-[10px] text-slate-400">{currentDraft.textStroke ? 'Enabled' : 'None'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateDraft({ textStroke: '' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    !currentDraft.textStroke ? 'bg-white text-black' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  None
                </button>
                <button
                  type="button"
                  onClick={() => updateDraft({ textStroke: '1px #000000' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    currentDraft.textStroke === '1px #000000' ? 'bg-black text-white border border-white' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  Dark Outline
                </button>
                <button
                  type="button"
                  onClick={() => updateDraft({ textStroke: '1px #FFFFFF' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    currentDraft.textStroke === '1px #FFFFFF' ? 'bg-white text-black' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  Light Outline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Spacing & Line Height */}
        {activeSubTool === 'spacing' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-200">
                <span className="font-bold">Letter Spacing</span>
                <span className="font-mono text-cyan-400">{currentDraft.letterSpacing || 0}px</span>
              </div>
              <input
                type="range"
                min={-2}
                max={12}
                value={currentDraft.letterSpacing || 0}
                onChange={(e) => updateDraft({ letterSpacing: Number(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="flex justify-between text-xs text-slate-200">
                <span className="font-bold">Line Height</span>
                <span className="font-mono text-cyan-400">{currentDraft.lineHeight || 1.15}x</span>
              </div>
              <input
                type="range"
                min={0.9}
                max={2.0}
                step={0.05}
                value={currentDraft.lineHeight || 1.15}
                onChange={(e) => updateDraft({ lineHeight: Number(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Curved Text */}
        {activeSubTool === 'curve' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Curved Arch Text</span>
                <span className="text-[10px] text-slate-400">Wraps text along a circular arc</span>
              </div>
              <button
                type="button"
                onClick={() => updateDraft({ isCurvedText: !currentDraft.isCurvedText })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  currentDraft.isCurvedText ? 'bg-amber-400 text-black shadow-md' : 'bg-white/10 text-slate-400'
                }`}
              >
                {currentDraft.isCurvedText ? 'ON' : 'OFF'}
              </button>
            </div>

            {currentDraft.isCurvedText && (
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex justify-between text-xs text-slate-200">
                  <span className="font-bold">Curve Arch Radius</span>
                  <span className="font-mono text-amber-400">{currentDraft.curveRadius || 120}</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={250}
                  value={currentDraft.curveRadius || 120}
                  onChange={(e) => updateDraft({ curveRadius: Number(e.target.value) })}
                  className="w-full accent-amber-400 h-1.5 bg-white/20 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Caption Ideas & Quotes */}
        {activeSubTool === 'captions' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {CAPTION_PRESETS.map((cat) => (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setActiveCaptionCategory(cat.category)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                    activeCaptionCategory === cat.category ? 'bg-pink-500 text-white' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto no-scrollbar">
              {CAPTION_PRESETS.find((c) => c.category === activeCaptionCategory)?.captions.map((caption) => (
                <button
                  key={caption}
                  type="button"
                  onClick={() => updateDraft({ headline: caption })}
                  className="p-2 rounded-xl border border-white/10 bg-white/5 hover:border-pink-400 hover:bg-pink-500/10 text-left text-xs text-white transition-all"
                >
                  {caption}
                </button>
              ))}
            </div>
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
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex flex-col items-center gap-1 shrink-0 ${
                  isActive
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-base">{tool.icon}</span>
                <span className="text-[10px]">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
