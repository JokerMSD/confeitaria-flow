ALTER TABLE "inventory_items"
ADD COLUMN IF NOT EXISTS "purchase_unit_cost_cents" integer;
