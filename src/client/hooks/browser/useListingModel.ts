// Hook: combines filtering, sorting, pagination and totals for file list
import { useCallback, useMemo, useState } from 'react';
import type { FsItem } from '../../core/types';
import { usePageSlice } from '../pagination/usePageSlice';
import { useTotals } from '../pagination/useTotals';

export type SortField = 'name' | 'size' | 'mtime' | null;
export type SortDir = 'asc' | 'desc';
export type PageSize = '25' | '50' | '100';

export function useListingModel(params: {
  items: FsItem[] | null | undefined;
  search: string; // debounced value
  initialPageSize?: PageSize;
}) {
  const { items, search, initialPageSize = '25' } = params;

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(initialPageSize);

  // sorting
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // filtering
  const filtered = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    const list = (items || []) as FsItem[];
    if (!q) return list;
    return list.filter((it) => (it.name || '').toLowerCase().includes(q));
  }, [items, search]);

  // totals (by filtered set)
  const totals = useTotals(filtered as any);

  // sorting
  const sorted = useMemo(() => {
    const arr = [...(filtered as FsItem[])];
    if (!sortField) return arr;
    const dirMul = sortDir === 'asc' ? 1 : -1;
    return arr.sort((a, b) => {
      if (sortField === 'name') {
        const an = (a.name || '').toLowerCase();
        const bn = (b.name || '').toLowerCase();
        return an.localeCompare(bn) * dirMul;
      }
      if (sortField === 'size') {
        return ((a.size || 0) - (b.size || 0)) * dirMul;
      }
      // mtime
      return ((a.mtimeMs || 0) - (b.mtimeMs || 0)) * dirMul;
    });
  }, [filtered, sortField, sortDir]);

  // sorting handler
  const onSort = useCallback((field: Exclude<SortField, null>) => {
    setSortField((prev) => {
      if (prev === field) {
        if (sortDir === 'asc') {
          setSortDir('desc');
          return prev; // same column, change direction
        }
        // was desc -> reset sorting
        setSortDir('asc');
        return null;
      }
      setSortDir('asc');
      return field;
    });
  }, [sortDir]);

  // pagination
  const { paged, totalPages } = usePageSlice(sorted as any[], page, Number(pageSize));

  return {
    // data
    filtered,
    sorted,
    paged,
    totals,
    totalPages,
    // sorting
    sortField,
    sortDir,
    onSort,
    // pagination
    page,
    setPage,
    pageSize,
    setPageSize,
  } as const;
}
