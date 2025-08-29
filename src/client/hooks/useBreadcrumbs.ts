// Hook: builds breadcrumb nodes from current working directory (cwd) and a root label.
import { useMemo } from 'react';

export function useBreadcrumbs(cwd: string, rootLabel: string) {
  return useMemo(() => {
    const segs = cwd.split('/').filter(Boolean);
    const nodes: { label: string; path: string }[] = [
      { label: rootLabel, path: '/' },
    ];
    let acc = '';
    for (const s of segs) {
      acc += '/' + s;
      nodes.push({ label: s, path: acc });
    }
    return nodes;
  }, [cwd, rootLabel]);
}
