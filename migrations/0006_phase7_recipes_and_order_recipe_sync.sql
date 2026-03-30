CREATE TABLE IF NOT EXISTS "recipes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(160) NOT NULL,
  "kind" varchar(24) NOT NULL,
  "output_quantity_milli" integer NOT NULL,
  "output_unit" varchar(16) NOT NULL,
  "markup_percent" integer DEFAULT 100 NOT NULL,
  "notes" varchar(1000),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "recipe_components" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "recipe_id" uuid NOT NULL,
  "component_type" varchar(24) NOT NULL,
  "inventory_item_id" uuid,
  "child_recipe_id" uuid,
  "quantity_milli" integer NOT NULL,
  "quantity_unit" varchar(16) NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "notes" varchar(500),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "recipe_components_quantity_positive_chk" CHECK ("quantity_milli" > 0)
);

DO $$ BEGIN
 ALTER TABLE "recipe_components"
   ADD CONSTRAINT "recipe_components_recipe_id_fkey"
   FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "recipe_components"
   ADD CONSTRAINT "recipe_components_inventory_item_id_fkey"
   FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "recipe_components"
   ADD CONSTRAINT "recipe_components_child_recipe_id_fkey"
   FOREIGN KEY ("child_recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "recipe_id" uuid;

DO $$ BEGIN
 ALTER TABLE "order_items"
   ADD CONSTRAINT "order_items_recipe_id_fkey"
   FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "inventory_movements"
  ADD COLUMN IF NOT EXISTS "source_type" varchar(32);

ALTER TABLE "inventory_movements"
  ADD COLUMN IF NOT EXISTS "source_id" varchar(120);

ALTER TABLE "inventory_movements"
  ADD COLUMN IF NOT EXISTS "is_system_generated" boolean DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS "recipes_name_idx" ON "recipes" ("name");
CREATE INDEX IF NOT EXISTS "recipes_kind_idx" ON "recipes" ("kind");
CREATE INDEX IF NOT EXISTS "recipes_deleted_at_idx" ON "recipes" ("deleted_at");
CREATE INDEX IF NOT EXISTS "recipe_components_recipe_id_idx" ON "recipe_components" ("recipe_id");
CREATE INDEX IF NOT EXISTS "recipe_components_inventory_item_id_idx" ON "recipe_components" ("inventory_item_id");
CREATE INDEX IF NOT EXISTS "recipe_components_child_recipe_id_idx" ON "recipe_components" ("child_recipe_id");
CREATE INDEX IF NOT EXISTS "order_items_recipe_id_idx" ON "order_items" ("recipe_id");
CREATE INDEX IF NOT EXISTS "inventory_movements_source_idx" ON "inventory_movements" ("source_type", "source_id");
