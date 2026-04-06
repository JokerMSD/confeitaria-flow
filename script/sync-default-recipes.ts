import { readFileSync } from "node:fs";
import { Client } from "pg";
import { loadEnvFile } from "../server/load-env";

loadEnvFile();

type InventoryUnit = "un" | "kg" | "g" | "l" | "ml" | "caixa";
type RecipeKind = "Preparacao" | "ProdutoVenda";
type ComponentType = "Ingrediente" | "Receita";

interface IngredientSeed {
  name: string;
  unit: InventoryUnit;
  recipeEquivalentQuantity?: number | null;
  recipeEquivalentUnit?: InventoryUnit | null;
  purchaseUnitCostCents?: number | null;
}

interface RecipeComponentSeed {
  componentType: ComponentType;
  name: string;
  quantity: number;
  quantityUnit: InventoryUnit;
}

interface RecipeSeed {
  name: string;
  kind: RecipeKind;
  outputQuantity: number;
  outputUnit: InventoryUnit;
  markupPercent: number;
  salePriceCents?: number | null;
  notes: string | null;
  components: RecipeComponentSeed[];
}

const quantityScale = 1000;

const ingredientSeeds: IngredientSeed[] = [
  {
    name: "Chocolate 1kg",
    unit: "un",
    recipeEquivalentQuantity: 1000,
    recipeEquivalentUnit: "g",
  },
  {
    name: "Creme de Leite 200g",
    unit: "un",
    recipeEquivalentQuantity: 200,
    recipeEquivalentUnit: "g",
  },
  {
    name: "leite condensado 395g",
    unit: "un",
    recipeEquivalentQuantity: 395,
    recipeEquivalentUnit: "g",
  },
  {
    name: "Suco Morango",
    unit: "un",
  },
  {
    name: "Maracujá",
    unit: "un",
  },
  {
    name: "Leite ninho 750g",
    unit: "un",
    recipeEquivalentQuantity: 750,
    recipeEquivalentUnit: "g",
  },
  {
    name: "Manteiga 500g",
    unit: "un",
    recipeEquivalentQuantity: 500,
    recipeEquivalentUnit: "g",
  },
  {
    name: "Achocolatado 700g",
    unit: "un",
    recipeEquivalentQuantity: 700,
    recipeEquivalentUnit: "g",
  },
  {
    name: "Amendoin triturado 500g",
    unit: "un",
    recipeEquivalentQuantity: 500,
    recipeEquivalentUnit: "g",
  },
  {
    name: "Essencia de menta 30ml",
    unit: "un",
    recipeEquivalentQuantity: 30,
    recipeEquivalentUnit: "ml",
  },
  {
    name: "Bisc. Rancheiro recheado 90g",
    unit: "un",
    recipeEquivalentQuantity: 90,
    recipeEquivalentUnit: "g",
  },
  {
    name: "Limao",
    unit: "un",
    purchaseUnitCostCents: null,
  },
];

