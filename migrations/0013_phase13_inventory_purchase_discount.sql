ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS purchase_discount_cents integer;
