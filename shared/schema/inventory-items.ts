import { sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 160 }).notNull(),
    category: varchar("category", { length: 32 }).notNull(),
    currentQuantity: doublePrecision("current_quantity").notNull().default(0),
    minQuantity: doublePrecision("min_quantity").notNull().default(0),
    unit: varchar("unit", { length: 16 }).notNull(),
    recipeEquivalentQuantity: doublePrecision("recipe_equivalent_quantity"),
    recipeEquivalentUnit: varchar("recipe_equivalent_unit", { length: 16 }),
    purchaseUnitCostCents: integer("purchase_unit_cost_cents"),
    notes: text("notes"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .default(sql`now()`),
    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => ({
    nameIdx: index("inventory_items_name_idx").on(table.name),
    categoryIdx: index("inventory_items_category_idx").on(table.category),
    deletedAtIdx: index("inventory_items_deleted_at_idx").on(table.deletedAt),
  }),
);
