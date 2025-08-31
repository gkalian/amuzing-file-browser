// Hook: tracks if viewport width is below a threshold to adapt layout (e.g., hide preview).
import { useEffect, useState } from 'react';

export function useIsNarrow(threshold = 700) {
  const [isNarrow, setIsNarrow] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < threshold;
  });
  useEffect(() => {
    function onResize() {
      setIsNarrow(window.innerWidth < threshold);
    }
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [threshold]);
  return isNarrow;
}
