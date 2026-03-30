import { loadEnvFile } from "../server/load-env";
import { Client } from "pg";

loadEnvFile();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

interface CandidateRow {
  movement_id: string;
  item_id: string;
  item_name: string;
  unit: string;
  quantity: number;
  purchase_amount_cents: number;
  cash_id: string | null;
  cash_amount_cents: number | null;
  description: string | null;
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

function shouldUpdateDescription(description: string | null) {
  return !description || !description.includes("(");
}

async function main() {
  await client.connect();

  try {
    await client.query("begin");

    const { rows } = await client.query<CandidateRow>(`
      select
        im.id as movement_id,
        ii.id as item_id,
        ii.name as item_name,
        ii.unit,
        im.quantity,
        im.purchase_amount_cents,
        ct.id as cash_id,
        ct.amount_cents as cash_amount_cents,
        ct.description
      from inventory_movements im
      join inventory_items ii on ii.id = im.item_id
      left join cash_transactions ct
        on ct.source_type = 'CompraEstoque'
       and ct.source_id = im.id
       and ct.deleted_at is null
      where im.type = 'Entrada'
        and im.purchase_amount_cents is not null
        and ii.unit in ('un', 'caixa')
        and im.quantity > 1
        and (
          ct.id is null
          or ct.description not like '%(%'
        )
      order by im.created_at asc
    `);

    const itemCostDelta = new Map<string, number>();

    for (const row of rows) {
      const correctedAmountCents = Math.round(
        Number(row.purchase_amount_cents) * Number(row.quantity),
      );
      const extraCostCents = correctedAmountCents - Number(row.purchase_amount_cents);

      if (extraCostCents <= 0) {
        continue;
      }

      await client.query(
        `
          update inventory_movements
          set purchase_amount_cents = $2
          where id = $1
        `,
        [row.movement_id, correctedAmountCents],
      );

      if (row.cash_id) {
        await client.query(
          `
            update cash_transactions
            set
              amount_cents = $2,
              description = $3,
              updated_at = now()
            where id = $1
          `,
          [
            row.cash_id,
            correctedAmountCents,
            `Compra de estoque - ${row.item_name} (${row.quantity} ${row.unit})`,
          ],
        );
      }

      itemCostDelta.set(
        row.item_id,
        (itemCostDelta.get(row.item_id) ?? 0) + extraCostCents,
      );
    }

    for (const [itemId, deltaCostCents] of itemCostDelta.entries()) {
      const { rows: itemRows } = await client.query<{
        pricing_accumulated_quantity: number;
        pricing_accumulated_cost_cents: number;
      }>(
        `
          select
            pricing_accumulated_quantity,
            pricing_accumulated_cost_cents
          from inventory_items
          where id = $1
          limit 1
        `,
        [itemId],
      );

      const item = itemRows[0];

      if (!item) {
        continue;
      }

      const nextAccumulatedCostCents =
        Number(item.pricing_accumulated_cost_cents ?? 0) + deltaCostCents;
      const nextAccumulatedQuantity = Number(item.pricing_accumulated_quantity ?? 0);
      const nextUnitCostCents =
        nextAccumulatedQuantity > 0
          ? Math.round(nextAccumulatedCostCents / nextAccumulatedQuantity)
          : null;

      await client.query(
        `
          update inventory_items
          set
            pricing_accumulated_cost_cents = $2,
            purchase_unit_cost_cents = $3,
            updated_at = now()
          where id = $1
        `,
        [itemId, nextAccumulatedCostCents, nextUnitCostCents],
      );
    }

    await client.query("commit");

    console.log(
      JSON.stringify(
        {
          correctedMovementCount: rows.length,
          affectedItemCount: itemCostDelta.size,
          correctedMovementIds: rows.map((row) => row.movement_id),
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

await main();
