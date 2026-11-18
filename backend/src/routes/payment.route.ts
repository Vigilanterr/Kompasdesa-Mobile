// import { Router } from 'express';
// import {
//   createPayment,
//   getPaymentById,
//   handleMidtransWebhook,
// } from '../controllers/payment.controller';
// import { authMiddleware } from '../middleware/auth.middleware';

// const router = Router();

// router.post('/webhook', (req, res, next) => {
//   const fakeAuth = { user: undefined } as any;
//   handleMidtransWebhook(fakeAuth, res);
// });

// router.use(authMiddleware);

// router.post('/', createPayment);
// router.get('/:id', getPaymentById);

// export default router;
