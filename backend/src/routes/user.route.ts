/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Ambil profil user yang login
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK — berisi user + profile_image
 *       401:
 *         description: Token tidak valid
 *   put:
 *     tags: [Users]
 *     summary: Update profil user yang login
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama: { type: string, minLength: 3, maxLength: 100 }
 *               no_hp: { type: string, maxLength: 20 }
 *               alamat: { type: string }
 *     responses:
 *       200:
 *         description: Profil berhasil diupdate
 *       400:
 *         description: Input tidak valid
 */

/**
 * @openapi
 * /api/users/profile/photo:
 *   post:
 *     tags: [Users]
 *     summary: Upload foto profil (base64)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 description: Base64 encoded image (data:image/jpeg;base64,...)
 *     responses:
 *       200:
 *         description: Foto berhasil diupload
 *       400:
 *         description: Format foto salah
 */
import { Router } from 'express';
import { getProfile, updateProfile, uploadProfilePhoto } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/photo', uploadProfilePhoto);

export default router;
