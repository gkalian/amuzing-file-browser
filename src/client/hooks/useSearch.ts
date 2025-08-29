import { startTransition, useCallback, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';

export function useSearch(initial = '') {
  const [search, setSearch] = useState(initial);
  const [debouncedSearch] = useDebouncedValue(search, 200);
  const setSearchTransition = useCallback((v: string) => {
    startTransition(() => setSearch(v));
  }, []);
  return { search, setSearchTransition, debouncedSearch } as const;
}
