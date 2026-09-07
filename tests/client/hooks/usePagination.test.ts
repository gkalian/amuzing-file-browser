// Basic tests for usePagination: slicing, totalPages, page-size switching,
// and clamping the current page when it goes out of range.
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/client/hooks/pagination/usePagination';

describe('usePagination', () => {
  it('slices the first page using the default page size', () => {
    const items = Array.from({ length: 60 }, (_, i) => i);
    const { result } = renderHook(() => usePagination(items));

    expect(result.current.pageSize).toBe('25');
    expect(result.current.paged).toEqual(items.slice(0, 25));
    expect(result.current.totalPages).toBe(3);
  });

  it('slices the requested page', () => {
    const items = Array.from({ length: 60 }, (_, i) => i);
    const { result } = renderHook(() => usePagination(items));

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.paged).toEqual(items.slice(25, 50));
  });

  it('clamps the current page when it exceeds the new totalPages', () => {
    const items = Array.from({ length: 60 }, (_, i) => i);
    const { result } = renderHook(() => usePagination(items));

    act(() => {
      result.current.setPage(3); // last page with size 25
    });
    expect(result.current.paged).toEqual(items.slice(50, 60));

    act(() => {
      result.current.setPageSize('100'); // now everything fits on page 1
    });

    expect(result.current.totalPages).toBe(1);
    expect(result.current.paged).toEqual(items);
  });

  it('always reports at least one page, even when empty', () => {
    const { result } = renderHook(() => usePagination<number>([]));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paged).toEqual([]);
  });
});
