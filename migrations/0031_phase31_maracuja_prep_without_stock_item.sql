-- Creme caseario de maracuja stays in the recipe flow as a preparation,
-- but it should no longer exist as an inventory stock item.

DO $$
DECLARE
  maracuja_item_id uuid;
  creme_recipe_id uuid;
  maracuja_recipe_id uuid;
  base_recheio_id uuid;
BEGIN
  INSERT INTO inventory_items (
    name,
    category,
    current_quantity,
    min_quantity,
    unit,
    notes
  )
  SELECT
    'Maracujá',
    'Ingrediente',
    0,
    0,
    'un',
    'Criado automaticamente para suporte das receitas padrao.'
  WHERE NOT EXISTS (
    SELECT 1
    FROM inventory_items
    WHERE deleted_at IS NULL
      AND name = 'Maracujá'
  );

  SELECT id
  INTO maracuja_item_id
  FROM inventory_items
  WHERE deleted_at IS NULL
    AND name = 'Maracujá'
  LIMIT 1;

  INSERT INTO recipes (
    name,
    kind,
    output_quantity_milli,
    output_unit,
    markup_percent,
    notes
  )
  SELECT
    'Creme caseario de maracuja',
    'Preparacao',
    100000,
    'g',
    100,
    'Preparacao caseira de maracuja usada apenas como complemento do sabor Maracuja.'
  WHERE NOT EXISTS (
    SELECT 1
    FROM recipes
    WHERE deleted_at IS NULL
      AND name = 'Creme caseario de maracuja'
  );

  SELECT id
  INTO creme_recipe_id
  FROM recipes
  WHERE deleted_at IS NULL
    AND name = 'Creme caseario de maracuja'
  LIMIT 1;

  SELECT id
  INTO maracuja_recipe_id
  FROM recipes
  WHERE deleted_at IS NULL
    AND name = 'Maracuja'
  LIMIT 1;

  SELECT id
  INTO base_recheio_id
  FROM recipes
  WHERE deleted_at IS NULL
    AND name = 'Base recheio'
  LIMIT 1;

  IF creme_recipe_id IS NULL THEN
    RAISE EXCEPTION 'Receita Creme caseario de maracuja nao encontrada nem criada.';
  END IF;

  IF maracuja_recipe_id IS NULL THEN
    RAISE EXCEPTION 'Receita Maracuja nao encontrada.';
  END IF;

  IF base_recheio_id IS NULL THEN
    RAISE EXCEPTION 'Receita Base recheio nao encontrada.';
  END IF;

  IF maracuja_item_id IS NULL THEN
    RAISE EXCEPTION 'Ingrediente Maracujá nao encontrado nem criado.';
  END IF;

  UPDATE recipes
  SET kind = 'Preparacao',
      output_quantity_milli = 100000,
      output_unit = 'g',
      markup_percent = 100,
      notes = 'Preparacao caseira de maracuja usada apenas como complemento do sabor Maracuja.',
      deleted_at = NULL,
      updated_at = now()
  WHERE id = creme_recipe_id;

  DELETE FROM recipe_components
  WHERE recipe_id IN (creme_recipe_id, maracuja_recipe_id);

  INSERT INTO recipe_components (
    recipe_id,
    component_type,
    inventory_item_id,
    child_recipe_id,
    quantity_milli,
    quantity_unit,
    position,
    notes
  ) VALUES (
    creme_recipe_id,
    'Ingrediente',
    maracuja_item_id,
    NULL,
    1000,
    'un',
    0,
    NULL
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
  ) VALUES
  (
    maracuja_recipe_id,
    'Receita',
    NULL,
    base_recheio_id,
    519000,
    'g',
    0,
    NULL
  ),
  (
    maracuja_recipe_id,
    'Receita',
    NULL,
    creme_recipe_id,
    100000,
    'g',
    1,
    NULL
  );

  UPDATE recipes
  SET kind = 'Preparacao',
      output_quantity_milli = 619000,
      output_unit = 'g',
      markup_percent = 100,
      notes = 'Base recheio com creme caseario de maracuja.',
      updated_at = now()
  WHERE id = maracuja_recipe_id;

  UPDATE inventory_items
  SET deleted_at = now(),
      updated_at = now(),
      notes = trim(
        both E'\n' from concat_ws(
          E'\n',
          notes,
          'Descontinuado automaticamente: o creme de maracuja agora e tratado como preparacao, nao como item de estoque.'
        )
      )
  WHERE deleted_at IS NULL
    AND name IN ('Creme de maracuja', 'Creme caseario de maracuja');
END $$;
