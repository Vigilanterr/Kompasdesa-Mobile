import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { updateUserSchema } from '../validations/user.validations';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, nama, email, no_hp, alamat, role, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Input tidak valid', detail: parsed.error.issues });
    return;
  }

  const { nama, no_hp, alamat } = parsed.data;

  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (nama) {
      fields.push(`nama = $${paramIndex++}`);
      values.push(nama);
    }
    if (no_hp !== undefined) {
      fields.push(`no_hp = $${paramIndex++}`);
      values.push(no_hp);
    }
    if (alamat !== undefined) {
      fields.push(`alamat = $${paramIndex++}`);
      values.push(alamat);
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'Tidak ada data yang diupdate' });
      return;
    }

    fields.push(`updated_at = NOW()`);
    values.push(req.user!.id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, nama, email, no_hp, alamat, role`,
      values
    );

    res.status(200).json({
      message: 'Profil berhasil diupdate',
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};
