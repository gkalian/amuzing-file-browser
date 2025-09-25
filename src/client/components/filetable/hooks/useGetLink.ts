import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../../services/apiClient';
import { notifyError, notifySuccess } from '../../../core/notify';

export function useGetLink() {
  const { t } = useTranslation();
  return useCallback(async (path: string) => {
    const url = await api.publicFileUrl(path);
    try {
      await navigator.clipboard.writeText(url);
      notifySuccess(t('notifications.linkCopied', { defaultValue: 'Link copied: {{url}}', url }));
    } catch (e: any) {
      notifyError(
        t('notifications.copyLinkFailed', { defaultValue: 'Failed to copy link' }) +
          (e?.message ? `: ${e.message}` : ''),
        t('notifications.copyLinkFailed', { defaultValue: 'Failed to copy link' })
      );
    }
  }, [t]);
}
