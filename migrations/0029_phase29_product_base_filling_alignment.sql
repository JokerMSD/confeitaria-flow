-- Product recipes should use the premium base by default.
-- Recheio simples remains exclusive to the explicit flavors that use it.

UPDATE recipes
SET notes = CASE name
  WHEN 'Ovo de colher 350g' THEN 'Peso nominal 350g. Recheio padrao vinculado a Base recheio.'
  WHEN 'Ovo de colher 500g' THEN 'Peso nominal 500g. Casca 100g e recheio premium de 400g.'
  WHEN 'Ovo de colher 750g' THEN 'Peso nominal 750g. Casca estimada 150g e recheio premium estimado 600g.'
  WHEN 'Ovo Trufado 500g' THEN 'Peso nominal 500g. Recheio padrao vinculado a Base recheio.'
  WHEN 'Trufa 20g' THEN 'Peso nominal 20g. Recheio padrao vinculado a Base recheio.'
  ELSE notes
END,
updated_at = now()
WHERE name IN (
  'Ovo de colher 350g',
  'Ovo de colher 500g',
  'Ovo de colher 750g',
  'Ovo Trufado 500g',
  'Trufa 20g'
);

UPDATE recipe_components rc
SET child_recipe_id = base_recipe.id,
    updated_at = now()
FROM recipes owner_recipe,
     recipes simple_recipe,
     recipes base_recipe
WHERE rc.recipe_id = owner_recipe.id
  AND rc.child_recipe_id = simple_recipe.id
  AND simple_recipe.name = 'Recheio simples'
  AND base_recipe.name = 'Base recheio'
  AND owner_recipe.kind = 'ProdutoVenda';