const recipeSeeds: RecipeSeed[] = [
  {
    name: "Recheio simples",
    kind: "Preparacao",
    outputQuantity: 519,
    outputUnit: "g",
    markupPercent: 100,
    notes: "Receita simples com suco morango.",
    components: [
      { componentType: "Ingrediente", name: "Creme de Leite 200g", quantity: 2, quantityUnit: "un" },
      { componentType: "Ingrediente", name: "leite condensado 395g", quantity: 1, quantityUnit: "un" },
      { componentType: "Ingrediente", name: "Suco Morango", quantity: 1, quantityUnit: "un" },
    ],
  },
  {
    name: "Base recheio",
    kind: "Preparacao",
    outputQuantity: 519,
    outputUnit: "g",
    markupPercent: 100,
    notes: "Base recheio de 519g.",
    components: [
      { componentType: "Ingrediente", name: "Creme de Leite 200g", quantity: 2, quantityUnit: "un" },
      { componentType: "Ingrediente", name: "leite condensado 395g", quantity: 1, quantityUnit: "un" },
      { componentType: "Ingrediente", name: "Manteiga 500g", quantity: 5, quantityUnit: "g" },
    ],
  },
  {
    name: "Mousse de Morango",
    kind: "Preparacao",
    outputQuantity: 519,
    outputUnit: "g",
    markupPercent: 100,
    notes: "Receita simples com suco morango.",
    components: [
      { componentType: "Receita", name: "Recheio simples", quantity: 519, quantityUnit: "g" },
    ],
  },
  {
    name: "Creme caseario de maracuja",
    kind: "Preparacao",
    outputQuantity: 100,
    outputUnit: "g",
    markupPercent: 100,
    notes: "Preparacao caseira de maracuja usada apenas como complemento do sabor Maracuja.",
    components: [
      { componentType: "Ingrediente", name: "Maracujá", quantity: 1, quantityUnit: "un" },
    ],
  },
  {
    name: "Maracuja",
    kind: "Preparacao",
    outputQuantity: 619,
    outputUnit: "g",
    markupPercent: 100,
    notes: "Base recheio com creme caseario de maracuja.",
    components: [
      { componentType: "Receita", name: "Base recheio", quantity: 519, quantityUnit: "g" },
      { componentType: "Receita", name: "Creme caseario de maracuja", quantity: 100, quantityUnit: "g" },
    ],
  },
  {
    name: "Leite Ninho",
    kind: "Preparacao",
    outputQuantity: 619,
    outputUnit: "g",
    markupPercent: 100,
    notes: "Base recheio com 100g de leite ninho.",
    components: [
      { componentType: "Receita", name: "Base recheio", quantity: 519, quantityUnit: "g" },
      { componentType: "Ingrediente", name: "Leite ninho 750g", quantity: 100, quantityUnit: "g" },
    ],
  },
  {
    name: "Brigadeiro",
    kind: "Preparacao",
    outputQuantity: 619,
    outputUnit: "g",
    markupPercent: 100,
    notes: "Base recheio com 100g de achocolatado.",
    components: [
      { componentType: "Receita", name: "Base recheio", quantity: 519, quantityUnit: "g" },
      { componentType: "Ingrediente", name: "Achocolatado 700g", quantity: 100, quantityUnit: "g" },
    ],
  },
  {
    name: "Amendoim",
    kind: "Preparacao",
    outputQuantity: 619,
    outputUnit: "g",
    markupPercent: 100,
    notes: "Base recheio com 100g de amendoin triturado.",
    components: [
      { componentType: "Receita", name: "Base recheio", quantity: 519, quantityUnit: "g" },
      { componentType: "Ingrediente", name: "Amendoin triturado 500g", quantity: 100, quantityUnit: "g" },
    ],
  },
  {
    name: "Limao",
    kind: "Preparacao",
    outputQuantity: 519,
    outputUnit: "g",
    markupPercent: 100,
    notes: "Base recheio com 1 limao. Custo do limao pode precisar ajuste manual.",
    components: [
      { componentType: "Receita", name: "Base recheio", quantity: 519, quantityUnit: "g" },
      { componentType: "Ingrediente", name: "Limao", quantity: 1, quantityUnit: "un" },
    ],
  },
  {
    name: "Tentacao",
    kind: "Preparacao",
    outputQuantity: 519,
    outputUnit: "g",
    markupPercent: 100,
    notes: "Receita simples com suco morango.",
    components: [
      { componentType: "Receita", name: "Recheio simples", quantity: 519, quantityUnit: "g" },
    ],
  },
  {
    name: "Chocomenta",
    kind: "Preparacao",
    outputQuantity: 619,
    outputUnit: "g",
    markupPercent: 100,
    notes: "Assumido 5ml de essencia de menta.",
    components: [
      { componentType: "Receita", name: "Base recheio", quantity: 519, quantityUnit: "g" },
      { componentType: "Ingrediente", name: "Achocolatado 700g", quantity: 100, quantityUnit: "g" },
      { componentType: "Ingrediente", name: "Essencia de menta 30ml", quantity: 5, quantityUnit: "ml" },
    ],
  },
  {
    name: "Cookies",
    kind: "Preparacao",
    outputQuantity: 609,
    outputUnit: "g",
    markupPercent: 100,
    notes: "Base recheio com 1 unidade de biscoito recheado 90g.",
    components: [
      { componentType: "Receita", name: "Base recheio", quantity: 519, quantityUnit: "g" },
      { componentType: "Ingrediente", name: "Bisc. Rancheiro recheado 90g", quantity: 1, quantityUnit: "un" },
    ],
  },
  {
    name: "Ovo de colher 350g",
    kind: "ProdutoVenda",
    outputQuantity: 1,
    outputUnit: "un",
    markupPercent: 100,
    salePriceCents: 3990,
    notes: "Peso nominal 350g. Recheio padrao vinculado a Base recheio.",
    components: [
      { componentType: "Ingrediente", name: "Chocolate 1kg", quantity: 55, quantityUnit: "g" },
      { componentType: "Receita", name: "Base recheio", quantity: 295, quantityUnit: "g" },
    ],
  },
  {
    name: "Ovo de colher 500g",
    kind: "ProdutoVenda",
    outputQuantity: 1,
    outputUnit: "un",
    markupPercent: 100,
    salePriceCents: 4990,
    notes: "Peso nominal 500g. Casca 100g e recheio premium de 400g.",
    components: [
      { componentType: "Ingrediente", name: "Chocolate 1kg", quantity: 100, quantityUnit: "g" },
      { componentType: "Receita", name: "Base recheio", quantity: 400, quantityUnit: "g" },
    ],
  },
  {
    name: "Ovo de colher 750g",
    kind: "ProdutoVenda",
    outputQuantity: 1,
    outputUnit: "un",
    markupPercent: 100,
    salePriceCents: 7490,
    notes: "Peso nominal 750g. Casca estimada 150g e recheio premium estimado 600g.",
    components: [
      { componentType: "Ingrediente", name: "Chocolate 1kg", quantity: 150, quantityUnit: "g" },
      { componentType: "Receita", name: "Base recheio", quantity: 600, quantityUnit: "g" },
    ],
  },
  {
    name: "Ovo Trufado 350g",
    kind: "ProdutoVenda",
    outputQuantity: 1,
    outputUnit: "un",
    markupPercent: 100,
    salePriceCents: 3290,
    notes: "Peso comercial 350g. Componentes informados somam 330g.",
    components: [
      { componentType: "Ingrediente", name: "Chocolate 1kg", quantity: 210, quantityUnit: "g" },
      { componentType: "Receita", name: "Base recheio", quantity: 120, quantityUnit: "g" },
    ],
  },
  {
    name: "Barra recheada 350g",
    kind: "ProdutoVenda",
    outputQuantity: 1,
    outputUnit: "un",
    markupPercent: 100,
    salePriceCents: 2790,
    notes: "Peso comercial 350g. Componentes informados somam 315g.",
    components: [
      { componentType: "Ingrediente", name: "Chocolate 1kg", quantity: 200, quantityUnit: "g" },
      { componentType: "Receita", name: "Base recheio", quantity: 115, quantityUnit: "g" },
    ],
  },
  {
    name: "Ovo Trufado 500g",
    kind: "ProdutoVenda",
    outputQuantity: 1,
    outputUnit: "un",
    markupPercent: 100,
    salePriceCents: 3930,
    notes: "Peso nominal 500g. Recheio padrao vinculado a Base recheio.",
    components: [
      { componentType: "Ingrediente", name: "Chocolate 1kg", quantity: 100, quantityUnit: "g" },
      { componentType: "Receita", name: "Base recheio", quantity: 400, quantityUnit: "g" },
    ],
  },
  {
    name: "Trufa 20g",
    kind: "ProdutoVenda",
    outputQuantity: 1,
    outputUnit: "un",
    markupPercent: 100,
    salePriceCents: 300,
    notes: "Peso nominal 20g. Recheio padrao vinculado a Base recheio.",
    components: [
      { componentType: "Ingrediente", name: "Chocolate 1kg", quantity: 15, quantityUnit: "g" },
      { componentType: "Receita", name: "Base recheio", quantity: 5, quantityUnit: "g" },
    ],
  },
  {
    name: "Caixa com 10 trufas",
    kind: "ProdutoVenda",
    outputQuantity: 1,
    outputUnit: "un",
    markupPercent: 100,
    salePriceCents: 2490,
    notes: "Caixa promocional com 10 unidades de trufa.",
    components: [
      { componentType: "Receita", name: "Trufa 20g", quantity: 10, quantityUnit: "un" },
    ],
  },
];

