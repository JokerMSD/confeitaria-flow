CREATE TABLE IF NOT EXISTS recipe_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id),
  file_url varchar(400) NOT NULL,
  alt_text varchar(200),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS recipe_media_recipe_id_idx
  ON recipe_media (recipe_id);

CREATE INDEX IF NOT EXISTS recipe_media_deleted_at_idx
  ON recipe_media (deleted_at);

CREATE INDEX IF NOT EXISTS recipe_media_position_idx
  ON recipe_media (position);
