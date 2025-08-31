// Hook: loads/saves server config (root, upload limit, allowed types) with debounced autosave.
import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/apiClient';
import { notifyError, notifySuccess } from '../../core/notify';

export function useSettings(params: {
  defaultAllowedTypes: string;
  t: (key: string, opts?: any) => string;
}) {
  const { defaultAllowedTypes, t } = params;
  const [cfgRoot, setCfgRoot] = useState('');
  const [cfgMaxUpload, setCfgMaxUpload] = useState<number>(50);
  const [cfgAllowedTypes, setCfgAllowedTypes] = useState<string>(defaultAllowedTypes);
  const [cfgTheme, setCfgTheme] = useState<'light' | 'dark'>('light');

  // track initial config load and last saved snapshot
  const configLoadedRef = useRef(false);
  const lastSavedRef = useRef<{ root: string; maxUploadMB: number; allowedTypes: string; theme: 'light' | 'dark' } | null>(null);

  // initial load
  useEffect(() => {
    api.getConfig().then((c) => {
      setCfgRoot(c.root);
      setCfgMaxUpload(c.maxUploadMB);
      const allowed = c.allowedTypes ?? defaultAllowedTypes;
      setCfgAllowedTypes(allowed);
      setCfgTheme(c.theme);
      configLoadedRef.current = true;
      lastSavedRef.current = { root: c.root, maxUploadMB: c.maxUploadMB, allowedTypes: allowed, theme: c.theme };
    });
  }, [defaultAllowedTypes]);

  // Debounced autosave to avoid spamming server on each keystroke
  useEffect(() => {
    const h = setTimeout(async () => {
      if (!configLoadedRef.current) return;
      const current = { root: cfgRoot, maxUploadMB: cfgMaxUpload, allowedTypes: cfgAllowedTypes, theme: cfgTheme };
      const last = lastSavedRef.current;
      if (
        last &&
        last.root === current.root &&
        last.maxUploadMB === current.maxUploadMB &&
        last.allowedTypes === current.allowedTypes &&
        last.theme === current.theme
      ) {
        return;
      }
      try {
        await api.setConfig(current);
        lastSavedRef.current = { ...current } as any;
        notifySuccess(t('notifications.settingsSaved', { defaultValue: 'Settings saved' }));
      } catch (e) {
        notifyError(
          String(e),
          t('notifications.settingsSaveFailed', { defaultValue: 'Settings save failed' })
        );
      }
    }, 600);
    return () => clearTimeout(h);
  }, [cfgRoot, cfgMaxUpload, cfgAllowedTypes, cfgTheme, t]);

  return {
    cfgRoot,
    setCfgRoot,
    cfgMaxUpload,
    setCfgMaxUpload,
    cfgAllowedTypes,
    setCfgAllowedTypes,
    cfgTheme,
    setCfgTheme,
  } as const;
}
