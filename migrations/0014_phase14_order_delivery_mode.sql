ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_mode varchar(24) NOT NULL DEFAULT 'Entrega';

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address varchar(240);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_reference varchar(240);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_district varchar(120);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_fee_cents integer NOT NULL DEFAULT 0;

UPDATE orders
SET delivery_mode = COALESCE(delivery_mode, 'Entrega')
WHERE delivery_mode IS NULL;
