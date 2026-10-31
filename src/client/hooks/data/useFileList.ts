// Hook: loads directory listing, sorts folders first, and formats size/mtime for display.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/apiClient';
import type { FsItem } from '../../core/types';

export type UiFsItem = FsItem & { displaySize: string; displayMtime: string };

export function useFileList(cwd: string) {
  const numberFmt = useMemo(() => new Intl.NumberFormat(), []);
  const [items, setItems] = useState<UiFsItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(
    async (path: string): Promise<UiFsItem[]> => {
      const data = await api.list(path);
      return data.items
        .slice()
        .sort(
          (a, b) =>
            Number(b.isDir) - Number(a.isDir) ||
            a.name.localeCompare(b.name, undefined, { numeric: true })
        )
        .map((it) => ({
          ...it,
          displaySize: it.isDir ? '-' : numberFmt.format(it.size),
          displayMtime: new Date(it.mtimeMs).toLocaleString(),
        }));
    },
    [numberFmt]
  );

  // Manual reload (called from event handlers)
  const loadList = useCallback(
    async (path: string) => {
      setLoading(true);
      try {
        setItems(await fetchList(path));
      } finally {
        setLoading(false);
      }
    },
    [fetchList]
  );

  // Clear stale items during render when cwd changes
  const [prevCwd, setPrevCwd] = useState(cwd);
  if (cwd !== prevCwd) {
    setPrevCwd(cwd);
    setItems(null);
    setLoading(true);
  }

  // Fetch on cwd change; state is set only asynchronously, stale responses are ignored
  useEffect(() => {
    let cancelled = false;
    fetchList(cwd)
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cwd, fetchList]);

  return { items, loading, loadList } as const;
}
