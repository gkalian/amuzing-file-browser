import { isLevelEnabled, type LogLevel } from './config.js';

function nowISO() {
  return new Date().toISOString();
}

export function log(level: LogLevel, data: Record<string, unknown>) {
  if (!isLevelEnabled(level)) return;
  console.log(
    JSON.stringify({
      time: nowISO(),
      level,
      ...data,
    })
  );
}

// Log an action at info level by default.
// base: always included (e.g., path, bytes, count, dest)
// debugExtras: included only when LOG_LEVEL >= debug (e.g., ua, detailed lists)
export function logAction(
  action: string,
  base: Record<string, unknown>,
  debugExtras?: Record<string, unknown>
) {
  const payload = isLevelEnabled('debug') && debugExtras ? { action, ...base, ...debugExtras } : { action, ...base };
  log('info', payload);
}
