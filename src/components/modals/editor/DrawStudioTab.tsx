import React from 'react';
import { PlanDraft, BrushStyle } from './types';
import { BRUSH_STYLES } from '../CreateSpotModal';

interface DrawStudioTabProps {
  currentDraft: PlanDraft;
  updateDraft: (updates: Partial<PlanDraft>) => void;
  drawTool: BrushStyle;
  setDrawTool: (tool: BrushStyle) => void;
  drawColor: string;
  setDrawColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  brushOpacity: number;
  setBrushOpacity: (o: number) => void;
  handleUndoDrawing: () => void;
  handleClearDrawing: () => void;
  handleAddShapeLayer: (shape: any) => void;
}

export const DrawStudioTab: React.FC<DrawStudioTabProps> = ({
  currentDraft,
  updateDraft,
  drawTool,
  setDrawTool,
  drawColor,
  setDrawColor,
  brushSize,
  setBrushSize,
  brushOpacity,
  setBrushOpacity,
  handleUndoDrawing,
  handleClearDrawing,
  handleAddShapeLayer,
}) => {
  const COLOR_SWATCHES = [
    '#FF2E93', '#FFE600', '#00F0FF', '#76FF03', '#FFFFFF',
    '#9333EA', '#FF5722', '#000000', '#FF1493', '#00E5FF'
  ];

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
      {/* 1. Header with Undo & Clear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🖌️</span>
          <div>
            <label className="text-xs font-bold text-white block">
              Freehand Drawing & Neon Brushes
            </label>
            <span className="text-[10px] text-pink-400 font-bold">
              Direct live finger/mouse drawing on card preview
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndoDrawing}
            className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold transition-colors"
          >
            ↩ Undo
          </button>
          <button
            type="button"
            onClick={handleClearDrawing}
            className="px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-bold transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* 2. Brush Selection Grid (8 Brushes + Eraser) */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
        <label className="text-xs font-bold text-white block">
          Brush Types & Digital Inks
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BRUSH_STYLES.map((tool) => {
            const isSelected = drawTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setDrawTool(tool.id)}
                className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                  isSelected
                    ? 'border-[#FF2E93] bg-[#FF2E93]/20 text-white ring-1 ring-[#FF2E93] shadow-md scale-102'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                }`}
              >
                <span className="text-base">{tool.icon}</span>
                <span className="text-[11px] font-bold mt-1 truncate w-full">{tool.name}</span>
                <span className="text-[9px] text-slate-400 truncate w-full">{tool.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Brush Size & Opacity Controls */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
        <label className="text-xs font-bold text-slate-300 block">
          Stroke Size & Opacity
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Stroke Size</span>
              <span className="font-mono">{brushSize}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full accent-[#FF2E93]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Stroke Opacity</span>
              <span className="font-mono">{Math.round(brushOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={brushOpacity}
              onChange={(e) => setBrushOpacity(Number(e.target.value))}
              className="w-full accent-[#FF2E93]"
            />
          </div>
        </div>
      </div>

      {/* 4. Color Palette & Swatches */}
      {drawTool !== 'eraser' && (
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white">
              Ink Color & Swatches
            </label>
            <input
              type="color"
              value={drawColor}
              onChange={(e) => setDrawColor(e.target.value)}
              className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDrawColor(c)}
                className={`w-7 h-7 rounded-full shrink-0 border-2 transition-transform hover:scale-110 ${
                  drawColor === c
                    ? 'border-white scale-115 ring-2 ring-[#FF2E93]'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Vector Shapes Stamps */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
        <label className="text-xs font-bold text-slate-300 block">
          🔷 Or Stamp Vector Shape Layers
        </label>
        <div className="grid grid-cols-6 gap-1.5">
          {[
            { id: 'heart', label: 'Heart', icon: '❤️' },
            { id: 'star', label: 'Star', icon: '⭐' },
            { id: 'circle', label: 'Circle', icon: '⭕' },
            { id: 'rectangle', label: 'Box', icon: '⬛' },
            { id: 'arrow', label: 'Arrow', icon: '➡️' },
            { id: 'speech_bubble', label: 'Bubble', icon: '💬' },
          ].map((shp) => (
            <button
              key={shp.id}
              type="button"
              onClick={() => handleAddShapeLayer(shp.id)}
              className="py-1.5 px-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex flex-col items-center justify-center transition-all"
            >
              <span>{shp.icon}</span>
              <span className="text-[10px] mt-0.5 truncate w-full text-center">{shp.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

