import { z } from 'zod';

export const productSchema = z.object({
  category_id: z.coerce.number().int().positive(),
  nama_produk: z.string().min(1).max(150),
  deskripsi: z.string().min(1),
  harga: z.coerce.number().positive(),
  stok: z.coerce.number().int().nonnegative(),
  satuan: z.string().min(1).max(30),
  foto_produk: z.string().min(1).max(255),
  status: z.enum(['Ready', 'sold out']).optional(),
});

export const productIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const productStatusSchema = z.enum(['Ready', 'sold out']);