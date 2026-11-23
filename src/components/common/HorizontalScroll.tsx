import React, { useRef, useState, useEffect, useCallback } from 'react';

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
  showArrows?: boolean;
  scrollAmount?: number;
}

export const HorizontalScroll: React.FC<HorizontalScrollProps> = ({
  children,
  className = '',
  wrapperClassName = '',
  showArrows = true,
  scrollAmount = 200,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Drag state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const justDraggedRef = useRef(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const canLeft = el.scrollLeft > 2;
    const canRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;
    setCanScrollLeft(canLeft);
    setCanScrollRight(canRight);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();

    // Check when element resizes or contents change
    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(el);

    const handleWindowResize = () => checkScroll();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const delta = direction === 'left' ? -scrollAmount : scrollAmount;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkScroll, 200);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.shiftKey) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const el = containerRef.current;
      if (!el) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      const isDown = e.deltaY > 0;
      const canScrollInDir = isDown ? el.scrollLeft < maxScroll - 1 : el.scrollLeft > 1;

      if (canScrollInDir) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
        e.stopPropagation();
        checkScroll();
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    const el = containerRef.current;
    if (!el) return;

    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = el.scrollLeft;
    hasMovedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 4) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = startScrollLeftRef.current - dx;
    checkScroll();
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current && hasMovedRef.current) {
      justDraggedRef.current = true;
      setTimeout(() => {
        justDraggedRef.current = false;
      }, 100);
    }
    isDraggingRef.current = false;
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    // Prevent accidental button clicks when user was dragging to scroll
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className={`relative flex items-center w-full min-w-0 ${wrapperClassName}`}>
      {/* Left Scroll Button */}
      {showArrows && canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="absolute -left-2 z-20 w-6 h-6 rounded-full bg-slate-900/95 hover:bg-black text-white border border-white/25 flex items-center justify-center text-xs font-black shadow-lg shadow-black/80 transition-all cursor-pointer hover:scale-110 active:scale-95 shrink-0"
          title="Scroll Left"
          aria-label="Scroll Left"
        >
          ‹
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        onScroll={checkScroll}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
        className={`flex items-center overflow-x-auto scroll-smooth no-scrollbar w-full select-none cursor-grab active:cursor-grabbing ${className}`}
      >
        {children}
      </div>

      {/* Right Scroll Button */}
      {showArrows && canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="absolute -right-2 z-20 w-6 h-6 rounded-full bg-slate-900/95 hover:bg-black text-white border border-white/25 flex items-center justify-center text-xs font-black shadow-lg shadow-black/80 transition-all cursor-pointer hover:scale-110 active:scale-95 shrink-0"
          title="Scroll Right"
          aria-label="Scroll Right"
        >
          ›
        </button>
      )}
    </div>
  );
};
