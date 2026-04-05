-- Keep the Cookies filling recipe explicit as base + 1 unit of biscuit.

UPDATE recipes
SET notes = 'Base recheio com 1 unidade de biscoito recheado 90g.',
    updated_at = now()
WHERE name = 'Cookies';

UPDATE recipe_components rc
SET quantity_milli = 1000,
    quantity_unit = 'un',
    updated_at = now()
FROM recipes r,
     inventory_items ii
WHERE rc.recipe_id = r.id
  AND rc.inventory_item_id = ii.id
  AND r.name = 'Cookies'
  AND ii.name = 'Bisc. Rancheiro recheado 90g';
