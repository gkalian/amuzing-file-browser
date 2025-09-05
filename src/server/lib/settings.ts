// Settings persistence helpers: read/write .settings.json under a directory.
// Provides SettingsDoc type and loadSettings/saveSettings functions for config routes and init.
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

export async function saveSettings(
  dir: string,
  data: Required<NonNullable<SettingsDoc>>
): Promise<void> {
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
