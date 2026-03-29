import { sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
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
    createdAtIdx: index("inventory_movements_created_at_idx").on(
      table.createdAt,
    ),
  }),
);
