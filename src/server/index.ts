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

// Ensure initial root exists, then load persisted settings asynchronously
ensureRootExists();
(async () => {
  await loadInitialSettings();
})();

// Build the app from modular routes and middleware
const app = createApp();

// Expose PORT and ROOT for the listen block below (kept for context)
const PORT = getPort();
const ROOT = getRoot();

app.listen(PORT, () => {
  console.log(`FileBrowser server listening on http://0.0.0.0:${PORT} with root ${ROOT}`);
});
