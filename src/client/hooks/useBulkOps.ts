// Hook: bulk filesystem operations (delete, move) with name conflict resolution
import { useCallback } from 'react';
import { api, type FsItem } from '../services/apiClient';
import { joinPath } from '../core/utils';
import { notifyError, notifySuccess } from '../core/notify';

export function useBulkOps(params: {
  cwd: string;
  items: (FsItem[] | null) | undefined;
  loadList: (path: string) => Promise<void> | void;
}) {
  const { cwd, items, loadList } = params;

  const resolveUniquePath = useCallback(
    async (destDir: string, name: string, isDir: boolean) => {
      const dot = name.lastIndexOf('.');
      const hasExt = !isDir && dot > 0;
      const base = hasExt ? name.slice(0, dot) : name;
      const ext = hasExt ? name.slice(dot) : '';
      const baseNoSuffix = base.replace(/\s*\((\d+)\)$/g, '');

      // First try the original name
      let candidate = joinPath(destDir, `${baseNoSuffix}${ext}`);
      try {
        await api.stat(candidate);
      } catch {
        return candidate; // not exists
      }

      // Then try incremental suffixes
      for (let i = 2; i < 1000; i++) {
        candidate = joinPath(destDir, `${baseNoSuffix} (${i})${ext}`);
        try {
          await api.stat(candidate);
        } catch {
          return candidate; // found a free one
        }
      }
      // Fallback: timestamp
      const ts = Date.now();
      return joinPath(destDir, `${baseNoSuffix} (${ts})${ext}`);
    },
    []
  );

  const ensureDestDir = useCallback(async (dest: string) => {
    if (dest === '/') return true;
    try {
      const st = await api.stat(dest);
      if (!st.isDir) {
        notifyError('Destination exists but is not a folder', 'Move failed');
        return false;
      }
      return true;
    } catch {
      try {
        await api.mkdir(dest);
        return true;
      } catch (e: any) {
        notifyError(String(e?.message || e), 'Create destination failed');
        return false;
      }
    }
  }, []);

  const bulkDelete = useCallback(
    async (paths: Set<string>) => {
      if (!paths.size) return { ok: 0, fail: 0 };
      const list = Array.from(paths);
      let ok = 0, fail = 0;
      for (const p of list) {
        try {
          await api.delete(p);
          ok++;
        } catch (e: any) {
          fail++;
          notifyError(`${p}: ${String(e?.message || e)}`, 'Delete failed');
        }
      }
      await loadList(cwd);
      if (ok) notifySuccess(`Deleted ${ok} file(s)`);
      if (fail) notifyError(`Failed to delete ${fail} file(s)`);
      return { ok, fail };
    },
    [cwd, loadList]
  );

  const bulkMove = useCallback(
    async (paths: Set<string>, dest: string) => {
      const destTrim = (dest || '').trim();
      if (!destTrim || !paths.size) return { ok: 0, fail: 0 };
      const okDest = await ensureDestDir(destTrim);
      if (!okDest) return { ok: 0, fail: 1 };

      const all = items || [];
      const byPath = new Map(all.map((it) => [it.path, it] as const));
      const list = Array.from(paths);
      let ok = 0, fail = 0;
      for (const p of list) {
        const it = byPath.get(p);
        if (!it) {
          fail++;
          notifyError(`${p}: not found in list`, 'Move failed');
          continue;
        }
        const to = joinPath(destTrim, it.name);
        if (to === p) continue;
        try {
          const toResolved = await resolveUniquePath(destTrim, it.name, it.isDir);
          await api.rename(p, toResolved);
          ok++;
        } catch (e: any) {
          fail++;
          notifyError(`${it.name}: ${String(e?.message || e)}`, 'Move failed');
        }
      }
      await loadList(cwd);
      if (ok) notifySuccess(`Moved ${ok} file(s)`);
      if (fail) notifyError(`Failed to move ${fail} file(s)`);
      return { ok, fail };
    },
    [cwd, items, loadList, ensureDestDir, resolveUniquePath]
  );

  return { bulkDelete, bulkMove } as const;
}
