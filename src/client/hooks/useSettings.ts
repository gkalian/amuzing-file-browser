// Hook: loads/saves server config (root, upload limit, allowed types) with debounced autosave.
import { useEffect, useRef, useState } from 'react';
import { api } from '../services/apiClient';
import { notifyError, notifySuccess } from '../core/notify';

export function useSettings(params: {
  defaultAllowedTypes: string;
  t: (key: string, opts?: any) => string;
}) {
  const { defaultAllowedTypes, t } = params;
  const [cfgRoot, setCfgRoot] = useState('');
  const [cfgMaxUpload, setCfgMaxUpload] = useState<number>(50);
  const [cfgAllowedTypes, setCfgAllowedTypes] = useState<string>(defaultAllowedTypes);

  // track initial config load and last saved snapshot
  const configLoadedRef = useRef(false);
  const lastSavedRef = useRef<{ root: string; maxUploadMB: number; allowedTypes: string } | null>(null);

  // initial load
  useEffect(() => {
    api.getConfig().then((c) => {
      setCfgRoot(c.root);
      setCfgMaxUpload(c.maxUploadMB);
      const allowed = c.allowedTypes ?? defaultAllowedTypes;
      setCfgAllowedTypes(allowed);
      configLoadedRef.current = true;
      lastSavedRef.current = { root: c.root, maxUploadMB: c.maxUploadMB, allowedTypes: allowed };
    });
  }, [defaultAllowedTypes]);

  // Debounced autosave to avoid spamming server on each keystroke
  useEffect(() => {
    const h = setTimeout(async () => {
      if (!configLoadedRef.current) return;
      const current = { root: cfgRoot, maxUploadMB: cfgMaxUpload, allowedTypes: cfgAllowedTypes };
      const last = lastSavedRef.current;
      if (last && last.root === current.root && last.maxUploadMB === current.maxUploadMB && last.allowedTypes === current.allowedTypes) {
        return;
      }
      try {
        await api.setConfig(current);
        lastSavedRef.current = { ...current };
        notifySuccess(
          t('notifications.settingsSaved', { defaultValue: 'Settings saved' }),
          t('settings.title', { defaultValue: 'Settings' })
        );
      } catch (e) {
        notifyError(
          String(e),
          t('notifications.settingsSaveFailed', { defaultValue: 'Settings save failed' })
        );
      }
    }, 600);
    return () => clearTimeout(h);
  }, [cfgRoot, cfgMaxUpload, cfgAllowedTypes, t]);

  return {
    cfgRoot,
    setCfgRoot,
    cfgMaxUpload,
    setCfgMaxUpload,
    cfgAllowedTypes,
    setCfgAllowedTypes,
  } as const;
}
