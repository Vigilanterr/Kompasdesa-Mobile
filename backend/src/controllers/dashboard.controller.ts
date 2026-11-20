import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboard = async (req: AuthRequest, res: Response) => {
  const farmerId = req.user!.id;

  try {
    const [productsResult, ordersResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) AS total_products,
           COUNT(*) FILTER (WHERE status = 'ready') AS available_products
         FROM products
         WHERE farmer_id = $1`,
        [farmerId]
      ),
      pool.query(
        `SELECT
           COUNT(*) AS total_orders,
           COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders,
           COALESCE(SUM(total_harga) FILTER (WHERE status = 'completed'), 0) AS total_revenue
         FROM orders
         WHERE farmer_id = $1`,
        [farmerId]
      ),
    ]);

    const products = productsResult.rows[0];
    const orders = ordersResult.rows[0];

    res.status(200).json({
      role: req.user!.role,
      dashboard: {
        total_products: Number(products.total_products),
        available_products: Number(products.available_products),
        total_orders: Number(orders.total_orders),
        completed_orders: Number(orders.completed_orders),
        total_revenue: Number(orders.total_revenue),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};
