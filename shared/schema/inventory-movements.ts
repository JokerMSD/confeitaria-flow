import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { inventoryItems } from "./inventory-items";

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => inventoryItems.id, {
        onDelete: "restrict",
      }),
    type: varchar("type", { length: 16 }).notNull(),
    quantity: doublePrecision("quantity").notNull(),
    reason: varchar("reason", { length: 240 }).notNull(),
    reference: varchar("reference", { length: 120 }),
    purchaseAmountCents: integer("purchase_amount_cents"),
    purchaseDiscountCents: integer("purchase_discount_cents"),
    purchaseEquivalentQuantity: doublePrecision("purchase_equivalent_quantity"),
    purchaseEquivalentUnit: varchar("purchase_equivalent_unit", { length: 16 }),
    sourceType: varchar("source_type", { length: 32 }),
    sourceId: varchar("source_id", { length: 120 }),
    isSystemGenerated: boolean("is_system_generated").notNull().default(false),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    itemIdIdx: index("inventory_movements_item_id_idx").on(table.itemId),
    typeIdx: index("inventory_movements_type_idx").on(table.type),
    sourceIdx: index("inventory_movements_source_idx").on(
      table.sourceType,
      table.sourceId,
    ),
    createdAtIdx: index("inventory_movements_created_at_idx").on(
      table.createdAt,
    ),
  }),
);
