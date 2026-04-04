ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS items_subtotal_amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_source varchar(24),
  ADD COLUMN IF NOT EXISTS discount_type varchar(24),
  ADD COLUMN IF NOT EXISTS discount_value integer,
  ADD COLUMN IF NOT EXISTS discount_amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_label varchar(160),
  ADD COLUMN IF NOT EXISTS coupon_code varchar(64);

CREATE TABLE IF NOT EXISTS discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(64) NOT NULL UNIQUE,
  title varchar(160) NOT NULL,
  description text,
  discount_type varchar(24) NOT NULL,
  discount_value integer NOT NULL,
  minimum_order_amount_cents integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS discount_coupons_code_idx
  ON discount_coupons (code);

CREATE INDEX IF NOT EXISTS discount_coupons_is_active_idx
  ON discount_coupons (is_active);

CREATE INDEX IF NOT EXISTS discount_coupons_deleted_at_idx
  ON discount_coupons (deleted_at);
