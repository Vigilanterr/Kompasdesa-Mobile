import { z } from 'zod';

export const createPaymentSchema = z.object({
    order_id: z.coerce.number().int().positive(),
});

export const paymentIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});
