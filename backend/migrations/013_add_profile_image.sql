-- Tambah kolom profile_image pada tabel users
-- Menyimpan URL gambar profil dari Cloudinary
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
