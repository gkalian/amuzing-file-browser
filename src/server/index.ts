// Server bootstrap: loads settings, builds the Express app, and starts listening.
// Also installs global error handlers for process-level failures.
// Express server entry: provides config endpoints and filesystem API (list/stat/preview/upload/download)
import { createApp } from './app.js';
import { ensureRootExists, loadInitialSettings, getRoot, getPort } from './config.js';

// Global error logging (unhandled errors)
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

// Bootstrap: ensure root exists, then load settings BEFORE building the app.
// This guarantees runtime limits like maxUploadMB are applied when configuring Multer.
async function bootstrap() {
  // Ensure initial root exists
  ensureRootExists();
  // Load persisted settings (await to apply before app/middleware initialization)
  await loadInitialSettings();

  // Build the app from modular routes and middleware
  const app = createApp();

  // Expose PORT and ROOT for the listen block below (kept for context)
  const PORT = getPort();
  const ROOT = getRoot();

  app.listen(PORT, () => {
    console.log(`FileBrowser server listening on http://0.0.0.0:${PORT} with root ${ROOT}`);
  });
}

// Start the server
bootstrap().catch((err) => {
  console.error('Failed to bootstrap server:', err);
  process.exit(1);
});
