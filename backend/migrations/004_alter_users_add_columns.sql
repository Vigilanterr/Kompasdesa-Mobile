-- 004_alter_users_add_columns
-- Add missing columns to users table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS no_hp VARCHAR(20),
ADD COLUMN IF NOT EXISTS alamat TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
