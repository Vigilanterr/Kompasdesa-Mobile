import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { updateUserSchema } from '../validations/user.validations';
import { uploadImage } from '../config/cloudinary';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, nama, email, no_hp, alamat, role, profile_image, created_at FROM users WHERE id = $1',
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
    res.status(400).json({ error: 'Input tidak valid' });
    return;
  }

  const { nama, no_hp, alamat, profile_image } = parsed.data;

  // Cek apakah ada data yang diupdate
  if (!nama && no_hp === undefined && alamat === undefined && profile_image === undefined) {
    res.status(400).json({ error: 'Tidak ada data yang diupdate' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET nama = COALESCE($1, nama),
           no_hp = COALESCE($2, no_hp),
           alamat = COALESCE($3, alamat),
           profile_image = COALESCE($4, profile_image),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, nama, email, no_hp, alamat, role, profile_image`,
      [nama || null, no_hp ?? null, alamat ?? null, profile_image ?? null, req.user!.id]
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

// POST /api/users/profile/photo — upload foto profil baru (base64)
export const uploadProfilePhoto = async (req: AuthRequest, res: Response) => {
  const { image } = req.body as any;

  if (!image || !image.startsWith('data:image')) {
    res.status(400).json({ error: 'Foto dalam format base64 wajib diunggah' });
    return;
  }

  try {
    // Upload ke Cloudinary dan dapatkan URL publik
    const imageUrl = await uploadImage(image, 'kompasdesa/users');

    // Simpan URL ke database
    const result = await pool.query(
      "UPDATE users SET profile_image = $1, updated_at = NOW() WHERE id = $2 RETURNING id, nama, email, no_hp, alamat, role, profile_image",
      [imageUrl, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    res.status(200).json({
      message: 'Foto profil berhasil diupload',
      user: result.rows[0],
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengupload foto ke Cloudinary' });
  }
};
