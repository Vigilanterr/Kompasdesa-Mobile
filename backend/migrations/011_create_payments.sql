-- 011_create_payments
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  metode_pembayaran VARCHAR(50),
  transaction_id VARCHAR(150) UNIQUE,
  jumlah_pembayaran NUMERIC(12,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  tanggal_pembayaran TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
