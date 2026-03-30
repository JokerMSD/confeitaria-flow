import { Client } from "pg";
import { loadEnvFile } from "../server/load-env";

loadEnvFile();

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const fillingAliases = [
  { recipeName: "Mousse de Morango", patterns: ["mousse de morango", "morango"] },
  { recipeName: "Maracuja", patterns: ["maracuja"] },
  { recipeName: "Leite Ninho", patterns: ["leite ninho", "ninho"] },
  { recipeName: "Brigadeiro", patterns: ["brigadeiro"] },
  { recipeName: "Amendoim", patterns: ["amendoim"] },
  { recipeName: "Limao", patterns: ["limao", "limão"] },
  { recipeName: "Tentacao", patterns: ["tentacao", "tentação"] },
  { recipeName: "Chocomenta", patterns: ["chocomenta"] },
  { recipeName: "Cookies", patterns: ["cookies", "cookie"] },
];

function findFillingsInText(
  text: string,
  fillingsByName: Map<string, { id: string; name: string }>,
) {
  const normalized = normalizeText(text);
  const matches: Array<{ index: number; id: string; name: string }> = [];

  for (const alias of fillingAliases) {
    const filling = fillingsByName.get(alias.recipeName);

    if (!filling) {
      continue;
    }

    for (const pattern of alias.patterns) {
      const normalizedPattern = normalizeText(pattern);
      const index = normalized.indexOf(normalizedPattern);

      if (index >= 0) {
        matches.push({
          index,
          id: filling.id,
          name: filling.name,
        });
        break;
      }
    }
  }

  return matches.sort((a, b) => a.index - b.index);
}

function buildProductName(baseName: string, fillingName: string | null) {
  return fillingName ? `${baseName} - ${fillingName}` : baseName;
}

