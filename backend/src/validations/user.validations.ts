import { z } from 'zod';

export const updateUserSchema = z.object({
  nama: z.string().min(3).max(100).optional(),
  no_hp: z.string().max(20).optional(),
  alamat: z.string().optional(),
  profile_image: z.string().url().optional().nullable(),
});

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
