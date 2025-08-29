import express from 'express';
import { getRoot } from '../config.js';

export function registerHealthRoutes(app: express.Application) {
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, root: getRoot() });
  });
}
