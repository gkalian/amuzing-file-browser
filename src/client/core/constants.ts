// Shared client-side constants.

// Fallback list of allowed upload extensions, used until the server config
// (/api/config) is loaded. Keep in sync with the server default in
// src/server/config.ts (DEFAULT_ALLOWED_TYPES).
export const DEFAULT_ALLOWED_TYPES = 'jpg, jpeg, gif, png, webp, 7z, zip';
