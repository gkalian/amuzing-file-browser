// Request logging middleware: emits debug-level access logs using the centralized log() helper.
// Access logs are printed only when LOG_LEVEL >= debug.
import express from 'express';
import { log } from '../log.js';

export function registerLogger(app: express.Application) {
  // Debug-level access logger: prints JSON for every request
  app.use((req, res, next) => {
    const start = Date.now();
    const { method } = req;
    const url = (req as any).originalUrl || req.url;
    const ua = req.get('user-agent') || '';
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const status = res.statusCode;
      const length = res.getHeader('content-length') || '-';
      log('debug', { method, url, status, durationMs, length, ua });
    });
    next();
  });
}
