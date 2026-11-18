import { z } from 'zod';

export const createCategorySchema = z.object({
  nama_kategori: z.string().min(1).max(100),
  deskripsi: z.string().optional(),
});

export const updateCategorySchema = z.object({
  nama_kategori: z.string().min(1).max(100).optional(),
  deskripsi: z.string().optional(),
});

export const categoryIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
