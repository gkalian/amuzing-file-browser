// Express app assembler: wires middleware, routes and upload endpoint.
// In production it also serves the built client from /dist.
import express from 'express';
import path from 'path';
import { registerLogger } from './middleware/logger.js';
import { hostGate } from './middleware/hostGate.js';
import { registerConfigRoutes } from './routes/configRoutes.js';
import { registerHealthRoutes } from './routes/healthRoutes.js';
import { registerFsRoutes } from './routes/fsRoutes.js';
import { registerFilesRoutes } from './routes/files.js';
import { createMulter, preUploadLimitCheck } from './upload.js';
import { toApiPath } from './paths.js';
import { logAction } from './log.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Body parsing
  app.use(express.json({ limit: '5mb' }));

  // Logger
  registerLogger(app);

  // Host-based access control (media vs admin domains)
  app.use(hostGate());

  // Routes
  registerHealthRoutes(app);
  registerConfigRoutes(app);
  registerFsRoutes(app);
  registerFilesRoutes(app);

  // Upload
  const upload = createMulter();
  app.post('/api/fs/upload', preUploadLimitCheck(), upload.array('files'), async (req, res) => {
    const files =
      (req.files as Express.Multer.File[] | undefined)?.map((f) => ({
        originalname: f.originalname,
        filename: path.basename(f.path),
        size: f.size,
        path: toApiPath(f.path),
      })) || [];

    const totalBytes = files.reduce((acc, f) => acc + (typeof f.size === 'number' ? f.size : 0), 0);
    const dest = String((req.query as any).path || '/');
    // Action log (base at info, extras at debug)
    logAction(
      'upload',
      { count: files.length, totalBytes, dest },
      {
        files:
          files.map((f) => ({
            name: f.originalname,
            saved: f.filename,
            size: f.size,
            path: f.path,
          })) || '',
      }
    );

    res.json({ ok: true, files });
  });

  // Production: serve client
  if (process.env.NODE_ENV === 'production') {
    const dist = path.join(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  // Centralized error handler (must be last)
  app.use(errorHandler());

  return app;
}
