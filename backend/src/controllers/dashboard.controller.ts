import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const user = await pool.query('SELECT role FROM users WHERE id = $1', [req.user!.id]);

    if (user.rows[0].role === 'petani') {
      const totalProducts = await pool.query('SELECT COUNT(*)::int as count FROM products WHERE farmer_id = $1', [req.user!.id]);

      const availableProducts = await pool.query(
        'SELECT COUNT(*)::int as count FROM products WHERE farmer_id = $1 AND status = $2',
        [req.user!.id, 'active']
      );

      const totalOrders = await pool.query('SELECT COUNT(*)::int as count FROM orders WHERE farmer_id = $1', [req.user!.id]);

      const completedOrders = await pool.query(
        'SELECT COUNT(*)::int as count FROM orders WHERE farmer_id = $1 AND status = $2',
        [req.user!.id, 'completed']
      );

      const revenue = await pool.query(
        `SELECT COALESCE(SUM(total_harga), 0)::numeric as total_revenue
         FROM orders WHERE farmer_id = $1 AND status = $2`,
        [req.user!.id, 'completed']
      );

      res.status(200).json({
        role: 'petani',
        dashboard: {
          total_products: totalProducts.rows[0].count,
          available_products: availableProducts.rows[0].count,
          total_orders: totalOrders.rows[0].count,
          completed_orders: completedOrders.rows[0].count,
          total_revenue: parseFloat(revenue.rows[0].total_revenue),
        },
      });
    } else if (user.rows[0].role === 'pembeli') {
      const totalOrders = await pool.query('SELECT COUNT(*)::int as count FROM orders WHERE buyer_id = $1', [req.user!.id]);

      const pendingOrders = await pool.query(
        'SELECT COUNT(*)::int as count FROM orders WHERE buyer_id = $1 AND status IN ($2, $3)',
        [req.user!.id, 'pending', 'confirmed']
      );

      const completedOrders = await pool.query(
        'SELECT COUNT(*)::int as count FROM orders WHERE buyer_id = $1 AND status = $2',
        [req.user!.id, 'completed']
      );

      const recentOrders = await pool.query(
        `SELECT o.*, u.nama as farmer_nama FROM orders o
         JOIN users u ON o.farmer_id = u.id
         WHERE o.buyer_id = $1
         ORDER BY o.created_at DESC
         LIMIT 5`,
        [req.user!.id]
      );

      res.status(200).json({
        role: 'pembeli',
        dashboard: {
          total_orders: totalOrders.rows[0].count,
          pending_orders: pendingOrders.rows[0].count,
          completed_orders: completedOrders.rows[0].count,
          recent_orders: recentOrders.rows,
        },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};