function groupItems<T extends { productName: string; quantity: number; unitPriceCents: number; recipeId: string | null; fillingRecipeId: string | null }>(
  items: T[],
) {
  const grouped: T[] = [];

  for (const item of items) {
    const last = grouped[grouped.length - 1];

    if (
      last &&
      last.productName === item.productName &&
      last.unitPriceCents === item.unitPriceCents &&
      last.recipeId === item.recipeId &&
      last.fillingRecipeId === item.fillingRecipeId
    ) {
      last.quantity += item.quantity;
      continue;
    }

    grouped.push({ ...item });
  }

  return grouped;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("begin");

    const recipeRows = await client.query(
      `select id, name, kind from recipes where deleted_at is null`,
    );

    const fillingsByName = new Map<string, { id: string; name: string }>();

    for (const row of recipeRows.rows) {
      if (row.kind === "Preparacao") {
        fillingsByName.set(row.name, { id: row.id, name: row.name });
      }
    }

    const orderRows = await client.query(`
      select
        o.id,
        o.order_number,
        o.notes,
        oi.id as item_id,
        oi.product_name,
        oi.quantity,
        oi.unit_price_cents,
        oi.recipe_id,
        oi.filling_recipe_id,
        oi.position
      from orders o
      inner join order_items oi on oi.order_id = o.id
      where o.deleted_at is null
        and o.notes is not null
      order by o.created_at asc, oi.position asc
    `);

    const orders = new Map<
      string,
      {
        orderNumber: string;
        notes: string;
        items: Array<{
          itemId: string;
          productName: string;
          quantity: number;
          unitPriceCents: number;
          recipeId: string | null;
          fillingRecipeId: string | null;
          position: number;
        }>;
      }
    >();

    for (const row of orderRows.rows) {
      const current =
        orders.get(row.id) ??
        {
          orderNumber: row.order_number,
          notes: row.notes,
          items: [],
        };

      current.items.push({
        itemId: row.item_id,
        productName: row.product_name,
        quantity: Number(row.quantity),
        unitPriceCents: Number(row.unit_price_cents),
        recipeId: row.recipe_id,
        fillingRecipeId: row.filling_recipe_id,
        position: Number(row.position),
      });

      orders.set(row.id, current);
    }

    let affectedOrders = 0;
    let affectedItems = 0;

    for (const [orderId, order] of Array.from(orders.entries())) {
      const noteLines = order.notes
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const lineFillings = noteLines
        .map((line) => findFillingsInText(line, fillingsByName)[0] ?? null)
        .filter((value): value is { id: string; name: string; index: number } => Boolean(value));

      const allFillings = findFillingsInText(order.notes, fillingsByName);
      const eligibleItems = order.items.filter((item) => item.recipeId && !item.fillingRecipeId);
      const totalEligibleUnits = eligibleItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );

      if (eligibleItems.length === 0) {
        continue;
      }

      const unitAssignments: Array<{ id: string; name: string }> = [];

      if (lineFillings.length === totalEligibleUnits) {
        unitAssignments.push(...lineFillings.map((item) => ({ id: item.id, name: item.name })));
      } else if (allFillings.length === totalEligibleUnits) {
        unitAssignments.push(...allFillings.map((item) => ({ id: item.id, name: item.name })));
      } else if (lineFillings.length === eligibleItems.length) {
        for (let index = 0; index < eligibleItems.length; index += 1) {
          for (let count = 0; count < eligibleItems[index].quantity; count += 1) {
            unitAssignments.push({
              id: lineFillings[index].id,
              name: lineFillings[index].name,
            });
          }
        }
      } else if (allFillings.length === eligibleItems.length) {
        for (let index = 0; index < eligibleItems.length; index += 1) {
          for (let count = 0; count < eligibleItems[index].quantity; count += 1) {
            unitAssignments.push({
              id: allFillings[index].id,
              name: allFillings[index].name,
            });
          }
        }
      } else {
        const uniqueLineFillings = Array.from(new Set(lineFillings.map((item) => item.id)));
        const uniqueAllFillings = Array.from(new Set(allFillings.map((item) => item.id)));

        if (uniqueLineFillings.length === 1 && lineFillings[0]) {
          for (let count = 0; count < totalEligibleUnits; count += 1) {
            unitAssignments.push({
              id: lineFillings[0].id,
              name: lineFillings[0].name,
            });
          }
        } else if (uniqueAllFillings.length === 1 && allFillings[0]) {
          for (let count = 0; count < totalEligibleUnits; count += 1) {
            unitAssignments.push({
              id: allFillings[0].id,
              name: allFillings[0].name,
            });
          }
        }
      }

      if (unitAssignments.length !== totalEligibleUnits) {
        continue;
      }

      const nextItems: Array<{
        productName: string;
        quantity: number;
        unitPriceCents: number;
        recipeId: string | null;
        fillingRecipeId: string | null;
      }> = [];
      let assignmentIndex = 0;

      for (const item of order.items) {
        if (!item.recipeId || item.fillingRecipeId) {
          nextItems.push({
            productName: item.productName,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            recipeId: item.recipeId,
            fillingRecipeId: item.fillingRecipeId,
          });
          continue;
        }

        for (let count = 0; count < item.quantity; count += 1) {
          const assignment = unitAssignments[assignmentIndex] ?? null;
          assignmentIndex += 1;

          nextItems.push({
            productName: buildProductName(item.productName, assignment?.name ?? null),
            quantity: 1,
            unitPriceCents: item.unitPriceCents,
            recipeId: item.recipeId,
            fillingRecipeId: assignment?.id ?? null,
          });
        }
      }

      const groupedItems = groupItems(nextItems);

      await client.query(`delete from order_items where order_id = $1`, [orderId]);

      for (let index = 0; index < groupedItems.length; index += 1) {
        const item = groupedItems[index];

        await client.query(
          `insert into order_items (
            order_id,
            recipe_id,
            filling_recipe_id,
            product_name,
            quantity,
            unit_price_cents,
            line_total_cents,
            position
          ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            orderId,
            item.recipeId,
            item.fillingRecipeId,
            item.productName,
            item.quantity,
            item.unitPriceCents,
            item.quantity * item.unitPriceCents,
            index,
          ],
        );
      }

      affectedOrders += 1;
      affectedItems += groupedItems.length;
    }

    await client.query("commit");
    console.log(
      `Backfilled fillings for ${affectedOrders} order(s) and rewrote ${affectedItems} item row(s).`,
    );
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

await main();
