/**
 * @openapi
 * /api/payments:
 *   post:
 *     tags: [Payments]
 *     summary: Buat token pembayaran untuk pesanan
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id]
 *             properties:
 *               order_id: { type: integer }
 *     responses:
 *       201:
 *         description: Pembayaran berhasil dibuat
 *       404:
 *         description: Pesanan tidak ditemukan
 *
 * /api/payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Detail pembayaran
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detail pembayaran
 */
import { Router } from 'express';
import { createPayment, getPaymentById, handleMidtransWebhook } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/webhook', (_req, res) => {
  handleMidtransWebhook(_req as any, res);
});

router.use(authMiddleware);

router.post('/', createPayment);
router.get('/:id', getPaymentById);

export default router;
