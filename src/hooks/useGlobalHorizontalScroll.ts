import { useEffect } from 'react';

/**
 * Global hook that intercepts vertical mouse wheel events over any
 * horizontally scrollable element (e.g. overflow-x-auto without vertical scroll)
 * and translates deltaY into horizontal scrollLeft on PC.
 */
export function useGlobalHorizontalScroll() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // If user is already holding Shift, native browser scrolls horizontally
      if (e.shiftKey) return;
      // If deltaX is dominant, user is using a trackpad horizontal swipe
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

      let el = e.target as HTMLElement | null;
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.scrollWidth > el.clientWidth + 2) {
          const style = window.getComputedStyle(el);
          const isHorizontalScrollable =
            style.overflowX === 'auto' ||
            style.overflowX === 'scroll' ||
            el.classList.contains('overflow-x-auto');

          const isVerticalScrollable =
            (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
            el.scrollHeight > el.clientHeight + 4;

          if (isHorizontalScrollable && !isVerticalScrollable) {
            const maxScrollLeft = el.scrollWidth - el.clientWidth;
            const isScrollingRight = e.deltaY > 0;
            const canScroll = isScrollingRight
              ? el.scrollLeft < maxScrollLeft - 1
              : el.scrollLeft > 1;

            if (canScroll) {
              el.scrollLeft += e.deltaY;
              e.preventDefault();
              return;
            }
          }
        }
        el = el.parentElement;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);
}
