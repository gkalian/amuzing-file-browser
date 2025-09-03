// Host-based access control middleware
// - filesDomain: only allow GET requests to /files/*, /api/fs/preview, /api/fs/download, /api/health
// - adminDomain: full access (UI + API)
// - if domains are not set (local dev), no restrictions are applied
import type { Request, Response, NextFunction } from 'express';
import { getAdminDomain, getMediaDomain } from '../config.js';

function normalizeHost(h?: string) {
  const v = (h || '').toLowerCase();
  // strip :port if present
  const i = v.indexOf(':');
  return i >= 0 ? v.slice(0, i) : v;
}

export function hostGate() {
  const adminDomain = (getAdminDomain() || '').toLowerCase();
  const mediaDomain = (getMediaDomain() || '').toLowerCase();

  const hasRules = Boolean(adminDomain || mediaDomain);

  return function (req: Request, res: Response, next: NextFunction) {
    // Always allow kubelet probes regardless of host
    if (req.method === 'GET' && req.path === '/api/health') return next();

    if (!hasRules) return next(); // local/dev: no host restrictions

    const host = normalizeHost(req.get('host'));

    if (mediaDomain && host === mediaDomain) {
      // Only allow GETs to file-serving endpoints
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      const p = req.path;
      const ok =
        p === '/api/health' ||
        p.startsWith('/files/') ||
        p === '/api/fs/preview' ||
        p === '/api/fs/download';
      if (!ok) {
        return res.status(404).json({ error: 'Not found' });
      }
      return next();
    }

    if (adminDomain && host === adminDomain) {
      // Full access
      return next();
    }

    // Unknown host while rules are active
    return res.status(404).json({ error: 'Unknown host' });
  };
}
