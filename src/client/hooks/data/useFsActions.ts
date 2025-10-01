// Hook: unified filesystem actions (mkdir, rename, bulkDelete, bulkMove)
// Combines logic from useFileSystemOps and useBulkOps with notifications and list refresh
import { useCallback } from 'react';
import { api } from '../../services/apiClient';
import type { FsItem } from '../../core/types';
import { notifyError, notifySuccess } from '../../core/notify';
import { formatErrorMessage } from '../../core/errorUtils';
import { joinPath, parentPath } from '../../core/utils';
import { useTranslation } from 'react-i18next';

export function useFsActions(params: {
  cwd: string;
  items: (FsItem[] | null) | undefined;
  loadList: (path: string) => Promise<void> | void;
  t: (key: string, opts?: any) => string;
}) {
  const { cwd, items, loadList, t } = params;
  const { t: tHook } = useTranslation();
  const tt = t || tHook; // prefer provided t; fallback to i18n hook

  const mkdir = useCallback(
    async (name: string) => {
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      try {
        const resp = await api.mkdir(joinPath(cwd, trimmed));
        const shown = resp?.name || trimmed;
        notifySuccess(
          tt('notifications.mkdirSuccess', {
            defaultValue: 'Folder created: {{name}}',
            name: shown,
          })
        );
        await loadList(cwd);
      } catch (e: any) {
        notifyError(
          formatErrorMessage(
            e,
            tt('notifications.mkdirFailed', { defaultValue: 'Create Folder failed' })
          ),
          tt('notifications.mkdirFailed', { defaultValue: 'Create Folder failed' })
        );
        throw e;
      }
    },
    [cwd, loadList, tt]
  );

  const rename = useCallback(
    async (item: FsItem, newName: string) => {
      const trimmed = (newName || '').trim();
      if (!trimmed) return;
      try {
        const to = joinPath(parentPath(item.path), trimmed);
        await api.rename(item.path, to);
        notifySuccess(
          tt('notifications.renameSuccess', { defaultValue: 'Renamed to: {{name}}', name: trimmed })
        );
        await loadList(cwd);
      } catch (e: any) {
        notifyError(
          formatErrorMessage(
            e,
            tt('notifications.renameFailed', { defaultValue: 'Rename failed' })
          ),
          tt('notifications.renameFailed', { defaultValue: 'Rename failed' })
        );
        throw e;
      }
    },
    [cwd, loadList, tt]
  );

  const bulkDelete = useCallback(
    async (paths: Set<string>) => {
      if (!paths.size) return { ok: 0, fail: 0 } as const;
      const list = Array.from(paths);
      let ok = 0,
        fail = 0;
      for (const p of list) {
        try {
          await api.delete(p);
          ok++;
        } catch (e: any) {
          fail++;
          notifyError(
            `${p}: ${formatErrorMessage(
              e,
              tt('notifications.deleteFailed', { defaultValue: 'Delete failed' })
            )}`,
            tt('notifications.deleteFailed', { defaultValue: 'Delete failed' })
          );
        }
      }
      await loadList(cwd);
      if (ok)
        notifySuccess(
          tt('notifications.bulkDeleteSuccess', {
            defaultValue: 'Deleted {{count}} file(s)',
            count: ok,
          })
        );
      if (fail)
        notifyError(
          tt('notifications.bulkDeleteFailed', {
            defaultValue: 'Failed to delete {{count}} file(s)',
            count: fail,
          })
        );
      return { ok, fail } as const;
    },
    [cwd, loadList, tt]
  );

  const resolveUniquePath = useCallback(async (destDir: string, name: string, isDir: boolean) => {
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
  }, []);

  const ensureDestDir = useCallback(
    async (dest: string) => {
      if (dest === '/') return true;
      try {
        const st = await api.stat(dest);
        if (!st.isDir) {
          notifyError(
            tt('notifications.destNotFolder', {
              defaultValue: 'Destination exists but is not a folder',
            }),
            tt('notifications.moveFailed', { defaultValue: 'Move failed' })
          );
          return false;
        }
        return true;
      } catch {
        try {
          await api.mkdir(dest);
          return true;
        } catch (e: any) {
          notifyError(
            formatErrorMessage(
              e,
              tt('notifications.createDestFailed', { defaultValue: 'Create destination failed' })
            ),
            tt('notifications.createDestFailed', { defaultValue: 'Create destination failed' })
          );
          return false;
        }
      }
    },
    [tt]
  );

  const bulkMove = useCallback(
    async (paths: Set<string>, dest: string) => {
      const destTrim = (dest || '').trim();
      if (!destTrim || !paths.size) return { ok: 0, fail: 0 } as const;
      const okDest = await ensureDestDir(destTrim);
      if (!okDest) return { ok: 0, fail: 1 } as const;

      const all = items || [];
      const byPath = new Map(all.map((it) => [it.path, it] as const));
      const list = Array.from(paths);
      let ok = 0,
        fail = 0;
      for (const p of list) {
        const it = byPath.get(p);
        if (!it) {
          fail++;
          notifyError(
            tt('notifications.itemNotFound', { defaultValue: 'Item not found in list' }) + `: ${p}`,
            tt('notifications.moveFailed', { defaultValue: 'Move failed' })
          );
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
          notifyError(
            `${it.name}: ${formatErrorMessage(
              e,
              tt('notifications.moveFailed', { defaultValue: 'Move failed' })
            )}`,
            tt('notifications.moveFailed', { defaultValue: 'Move failed' })
          );
        }
      }
      await loadList(cwd);
      if (ok)
        notifySuccess(
          tt('notifications.bulkMoveSuccess', {
            defaultValue: 'Moved {{count}} file(s)',
            count: ok,
          })
        );
      if (fail)
        notifyError(
          tt('notifications.bulkMoveFailed', {
            defaultValue: 'Failed to move {{count}} file(s)',
            count: fail,
          })
        );
      return { ok, fail } as const;
    },
    [cwd, items, loadList, ensureDestDir, resolveUniquePath, tt]
  );

  return { mkdir, rename, bulkDelete, bulkMove } as const;
}
