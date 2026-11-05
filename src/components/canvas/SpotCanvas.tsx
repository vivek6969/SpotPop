import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Spot } from '../../types';
import { SpotCard } from './SpotCard';

interface SpotCanvasProps {
  spots: Spot[];
  selectedSpotId?: string | null;
  onSelectSpot: (spot: Spot) => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  targetFocus?: { x: number; y: number; zoom?: number; timestamp: number } | null;
}

export const SpotCanvas: React.FC<SpotCanvasProps> = ({
  spots,
  selectedSpotId,
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

  // Dragging & Interaction states
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; cameraX: number; cameraY: number }>({
    clientX: 0,
    clientY: 0,
    cameraX: 0,
    cameraY: 0,
  });
  const hasMovedSignificantlyRef = useRef(false);

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

  // Handle Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedSignificantlyRef.current = true;
    }

    setCamera(prev => ({
      ...prev,
      x: dragStartRef.current.cameraX - dx / prev.zoom,
      y: dragStartRef.current.cameraY - dy / prev.zoom,
    }));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel Zoom towards cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    
    setCamera(prev => {
      const newZoom = Math.min(2.5, Math.max(0.25, prev.zoom * zoomFactor));
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
      }

      setCamera(prev => ({
        ...prev,
        x: dragStartRef.current.cameraX - dx / prev.zoom,
        y: dragStartRef.current.cameraY - dy / prev.zoom,
      }));
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / touchDistanceRef.current;
      touchDistanceRef.current = dist;

      setCamera(prev => ({
        ...prev,
        zoom: Math.min(2.5, Math.max(0.25, prev.zoom * scale)),
      }));
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    touchDistanceRef.current = null;
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
      zoom: Math.min(2.2, prev.zoom * 1.5),
    }));
  };

  // Zoom control helpers
  const zoomIn = () => setCamera(prev => ({ ...prev, zoom: Math.min(2.5, prev.zoom * 1.3) }));
  const zoomOut = () => setCamera(prev => ({ ...prev, zoom: Math.max(0.25, prev.zoom * 0.75) }));
  const resetCenter = () => setCamera({ x: 0, y: 0, zoom: 0.85 });

  // Viewport culling: only calculate items within or near visible boundary
  const containerW = containerRef.current?.clientWidth || 1200;
  const containerH = containerRef.current?.clientHeight || 800;
  const halfViewW = (containerW / 2) / camera.zoom + 250;
  const halfViewH = (containerH / 2) / camera.zoom + 250;

  const visibleSpots = spots.filter(s => {
    return (
      s.x >= camera.x - halfViewW &&
      s.x <= camera.x + halfViewW &&
      s.y >= camera.y - halfViewH &&
      s.y <= camera.y + halfViewH
    );
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-[#090A0F]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
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
      {/* Canvas World Container */}
      <div
        className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none will-change-transform"
        style={{
          transform: `translate3d(${-camera.x * camera.zoom}px, ${-camera.y * camera.zoom}px, 0) scale(${camera.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Living Background Cluster Decoration */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none opacity-20 filter blur-3xl"
          style={{
            width: 1400,
            height: 1400,
            background: 'radial-gradient(circle, #FF2E93 0%, #FFB800 40%, transparent 70%)',
          }}
        />

        {/* Spots Rendered on Canvas */}
        {visibleSpots.map((spot) => {
          const isSelected = selectedSpotId === spot.id;
          const { content } = spot;

          return (
            <div
              key={spot.id}
              onClick={(e) => {
                e.stopPropagation();
                if (!hasMovedSignificantlyRef.current) {
                  onSelectSpot(spot);
                }
              }}
              className={`absolute pointer-events-auto cursor-pointer transition-transform duration-150 ease-out hover:z-30 hover:scale-[1.04] ${
                isSelected ? 'z-40 ring-4 ring-[#FF2E93] ring-offset-2 ring-offset-black scale-105 shadow-2xl' : 'z-10'
              }`}
              style={{
                left: spot.x - spot.width / 2,
                top: spot.y - spot.height / 2,
                width: spot.width,
                height: spot.height,
              }}
            >
              <SpotCard
                tier={spot.tier}
                shape={spot.shape}
                background={spot.background}
                borderColor={spot.borderColor}
                content={spot.content}
                creatorName={spot.creatorName}
                rotation={spot.rotation}
                width={spot.width}
                height={spot.height}
              />
            </div>
          );
        })}
      </div>

      {/* Floating Canvas HUD Controls (Top-Right) */}
      <div className="absolute top-20 right-4 z-30 flex flex-col gap-2">
        <button
          onClick={onToggleMinimap}
          className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg active:scale-95 ${
            showMinimap
              ? 'bg-[#FF2E93] text-white shadow-pink-500/30'
              : 'bg-black/60 text-slate-300 hover:text-white border border-white/10'
          }`}
          title="Toggle MiniMap"
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
          onClick={resetCenter}
          className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-slate-200 hover:text-white border border-white/10 flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="Center Canvas"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>

      {/* Floating Interactive MiniMap (Bottom-Left) */}
      {showMinimap && (
        <div
          className="absolute bottom-24 left-4 z-30 w-36 h-28 sm:w-44 sm:h-34 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 p-1.5 shadow-2xl overflow-hidden animate-fade-in"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPercentX = (e.clientX - rect.left) / rect.width - 0.5;
            const clickPercentY = (e.clientY - rect.top) / rect.height - 0.5;
            // Map bounds approx -1500 to +1500
            setCamera(prev => ({
              ...prev,
              x: clickPercentX * 2400,
              y: clickPercentY * 2000,
            }));
          }}
        >
          <div className="relative w-full h-full bg-[#0E1017] rounded-lg overflow-hidden border border-white/5">
            {/* Spot Dots on Minimap */}
            {spots.map((s) => {
              const miniX = ((s.x + 1200) / 2400) * 100;
              const miniY = ((s.y + 1000) / 2000) * 100;
              if (miniX < 0 || miniX > 100 || miniY < 0 || miniY > 100) return null;
              return (
                <div
                  key={s.id}
                  className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${miniX}%`,
                    top: `${miniY}%`,
                    width: s.tier === 'big_pop' ? 5 : 3,
                    height: s.tier === 'big_pop' ? 5 : 3,
                    backgroundColor: s.tier === 'big_pop' ? '#FF2E93' : '#FFD700',
                  }}
                />
              );
            })}

            {/* Viewport Box Indicator */}
            {(() => {
              const boxW = Math.max(16, ((containerW / camera.zoom) / 2400) * 100);
              const boxH = Math.max(12, ((containerH / camera.zoom) / 2000) * 100);
              const boxLeft = ((camera.x + 1200) / 2400) * 100 - boxW / 2;
              const boxTop = ((camera.y + 1000) / 2000) * 100 - boxH / 2;

              return (
                <div
                  className="absolute border border-white/90 bg-white/10 rounded-xs pointer-events-none transition-all duration-75"
                  style={{
                    left: `${Math.max(0, Math.min(100 - boxW, boxLeft))}%`,
                    top: `${Math.max(0, Math.min(100 - boxH, boxTop))}%`,
                    width: `${Math.min(100, boxW)}%`,
                    height: `${Math.min(100, boxH)}%`,
                    boxShadow: '0 0 10px rgba(255,46,147,0.5)',
                  }}
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
