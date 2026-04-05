-- Align default filling recipes with the current kitchen process.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM inventory_items
    WHERE deleted_at IS NULL
      AND name = 'Suco Tang'
      AND NOT EXISTS (
        SELECT 1
        FROM inventory_items existing_morango
        WHERE existing_morango.deleted_at IS NULL
          AND existing_morango.name = 'Suco Morango'
      )
  ) THEN
    UPDATE inventory_items
    SET name = 'Suco Morango',
        notes = 'Ingrediente padrao usado na receita simples de morango.',
        updated_at = now()
    WHERE deleted_at IS NULL
      AND name = 'Suco Tang';
  END IF;
END $$;

INSERT INTO inventory_items (
  name,
  category,
  current_quantity,
  min_quantity,
  unit,
  notes
)
SELECT
  'Suco Morango',
  'Ingrediente',
  0,
  0,
  'un',
  'Ingrediente padrao usado na receita simples de morango.'
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_items WHERE deleted_at IS NULL AND name = 'Suco Morango'
);

INSERT INTO inventory_items (
  name,
  category,
  current_quantity,
  min_quantity,
  unit,
  notes
)
SELECT
  'Creme caseario de maracuja',
  'Ingrediente',
  0,
  0,
  'g',
  'Complemento usado no recheio de maracuja.'
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_items
  WHERE deleted_at IS NULL
    AND name = 'Creme caseario de maracuja'
);

INSERT INTO recipes (
  name,
  kind,
  output_quantity_milli,
  output_unit,
  markup_percent,
  sale_price_cents,
  notes
)
SELECT
  recipe_name,
  'Preparacao',
  output_quantity_milli,
  'g',
  100,
  NULL,
  recipe_notes
FROM (
  VALUES
    ('Recheio simples', 519000, 'Receita simples com suco morango.'),
    ('Mousse de Morango', 519000, 'Receita simples com suco morango.'),
    ('Tentacao', 519000, 'Receita simples com suco morango.'),
    ('Maracuja', 619000, 'Base recheio com creme caseario de maracuja.')
) AS defaults(recipe_name, output_quantity_milli, recipe_notes)
WHERE NOT EXISTS (
  SELECT 1
  FROM recipes
  WHERE deleted_at IS NULL
    AND name = defaults.recipe_name
);

UPDATE recipes
SET kind = 'Preparacao',
    output_quantity_milli = updates.output_quantity_milli,
    output_unit = 'g',
    markup_percent = 100,
    notes = updates.recipe_notes,
    deleted_at = NULL,
    updated_at = now()
FROM (
  VALUES
    ('Recheio simples', 519000, 'Receita simples com suco morango.'),
    ('Mousse de Morango', 519000, 'Receita simples com suco morango.'),
    ('Tentacao', 519000, 'Receita simples com suco morango.'),
    ('Maracuja', 619000, 'Base recheio com creme caseario de maracuja.')
) AS updates(recipe_name, output_quantity_milli, recipe_notes)
WHERE recipes.name = updates.recipe_name;

DELETE FROM recipe_components
WHERE recipe_id IN (
  SELECT id
  FROM recipes
  WHERE name IN ('Recheio simples', 'Mousse de Morango', 'Tentacao', 'Maracuja')
);

INSERT INTO recipe_components (
  recipe_id,
  component_type,
  inventory_item_id,
  child_recipe_id,
  quantity_milli,
  quantity_unit,
  position,
  notes
)
SELECT
  recipe.id,
  component.component_type,
  ingredient.id,
  child_recipe.id,
  component.quantity_milli,
  component.quantity_unit,
  component.position,
  NULL
FROM recipes recipe
JOIN (
  VALUES
    ('Recheio simples', 'Ingrediente', 'Creme de Leite 200g', NULL, 2000, 'un', 0),
    ('Recheio simples', 'Ingrediente', 'leite condensado 350g', NULL, 1000, 'un', 1),
    ('Recheio simples', 'Ingrediente', 'Suco Morango', NULL, 1000, 'un', 2),
    ('Mousse de Morango', 'Receita', NULL, 'Recheio simples', 519000, 'g', 0),
    ('Tentacao', 'Receita', NULL, 'Recheio simples', 519000, 'g', 0),
    ('Maracuja', 'Receita', NULL, 'Base recheio', 519000, 'g', 0),
    ('Maracuja', 'Ingrediente', 'Creme caseario de maracuja', NULL, 100000, 'g', 1)
) AS component(recipe_name, component_type, ingredient_name, child_recipe_name, quantity_milli, quantity_unit, position)
  ON component.recipe_name = recipe.name
LEFT JOIN inventory_items ingredient
  ON ingredient.name = component.ingredient_name
 AND ingredient.deleted_at IS NULL
LEFT JOIN recipes child_recipe
  ON child_recipe.name = component.child_recipe_name
 AND child_recipe.deleted_at IS NULL
WHERE recipe.deleted_at IS NULL
  AND recipe.name IN ('Recheio simples', 'Mousse de Morango', 'Tentacao', 'Maracuja');
