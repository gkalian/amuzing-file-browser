// Hook: build list of destination options for Move modal
import type { FsItem } from '../../core/types';

export function useMoveOptions(cwd: string, items: FsItem[] | null | undefined, moveDest: string) {
  // keep it simple: compute on call; caller can memoize if needed
  const set = new Set<string>();
  set.add('/');
  if (cwd) set.add(cwd);
  (items || []).forEach((it) => {
    if (it.isDir && it.path) set.add(it.path);
  });
  if (moveDest) set.add(moveDest);
  return Array.from(set);
}
