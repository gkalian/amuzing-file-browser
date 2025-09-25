import { useMemo } from 'react';

export function useNumberFmt() {
  return useMemo(() => new Intl.NumberFormat(), []);
}
