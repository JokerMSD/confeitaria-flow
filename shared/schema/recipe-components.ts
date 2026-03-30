import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { inventoryItems } from "./inventory-items";
import { recipes } from "./recipes";

export const recipeComponents = pgTable(
  "recipe_components",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "restrict" }),
    componentType: varchar("component_type", { length: 24 }).notNull(),
    inventoryItemId: uuid("inventory_item_id").references(() => inventoryItems.id, {
      onDelete: "restrict",
    }),
    childRecipeId: uuid("child_recipe_id").references(() => recipes.id, {
      onDelete: "restrict",
    }),
    quantityMilli: integer("quantity_milli").notNull(),
    quantityUnit: varchar("quantity_unit", { length: 16 }).notNull(),
    position: integer("position").notNull().default(0),
    notes: varchar("notes", { length: 500 }),
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
  },
  (table) => ({
    recipeIdIdx: index("recipe_components_recipe_id_idx").on(table.recipeId),
    inventoryItemIdIdx: index("recipe_components_inventory_item_id_idx").on(
      table.inventoryItemId,
    ),
    childRecipeIdIdx: index("recipe_components_child_recipe_id_idx").on(
      table.childRecipeId,
    ),
  }),
);
