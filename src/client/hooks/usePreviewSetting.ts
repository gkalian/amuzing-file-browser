// Hook: persisted preview visibility setting using localStorage
import { useEffect, useState } from 'react';

export function usePreviewSetting(defaultValue = true) {
  const [showPreview, setShowPreview] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('showPreview');
      return v ? v === 'true' : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('showPreview', String(showPreview));
    } catch (e) {
      // noop
    }
  }, [showPreview]);

  return { showPreview, setShowPreview } as const;
}
