// Hook: computes current page slice and total pages from a list, page, and pageSize.
import { useMemo } from 'react';

export function usePageSlice<T>(list: T[] | null | undefined, page: number, pageSize: number) {
  return useMemo(() => {
    const arr = Array.isArray(list) ? list : [];
    const safePage = Math.max(1, page | 0);
    const size = Math.max(1, pageSize | 0);
    const startIdx = (safePage - 1) * size;
    const endIdx = startIdx + size;
    const paged = arr.slice(startIdx, endIdx);
    const totalPages = Math.max(1, Math.ceil(arr.length / size));
    return { paged, totalPages } as const;
  }, [list, page, pageSize]);
}
