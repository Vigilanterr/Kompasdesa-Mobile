import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { createOrderSchema, updateOrderStatusSchema, orderIdSchema } from '../validations/order.validations';

export const createOrder = async (req: AuthRequest, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Input tidak valid' });
    return;
  }

  const buyerId = req.user!.id;
  const { alamat_pengiriman } = parsed.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Ambil cart pembeli
    const cartResult = await client.query('SELECT id FROM carts WHERE buyer_id = $1', [buyerId]);
    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Keranjang tidak ditemukan' });
      return;
    }

    const cartId = cartResult.rows[0].id;

    // Ambil semua item di keranjang beserta data produk
    const itemsResult = await client.query(
      `SELECT ci.*, p.farmer_id, p.harga, p.stok, p.nama_produk
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (itemsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Keranjang kosong' });
      return;
    }

    // Validasi stok dan cek status produk
    for (const item of itemsResult.rows) {
      if (Number(item.stok) < Number(item.jumlah)) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: `Stok ${item.product_id} tidak mencukupi` });
        return;
      }
      // Blok jika produk sudah sold_out
      if (item.status === 'sold_out') {
        await client.query('ROLLBACK');
        res.status(400).json({ error: `Produk ${item.nama_produk} sedang sold out` });
        return;
      }
    }

    const orders: any[] = [];

    // Kelompokkan item berdasarkan farmer_id
    const farmers: Record<number, any[]> = {};
    for (const item of itemsResult.rows) {
      const fid = Number(item.farmer_id);
      if (!farmers[fid]) {
        farmers[fid] = [];
      }
      farmers[fid].push(item);
    }

    for (const farmerIdStr of Object.keys(farmers)) {
      const farmerId = Number(farmerIdStr);
      const farmerItems = farmers[farmerId];

      // Hitung total harga pesanan ini
      let totalHarga = 0;
      for (const item of farmerItems) {
        totalHarga += Number(item.harga) * Number(item.jumlah);
      }

      // Buat pesanan baru
      const orderResult = await client.query(
        `INSERT INTO orders (buyer_id, farmer_id, alamat_pengiriman, total_harga, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING *`,
        [buyerId, farmerId, alamat_pengiriman, totalHarga.toFixed(2)]
      );

      const order = orderResult.rows[0];
      orders.push(order);

      for (const item of farmerItems) {
        const subtotal = (Number(item.harga) * Number(item.jumlah)).toFixed(2);

        await client.query(
          `INSERT INTO order_items (order_id, product_id, nama_produk, jumlah, harga_satuan, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.id, item.product_id, item.nama_produk, item.jumlah, item.harga, subtotal]
        );

        // Kurangi stok (cast ke integer karena cart_items.jumlah bertipe NUMERIC)
        await client.query(
          'UPDATE products SET stok = stok - $1::numeric::int WHERE id = $2',
          [item.jumlah, item.product_id]
        );

        // Update status produk otomatis: stok habis → sold_out
        await client.query(
          `UPDATE products SET status = (CASE WHEN stok = 0 THEN 'sold_out' ELSE 'ready' END)::product_status WHERE id = $1`,
          [item.product_id]
        );
      }
    }

    // Kosongkan keranjang setelah checkout
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    await client.query('COMMIT');

    res.status(201).json({
      message: 'Pesanan berhasil dibuat',
      orders,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  } finally {
    client.release();
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;

  try {
    let query: string;
    let params: any[];

    if (role === 'pembeli') {
      query = `SELECT o.*, u.nama AS farmer_nama
               FROM orders o
               JOIN users u ON o.farmer_id = u.id
               WHERE o.buyer_id = $1
               ORDER BY o.created_at DESC`;
      params = [userId];
    } else {
      query = `SELECT o.*, u.nama AS buyer_nama
               FROM orders o
               JOIN users u ON o.buyer_id = u.id
               WHERE o.farmer_id = $1
               ORDER BY o.created_at DESC`;
      params = [userId];
    }

    const result = await pool.query(query, params);
    res.status(200).json({ orders: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  const parsed = orderIdSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'ID tidak valid' });
    return;
  }

  const orderId = parsed.data.id;
  const userId = req.user!.id;

  try {
    const [orderResult, itemsResult] = await Promise.all([
      pool.query('SELECT * FROM orders WHERE id = $1', [orderId]),
      pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]),
    ]);

    if (orderResult.rows.length === 0) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      return;
    }

    const order = orderResult.rows[0];
    const isBuyer = Number(order.buyer_id) === Number(userId);
    const isFarmer = Number(order.farmer_id) === Number(userId);
    if (!isBuyer && !isFarmer) {
      res.status(403).json({ error: 'Akses ditolak' });
      return;
    }

    res.status(200).json({
      order: {
        ...order,
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  const idParsed = orderIdSchema.safeParse(req.params);
  const bodyParsed = updateOrderStatusSchema.safeParse(req.body);

  if (!idParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: 'Input tidak valid' });
    return;
  }

  try {
    const orderResult = await pool.query('SELECT farmer_id FROM orders WHERE id = $1', [idParsed.data.id]);
    if (orderResult.rows.length === 0) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      return;
    }

    if (orderResult.rows[0].farmer_id !== req.user!.id) {
      res.status(403).json({ error: 'Hanya petani penjual yang dapat mengupdate status pesanan' });
      return;
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [bodyParsed.data.status, idParsed.data.id]
    );

    res.status(200).json({
      message: 'Status pesanan berhasil diupdate',
      order: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  const parsed = orderIdSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'ID tidak valid' });
    return;
  }

  const orderId = parsed.data.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderResult = await client.query('SELECT buyer_id, status FROM orders WHERE id = $1', [orderId]);
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      return;
    }

    const order = orderResult.rows[0];
    if (Number(order.buyer_id) !== Number(req.user!.id)) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'Hanya pembeli yang dapat membatalkan pesanan' });
      return;
    }

    if (order.status !== 'pending') {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Hanya pesanan dengan status pending yang dapat dibatalkan' });
      return;
    }

    // Kembalikan stok ke produk
    const itemsResult = await client.query(
      'SELECT product_id, jumlah FROM order_items WHERE order_id = $1',
      [orderId]
    );

    for (const item of itemsResult.rows) {
      await client.query(
        'UPDATE products SET stok = stok + $1::numeric::int, status = (CASE WHEN stok + $1::numeric::int > 0 THEN \'ready\' ELSE \'sold_out\' END)::product_status WHERE id = $2',
        [item.jumlah, item.product_id]
      );
    }

    await client.query(
      "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
      [orderId]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'Pesanan berhasil dibatalkan' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  } finally {
    client.release();
  }
};
