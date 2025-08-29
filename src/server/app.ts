import express from 'express';
import path from 'path';
import { registerLogger } from './middleware/logger.js';
import { registerConfigRoutes } from './routes/configRoutes.js';
import { registerHealthRoutes } from './routes/healthRoutes.js';
import { registerFsRoutes } from './routes/fsRoutes.js';
import { createMulter, preUploadLimitCheck } from './upload.js';
import { getRoot } from './config.js';

export function createApp() {
  const app = express();

  // Body parsing
  app.use(express.json({ limit: '5mb' }));

  // Logger
  registerLogger(app);

  // Routes
  registerHealthRoutes(app);
  registerConfigRoutes(app);
  registerFsRoutes(app);

  // Upload
  const upload = createMulter();
  app.post(
    '/api/fs/upload',
    preUploadLimitCheck(),
    upload.array('files'),
    async (req, res) => {
      res.json({
        ok: true,
        files:
          (req.files as Express.Multer.File[] | undefined)?.map((f) => ({
            originalname: f.originalname,
            size: f.size,
            path: path.posix.join('/', path.relative(getRoot(), f.path).split(path.sep).join('/')),
          })) || [],
      });
    }
  );

  // Production: serve client
  if (process.env.NODE_ENV === 'production') {
    const dist = path.join(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  return app;
}
