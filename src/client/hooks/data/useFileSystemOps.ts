// Hook: filesystem operations (mkdir, delete, rename) with notifications and list refresh.
import { useCallback } from 'react';
import { api } from '../../services/apiClient';
import type { FsItem } from '../../core/types';
import { notifyError, notifySuccess } from '../../core/notify';
import { formatErrorMessage, toErrorDetails } from '../../core/errorUtils';
import { joinPath, parentPath } from '../../core/utils';

export function useFileSystemOps(params: {
  cwd: string;
  t: (key: string, opts?: any) => string;
  loadList: (path: string) => Promise<void> | void;
}) {
  const { cwd, t, loadList } = params;

  const mkdir = useCallback(
    async (name: string) => {
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      try {
        const resp = await api.mkdir(joinPath(cwd, trimmed));
        const shown = resp?.name || trimmed;
        notifySuccess(
          t('notifications.mkdirSuccess', { defaultValue: 'Folder created: {{name}}', name: shown })
        );
        await loadList(cwd);
      } catch (e: any) {
        notifyError(
          formatErrorMessage(
            e,
            t('notifications.mkdirFailed', { defaultValue: 'Create Folder failed' })
          ),
          t('notifications.mkdirFailed', { defaultValue: 'Create Folder failed' })
        );
        throw e;
      }
    },
    [cwd, loadList, t]
  );

  const remove = useCallback(
    async (item: FsItem) => {
      try {
        await api.delete(item.path);
        notifySuccess(
          t('notifications.deleteSuccess', { defaultValue: 'Deleted: {{name}}', name: item.name })
        );
        await loadList(cwd);
      } catch (e: any) {
        notifyError(
          formatErrorMessage(e, t('notifications.deleteFailed', { defaultValue: 'Delete failed' })),
          t('notifications.deleteFailed', { defaultValue: 'Delete failed' })
        );
        throw e;
      }
    },
    [cwd, loadList, t]
  );

  const rename = useCallback(
    async (item: FsItem, newName: string) => {
      const trimmed = (newName || '').trim();
      if (!trimmed) return;
      try {
        const to = joinPath(parentPath(item.path), trimmed);
        await api.rename(item.path, to);
        notifySuccess(
          t('notifications.renameSuccess', { defaultValue: 'Renamed to: {{name}}', name: trimmed })
        );
        await loadList(cwd);
      } catch (e: any) {
        notifyError(
          formatErrorMessage(e, t('notifications.renameFailed', { defaultValue: 'Rename failed' })),
          t('notifications.renameFailed', { defaultValue: 'Rename failed' })
        );
        throw e;
      }
    },
    [cwd, loadList, t]
  );

  return { mkdir, remove, rename } as const;
}
