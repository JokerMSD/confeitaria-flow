CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" text NOT NULL UNIQUE,
  "password" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_number" varchar(32) NOT NULL UNIQUE,
  "customer_name" varchar(160) NOT NULL,
  "customer_phone" varchar(40),
  "order_date" varchar(10) NOT NULL,
  "delivery_date" varchar(10) NOT NULL,
  "delivery_time" varchar(5),
  "status" varchar(32) NOT NULL,
  "payment_method" varchar(32) NOT NULL,
  "payment_status" varchar(32) NOT NULL,
  "notes" text,
  "subtotal_amount_cents" integer NOT NULL DEFAULT 0,
  "paid_amount_cents" integer NOT NULL DEFAULT 0,
  "remaining_amount_cents" integer NOT NULL DEFAULT 0,
  "item_count" integer NOT NULL DEFAULT 0,
  "order_sequence" bigserial NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE RESTRICT,
  "product_name" varchar(160) NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price_cents" integer NOT NULL,
  "line_total_cents" integer NOT NULL,
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "orders_order_sequence_idx" ON "orders" ("order_sequence");
CREATE INDEX IF NOT EXISTS "orders_delivery_date_idx" ON "orders" ("delivery_date");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");
CREATE INDEX IF NOT EXISTS "orders_deleted_at_idx" ON "orders" ("deleted_at");
CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items" ("order_id");
