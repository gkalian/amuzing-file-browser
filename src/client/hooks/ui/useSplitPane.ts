// Hook: manages draggable horizontal split with clamped bounds and RAF throttling.
import { useEffect, useRef, useState } from 'react';

export function useSplitPane(initial = 70, min = 67, max = 80) {
  const [split, setSplit] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const dragRaf = useRef<number | null>(null);

  useEffect(() => {
    if (!dragging) return;
    function onMove(e: MouseEvent) {
      if (dragRaf.current != null) return;
      const clientX = e.clientX;
      dragRaf.current = requestAnimationFrame(() => {
        dragRaf.current = null;
        const el = splitRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = clientX - rect.left;
        const width = rect.width;
        if (width <= 0) return;
        let pct = Math.round((x / width) * 100);
        pct = Math.max(min, Math.min(max, pct));
        setSplit(pct);
      });
    }
    function onUp() {
      setDragging(false);
      if (dragRaf.current != null) {
        cancelAnimationFrame(dragRaf.current);
        dragRaf.current = null;
      }
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, min, max]);

  return { split, setSplit, dragging, setDragging, splitRef } as const;
}
