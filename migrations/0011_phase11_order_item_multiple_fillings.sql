ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS secondary_filling_recipe_id uuid REFERENCES recipes(id) ON DELETE RESTRICT;

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS tertiary_filling_recipe_id uuid REFERENCES recipes(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS order_items_secondary_filling_recipe_id_idx
  ON order_items (secondary_filling_recipe_id);

CREATE INDEX IF NOT EXISTS order_items_tertiary_filling_recipe_id_idx
  ON order_items (tertiary_filling_recipe_id);
