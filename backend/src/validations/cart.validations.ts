import { z } from 'zod';

export const addToCartSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  jumlah: z.coerce.number().positive(),
});

export const updateCartItemSchema = z.object({
  jumlah: z.coerce.number().positive(),
});

export const cartItemIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
