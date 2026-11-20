/**
 * @openapi
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Daftar pesanan (pembeli: pesanan saya, petani: pesanan masuk)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Daftar pesanan
 *   post:
 *     tags: [Orders]
 *     summary: Checkout keranjang menjadi pesanan
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [alamat_pengiriman]
 *             properties:
 *               alamat_pengiriman: { type: string }
 *     responses:
 *       201:
 *         description: Pesanan berhasil dibuat
 */

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Detail pesanan
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detail pesanan
 */

/**
 * @openapi
 * /api/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update status pesanan (khusus petani penjual)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, confirmed, processing, shipped, completed, cancelled] }
 *     responses:
 *       200:
 *         description: Status berhasil diupdate
 */

/**
 * @openapi
 * /api/orders/{id}/cancel:
 *   patch:
 *     tags: [Orders]
 *     summary: Batalkan pesanan berstatus pending (khusus pembeli)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Pesanan berhasil dibatalkan
 */
import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/cancel', cancelOrder);

export default router;
