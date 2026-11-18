-- 003_create_products_table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
    CREATE TYPE product_status AS ENUM ('active', 'inactive', 'draft', 'out_of_stock');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL,
  nama_produk VARCHAR(150) NOT NULL,
  deskripsi TEXT NOT NULL,
  harga DECIMAL(12,2) NOT NULL,
  stok INTEGER NOT NULL,
  satuan VARCHAR(30) NOT NULL,
  foto_produk VARCHAR(255) NOT NULL,
  status product_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
