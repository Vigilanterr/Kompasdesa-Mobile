import pool from "../config/db";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { productIdSchema, productSchema } from "../validations/product.validations";

export const createProduct = async (req: AuthRequest, res: Response) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Input tidak valid", detail: parsed.error.issues });
    return;
  }

  const { category_id, nama_produk, deskripsi, harga, stok, satuan, foto_produk, status = "Ready" } = parsed.data;

  try {
    const result = await pool.query(
      `INSERT INTO products (farmer_id, category_id, nama_produk, deskripsi, harga, stok, satuan, foto_produk, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user!.id, category_id, nama_produk, deskripsi, harga, stok, satuan, foto_produk, status]
    );
    res.status(201).json({ message: "Produk berhasil dibuat", product: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

export const getProducts = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
    res.status(200).json({ products: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  const parsed = productIdSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "ID tidak valid" });
    return;
  }

  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [parsed.data.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Produk tidak ditemukan" });
      return;
    }
    res.status(200).json({ product: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  const idParsed = productIdSchema.safeParse(req.params);
  const bodyParsed = productSchema.partial().safeParse(req.body);
  if (!idParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Input tidak valid" });
    return;
  }

  try {
    const existing = await pool.query("SELECT * FROM products WHERE id = $1", [idParsed.data.id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: "Produk tidak ditemukan" });
      return;
    }
    // if (existing.rows[0].farmer_id !== req.user!.id) {
    //   res.status(403).json({ error: "Bukan produk milik Anda" });
    //   return;
    // }

    const fields = Object.keys(bodyParsed.data);
    if (fields.length === 0) {
      res.status(400).json({ error: "Tidak ada field yang diupdate" });
      return;
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values = [idParsed.data.id, ...fields.map((f) => bodyParsed.data[f as keyof typeof bodyParsed.data])];
    const result = await pool.query(
      `UPDATE products SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    res.status(200).json({ message: "Produk berhasil diupdate", product: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  const parsed = productIdSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "ID tidak valid" });
    return;
  }

  try {
    const existing = await pool.query("SELECT * FROM products WHERE id = $1", [parsed.data.id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: "Produk tidak ditemukan" });
      return;
    }
    if (existing.rows[0].farmer_id !== req.user!.id) {
      res.status(403).json({ error: "Bukan produk milik Anda" });
      return;
    }

    await pool.query("DELETE FROM products WHERE id = $1", [parsed.data.id]);
    res.status(200).json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};