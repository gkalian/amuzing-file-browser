// File-system routes aggregator: registers list/stat, preview, download and mutations.
import express from 'express';
import { registerFsListRoutes } from './fs/listRoutes.js';
import { registerFsPreviewRoutes } from './fs/previewRoutes.js';
import { registerFsDownloadRoutes } from './fs/downloadRoutes.js';
import { registerFsMutationRoutes } from './fs/mutationRoutes.js';

export function registerFsRoutes(app: express.Application) {
  registerFsListRoutes(app);
  registerFsPreviewRoutes(app);
  registerFsDownloadRoutes(app);
  registerFsMutationRoutes(app);
}
