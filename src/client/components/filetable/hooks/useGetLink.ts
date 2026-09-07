import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../../services/apiClient';
import { notifyError, notifySuccess } from '../../../core/notify';

export function useGetLink() {
  const { t } = useTranslation();
  return useCallback(
    async (path: string) => {
      const url = await api.publicFileUrl(path);
      try {
        await navigator.clipboard.writeText(url);
        notifySuccess(t('notifications.linkCopied', { defaultValue: 'Link copied: {{url}}', url }));
      } catch (e) {
        const detail = e instanceof Error ? e.message : '';
        notifyError(
          t('notifications.copyLinkFailed', { defaultValue: 'Failed to copy link' }) +
            (detail ? `: ${detail}` : ''),
          t('notifications.copyLinkFailed', { defaultValue: 'Failed to copy link' })
        );
      }
    },
    [t]
  );
}
