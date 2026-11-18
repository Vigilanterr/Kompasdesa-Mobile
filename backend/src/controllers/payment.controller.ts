// import { Response } from 'express';
// import pool from '../config/db';
// import { AuthRequest } from '../middleware/auth.middleware';
// import { createPaymentSchema, paymentIdSchema } from '../validations/payment.validations';
// import { createMidtransTransaction, verifyMidtransNotification } from '../services/midtrans.service';

// export const createPayment = async (req: AuthRequest, res: Response) => {
//   const parsed = createPaymentSchema.safeParse(req.body);
//   if (!parsed.success) {
//     res.status(400).json({ error: 'Input tidak valid', detail: parsed.error.issues });
//     return;
//   }

//   const { order_id } = parsed.data;

//   try {
//     const order = await pool.query('SELECT * FROM orders WHERE id = $1', [order_id]);

//     if (order.rows.length === 0) {
//       res.status(404).json({ error: 'Pesanan tidak ditemukan' });
//       return;
//     }

//     if (order.rows[0].buyer_id !== req.user!.id) {
//       res.status(403).json({ error: 'Akses ditolak' });
//       return;
//     }

//     const existingPayment = await pool.query('SELECT * FROM payments WHERE order_id = $1 AND status = $2', [
//       order_id,
//       'pending',
//     ]);

//     if (existingPayment.rows.length > 0) {
//       res.status(400).json({ error: 'Pembayaran masih pending' });
//       return;
//     }

//     const midtransToken = await createMidtransTransaction({
//       order_id,
//       gross_amount: order.rows[0].total_harga,
//       customer_email: req.user!.email,
//     });

//     if (!midtransToken) {
//       res.status(500).json({ error: 'Gagal membuat transaksi Midtrans' });
//       return;
//     }

//     const result = await pool.query(
//       `INSERT INTO payments (order_id, jumlah_pembayaran, status, transaction_id)
//        VALUES ($1, $2, $3, $4)
//        RETURNING *`,
//       [order_id, order.rows[0].total_harga, 'pending', midtransToken]
//     );

//     res.status(201).json({
//       message: 'Pembayaran berhasil dibuat',
//       payment: result.rows[0],
//       snap_token: midtransToken,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Terjadi kesalahan pada server' });
//   }
// };

// export const getPaymentById = async (req: AuthRequest, res: Response) => {
//   const parsed = paymentIdSchema.safeParse(req.params);
//   if (!parsed.success) {
//     res.status(400).json({ error: 'ID tidak valid' });
//     return;
//   }

//   try {
//     const payment = await pool.query('SELECT * FROM payments WHERE id = $1', [parsed.data.id]);

//     if (payment.rows.length === 0) {
//       res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
//       return;
//     }

//     const order = await pool.query('SELECT * FROM orders WHERE id = $1', [payment.rows[0].order_id]);

//     if (order.rows[0].buyer_id !== req.user!.id && order.rows[0].farmer_id !== req.user!.id) {
//       res.status(403).json({ error: 'Akses ditolak' });
//       return;
//     }

//     res.status(200).json({ payment: payment.rows[0] });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Terjadi kesalahan pada server' });
//   }
// };

// export const handleMidtransWebhook = async (req: AuthRequest, res: Response) => {
//   try {
//     const notification = req.body;

//     const isVerified = verifyMidtransNotification(notification);
//     if (!isVerified) {
//       res.status(401).json({ error: 'Notifikasi tidak valid' });
//       return;
//     }

//     const orderId = notification.order_id;
//     const transactionStatus = notification.transaction_status;

//     const payment = await pool.query('SELECT * FROM payments WHERE transaction_id = $1', [notification.transaction_id]);

//     if (payment.rows.length === 0) {
//       res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
//       return;
//     }

//     let paymentStatus = 'pending';

//     if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
//       paymentStatus = 'paid';
//     } else if (transactionStatus === 'pending') {
//       paymentStatus = 'pending';
//     } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
//       paymentStatus = 'failed';
//     } else if (transactionStatus === 'refund') {
//       paymentStatus = 'refunded';
//     }

//     if (payment.rows[0].status !== paymentStatus) {
//       await pool.query('UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2', [paymentStatus, payment.rows[0].id]);

//       if (paymentStatus === 'paid') {
//         await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['confirmed', payment.rows[0].order_id]);
//       }
//     }

//     res.status(200).json({ message: 'Notifikasi berhasil diproses' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Terjadi kesalahan pada server' });
//   }
// };
