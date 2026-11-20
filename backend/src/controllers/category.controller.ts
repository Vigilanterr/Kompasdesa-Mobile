import { Request, Response } from 'express';
import pool from '../config/db';
import { createCategorySchema, updateCategorySchema, categoryIdSchema } from '../validations/category.validations';

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY nama_kategori ASC');
    res.status(200).json({ categories: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  const parsed = categoryIdSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'ID tidak valid' });
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [parsed.data.id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Kategori tidak ditemukan' });
      return;
    }

    res.status(200).json({ category: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Input tidak valid' });
    return;
  }

  const { nama_kategori, deskripsi } = parsed.data;

  try {
    const existing = await pool.query('SELECT id FROM categories WHERE nama_kategori = $1', [nama_kategori]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'Kategori sudah ada' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO categories (nama_kategori, deskripsi) VALUES ($1, $2) RETURNING *',
      [nama_kategori, deskripsi]
    );

    res.status(201).json({
      message: 'Kategori berhasil dibuat',
      category: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  const idParsed = categoryIdSchema.safeParse(req.params);
  const bodyParsed = updateCategorySchema.safeParse(req.body);

  if (!idParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: 'Input tidak valid' });
    return;
  }

  const { nama_kategori, deskripsi } = bodyParsed.data;

  try {
    const existing = await pool.query('SELECT * FROM categories WHERE id = $1', [idParsed.data.id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Kategori tidak ditemukan' });
      return;
    }

    // Cek duplikasi nama jika ada perubahan nama
    if (nama_kategori) {
      const checkDup = await pool.query(
        'SELECT id FROM categories WHERE nama_kategori = $1 AND id != $2',
        [nama_kategori, idParsed.data.id]
      );
      if (checkDup.rows.length > 0) {
        res.status(400).json({ error: 'Nama kategori sudah digunakan' });
        return;
      }
    }

    // Jika field tidak diisi, pakai nilai lama dari database
    const newNama = nama_kategori || existing.rows[0].nama_kategori;
    const newDeskripsi = deskripsi !== undefined ? deskripsi : existing.rows[0].deskripsi;

    const result = await pool.query(
      `UPDATE categories
       SET nama_kategori = $1, deskripsi = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newNama, newDeskripsi, idParsed.data.id]
    );

    res.status(200).json({
      message: 'Kategori berhasil diupdate',
      category: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  const parsed = categoryIdSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'ID tidak valid' });
    return;
  }

  try {
    const existing = await pool.query('SELECT * FROM categories WHERE id = $1', [parsed.data.id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Kategori tidak ditemukan' });
      return;
    }

    // Cek apakah kategori masih memiliki produk
    const hasProducts = await pool.query(
      'SELECT COUNT(*)::int as count FROM products WHERE category_id = $1',
      [parsed.data.id]
    );
    if (hasProducts.rows[0].count > 0) {
      res.status(400).json({ error: 'Tidak bisa menghapus kategori yang memiliki produk' });
      return;
    }

    await pool.query('DELETE FROM categories WHERE id = $1', [parsed.data.id]);
    res.status(200).json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};
