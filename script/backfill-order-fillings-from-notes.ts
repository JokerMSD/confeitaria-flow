import { Client } from "pg";
import { loadEnvFile } from "../server/load-env";

loadEnvFile();

interface FillingMatch {
  index: number;
  id: string;
  name: string;
}

interface ParsedSegment {
  raw: string;
  fillingIds: string[];
  fillingNames: string[];
  hasComboSignal: boolean;
}

interface OrderItemRow {
  itemId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  recipeId: string | null;
  fillingRecipeId: string | null;
  secondaryFillingRecipeId: string | null;
  tertiaryFillingRecipeId: string | null;
  position: number;
}

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
  const matches: FillingMatch[] = [];

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

function uniqueFillings(matches: FillingMatch[]) {
  const seen = new Set<string>();
  const result: FillingMatch[] = [];

  for (const match of matches) {
    if (seen.has(match.id)) {
      continue;
    }

    seen.add(match.id);
    result.push(match);
  }

  return result;
}

function splitNoteIntoSegments(note: string) {
  return note
    .replace(/(?:^|\s)(\d+\s*[\u00BA\u00B0-])/g, "\n$1")
    .split(/\r?\n|;/)
    .map((segment) =>
      segment
        .replace(/^\s*\d+\s*[\u00BA\u00B0-]\s*/g, "")
        .trim(),
    )
    .filter(Boolean);
}

function parseSegments(
  note: string,
  fillingsByName: Map<string, { id: string; name: string }>,
) {
  return splitNoteIntoSegments(note)
    .map((segment): ParsedSegment | null => {
      const fillings = uniqueFillings(findFillingsInText(segment, fillingsByName));

      if (fillings.length === 0) {
        return null;
      }

      const normalizedSegment = normalizeText(segment);

      return {
        raw: segment,
        fillingIds: fillings.map((filling) => filling.id),
        fillingNames: fillings.map((filling) => filling.name),
        hasComboSignal:
          /(?:1\s*\/\s*2|meio|metade|\bcom\b)/.test(normalizedSegment) ||
          fillings.length > 1,
      };
    })
    .filter((segment): segment is ParsedSegment => Boolean(segment));
}

function buildProductName(baseName: string, fillingNames: string[]) {
  return fillingNames.length > 0
    ? `${baseName} - ${fillingNames.join(" / ")}`
    : baseName;
}

function groupItems<
  T extends {
    productName: string;
    quantity: number;
    unitPriceCents: number;
    recipeId: string | null;
    fillingRecipeId: string | null;
    secondaryFillingRecipeId: string | null;
    tertiaryFillingRecipeId: string | null;
  },
>(items: T[]) {
  const grouped: T[] = [];

  for (const item of items) {
    const last = grouped[grouped.length - 1];

    if (
      last &&
      last.productName === item.productName &&
      last.unitPriceCents === item.unitPriceCents &&
      last.recipeId === item.recipeId &&
      last.fillingRecipeId === item.fillingRecipeId &&
      last.secondaryFillingRecipeId === item.secondaryFillingRecipeId &&
      last.tertiaryFillingRecipeId === item.tertiaryFillingRecipeId
    ) {
      last.quantity += item.quantity;
      continue;
    }

    grouped.push({ ...item });
  }

  return grouped;
}

