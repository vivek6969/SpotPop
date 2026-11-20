import React, { useState } from 'react';
import { PlanDraft } from './types';
import { PhotoAdjustments, ProductTier } from '../../../types';

interface PhotoCropTabProps {
  currentDraft: PlanDraft;
  updateDraft: (updates: Partial<PlanDraft>) => void;
  updatePhotoAdjustments: (updates: Partial<PhotoAdjustments>) => void;
  tier: ProductTier;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type ToolSubTab = 'crop' | 'zoom' | 'rotate' | 'flip' | 'skew';

export const PhotoCropTab: React.FC<PhotoCropTabProps> = ({
  currentDraft,
  updateDraft,
  updatePhotoAdjustments,
  tier: _tier,
  onFileUpload,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ToolSubTab>('crop');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const adj = currentDraft.photoAdjustments || {};

  const DEFAULT_PHOTO_URL =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';

  const isGif = Boolean(
    currentDraft.imageUrl && (
      currentDraft.imageUrl.toLowerCase().includes('.gif') ||
      currentDraft.imageUrl.startsWith('data:image/gif') ||
      currentDraft.imageUrl.includes('image/gif')
    )
  );

  const currentFit = currentDraft.imageFit || 'cover';
  const currentRatio = adj.aspectRatio || 'free';

  const handleResetTransforms = () => {
    updateDraft({
      photoZoom: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
      imageFit: 'cover',
    });
    updatePhotoAdjustments({
      flipH: false,
      flipV: false,
      rotationAngle: 0,
      aspectRatio: 'free',
      perspectiveSkewX: 0,
      perspectiveSkewY: 0,
    });
  };

  const handleCenterPhoto = () => {
    updateDraft({
      photoOffsetX: 0,
      photoOffsetY: 0,
    });
  };

  const handleRotate = (delta: number) => {
    const cur = adj.rotationAngle || 0;
    const next = (cur + delta) % 360;
    updatePhotoAdjustments({ rotationAngle: next });
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    updateDraft({
      imageUrl: customUrl.trim(),
      photoZoom: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
    });
    setShowUrlInput(false);
    setCustomUrl('');
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
      {/* 1. Photo Action Bar & Status */}
      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-black/60 border border-white/20 shrink-0">
              {currentDraft.imageUrl ? (
                <img
                  src={currentDraft.imageUrl}
                  alt="Current"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-sm">📸</span>
              )}
              {isGif && (
                <span className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-[7px] font-black text-white text-center py-0.2">
                  GIF
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white block">Photo Artwork</span>
                {isGif ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Animated GIF Active
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    {currentDraft.imageUrl ? 'Custom image loaded' : 'Default photo'}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">
                Supports animated GIFs, JPG, PNG & WebP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-colors"
              title="Paste image or GIF URL"
            >
              🔗 URL
            </button>
            <button
              type="button"
              onClick={() => updateDraft({ imageUrl: DEFAULT_PHOTO_URL, photoZoom: 1, photoOffsetX: 0, photoOffsetY: 0 })}
              className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-colors"
            >
              Default
            </button>
            <label className="px-3 py-1.5 rounded-xl bg-[#FF2E93] hover:bg-[#E6007A] text-white text-xs font-bold cursor-pointer transition-colors shadow-md flex items-center gap-1.5">
              <span>{currentDraft.imageUrl ? 'Change Photo/GIF' : 'Upload Photo/GIF'}</span>
              <input type="file" accept="image/*,.gif" onChange={onFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Optional URL Paste Field */}
        {showUrlInput && (
          <div className="pt-2 border-t border-white/10 flex gap-2 animate-fade-in">
            <input
              type="url"
              placeholder="Paste direct Image or GIF URL (https://...)"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF2E93]"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-3 py-1.5 bg-[#FF2E93] hover:bg-[#E6007A] text-white text-xs font-bold rounded-lg transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* 2. Active Tool Stage */}
      <div className="p-4 rounded-xl bg-black/50 border border-white/10 min-h-[145px] flex flex-col justify-center">
        {/* SUBTAB 1: CROP & ASPECT RATIO */}
        {activeSubTab === 'crop' && (
          <div className="space-y-3.5">
            {/* Fit mode selector */}
            <div>
              <div className="flex justify-between items-center text-xs text-slate-300 mb-1.5">
                <span className="font-bold flex items-center gap-1.5">
                  <span>📐</span>
                  <span>Image Crop & Fit Mode</span>
                </span>
                <span className="text-[10px] text-pink-400 font-medium">
                  {currentFit === 'cover' ? 'Crop to Fill' : 'Full Image Visible'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateDraft({ imageFit: 'cover' })}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    currentFit === 'cover'
                      ? 'border-[#FF2E93] bg-[#FF2E93]/20 text-white shadow-sm'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span>🔲</span>
                  <span>Cover (Crop to Fill)</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateDraft({ imageFit: 'contain' })}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    currentFit === 'contain'
                      ? 'border-[#FF2E93] bg-[#FF2E93]/20 text-white shadow-sm'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span>🖼️</span>
                  <span>Contain (Fit Uncropped)</span>
                </button>
              </div>
            </div>

            {/* Aspect Ratio Presets */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Crop Frame Shape</span>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: 'free', label: 'Default', icon: '🎴' },
                  { id: '1:1', label: '1:1 Square', icon: '⏹️' },
                  { id: '4:5', label: '4:5 Portrait', icon: '📱' },
                  { id: '16:9', label: '16:9 Cinema', icon: '🖥️' },
                  { id: 'circle', label: 'Circle', icon: '⭕' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => updatePhotoAdjustments({ aspectRatio: preset.id as any })}
                    className={`py-1.5 px-1 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      currentRatio === preset.id
                        ? 'border-[#FF2E93] bg-[#FF2E93]/25 text-white shadow-sm'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm">{preset.icon}</span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Drag Hint */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-[11px] text-pink-300">
              <span className="text-base shrink-0">💡</span>
              <span>
                <strong>Tip:</strong> Drag directly on the card photo preview to pan & position it! Scroll wheel zooms.
              </span>
            </div>
          </div>
        )}

        {/* SUBTAB 2: ZOOM & PAN */}
        {activeSubTab === 'zoom' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-200">
              <span className="font-bold flex items-center gap-1.5">
                <span>🔍</span>
                <span>Zoom Scale</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateDraft({
                      photoZoom: Math.max(0.5, Number(((currentDraft.photoZoom ?? 1) - 0.1).toFixed(2))),
                    })
                  }
                  className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-xs"
                >
                  -
                </button>
                <span className="font-mono text-[#FF2E93] font-bold w-12 text-center">
                  {Math.round((currentDraft.photoZoom ?? 1) * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateDraft({
                      photoZoom: Math.min(3.5, Number(((currentDraft.photoZoom ?? 1) + 0.1).toFixed(2))),
                    })
                  }
                  className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-xs"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.05}
              value={currentDraft.photoZoom ?? 1}
              onChange={(e) => updateDraft({ photoZoom: Number(e.target.value) })}
              className="w-full accent-[#FF2E93]"
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Pan X</span>
                  <span className="font-mono text-white">{currentDraft.photoOffsetX ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min={-120}
                  max={120}
                  value={currentDraft.photoOffsetX ?? 0}
                  onChange={(e) => updateDraft({ photoOffsetX: Number(e.target.value) })}
                  className="w-full accent-pink-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Pan Y</span>
                  <span className="font-mono text-white">{currentDraft.photoOffsetY ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min={-120}
                  max={120}
                  value={currentDraft.photoOffsetY ?? 0}
                  onChange={(e) => updateDraft({ photoOffsetY: Number(e.target.value) })}
                  className="w-full accent-pink-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleCenterPhoto}
                className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-pink-300 font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>🎯</span>
                <span>Center Photo</span>
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB 3: ROTATE */}
        {activeSubTab === 'rotate' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-200">
              <span className="font-bold flex items-center gap-1.5">
                <span>↺</span>
                <span>Rotation Angle</span>
              </span>
              <span className="font-mono text-pink-400 font-bold">{adj.rotationAngle || 0}°</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRotate(-90)}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
              >
                ↺ -90°
              </button>
              <button
                type="button"
                onClick={() => handleRotate(90)}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
              >
                ↻ +90°
              </button>
              <button
                type="button"
                onClick={() => updatePhotoAdjustments({ rotationAngle: 0 })}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold"
              >
                Reset
              </button>
            </div>

            <input
              type="range"
              min={-180}
              max={180}
              value={adj.rotationAngle || 0}
              onChange={(e) => updatePhotoAdjustments({ rotationAngle: Number(e.target.value) })}
              className="w-full accent-[#FF2E93]"
            />
          </div>
        )}

        {/* SUBTAB 4: FLIP */}
        {activeSubTab === 'flip' && (
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-200 block">Orientation Flip</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updatePhotoAdjustments({ flipH: !adj.flipH })}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  adj.flipH
                    ? 'border-[#FF2E93] bg-[#FF2E93]/20 text-white shadow-md'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="text-base">↔️</span>
                <span>Flip Horizontal</span>
              </button>
              <button
                type="button"
                onClick={() => updatePhotoAdjustments({ flipV: !adj.flipV })}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  adj.flipV
                    ? 'border-[#FF2E93] bg-[#FF2E93]/20 text-white shadow-md'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="text-base">↕️</span>
                <span>Flip Vertical</span>
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB 5: SKEW / PERSPECTIVE */}
        {activeSubTab === 'skew' && (
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-200 block">Perspective Skew</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Skew X</span>
                  <span className="font-mono text-cyan-400">{adj.perspectiveSkewX || 0}°</span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  value={adj.perspectiveSkewX || 0}
                  onChange={(e) => updatePhotoAdjustments({ perspectiveSkewX: Number(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Skew Y</span>
                  <span className="font-mono text-cyan-400">{adj.perspectiveSkewY || 0}°</span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  value={adj.perspectiveSkewY || 0}
                  onChange={(e) => updatePhotoAdjustments({ perspectiveSkewY: Number(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Sub-Tool Navigation Strip */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-black/40 border border-white/10 overflow-x-auto no-scrollbar">
        {[
          { id: 'crop', label: 'Crop & Frame', icon: '✂️' },
          { id: 'zoom', label: 'Zoom & Pan', icon: '🔍' },
          { id: 'rotate', label: 'Rotate', icon: '↺' },
          { id: 'flip', label: 'Flip', icon: '↔️' },
          { id: 'skew', label: 'Perspective', icon: '📐' },
        ].map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setActiveSubTab(tool.id as ToolSubTab)}
            className={`flex-1 min-w-[75px] py-2 px-2 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              activeSubTab === tool.id
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-sm">{tool.icon}</span>
            <span className="truncate">{tool.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={handleResetTransforms}
          className="py-2 px-2.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-pink-300 flex flex-col items-center justify-center gap-1 shrink-0"
          title="Reset transforms"
        >
          <span className="text-sm">↺</span>
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
