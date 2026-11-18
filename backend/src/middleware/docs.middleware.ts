import { NextFunction, Request, Response } from 'express';
import { createHash, timingSafeEqual } from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

// Bandingkan string dengan waktu konstan (anti timing attack).
const safeEqual = (a: string, b: string) => {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
};

export const isDocsEnabled = () => {
  if (!isProduction) return true;
  return (
    process.env.SWAGGER_ENABLED === 'true' &&
    !!process.env.SWAGGER_USERNAME &&
    !!process.env.SWAGGER_PASSWORD
  );
};

/** Header keamanan + Basic Auth untuk halaman dokumentasi. */
export const docsGuard = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (!isProduction) return next();

  const username = process.env.SWAGGER_USERNAME as string;
  const password = process.env.SWAGGER_PASSWORD as string;
  const header = req.headers.authorization || '';

  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    if (sep !== -1) {
      const u = decoded.slice(0, sep);
      const p = decoded.slice(sep + 1);
      // Evaluasi keduanya agar tidak short-circuit.
      const okUser = safeEqual(u, username);
      const okPass = safeEqual(p, password);
      if (okUser && okPass) return next();
    }
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="KompasDesa API Docs", charset="UTF-8"');
  res.status(401).json({ error: 'Autentikasi diperlukan untuk mengakses dokumentasi' });
};
