import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { addToCartSchema, updateCartItemSchema, cartItemIdSchema } from '../validations/cart.validations';

export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    // Cari atau buat cart baru untuk pembeli
    let cart = await pool.query('SELECT * FROM carts WHERE buyer_id = $1', [req.user!.id]);
    if (cart.rows.length === 0) {
      cart = await pool.query('INSERT INTO carts (buyer_id) VALUES ($1) RETURNING *', [req.user!.id]);
    }

    const cartId = cart.rows[0].id;

    // Ambil semua item di keranjang beserta data produk
    const items = await pool.query(
      `SELECT ci.id, ci.product_id, ci.jumlah, p.nama_produk, p.harga, p.stok, p.satuan, p.status
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1
       ORDER BY ci.created_at DESC`,
      [cartId]
    );

    // Hitung total harga
    let total = 0;
    for (const item of items.rows) {
      total += parseFloat(item.harga) * parseFloat(item.jumlah);
    }

    res.status(200).json({
      cart: {
        id: cartId,
        buyer_id: cart.rows[0].buyer_id,
        items: items.rows,
        total: parseFloat(total.toFixed(2)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const addToCart = async (req: AuthRequest, res: Response) => {
  const parsed = addToCartSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Input tidak valid' });
    return;
  }

  const { product_id, jumlah } = parsed.data;

  try {
    // Cek produk ada, tersedia, dan stok cukup
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (product.rows.length === 0) {
      res.status(404).json({ error: 'Produk tidak ditemukan' });
      return;
    }
    if (product.rows[0].status !== 'ready') {
      res.status(400).json({ error: 'Produk tidak tersedia' });
      return;
    }
    if (parseFloat(product.rows[0].stok) < jumlah) {
      res.status(400).json({ error: 'Stok tidak mencukupi' });
      return;
    }

    // Cari atau buat cart
    let cart = await pool.query('SELECT * FROM carts WHERE buyer_id = $1', [req.user!.id]);
    if (cart.rows.length === 0) {
      cart = await pool.query('INSERT INTO carts (buyer_id) VALUES ($1) RETURNING *', [req.user!.id]);
    }

    const cartId = cart.rows[0].id;

    // Cek apakah produk sudah ada di keranjang
    const existing = await pool.query(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, product_id]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE cart_items SET jumlah = jumlah + $1 WHERE id = $2',
        [jumlah, existing.rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, jumlah) VALUES ($1, $2, $3)',
        [cartId, product_id, jumlah]
      );
    }

    res.status(200).json({ message: 'Produk berhasil ditambahkan ke keranjang' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response) => {
  const idParsed = cartItemIdSchema.safeParse(req.params);
  const bodyParsed = updateCartItemSchema.safeParse(req.body);

  if (!idParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: 'Input tidak valid' });
    return;
  }

  const { jumlah } = bodyParsed.data;

  try {
    const item = await pool.query('SELECT * FROM cart_items WHERE id = $1', [idParsed.data.id]);
    if (item.rows.length === 0) {
      res.status(404).json({ error: 'Item keranjang tidak ditemukan' });
      return;
    }

    // Pastikan item ini milik cart pembeli yang sedang login
    const cart = await pool.query(
      'SELECT * FROM carts WHERE id = $1 AND buyer_id = $2',
      [item.rows[0].cart_id, req.user!.id]
    );
    if (cart.rows.length === 0) {
      res.status(403).json({ error: 'Akses ditolak' });
      return;
    }

    // Cek stok masih cukup
    const product = await pool.query('SELECT stok, status FROM products WHERE id = $1', [item.rows[0].product_id]);
    if (product.rows[0].status !== 'ready') {
      res.status(400).json({ error: 'Produk sedang tidak tersedia' });
      return;
    }
    if (parseFloat(product.rows[0].stok) < jumlah) {
      res.status(400).json({ error: 'Stok tidak mencukupi' });
      return;
    }

    await pool.query('UPDATE cart_items SET jumlah = $1 WHERE id = $2', [jumlah, idParsed.data.id]);
    res.status(200).json({ message: 'Jumlah item berhasil diupdate' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response) => {
  const parsed = cartItemIdSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'ID tidak valid' });
    return;
  }

  try {
    const item = await pool.query('SELECT * FROM cart_items WHERE id = $1', [parsed.data.id]);
    if (item.rows.length === 0) {
      res.status(404).json({ error: 'Item keranjang tidak ditemukan' });
      return;
    }

    // Pastikan item ini milik cart pembeli yang sedang login
    const cart = await pool.query(
      'SELECT * FROM carts WHERE id = $1 AND buyer_id = $2',
      [item.rows[0].cart_id, req.user!.id]
    );
    if (cart.rows.length === 0) {
      res.status(403).json({ error: 'Akses ditolak' });
      return;
    }

    await pool.query('DELETE FROM cart_items WHERE id = $1', [parsed.data.id]);
    res.status(200).json({ message: 'Item berhasil dihapus dari keranjang' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    const cart = await pool.query('SELECT id FROM carts WHERE buyer_id = $1', [req.user!.id]);
    if (cart.rows.length === 0) {
      res.status(404).json({ error: 'Keranjang tidak ditemukan' });
      return;
    }

    await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.rows[0].id]);
    res.status(200).json({ message: 'Keranjang berhasil dikosongkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};
