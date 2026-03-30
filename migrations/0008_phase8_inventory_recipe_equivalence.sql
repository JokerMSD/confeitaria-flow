ALTER TABLE "inventory_items"
  ADD COLUMN IF NOT EXISTS "recipe_equivalent_quantity" double precision;

ALTER TABLE "inventory_items"
  ADD COLUMN IF NOT EXISTS "recipe_equivalent_unit" varchar(16);
