import React from 'react';
import { PlanDraft } from './types';
import { SpotLayer, BlendMode } from '../../../types';
import { BLEND_MODES } from '../CreateSpotModal';

interface LayersStudioTabProps {
  currentDraft: PlanDraft;
  updateDraft: (updates: Partial<PlanDraft>) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  handleAddImageLayer: (imgUrl: string) => void;
  handleAddTextLayer: (initialText?: string) => void;
  handleAddShapeLayer: (shape: any) => void;
  handleUpdateLayer: (id: string, updates: Partial<SpotLayer>) => void;
  handleDeleteLayer: (id: string) => void;
  handleDuplicateLayer: (layer: SpotLayer) => void;
  handleReorderLayer: (id: string, direction: 'up' | 'down') => void;
  handleBringToFront: (id: string) => void;
  handleSendToBack: (id: string) => void;
  handleMergeLayers: () => void;
  onCustomStickerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const LayersStudioTab: React.FC<LayersStudioTabProps> = ({
  currentDraft,
  updateDraft,
  selectedItemId,
  setSelectedItemId,
  handleAddTextLayer,
  handleAddShapeLayer,
  handleUpdateLayer,
  handleDeleteLayer,
  handleDuplicateLayer,
  handleReorderLayer,
  handleBringToFront,
  handleSendToBack,
  handleMergeLayers,
  onCustomStickerUpload,
}) => {
  const layers = currentDraft.layers || [];
  const selectedLayer = layers.find((l) => l.id === selectedItemId);

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
      {/* 1. Add Elements Bar */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
        <label className="text-xs font-bold text-white block">
          Add Elements & Multi-Photo Layers
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="py-2 px-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors text-center">
            <span>+ 📸 Photo</span>
            <input type="file" accept="image/*" onChange={onCustomStickerUpload} className="hidden" />
          </label>
          <button
            type="button"
            onClick={() => handleAddTextLayer('New Text Layer')}
            className="py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
          >
            <span>+ ✍️ Text</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddShapeLayer('heart')}
            className="py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
          >
            <span>+ 💖 Shape</span>
          </button>
        </div>

        {/* Vector Shapes Quick Palette (10 Shapes) */}
        <div className="pt-2 border-t border-white/10">
          <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
            Insert Vector Shape Layer:
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'heart', label: 'Heart', icon: '💖' },
              { id: 'star', label: 'Star', icon: '⭐' },
              { id: 'circle', label: 'Circle', icon: '⭕' },
              { id: 'rectangle', label: 'Box', icon: '⬛' },
              { id: 'arrow', label: 'Arrow', icon: '➡️' },
              { id: 'speech_bubble', label: 'Bubble', icon: '💬' },
              { id: 'cloud', label: 'Cloud', icon: '☁️' },
              { id: 'diamond', label: 'Diamond', icon: '💎' },
              { id: 'flower', label: 'Flower', icon: '🌸' },
              { id: 'lightning', label: 'Bolt', icon: '⚡' },
            ].map((shp) => (
              <button
                key={shp.id}
                type="button"
                onClick={() => handleAddShapeLayer(shp.id as any)}
                className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-white text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <span>{shp.icon}</span>
                <span>{shp.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Layer Stack Manager */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Layer Stack</span>
            <span className="text-[10px] text-cyan-400 font-mono">
              ({layers.length} Layers)
            </span>
          </label>
          {layers.length > 1 && (
            <button
              type="button"
              onClick={handleMergeLayers}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
              title="Flatten all layers"
            >
              <span>🥞</span>
              <span>Merge Layers</span>
            </button>
          )}
        </div>

        {layers.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-white/15 text-center text-slate-400 space-y-1">
            <p className="text-xs">No extra layers added yet.</p>
            <p className="text-[11px] text-slate-500">
              Tap + Photo, + Text, or + Shape to add unlimited overlay elements!
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar p-0.5">
            {[...layers].reverse().map((layer) => {
              const isSelected = selectedItemId === layer.id;

              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedItemId(layer.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#00F0FF] bg-[#00F0FF]/15 text-white shadow-md'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">
                      {layer.type === 'image' ? '📸' : layer.type === 'text' ? '✍️' : '🔷'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{layer.name || layer.type}</p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {layer.blendMode || 'normal'} · {Math.round((layer.opacity ?? 1) * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleUpdateLayer(layer.id, { locked: !layer.locked })}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${
                        layer.locked ? 'text-amber-400 bg-amber-500/20' : 'text-slate-400 hover:text-white'
                      }`}
                      title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                    >
                      {layer.locked ? '🔒' : '🔓'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateLayer(layer.id, { visible: layer.visible === false ? true : false })}
                      className="w-6 h-6 rounded flex items-center justify-center text-xs text-slate-400 hover:text-white"
                      title={layer.visible === false ? 'Show Layer' : 'Hide Layer'}
                    >
                      {layer.visible === false ? '🕶️' : '👁️'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReorderLayer(layer.id, 'up')}
                      className="w-6 h-6 rounded flex items-center justify-center text-xs text-slate-400 hover:text-white"
                      title="Bring Forward"
                    >
                      ⬆️
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReorderLayer(layer.id, 'down')}
                      className="w-6 h-6 rounded flex items-center justify-center text-xs text-slate-400 hover:text-white"
                      title="Send Backward"
                    >
                      ⬇️
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBringToFront(layer.id)}
                      className="w-6 h-6 rounded flex items-center justify-center text-xs text-slate-400 hover:text-white"
                      title="Bring to Front"
                    >
                      🔝
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendToBack(layer.id)}
                      className="w-6 h-6 rounded flex items-center justify-center text-xs text-slate-400 hover:text-white"
                      title="Send to Back"
                    >
                      🔚
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateLayer(layer)}
                      className="w-6 h-6 rounded flex items-center justify-center text-xs text-slate-400 hover:text-white"
                      title="Duplicate Layer"
                    >
                      📋
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteLayer(layer.id)}
                      className="w-6 h-6 rounded flex items-center justify-center text-xs text-rose-400 hover:bg-rose-500/20"
                      title="Delete Layer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Selected Layer Fine-Tuning Controls */}
      {selectedLayer && (
        <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <span>⚙️</span>
              <span>Edit Layer: {selectedLayer.name || selectedLayer.type}</span>
            </label>
            <button
              type="button"
              onClick={() => setSelectedItemId(null)}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Done
            </button>
          </div>

          {/* Layer Opacity */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Layer Opacity</span>
              <span className="font-mono">{Math.round((selectedLayer.opacity ?? 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={selectedLayer.opacity ?? 1}
              onChange={(e) => handleUpdateLayer(selectedLayer.id, { opacity: Number(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Blend Mode */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Blend Mode
            </label>
            <select
              value={selectedLayer.blendMode || 'normal'}
              onChange={(e) => handleUpdateLayer(selectedLayer.id, { blendMode: e.target.value as BlendMode })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-white text-xs focus:outline-none"
            >
              {BLEND_MODES.map((bm) => (
                <option key={bm.id} value={bm.id} className="bg-slate-900 text-white">
                  {bm.label}
                </option>
              ))}
            </select>
          </div>

          {/* Shadow & Outline */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Drop Shadow</span>
                <span className="font-mono">{selectedLayer.shadowBlur || 0}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={25}
                value={selectedLayer.shadowBlur || 0}
                onChange={(e) =>
                  handleUpdateLayer(selectedLayer.id, {
                    shadowBlur: Number(e.target.value),
                    shadowColor: selectedLayer.shadowColor || 'rgba(0,0,0,0.8)',
                  })
                }
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Outline Width</span>
                <span className="font-mono">{selectedLayer.outlineWidth || 0}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={8}
                value={selectedLayer.outlineWidth || 0}
                onChange={(e) =>
                  handleUpdateLayer(selectedLayer.id, {
                    outlineWidth: Number(e.target.value),
                    outlineColor: selectedLayer.outlineColor || '#FF2E93',
                  })
                }
                className="w-full accent-pink-400"
              />
            </div>
          </div>

          {/* Photo Layer Clipping Mask Toggle */}
          {selectedLayer.type === 'image' && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">Circular Clipping Mask</span>
              <button
                type="button"
                onClick={() =>
                  handleUpdateLayer(selectedLayer.id, {
                    clippingMask: !selectedLayer.clippingMask,
                  })
                }
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  selectedLayer.clippingMask
                    ? 'bg-cyan-500 text-black'
                    : 'bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {selectedLayer.clippingMask ? 'Mask Active' : 'Off'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

