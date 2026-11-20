import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { Request, Response } from 'express';
import { createPaymentSchema, paymentIdSchema } from '../validations/payment.validations';
import { createMidtransTransaction, verifyMidtransNotification } from '../services/midtrans.service';

// POST /api/payments — buat token pembayaran untuk pesanan
export const createPayment = async (req: AuthRequest, res: Response) => {
    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Input tidak valid' });
        return;
    }

    const { order_id } = parsed.data;

    try {
        const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [order_id]);
        if (orderResult.rows.length === 0) {
            res.status(404).json({ error: 'Pesanan tidak ditemukan' });
            return;
        }

        const order = orderResult.rows[0];
        if (Number(order.buyer_id) !== Number(req.user!.id)) {
            res.status(403).json({ error: 'Akses ditolak' });
            return;
        }

        // Cek apakah sudah ada pembayaran pending
        const existing = await pool.query(
            'SELECT * FROM payments WHERE order_id = $1 AND status = $2',
            [order_id, 'pending']
        );
        if (existing.rows.length > 0) {
            res.status(400).json({ error: 'Pembayaran masih pending' });
            return;
        }

        // Buat transaksi Midtrans
        const snapToken = await createMidtransTransaction({
            order_id,
            gross_amount: Number(order.total_harga),
            customer_email: req.user!.email,
        });

        if (!snapToken) {
            res.status(500).json({ error: 'Gagal membuat transaksi Midtrans' });
            return;
        }

        // Simpan ke database — kolom di DB adalah transaction_id (bukan transaction_number)
        const result = await pool.query(
            `INSERT INTO payments (order_id, jumlah_pembayaran, status, transaction_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [order_id, order.total_harga, 'pending', snapToken]
        );

        res.status(201).json({
            message: 'Pembayaran berhasil dibuat',
            payment: result.rows[0],
            snap_token: snapToken,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};

// GET /api/payments/:id — detail pembayaran
export const getPaymentById = async (req: AuthRequest, res: Response) => {
    const parsed = paymentIdSchema.safeParse(req.params);
    if (!parsed.success) {
        res.status(400).json({ error: 'ID tidak valid' });
        return;
    }

    try {
        const paymentResult = await pool.query('SELECT * FROM payments WHERE id = $1', [parsed.data.id]);
        if (paymentResult.rows.length === 0) {
            res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
            return;
        }

        const payment = paymentResult.rows[0];
        const orderResult = await pool.query('SELECT buyer_id, farmer_id FROM orders WHERE id = $1', [payment.order_id]);

        if (orderResult.rows.length === 0) {
            res.status(404).json({ error: 'Pesanan tidak ditemukan' });
            return;
        }

        const order = orderResult.rows[0];
        if (Number(order.buyer_id) !== Number(req.user!.id) && Number(order.farmer_id) !== Number(req.user!.id)) {
            res.status(403).json({ error: 'Akses ditolak' });
            return;
        }

        res.status(200).json({ payment: payment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};

// POST /api/payments/webhook — terima notifikasi dari Midtrans
export const handleMidtransWebhook = async (req: Request, res: Response) => {
    try {
        const notification = req.body as any;

        if (!notification || typeof notification !== 'object') {
            res.status(400).json({ error: 'Bad request' });
            return;
        }

        const verified = verifyMidtransNotification(notification);
        if (!verified) {
            res.status(401).json({ error: 'Notifikasi tidak valid' });
            return;
        }

        const orderId = notification.order_id;
        const transactionStatus = notification.transaction_status;

        const paymentResult = await pool.query(
            'SELECT * FROM payments WHERE transaction_id = $1',
            [notification.transaction_id]
        );

        if (paymentResult.rows.length === 0) {
            res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
            return;
        }

        const payment = paymentResult.rows[0];
        let newStatus = 'pending';

        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
            newStatus = 'paid';
        } else if (transactionStatus === 'pending') {
            newStatus = 'pending';
        } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
            newStatus = 'failed';
        } else if (transactionStatus === 'refund') {
            newStatus = 'refunded';
        }

        // Update hanya jika berubah
        if (payment.status !== newStatus) {
            await pool.query('UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2', [newStatus, payment.id]);

            // Jika lunas, update status order jadi confirmed
            if (newStatus === 'paid') {
                await pool.query(
                    "UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1",
                    [orderId]
                );
            }
        }

        res.status(200).json({ message: 'Notifikasi berhasil diproses' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};
