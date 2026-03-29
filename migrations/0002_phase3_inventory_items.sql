CREATE TABLE "inventory_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(160) NOT NULL,
  "category" varchar(32) NOT NULL,
  "current_quantity" double precision DEFAULT 0 NOT NULL,
  "min_quantity" double precision DEFAULT 0 NOT NULL,
  "unit" varchar(16) NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "inventory_items_name_idx" ON "inventory_items" USING btree ("name");
--> statement-breakpoint
CREATE INDEX "inventory_items_category_idx" ON "inventory_items" USING btree ("category");
--> statement-breakpoint
CREATE INDEX "inventory_items_deleted_at_idx" ON "inventory_items" USING btree ("deleted_at");
