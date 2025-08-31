// Hook: sync Mantine color scheme attribute with current theme
import { useEffect } from 'react';

export function useThemeSync(theme: 'light' | 'dark') {
  useEffect(() => {
    document.documentElement.setAttribute('data-mantine-color-scheme', theme);
  }, [theme]);
}
