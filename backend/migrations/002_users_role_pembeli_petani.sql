-- 002_users_role_pembeli_petani
UPDATE users SET role = 'pembeli' WHERE role NOT IN ('pembeli', 'petani');

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'pembeli';
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('pembeli', 'petani'));