function buildAssignmentsForOrder(
  eligibleItems: OrderItemRow[],
  parsedSegments: ParsedSegment[],
  recipesById: Map<string, { id: string; name: string; kind: string }>,
  fillingsById: Map<string, { id: string; name: string }>,
) {
  const eligibleUnits = eligibleItems.flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      recipeId: item.recipeId!,
      baseProductName: recipesById.get(item.recipeId!)?.name ?? item.productName,
      unitPriceCents: item.unitPriceCents,
    })),
  );

  const distinctRecipeIds = new Set(eligibleUnits.map((unit) => unit.recipeId));
  const unitAssignments: ParsedSegment[] = [];

  if (distinctRecipeIds.size > 1 && parsedSegments.length <= 1) {
    return null;
  }

  if (parsedSegments.length === eligibleUnits.length) {
    unitAssignments.push(...parsedSegments);
  } else if (parsedSegments.length === eligibleItems.length) {
    for (let index = 0; index < eligibleItems.length; index += 1) {
      const segment = parsedSegments[index];

      for (let count = 0; count < eligibleItems[index].quantity; count += 1) {
        unitAssignments.push(segment);
      }
    }
  } else if (parsedSegments.length === 1) {
    const [segment] = parsedSegments;

    if (
      eligibleUnits.length > 1 &&
      !segment.hasComboSignal &&
      segment.fillingIds.length === eligibleUnits.length
    ) {
      for (const fillingId of segment.fillingIds) {
        const filling = fillingsById.get(fillingId);

        if (!filling) {
          return null;
        }

        unitAssignments.push({
          raw: segment.raw,
          fillingIds: [filling.id],
          fillingNames: [filling.name],
          hasComboSignal: false,
        });
      }
    } else {
      for (let count = 0; count < eligibleUnits.length; count += 1) {
        unitAssignments.push(segment);
      }
    }
  }

  if (unitAssignments.length !== eligibleUnits.length) {
    return null;
  }

  return eligibleUnits.map((unit, index) => ({
    ...unit,
    assignment: unitAssignments[index],
  }));
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
    const fillingsById = new Map<string, { id: string; name: string }>();
    const recipesById = new Map<string, { id: string; name: string; kind: string }>();

    for (const row of recipeRows.rows) {
      recipesById.set(row.id, { id: row.id, name: row.name, kind: row.kind });

      if (row.kind === "Preparacao") {
        fillingsByName.set(row.name, { id: row.id, name: row.name });
        fillingsById.set(row.id, { id: row.id, name: row.name });
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
        oi.secondary_filling_recipe_id,
        oi.tertiary_filling_recipe_id,
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
        items: OrderItemRow[];
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
        secondaryFillingRecipeId: row.secondary_filling_recipe_id,
        tertiaryFillingRecipeId: row.tertiary_filling_recipe_id,
        position: Number(row.position),
      });

      orders.set(row.id, current);
    }

    let affectedOrders = 0;
    let affectedItems = 0;

    for (const [orderId, order] of Array.from(orders.entries())) {
      const parsedSegments = parseSegments(order.notes, fillingsByName);
      const eligibleItems = order.items.filter((item) => item.recipeId);

      if (eligibleItems.length === 0 || parsedSegments.length === 0) {
        continue;
      }

      const assignedUnits = buildAssignmentsForOrder(
        eligibleItems,
        parsedSegments,
        recipesById,
        fillingsById,
      );

      if (!assignedUnits) {
        continue;
      }

      const preservedItems = order.items.filter((item) => !item.recipeId);
      const nextItems: Array<{
        productName: string;
        quantity: number;
        unitPriceCents: number;
        recipeId: string | null;
        fillingRecipeId: string | null;
        secondaryFillingRecipeId: string | null;
        tertiaryFillingRecipeId: string | null;
      }> = preservedItems.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        recipeId: item.recipeId,
        fillingRecipeId: item.fillingRecipeId,
        secondaryFillingRecipeId: item.secondaryFillingRecipeId,
        tertiaryFillingRecipeId: item.tertiaryFillingRecipeId,
      }));

      for (const unit of assignedUnits) {
        nextItems.push({
          productName: buildProductName(
            unit.baseProductName,
            unit.assignment.fillingNames,
          ),
          quantity: 1,
          unitPriceCents: unit.unitPriceCents,
          recipeId: unit.recipeId,
          fillingRecipeId: unit.assignment.fillingIds[0] ?? null,
          secondaryFillingRecipeId: unit.assignment.fillingIds[1] ?? null,
          tertiaryFillingRecipeId: unit.assignment.fillingIds[2] ?? null,
        });
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
            secondary_filling_recipe_id,
            tertiary_filling_recipe_id,
            product_name,
            quantity,
            unit_price_cents,
            line_total_cents,
            position
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            orderId,
            item.recipeId,
            item.fillingRecipeId,
            item.secondaryFillingRecipeId,
            item.tertiaryFillingRecipeId,
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
