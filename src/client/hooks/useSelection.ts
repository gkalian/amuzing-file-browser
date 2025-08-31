// Hook: selection handling for files and folders with range/toggle logic
import { useCallback, useEffect, useState } from 'react';
import type { FsItem } from '../services/apiClient';

export function useSelection(params: {
  paged: FsItem[];
  cwd: string;
  onOpenDir: (path: string) => void;
}) {
  const { paged, cwd, onOpenDir } = params;
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Clear selection on cwd change
  useEffect(() => {
    setSelectedPaths(new Set());
    setLastSelectedIndex(null);
  }, [cwd]);

  // Escape key clears selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPaths(new Set());
        setLastSelectedIndex(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onItemClick = useCallback(
    (item: FsItem, index: number, e: React.MouseEvent) => {
      // Directories: single selection only, do not open on single click
      if (item.isDir) {
        if (e.shiftKey || e.ctrlKey || e.metaKey) return; // no multi-select for folders
        setSelectedPaths(new Set([item.path]));
        setLastSelectedIndex(index);
        return;
      }

      const path = item.path;
      const isToggle = e.ctrlKey || e.metaKey;
      const isRange = e.shiftKey && lastSelectedIndex !== null;

      if (isRange) {
        const start = Math.min(lastSelectedIndex!, index);
        const end = Math.max(lastSelectedIndex!, index);
        const rangePaths = new Set<string>();
        for (let i = start; i <= end; i++) {
          const it = paged[i];
          if (it && !it.isDir) rangePaths.add(it.path);
        }
        setSelectedPaths(rangePaths);
      } else if (isToggle) {
        setSelectedPaths((prev) => {
          const next = new Set(prev);
          if (next.has(path)) next.delete(path);
          else next.add(path);
          return next;
        });
        setLastSelectedIndex(index);
      } else {
        setSelectedPaths(new Set([path]));
        setLastSelectedIndex(index);
      }
    },
    [lastSelectedIndex, paged]
  );

  const onItemDoubleClick = useCallback(
    (item: FsItem, _index: number, _e: React.MouseEvent) => {
      if (item.isDir) {
        onOpenDir(item.path);
        setSelectedPaths(new Set());
        setLastSelectedIndex(null);
      }
    },
    [onOpenDir]
  );

  const clearSelection = useCallback(() => {
    setSelectedPaths(new Set());
    setLastSelectedIndex(null);
  }, []);

  return { selectedPaths, setSelectedPaths, lastSelectedIndex, onItemClick, onItemDoubleClick, clearSelection } as const;
}
