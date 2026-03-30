ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "filling_recipe_id" uuid;

DO $$ BEGIN
 ALTER TABLE "order_items"
   ADD CONSTRAINT "order_items_filling_recipe_id_fkey"
   FOREIGN KEY ("filling_recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "order_items_filling_recipe_id_idx"
  ON "order_items" ("filling_recipe_id");
