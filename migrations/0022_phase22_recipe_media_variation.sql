ALTER TABLE recipe_media
  ADD COLUMN IF NOT EXISTS variation_recipe_id uuid REFERENCES recipes(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS recipe_media_variation_recipe_id_idx
  ON recipe_media (variation_recipe_id);
