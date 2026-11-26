import React, { useState, useEffect } from 'react';
import { PlanDraft } from './types';
import { ALL_FONTS } from './constants';
import { CAPTION_PRESETS, loadGoogleFont, speakText } from '../../../utils/photoFilters';
import { HorizontalScroll } from '../../common/HorizontalScroll';

export type TextTarget = 'headline' | 'subtext' | 'author';

interface TextStudioTabProps {
  currentDraft: PlanDraft;
  updateDraft: (updates: Partial<PlanDraft>) => void;
  selectedFontCategory: string;
  setSelectedFontCategory: (cat: string) => void;
  selectedItemId?: string | null;
  onSelectTarget?: (id: TextTarget) => void;
}

type TextSubTool = 'font' | 'color' | 'effects' | 'spacing' | 'curve' | 'captions';

export const TextStudioTab: React.FC<TextStudioTabProps> = ({
  currentDraft,
  updateDraft,
  selectedFontCategory,
  setSelectedFontCategory,
  selectedItemId,
  onSelectTarget,
}) => {
  const [activeSubTool, setActiveSubTool] = useState<TextSubTool>('font');
  const [activeCaptionCategory, setActiveCaptionCategory] = useState(CAPTION_PRESETS[0].category);

  // Track target: headline | subtext | author
  const [manualTarget, setManualTarget] = useState<TextTarget>('headline');

  useEffect(() => {
    if (selectedItemId === 'headline' || selectedItemId === 'subtext' || selectedItemId === 'author') {
      setManualTarget(selectedItemId);
    }
  }, [selectedItemId]);

  const currentTarget: TextTarget =
    selectedItemId === 'headline' || selectedItemId === 'subtext' || selectedItemId === 'author'
      ? selectedItemId
      : manualTarget;

  const switchTarget = (target: TextTarget) => {
    setManualTarget(target);
    onSelectTarget?.(target);
  };

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

  // ================= DYNAMIC STYLE GETTERS & SETTERS FOR ACTIVE TARGET =================
  const activeFontFamily =
    currentTarget === 'headline'
      ? (currentDraft.fontFamily || 'Caveat')
      : currentTarget === 'subtext'
      ? (currentDraft.subtextFontFamily || currentDraft.fontFamily || 'Caveat')
      : (currentDraft.authorFontFamily || currentDraft.fontFamily || 'Caveat');

  const setTargetFontFamily = (fontId: string) => {
    loadGoogleFont(fontId);
    if (currentTarget === 'headline') {
      updateDraft({ fontFamily: fontId });
    } else if (currentTarget === 'subtext') {
      updateDraft({ subtextFontFamily: fontId });
    } else {
      updateDraft({ authorFontFamily: fontId });
    }
  };

  const activeFontSize =
    currentTarget === 'headline'
      ? (currentDraft.fontSize || 22)
      : currentTarget === 'subtext'
      ? (currentDraft.subtextSize || 14)
      : (currentDraft.authorSize || 11);

  const fontSizeMin = currentTarget === 'headline' ? 14 : currentTarget === 'subtext' ? 10 : 9;
  const fontSizeMax = currentTarget === 'headline' ? 48 : currentTarget === 'subtext' ? 36 : 24;

  const setTargetFontSize = (size: number) => {
    if (currentTarget === 'headline') {
      updateDraft({ fontSize: size });
    } else if (currentTarget === 'subtext') {
      updateDraft({ subtextSize: size });
    } else {
      updateDraft({ authorSize: size });
    }
  };

  const activeTextColor =
    currentTarget === 'headline'
      ? (currentDraft.textColor || '#FFFFFF')
      : currentTarget === 'subtext'
      ? (currentDraft.subtextColor || currentDraft.textColor || '#FFFFFF')
      : (currentDraft.authorColor || currentDraft.textColor || '#FFFFFF');

  const activeTextGradient =
    currentTarget === 'headline'
      ? (currentDraft.textGradient || '')
      : currentTarget === 'subtext'
      ? (currentDraft.subtextGradient || '')
      : '';

  const setTargetTextColor = (color: string) => {
    if (currentTarget === 'headline') {
      updateDraft({ textColor: color, textGradient: '' });
    } else if (currentTarget === 'subtext') {
      updateDraft({ subtextColor: color, subtextGradient: '' });
    } else {
      updateDraft({ authorColor: color });
    }
  };

  const setTargetGradient = (gradient: string) => {
    if (currentTarget === 'headline') {
      updateDraft({ textGradient: gradient });
    } else if (currentTarget === 'subtext') {
      updateDraft({ subtextGradient: gradient });
    }
  };

  const active3D =
    currentTarget === 'headline'
      ? !!currentDraft.text3D
      : currentTarget === 'subtext'
      ? !!currentDraft.subtext3D
      : !!currentDraft.author3D;

  const toggleTarget3D = () => {
    if (currentTarget === 'headline') {
      updateDraft({ text3D: !currentDraft.text3D });
    } else if (currentTarget === 'subtext') {
      updateDraft({ subtext3D: !currentDraft.subtext3D });
    } else {
      updateDraft({ author3D: !currentDraft.author3D });
    }
  };

  const activeGlow =
    currentTarget === 'headline'
      ? (currentDraft.textGlow || '')
      : currentTarget === 'subtext'
      ? (currentDraft.subtextGlow || '')
      : (currentDraft.authorGlow || '');

  const setTargetGlow = (glow: string) => {
    if (currentTarget === 'headline') {
      updateDraft({ textGlow: glow });
    } else if (currentTarget === 'subtext') {
      updateDraft({ subtextGlow: glow });
    } else {
      updateDraft({ authorGlow: glow });
    }
  };

  const activeStroke =
    currentTarget === 'headline'
      ? (currentDraft.textStroke || '')
      : currentTarget === 'subtext'
      ? (currentDraft.subtextStroke || '')
      : (currentDraft.authorStroke || '');

  const setTargetStroke = (stroke: string) => {
    if (currentTarget === 'headline') {
      updateDraft({ textStroke: stroke });
    } else if (currentTarget === 'subtext') {
      updateDraft({ subtextStroke: stroke });
    } else {
      updateDraft({ authorStroke: stroke });
    }
  };

  const activeLetterSpacing =
    currentTarget === 'headline'
      ? (currentDraft.letterSpacing || 0)
      : currentTarget === 'subtext'
      ? (currentDraft.subtextLetterSpacing || 0)
      : 0;

  const setTargetLetterSpacing = (spacing: number) => {
    if (currentTarget === 'headline') {
      updateDraft({ letterSpacing: spacing });
    } else if (currentTarget === 'subtext') {
      updateDraft({ subtextLetterSpacing: spacing });
    }
  };

  const targetLabel =
    currentTarget === 'headline'
      ? 'Headline'
      : currentTarget === 'subtext'
      ? 'Subtext'
      : 'Creator Tag';

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
      {/* 1. Text Inputs (Headline, Subtext & Creator Signature) */}
      <div className="space-y-2.5">
        {/* Main Headline */}
        <div
          onClick={() => switchTarget('headline')}
          className={`p-3 rounded-xl bg-black/50 border transition-all cursor-pointer ${
            currentTarget === 'headline'
              ? 'border-[#FF2E93] ring-1 ring-[#FF2E93]/50 bg-black/70 shadow-md shadow-[#FF2E93]/10'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-white flex items-center gap-1.5 cursor-pointer">
              <span>💬</span>
              <span>Main Headline (Optional)</span>
              {currentTarget === 'headline' && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FF2E93] text-white font-extrabold uppercase">
                  Active
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              {currentDraft.headline && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakText(currentDraft.headline);
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    updateDraft({ headline: '' });
                  }}
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
            onFocus={() => switchTarget('headline')}
            onChange={(e) => updateDraft({ headline: e.target.value })}
            placeholder="Type your message or leave blank..."
            className="w-full bg-transparent text-white text-sm font-medium focus:outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Subtext */}
        <div
          onClick={() => switchTarget('subtext')}
          className={`p-3 rounded-xl bg-black/50 border transition-all cursor-pointer ${
            currentTarget === 'subtext'
              ? 'border-amber-400 ring-1 ring-amber-400/50 bg-black/70 shadow-md shadow-amber-400/10'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer">
              <span>📝</span>
              <span>Subtext / Secondary Message (Optional)</span>
              {currentTarget === 'subtext' && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-black font-extrabold uppercase">
                  Active
                </span>
              )}
            </label>
            {currentDraft.secondaryText && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateDraft({ secondaryText: '' });
                }}
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
            onFocus={() => switchTarget('subtext')}
            onChange={(e) => updateDraft({ secondaryText: e.target.value })}
            placeholder="e.g. Can't wait to see you there! ♡"
            className="w-full bg-transparent text-white text-xs font-medium focus:outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Creator Signature / Author Tag */}
        <div
          onClick={() => switchTarget('author')}
          className={`p-3 rounded-xl bg-black/50 border transition-all cursor-pointer ${
            currentTarget === 'author'
              ? 'border-cyan-400 ring-1 ring-cyan-400/50 bg-black/70 shadow-md shadow-cyan-400/10'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer">
              <span>✍️</span>
              <span>Creator Signature / Author Tag (Optional)</span>
              {currentTarget === 'author' && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-400 text-black font-extrabold uppercase">
                  Active
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              {currentDraft.creatorName && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateDraft({ creatorName: '' });
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-400 font-semibold cursor-pointer"
                >
                  ✕ Clear
                </button>
              )}
              <span className="text-[10px] text-slate-500 font-mono">
                {(currentDraft.creatorName || '').length}/32
              </span>
            </div>
          </div>
          <input
            type="text"
            maxLength={32}
            value={currentDraft.creatorName || ''}
            onFocus={() => switchTarget('author')}
            onChange={(e) => updateDraft({ creatorName: e.target.value })}
            placeholder="e.g. Your Name, Handle, or leave blank to hide"
            className="w-full bg-transparent text-white text-xs font-medium focus:outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Target Element Selector Bar */}
      <div className="p-1.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-1.5">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 shrink-0">
          Selected Target:
        </span>
        <div className="flex items-center gap-1 flex-1">
          <button
            type="button"
            onClick={() => switchTarget('headline')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              currentTarget === 'headline'
                ? 'bg-[#FF2E93] text-white shadow-md shadow-[#FF2E93]/30 scale-[1.02]'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>💬</span>
            <span>Headline</span>
          </button>
          <button
            type="button"
            onClick={() => switchTarget('subtext')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              currentTarget === 'subtext'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30 scale-[1.02]'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>📝</span>
            <span>Subtext</span>
          </button>
          <button
            type="button"
            onClick={() => switchTarget('author')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              currentTarget === 'author'
                ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/30 scale-[1.02]'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>✍️</span>
            <span>Creator Tag</span>
          </button>
        </div>
      </div>

      {/* Sub-Tool Strip: Modern horizontal scrolling row */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            Styling Controls
          </span>
          <span className="text-[10px] text-slate-400">
            Applying to: <strong className="text-white">{targetLabel}</strong>
          </span>
        </div>
        <HorizontalScroll className="gap-1.5 py-1">
          {SUB_TOOLS.map((tool) => {
            const isActive = activeSubTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveSubTool(tool.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex flex-col items-center gap-1 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <span className="text-base">{tool.icon}</span>
                <span className="text-[10px]">{tool.label}</span>
              </button>
            );
          })}
        </HorizontalScroll>
      </div>

      {/* 2. Focused Single-Control Stage */}
      <div className="p-4 rounded-2xl bg-black/50 border border-white/15 space-y-3.5 shadow-inner">
        {/* Font Studio */}
        {activeSubTool === 'font' && (
          <div className="space-y-3">
            {(() => {
              const activeFontObj = ALL_FONTS.find(
                (f) => f.id === activeFontFamily || f.name === activeFontFamily
              );
              const activeFontName = activeFontObj ? activeFontObj.id : activeFontFamily;
              const activeFontKind = activeFontObj
                ? activeFontObj.name.match(/\((.*?)\)/)?.[1] || activeFontObj.category
                : null;
              return (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                    <span>🔤</span>
                    <span>
                      {targetLabel} Font: <span className="text-[#FF2E93]">{activeFontName}</span>
                    </span>
                    {activeFontKind && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF2E93]/20 text-pink-300 border border-[#FF2E93]/30 font-medium">
                        {activeFontKind}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    Size: {activeFontSize}px
                  </span>
                </div>
              );
            })()}

            {/* Font Size Slider */}
            <input
              type="range"
              min={fontSizeMin}
              max={fontSizeMax}
              value={activeFontSize}
              onChange={(e) => setTargetFontSize(Number(e.target.value))}
              className="w-full accent-[#FF2E93] h-1.5 bg-white/20 rounded-lg cursor-pointer"
            />

            {/* Font Category Filter */}
            <HorizontalScroll className="gap-1.5 py-1">
              {['All', 'Handwriting', 'Display', 'Modern', 'Retro', 'Elegant'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedFontCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedFontCategory === cat
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </HorizontalScroll>

            {/* Fonts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto no-scrollbar p-0.5">
              {ALL_FONTS.filter((f) => {
                if (selectedFontCategory === 'All') return true;
                const catStr = f.category as string;
                if (selectedFontCategory === 'Handwriting' && (catStr === 'Handwritten' || catStr === 'Handwriting')) return true;
                if (selectedFontCategory === 'Elegant' && (catStr === 'Serif' || catStr === 'Elegant')) return true;
                return f.category === selectedFontCategory;
              }).map((font) => {
                const isSelected =
                  activeFontFamily === font.id ||
                  activeFontFamily === font.name;
                const fontKind = font.name.match(/\((.*?)\)/)?.[1] || font.category;

                return (
                  <button
                    key={font.id || font.name}
                    type="button"
                    onClick={() => setTargetFontFamily(font.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all group flex flex-col justify-between cursor-pointer ${
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
                        className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 font-medium tracking-tight hidden sm:inline-block ${
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
            <span className="text-xs font-bold text-white block">
              {targetLabel} Solid Colors
            </span>
            <div className="flex flex-wrap gap-2">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTargetTextColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                    activeTextColor === c && !activeTextGradient
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
                  value={activeTextColor || '#FFFFFF'}
                  onChange={(e) => setTargetTextColor(e.target.value)}
                  className="sr-only"
                />
              </label>
            </div>

            {currentTarget !== 'author' && (
              <>
                <span className="text-xs font-bold text-white block pt-2 border-t border-white/10">
                  {targetLabel} Gradient Styles
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENTS.map((g) => {
                    const isSelected = activeTextGradient === g.value;
                    return (
                      <button
                        key={g.label}
                        type="button"
                        onClick={() => setTargetGradient(g.value)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
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
              </>
            )}
          </div>
        )}

        {/* 3D & Glow Effects */}
        {activeSubTool === 'effects' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  {targetLabel} 3D Text Extrusion
                </span>
                <span className="text-[10px] text-slate-400">Adds bold depth shadow</span>
              </div>
              <button
                type="button"
                onClick={toggleTarget3D}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  active3D ? 'bg-amber-400 text-black shadow-md' : 'bg-white/10 text-slate-400'
                }`}
              >
                {active3D ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Neon Glow */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="flex justify-between text-xs text-slate-200">
                <span className="font-bold">{targetLabel} Neon Glow</span>
                <span className="text-[10px] text-cyan-400">{activeGlow ? 'Active' : 'None'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTargetGlow('')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    !activeGlow ? 'bg-white text-black' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  None
                </button>
                {['#FF2E93', '#00F0FF', '#FFE600', '#10B981', '#A855F7'].map((glow) => (
                  <button
                    key={glow}
                    type="button"
                    onClick={() => setTargetGlow(glow)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      activeGlow === glow ? 'border-white scale-125' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: glow, boxShadow: `0 0 8px ${glow}` }}
                  />
                ))}
              </div>
            </div>

            {/* Text Stroke / Outline */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="flex justify-between text-xs text-slate-200">
                <span className="font-bold">{targetLabel} Outline Stroke</span>
                <span className="text-[10px] text-slate-400">{activeStroke ? 'Enabled' : 'None'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTargetStroke('')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    !activeStroke ? 'bg-white text-black' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  None
                </button>
                <button
                  type="button"
                  onClick={() => setTargetStroke('1px #000000')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    activeStroke === '1px #000000' ? 'bg-black text-white border border-white' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  Dark Outline
                </button>
                <button
                  type="button"
                  onClick={() => setTargetStroke('1px #FFFFFF')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    activeStroke === '1px #FFFFFF' ? 'bg-white text-black' : 'bg-white/10 text-slate-300'
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
                <span className="font-bold">{targetLabel} Letter Spacing</span>
                <span className="font-mono text-cyan-400">{activeLetterSpacing}px</span>
              </div>
              <input
                type="range"
                min={-2}
                max={12}
                value={activeLetterSpacing}
                onChange={(e) => setTargetLetterSpacing(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>

            {currentTarget === 'headline' && (
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
            )}
          </div>
        )}

        {/* Curved Text */}
        {activeSubTool === 'curve' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Curved Arch Text</span>
                <span className="text-[10px] text-slate-400">Wraps headline along a circular arc</span>
              </div>
              <button
                type="button"
                onClick={() => updateDraft({ isCurvedText: !currentDraft.isCurvedText })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
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
            <HorizontalScroll className="gap-1.5 py-1">
              {CAPTION_PRESETS.map((cat) => (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setActiveCaptionCategory(cat.category)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeCaptionCategory === cat.category ? 'bg-pink-500 text-white' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </HorizontalScroll>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto no-scrollbar">
              {CAPTION_PRESETS.find((c) => c.category === activeCaptionCategory)?.captions.map((caption) => (
                <button
                  key={caption}
                  type="button"
                  onClick={() => {
                    if (currentTarget === 'subtext') {
                      updateDraft({ secondaryText: caption });
                    } else {
                      updateDraft({ headline: caption });
                    }
                  }}
                  className="p-2 rounded-xl border border-white/10 bg-white/5 hover:border-pink-400 hover:bg-pink-500/10 text-left text-xs text-white transition-all cursor-pointer"
                >
                  {caption}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
