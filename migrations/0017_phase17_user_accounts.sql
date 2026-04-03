-- 0017_phase17_user_accounts.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS photo_url text;

CREATE INDEX IF NOT EXISTS users_customer_id_idx ON users (customer_id);
