WITH base_recipe AS (
  SELECT id
  FROM recipes
  WHERE deleted_at IS NULL
    AND lower(name) = lower('Ovo de colher 500g')
  LIMIT 1
),
inserted_recipe AS (
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
    'Ovo de colher 750g',
    'ProdutoVenda',
    1000,
    'un',
    100,
    7490,
    'Peso nominal 750g. Casca estimada 150g e recheio estimado 600g.'
  WHERE EXISTS (SELECT 1 FROM base_recipe)
    AND NOT EXISTS (
      SELECT 1
      FROM recipes existing
      WHERE existing.deleted_at IS NULL
        AND lower(existing.name) = lower('Ovo de colher 750g')
    )
  RETURNING id
),
target_recipe AS (
  SELECT id
  FROM inserted_recipe
  UNION ALL
  SELECT id
  FROM recipes
  WHERE deleted_at IS NULL
    AND lower(name) = lower('Ovo de colher 750g')
),
component_sources AS (
  SELECT
    c.component_type,
    c.inventory_item_id,
    c.child_recipe_id,
    CASE
      WHEN c.quantity_unit IN ('g', 'ml') THEN c.quantity_milli * 3 / 2
      WHEN c.quantity_unit IN ('kg', 'l') THEN c.quantity_milli * 3 / 2
      ELSE c.quantity_milli
    END AS quantity_milli,
    c.quantity_unit,
    c.position,
    c.notes
  FROM recipe_components c
  INNER JOIN base_recipe b
    ON b.id = c.recipe_id
),
inserted_components AS (
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
    t.id,
    s.component_type,
    s.inventory_item_id,
    s.child_recipe_id,
    s.quantity_milli,
    s.quantity_unit,
    s.position,
    s.notes
  FROM target_recipe t
  CROSS JOIN component_sources s
  WHERE NOT EXISTS (
    SELECT 1
    FROM recipe_components existing
    WHERE existing.recipe_id = t.id
  )
  RETURNING id
),
base_groups AS (
  SELECT
    g.id,
    g.name,
    g.selection_type,
    g.min_selections,
    g.max_selections,
    g.position,
    g.notes
  FROM product_additional_groups g
  INNER JOIN base_recipe b
    ON b.id = g.product_recipe_id
  WHERE g.deleted_at IS NULL
),
inserted_groups AS (
  INSERT INTO product_additional_groups (
    product_recipe_id,
    name,
    selection_type,
    min_selections,
    max_selections,
    position,
    notes
  )
  SELECT
    t.id,
    bg.name,
    bg.selection_type,
    bg.min_selections,
    bg.max_selections,
    bg.position,
    bg.notes
  FROM target_recipe t
  CROSS JOIN base_groups bg
  WHERE NOT EXISTS (
    SELECT 1
    FROM product_additional_groups existing
    WHERE existing.product_recipe_id = t.id
      AND existing.deleted_at IS NULL
      AND lower(existing.name) = lower(bg.name)
  )
  RETURNING id
),
target_groups AS (
  SELECT
    g.id,
    g.name
  FROM product_additional_groups g
  INNER JOIN target_recipe t
    ON t.id = g.product_recipe_id
  WHERE g.deleted_at IS NULL
)
);

INSERT INTO product_additional_options (
  group_id,
  name,
  price_delta_cents,
  position,
  notes
)
SELECT
  target_group.id,
  source_option.name,
  source_option.price_delta_cents,
  source_option.position,
  source_option.notes
FROM recipes base_recipe
INNER JOIN product_additional_groups base_group
  ON base_group.product_recipe_id = base_recipe.id
  AND base_group.deleted_at IS NULL
INNER JOIN product_additional_options source_option
  ON source_option.group_id = base_group.id
  AND source_option.deleted_at IS NULL
INNER JOIN recipes target_recipe
  ON target_recipe.deleted_at IS NULL
  AND lower(target_recipe.name) = lower('Ovo de colher 750g')
INNER JOIN product_additional_groups target_group
  ON target_group.product_recipe_id = target_recipe.id
  AND target_group.deleted_at IS NULL
  AND lower(target_group.name) = lower(base_group.name)
WHERE base_recipe.deleted_at IS NULL
  AND lower(base_recipe.name) = lower('Ovo de colher 500g')
  AND NOT EXISTS (
    SELECT 1
    FROM product_additional_options existing
    WHERE existing.group_id = target_group.id
      AND existing.deleted_at IS NULL
      AND lower(existing.name) = lower(source_option.name)
  );
