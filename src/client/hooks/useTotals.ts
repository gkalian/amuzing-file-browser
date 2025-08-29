// Hook: computes counts of files/dirs and total size for current items list.
import { useMemo } from 'react';
import type { UiFsItem } from './useFileList';

export function useTotals(items: UiFsItem[]) {
  return useMemo(() => {
    const files = items.filter((i) => !i.isDir);
    const dirs = items.filter((i) => i.isDir);
    const size = files.reduce((a, b) => a + b.size, 0);
    return { files: files.length, dirs: dirs.length, size };
  }, [items]);
}
