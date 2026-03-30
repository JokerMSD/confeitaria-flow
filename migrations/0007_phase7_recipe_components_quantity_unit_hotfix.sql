ALTER TABLE "recipe_components"
  ADD COLUMN IF NOT EXISTS "quantity_unit" varchar(16);

UPDATE "recipe_components"
SET "quantity_unit" = 'g'
WHERE "quantity_unit" IS NULL;

ALTER TABLE "recipe_components"
  ALTER COLUMN "quantity_unit" SET NOT NULL;
