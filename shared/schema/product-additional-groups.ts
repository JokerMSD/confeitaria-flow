import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { recipes } from "./recipes";

export const productAdditionalGroups = pgTable(
  "product_additional_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productRecipeId: uuid("product_recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 120 }).notNull(),
    selectionType: varchar("selection_type", { length: 16 }).notNull(),
    minSelections: integer("min_selections").notNull().default(0),
    maxSelections: integer("max_selections").notNull().default(1),
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
    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => ({
    productRecipeIdIdx: index("product_additional_groups_product_recipe_id_idx").on(
      table.productRecipeId,
    ),
    deletedAtIdx: index("product_additional_groups_deleted_at_idx").on(
      table.deletedAt,
    ),
  }),
);
