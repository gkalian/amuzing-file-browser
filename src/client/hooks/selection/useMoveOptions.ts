// Hook: build list of destination options for Move modal
import type { FsItem } from '../../services/apiClient';

export function useMoveOptions(cwd: string, items: (FsItem[] | null) | undefined, moveDest: string) {
  // keep it simple: compute on call; caller can memoize if needed
  const set = new Set<string>();
  set.add('/');
  set.add(cwd);
  (items || []).forEach((it) => { if ((it as any).isDir) set.add((it as any).path as string); });
  if (moveDest) set.add(moveDest);
  return Array.from(set);
}
