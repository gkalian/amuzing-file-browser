// Request logging middleware: emits debug-level access logs using the centralized log() helper.
// Access logs are printed only when LOG_LEVEL >= debug. Also generates and propagates X-Request-Id.
import express from 'express';
import crypto from 'crypto';
import { log } from '../log.js';

export function registerLogger(app: express.Application) {
  // Generate/propagate X-Request-Id
  app.use((req, res, next) => {
    const fromHeader = (req.headers['x-request-id'] as string) || '';
    const requestId = fromHeader || crypto.randomBytes(8).toString('hex');
    (res.locals as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  // Debug-level access logger: prints JSON for every request
  app.use((req, res, next) => {
    const start = Date.now();
    const { method } = req;
    const url = (req as any).originalUrl || req.url;
    const ua = req.get('user-agent') || '';
    const ip = req.ip;
    const xff = (req.headers['x-forwarded-for'] as string) || '';
    const host = (req.headers['x-forwarded-host'] as string) || (req.headers['host'] as string) || '';
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const status = res.statusCode;
      const length = res.getHeader('content-length') || '-';
      const requestId = (res.locals as any)?.requestId;
      log('debug', { method, url, status, durationMs, length, ua, ip, xff, host, requestId });
    });
    next();
  });
}