const legacyRecipeNames = new Map<string, string>([
  ["Ovo de Pascoa Recheado 350g", "Ovo Trufado 350g"],
  ["Ovo de Pascoa Recheado 500g", "Ovo Trufado 500g"],
]);

function toMilli(value: number) {
  return Math.round(value * quantityScale);
}

async function ensureIngredient(client: Client, seed: IngredientSeed) {
  const existing = await client.query(
    `select id from inventory_items where deleted_at is null and name = $1 limit 1`,
    [seed.name],
  );

  if (existing.rowCount === 0) {
    const inserted = await client.query(
      `insert into inventory_items (
        name, category, current_quantity, min_quantity, unit,
        recipe_equivalent_quantity, recipe_equivalent_unit,
        purchase_unit_cost_cents, notes
      ) values ($1, 'Ingrediente', 0, 0, $2, $3, $4, $5, $6)
      returning id`,
      [
        seed.name,
        seed.unit,
        seed.recipeEquivalentQuantity ?? null,
        seed.recipeEquivalentUnit ?? null,
        seed.purchaseUnitCostCents ?? null,
        "Criado automaticamente para suporte das receitas padrao.",
      ],
    );

    return inserted.rows[0].id as string;
  }

  await client.query(
    `update inventory_items
     set recipe_equivalent_quantity = $2,
         recipe_equivalent_unit = $3,
         updated_at = now()
     where id = $1`,
    [
      existing.rows[0].id,
      seed.recipeEquivalentQuantity ?? null,
      seed.recipeEquivalentUnit ?? null,
    ],
  );

  return existing.rows[0].id as string;
}

