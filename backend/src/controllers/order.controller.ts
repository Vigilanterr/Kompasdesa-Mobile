import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { createOrderSchema, updateOrderStatusSchema, orderIdSchema } from '../validations/order.validations';

export const createOrder = async (req: AuthRequest, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Input tidak valid', detail: parsed.error.issues });
    return;
  }

  const { alamat_pengiriman } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cart = await client.query('SELECT id FROM carts WHERE buyer_id = $1', [req.user!.id]);

    if (cart.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Keranjang tidak ditemukan' });
      return;
    }

    const cartItems = await client.query(
      `SELECT ci.*, p.farmer_id, p.harga, p.stok
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cart.rows[0].id]
    );

    if (cartItems.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Keranjang kosong' });
      return;
    }

    const groupedByFarmer: { [key: number]: any[] } = {};
    for (const item of cartItems.rows) {
      if (!groupedByFarmer[item.farmer_id]) {
        groupedByFarmer[item.farmer_id] = [];
      }
      groupedByFarmer[item.farmer_id].push(item);
    }

    const orders: any[] = [];

    for (const farmerIdStr in groupedByFarmer) {
      const farmerId = parseInt(farmerIdStr);
      const farmerItems = groupedByFarmer[farmerId];

      let totalHarga = 0;
      for (const item of farmerItems) {
        const itemTotal = parseFloat(item.harga) * parseFloat(item.jumlah);
        totalHarga += itemTotal;

        if (parseFloat(item.stok) < parseFloat(item.jumlah)) {
          await client.query('ROLLBACK');
          res.status(400).json({ error: `Stok ${item.product_id} tidak mencukupi` });
          return;
        }
      }

      const orderResult = await client.query(
        `INSERT INTO orders (buyer_id, farmer_id, alamat_pengiriman, total_harga, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.user!.id, farmerId, alamat_pengiriman, totalHarga.toFixed(2), 'pending']
      );

      const order = orderResult.rows[0];
      orders.push(order);

      for (const item of farmerItems) {
        const subtotal = (parseFloat(item.harga) * parseFloat(item.jumlah)).toFixed(2);

        await client.query(
          `INSERT INTO order_items (order_id, product_id, nama_produk, jumlah, harga_satuan, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.id, item.product_id, item.nama_produk, item.jumlah, item.harga, subtotal]
        );

        await client.query('UPDATE products SET stok = stok - $1 WHERE id = $2', [item.jumlah, item.product_id]);
      }
    }

    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.rows[0].id]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Pesanan berhasil dibuat',
      orders: orders,
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
  try {
    const user = await pool.query('SELECT role FROM users WHERE id = $1', [req.user!.id]);

    let orders;

    if (user.rows[0].role === 'pembeli') {
      orders = await pool.query(
        `SELECT o.*, u.nama as farmer_nama
         FROM orders o
         JOIN users u ON o.farmer_id = u.id
         WHERE o.buyer_id = $1
         ORDER BY o.created_at DESC`,
        [req.user!.id]
      );
    } else if (user.rows[0].role === 'petani') {
      orders = await pool.query(
        `SELECT o.*, u.nama as buyer_nama
         FROM orders o
         JOIN users u ON o.buyer_id = u.id
         WHERE o.farmer_id = $1
         ORDER BY o.created_at DESC`,
        [req.user!.id]
      );
    }

    res.status(200).json({ orders: orders?.rows || [] });
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

  try {
    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [parsed.data.id]);

    if (order.rows.length === 0) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      return;
    }

    const o = order.rows[0];
    if (o.buyer_id !== req.user!.id && o.farmer_id !== req.user!.id) {
      res.status(403).json({ error: 'Akses ditolak' });
      return;
    }

    const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [parsed.data.id]);

    res.status(200).json({
      order: {
        ...o,
        items: items.rows,
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

  const { status } = bodyParsed.data;

  try {
    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [idParsed.data.id]);

    if (order.rows.length === 0) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      return;
    }

    if (order.rows[0].farmer_id !== req.user!.id) {
      res.status(403).json({ error: 'Hanya petani penjual yang dapat mengupdate status pesanan' });
      return;
    }

    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, idParsed.data.id]
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const order = await client.query('SELECT * FROM orders WHERE id = $1', [parsed.data.id]);

    if (order.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      return;
    }

    if (order.rows[0].buyer_id !== req.user!.id) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'Hanya pembeli yang dapat membatalkan pesanan' });
      return;
    }

    if (order.rows[0].status !== 'pending') {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Hanya pesanan dengan status pending yang dapat dibatalkan' });
      return;
    }

    const items = await client.query('SELECT * FROM order_items WHERE order_id = $1', [parsed.data.id]);

    for (const item of items.rows) {
      await client.query('UPDATE products SET stok = stok + $1 WHERE id = $2', [item.jumlah, item.product_id]);
    }

    await client.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['cancelled', parsed.data.id]);

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
