import express from 'express';
import path from 'path';
import {
  getRoot,
  getMaxUploadMB,
  getAllowedTypes,
  getIgnoreNames,
  setRoot,
  setMaxUploadMB,
  setAllowedTypes,
  setIgnoreNames,
  saveSettings,
  DEFAULT_ALLOWED_TYPES,
} from '../config.js';

export function registerConfigRoutes(app: express.Application) {
  // GET /api/config
  app.get('/api/config', (_req, res) => {
    res.json({
      root: getRoot(),
      maxUploadMB: getMaxUploadMB(),
      allowedTypes: getAllowedTypes() || DEFAULT_ALLOWED_TYPES,
      ignoreNames: getIgnoreNames(),
    });
  });

  // POST /api/config
  app.post('/api/config', async (req, res) => {
    try {
      const { root, maxUploadMB, allowedTypes, ignoreNames } = req.body as {
        root?: string;
        maxUploadMB?: number;
        allowedTypes?: string;
        ignoreNames?: string[];
      };

      if (typeof root === 'string' && root.trim()) {
        const newRoot = path.resolve(root.trim());
        setRoot(newRoot);
      }
      if (typeof maxUploadMB === 'number' && maxUploadMB > 0) {
        setMaxUploadMB(maxUploadMB);
      }
      if (typeof allowedTypes === 'string') {
        setAllowedTypes(allowedTypes);
      }
      if (Array.isArray(ignoreNames)) {
        setIgnoreNames(ignoreNames);
      }

      await saveSettings(getRoot(), {
        root: getRoot(),
        maxUploadMB: getMaxUploadMB(),
        allowedTypes: getAllowedTypes() || DEFAULT_ALLOWED_TYPES,
        ignoreNames: getIgnoreNames(),
      });

      res.json({
        ok: true,
        root: getRoot(),
        maxUploadMB: getMaxUploadMB(),
        allowedTypes: getAllowedTypes() || DEFAULT_ALLOWED_TYPES,
        ignoreNames: getIgnoreNames(),
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
}
