import { z } from 'zod';

export const createOrderSchema = z.object({
  alamat_pengiriman: z.string().min(5),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled']),
});

export const orderIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
