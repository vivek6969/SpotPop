import React, { useRef, useState, useEffect } from 'react';
import { SpotShape, FrameStyle, StickerItem, SpotContent, SpotLayer } from '../../types';
import { getPhotoFilterStyle, getCleanFontFamily } from '../../utils/photoFilters';

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
  hideAudioBar?: boolean;
  isLocked?: boolean;
  selectedItemId?: string | null;
  onSelectItem?: (id: string | null) => void;
  onUpdateSticker?: (id: string, updates: Partial<StickerItem>) => void;
  onDeleteSticker?: (id: string) => void;
  onDuplicateSticker?: (stk: StickerItem) => void;
  onUpdateLayer?: (id: string, updates: Partial<SpotLayer>) => void;
  onDeleteLayer?: (id: string) => void;
  onUpdateContent?: (updates: Partial<SpotContent>) => void;
  drawingCanvasOverlay?: React.ReactNode;
  className?: string;
}

const triggerHaptic = (ms = 10) => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(ms); } catch (_) {}
  }
};

// Global reference ensuring only one card plays audio across the canvas
let activeCardAudioInstance: HTMLAudioElement | null = null;

const SpotCardComponent: React.FC<SpotCardProps> = ({
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
  hideAudioBar = false,
  isLocked = false,
  selectedItemId = null,
  onSelectItem,
  onUpdateSticker,
  onDeleteSticker,
  onDuplicateSticker,
  onUpdateLayer,
  onDeleteLayer,
  onUpdateContent,
  drawingCanvasOverlay,
  className = '',
}) => {
  // Canonical dimensions matching "Forever Dusk" standard (170x210 for Big Pop, 170x170 for Mini Pop)
  const isHero = shape === 'graffiti';
  const rawWidth = width || (tier === 'big_pop' ? 170 : 170);
  const rawHeight = height || (tier === 'big_pop' ? 210 : 170);
  // Cap standard cards at 170x210 so no regular card ever renders oversized
  const cardWidth = isHero ? rawWidth : Math.min(rawWidth, 170);
  const cardHeight = isHero ? rawHeight : Math.min(rawHeight, tier === 'big_pop' ? 210 : 170);

  const containerRef = useRef<HTMLDivElement>(null);

  // Audio Playback Engine on Card
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const totalAudioDuration = (
    audioPlayerRef.current &&
    !isNaN(audioPlayerRef.current.duration) &&
    isFinite(audioPlayerRef.current.duration) &&
    audioPlayerRef.current.duration > 0
  )
    ? audioPlayerRef.current.duration
    : (content.audio?.duration || 15);

  const effectiveProgress = audioProgress > 0
    ? audioProgress
    : (audioCurrentTime > 0 && totalAudioDuration > 0
        ? Math.min(100, Math.max(0, (audioCurrentTime / totalAudioDuration) * 100))
        : 0);

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        if (activeCardAudioInstance === audioPlayerRef.current) {
          activeCardAudioInstance = null;
        }
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const togglePlayAudio = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!content.audio?.url) {
      onSelectItem?.('audio');
      return;
    }
    if (isAudioPlaying && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsAudioPlaying(false);
      if (activeCardAudioInstance === audioPlayerRef.current) {
        activeCardAudioInstance = null;
      }
      triggerHaptic(10);
    } else {
      triggerHaptic(15);
      if (!audioPlayerRef.current || audioPlayerRef.current.src !== content.audio.url) {
        audioPlayerRef.current = new Audio(content.audio.url);
        audioPlayerRef.current.ontimeupdate = () => {
          if (audioPlayerRef.current) {
            const cur = audioPlayerRef.current.currentTime || 0;
            const rawDur = audioPlayerRef.current.duration;
            const dur = (rawDur && !isNaN(rawDur) && isFinite(rawDur) && rawDur > 0)
              ? rawDur
              : (content.audio?.duration || 15);
            const progress = dur > 0 ? Math.min(100, Math.max(0, (cur / dur) * 100)) : 0;
            setAudioCurrentTime(cur);
            setAudioProgress(progress);
          }
        };
        audioPlayerRef.current.onended = () => {
          setIsAudioPlaying(false);
          setAudioProgress(0);
          setAudioCurrentTime(0);
          if (activeCardAudioInstance === audioPlayerRef.current) {
            activeCardAudioInstance = null;
          }
        };
        audioPlayerRef.current.onerror = () => {
          setIsAudioPlaying(false);
          setAudioProgress(0);
          setAudioCurrentTime(0);
          if (activeCardAudioInstance === audioPlayerRef.current) {
            activeCardAudioInstance = null;
          }
        };
      }

      // Stop any other active audio playing in the app
      if (activeCardAudioInstance && activeCardAudioInstance !== audioPlayerRef.current) {
        activeCardAudioInstance.pause();
      }
      activeCardAudioInstance = audioPlayerRef.current;

      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current.play().then(() => {
        setIsAudioPlaying(true);
      }).catch((err) => {
        console.warn('Audio play notice:', err);
        setIsAudioPlaying(false);
      });
    }
  };

  // =================== MULTI-TOUCH STICKER GESTURES (DRAG, PINCH-RESIZE & ROTATE) ===================
  const lastStickerTapRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });
  const activeStickerPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const stickerGestureStartRef = useRef<{
    startDist: number;
    startAngle: number;
    startSize: number;
    startRot: number;
    startX: number;
    startY: number;
    startStkX: number;
    startStkY: number;
  }>({ startDist: 0, startAngle: 0, startSize: 28, startRot: 0, startX: 0, startY: 0, startStkX: 0, startStkY: 0 });

  const handleStickerPointerDown = (e: React.PointerEvent, stk: StickerItem) => {
    if (!interactive) return;
    e.stopPropagation();
    onSelectItem?.(stk.id);

    // Double-tap to duplicate sticker
    const now = Date.now();
    if (lastStickerTapRef.current.id === stk.id && now - lastStickerTapRef.current.time < 320) {
      lastStickerTapRef.current = { id: '', time: 0 };
      triggerHaptic(15);
      onDuplicateSticker?.(stk);
      return;
    }
    lastStickerTapRef.current = { id: stk.id, time: now };

    activeStickerPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const stkSize = stk.size || 28;
    const stkRot = stk.rotation || 0;
    const pointers = Array.from(activeStickerPointersRef.current.values());

    if (pointers.length === 1) {
      stickerGestureStartRef.current = {
        startDist: 0,
        startAngle: 0,
        startSize: stkSize,
        startRot: stkRot,
        startX: pointers[0].x,
        startY: pointers[0].y,
        startStkX: stk.x,
        startStkY: stk.y,
      };
    } else if (pointers.length >= 2) {
      const dist = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
      const angle = (Math.atan2(pointers[1].y - pointers[0].y, pointers[1].x - pointers[0].x) * 180) / Math.PI;
      stickerGestureStartRef.current = {
        startDist: Math.max(dist, 10),
        startAngle: angle,
        startSize: stkSize,
        startRot: stkRot,
        startX: (pointers[0].x + pointers[1].x) / 2,
        startY: (pointers[0].y + pointers[1].y) / 2,
        startStkX: stk.x,
        startStkY: stk.y,
      };
    }

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!activeStickerPointersRef.current.has(moveEvt.pointerId)) return;
      activeStickerPointersRef.current.set(moveEvt.pointerId, { x: moveEvt.clientX, y: moveEvt.clientY });

      const pts = Array.from(activeStickerPointersRef.current.values());
      if (pts.length === 1) {
        // 1-finger drag
        const dx = (pts[0].x - stickerGestureStartRef.current.startX) / scale;
        const dy = (pts[0].y - stickerGestureStartRef.current.startY) / scale;
        const currentSize = stk.size || 28;
        const maxPeek = Math.min(currentSize * 0.35, 12);
        const newX = Math.round(Math.max(-maxPeek, Math.min(cardWidth - currentSize + maxPeek, stickerGestureStartRef.current.startStkX + dx)));
        const newY = Math.round(Math.max(-maxPeek, Math.min(cardHeight - currentSize + maxPeek, stickerGestureStartRef.current.startStkY + dy)));
        onUpdateSticker?.(stk.id, { x: newX, y: newY });
      } else if (pts.length >= 2) {
        // 2-finger pinch resize & rotate
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const angle = (Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) * 180) / Math.PI;
        const ratio = dist / stickerGestureStartRef.current.startDist;
        const newSize = Math.max(14, Math.min(120, Math.round(stickerGestureStartRef.current.startSize * ratio)));
        const angleDiff = angle - stickerGestureStartRef.current.startAngle;
        const newRot = Math.round((stickerGestureStartRef.current.startRot + angleDiff) % 360);
        onUpdateSticker?.(stk.id, { size: newSize, rotation: newRot });
      }
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      activeStickerPointersRef.current.delete(upEvt.pointerId);
      if (activeStickerPointersRef.current.size === 0) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
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
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
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
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
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
      const maxPeekX = Math.min((layer.width || 40) * 0.3, 14);
      const maxPeekY = Math.min((layer.height || 40) * 0.3, 14);
      const newX = Math.round(Math.max(-maxPeekX, Math.min(cardWidth - (layer.width || 40) + maxPeekX, startX + dx)));
      const newY = Math.round(Math.max(-maxPeekY, Math.min(cardHeight - (layer.height || 40) + maxPeekY, startY + dy)));
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
      case 'cloud':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'lightning':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <polygon points="7 2 17 2 12 11 18 11 7 22 9 13 4 13 7 2" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'diamond':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <polygon points="12 2 22 9 12 22 2 9 12 2" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'flower':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6-4c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-8 0c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm2-2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
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

  // Headline drag & pinch resize handler
  const activeHeadlinePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const headlineGestureStartRef = useRef<{
    startDist: number;
    startSize: number;
    startX: number;
    startY: number;
    startHeadlineX: number;
    startHeadlineY: number;
  }>({ startDist: 0, startSize: 22, startX: 0, startY: 0, startHeadlineX: 12, startHeadlineY: 50 });

  const handleHeadlinePointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    onSelectItem?.('headline');

    activeHeadlinePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const defaultX = 12;
    const defaultY = shape === 'polaroid' ? cardHeight - 55 : cardHeight * 0.28;
    const currentX = content.headlineX !== undefined ? content.headlineX : defaultX;
    const currentY = content.headlineY !== undefined ? content.headlineY : defaultY;
    const currentSize = content.fontSize || 22;

    const pointers = Array.from(activeHeadlinePointersRef.current.values());
    if (pointers.length === 1) {
      headlineGestureStartRef.current = {
        startDist: 0,
        startSize: currentSize,
        startX: pointers[0].x,
        startY: pointers[0].y,
        startHeadlineX: currentX,
        startHeadlineY: currentY,
      };
    } else if (pointers.length >= 2) {
      const dist = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
      headlineGestureStartRef.current = {
        startDist: Math.max(dist, 10),
        startSize: currentSize,
        startX: (pointers[0].x + pointers[1].x) / 2,
        startY: (pointers[0].y + pointers[1].y) / 2,
        startHeadlineX: currentX,
        startHeadlineY: currentY,
      };
    }

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!activeHeadlinePointersRef.current.has(moveEvt.pointerId)) return;
      activeHeadlinePointersRef.current.set(moveEvt.pointerId, { x: moveEvt.clientX, y: moveEvt.clientY });

      const pts = Array.from(activeHeadlinePointersRef.current.values());
      if (pts.length === 1) {
        // 1-finger reposition
        const dx = (pts[0].x - headlineGestureStartRef.current.startX) / scale;
        const dy = (pts[0].y - headlineGestureStartRef.current.startY) / scale;
        const newX = Math.round(Math.max(-20, Math.min(cardWidth - 40, headlineGestureStartRef.current.startHeadlineX + dx)));
        const newY = Math.round(Math.max(5, Math.min(cardHeight - 30, headlineGestureStartRef.current.startHeadlineY + dy)));
        onUpdateContent?.({ headlineX: newX, headlineY: newY });
      } else if (pts.length >= 2) {
        // 2-finger pinch resize
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const ratio = dist / headlineGestureStartRef.current.startDist;
        const newSize = Math.max(12, Math.min(56, Math.round(headlineGestureStartRef.current.startSize * ratio)));
        onUpdateContent?.({ fontSize: newSize });
      }
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      activeHeadlinePointersRef.current.delete(upEvt.pointerId);
      if (activeHeadlinePointersRef.current.size === 0) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Headline corner resize
  const handleHeadlineResizeDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    const startY = e.clientY;
    const currentSize = content.fontSize || 22;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dy = (moveEvt.clientY - startY) / scale;
      const newSize = Math.max(13, Math.min(56, Math.round(currentSize + dy * 0.4)));
      onUpdateContent?.({ fontSize: newSize });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Subtext drag & pinch resize handler
  const activeSubtextPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const subtextGestureStartRef = useRef<{
    startDist: number;
    startSize: number;
    startX: number;
    startY: number;
    startSubtextX: number;
    startSubtextY: number;
  }>({ startDist: 0, startSize: 14, startX: 0, startY: 0, startSubtextX: 12, startSubtextY: 80 });

  const handleSubtextPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    onSelectItem?.('subtext');

    activeSubtextPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const defaultX = 12;
    const defaultY = shape === 'polaroid' ? cardHeight - 28 : cardHeight * 0.58;
    const currentX = content.subtextX !== undefined ? content.subtextX : defaultX;
    const currentY = content.subtextY !== undefined ? content.subtextY : defaultY;
    const currentSize = content.subtextSize || 14;

    const pointers = Array.from(activeSubtextPointersRef.current.values());
    if (pointers.length === 1) {
      subtextGestureStartRef.current = {
        startDist: 0,
        startSize: currentSize,
        startX: pointers[0].x,
        startY: pointers[0].y,
        startSubtextX: currentX,
        startSubtextY: currentY,
      };
    } else if (pointers.length >= 2) {
      const dist = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
      subtextGestureStartRef.current = {
        startDist: Math.max(dist, 10),
        startSize: currentSize,
        startX: (pointers[0].x + pointers[1].x) / 2,
        startY: (pointers[0].y + pointers[1].y) / 2,
        startSubtextX: currentX,
        startSubtextY: currentY,
      };
    }

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!activeSubtextPointersRef.current.has(moveEvt.pointerId)) return;
      activeSubtextPointersRef.current.set(moveEvt.pointerId, { x: moveEvt.clientX, y: moveEvt.clientY });

      const pts = Array.from(activeSubtextPointersRef.current.values());
      if (pts.length === 1) {
        // 1-finger reposition
        const dx = (pts[0].x - subtextGestureStartRef.current.startX) / scale;
        const dy = (pts[0].y - subtextGestureStartRef.current.startY) / scale;
        const newX = Math.round(Math.max(-20, Math.min(cardWidth - 40, subtextGestureStartRef.current.startSubtextX + dx)));
        const newY = Math.round(Math.max(5, Math.min(cardHeight - 20, subtextGestureStartRef.current.startSubtextY + dy)));
        onUpdateContent?.({ subtextX: newX, subtextY: newY });
      } else if (pts.length >= 2) {
        // 2-finger pinch resize
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const ratio = dist / subtextGestureStartRef.current.startDist;
        const newSize = Math.max(10, Math.min(36, Math.round(subtextGestureStartRef.current.startSize * ratio)));
        onUpdateContent?.({ subtextSize: newSize });
      }
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      activeSubtextPointersRef.current.delete(upEvt.pointerId);
      if (activeSubtextPointersRef.current.size === 0) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Subtext corner resize
  const handleSubtextResizeDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    const startY = e.clientY;
    const currentSize = content.subtextSize || 14;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dy = (moveEvt.clientY - startY) / scale;
      const newSize = Math.max(10, Math.min(36, Math.round(currentSize + dy * 0.3)));
      onUpdateContent?.({ subtextSize: newSize });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
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
    let isDragging = false;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dist = Math.hypot(moveEvt.clientX - startClientX, moveEvt.clientY - startClientY);
      if (dist > 3) isDragging = true;
      if (!isDragging) return;

      const dx = (moveEvt.clientX - startClientX) / scale;
      const dy = (moveEvt.clientY - startClientY) / scale;
      const newX = Math.round(Math.max(5, Math.min(cardWidth - 30, startX + dx)));
      const newY = Math.round(Math.max(5, Math.min(cardHeight - 16, startY + dy)));
      onUpdateContent?.({ authorX: newX, authorY: newY });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
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
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Multi-Touch Photo Gestures (1-finger pan, 2-finger pinch-zoom, double-tap reset)
  const lastPhotoTapRef = useRef<number>(0);
  const activePhotoPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const photoGestureStartRef = useRef<{
    startDist: number;
    startZoom: number;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  }>({ startDist: 0, startZoom: 1, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });

  const handlePhotoPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    onSelectItem?.('photo');

    // Double-tap detection -> Reset zoom & fit
    const now = Date.now();
    if (now - lastPhotoTapRef.current < 320) {
      lastPhotoTapRef.current = 0;
      triggerHaptic(15);
      onUpdateContent?.({ photoZoom: 1, photoOffsetX: 0, photoOffsetY: 0 });
      return;
    }
    lastPhotoTapRef.current = now;

    activePhotoPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const currentZoom = content.photoZoom ?? 1;
    const currentOffsetX = content.photoOffsetX ?? 0;
    const currentOffsetY = content.photoOffsetY ?? 0;

    const pointers = Array.from(activePhotoPointersRef.current.values());
    if (pointers.length === 1) {
      photoGestureStartRef.current = {
        startDist: 0,
        startZoom: currentZoom,
        startX: pointers[0].x,
        startY: pointers[0].y,
        startOffsetX: currentOffsetX,
        startOffsetY: currentOffsetY,
      };
    } else if (pointers.length >= 2) {
      const dist = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
      photoGestureStartRef.current = {
        startDist: Math.max(dist, 10),
        startZoom: currentZoom,
        startX: (pointers[0].x + pointers[1].x) / 2,
        startY: (pointers[0].y + pointers[1].y) / 2,
        startOffsetX: currentOffsetX,
        startOffsetY: currentOffsetY,
      };
    }

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!activePhotoPointersRef.current.has(moveEvt.pointerId)) return;
      activePhotoPointersRef.current.set(moveEvt.pointerId, { x: moveEvt.clientX, y: moveEvt.clientY });

      const pts = Array.from(activePhotoPointersRef.current.values());
      if (pts.length === 1) {
        // 1-finger pan
        const dx = (pts[0].x - photoGestureStartRef.current.startX) / scale;
        const dy = (pts[0].y - photoGestureStartRef.current.startY) / scale;
        const newX = Math.round(photoGestureStartRef.current.startOffsetX + dx);
        const newY = Math.round(photoGestureStartRef.current.startOffsetY + dy);
        onUpdateContent?.({ photoOffsetX: newX, photoOffsetY: newY });
      } else if (pts.length >= 2) {
        // 2-finger pinch zoom & pan
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const ratio = dist / photoGestureStartRef.current.startDist;
        const newZoom = Math.min(4.0, Math.max(0.4, Number((photoGestureStartRef.current.startZoom * ratio).toFixed(2))));

        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const dx = (midX - photoGestureStartRef.current.startX) / scale;
        const dy = (midY - photoGestureStartRef.current.startY) / scale;
        const newX = Math.round(photoGestureStartRef.current.startOffsetX + dx);
        const newY = Math.round(photoGestureStartRef.current.startOffsetY + dy);

        onUpdateContent?.({ photoZoom: newZoom, photoOffsetX: newX, photoOffsetY: newY });
      }
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      activePhotoPointersRef.current.delete(upEvt.pointerId);
      if (activePhotoPointersRef.current.size === 0) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Photo Wheel Zoom Handler (Desktop fallback)
  const handlePhotoWheel = (e: React.WheelEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    const currentZoom = content.photoZoom ?? 1;
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const newZoom = Math.min(4.0, Math.max(0.4, Number((currentZoom + delta).toFixed(2))));
    onUpdateContent?.({ photoZoom: newZoom });
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
      case 'binder_clip':
        return (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none filter drop-shadow-md">
            <div className="w-5 h-4 border-2 border-slate-300 rounded-t-sm bg-transparent" />
            <div className="w-8 h-3 bg-neutral-900 rounded-xs border border-neutral-700 shadow-sm" />
          </div>
        );
      case 'spring_blossom':
        return (
          <div className="absolute -top-3.5 inset-x-0 z-30 flex items-center justify-between px-2 pointer-events-none select-none">
            <span className="text-base animate-sway">🌸</span>
            <div className="flex items-center gap-1 opacity-90">
              <span className="text-xs">🌸</span>
              <span className="text-[10px] animate-pulse">✨</span>
              <span className="text-xs">🌸</span>
            </div>
            <span className="text-base animate-sway" style={{ animationDelay: '600ms' }}>🌸</span>
          </div>
        );
      case 'summer_sun':
        return (
          <div className="absolute -top-3.5 inset-x-0 z-30 flex items-center justify-between px-1.5 pointer-events-none select-none">
            <span className="text-base animate-sway">🌴</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 backdrop-blur-xs">
              <span className="text-xs animate-spin-slow">☀️</span>
              <span className="text-[9px] font-bold text-amber-200">Summer</span>
            </div>
            <span className="text-base animate-sway" style={{ animationDelay: '400ms' }}>🌺</span>
          </div>
        );
      case 'autumn_leaves':
        return (
          <div className="absolute -top-3 inset-x-0 z-30 flex items-center justify-between px-2 pointer-events-none select-none">
            <span className="text-base animate-sway">🍁</span>
            <div className="w-16 h-4 bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 opacity-80 rounded-xs shadow-xs rotate-[-2deg]" />
            <span className="text-base animate-sway" style={{ animationDelay: '500ms' }}>🍂</span>
          </div>
        );
      case 'winter_frost':
        return (
          <>
            <div className="absolute -top-3 inset-x-0 z-30 flex items-center justify-around pointer-events-none select-none">
              <span className="text-sm animate-twinkle">❄️</span>
              <span className="text-xs animate-twinkle" style={{ animationDelay: '400ms' }}>✨</span>
              <span className="text-sm animate-twinkle" style={{ animationDelay: '800ms' }}>❄️</span>
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-sky-300/40 shadow-[0_0_15px_rgba(186,230,253,0.4)] pointer-events-none z-20" />
          </>
        );
      case 'christmas_lights':
        return (
          <>
            <div className="absolute -top-3.5 inset-x-1 z-30 flex items-center justify-between pointer-events-none select-none">
              <span className="text-xs">🎄</span>
              <div className="flex-1 flex items-center justify-around px-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-twinkle" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-twinkle" style={{ animationDelay: '400ms' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-twinkle" style={{ animationDelay: '800ms' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-twinkle" style={{ animationDelay: '1200ms' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_#d946ef] animate-twinkle" style={{ animationDelay: '600ms' }} />
              </div>
              <span className="text-xs">🎄</span>
            </div>
          </>
        );
      case 'halloween_bat':
        return (
          <>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 pointer-events-none select-none filter drop-shadow">
              <span className="text-lg animate-sway">🦇</span>
              <span className="text-base animate-pulse">🎃</span>
            </div>
            <span className="absolute -top-1 -left-1 z-30 text-xs pointer-events-none opacity-80">🕸️</span>
            <span className="absolute -top-1 -right-1 z-30 text-xs pointer-events-none opacity-80">🕸️</span>
          </>
        );
      case 'diwali_diya':
        return (
          <div className="absolute -top-3.5 inset-x-0 z-30 flex items-center justify-between px-2 pointer-events-none select-none">
            <span className="text-xs">🌼</span>
            <div className="flex items-center gap-1 filter drop-shadow-md">
              <span className="text-lg animate-twinkle">🪔</span>
            </div>
            <span className="text-xs">🌼</span>
          </div>
        );
      case 'new_year_sparkle':
        return (
          <div className="absolute -top-3.5 inset-x-0 z-30 flex items-center justify-around pointer-events-none select-none">
            <span className="text-base animate-twinkle">🎆</span>
            <span className="text-xs animate-twinkle" style={{ animationDelay: '500ms' }}>✨</span>
            <span className="text-sm animate-twinkle" style={{ animationDelay: '300ms' }}>⭐</span>
            <span className="text-base animate-twinkle" style={{ animationDelay: '700ms' }}>🎉</span>
          </div>
        );
      case 'valentine_hearts':
        return (
          <div className="absolute -top-4 inset-x-0 z-30 flex items-center justify-center gap-1 pointer-events-none select-none">
            <span className="text-sm animate-heart-pulse">💕</span>
            <span className="text-xl animate-heart-pulse text-rose-500 filter drop-shadow" style={{ animationDelay: '200ms' }}>💖</span>
            <span className="text-sm animate-heart-pulse" style={{ animationDelay: '400ms' }}>💕</span>
          </div>
        );
      case 'birthday_bunting':
        return (
          <div className="absolute -top-3 inset-x-0 z-30 flex items-center justify-between px-1 pointer-events-none select-none">
            <span className="text-xs animate-sway">🎈</span>
            <div className="flex items-center gap-0.5">
              <span className="text-[11px]">🎪</span>
              <span className="text-[11px]">🚩</span>
              <span className="text-[11px]">🎪</span>
              <span className="text-[11px]">🚩</span>
            </div>
            <span className="text-xs animate-sway" style={{ animationDelay: '500ms' }}>🎈</span>
          </div>
        );
      case 'ramadan_crescent':
        return (
          <div className="absolute -top-4 inset-x-0 z-30 flex items-center justify-center gap-2 pointer-events-none select-none filter drop-shadow">
            <span className="text-xs animate-twinkle">⭐</span>
            <span className="text-xl animate-pulse text-amber-300">🌙</span>
            <span className="text-sm animate-sway">🏮</span>
          </div>
        );
      case 'holi_colors':
        return (
          <>
            <div className="absolute -top-2.5 -left-2.5 z-30 w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 blur-[2px] opacity-80 pointer-events-none" />
            <div className="absolute -top-2.5 -right-2.5 z-30 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-emerald-500 blur-[2px] opacity-80 pointer-events-none" />
            <div className="absolute -bottom-2 right-2 z-30 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 blur-[2px] opacity-75 pointer-events-none" />
          </>
        );
      case 'lucky_clover':
        return (
          <div className="absolute -top-3.5 inset-x-0 z-30 flex items-center justify-between px-2 pointer-events-none select-none">
            <span className="text-base animate-sway">🍀</span>
            <span className="text-xs animate-twinkle text-emerald-300">✨</span>
            <span className="text-base animate-sway" style={{ animationDelay: '400ms' }}>🍀</span>
          </div>
        );
      case 'cyber_pulse':
        return (
          <div className="absolute inset-0 rounded-2xl pointer-events-none z-20 overflow-hidden border-2 border-cyan-400/70 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-laser" />
            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-cyan-300" />
            <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-cyan-300" />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-cyan-300" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-300" />
          </div>
        );
      case 'rainbow_holo':
        return (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-20 border-[3px] border-transparent animate-holo"
            style={{
              backgroundImage: 'linear-gradient(#0000,#0000), linear-gradient(135deg, #FF0080, #7928CA, #0070F3, #00DFD8, #FF4D4D, #F5A623)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              filter: 'drop-shadow(0 0 10px rgba(255,0,128,0.4))',
            }}
          />
        );
      case 'cat_paws':
        return (
          <div className="absolute -top-3 inset-x-0 z-30 flex items-center justify-between px-6 pointer-events-none select-none animate-sway">
            <div className="flex flex-col items-center">
              <span className="text-sm">🐾</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm">🐾</span>
            </div>
          </div>
        );
      case 'golden_ribbon':
        return (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none select-none filter drop-shadow-md">
            <span className="text-2xl">🎗️</span>
          </div>
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
  const authorDisplay = content.author !== undefined ? content.author : creatorName;
  const hasAuthor = Boolean(authorDisplay && authorDisplay.trim());

  const photoFilterObj = getPhotoFilterStyle(content.photoAdjustments);
  const photoFilterCss = photoFilterObj.filter !== 'none' ? photoFilterObj.filter : undefined;
  const photoFlipTransform = photoFilterObj.transform !== 'none' ? photoFilterObj.transform : '';
  const shouldFilterCard = (tier === 'mini_pop' || !content.imageUrl) && Boolean(photoFilterCss);

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
  const imageFit = content.imageFit || 'cover';
  const isGif = Boolean(
    content.imageUrl && (
      content.imageUrl.toLowerCase().includes('.gif') ||
      content.imageUrl.startsWith('data:image/gif') ||
      content.imageUrl.includes('image/gif') ||
      content.imageUrl.includes('giphy.com') ||
      content.imageUrl.includes('tenor.com') ||
      content.imageUrl.includes('animated') ||
      content.imageUrl.includes('e6ac0747be70d9ca')
    )
  );
  const photoCropRatio = content.photoAdjustments?.aspectRatio || 'free';
  const isCircleCrop = photoCropRatio === 'circle';
  const isLightCard = !isTransparent && (
    shape === 'polaroid' ||
    shape === 'sticky' ||
    !background ||
    background === '#FFFFFF' ||
    background === '#FEF08A' ||
    background.startsWith('#fff') ||
    background.startsWith('#FE') ||
    background.startsWith('rgb(255')
  );

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
          e.stopPropagation();
          onSelectItem?.('background');
        }
      }}
    >
      {/* Frame Accents (top pins/tape) */}
      {!isTransparent && renderFrameAccents(content.frameStyle)}

      {/* Friends-Only Locked State Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-35 rounded-[inherit] bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center pointer-events-auto">
          <div className="w-9 h-9 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-lg mb-1 shadow-md">
            🔒
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow">Friends Only</span>
          <span className="text-[9px] text-white/70 mt-0.5">Follow @{creatorName} to unlock</span>
        </div>
      )}

      {/* Spot Visual Contents Wrapper (Applies filters on Mini Pop / spots without uploaded photo) */}
      <div
        className="w-full h-full relative"
        style={{
          filter: shouldFilterCard ? photoFilterCss : undefined,
        }}
        onClick={(e) => {
          if (interactive && e.target === e.currentTarget) {
            e.stopPropagation();
            onSelectItem?.('background');
          }
        }}
      >
        {/* ================= CARD BODY ================= */}
        <div
          className="w-full h-full relative overflow-hidden transition-all"
          style={getCardStyle()}
          onClick={(e) => {
            if (interactive && e.target === e.currentTarget) {
              e.stopPropagation();
              onSelectItem?.('background');
            }
          }}
        >
          {/* VIGNETTE FALLOFF OVERLAY */}
          {Boolean(content.photoAdjustments?.vignette && content.photoAdjustments.vignette > 0) && (
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background: `radial-gradient(circle at center, transparent 30%, rgba(0,0,0,${((content.photoAdjustments?.vignette || 0) / 100) * 0.75}) 100%)`,
              }}
            />
          )}
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
            className={`absolute inset-0 flex items-center justify-center p-2 ${
              interactive
                ? isPhotoSelected
                  ? 'ring-2 ring-[#FF2E93] cursor-grab active:cursor-grabbing z-25'
                  : 'cursor-pointer hover:ring-1 hover:ring-pink-400/50 z-10'
                : 'pointer-events-none z-10'
            }`}
            onPointerDown={handlePhotoPointerDown}
            onWheel={handlePhotoWheel}
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
              loading={isGif ? 'eager' : 'lazy'}
              decoding={isGif ? 'sync' : 'async'}
              className={`max-w-full max-h-full select-none pointer-events-none transition-transform duration-75 ${
                imageFit === 'contain' ? 'object-contain' : 'object-cover'
              }`}
              style={{
                opacity: photoOpacity,
                filter: photoFilterCss ? `${photoFilterCss} drop-shadow(0 12px 24px rgba(0,0,0,0.6))` : 'drop-shadow(0 12px 24px rgba(0,0,0,0.6))',
                transform: `scale(${photoZoom}) translate(${photoOffsetX}px, ${photoOffsetY}px) ${photoFlipTransform}`,
              }}
              draggable={false}
            />
            {interactive && isPhotoSelected && (
              <div className="absolute inset-2 pointer-events-none z-20 border border-dashed border-[#FF2E93]/70 rounded-lg flex items-end justify-center pb-1">
                <span className="text-[9px] bg-black/85 text-pink-300 px-1.5 py-0.5 rounded shadow-sm font-sans font-medium">
                  Drag to pan • Pinch to zoom
                </span>
              </div>
            )}
          </div>
        )}

        {/* ================= 2. FULL-BLEED FRAMELESS PHOTO (EDGE-TO-EDGE) ================= */}
        {(shape === 'frameless' || shape === 'poster' || photoCropRatio === 'full') && content.imageUrl && !isTransparent && (
          <div
            className={`absolute inset-0 overflow-hidden ${
              interactive
                ? isPhotoSelected
                  ? 'ring-2 ring-[#FF2E93] cursor-grab active:cursor-grabbing z-25'
                  : 'cursor-pointer hover:ring-1 hover:ring-pink-400/50 z-10'
                : 'pointer-events-none z-10'
            }`}
            onPointerDown={handlePhotoPointerDown}
            onWheel={handlePhotoWheel}
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
              loading={isGif ? 'eager' : 'lazy'}
              decoding={isGif ? 'sync' : 'async'}
              className={`w-full h-full select-none pointer-events-none transition-transform duration-75 ${
                imageFit === 'contain' ? 'object-contain' : 'object-cover'
              }`}
              style={{
                opacity: photoOpacity,
                filter: photoFilterCss,
                transform: `scale(${photoZoom}) translate(${photoOffsetX}px, ${photoOffsetY}px) ${photoFlipTransform}`,
              }}
              draggable={false}
            />
            {/* Scrim gradient so text is readable over full bleed artwork */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
            {interactive && isPhotoSelected && (
              <div className="absolute inset-0 pointer-events-none z-20 grid grid-cols-3 grid-rows-3 border-2 border-[#FF2E93]">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div />
                <div className="absolute bottom-2 inset-x-0 flex justify-center">
                  <span className="text-[9px] bg-black/85 text-pink-300 px-1.5 py-0.5 rounded border border-[#FF2E93]/40 shadow-sm font-sans font-medium">
                    Drag to crop • Pinch to zoom
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 3. POLAROID PHOTO CONTAINER ================= */}
        {shape === 'polaroid' && !isTransparent && photoCropRatio !== 'full' && (
          <div
            className={`absolute top-2.5 inset-x-2.5 bg-slate-900 overflow-hidden flex items-center justify-center ${
              isCircleCrop ? 'rounded-full' : 'rounded-xs'
            } ${
              interactive
                ? isPhotoSelected
                  ? 'ring-2 ring-[#FF2E93] cursor-grab active:cursor-grabbing z-25'
                  : 'cursor-pointer hover:ring-1 hover:ring-pink-400/50 z-10'
                : 'pointer-events-none z-10'
            }`}
            style={{
              height: isCircleCrop
                ? Math.min(cardWidth - 20, Math.round(cardHeight * 0.58))
                : photoCropRatio === '1:1'
                ? Math.min(cardWidth - 20, Math.round(cardHeight * 0.58))
                : photoCropRatio === '16:9'
                ? Math.round((cardWidth - 20) * 9 / 16)
                : Math.round(cardHeight * 0.58),
              width: isCircleCrop
                ? Math.min(cardWidth - 20, Math.round(cardHeight * 0.58))
                : undefined,
              margin: isCircleCrop ? '0 auto' : undefined,
            }}
            onPointerDown={handlePhotoPointerDown}
            onWheel={handlePhotoWheel}
            onClick={(e) => {
              if (interactive) {
                e.stopPropagation();
                if (!content.imageUrl && content.audio) {
                  onSelectItem?.('audio');
                } else {
                  onSelectItem?.('photo');
                }
              }
            }}
          >
            {content.imageUrl ? (
              <img
                src={content.imageUrl}
                alt={content.headline || creatorName}
                loading={isGif ? 'eager' : 'lazy'}
                decoding={isGif ? 'sync' : 'async'}
                className={`w-full h-full select-none pointer-events-none transition-transform duration-75 ${
                  imageFit === 'contain' ? 'object-contain' : 'object-cover'
                }`}
                style={{
                  opacity: photoOpacity,
                  filter: photoFilterCss,
                  transform: `scale(${photoZoom}) translate(${photoOffsetX}px, ${photoOffsetY}px) ${photoFlipTransform}`,
                }}
                draggable={false}
              />
            ) : content.audio ? (
              /* AUDIO POP ARTWORK: Soundstage visualizer with animated equalizer bars */
              <div
                className="w-full h-full flex flex-col items-center justify-center p-3 text-center relative overflow-hidden select-none"
                style={{
                  background: 'radial-gradient(circle at 50% 40%, #1e1b4b 0%, #090a15 100%)',
                }}
              >
                {/* Ambient glow ripples */}
                <div className="absolute w-28 h-28 rounded-full bg-pink-500/15 blur-xl animate-pulse" />
                <div className="absolute w-16 h-16 rounded-full bg-cyan-500/10 blur-lg animate-pulse" style={{ animationDelay: '500ms' }} />

                {/* Central Audio Play Icon */}
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="relative z-20 w-11 h-11 rounded-xl bg-gradient-to-tr from-[#FF2E93] to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title={isAudioPlaying ? 'Pause Audio' : 'Play Audio'}
                >
                  {isAudioPlaying ? (
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" rx="1.5" />
                      <rect x="14" y="4" width="4" height="16" rx="1.5" />
                    </svg>
                  ) : (
                    <span className="text-xl leading-none">{content.audio.type === 'voice' ? '🎙️' : '🎵'}</span>
                  )}
                </button>

                {/* Animated Waveform Equalizer Bars */}
                <div className="relative z-10 flex items-center justify-center gap-1 h-5 mt-2.5">
                  {[35, 75, 100, 60, 90, 45, 80, 50, 95, 40].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full bg-gradient-to-t from-[#FF2E93] to-cyan-400 transition-all ${
                        isAudioPlaying ? 'animate-pulse' : 'opacity-60'
                      }`}
                      style={{
                        height: isAudioPlaying ? `${h}%` : `${Math.max(20, h * 0.45)}%`,
                        animationDuration: `${0.6 + (i % 3) * 0.25}s`,
                        animationDelay: `${i * 80}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
                style={{ background: 'linear-gradient(135deg, #1E1B4B, #3B0764)' }}
              >
                <span className="text-2xl filter drop-shadow">✨</span>
                <span className="text-[10px] text-white/80 font-bold mt-1 tracking-wide">No Photo Attached</span>
                <span className="text-[8px] text-pink-300/80 mt-0.5">Audio & Text Pop</span>
              </div>
            )}
            {interactive && isPhotoSelected && (
              <div className={`absolute inset-0 pointer-events-none z-20 border-2 border-[#FF2E93] ${isCircleCrop ? 'rounded-full' : 'rounded-xs'}`}>
                {!isCircleCrop && (
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div />
                  </div>
                )}
                <div className="absolute bottom-1 inset-x-0 flex justify-center">
                  <span className="text-[9px] bg-black/85 text-pink-300 px-1.5 py-0.5 rounded border border-[#FF2E93]/40 shadow-sm font-sans font-medium">
                    Drag to crop • Pinch to zoom
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 4. FRAMED PHOTO CONTAINER FOR OTHER FRAMES (GLASS, GOLD, COMIC, STAMP, CYBER, STICKY) ================= */}
        {shape !== 'polaroid' && shape !== 'frameless' && shape !== 'poster' && photoCropRatio !== 'full' && !isTransparent && content.imageUrl && (
          <div
            className={`absolute top-2.5 inset-x-2.5 bg-black/40 overflow-hidden ${
              isCircleCrop ? 'rounded-full' : 'rounded-lg'
            } ${
              interactive
                ? isPhotoSelected
                  ? 'ring-2 ring-[#FF2E93] cursor-grab active:cursor-grabbing z-25'
                  : 'cursor-pointer hover:ring-1 hover:ring-pink-400/50 z-10'
                : 'pointer-events-none z-10'
            }`}
            style={{
              height: isCircleCrop
                ? Math.min(cardWidth - 20, Math.round(cardHeight * 0.50))
                : photoCropRatio === '1:1'
                ? Math.min(cardWidth - 20, Math.round(cardHeight * 0.50))
                : photoCropRatio === '16:9'
                ? Math.round((cardWidth - 20) * 9 / 16)
                : Math.round(cardHeight * 0.50),
              width: isCircleCrop
                ? Math.min(cardWidth - 20, Math.round(cardHeight * 0.50))
                : undefined,
              margin: isCircleCrop ? '0 auto' : undefined,
            }}
            onPointerDown={handlePhotoPointerDown}
            onWheel={handlePhotoWheel}
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
              loading={isGif ? 'eager' : 'lazy'}
              decoding={isGif ? 'sync' : 'async'}
              className={`w-full h-full select-none pointer-events-none transition-transform duration-75 ${
                imageFit === 'contain' ? 'object-contain' : 'object-cover'
              }`}
              style={{
                opacity: photoOpacity,
                filter: photoFilterCss,
                transform: `scale(${photoZoom}) translate(${photoOffsetX}px, ${photoOffsetY}px) ${photoFlipTransform}`,
              }}
              draggable={false}
            />
            {interactive && isPhotoSelected && (
              <div className={`absolute inset-0 pointer-events-none z-20 border-2 border-[#FF2E93] ${isCircleCrop ? 'rounded-full' : 'rounded-lg'}`}>
                {!isCircleCrop && (
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div />
                  </div>
                )}
                <div className="absolute bottom-1 inset-x-0 flex justify-center pointer-events-none">
                  <span className="text-[9px] bg-black/90 text-pink-300 px-2 py-0.5 rounded-full border border-[#FF2E93]/40 shadow-sm font-sans font-semibold tracking-wide">
                    Drag to pan • Pinch to zoom • Double-tap reset
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= FREELY DRAGGABLE & SELECTABLE MAIN HEADLINE ================= */}
        {content.headline && (
          <div
            onPointerDown={handleHeadlinePointerDown}
            onClick={(e) => {
              if (interactive) {
                e.stopPropagation();
                onSelectItem?.('headline');
              }
            }}
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
                ? (content.audio
                    ? (content.text ? Math.round(cardHeight * 0.57) : Math.round(cardHeight * 0.63))
                    : (content.text ? Math.round(cardHeight * 0.59) : Math.round(cardHeight * 0.65)))
                : shape === 'classic' && content.imageUrl
                ? (content.text ? Math.round(cardHeight * 0.52) : Math.round(cardHeight * 0.58))
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
                    fontFamily: getCleanFontFamily(content.fontFamily),
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
                  fontFamily: getCleanFontFamily(content.fontFamily),
                  fontSize: content.fontSize || 22,
                  color: content.textGradient ? undefined : (content.textColor || (isTransparent ? '#FFFFFF' : shape === 'polaroid' ? '#0F172A' : '#1E293B')),
                  background: content.textGradient || undefined,
                  WebkitBackgroundClip: content.textGradient ? 'text' : undefined,
                  WebkitTextFillColor: content.textGradient ? 'transparent' : undefined,
                  opacity: textOpacity,
                  textAlign: isCustomHeadline ? 'left' : content.alignment || 'center',
                  textShadow: content.text3D
                    ? '0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa, 0 6px 1px rgba(0,0,0,.15), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3)'
                    : content.textGlow
                    ? `0 0 14px ${content.textGlow}`
                    : isTransparent ? '0 2px 8px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)' : undefined,
                  WebkitTextStroke: content.textStroke || undefined,
                  letterSpacing: content.letterSpacing ? `${content.letterSpacing}px` : undefined,
                  lineHeight: content.lineHeight || 1.15,
                  backgroundColor: content.badgeColor || undefined,
                  padding: content.badgeColor ? '4px 10px' : undefined,
                  borderRadius: content.badgeColor ? '8px' : undefined,
                }}
              >
                {content.headline}
              </h3>
            )}

            {/* Selection Controls for Headline with 44px Touch Targets */}
            {isHeadlineSelected && (
              <>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    triggerHaptic(10);
                    onUpdateContent?.({ headline: '' });
                    onSelectItem?.(null);
                  }}
                  className="absolute -top-5 -right-5 w-11 h-11 flex items-center justify-center cursor-pointer z-50"
                  title="Delete Headline"
                >
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md hover:scale-110 active:scale-95 transition-transform">
                    ✕
                  </span>
                </button>
                {/* Corner Resize Handle */}
                <div
                  onPointerDown={handleHeadlineResizeDown}
                  className="absolute -bottom-5 -right-5 w-11 h-11 flex items-center justify-center cursor-nwse-resize z-50"
                  title="Drag to Resize Font Size"
                >
                  <div className="w-5 h-5 rounded-full bg-[#FF2E93] border-2 border-white flex items-center justify-center shadow-md hover:scale-125 transition-transform">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= FREELY DRAGGABLE & SELECTABLE SUBTEXT ================= */}
        {content.text && (
          <div
            onPointerDown={handleSubtextPointerDown}
            onClick={(e) => {
              if (interactive) {
                e.stopPropagation();
                onSelectItem?.('subtext');
              }
            }}
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
                ? (content.audio
                    ? (content.headline ? Math.round(cardHeight * 0.67) : Math.round(cardHeight * 0.60))
                    : (content.headline ? Math.round(cardHeight * 0.72) : Math.round(cardHeight * 0.64)))
                : shape === 'classic' && content.imageUrl
                ? (content.headline ? Math.round(cardHeight * 0.70) : Math.round(cardHeight * 0.62))
                : Math.round(cardHeight * 0.58),
              maxWidth: isCustomSubtext ? cardWidth - 30 : undefined,
            }}
          >
            <p
              className="leading-snug break-words select-none"
              style={{
                fontFamily: getCleanFontFamily(content.fontFamily),
                fontSize: subtextSize,
                color: content.textColor || (isTransparent ? '#F1F5F9' : shape === 'polaroid' ? '#475569' : '#334155'),
                opacity: textOpacity * 0.9,
                textAlign: isCustomSubtext ? 'left' : content.alignment || 'center',
                textShadow: isTransparent ? '0 2px 6px rgba(0,0,0,0.85)' : undefined,
              }}
            >
              {content.text}
            </p>

            {/* Selection Controls for Subtext with 44px Touch Targets */}
            {isSubtextSelected && (
              <>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    triggerHaptic(10);
                    onUpdateContent?.({ text: '' });
                    onSelectItem?.(null);
                  }}
                  className="absolute -top-5 -right-5 w-11 h-11 flex items-center justify-center cursor-pointer z-50"
                  title="Delete Subtext"
                >
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md hover:scale-110 active:scale-95 transition-transform">
                    ✕
                  </span>
                </button>
                <div
                  onPointerDown={handleSubtextResizeDown}
                  className="absolute -bottom-5 -right-5 w-11 h-11 flex items-center justify-center cursor-nwse-resize z-50"
                  title="Drag to Resize Subtext"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-md hover:scale-125 transition-transform">
                    <div className="w-1.5 h-1.5 bg-black rounded-full" />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= FREELY DRAGGABLE & SELECTABLE CREATOR TAG ================= */}
        {hasAuthor && (
          <div
            onPointerDown={handleAuthorPointerDown}
            onClick={(e) => {
              if (interactive) {
                e.stopPropagation();
                onSelectItem?.('author');
              }
            }}
            className={`touch-none select-none ${
              interactive ? 'cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-black/20' : 'pointer-events-none'
              } ${isCustomAuthor ? 'absolute' : `absolute ${content.audio ? 'bottom-8.5' : 'bottom-2'} inset-x-3.5 flex items-center justify-between ${isTransparent || content.audio ? 'border-none pt-0' : 'border-t border-black/10 pt-1'}`} ${
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
              <span>{authorDisplay}</span>
              <span>♡</span>
            </span>

            {/* Selection Controls for Creator Tag */}
            {isAuthorSelected && (
              <>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onUpdateContent?.({ author: '' });
                    onSelectItem?.(null);
                  }}
                  className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md hover:scale-110 transition-transform cursor-pointer z-40"
                  title="Delete Author Tag"
                >
                  ✕
                </button>
                <div
                  onPointerDown={handleAuthorResizeDown}
                  className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                  title="Drag to Resize Tag"
                >
                  <div className="w-1 h-1 bg-black rounded-full" />
                </div>
              </>
            )}
          </div>
        )}

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
                boxShadow: layer.shadowColor && layer.shadowBlur ? `${layer.shadowOffsetX || 0}px ${layer.shadowOffsetY || 0}px ${layer.shadowBlur}px ${layer.shadowColor}` : undefined,
                outline: layer.outlineColor && layer.outlineWidth ? `${layer.outlineWidth}px solid ${layer.outlineColor}` : undefined,
              }}
            >
              {/* Layer Content */}
              {layer.type === 'image' && layer.content && (
                <img
                  src={layer.content}
                  alt={layer.name || 'Layer Image'}
                  loading="lazy"
                  decoding="async"
                  className={`w-full h-full object-cover select-none pointer-events-none rounded-xs shadow-xs ${
                    layer.clippingMask ? 'rounded-full' : ''
                  }`}
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
                  className="w-full h-full flex items-center justify-center pointer-events-none font-bold select-none text-center"
                  style={{
                    fontFamily: getCleanFontFamily(layer.fontFamily),
                    fontSize: layer.fontSize || 20,
                    color: layer.textGradient ? undefined : (layer.textColor || '#FFFFFF'),
                    background: layer.textGradient || undefined,
                    WebkitBackgroundClip: layer.textGradient ? 'text' : undefined,
                    WebkitTextFillColor: layer.textGradient ? 'transparent' : undefined,
                    textShadow: layer.text3D
                      ? '0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #aaa, 0 5px 2px rgba(0,0,0,.3)'
                      : layer.textGlow ? `0 0 12px ${layer.textGlow}` : '0 2px 8px rgba(0,0,0,0.7)',
                    WebkitTextStroke: layer.textStroke || undefined,
                    letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
                    lineHeight: layer.lineHeight || 1.1,
                    backgroundColor: layer.bgBadgeColor || undefined,
                    padding: layer.bgBadgeColor ? '2px 8px' : undefined,
                    borderRadius: layer.bgBadgeColor ? '6px' : undefined,
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

        {/* ================= SLIM THEME-MATCHED BOTTOM AUDIO PLAYER ================= */}
        {content.audio && !hideAudioBar && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              togglePlayAudio(e);
            }}
            className={`absolute bottom-0 inset-x-0 z-35 h-7.5 px-3 flex items-center justify-between gap-2 cursor-pointer transition-colors select-none rounded-b-[inherit] ${
              isTransparent
                ? 'bg-black/60 backdrop-blur-md border-t border-white/20 text-white'
                : isLightCard
                ? 'bg-slate-50/95 hover:bg-slate-100/95 border-t border-slate-200 text-slate-800'
                : 'bg-black/40 hover:bg-black/50 backdrop-blur-xs border-t border-white/15 text-white'
            }`}
            title={isAudioPlaying ? 'Pause Audio' : 'Play Audio'}
            role="button"
            aria-label={isAudioPlaying ? 'Pause Audio' : 'Play Audio'}
          >
            {/* Circular Spotify Green Play / Pause Button */}
            <div
              className={`w-5 h-5 shrink-0 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-xs transition-transform ${
                isAudioPlaying ? 'ring-2 ring-[#1DB954]/50 scale-105' : 'hover:scale-105 active:scale-90'
              }`}
            >
              {isAudioPlaying ? (
                <svg className="w-2.5 h-2.5 fill-black" viewBox="0 0 24 24">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg className="w-2.5 h-2.5 fill-black translate-x-0.5" viewBox="0 0 24 24">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              )}
            </div>

            {/* Real-time Progress Bar & Mini Equalizer Wave */}
            <div className="flex-1 flex items-center gap-1.5 h-full">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (!audioPlayerRef.current || !content.audio) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const seekPct = Math.max(0, Math.min(1, clickX / rect.width));
                  const newTime = seekPct * totalAudioDuration;
                  audioPlayerRef.current.currentTime = newTime;
                  setAudioCurrentTime(newTime);
                  setAudioProgress(seekPct * 100);
                }}
                className={`flex-1 h-1.5 rounded-full overflow-hidden relative cursor-pointer ${
                  isLightCard ? 'bg-slate-200' : 'bg-white/20'
                }`}
                title="Tap to scrub audio"
              >
                <div
                  className="h-full bg-[#1DB954] transition-[width] duration-100 ease-linear rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, effectiveProgress))}%` }}
                />
              </div>
              {isAudioPlaying && (
                <div className="flex items-center gap-0.5 h-2.5 shrink-0">
                  <span className="w-0.5 h-2 bg-[#1DB954] rounded-full animate-pulse" />
                  <span className="w-0.5 h-3 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-0.5 h-1.5 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>

            {/* Duration / Timer Label: "15 sec" in crisp modern typography */}
            <span
              className={`text-[10px] font-sans font-bold tracking-tight shrink-0 select-none ${
                isLightCard ? 'text-slate-500' : 'text-slate-300'
              }`}
            >
              {isAudioPlaying && audioCurrentTime > 0
                ? `${Math.floor(audioCurrentTime)}s`
                : `${Math.round(content.audio.duration || 15)} sec`}
            </span>
          </div>
        )}
      </div>

      {/* ================= DRAWING LAYER (Full Space Canvas Overlay) ================= */}
      {content.drawingData && (
        <img
          src={content.drawingData}
          alt="Spot Drawing"
          loading="lazy"
          decoding="async"
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
        const stkSize = stk.size || 28;
        const maxPeek = Math.min(stkSize * 0.35, 12);
        // Ensure element always stays anchored and touching the frame
        const clampedX = Math.round(Math.max(-maxPeek, Math.min(cardWidth - stkSize + maxPeek, stk.x)));
        const clampedY = Math.round(Math.max(-maxPeek, Math.min(cardHeight - stkSize + maxPeek, stk.y)));

        return (
          <div
            key={stk.id}
            onPointerDown={(e) => handleStickerPointerDown(e, stk)}
            onClick={(e) => {
              if (interactive) {
                e.stopPropagation();
                onSelectItem?.(stk.id);
              }
            }}
            className={`absolute select-none group touch-none ${
              interactive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
            } ${isSelected ? 'z-40' : 'z-25'}`}
            style={{
              left: clampedX,
              top: clampedY,
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
                {/* Delete Button (✕) on Top-Left Corner with 44px Touch Target */}
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    triggerHaptic(10);
                    onDeleteSticker?.(stk.id);
                  }}
                  className="absolute -top-5 -left-5 w-11 h-11 flex items-center justify-center cursor-pointer z-50"
                  title="Delete Sticker"
                >
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md hover:scale-110 active:scale-95 transition-transform">
                    ✕
                  </span>
                </button>

                {/* Duplicate Button (⧉) on Bottom-Left Corner with 44px Touch Target */}
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    triggerHaptic(10);
                    onDuplicateSticker?.(stk);
                  }}
                  className="absolute -bottom-5 -left-5 w-11 h-11 flex items-center justify-center cursor-pointer z-50"
                  title="Duplicate Sticker"
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[9px] font-bold shadow-md hover:scale-110 active:scale-95 transition-transform">
                    ⧉
                  </span>
                </button>

                {/* Rotate Handle on Top-Right Corner with 44px Touch Target */}
                <div
                  onPointerDown={(e) => handleStickerRotateDown(e, stk)}
                  className="absolute -top-5 -right-5 w-11 h-11 flex items-center justify-center cursor-ew-resize z-50"
                  title="Drag to Rotate"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-md hover:scale-125 transition-transform">
                    <span className="text-[9px] font-bold text-black">↻</span>
                  </div>
                </div>

                {/* Resize Corner Handle on Bottom-Right Corner with 44px Touch Target */}
                <div
                  onPointerDown={(e) => handleStickerResizeDown(e, stk)}
                  className="absolute -bottom-5 -right-5 w-11 h-11 flex items-center justify-center cursor-nwse-resize z-50"
                  title="Drag to Resize"
                >
                  <div className="w-5 h-5 rounded-full bg-[#FF2E93] border-2 border-white flex items-center justify-center shadow-md hover:scale-125 transition-transform">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
};

export const SpotCard = React.memo(SpotCardComponent);
