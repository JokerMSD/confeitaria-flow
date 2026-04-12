CREATE TABLE IF NOT EXISTS whatsapp_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone varchar(32) NOT NULL UNIQUE,
  linked_customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  name varchar(160),
  address varchar(240),
  notes text,
  last_interaction_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_customers_phone_idx
  ON whatsapp_customers (phone);

CREATE INDEX IF NOT EXISTS whatsapp_customers_linked_customer_id_idx
  ON whatsapp_customers (linked_customer_id);

CREATE TABLE IF NOT EXISTS whatsapp_order_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone varchar(32) NOT NULL UNIQUE,
  whatsapp_customer_id uuid REFERENCES whatsapp_customers(id) ON DELETE SET NULL,
  linked_customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  product_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  product_name varchar(160),
  quantity integer,
  flavor varchar(160),
  delivery_date varchar(10),
  delivery_type varchar(24),
  address varchar(240),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_order_drafts_customer_phone_idx
  ON whatsapp_order_drafts (customer_phone);

CREATE INDEX IF NOT EXISTS whatsapp_order_drafts_linked_customer_id_idx
  ON whatsapp_order_drafts (linked_customer_id);

CREATE INDEX IF NOT EXISTS whatsapp_order_drafts_product_id_idx
  ON whatsapp_order_drafts (product_id);
