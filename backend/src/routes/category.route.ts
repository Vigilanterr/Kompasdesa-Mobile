/**
 * @openapi
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Daftar semua kategori
 *     responses:
 *       200:
 *         description: Daftar kategori
 *   post:
 *     tags: [Categories]
 *     summary: Tambah kategori baru (khusus petani)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nama_kategori]
 *             properties:
 *               nama_kategori: { type: string }
 *               deskripsi: { type: string }
 *     responses:
 *       201:
 *         description: Kategori berhasil dibuat
 */

/**
 * @openapi
 * /api/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Detail kategori
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detail kategori
 *   put:
 *     tags: [Categories]
 *     summary: Update kategori (khusus petani)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Kategori berhasil diupdate
 *   delete:
 *     tags: [Categories]
 *     summary: Hapus kategori (khusus petani)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Kategori berhasil dihapus
 */
import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authMiddleware, role } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);

router.use(authMiddleware, role('petani'));

router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
