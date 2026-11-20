/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Daftar semua produk
 *     responses:
 *       200:
 *         description: Daftar produk
 *   post:
 *     tags: [Products]
 *     summary: Tambah produk baru (khusus petani)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category_id, nama_produk, deskripsi, harga, stok, satuan, foto_produk]
 *             properties:
 *               category_id: { type: integer }
 *               nama_produk: { type: string }
 *               deskripsi: { type: string }
 *               harga: { type: number }
 *               stok: { type: integer }
 *               satuan: { type: string }
 *               foto_produk: { type: string, description: "URL gambar dari Cloudinary" }
 *               status: { type: "string", enum: ["ready", "sold_out"] }
 *     responses:
 *       201:
 *         description: Produk berhasil dibuat
 */

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Detail produk
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detail produk
 *       404:
 *         description: Produk tidak ditemukan
 *   put:
 *     tags: [Products]
 *     summary: Update produk (khusus petani pemilik)
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
 *             properties:
 *               nama_produk: { type: string }
 *               harga: { type: number }
 *               stok: { type: integer }
 *               foto_produk: { type: string }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Produk berhasil diupdate
 *   delete:
 *     tags: [Products]
 *     summary: Hapus produk (khusus petani pemilik)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Produk berhasil dihapus
 */
import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/product.controller";
import { authMiddleware, role } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);

router.use(authMiddleware, role("petani"));

router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
