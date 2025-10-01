// Hook: loads/saves server config (root, upload limit, allowed types) with debounced autosave.
import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/apiClient';
import { notifyError, notifySuccess } from '../../core/notify';
import { formatErrorMessage } from '../../core/errorUtils';

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
  const lastSavedRef = useRef<{
    root: string;
    maxUploadMB: number;
    allowedTypes: string;
    theme: 'light' | 'dark';
  } | null>(null);
  const rootMaskedRef = useRef<boolean>(false);

  // initial load
  useEffect(() => {
    api.getConfig().then((c) => {
      setCfgRoot(c.root);
      setCfgMaxUpload(c.maxUploadMB);
      const allowed = c.allowedTypes ?? defaultAllowedTypes;
      setCfgAllowedTypes(allowed);
      setCfgTheme(c.theme);
      rootMaskedRef.current = Boolean((c as any).rootMasked);
      configLoadedRef.current = true;
      lastSavedRef.current = {
        root: c.root,
        maxUploadMB: c.maxUploadMB,
        allowedTypes: allowed,
        theme: c.theme,
      };
    });
  }, [defaultAllowedTypes]);

  // Debounced autosave to avoid spamming server on each keystroke
  useEffect(() => {
    const h = setTimeout(async () => {
      if (!configLoadedRef.current) return;
      // Build minimal payload: only include changed fields; avoid sending masked root back.
      const last = lastSavedRef.current;
      const payload: any = {};
      const rootMasked = rootMaskedRef.current;

      // Include root only if it changed and either not masked or user typed a value other than '/'
      if (!last || cfgRoot !== last.root) {
        if (!rootMasked || cfgRoot !== '/') {
          payload.root = cfgRoot;
        }
      }
      if (!last || cfgMaxUpload !== last.maxUploadMB) payload.maxUploadMB = cfgMaxUpload;
      if (!last || cfgAllowedTypes !== last.allowedTypes) payload.allowedTypes = cfgAllowedTypes;
      if (!last || cfgTheme !== last.theme) payload.theme = cfgTheme;

      // If nothing changed (or root was masked and unchanged), skip save
      if (Object.keys(payload).length === 0) return;

      try {
        const saved = await api.setConfig(payload);
        // Update lastSaved snapshot, merging only fields we sent and what server returned
        lastSavedRef.current = {
          root: saved.root ?? last?.root ?? cfgRoot,
          maxUploadMB: saved.maxUploadMB ?? last?.maxUploadMB ?? cfgMaxUpload,
          allowedTypes: saved.allowedTypes ?? last?.allowedTypes ?? cfgAllowedTypes,
          theme: saved.theme ?? last?.theme ?? cfgTheme,
        };
        notifySuccess(t('notifications.settingsSaved', { defaultValue: 'Settings saved' }));
      } catch (e) {
        notifyError(
          formatErrorMessage(
            e,
            t('notifications.settingsSaveFailed', { defaultValue: 'Settings save failed' })
          ),
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
