// File-system routes aggregator: registers list/stat, preview, download and mutations.
import express from 'express';
import { fsListRoutes } from './fs/listRoutes.js';
import { fsPreviewRoutes } from './fs/previewRoutes.js';
import { fsDownloadRoutes } from './fs/downloadRoutes.js';
import { fsMutationRoutes } from './fs/mutationRoutes.js';

export function registerFsRoutes(app: express.Application) {
  fsListRoutes(app);
  fsPreviewRoutes(app);
  fsDownloadRoutes(app);
  fsMutationRoutes(app);
}
