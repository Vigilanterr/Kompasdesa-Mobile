import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  if (err.code === '23505') {
    return res.status(400).json({ error: 'Data sudah ada' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Data referensi tidak valid' });
  }

  if (err.code === '42P01') {
    return res.status(500).json({ error: 'Tabel tidak ditemukan' });
  }

  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
};
