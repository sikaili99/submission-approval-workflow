import type { NextFunction, Request, Response } from 'express';

// Minimal CORS for the SPA. CORS_ORIGIN may be a comma-separated allowlist;
// when unset we reflect the request origin (fine for a demo, tightenable in prod).
const allowList = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function cors(req: Request, res: Response, next: NextFunction): void {
  const origin = req.header('origin');
  if (origin && (allowList.length === 0 || allowList.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    res.header('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}
