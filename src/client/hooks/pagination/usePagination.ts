// Hook: stateful pagination (page/pageSize) with derived paged items and totalPages.
import { useMemo, useState } from 'react';

export function usePagination<T>(items: T[], defaultPageSize: '25' | '50' | '100' = '25') {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<'25' | '50' | '100'>(defaultPageSize);

  const { paged, totalPages } = useMemo(() => {
    const sizeNum = Number(pageSize);
    const totalPages = Math.max(1, Math.ceil(items.length / sizeNum));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIdx = (safePage - 1) * sizeNum;
    const endIdx = startIdx + sizeNum;
    return { paged: items.slice(startIdx, endIdx), totalPages };
  }, [items, page, pageSize]);

  return { page, setPage, pageSize, setPageSize, paged, totalPages } as const;
}
