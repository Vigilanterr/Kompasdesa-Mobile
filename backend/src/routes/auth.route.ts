/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrasi user baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nama, email, password, role]
 *             properties:
 *               nama: { type: string, example: "Budi Santoso" }
 *               email: { type: string, format: email, example: "budi@example.com" }
 *               password: { type: string, minLength: 6, example: "rahasia123" }
 *               role: { type: string, enum: [pembeli, petani], example: "pembeli" }
 *     responses:
 *       201:
 *         description: Registrasi berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Registrasi berhasil" }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     nama: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *       400:
 *         description: Input tidak valid / email telah terdaftar
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login dan dapatkan JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "budi@example.com" }
 *               password: { type: string, example: "rahasia123" }
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 token: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     email: { type: string }
 *                     role: { type: string }
 *       401:
 *         description: Email atau password salah
 */
import { Router } from "express";
import { register, login } from "../controllers/auth.controller";

const router = Router();

router.post('/register', register);
router.post('/login', login);

export default router;
