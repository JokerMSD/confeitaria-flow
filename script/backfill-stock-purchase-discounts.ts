import { loadEnvFile } from "../server/load-env";
import { Client } from "pg";

loadEnvFile();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

interface TargetDiscount {
  movementId: string;
  discountCents: number;
}

const targetDiscounts: TargetDiscount[] = [
  {
    movementId: "ec2c01e7-f877-4dfe-b6b4-59d795b8987a",
    discountCents: 720,
  },
  {
    movementId: "aaa9f68f-eefe-4504-b684-a203e433941f",
    discountCents: 225,
  },
  {
    movementId: "97101cb4-b456-4125-9a03-c5666c316731",
    discountCents: 240,
  },
];

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();

  try {
    await client.query("begin");
    await client.query(`
      alter table inventory_movements
      add column if not exists purchase_discount_cents integer
    `);

    const updatedMovements: string[] = [];

    for (const target of targetDiscounts) {
      const { rows } = await client.query<{
        item_id: string;
        purchase_amount_cents: number | null;
        purchase_discount_cents: number | null;
        pricing_accumulated_quantity: number | null;
        pricing_accumulated_cost_cents: number | null;
        cash_id: string | null;
      }>(
        `
          select
            im.item_id,
            im.purchase_amount_cents,
            im.purchase_discount_cents,
            ii.pricing_accumulated_quantity,
            ii.pricing_accumulated_cost_cents,
            ct.id as cash_id
          from inventory_movements im
          join inventory_items ii on ii.id = im.item_id
          left join cash_transactions ct
            on ct.source_type = 'CompraEstoque'
           and ct.source_id = im.id
           and ct.deleted_at is null
          where im.id = $1
          limit 1
        `,
        [target.movementId],
      );

      const row = rows[0];

      if (!row || row.purchase_amount_cents == null) {
        continue;
      }

      const currentDiscountCents = Number(row.purchase_discount_cents ?? 0);
      const originalGrossCents =
        Number(row.purchase_amount_cents) + currentDiscountCents;
      const nextNetCents = originalGrossCents - target.discountCents;
      const deltaCostCents = target.discountCents - currentDiscountCents;

      if (nextNetCents <= 0 || deltaCostCents === 0) {
        continue;
      }

      await client.query(
        `
          update inventory_movements
          set
            purchase_amount_cents = $2,
            purchase_discount_cents = $3
          where id = $1
        `,
        [target.movementId, nextNetCents, target.discountCents],
      );

      if (row.cash_id) {
        await client.query(
          `
            update cash_transactions
            set
              amount_cents = $2,
              updated_at = now()
            where id = $1
          `,
          [row.cash_id, nextNetCents],
        );
      }

      const nextAccumulatedCostCents =
        Number(row.pricing_accumulated_cost_cents ?? 0) - deltaCostCents;
      const nextAccumulatedQuantity = Number(row.pricing_accumulated_quantity ?? 0);
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
        [row.item_id, nextAccumulatedCostCents, nextUnitCostCents],
      );

      updatedMovements.push(target.movementId);
    }

    await client.query("commit");

    console.log(
      JSON.stringify(
        {
          updatedMovementCount: updatedMovements.length,
          updatedMovements,
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
