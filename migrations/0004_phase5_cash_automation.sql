ALTER TABLE "cash_transactions"
ADD COLUMN IF NOT EXISTS "source_type" varchar(32),
ADD COLUMN IF NOT EXISTS "source_id" uuid,
ADD COLUMN IF NOT EXISTS "is_system_generated" integer DEFAULT 0 NOT NULL;

CREATE INDEX IF NOT EXISTS "cash_transactions_source_idx"
ON "cash_transactions" ("source_type", "source_id");
