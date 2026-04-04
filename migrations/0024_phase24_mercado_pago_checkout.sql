ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_provider character varying(32),
  ADD COLUMN IF NOT EXISTS payment_provider_payment_id character varying(128),
  ADD COLUMN IF NOT EXISTS payment_provider_status character varying(64),
  ADD COLUMN IF NOT EXISTS payment_provider_status_detail character varying(160);

CREATE INDEX IF NOT EXISTS orders_payment_provider_payment_id_idx
  ON orders (payment_provider_payment_id)
  WHERE deleted_at IS NULL;