async function upsertRecipe(
  client: Client,
  seed: RecipeSeed,
  inventoryIds: Map<string, string>,
  recipeIds: Map<string, string>,
) {
  const existing = await client.query(
    `select id from recipes where name = $1 limit 1`,
    [seed.name],
  );

  let recipeId: string;

  if (existing.rowCount === 0) {
    const inserted = await client.query(
      `insert into recipes (
        name, kind, output_quantity_milli, output_unit, markup_percent, sale_price_cents, notes
      ) values ($1, $2, $3, $4, $5, $6, $7)
      returning id`,
      [
        seed.name,
        seed.kind,
        toMilli(seed.outputQuantity),
        seed.outputUnit,
        seed.markupPercent,
        seed.salePriceCents ?? null,
        seed.notes,
      ],
    );
    recipeId = inserted.rows[0].id as string;
  } else {
    recipeId = existing.rows[0].id as string;
    await client.query(
      `update recipes
       set kind = $2,
           output_quantity_milli = $3,
           output_unit = $4,
           markup_percent = $5,
           sale_price_cents = $6,
           notes = $7,
           deleted_at = null,
           updated_at = now()
       where id = $1`,
      [
        recipeId,
        seed.kind,
        toMilli(seed.outputQuantity),
        seed.outputUnit,
        seed.markupPercent,
        seed.salePriceCents ?? null,
        seed.notes,
      ],
    );
    await client.query(`delete from recipe_components where recipe_id = $1`, [recipeId]);
  }

  recipeIds.set(seed.name, recipeId);

  for (let index = 0; index < seed.components.length; index += 1) {
    const component = seed.components[index];
    const inventoryItemId =
      component.componentType === "Ingrediente"
        ? inventoryIds.get(component.name) ?? null
        : null;
    const childRecipeId =
      component.componentType === "Receita"
        ? recipeIds.get(component.name) ?? null
        : null;

    if (component.componentType === "Ingrediente" && !inventoryItemId) {
      throw new Error(`Ingrediente nao encontrado: ${component.name}`);
    }

    if (component.componentType === "Receita" && !childRecipeId) {
      throw new Error(`Receita base nao encontrada: ${component.name}`);
    }

    await client.query(
      `insert into recipe_components (
        recipe_id, component_type, inventory_item_id, child_recipe_id,
        quantity_milli, quantity_unit, position, notes
      ) values ($1, $2, $3, $4, $5, $6, $7, null)`,
      [
        recipeId,
        component.componentType,
        inventoryItemId,
        childRecipeId,
        toMilli(component.quantity),
        component.quantityUnit,
        index,
      ],
    );
  }
}

async function normalizeLegacyRecipeNames(client: Client) {
  for (const [legacyName, currentName] of Array.from(legacyRecipeNames.entries())) {
    const target = await client.query(
      `select id from recipes where name = $1 limit 1`,
      [currentName],
    );

    if (target.rowCount > 0) {
      continue;
    }

    await client.query(
      `update recipes
       set name = $2,
           updated_at = now()
       where name = $1`,
      [legacyName, currentName],
    );
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("begin");
    await normalizeLegacyRecipeNames(client);

    const inventoryIds = new Map<string, string>();

    for (const ingredient of ingredientSeeds) {
      const id = await ensureIngredient(client, ingredient);
      inventoryIds.set(ingredient.name, id);
    }

    const existingRecipes = await client.query(
      `select id, name from recipes where deleted_at is null`,
    );
    const recipeIds = new Map<string, string>(
      existingRecipes.rows.map((row) => [row.name as string, row.id as string]),
    );

    for (const recipe of recipeSeeds) {
      await upsertRecipe(client, recipe, inventoryIds, recipeIds);
    }

    await client.query("commit");
    console.log(`Synced ${ingredientSeeds.length} ingredients and ${recipeSeeds.length} recipes.`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

await main();
