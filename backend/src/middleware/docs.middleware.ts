import { NextFunction, Request, Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

/** Map untuk tracking percobaan login gagal per IP (memory-only). */
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

/** Hanya production yang memerlukan proteksi dokumentasi dengan Basic Auth. */
export const isDocsEnabled = () => {
    if (!isProduction) return true;
    return !!process.env.SWAGGER_USERNAME && !!process.env.SWAGGER_PASSWORD;
};

export const docsGuard = (req: Request, res: Response, next: NextFunction) => {
    // Header keamanan agar tidak ter-index oleh mesin pencari
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');

    if (!isProduction) return next();

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 menit
    const maxAttempts = 10;

    // Reset jika window waktu habis
    const record = failedAttempts.get(clientIp);
    if (record && now > record.resetAt) {
        failedAttempts.delete(clientIp);
    }

    // Blokir jika melebihi batas
    if (record && record.count >= maxAttempts) {
        res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' });
        return;
    }

    const authHeader = req.headers.authorization || '';

    // Production: perlu login Basic Auth
    if (!authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="API Docs"');
        res.status(401).json({ error: 'Autentikasi diperlukan untuk mengakses dokumentasi' });
        // Catat percobaan gagal
        const existing = failedAttempts.get(clientIp) ?? { count: 0, resetAt: now + windowMs };
        existing.count++;
        failedAttempts.set(clientIp, existing);
        return;
    }

    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
    const sepIndex = credentials.indexOf(':');
    if (sepIndex === -1) {
        res.status(401).json({ error: 'Autentikasi diperlukan untuk mengakses dokumentasi' });
        const existing = failedAttempts.get(clientIp) ?? { count: 0, resetAt: now + windowMs };
        existing.count++;
        failedAttempts.set(clientIp, existing);
        return;
    }

    const username = credentials.slice(0, sepIndex);
    const password = credentials.slice(sepIndex + 1);

    if (username === process.env.SWAGGER_USERNAME && password === process.env.SWAGGER_PASSWORD) {
        // Berhasil: hapus riwayat gagal
        failedAttempts.delete(clientIp);
        next();
    } else {
        // Gagal: catat percobaan
        const existing = failedAttempts.get(clientIp) ?? { count: 0, resetAt: now + windowMs };
        existing.count++;
        failedAttempts.set(clientIp, existing);
        res.status(401).json({ error: 'Username atau password salah' });
    }
};
