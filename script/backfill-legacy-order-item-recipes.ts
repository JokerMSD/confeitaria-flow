import { Client } from "pg";
import { loadEnvFile } from "../server/load-env";

loadEnvFile();

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bovo de pascoa recheado\b/g, "ovo trufado")
    .replace(/\b(ovo de colher|ovo trufado)\s+(350|500)\b/g, "$1 $2g")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const recipeRows = await client.query(
      `select id, name, kind from recipes where deleted_at is null`,
    );
    const productRecipes = recipeRows.rows.filter(
      (row) => row.kind === "ProdutoVenda",
    );
    const preparationRecipes = recipeRows.rows.filter(
      (row) => row.kind === "Preparacao",
    );

    const orderItemRows = await client.query(
      `select id, product_name from order_items where recipe_id is null`,
    );

    let updatedCount = 0;

    for (const row of orderItemRows.rows) {
      const productName = String(row.product_name ?? "");
      const exactProduct = productRecipes.find(
        (recipe) => normalizeName(recipe.name) === normalizeName(productName),
      );

      let recipeId: string | null = exactProduct?.id ?? null;
      let fillingRecipeId: string | null = null;

      if (!recipeId) {
        const parts = productName.split(/\s+-\s+/).map((part) => part.trim());
        const baseName = parts[0] ?? productName;
        const fillingName = parts.length > 1 ? parts.slice(1).join(" - ") : "";

        const baseProduct = productRecipes.find(
          (recipe) => normalizeName(recipe.name) === normalizeName(baseName),
        );
        const fillingRecipe = fillingName
          ? preparationRecipes.find(
              (recipe) => normalizeName(recipe.name) === normalizeName(fillingName),
            )
          : null;

        recipeId = baseProduct?.id ?? null;
        fillingRecipeId = fillingRecipe?.id ?? null;
      }

      if (!recipeId) {
        continue;
      }

      await client.query(
        `update order_items
         set recipe_id = $2,
             filling_recipe_id = $3,
             updated_at = now()
         where id = $1`,
        [row.id, recipeId, fillingRecipeId],
      );

      updatedCount += 1;
    }

    console.log(`Backfilled ${updatedCount} legacy order item recipe link(s).`);
  } finally {
    await client.end();
  }
}

await main();
