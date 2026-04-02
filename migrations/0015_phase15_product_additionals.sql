CREATE TABLE IF NOT EXISTS product_additional_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
  name varchar(120) NOT NULL,
  selection_type varchar(16) NOT NULL,
  min_selections integer NOT NULL DEFAULT 0,
  max_selections integer NOT NULL DEFAULT 1,
  position integer NOT NULL DEFAULT 0,
  notes varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS product_additional_groups_product_recipe_id_idx
  ON product_additional_groups (product_recipe_id);

CREATE INDEX IF NOT EXISTS product_additional_groups_deleted_at_idx
  ON product_additional_groups (deleted_at);

CREATE TABLE IF NOT EXISTS product_additional_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES product_additional_groups(id) ON DELETE RESTRICT,
  name varchar(120) NOT NULL,
  price_delta_cents integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  notes varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS product_additional_options_group_id_idx
  ON product_additional_options (group_id);

CREATE INDEX IF NOT EXISTS product_additional_options_deleted_at_idx
  ON product_additional_options (deleted_at);

CREATE TABLE IF NOT EXISTS order_item_additionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  group_id uuid NOT NULL REFERENCES product_additional_groups(id) ON DELETE RESTRICT,
  option_id uuid NOT NULL REFERENCES product_additional_options(id) ON DELETE RESTRICT,
  group_name varchar(120) NOT NULL,
  option_name varchar(120) NOT NULL,
  price_delta_cents integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_item_additionals_order_item_id_idx
  ON order_item_additionals (order_item_id);

CREATE INDEX IF NOT EXISTS order_item_additionals_option_id_idx
  ON order_item_additionals (option_id);
