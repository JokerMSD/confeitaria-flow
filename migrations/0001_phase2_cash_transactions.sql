CREATE TABLE "cash_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "type" varchar(16) NOT NULL,
  "category" varchar(80) NOT NULL,
  "description" varchar(240) NOT NULL,
  "amount_cents" integer NOT NULL,
  "payment_method" varchar(32) NOT NULL,
  "transaction_date" timestamp with time zone NOT NULL,
  "order_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "cash_transactions"
  ADD CONSTRAINT "cash_transactions_order_id_orders_id_fk"
  FOREIGN KEY ("order_id")
  REFERENCES "public"."orders"("id")
  ON DELETE restrict
  ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "cash_transactions_transaction_date_idx" ON "cash_transactions" USING btree ("transaction_date");
--> statement-breakpoint
CREATE INDEX "cash_transactions_type_idx" ON "cash_transactions" USING btree ("type");
--> statement-breakpoint
CREATE INDEX "cash_transactions_order_id_idx" ON "cash_transactions" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX "cash_transactions_deleted_at_idx" ON "cash_transactions" USING btree ("deleted_at");
