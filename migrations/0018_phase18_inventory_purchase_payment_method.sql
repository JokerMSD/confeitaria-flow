ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS purchase_payment_method varchar(24);
