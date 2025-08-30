// Runtime configuration and settings persistence for the server.
// Holds mutable state (root, upload limits, ignore list, log level),
// reads/writes .settings.json, and exposes helpers like isLevelEnabled(LOG_LEVEL).
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

export type SettingsDoc = {
  root?: string;
  maxUploadMB?: number;
  allowedTypes?: string;
  ignoreNames?: string[];
  theme?: 'light' | 'dark';
} | null;

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
  maxUploadMB: process.env.FILEBROWSER_MAX_UPLOAD_MB ? Number(process.env.FILEBROWSER_MAX_UPLOAD_MB) : 50,
  allowedTypes: undefined as string | undefined,
  ignoreNames: ['.settings.json'] as string[],
  logLevel: normalizeLogLevel(process.env.LOG_LEVEL),
  theme: 'light' as 'light' | 'dark',
};

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

// Returns true when the requested level is enabled according to current LOG_LEVEL
export function isLevelEnabled(level: LogLevel) {
  const idx = LEVEL_ORDER.indexOf(level);
  const cur = LEVEL_ORDER.indexOf(state.logLevel);
  return idx <= cur;
}

// Mutators
export function setRoot(newRoot: string) {
  state.root = path.resolve(newRoot);
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

// Settings helpers (.settings.json lives under current root)
export function settingsPath(dir: string) {
  return path.join(dir, '.settings.json');
}

export async function loadSettings(dir: string): Promise<SettingsDoc> {
  try {
    const p = settingsPath(dir);
    const exists = fs.existsSync(p);
    if (!exists) return null;
    const txt = await fsp.readFile(p, 'utf8');
    const data = JSON.parse(txt) as SettingsDoc;
    return data || null;
  } catch {
    return null;
  }
}

export async function saveSettings(dir: string, data: Required<NonNullable<SettingsDoc>>) {
  try {
    const p = settingsPath(dir);
    const doc = JSON.stringify(
      {
        root: data.root,
        maxUploadMB: data.maxUploadMB,
        allowedTypes: data.allowedTypes,
        ignoreNames: data.ignoreNames,
        theme: data.theme,
      },
      null,
      2
    );
    await fsp.writeFile(p, doc, 'utf8');
  } catch (e) {
    console.warn('Failed to write settings:', e);
  }
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
