// Filesystem safety helpers: allowed-types check and (future) filename/path sanitization.
// Exposes isAllowedType(name, allowed) and can be extended with sanitizeFilename/safeJoin variants later.

/**
 * Check if a filename matches one of the allowed extensions.
 * @param filename original filename (may include extension)
 * @param allowed list of allowed extensions, either as comma-separated string or array of strings
 */
export function isAllowedType(
  filename: string,
  allowed: string | string[] | undefined
): boolean {
  const list = (Array.isArray(allowed) ? allowed : String(allowed || '')
    .split(',')).map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return true; // empty list means allow all
  const name = filename || '';
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
  return list.includes(ext);
}

// Placeholder for future helpers:
// export function sanitizeFilename(name: string): string { ... }
// export function safeJoin(root: string, rel: string): string { ... }
