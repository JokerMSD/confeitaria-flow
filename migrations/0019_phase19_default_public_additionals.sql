WITH sellable_products AS (
  SELECT r.id
  FROM recipes r
  WHERE r.kind = 'ProdutoVenda'
    AND r.deleted_at IS NULL
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
    p.id,
    'Adicionais da casa',
    'multiple',
    0,
    6,
    900,
    'Extras padrao usados no checkout publico.'
  FROM sellable_products p
  WHERE NOT EXISTS (
    SELECT 1
    FROM product_additional_groups g
    WHERE g.product_recipe_id = p.id
      AND g.deleted_at IS NULL
      AND lower(g.name) = lower('Adicionais da casa')
  )
  RETURNING id
),
target_groups AS (
  SELECT g.id
  FROM product_additional_groups g
  INNER JOIN sellable_products p
    ON p.id = g.product_recipe_id
  WHERE g.deleted_at IS NULL
    AND lower(g.name) = lower('Adicionais da casa')
),
default_options(name, price_delta_cents, position, notes) AS (
  VALUES
    ('Uva', 600, 0, NULL),
    ('Uva verde', 600, 1, NULL),
    ('Morango', 600, 2, NULL),
    ('Kit Kat', 600, 3, NULL),
    ('Creme Ninho', 600, 4, NULL),
    ('Brinquedo', 0, 5, 'Valor a combinar')
)
INSERT INTO product_additional_options (
  group_id,
  name,
  price_delta_cents,
  position,
  notes
)
SELECT
  g.id,
  o.name,
  o.price_delta_cents,
  o.position,
  o.notes
FROM target_groups g
CROSS JOIN default_options o
WHERE NOT EXISTS (
  SELECT 1
  FROM product_additional_options existing
  WHERE existing.group_id = g.id
    AND existing.deleted_at IS NULL
    AND lower(existing.name) = lower(o.name)
);
