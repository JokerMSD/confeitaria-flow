CREATE TABLE IF NOT EXISTS conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone varchar(32) NOT NULL,
  role varchar(16) NOT NULL,
  message text NOT NULL,
  channel varchar(32) NOT NULL DEFAULT 'whatsapp',
  metadata_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversation_messages_customer_phone_idx
  ON conversation_messages (customer_phone);

CREATE INDEX IF NOT EXISTS conversation_messages_created_at_idx
  ON conversation_messages (created_at);

CREATE INDEX IF NOT EXISTS conversation_messages_customer_phone_created_at_idx
  ON conversation_messages (customer_phone, created_at);
