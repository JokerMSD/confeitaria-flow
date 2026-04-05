-- Rebind default filling bases to the condensed milk item currently used in stock.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM inventory_items
    WHERE deleted_at IS NULL
      AND name = 'leite condensado 350g'
      AND NOT EXISTS (
        SELECT 1
        FROM inventory_items existing_395
        WHERE existing_395.deleted_at IS NULL
          AND existing_395.name = 'leite condensado 395g'
      )
  ) THEN
    UPDATE inventory_items
    SET name = 'leite condensado 395g',
        recipe_equivalent_quantity = 395,
        recipe_equivalent_unit = 'g',
        updated_at = now()
    WHERE deleted_at IS NULL
      AND name = 'leite condensado 350g';
  END IF;
END $$;

INSERT INTO inventory_items (
  name,
  category,
  current_quantity,
  min_quantity,
  unit,
  recipe_equivalent_quantity,
  recipe_equivalent_unit,
  notes
)
SELECT
  'leite condensado 395g',
  'Ingrediente',
  0,
  0,
  'un',
  395,
  'g',
  'Ingrediente padrao usado nas bases de recheio.'
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_items
  WHERE deleted_at IS NULL
    AND name = 'leite condensado 395g'
);

UPDATE inventory_items
SET recipe_equivalent_quantity = 395,
    recipe_equivalent_unit = 'g',
    updated_at = now()
WHERE deleted_at IS NULL
  AND name = 'leite condensado 395g';

DELETE FROM recipe_components
WHERE recipe_id IN (
  SELECT id
  FROM recipes
  WHERE name IN ('Recheio simples', 'Base recheio')
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
    ('Recheio simples', 'Ingrediente', 'leite condensado 395g', NULL, 1000, 'un', 1),
    ('Recheio simples', 'Ingrediente', 'Suco Morango', NULL, 1000, 'un', 2),
    ('Base recheio', 'Ingrediente', 'Creme de Leite 200g', NULL, 2000, 'un', 0),
    ('Base recheio', 'Ingrediente', 'leite condensado 395g', NULL, 1000, 'un', 1),
    ('Base recheio', 'Ingrediente', 'Manteiga 500g', NULL, 5000, 'g', 2)
) AS component(recipe_name, component_type, ingredient_name, child_recipe_name, quantity_milli, quantity_unit, position)
  ON component.recipe_name = recipe.name
LEFT JOIN inventory_items ingredient
  ON ingredient.name = component.ingredient_name
 AND ingredient.deleted_at IS NULL
LEFT JOIN recipes child_recipe
  ON child_recipe.name = component.child_recipe_name
 AND child_recipe.deleted_at IS NULL
WHERE recipe.deleted_at IS NULL
  AND recipe.name IN ('Recheio simples', 'Base recheio');
