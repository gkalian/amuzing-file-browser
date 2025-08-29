import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type FsItem } from '../services/apiClient';

export type UiFsItem = FsItem & { displaySize: string; displayMtime: string };

export function useFileList(cwd: string) {
  const numberFmt = useMemo(() => new Intl.NumberFormat(), []);
  const [items, setItems] = useState<UiFsItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const loadList = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const data = await api.list(path);
      const enriched: UiFsItem[] = data.items
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
      setItems(enriched);
    } finally {
      setLoading(false);
    }
  }, [numberFmt]);

  useEffect(() => {
    setItems(null);
    loadList(cwd);
  }, [cwd, loadList]);

  return { items, loading, loadList } as const;
}
