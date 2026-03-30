ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS pricing_accumulated_quantity double precision NOT NULL DEFAULT 0;

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS pricing_accumulated_cost_cents double precision NOT NULL DEFAULT 0;

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS equivalent_accumulated_quantity double precision NOT NULL DEFAULT 0;

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS equivalent_accumulated_base_quantity double precision NOT NULL DEFAULT 0;

UPDATE inventory_items
SET
  pricing_accumulated_quantity = CASE
    WHEN purchase_unit_cost_cents IS NOT NULL THEN current_quantity
    ELSE 0
  END,
  pricing_accumulated_cost_cents = CASE
    WHEN purchase_unit_cost_cents IS NOT NULL THEN current_quantity * purchase_unit_cost_cents
    ELSE 0
  END,
  equivalent_accumulated_quantity = CASE
    WHEN recipe_equivalent_quantity IS NOT NULL
      AND recipe_equivalent_unit IS NOT NULL
    THEN current_quantity * recipe_equivalent_quantity
    ELSE 0
  END,
  equivalent_accumulated_base_quantity = CASE
    WHEN recipe_equivalent_quantity IS NOT NULL
      AND recipe_equivalent_unit IS NOT NULL
    THEN current_quantity
    ELSE 0
  END
WHERE
  pricing_accumulated_quantity = 0
  AND pricing_accumulated_cost_cents = 0
  AND equivalent_accumulated_quantity = 0
  AND equivalent_accumulated_base_quantity = 0;

ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS purchase_amount_cents integer;

ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS purchase_equivalent_quantity double precision;

ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS purchase_equivalent_unit varchar(16);
