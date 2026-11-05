import React, { useRef } from 'react';
import { SpotShape, FrameStyle, StickerItem, SpotContent, SpotLayer } from '../../types';
import { getPhotoFilterStyle } from '../../utils/photoFilters';

export interface SpotCardProps {
  tier?: 'mini_pop' | 'big_pop';
  shape: SpotShape;
  background: string;
  borderColor?: string;
  content: SpotContent;
  creatorName: string;
  rotation?: number;
  width?: number;
  height?: number;
  scale?: number;
  // Interactive Editor Props
  interactive?: boolean;
  selectedItemId?: string | null;
  onSelectItem?: (id: string | null) => void;
  onUpdateSticker?: (id: string, updates: Partial<StickerItem>) => void;
  onDeleteSticker?: (id: string) => void;
  onUpdateLayer?: (id: string, updates: Partial<SpotLayer>) => void;
  onDeleteLayer?: (id: string) => void;
  onUpdateContent?: (updates: Partial<SpotContent>) => void;
  drawingCanvasOverlay?: React.ReactNode;
  className?: string;
}

export const SpotCard: React.FC<SpotCardProps> = ({
  tier = 'mini_pop',
  shape,
  background,
  borderColor,
  content,
  creatorName,
  rotation = 0,
  width,
  height,
  scale = 1,
  interactive = false,
  selectedItemId = null,
  onSelectItem,
  onUpdateSticker,
  onDeleteSticker,
  onUpdateLayer,
  onDeleteLayer,
  onUpdateContent,
  drawingCanvasOverlay,
  className = '',
}) => {
  // Canonical dimensions to ensure 100% WYSIWYG parity everywhere
  const cardWidth = width || (tier === 'big_pop' ? 260 : 180);
  const cardHeight = height || (tier === 'big_pop' ? 320 : 180);

  const containerRef = useRef<HTMLDivElement>(null);

  // =================== FREE STICKER DRAGGING & RESIZING ===================

  const handleStickerPointerDown = (e: React.PointerEvent, stk: StickerItem) => {
    if (!interactive) return;
    e.stopPropagation();
    onSelectItem?.(stk.id);

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = stk.x;
    const startY = stk.y;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = (moveEvt.clientX - startClientX) / scale;
      const dy = (moveEvt.clientY - startClientY) / scale;
      const newX = Math.round(Math.max(-25, Math.min(cardWidth - 25, startX + dx)));
      const newY = Math.round(Math.max(-25, Math.min(cardHeight - 25, startY + dy)));
      onUpdateSticker?.(stk.id, { x: newX, y: newY });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleStickerResizeDown = (e: React.PointerEvent, stk: StickerItem) => {
    if (!interactive) return;
    e.stopPropagation();
    const startY = e.clientY;
    const startSize = stk.size;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dy = (moveEvt.clientY - startY) / scale;
      const newSize = Math.max(14, Math.min(110, Math.round(startSize + dy)));
      onUpdateSticker?.(stk.id, { size: newSize });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleStickerRotateDown = (e: React.PointerEvent, stk: StickerItem) => {
    if (!interactive) return;
    e.stopPropagation();
    const startX = e.clientX;
    const startRot = stk.rotation;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = (moveEvt.clientX - startX) / scale;
      const newRot = Math.round((startRot + dx * 1.5) % 360);
      onUpdateSticker?.(stk.id, { rotation: newRot });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // =================== FREE MULTI-LAYER DRAGGING, RESIZING & ROTATING ===================

  const handleLayerPointerDown = (e: React.PointerEvent, layer: SpotLayer) => {
    if (!interactive || layer.locked) return;
    e.stopPropagation();
    onSelectItem?.(layer.id);

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = layer.x;
    const startY = layer.y;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = (moveEvt.clientX - startClientX) / scale;
      const dy = (moveEvt.clientY - startClientY) / scale;
      const newX = Math.round(startX + dx);
      const newY = Math.round(startY + dy);
      onUpdateLayer?.(layer.id, { x: newX, y: newY });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleLayerResizeDown = (e: React.PointerEvent, layer: SpotLayer) => {
    if (!interactive || layer.locked) return;
    e.stopPropagation();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startW = layer.width;
    const startH = layer.height;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = (moveEvt.clientX - startClientX) / scale;
      const dy = (moveEvt.clientY - startClientY) / scale;
      const newW = Math.max(20, Math.min(cardWidth * 1.5, Math.round(startW + dx)));
      const newH = Math.max(20, Math.min(cardHeight * 1.5, Math.round(startH + dy)));
      onUpdateLayer?.(layer.id, { width: newW, height: newH });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleLayerRotateDown = (e: React.PointerEvent, layer: SpotLayer) => {
    if (!interactive || layer.locked) return;
    e.stopPropagation();
    const startClientX = e.clientX;
    const startRot = layer.rotation || 0;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = (moveEvt.clientX - startClientX) / scale;
      const newRot = Math.round((startRot + dx * 1.5) % 360);
      onUpdateLayer?.(layer.id, { rotation: newRot });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Helper for rendering Shape layers
  const renderShapeLayerSvg = (layer: SpotLayer) => {
    const fill = layer.fillColor || '#FF2E93';
    const stroke = layer.borderColor || 'none';
    const strokeWidth = layer.borderWidth || 0;

    switch (layer.shapeType) {
      case 'circle':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <circle cx="12" cy="12" r="10" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'heart':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'star':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'arrow':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'speech_bubble':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'rectangle':
      default:
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <rect x="2" y="4" width="20" height="16" rx="3" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
    }
  };

  // =================== FREE TEXT DRAGGING & RESIZING (MAIN, SUB, CREATOR TAG) ===================

  // Headline drag handler
  const handleHeadlinePointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    onSelectItem?.('headline');

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const defaultX = 12;
    const defaultY = shape === 'polaroid' ? cardHeight - 55 : (cardHeight * 0.28);
    const startX = content.headlineX !== undefined ? content.headlineX : defaultX;
    const startY = content.headlineY !== undefined ? content.headlineY : defaultY;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = (moveEvt.clientX - startClientX) / scale;
      const dy = (moveEvt.clientY - startClientY) / scale;
      const newX = Math.round(Math.max(-20, Math.min(cardWidth - 40, startX + dx)));
      const newY = Math.round(Math.max(5, Math.min(cardHeight - 30, startY + dy)));
      onUpdateContent?.({ headlineX: newX, headlineY: newY });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Headline corner resize
  const handleHeadlineResizeDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    const startY = e.clientY;
    const currentSize = content.fontSize || 22;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dy = (moveEvt.clientY - startY) / scale;
      const newSize = Math.max(13, Math.min(52, Math.round(currentSize + dy * 0.4)));
      onUpdateContent?.({ fontSize: newSize });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Subtext drag handler
  const handleSubtextPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    onSelectItem?.('subtext');

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const defaultX = 12;
    const defaultY = shape === 'polaroid' ? cardHeight - 28 : (cardHeight * 0.58);
    const startX = content.subtextX !== undefined ? content.subtextX : defaultX;
    const startY = content.subtextY !== undefined ? content.subtextY : defaultY;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = (moveEvt.clientX - startClientX) / scale;
      const dy = (moveEvt.clientY - startClientY) / scale;
      const newX = Math.round(Math.max(-20, Math.min(cardWidth - 40, startX + dx)));
      const newY = Math.round(Math.max(5, Math.min(cardHeight - 20, startY + dy)));
      onUpdateContent?.({ subtextX: newX, subtextY: newY });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Subtext corner resize
  const handleSubtextResizeDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    const startY = e.clientY;
    const currentSize = content.subtextSize || 14;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dy = (moveEvt.clientY - startY) / scale;
      const newSize = Math.max(10, Math.min(32, Math.round(currentSize + dy * 0.3)));
      onUpdateContent?.({ subtextSize: newSize });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Creator Tag (Author) drag handler
  const handleAuthorPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    onSelectItem?.('author');

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const defaultX = 14;
    const defaultY = cardHeight - 24;
    const startX = content.authorX !== undefined ? content.authorX : defaultX;
    const startY = content.authorY !== undefined ? content.authorY : defaultY;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = (moveEvt.clientX - startClientX) / scale;
      const dy = (moveEvt.clientY - startClientY) / scale;
      const newX = Math.round(Math.max(5, Math.min(cardWidth - 30, startX + dx)));
      const newY = Math.round(Math.max(5, Math.min(cardHeight - 16, startY + dy)));
      onUpdateContent?.({ authorX: newX, authorY: newY });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Creator Tag corner resize
  const handleAuthorResizeDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    const startY = e.clientY;
    const currentSize = content.authorSize || 11;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dy = (moveEvt.clientY - startY) / scale;
      const newSize = Math.max(9, Math.min(24, Math.round(currentSize + dy * 0.25)));
      onUpdateContent?.({ authorSize: newSize });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // =================== FRAME ACCENTS RENDERING ===================

  const renderFrameAccents = (frameStyle: FrameStyle) => {
    switch (frameStyle) {
      case 'pin':
        return (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 shadow-md border-2 border-white flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-white/90" />
          </div>
        );
      case 'tape':
        return (
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 w-16 h-5 opacity-85 backdrop-blur-xs shadow-xs pointer-events-none"
            style={{
              backgroundColor: 'rgba(255, 248, 220, 0.8)',
              transform: 'translateX(-50%) rotate(-3deg)',
              borderLeft: '2px dashed rgba(0,0,0,0.12)',
              borderRight: '2px dashed rgba(0,0,0,0.12)',
            }}
          />
        );
      case 'washi':
        return (
          <>
            <div
              className="absolute -top-2.5 left-3 z-30 w-12 h-4 opacity-90 shadow-xs pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(45deg, #FFB800, #FFB800 6px, #FF2E93 6px, #FF2E93 12px)',
                transform: 'rotate(-8deg)',
              }}
            />
            <div
              className="absolute -bottom-2 right-3 z-30 w-12 h-4 opacity-90 shadow-xs pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(-45deg, #00F0FF, #00F0FF 6px, #7928CA 6px, #7928CA 12px)',
                transform: 'rotate(5deg)',
              }}
            />
          </>
        );
      case 'gold_crown':
        return (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center filter drop-shadow pointer-events-none">
            <span className="text-2xl animate-bounce-slow">👑</span>
          </div>
        );
      case 'duct_tape':
        return (
          <>
            <div className="absolute -top-2.5 -left-3 z-30 w-10 h-4 bg-slate-300 opacity-90 rotate-[-45deg] shadow-xs pointer-events-none" />
            <div className="absolute -top-2.5 -right-3 z-30 w-10 h-4 bg-slate-300 opacity-90 rotate-[45deg] shadow-xs pointer-events-none" />
          </>
        );
      case 'neon':
        return (
          <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF2E93] shadow-[0_0_20px_rgba(255,46,147,0.7)] pointer-events-none z-20" />
        );
      case 'film_strip':
        return (
          <div className="absolute inset-x-0 -top-2 h-3 z-30 flex justify-between px-2 pointer-events-none opacity-80">
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-xs bg-white/70" />
              <span className="w-2 h-2 rounded-xs bg-white/70" />
              <span className="w-2 h-2 rounded-xs bg-white/70" />
            </div>
          </div>
        );
      case 'stamp':
        return (
          <div className="absolute inset-0 border-4 border-dashed border-white/40 pointer-events-none z-20 rounded-xs" />
        );
      case 'comic':
        return (
          <div className="absolute inset-0 border-3 border-black pointer-events-none z-20 shadow-[4px_4px_0_0_#000]" />
        );
      default:
        return null;
    }
  };

  const textOpacity = content.textOpacity ?? 1;
  const photoOpacity = content.photoOpacity ?? 1;
  const drawingOpacity = content.drawingOpacity ?? 1;
  const photoZoom = content.photoZoom ?? 1;
  const photoOffsetX = content.photoOffsetX ?? 0;
  const photoOffsetY = content.photoOffsetY ?? 0;
  const subtextSize = content.subtextSize ?? 14;
  const authorSize = content.authorSize ?? 11;
  const authorOpacity = content.authorOpacity ?? textOpacity;

  const photoFilterObj = getPhotoFilterStyle(content.photoAdjustments);
  const photoFilterCss = photoFilterObj.filter !== 'none' ? photoFilterObj.filter : undefined;
  const photoFlipTransform = photoFilterObj.transform !== 'none' ? photoFilterObj.transform : '';

  // Active selection states
  const isHeadlineSelected = interactive && selectedItemId === 'headline';
  const isSubtextSelected = interactive && selectedItemId === 'subtext';
  const isAuthorSelected = interactive && selectedItemId === 'author';
  const isPhotoSelected = interactive && selectedItemId === 'photo';

  // Calculated Positions (custom coordinates if dragged, else elegant defaults)
  const isCustomHeadline = content.headlineX !== undefined && content.headlineY !== undefined;
  const isCustomSubtext = content.subtextX !== undefined && content.subtextY !== undefined;
  const isCustomAuthor = content.authorX !== undefined && content.authorY !== undefined;

  const isTransparent = shape === 'transparent' || background === 'transparent';

  // Card shape specific styling
  const getCardStyle = (): React.CSSProperties => {
    if (isTransparent) {
      return {
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
      };
    }

    const baseBg = background || (shape === 'polaroid' ? '#FFFFFF' : '#FEF08A');

    switch (shape) {
      case 'polaroid':
        return {
          background: baseBg,
          boxShadow: '0 16px 36px -4px rgba(0,0,0,0.4), 0 6px 12px -2px rgba(0,0,0,0.25)',
          borderRadius: '4px',
          border: borderColor ? `2px solid ${borderColor}` : undefined,
        };
      case 'frameless':
      case 'poster':
        return {
          background: baseBg,
          boxShadow: '0 20px 40px -8px rgba(0,0,0,0.5)',
          borderRadius: '18px',
          border: borderColor ? `2px solid ${borderColor}` : '1px solid rgba(255,255,255,0.15)',
        };
      case 'glass':
        return {
          background: baseBg !== '#FEF08A' ? baseBg : 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: borderColor ? `2px solid ${borderColor}` : '2px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 8px 32px 0 rgba(255, 46, 147, 0.35), inset 0 0 15px rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
        };
      case 'gold':
        return {
          background: baseBg,
          border: '8px solid #D4AF37',
          outline: '3px solid #8B6508',
          boxShadow: '0 18px 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(212, 175, 55, 0.25)',
          borderRadius: '8px',
        };
      case 'comic':
        return {
          background: baseBg,
          border: '4px solid #000000',
          boxShadow: '6px 6px 0px #000000',
          borderRadius: '12px',
        };
      case 'holographic':
        return {
          background: baseBg,
          border: '2px solid rgba(255, 255, 255, 0.85)',
          boxShadow: '0 0 25px rgba(0, 240, 255, 0.5), inset 0 0 20px rgba(255, 46, 147, 0.35)',
          borderRadius: '18px',
        };
      case 'ticket':
        return {
          background: baseBg,
          boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
          borderRadius: '10px',
          border: '2px dashed rgba(0,0,0,0.25)',
        };
      case 'stamp':
        return {
          background: baseBg,
          border: '6px dashed rgba(255, 255, 255, 0.6)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
          borderRadius: '6px',
        };
      case 'cyber':
        return {
          background: baseBg,
          border: '1.5px solid rgba(0, 240, 255, 0.5)',
          boxShadow: '0 0 25px rgba(0, 240, 255, 0.3), inset 0 0 15px rgba(0, 240, 255, 0.1)',
          borderRadius: '14px',
        };
      case 'sticky':
      default:
        return {
          background: baseBg,
          border: borderColor ? `2px solid ${borderColor}` : undefined,
          boxShadow: '0 12px 28px -4px rgba(0,0,0,0.3), 0 4px 10px -2px rgba(0,0,0,0.2)',
          borderRadius: '3px',
        };
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{
        width: cardWidth,
        height: cardHeight,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      }}
      onClick={(e) => {
        if (interactive && e.target === containerRef.current) {
          onSelectItem?.(null);
        }
      }}
    >
      {/* Frame Accents (top pins/tape) */}
      {!isTransparent && renderFrameAccents(content.frameStyle)}

      {/* ================= CARD BODY ================= */}
      <div
        className="w-full h-full relative overflow-hidden transition-all"
        style={getCardStyle()}
        onClick={(e) => {
          if (interactive && e.target === e.currentTarget) {
            onSelectItem?.(null);
          }
        }}
      >
        {/* HOLOGRAPHIC FOIL SHIMMER OVERLAY */}
        {shape === 'holographic' && !isTransparent && (
          <div
            className="absolute inset-0 pointer-events-none z-15 opacity-30 mix-blend-overlay"
            style={{
              background: 'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.8) 45%, rgba(0,240,255,0.6) 55%, transparent 75%)',
            }}
          />
        )}

        {/* TICKET NOTCHES & PERFORATION */}
        {shape === 'ticket' && !isTransparent && (
          <>
            <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0A0D14] pointer-events-none z-20 shadow-inner" />
            <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0A0D14] pointer-events-none z-20 shadow-inner" />
            <div className="absolute top-1/2 inset-x-3 -translate-y-1/2 border-t-2 border-dashed border-black/25 pointer-events-none z-15" />
          </>
        )}

        {/* CYBER HUD BRACKETS */}
        {shape === 'cyber' && !isTransparent && (
          <>
            <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#00F0FF] pointer-events-none z-20" />
            <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#00F0FF] pointer-events-none z-20" />
            <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#FF2E93] pointer-events-none z-20" />
            <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#FF2E93] pointer-events-none z-20" />
          </>
        )}

        {/* GOLD FRAME CORNER RIVETS */}
        {shape === 'gold' && !isTransparent && (
          <>
            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-[#FFF388] shadow-xs pointer-events-none z-20" />
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FFF388] shadow-xs pointer-events-none z-20" />
            <div className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-[#FFF388] shadow-xs pointer-events-none z-20" />
            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#FFF388] shadow-xs pointer-events-none z-20" />
          </>
        )}

        {/* ================= 1. TRANSPARENT CUTOUT PNG / ARTWORK (PNG ONLY MODE) ================= */}
        {isTransparent && content.imageUrl && (
          <div
            className={`absolute inset-0 flex items-center justify-center p-2 cursor-pointer ${
              isPhotoSelected ? 'ring-2 ring-[#FF2E93] z-25' : 'z-10'
            }`}
            onClick={(e) => {
              if (interactive) {
                e.stopPropagation();
                onSelectItem?.('photo');
              }
            }}
          >
            <img
              src={content.imageUrl}
              alt="Cutout Art"
              className="max-w-full max-h-full object-contain select-none pointer-events-none"
              style={{
                opacity: photoOpacity,
                filter: photoFilterCss ? `${photoFilterCss} drop-shadow(0 12px 24px rgba(0,0,0,0.6))` : 'drop-shadow(0 12px 24px rgba(0,0,0,0.6))',
                transform: `scale(${photoZoom}) translate(${photoOffsetX}px, ${photoOffsetY}px) ${photoFlipTransform}`,
              }}
              draggable={false}
            />
          </div>
        )}

        {/* ================= 2. FULL-BLEED FRAMELESS PHOTO (EDGE-TO-EDGE) ================= */}
        {(shape === 'frameless' || shape === 'poster') && content.imageUrl && !isTransparent && (
          <div
            className={`absolute inset-0 overflow-hidden cursor-pointer ${
              isPhotoSelected ? 'ring-2 ring-[#FF2E93] z-25' : 'z-10'
            }`}
            onClick={(e) => {
              if (interactive) {
                e.stopPropagation();
                onSelectItem?.('photo');
              }
            }}
          >
            <img
              src={content.imageUrl}
              alt="Full Bleed Artwork"
              className="w-full h-full object-cover select-none pointer-events-none"
              style={{
                opacity: photoOpacity,
                filter: photoFilterCss,
                transform: `scale(${photoZoom}) translate(${photoOffsetX}px, ${photoOffsetY}px) ${photoFlipTransform}`,
              }}
              draggable={false}
            />
            {/* Scrim gradient so text is readable over full bleed artwork */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
          </div>
        )}

        {/* ================= 3. POLAROID PHOTO CONTAINER ================= */}
        {shape === 'polaroid' && !isTransparent && (
          <div
            className={`absolute top-2.5 inset-x-2.5 h-[185px] bg-slate-900 rounded-xs overflow-hidden flex items-center justify-center cursor-pointer ${
              isPhotoSelected ? 'ring-2 ring-[#FF2E93] z-25' : 'z-10'
            }`}
            onClick={(e) => {
              if (interactive) {
                e.stopPropagation();
                onSelectItem?.('photo');
              }
            }}
          >
            {content.imageUrl ? (
              <img
                src={content.imageUrl}
                alt={content.headline || creatorName}
                className="w-full h-full object-cover select-none pointer-events-none transition-transform"
                style={{
                  opacity: photoOpacity,
                  filter: photoFilterCss,
                  transform: `scale(${photoZoom}) translate(${photoOffsetX}px, ${photoOffsetY}px) ${photoFlipTransform}`,
                }}
                draggable={false}
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
                style={{ background: 'linear-gradient(135deg, #1E1B4B, #3B0764)' }}
              >
                <span className="text-3xl filter drop-shadow">✨</span>
                <span className="text-[11px] text-white/80 font-bold mt-1 tracking-wide">Big Pop Photo</span>
              </div>
            )}
          </div>
        )}

        {/* ================= 4. FRAMED PHOTO CONTAINER FOR OTHER FRAMES (GLASS, GOLD, COMIC, STAMP, CYBER, STICKY) ================= */}
        {shape !== 'polaroid' && shape !== 'frameless' && shape !== 'poster' && !isTransparent && content.imageUrl && (
          <div
            className={`absolute top-2.5 inset-x-2.5 h-[140px] rounded-lg overflow-hidden bg-black/40 cursor-pointer ${
              isPhotoSelected ? 'ring-2 ring-[#FF2E93] z-25' : 'z-10'
            }`}
            onClick={(e) => {
              if (interactive) {
                e.stopPropagation();
                onSelectItem?.('photo');
              }
            }}
          >
            <img
              src={content.imageUrl}
              alt="Artwork"
              className="w-full h-full object-cover select-none pointer-events-none"
              style={{
                opacity: photoOpacity,
                filter: photoFilterCss,
                transform: `scale(${photoZoom}) translate(${photoOffsetX}px, ${photoOffsetY}px) ${photoFlipTransform}`,
              }}
              draggable={false}
            />
          </div>
        )}

        {/* ================= FREELY DRAGGABLE & SELECTABLE MAIN HEADLINE ================= */}
        {content.headline && (
          <div
            onPointerDown={handleHeadlinePointerDown}
            className={`touch-none select-none ${
              interactive ? 'cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-black/20' : 'pointer-events-none'
            } ${isCustomHeadline ? 'absolute' : 'absolute inset-x-3 text-center'} ${
              isHeadlineSelected ? 'ring-2 ring-dashed ring-[#FF2E93] z-30 p-1 rounded-md bg-white/10' : 'z-20'
            }`}
            style={{
              left: isCustomHeadline ? content.headlineX : undefined,
              top: isCustomHeadline
                ? content.headlineY
                : shape === 'polaroid'
                ? 200
                : shape === 'classic' && content.imageUrl
                ? 145
                : Math.round(cardHeight * 0.3),
              maxWidth: isCustomHeadline ? cardWidth - 30 : undefined,
            }}
          >
            {content.isCurvedText ? (
              <svg viewBox="0 0 220 70" className="w-full h-auto overflow-visible pointer-events-none select-none">
                <path id={`curve-${cardWidth}`} d="M 10,50 Q 110,10 210,50" fill="none" />
                <text
                  fill={content.textColor || (isTransparent ? '#FFFFFF' : shape === 'polaroid' ? '#0F172A' : '#1E293B')}
                  style={{
                    fontFamily: content.fontFamily || 'Caveat',
                    fontSize: content.fontSize || 22,
                    fontWeight: 'bold',
                    opacity: textOpacity,
                    letterSpacing: content.letterSpacing ? `${content.letterSpacing}px` : undefined,
                  }}
                >
                  <textPath href={`#curve-${cardWidth}`} startOffset="50%" textAnchor="middle">
                    {content.headline}
                  </textPath>
                </text>
              </svg>
            ) : (
              <h3
                className="font-bold leading-tight break-words select-none"
                style={{
                  fontFamily: content.fontFamily || 'Caveat',
                  fontSize: content.fontSize || 22,
                  color: content.textColor || (isTransparent ? '#FFFFFF' : shape === 'polaroid' ? '#0F172A' : '#1E293B'),
                  opacity: textOpacity,
                  textAlign: isCustomHeadline ? 'left' : content.alignment || 'center',
                  textShadow: isTransparent ? '0 2px 8px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)' : undefined,
                  letterSpacing: content.letterSpacing ? `${content.letterSpacing}px` : undefined,
                }}
              >
                {content.headline}
              </h3>
            )}

            {/* Selection Controls for Headline */}
            {isHeadlineSelected && (
              <>
                {/* Corner Resize Handle */}
                <div
                  onPointerDown={handleHeadlineResizeDown}
                  className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-[#FF2E93] border-2 border-white flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                  title="Drag to Resize Font Size"
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= FREELY DRAGGABLE & SELECTABLE SUBTEXT ================= */}
        {content.text && (
          <div
            onPointerDown={handleSubtextPointerDown}
            className={`touch-none select-none ${
              interactive ? 'cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-black/20' : 'pointer-events-none'
            } ${isCustomSubtext ? 'absolute' : 'absolute inset-x-3 text-center'} ${
              isSubtextSelected ? 'ring-2 ring-dashed ring-amber-400 z-30 p-1 rounded-md bg-white/10' : 'z-20'
            }`}
            style={{
              left: isCustomSubtext ? content.subtextX : undefined,
              top: isCustomSubtext
                ? content.subtextY
                : shape === 'polaroid'
                ? 232
                : shape === 'classic' && content.imageUrl
                ? 175
                : Math.round(cardHeight * 0.58),
              maxWidth: isCustomSubtext ? cardWidth - 30 : undefined,
            }}
          >
            <p
              className="leading-snug break-words select-none"
              style={{
                fontFamily: content.fontFamily || 'Caveat',
                fontSize: subtextSize,
                color: content.textColor || (isTransparent ? '#F1F5F9' : shape === 'polaroid' ? '#475569' : '#334155'),
                opacity: textOpacity * 0.9,
                textAlign: isCustomSubtext ? 'left' : content.alignment || 'center',
                textShadow: isTransparent ? '0 2px 6px rgba(0,0,0,0.85)' : undefined,
              }}
            >
              {content.text}
            </p>

            {/* Selection Controls for Subtext */}
            {isSubtextSelected && (
              <>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onUpdateContent?.({ text: '' });
                    onSelectItem?.(null);
                  }}
                  className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md hover:scale-110 transition-transform"
                  title="Delete Subtext"
                >
                  ✕
                </button>
                <div
                  onPointerDown={handleSubtextResizeDown}
                  className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                  title="Drag to Resize Subtext"
                >
                  <div className="w-1.5 h-1.5 bg-black rounded-full" />
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= FREELY DRAGGABLE & SELECTABLE CREATOR TAG ================= */}
        <div
          onPointerDown={handleAuthorPointerDown}
          className={`touch-none select-none ${
            interactive ? 'cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-black/20' : 'pointer-events-none'
            } ${isCustomAuthor ? 'absolute' : `absolute bottom-2 inset-x-3.5 flex items-center justify-between ${isTransparent ? 'border-none' : 'border-t border-black/10 pt-1'}`} ${
            isAuthorSelected ? 'ring-2 ring-dashed ring-cyan-400 z-30 p-1 rounded-md bg-white/10' : 'z-20'
          }`}
          style={{
            left: isCustomAuthor ? content.authorX : undefined,
            top: isCustomAuthor ? content.authorY : undefined,
          }}
        >
          <span
            className="truncate font-semibold select-none flex items-center gap-1"
            style={{
              color: content.textColor || (isTransparent ? '#F8FAFC' : shape === 'polaroid' ? '#0F172A' : '#1E293B'),
              fontSize: authorSize,
              opacity: authorOpacity,
              textShadow: isTransparent ? '0 2px 6px rgba(0,0,0,0.85)' : undefined,
            }}
          >
            <span>{content.author || creatorName}</span>
            <span>♡</span>
          </span>

          {/* Selection Controls for Creator Tag */}
          {isAuthorSelected && (
            <div
              onPointerDown={handleAuthorResizeDown}
              className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
              title="Drag to Resize Tag"
            >
              <div className="w-1 h-1 bg-black rounded-full" />
            </div>
          )}
        </div>

        {/* ================= MULTI-LAYER EDITING ENGINE (Unlimited Layers: Photo, Text, Shape, Sticker) ================= */}
        {content.layers?.map((layer) => {
          if (layer.visible === false) return null;
          const isSelected = interactive && selectedItemId === layer.id;
          const layerFilter = getPhotoFilterStyle(layer.photoAdjustments);

          return (
            <div
              key={layer.id}
              onPointerDown={(e) => handleLayerPointerDown(e, layer)}
              className={`absolute select-none touch-none ${
                interactive && !layer.locked ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
              } ${isSelected ? 'z-40' : 'z-20'}`}
              style={{
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                transform: `rotate(${layer.rotation || 0}deg)`,
                transformOrigin: 'center center',
                mixBlendMode: layer.blendMode || 'normal',
                opacity: layer.opacity ?? 1,
              }}
            >
              {/* Layer Content */}
              {layer.type === 'image' && layer.content && (
                <img
                  src={layer.content}
                  alt={layer.name || 'Layer Image'}
                  className="w-full h-full object-cover select-none pointer-events-none rounded-xs shadow-xs"
                  style={{
                    filter: layerFilter.filter !== 'none' ? layerFilter.filter : undefined,
                    transform: layerFilter.transform !== 'none' ? layerFilter.transform : undefined,
                  }}
                  draggable={false}
                />
              )}

              {layer.type === 'shape' && (
                <div className="w-full h-full pointer-events-none">
                  {renderShapeLayerSvg(layer)}
                </div>
              )}

              {layer.type === 'text' && (
                <div
                  className="w-full h-full flex items-center justify-center pointer-events-none font-bold"
                  style={{
                    fontFamily: layer.fontFamily || 'Caveat',
                    fontSize: layer.fontSize || 20,
                    color: layer.textColor || '#FFFFFF',
                    textShadow: layer.textGlow ? `0 0 12px ${layer.textGlow}` : '0 2px 8px rgba(0,0,0,0.7)',
                    WebkitTextStroke: layer.textStroke || undefined,
                    letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
                    textAlign: 'center',
                    lineHeight: 1.1,
                  }}
                >
                  {layer.content}
                </div>
              )}

              {/* SELECTION BOUNDING BOX & CONTROLS */}
              {isSelected && (
                <div className="absolute -inset-2 border-2 border-dashed border-[#00F0FF] rounded-md pointer-events-auto">
                  {!layer.locked && (
                    <>
                      {/* Delete Button (✕) on Top-Right Corner */}
                      <button
                        type="button"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          onDeleteLayer?.(layer.id);
                        }}
                        className="absolute -top-3.5 -right-3.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-lg hover:bg-rose-700 hover:scale-110 active:scale-95 transition-transform"
                        title="Delete Layer"
                      >
                        ✕
                      </button>

                      {/* Resize Corner Handle on Bottom-Right */}
                      <div
                        onPointerDown={(e) => handleLayerResizeDown(e, layer)}
                        className="absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#00F0FF] border-2 border-white flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                        title="Drag to Resize Layer"
                      >
                        <div className="w-1.5 h-1.5 bg-black rounded-full" />
                      </div>

                      {/* Rotate Handle on Top-Left */}
                      <div
                        onPointerDown={(e) => handleLayerRotateDown(e, layer)}
                        className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center cursor-ew-resize shadow-md hover:scale-125 transition-transform"
                        title="Drag to Rotate Layer"
                      >
                        <span className="text-[9px] font-bold text-black">↻</span>
                      </div>
                    </>
                  )}

                  {layer.locked && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-1.5 py-0.5 rounded text-[9px] font-bold shadow whitespace-nowrap">
                      🔒 Locked
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ================= DRAWING LAYER (Full Space Canvas Overlay) ================= */}
      {content.drawingData && (
        <img
          src={content.drawingData}
          alt="Spot Drawing"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-25 select-none"
          style={{ opacity: drawingOpacity }}
          draggable={false}
        />
      )}

      {/* ACTIVE DRAWING CANVAS OVERLAY IN STUDIO (BIG POP ONLY) */}
      {drawingCanvasOverlay && (
        <div className="absolute inset-0 w-full h-full z-30">{drawingCanvasOverlay}</div>
      )}

      {/* ================= FREELY DRAGGABLE & RESIZABLE STICKERS LAYER ================= */}
      {content.stickers?.map((stk) => {
        const isSelected = interactive && selectedItemId === stk.id;
        const stkOpacity = stk.opacity ?? 1;

        return (
          <div
            key={stk.id}
            onPointerDown={(e) => handleStickerPointerDown(e, stk)}
            className={`absolute select-none group touch-none ${
              interactive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
            } ${isSelected ? 'z-40' : 'z-25'}`}
            style={{
              left: stk.x,
              top: stk.y,
              transform: `rotate(${stk.rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {/* The Sticker Emoji/Icon */}
            <span
              className="block leading-none drop-shadow-md select-none transition-transform"
              style={{
                fontSize: stk.size,
                opacity: stkOpacity,
              }}
            >
              {stk.emojiOrIcon}
            </span>

            {/* SELECTION BOUNDING BOX & CONTROLS */}
            {isSelected && (
              <div className="absolute -inset-2 border-2 border-dashed border-[#FF2E93] rounded-md pointer-events-auto">
                {/* Delete Button (✕) on Top-Right Corner */}
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onDeleteSticker?.(stk.id);
                  }}
                  className="absolute -top-3.5 -right-3.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-lg hover:bg-rose-700 hover:scale-110 active:scale-95 transition-transform"
                  title="Delete Sticker"
                >
                  ✕
                </button>

                {/* Resize Corner Handle on Bottom-Right Corner */}
                <div
                  onPointerDown={(e) => handleStickerResizeDown(e, stk)}
                  className="absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#FF2E93] border-2 border-white flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                  title="Drag to Resize"
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>

                {/* Rotate Handle on Top-Left Corner */}
                <div
                  onPointerDown={(e) => handleStickerRotateDown(e, stk)}
                  className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center cursor-ew-resize shadow-md hover:scale-125 transition-transform"
                  title="Drag to Rotate"
                >
                  <span className="text-[9px] font-bold text-black">↻</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
