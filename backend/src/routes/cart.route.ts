/**
 * @openapi
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Lihat isi keranjang belanja
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Isi keranjang
 *   delete:
 *     tags: [Cart]
 *     summary: Kosongkan keranjang
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Keranjang berhasil dikosongkan
 */

/**
 * @openapi
 * /api/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Tambah produk ke keranjang
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, jumlah]
 *             properties:
 *               product_id: { type: integer }
 *               jumlah: { type: number }
 *     responses:
 *       200:
 *         description: Produk berhasil ditambahkan
 *       404:
 *         description: Produk tidak ditemukan
 */

/**
 * @openapi
 * /api/cart/items/{id}:
 *   put:
 *     tags: [Cart]
 *     summary: Ubah jumlah item di keranjang
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jumlah]
 *             properties:
 *               jumlah: { type: number }
 *     responses:
 *       200:
 *         description: Jumlah berhasil diupdate
 *   delete:
 *     tags: [Cart]
 *     summary: Hapus item dari keranjang
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Item berhasil dihapus
 */
import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cart.controller';
import { authMiddleware, role } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, role('pembeli'));

router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items/:id', updateCartItem);
router.delete('/items/:id', removeFromCart);
router.delete('/', clearCart);

export default router;
