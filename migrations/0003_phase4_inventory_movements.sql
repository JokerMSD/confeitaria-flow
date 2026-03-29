ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_current_quantity_non_negative"
  CHECK ("current_quantity" >= 0);
--> statement-breakpoint
ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_min_quantity_non_negative"
  CHECK ("min_quantity" >= 0);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "item_id" uuid NOT NULL,
  "type" varchar(16) NOT NULL,
  "quantity" double precision NOT NULL,
  "reason" varchar(240) NOT NULL,
  "reference" varchar(120),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_movements"
  ADD CONSTRAINT "inventory_movements_item_id_inventory_items_id_fk"
  FOREIGN KEY ("item_id")
  REFERENCES "public"."inventory_items"("id")
  ON DELETE restrict
  ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "inventory_movements_item_id_idx" ON "inventory_movements" USING btree ("item_id");
--> statement-breakpoint
CREATE INDEX "inventory_movements_type_idx" ON "inventory_movements" USING btree ("type");
--> statement-breakpoint
CREATE INDEX "inventory_movements_created_at_idx" ON "inventory_movements" USING btree ("created_at");
--> statement-breakpoint
ALTER TABLE "inventory_movements"
  ADD CONSTRAINT "inventory_movements_quantity_non_zero"
  CHECK ("quantity" <> 0);
