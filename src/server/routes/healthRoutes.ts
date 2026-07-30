// Health route: readiness/liveness endpoint. Exposes the (masked) root for quick
// diagnostics without leaking the real filesystem path in production.
import express from 'express';
import { getMaskedRoot } from '../config.js';

export function registerHealthRoutes(app: express.Application) {
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, root: getMaskedRoot() });
  });
}
