// Runtime configuration for the server: holds mutable state (root, limits, ignore list, log level)
// and exposes getters/setters and helpers like isLevelEnabled(LOG_LEVEL). Settings persistence is moved to lib/settings.
import fs from 'fs';
import path from 'path';
import { loadSettings } from './lib/settings.js';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVEL_ORDER: LogLevel[] = ['error', 'warn', 'info', 'debug'];
// Normalize string env value to a valid LogLevel (defaults to 'info').
function normalizeLogLevel(v: string | undefined): LogLevel {
  const x = String(v || '').toLowerCase();
  if (LEVEL_ORDER.includes(x as LogLevel)) return x as LogLevel;
  return 'info';
}

export const DEFAULT_ALLOWED_TYPES = 'jpg, jpeg, gif, png, webp, 7z, zip';

// Backing store (mutable at runtime)
const state = {
  port: process.env.PORT ? Number(process.env.PORT) : 8080,
  root: path.resolve(process.env.FILEBROWSER_ROOT || path.join(process.cwd(), 'data')),
  maxUploadMB: process.env.FILEBROWSER_MAX_UPLOAD_MB
    ? Number(process.env.FILEBROWSER_MAX_UPLOAD_MB)
    : 50,
  allowedTypes: undefined as string | undefined,
  ignoreNames: ['.settings.json'] as string[],
  logLevel: normalizeLogLevel(process.env.LOG_LEVEL),
  theme: 'light' as 'light' | 'dark',
  adminDomain: String(process.env.ADMIN_DOMAIN || ''),
  mediaDomain: String(process.env.MEDIA_DOMAIN || ''),
};

// Capture the initial root at startup and resolve its real path. We will use this
// to ensure that any runtime changes to the root cannot escape outside the
// originally mounted directory tree (e.g., container volume at /data).
const INITIAL_ROOT = state.root;
let INITIAL_ROOT_REAL: string;
try {
  // Ensure the initial root exists so realpathSync succeeds (created later as well)
  fs.mkdirSync(INITIAL_ROOT, { recursive: true });
  INITIAL_ROOT_REAL = fs.realpathSync(INITIAL_ROOT);
} catch {
  // Fallback to resolved initial root if realpath fails for any reason
  INITIAL_ROOT_REAL = path.resolve(INITIAL_ROOT);
}

// Accessors
export function getPort() {
  return state.port;
}
export function getRoot() {
  return state.root;
}
export function getMaxUploadMB() {
  return state.maxUploadMB;
}
export function getAllowedTypes() {
  return state.allowedTypes ?? DEFAULT_ALLOWED_TYPES;
}
export function getIgnoreNames() {
  return state.ignoreNames;
}
export function getLogLevel(): LogLevel {
  return state.logLevel;
}
export function getTheme(): 'light' | 'dark' {
  return state.theme;
}

// Domains (used by host-based routing)
export function getAdminDomain() {
  return state.adminDomain;
}
export function getMediaDomain() {
  return state.mediaDomain;
}

// Returns true when the requested level is enabled according to current LOG_LEVEL
export function isLevelEnabled(level: LogLevel) {
  const idx = LEVEL_ORDER.indexOf(level);
  const cur = LEVEL_ORDER.indexOf(state.logLevel);
  return idx <= cur;
}

// Mutators
export function setRoot(newRoot: string) {
  const candidate = path.resolve(newRoot);
  // Ensure the candidate exists (or at least its parent) to obtain a stable realpath
  try {
    fs.mkdirSync(candidate, { recursive: true });
  } catch {
    // ignore mkdir errors; realpath may still work if it already exists
  }
  let candidateReal = candidate;
  try {
    candidateReal = fs.realpathSync(candidate);
  } catch {
    // If realpath fails (e.g., path does not exist yet), validate using its parent
    try {
      const parentReal = fs.realpathSync(path.dirname(candidate));
      candidateReal = path.join(parentReal, path.basename(candidate));
    } catch {
      // As a last resort, keep the resolved candidate
      candidateReal = candidate;
    }
  }
  // Validate: candidateReal must be inside INITIAL_ROOT_REAL (or equal)
  const rel = path.relative(INITIAL_ROOT_REAL, candidateReal);
  const inside = rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  if (!inside) {
    const err: any = new Error('New root must be inside the initially configured root');
    err.status = 403;
    err.appCode = 'forbidden_root_change';
    throw err;
  }
  state.root = candidateReal;
}
export function setMaxUploadMB(n: number) {
  state.maxUploadMB = Math.min(Math.max(1, Math.floor(n)), 1024); // clamp 1..1024 MB
}
export function setAllowedTypes(v: string | undefined) {
  state.allowedTypes = v;
}
export function setIgnoreNames(v: string[]) {
  state.ignoreNames = v.filter((s) => typeof s === 'string' && s.length > 0);
}
export function setLogLevel(v: string | LogLevel) {
  state.logLevel = normalizeLogLevel(String(v));
}
export function setTheme(v: string | 'light' | 'dark') {
  const x = String(v || '').toLowerCase();
  state.theme = x === 'dark' ? 'dark' : 'light';
}

export function setAdminDomain(v: string) {
  state.adminDomain = String(v || '');
}
export function setMediaDomain(v: string) {
  state.mediaDomain = String(v || '');
}

export function ensureRootExists() {
  fs.mkdirSync(state.root, { recursive: true });
}

// Initialize from persisted settings (if present)
export async function loadInitialSettings() {
  const s = await loadSettings(state.root);
  if (s) {
    if (typeof s.root === 'string' && s.root.trim()) {
      setRoot(s.root.trim());
      ensureRootExists();
    }
    if (typeof s.maxUploadMB === 'number' && s.maxUploadMB > 0) {
      setMaxUploadMB(s.maxUploadMB);
    }
    if (typeof s.allowedTypes === 'string') {
      setAllowedTypes(s.allowedTypes);
    }
    if (Array.isArray(s.ignoreNames)) {
      setIgnoreNames(s.ignoreNames);
    }
    if (s.theme === 'light' || s.theme === 'dark') {
      setTheme(s.theme);
    }
  }
  // ensure defaults
  if (!state.allowedTypes) state.allowedTypes = DEFAULT_ALLOWED_TYPES;
}
