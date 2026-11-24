import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Spot } from '../../types';
import { SpotCard } from './SpotCard';
import { api } from '../../services/api';
import { getCleanFontFamily, getPhotoFilterStyle } from '../../utils/photoFilters';

const CELL_SIZE = 500;
const CHUNK_SIZE = 1500;
const MAX_CLIENT_CACHE = 50000;
const ZOOM_LOD_THRESHOLD = 0.28; // Below 0.28: 2D canvas overview for 120 FPS
const MAX_FULL_DOM_CARDS = 32;   // Upper bound of heavy interactive SpotCard DOM nodes

interface FastSpotCardProps {
  spot: Spot;
}

const FastSpotCard: React.FC<FastSpotCardProps> = React.memo(({ spot }) => {
  const { content } = spot;
  const isPolaroid = spot.shape === 'polaroid';
  const hasImage = Boolean(content?.imageUrl);
  const isAudio = Boolean(content?.audio);

  return (
    <div
      className="w-full h-full rounded-xs shadow-md overflow-hidden relative select-none flex flex-col justify-between p-2 pointer-events-none"
      style={{
        background: spot.background || (isPolaroid ? '#FFFFFF' : '#1E293B'),
        border: spot.borderColor ? `2px solid ${spot.borderColor}` : '1px solid rgba(255,255,255,0.15)',
        transform: spot.rotation ? `rotate(${spot.rotation}deg)` : undefined,
      }}
    >
      {hasImage ? (
        <div className="w-full h-[64%] rounded-xs overflow-hidden bg-black/30 shrink-0">
          <img
            src={content.imageUrl}
            alt={content.headline || spot.creatorName}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover pointer-events-none select-none"
            draggable={false}
          />
        </div>
      ) : isAudio ? (
        <div className="w-full h-[64%] rounded-xs overflow-hidden bg-gradient-to-tr from-[#FF2E93]/20 to-purple-900/40 border border-pink-500/30 flex items-center justify-center shrink-0">
          <span className="text-xl">🎵</span>
        </div>
      ) : content?.drawingData ? (
        <div className="w-full h-[64%] rounded-xs overflow-hidden bg-white shrink-0">
          <img
            src={content.drawingData}
            alt="Drawing"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Card Headline & Signature */}
      <div className="mt-1 min-w-0">
        {content?.headline && (
          <p
            className="font-bold text-[10px] leading-tight truncate"
            style={{ color: content.textColor || (isPolaroid ? '#0F172A' : '#FFFFFF'), fontFamily: getCleanFontFamily(content.fontFamily) }}
          >
            {content.headline}
          </p>
        )}
        <p
          className="text-[8px] font-semibold opacity-75 truncate mt-0.5"
          style={{ color: content?.textColor || (isPolaroid ? '#475569' : '#94A3B8') }}
        >
          @{spot.creatorName}
        </p>
      </div>

      {/* Friends-Only Locked State Overlay */}
      {spot.isLocked && (
        <div className="absolute inset-0 z-30 rounded-[inherit] bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center pointer-events-none select-none">
          <span className="text-base mb-0.5">🔒</span>
          <span className="text-[9px] font-bold text-white tracking-wide">Friends Only</span>
        </div>
      )}
    </div>
  );
});

interface SpotCanvasProps {
  spots: Spot[];
  selectedSpotId?: string | null;
  highlightedSpotId?: string | null;
  onSelectSpot: (spot: Spot) => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  targetFocus?: { x: number; y: number; zoom?: number; timestamp: number } | null;
}

export const SpotCanvas: React.FC<SpotCanvasProps> = ({
  spots,
  selectedSpotId,
  highlightedSpotId,
  onSelectSpot,
  showMinimap,
  onToggleMinimap,
  targetFocus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Camera state: pan in canvas coordinates, zoom factor
  const [camera, setCamera] = useState<{ x: number; y: number; zoom: number }>({
    x: 0,
    y: 0,
    zoom: 0.85,
  });
  const [isDragging, setIsDragging] = useState(false);

  // Client-Side Spatial Index, Dynamic Chunk Loader & Memory Management
  const spotCacheRef = useRef<Map<string, Spot>>(new Map());
  const spatialGridRef = useRef<Map<string, Set<string>>>(new Map());
  const loadedChunksRef = useRef<Set<string>>(new Set());
  const inFlightChunksRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const [cacheRevision, setCacheRevision] = useState(0);

  // Helper to index a single spot into the client-side spatial grid
  const indexSpot = useCallback((spot: Spot) => {
    if (!spot || !spot.id) return;
    spotCacheRef.current.set(spot.id, spot);

    const halfW = (spot.width || 170) / 2;
    const halfH = (spot.height || 170) / 2;
    const minCx = Math.floor((spot.x - halfW) / CELL_SIZE);
    const maxCx = Math.floor((spot.x + halfW) / CELL_SIZE);
    const minCy = Math.floor((spot.y - halfH) / CELL_SIZE);
    const maxCy = Math.floor((spot.y + halfH) / CELL_SIZE);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = `${cx}:${cy}`;
        let cell = spatialGridRef.current.get(key);
        if (!cell) {
          cell = new Set<string>();
          spatialGridRef.current.set(key, cell);
        }
        cell.add(spot.id);
      }
    }
  }, []);

  // Ingest initial or updated spots from parent props into spatial index
  useEffect(() => {
    if (spots && spots.length > 0) {
      for (const s of spots) {
        indexSpot(s);
      }
      setCacheRevision(r => r + 1);
    }
  }, [spots, indexSpot]);

  // Dragging & Interaction states
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; cameraX: number; cameraY: number }>({
    clientX: 0,
    clientY: 0,
    cameraX: 0,
    cameraY: 0,
  });
  const hasMovedSignificantlyRef = useRef(false);
  const pendingCameraRef = useRef<{ x: number; y: number; zoom: number } | null>(null);
  const rafCameraRef = useRef<number | null>(null);

  const applyPendingCamera = useCallback(() => {
    if (pendingCameraRef.current) {
      setCamera(pendingCameraRef.current);
      pendingCameraRef.current = null;
    }
    rafCameraRef.current = null;
  }, []);

  // Multi-touch pinch state
  const touchDistanceRef = useRef<number | null>(null);

  // Animation frame ref for smooth camera fly-to
  const animFrameRef = useRef<number | null>(null);

  // Smooth fly-to animation when targetFocus changes
  useEffect(() => {
    if (!targetFocus) return;

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const startX = camera.x;
    const startY = camera.y;
    const startZoom = camera.zoom;
    const destX = targetFocus.x;
    const destY = targetFocus.y;
    const destZoom = targetFocus.zoom || 1.15;

    const startTime = performance.now();
    const duration = 750; // ms

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);

      setCamera({
        x: startX + (destX - startX) * eased,
        y: startY + (destY - startY) * eased,
        zoom: startZoom + (destZoom - startZoom) * eased,
      });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetFocus]);

  // Handle Mouse Down / Start Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only left click
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    hasMovedSignificantlyRef.current = false;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      cameraX: camera.x,
      cameraY: camera.y,
    };
  };

  // Handle Mouse Move (RAF-throttled for silky 60-120 FPS panning)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedSignificantlyRef.current = true;
      if (!isDragging) setIsDragging(true);
    }

    const nextX = dragStartRef.current.cameraX - dx / camera.zoom;
    const nextY = dragStartRef.current.cameraY - dy / camera.zoom;

    pendingCameraRef.current = { x: nextX, y: nextY, zoom: camera.zoom };
    if (!rafCameraRef.current) {
      rafCameraRef.current = requestAnimationFrame(applyPendingCamera);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    if (rafCameraRef.current) {
      cancelAnimationFrame(rafCameraRef.current);
      applyPendingCamera();
    }
  };

  // Wheel Zoom towards cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;

    setCamera(prev => {
      const newZoom = Math.min(3.5, Math.max(0.04, prev.zoom * zoomFactor));
      if (newZoom === prev.zoom) return prev;

      if (!containerRef.current) return { ...prev, zoom: newZoom };
      const rect = containerRef.current.getBoundingClientRect();
      const mouseScreenX = e.clientX - rect.left - rect.width / 2;
      const mouseScreenY = e.clientY - rect.top - rect.height / 2;

      // Adjust camera so mouse position remains steady under zoom
      const newX = prev.x + mouseScreenX * (1 / prev.zoom - 1 / newZoom);
      const newY = prev.y + mouseScreenY * (1 / prev.zoom - 1 / newZoom);

      return { x: newX, y: newY, zoom: newZoom };
    });
  };

  // Touch handlers for mobile pan & pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      hasMovedSignificantlyRef.current = false;
      dragStartRef.current = {
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
        cameraX: camera.x,
        cameraY: camera.y,
      };
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.clientX;
      const dy = e.touches[0].clientY - dragStartRef.current.clientY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMovedSignificantlyRef.current = true;
        if (!isDragging) setIsDragging(true);
      }

      const nextX = dragStartRef.current.cameraX - dx / camera.zoom;
      const nextY = dragStartRef.current.cameraY - dy / camera.zoom;

      pendingCameraRef.current = { x: nextX, y: nextY, zoom: camera.zoom };
      if (!rafCameraRef.current) {
        rafCameraRef.current = requestAnimationFrame(applyPendingCamera);
      }
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / touchDistanceRef.current;
      touchDistanceRef.current = dist;

      setCamera(prev => ({
        ...prev,
        zoom: Math.min(3.5, Math.max(0.04, prev.zoom * scale)),
      }));
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    touchDistanceRef.current = null;
    if (rafCameraRef.current) {
      cancelAnimationFrame(rafCameraRef.current);
      applyPendingCamera();
    }
  };

  // Double click / tap to zoom in
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - rect.width / 2) / camera.zoom + camera.x;
    const clickY = (e.clientY - rect.top - rect.height / 2) / camera.zoom + camera.y;

    setCamera(prev => ({
      x: clickX,
      y: clickY,
      zoom: Math.min(3.0, prev.zoom * 1.5),
    }));
  };

  // Zoom control helpers
  const zoomIn = () => setCamera(prev => ({ ...prev, zoom: Math.min(3.5, prev.zoom * 1.3) }));
  const zoomOut = () => setCamera(prev => ({ ...prev, zoom: Math.max(0.04, prev.zoom * 0.75) }));
  const resetCenter = () => setCamera({ x: 0, y: 0, zoom: 0.85 });

  // Dynamic world bounding box calculated across all spots in memory
  const mapBounds = useMemo(() => {
    if (!spots || spots.length === 0) {
      return {
        minX: -4000,
        maxX: 4000,
        minY: -4000,
        maxY: 4000,
        width: 8000,
        height: 8000,
        centerX: 0,
        centerY: 0,
      };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      if (s.x < minX) minX = s.x;
      if (s.x > maxX) maxX = s.x;
      if (s.y < minY) minY = s.y;
      if (s.y > maxY) maxY = s.y;
    }

    // Add 12% padding around outermost spots so they never touch the edge of the minimap
    const spanX = Math.max(2000, maxX - minX);
    const spanY = Math.max(2000, maxY - minY);
    const padX = spanX * 0.12;
    const padY = spanY * 0.12;

    const bMinX = minX - padX;
    const bMaxX = maxX + padX;
    const bMinY = minY - padY;
    const bMaxY = maxY + padY;

    return {
      minX: bMinX,
      maxX: bMaxX,
      minY: bMinY,
      maxY: bMaxY,
      width: bMaxX - bMinX,
      height: bMaxY - bMinY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }, [spots]);

  // Fit All Spots into screen viewport
  const fitAllSpots = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const cW = containerRef.current?.clientWidth || 1200;
    const cH = containerRef.current?.clientHeight || 800;

    // Calculate zoom needed to comfortably show all spots
    const targetZoom = Math.max(0.04, Math.min(2.5, Math.min(cW / mapBounds.width, cH / mapBounds.height) * 0.9));
    const destX = mapBounds.centerX;
    const destY = mapBounds.centerY;

    const startX = camera.x;
    const startY = camera.y;
    const startZoom = camera.zoom;
    const startTime = performance.now();
    const duration = 800;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);

      setCamera({
        x: startX + (destX - startX) * eased,
        y: startY + (destY - startY) * eased,
        zoom: startZoom + (targetZoom - startZoom) * eased,
      });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  };

  // Minimap Canvas reference & high-performance raster rendering
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMinimapInteractingRef = useRef<boolean>(false);

  // Container dimensions & Viewport calculation
  const containerW = containerRef.current?.clientWidth || 1200;
  const containerH = containerRef.current?.clientHeight || 800;

  // Minimap visible world boundaries calculation (adapts dynamically to camera zoom & pan)
  const minimapViewBounds = useMemo(() => {
    const canvas = minimapCanvasRef.current;
    const mW = canvas?.clientWidth || 240;
    const mH = canvas?.clientHeight || 150;
    const aspect = Math.max(0.1, mW / mH);

    const worldW = mapBounds.width;
    const worldH = mapBounds.height;
    const fitWorldW = Math.max(worldW * 1.08, worldH * 1.08 * aspect);
    const fitWorldH = fitWorldW / aspect;

    if (worldW <= 0 || worldH <= 0) {
      return {
        viewMinX: mapBounds.centerX - fitWorldW / 2,
        viewMinY: mapBounds.centerY - fitWorldH / 2,
        viewWidth: fitWorldW,
        viewHeight: fitWorldH,
        isZoomed: false,
      };
    }

    const screenWorldW = containerW / camera.zoom;
    const screenWorldH = containerH / camera.zoom;

    // Radius multiplier: shows ~3.2 screens worth of context around current view
    const desiredW = Math.max(screenWorldW * 3.2, screenWorldH * 3.2 * aspect);
    const clampedW = Math.max(1400, Math.min(fitWorldW, desiredW));
    const clampedH = clampedW / aspect;
    const isZoomed = clampedW < fitWorldW * 0.95;

    const viewMinX = camera.x - clampedW / 2;
    const viewMinY = camera.y - clampedH / 2;

    return {
      viewMinX,
      viewMinY,
      viewWidth: clampedW,
      viewHeight: clampedH,
      isZoomed,
    };
  }, [mapBounds, camera.x, camera.y, camera.zoom, containerW, containerH]);

  const minimapRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!showMinimap) return;
    if (minimapRafRef.current) cancelAnimationFrame(minimapRafRef.current);

    minimapRafRef.current = requestAnimationFrame(() => {
      const canvas = minimapCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || 240;
      const height = canvas.clientHeight || 150;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Clear background
      ctx.fillStyle = '#0B0D14';
      ctx.fillRect(0, 0, width, height);

      // Coordinate grid overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const { viewMinX, viewMinY, viewWidth, viewHeight, isZoomed } = minimapViewBounds;
      if (viewWidth <= 0 || viewHeight <= 0) return;

      // Dot scale based on zoom level: larger dots when zoomed in
      const zoomRatio = Math.max(0, Math.min(1, (camera.zoom - 0.1) / (2.0 - 0.1)));
      const dotScale = isZoomed ? 1 + zoomRatio * 1.6 : 1;

      // Margin for culling
      const cullMargin = 60;
      const minX = viewMinX - cullMargin;
      const maxX = viewMinX + viewWidth + cullMargin;
      const minY = viewMinY - cullMargin;
      const maxY = viewMinY + viewHeight + cullMargin;

      const bigR = 2.5 * dotScale;
      const miniR = 1.8 * dotScale;

      // 1. Draw Big Pops in one batched GPU path (Ultra-high performance)
      ctx.fillStyle = '#FF2E93';
      ctx.beginPath();
      for (let i = 0; i < spots.length; i++) {
        const s = spots[i];
        if (s.tier !== 'big_pop' || s.id === 'sp_spotpop_hero') continue;
        if (s.x < minX || s.x > maxX || s.y < minY || s.y > maxY) continue;

        const normX = (s.x - viewMinX) / viewWidth;
        const normY = (s.y - viewMinY) / viewHeight;
        const px = normX * width;
        const py = normY * height;
        ctx.moveTo(px + bigR, py);
        ctx.arc(px, py, bigR, 0, Math.PI * 2);
      }
      ctx.fill();

      // 2. Draw Mini Pops in one batched GPU path
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      for (let i = 0; i < spots.length; i++) {
        const s = spots[i];
        if (s.tier === 'big_pop' || s.id === 'sp_spotpop_hero') continue;
        if (s.x < minX || s.x > maxX || s.y < minY || s.y > maxY) continue;

        const normX = (s.x - viewMinX) / viewWidth;
        const normY = (s.y - viewMinY) / viewHeight;
        const px = normX * width;
        const py = normY * height;
        ctx.moveTo(px + miniR, py);
        ctx.arc(px, py, miniR, 0, Math.PI * 2);
      }
      ctx.fill();

      // 3. Draw Hero Origin spot prominently
      const heroSpot = spots.find(s => s.id === 'sp_spotpop_hero');
      if (heroSpot && heroSpot.x >= minX && heroSpot.x <= maxX && heroSpot.y >= minY && heroSpot.y <= maxY) {
        const normX = (heroSpot.x - viewMinX) / viewWidth;
        const normY = (heroSpot.y - viewMinY) / viewHeight;
        const px = normX * width;
        const py = normY * height;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px, py, 4.5 * dotScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FF2E93';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    return () => {
      if (minimapRafRef.current) cancelAnimationFrame(minimapRafRef.current);
    };
  }, [spots, minimapViewBounds, showMinimap, camera.zoom]);

  // Viewport culling: calculate items within or near visible boundary using spatial index
  const halfViewW = (containerW / 2) / camera.zoom + 250;
  const halfViewH = (containerH / 2) / camera.zoom + 250;

  // Query spots in visible viewport via client-side spatial hash grid
  const visibleSpots = useMemo(() => {
    // When zoomed out, Overview Canvas handles all rendering for silky smooth 60-120FPS
    if (camera.zoom < ZOOM_LOD_THRESHOLD) {
      if (selectedSpotId || highlightedSpotId) {
        return spots.filter(s => s.id === selectedSpotId || s.id === highlightedSpotId);
      }
      return [];
    }

    const minX = camera.x - halfViewW;
    const maxX = camera.x + halfViewW;
    const minY = camera.y - halfViewH;
    const maxY = camera.y + halfViewH;

    const minCx = Math.floor(minX / CELL_SIZE);
    const maxCx = Math.floor(maxX / CELL_SIZE);
    const minCy = Math.floor(minY / CELL_SIZE);
    const maxCy = Math.floor(maxY / CELL_SIZE);

    const candidateIds = new Set<string>();
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = spatialGridRef.current.get(`${cx}:${cy}`);
        if (cell) {
          for (const id of cell) {
            candidateIds.add(id);
          }
        }
      }
    }

    const results: Spot[] = [];
    for (const id of candidateIds) {
      const s = spotCacheRef.current.get(id);
      if (!s || s.status === 'hidden') continue;
      const sW = (s.width || 170) / 2;
      const sH = (s.height || 170) / 2;
      if (!(s.x + sW < minX || s.x - sW > maxX || s.y + sH < minY || s.y - sH > maxY)) {
        results.push(s);
      }
    }

    // Fallback: If cache is empty yet spots prop has items, filter spots directly
    if (results.length === 0 && spots.length > 0) {
      return spots.filter(s =>
        s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY
      );
    }

    return results;
  }, [camera.x, camera.y, camera.zoom, halfViewW, halfViewH, cacheRevision, spots, selectedSpotId, highlightedSpotId]);

  // Level-of-Detail (LOD): Prioritize full interactive SpotCards for the closest spots
  const fullCardIds = useMemo(() => {
    if (camera.zoom < 0.40) return new Set<string>();
    const sorted = [...visibleSpots].sort((a, b) => {
      const distA = Math.hypot(a.x - camera.x, a.y - camera.y);
      const distB = Math.hypot(b.x - camera.x, b.y - camera.y);
      return distA - distB;
    });
    const s = new Set<string>();
    if (selectedSpotId) s.add(selectedSpotId);
    if (highlightedSpotId) s.add(highlightedSpotId);
    for (let i = 0; i < Math.min(MAX_FULL_DOM_CARDS, sorted.length); i++) {
      s.add(sorted[i].id);
    }
    return s;
  }, [visibleSpots, camera.x, camera.y, camera.zoom, selectedSpotId, highlightedSpotId]);

  // Dynamic Viewport Chunk Loader with Request Deduplication & Memory Management
  useEffect(() => {
    // If all spots are already in memory, avoid unnecessary network polling
    if (spots && spots.length > 0 && spotCacheRef.current.size >= spots.length) {
      return;
    }
    const minX = camera.x - halfViewW;
    const maxX = camera.x + halfViewW;
    const minY = camera.y - halfViewH;
    const maxY = camera.y + halfViewH;

    const minChunkX = Math.floor(minX / CHUNK_SIZE);
    const maxChunkX = Math.floor(maxX / CHUNK_SIZE);
    const minChunkY = Math.floor(minY / CHUNK_SIZE);
    const maxChunkY = Math.floor(maxY / CHUNK_SIZE);

    const missingChunks: string[] = [];
    for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      for (let cy = minChunkY; cy <= maxChunkY; cy++) {
        const key = `${cx}:${cy}`;
        if (!loadedChunksRef.current.has(key) && !inFlightChunksRef.current.has(key)) {
          missingChunks.push(key);
        }
      }
    }

    if (missingChunks.length === 0) return;

    // Mark as in-flight to prevent duplicate simultaneous queries
    for (const k of missingChunks) {
      inFlightChunksRef.current.add(k);
    }

    const timer = setTimeout(async () => {
      // Abort previous in-flight request if user is rapidly panning
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const chunkMinX = minChunkX * CHUNK_SIZE;
        const chunkMaxX = (maxChunkX + 1) * CHUNK_SIZE;
        const chunkMinY = minChunkY * CHUNK_SIZE;
        const chunkMaxY = (maxChunkY + 1) * CHUNK_SIZE;

        const res = await api.getViewportSpots(
          chunkMinX,
          chunkMinY,
          chunkMaxX,
          chunkMaxY,
          camera.zoom,
          controller.signal
        );

        if (res && res.spots) {
          for (const s of res.spots) {
            indexSpot(s);
          }
          for (const k of missingChunks) {
            loadedChunksRef.current.add(k);
          }

          // Memory Management: Keep client cache bounded to prevent browser memory exhaustion
          if (spotCacheRef.current.size > MAX_CLIENT_CACHE) {
            const allSpots = Array.from(spotCacheRef.current.values());
            allSpots.sort((a, b) => {
              const distA = Math.hypot(a.x - camera.x, a.y - camera.y);
              const distB = Math.hypot(b.x - camera.x, b.y - camera.y);
              return distB - distA; // furthest first
            });
            const spotsToRemove = allSpots.slice(0, allSpots.length - MAX_CLIENT_CACHE);
            for (const rem of spotsToRemove) {
              spotCacheRef.current.delete(rem.id);
            }

            // Rebuild spatial grid for active bounded cache
            spatialGridRef.current.clear();
            for (const activeSpot of spotCacheRef.current.values()) {
              const halfW = (activeSpot.width || 170) / 2;
              const halfH = (activeSpot.height || 170) / 2;
              const sMinCx = Math.floor((activeSpot.x - halfW) / CELL_SIZE);
              const sMaxCx = Math.floor((activeSpot.x + halfW) / CELL_SIZE);
              const sMinCy = Math.floor((activeSpot.y - halfH) / CELL_SIZE);
              const sMaxCy = Math.floor((activeSpot.y + halfH) / CELL_SIZE);
              for (let cx = sMinCx; cx <= sMaxCx; cx++) {
                for (let cy = sMinCy; cy <= sMaxCy; cy++) {
                  const key = `${cx}:${cy}`;
                  let cell = spatialGridRef.current.get(key);
                  if (!cell) {
                    cell = new Set<string>();
                    spatialGridRef.current.set(key, cell);
                  }
                  cell.add(activeSpot.id);
                }
              }
            }
            loadedChunksRef.current.clear();
          }

          setCacheRevision(r => r + 1);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Viewport chunk load warning:', err);
        }
      } finally {
        for (const k of missingChunks) {
          inFlightChunksRef.current.delete(k);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [camera.x, camera.y, camera.zoom, halfViewW, halfViewH, indexSpot]);

  // Hardware-accelerated Canvas for zoomed-out overview (60-120 FPS performance)
  const overviewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (camera.zoom >= ZOOM_LOD_THRESHOLD) return;
    const canvas = overviewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cW = containerW;
    const cH = containerH;

    if (canvas.width !== cW * dpr || canvas.height !== cH * dpr) {
      canvas.width = cW * dpr;
      canvas.height = cH * dpr;
    }
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, cW, cH);

    const zoom = camera.zoom;
    const camX = camera.x;
    const camY = camera.y;
    const halfCW = cW / 2;
    const halfCH = cH / 2;

    const isVeryLowZoom = zoom < 0.12;

    // Draw spots
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      if (s.status === 'hidden') continue;

      const isHero = s.id === 'sp_spotpop_hero';
      const spotW = isHero ? (s.width || 340) : (s.width || 170);
      const spotH = isHero ? (s.height || 340) : (s.height || (s.tier === 'big_pop' ? 210 : 170));

      // Screen coordinates
      const screenX = (s.x - camX) * zoom + halfCW;
      const screenY = (s.y - camY) * zoom + halfCH;
      const screenW = spotW * zoom;
      const screenH = spotH * zoom;

      // Culling against screen viewport
      if (
        screenX + screenW / 2 < -20 ||
        screenX - screenW / 2 > cW + 20 ||
        screenY + screenH / 2 < -20 ||
        screenY - screenH / 2 > cH + 20
      ) {
        continue;
      }

      const drawX = screenX - screenW / 2;
      const drawY = screenY - screenH / 2;
      const isSelected = selectedSpotId === s.id;
      const isHighlighted = highlightedSpotId === s.id;

      if (isHero) {
        // Hero Origin Spot
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(drawX, drawY, screenW, screenH, Math.max(4, 8 * zoom));
        } else {
          ctx.rect(drawX, drawY, screenW, screenH);
        }
        ctx.fill();

        ctx.strokeStyle = '#FF2E93';
        ctx.lineWidth = Math.max(2, 4 * zoom);
        ctx.stroke();

        // SP center mark
        ctx.fillStyle = '#FF2E93';
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(3, 8 * zoom), 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      if (isVeryLowZoom) {
        // Fast flat rect
        ctx.fillStyle = s.background || '#FFF475';
        ctx.fillRect(drawX, drawY, Math.max(1.8, screenW), Math.max(1.8, screenH));
        if (s.borderColor || s.tier === 'big_pop') {
          ctx.strokeStyle = s.borderColor || (s.tier === 'big_pop' ? '#FF2E93' : 'rgba(255,255,255,0.15)');
          ctx.lineWidth = 0.6;
          ctx.strokeRect(drawX, drawY, Math.max(1.8, screenW), Math.max(1.8, screenH));
        }
      } else {
        // Slightly rotated note
        ctx.save();
        ctx.translate(screenX, screenY);
        if (s.rotation) {
          ctx.rotate((s.rotation * Math.PI) / 180);
        }

        const halfW = screenW / 2;
        const halfH = screenH / 2;

        ctx.fillStyle = s.background || '#FFF475';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-halfW, -halfH, screenW, screenH, Math.max(1.5, 3 * zoom));
        } else {
          ctx.rect(-halfW, -halfH, screenW, screenH);
        }
        ctx.fill();

        ctx.strokeStyle = s.borderColor || (s.tier === 'big_pop' ? '#FF2E93' : 'rgba(255,255,255,0.12)');
        ctx.lineWidth = s.tier === 'big_pop' ? Math.max(1, 1.5 * zoom) : 0.8;
        ctx.stroke();

        ctx.restore();
      }

      if (isSelected || isHighlighted) {
        ctx.strokeStyle = '#FF2E93';
        ctx.lineWidth = 3;
        ctx.strokeRect(drawX - 3, drawY - 3, screenW + 6, screenH + 6);
      }
    }
  }, [camera.x, camera.y, camera.zoom, containerW, containerH, spots, selectedSpotId, highlightedSpotId]);

  // Handle Canvas Click (detects spot clicks when zoomed out)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (hasMovedSignificantlyRef.current) return;
    if (camera.zoom >= ZOOM_LOD_THRESHOLD) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseScreenX = e.clientX - rect.left - rect.width / 2;
    const mouseScreenY = e.clientY - rect.top - rect.height / 2;
    const worldX = camera.x + mouseScreenX / camera.zoom;
    const worldY = camera.y + mouseScreenY / camera.zoom;

    for (let i = spots.length - 1; i >= 0; i--) {
      const s = spots[i];
      if (s.status === 'hidden') continue;
      const isHero = s.id === 'sp_spotpop_hero';
      const spotW = isHero ? (s.width || 340) : (s.width || 170);
      const spotH = isHero ? (s.height || 340) : (s.height || (s.tier === 'big_pop' ? 210 : 170));
      const halfW = spotW / 2;
      const halfH = spotH / 2;

      if (
        worldX >= s.x - halfW &&
        worldX <= s.x + halfW &&
        worldY >= s.y - halfH &&
        worldY <= s.y + halfH
      ) {
        onSelectSpot(s);
        return;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-[#090A0F]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(255, 46, 147, 0.08) 0%, transparent 65%),
          radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 36px 36px',
      }}
    >
      {/* High-Performance Hardware-Accelerated Overview Canvas (Active when zoomed out for 60-120FPS) */}
      <canvas
        ref={overviewCanvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full"
        style={{
          display: camera.zoom < ZOOM_LOD_THRESHOLD ? 'block' : 'none',
        }}
      />
      {/* Canvas World Container */}
      <div
        className="absolute top-1/2 left-1/2 w-0 h-0 canvas-world"
        style={{
          transform: `translate3d(${-camera.x * camera.zoom}px, ${-camera.y * camera.zoom}px, 0) scale(${camera.zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
          pointerEvents: isDragging ? 'none' : 'auto',
        }}
      >
        {/* Living Background Cluster Decoration */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none opacity-20"
          style={{
            width: 1400,
            height: 1400,
            background: 'radial-gradient(circle, rgba(255,46,147,0.3) 0%, rgba(255,184,0,0.12) 40%, transparent 70%)',
          }}
        />

        {/* Spots Rendered on Canvas */}
        {visibleSpots.map((spot) => {
          const isSelected = selectedSpotId === spot.id;
          const isHighlighted = highlightedSpotId === spot.id;
          const isHero = spot.id === 'sp_spotpop_hero';
          const isFullCard = isHero || fullCardIds.has(spot.id);
          const spotW = isHero ? spot.width : Math.min(spot.width || 170, 170);
          const spotH = isHero ? spot.height : Math.min(spot.height || (spot.tier === 'big_pop' ? 210 : 170), spot.tier === 'big_pop' ? 210 : 170);

          return (
            <div
              key={spot.id}
              onClick={(e) => {
                e.stopPropagation();
                if (!hasMovedSignificantlyRef.current) {
                  onSelectSpot(spot);
                }
              }}
              className={`absolute cursor-pointer hover:z-30 hover:scale-[1.04] ${
                isDragging ? '' : 'transition-transform duration-100 ease-out'
              } ${
                isHighlighted
                  ? 'z-50 ring-4 ring-[#FF2E93] ring-offset-4 ring-offset-[#090A0F] scale-110 shadow-[0_0_40px_rgba(255,46,147,0.85)] animate-pulse'
                  : isSelected
                  ? 'z-40 ring-4 ring-[#FF2E93] ring-offset-2 ring-offset-black scale-105 shadow-2xl'
                  : 'z-10'
              }`}
              style={{
                left: spot.x - spotW / 2,
                top: spot.y - spotH / 2,
                width: spotW,
                height: spotH,
                contain: 'layout style',
              }}
            >
              {camera.zoom < 0.12 && !isHero ? (
                <div
                  className="w-full h-full rounded-xs shadow-xs select-none pointer-events-none"
                  style={{
                    background: spot.background,
                    border: spot.borderColor ? `1px solid ${spot.borderColor}` : '1px solid rgba(255,255,255,0.15)',
                  }}
                />
              ) : !isFullCard ? (
                <FastSpotCard spot={spot} />
              ) : (
                <SpotCard
                  tier={spot.tier}
                  shape={spot.shape}
                  background={spot.background}
                  borderColor={spot.borderColor}
                  content={spot.content}
                  creatorName={spot.creatorName}
                  rotation={spot.rotation}
                  width={spotW}
                  height={spotH}
                  isLocked={spot.isLocked}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Canvas HUD Controls (Top-Right) */}
      <div className="absolute top-24 right-4 z-30 flex flex-col gap-2">
        <button
          onClick={onToggleMinimap}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
            showMinimap
              ? 'bg-[#FF2E93] text-white shadow-pink-500/30 ring-2 ring-[#FF2E93]/50'
              : 'bg-black/60 backdrop-blur-md text-slate-300 hover:text-white border border-white/10'
          }`}
          title="Toggle World Map"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>

        <button
          onClick={zoomIn}
          className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-slate-200 hover:text-white border border-white/10 flex items-center justify-center shadow-lg active:scale-95 transition-all text-xl font-bold"
          title="Zoom In"
        >
          +
        </button>

        <button
          onClick={zoomOut}
          className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-slate-200 hover:text-white border border-white/10 flex items-center justify-center shadow-lg active:scale-95 transition-all text-xl font-bold"
          title="Zoom Out"
        >
          −
        </button>

        <button
          onClick={fitAllSpots}
          className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-slate-200 hover:text-white border border-white/10 flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="Fit Entire Map"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        <button
          onClick={resetCenter}
          className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-slate-200 hover:text-white border border-white/10 flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="Center Canvas"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>

      {/* Floating Interactive World Radar MiniMap (Bottom-Left) */}
      {showMinimap && (
        <div className="absolute bottom-20 left-4 sm:bottom-16 sm:left-6 z-30 w-52 sm:w-64 rounded-2xl bg-[#0B0D14]/90 backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden animate-fade-in flex flex-col">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/5 select-none">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-white">
              <span className="w-2 h-2 rounded-full bg-[#FF2E93] animate-pulse" />
              <span className="uppercase tracking-wider font-extrabold text-white">Pop World</span>
            </div>
            <button
              onClick={fitAllSpots}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-[#FF2E93] hover:text-white text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer shadow-xs active:scale-95"
              title="Zoom out canvas to fit all spots"
            >
              Fit All
            </button>
          </div>

          {/* Map Surface with HTML5 Canvas & Live Viewport indicator */}
          <div
            className="relative w-full h-32 sm:h-40 bg-[#090A0F] cursor-crosshair overflow-hidden touch-none select-none"
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
              setCamera(prev => ({
                ...prev,
                zoom: Math.min(3.5, Math.max(0.04, prev.zoom * zoomFactor))
              }));
            }}
            onPointerDown={(e) => {
              isMinimapInteractingRef.current = true;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              const rect = e.currentTarget.getBoundingClientRect();
              const ratioX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const ratioY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
              const { viewMinX, viewMinY, viewWidth, viewHeight } = minimapViewBounds;
              setCamera(prev => ({
                ...prev,
                x: viewMinX + ratioX * viewWidth,
                y: viewMinY + ratioY * viewHeight,
              }));
            }}
            onPointerMove={(e) => {
              if (!isMinimapInteractingRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratioX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const ratioY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
              const { viewMinX, viewMinY, viewWidth, viewHeight } = minimapViewBounds;
              setCamera(prev => ({
                ...prev,
                x: viewMinX + ratioX * viewWidth,
                y: viewMinY + ratioY * viewHeight,
              }));
            }}
            onPointerUp={(e) => {
              isMinimapInteractingRef.current = false;
              try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
              } catch {}
            }}
            onPointerCancel={() => {
              isMinimapInteractingRef.current = false;
            }}
          >
            <canvas
              ref={minimapCanvasRef}
              className="w-full h-full block pointer-events-none"
            />

            {/* Live Viewport Indicator Rectangle ("Where User Is") */}
            {(() => {
              const { viewMinX, viewMinY, viewWidth, viewHeight } = minimapViewBounds;
              const viewWorldW = containerW / camera.zoom;
              const viewWorldH = containerH / camera.zoom;
              const viewWorldLeft = camera.x - viewWorldW / 2;
              const viewWorldTop = camera.y - viewWorldH / 2;

              const vpLeftPercent = ((viewWorldLeft - viewMinX) / viewWidth) * 100;
              const vpTopPercent = ((viewWorldTop - viewMinY) / viewHeight) * 100;
              const vpWidthPercent = (viewWorldW / viewWidth) * 100;
              const vpHeightPercent = (viewWorldH / viewHeight) * 100;

              // Visual indicator sizing clamped to container
              const renderW = Math.max(4, Math.min(100, vpWidthPercent));
              const renderH = Math.max(4, Math.min(100, vpHeightPercent));
              const renderLeft = Math.max(0, Math.min(100 - renderW, vpLeftPercent));
              const renderTop = Math.max(0, Math.min(100 - renderH, vpTopPercent));

              return (
                <div
                  className="absolute border-2 border-[#FF2E93] bg-[#FF2E93]/20 rounded-xs pointer-events-none transition-all duration-75"
                  style={{
                    left: `${renderLeft}%`,
                    top: `${renderTop}%`,
                    width: `${renderW}%`,
                    height: `${renderH}%`,
                    boxShadow: '0 0 12px rgba(255,46,147,0.7), inset 0 0 6px rgba(255,46,147,0.3)',
                  }}
                >
                  {/* Center Crosshair Dot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
