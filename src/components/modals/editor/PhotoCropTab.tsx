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

type ToolSubTab = 'zoom' | 'rotate' | 'flip' | 'skew';

export const PhotoCropTab: React.FC<PhotoCropTabProps> = ({
  currentDraft,
  updateDraft,
  updatePhotoAdjustments,
  tier,
  onFileUpload,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ToolSubTab>('zoom');
  const adj = currentDraft.photoAdjustments || {};

  const DEFAULT_PHOTO_URL =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';

  const handleResetTransforms = () => {
    updateDraft({
      photoZoom: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
    });
    updatePhotoAdjustments({
      flipH: false,
      flipV: false,
      rotationAngle: 0,
      perspectiveSkewX: 0,
      perspectiveSkewY: 0,
    });
  };

  const handleRotate = (delta: number) => {
    const cur = adj.rotationAngle || 0;
    const next = (cur + delta) % 360;
    updatePhotoAdjustments({ rotationAngle: next });
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
      {/* 1. Photo Action Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">📸</span>
          <div>
            <span className="text-xs font-bold text-white block">Photo Artwork</span>
            <span className="text-[10px] text-slate-400">
              {currentDraft.imageUrl ? 'Custom photo loaded' : 'Default photo'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateDraft({ imageUrl: DEFAULT_PHOTO_URL, photoZoom: 1, photoOffsetX: 0, photoOffsetY: 0 })}
            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-colors"
          >
            Default
          </button>
          <label className="px-3.5 py-1.5 rounded-xl bg-[#FF2E93] hover:bg-[#E6007A] text-white text-xs font-bold cursor-pointer transition-colors shadow-md flex items-center gap-1.5">
            <span>{currentDraft.imageUrl ? 'Change Photo' : 'Upload Photo'}</span>
            <input type="file" accept="image/*" onChange={onFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* 2. Active Tool Stage (Picsart-Style Single Focused Control) */}
      <div className="p-4 rounded-xl bg-black/50 border border-white/10 min-h-[120px] flex flex-col justify-center">
        {activeSubTab === 'zoom' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-200">
              <span className="font-bold flex items-center gap-1.5">
                <span>🔍</span>
                <span>Zoom Scale</span>
              </span>
              <span className="font-mono text-[#FF2E93] font-bold">
                {Math.round((currentDraft.photoZoom ?? 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.5}
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
                  min={-90}
                  max={90}
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
                  min={-90}
                  max={90}
                  value={currentDraft.photoOffsetY ?? 0}
                  onChange={(e) => updateDraft({ photoOffsetY: Number(e.target.value) })}
                  className="w-full accent-pink-500"
                />
              </div>
            </div>
          </div>
        )}

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

      {/* 3. Sub-Tool Navigation Strip (Picsart-Style) */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-black/40 border border-white/10 overflow-x-auto no-scrollbar">
        {[
          { id: 'zoom', label: 'Zoom & Pan', icon: '🔍' },
          { id: 'rotate', label: 'Rotate', icon: '↺' },
          { id: 'flip', label: 'Flip', icon: '↔️' },
          { id: 'skew', label: 'Perspective', icon: '📐' },
        ].map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setActiveSubTab(tool.id as ToolSubTab)}
            className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
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
