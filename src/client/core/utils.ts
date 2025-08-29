// Client-side helpers: path operations and human-readable size formatting

export function joinPath(base: string, name: string) {
  const p = `${base}/${name}`.replace(/\\/g, '/').replace(/\/\/+/g, '/');
  return p.startsWith('/') ? p : '/' + p;
}

export function parentPath(p: string) {
  if (!p || p === '/') return '/';
  const segs = p.split('/').filter(Boolean);
  segs.pop();
  return '/' + segs.join('/');
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
