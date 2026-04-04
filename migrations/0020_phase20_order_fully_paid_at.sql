ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fully_paid_at timestamptz;
