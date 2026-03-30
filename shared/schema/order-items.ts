import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { recipes } from "./recipes";

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    recipeId: uuid("recipe_id").references(() => recipes.id, {
      onDelete: "restrict",
    }),
    fillingRecipeId: uuid("filling_recipe_id").references(() => recipes.id, {
      onDelete: "restrict",
    }),
    secondaryFillingRecipeId: uuid("secondary_filling_recipe_id").references(
      () => recipes.id,
      {
        onDelete: "restrict",
      },
    ),
    tertiaryFillingRecipeId: uuid("tertiary_filling_recipe_id").references(
      () => recipes.id,
      {
        onDelete: "restrict",
      },
    ),
    productName: varchar("product_name", { length: 160 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
    position: integer("position").notNull().default(0),
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
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
    recipeIdIdx: index("order_items_recipe_id_idx").on(table.recipeId),
    fillingRecipeIdIdx: index("order_items_filling_recipe_id_idx").on(
      table.fillingRecipeId,
    ),
    secondaryFillingRecipeIdIdx: index(
      "order_items_secondary_filling_recipe_id_idx",
    ).on(table.secondaryFillingRecipeId),
    tertiaryFillingRecipeIdIdx: index(
      "order_items_tertiary_filling_recipe_id_idx",
    ).on(table.tertiaryFillingRecipeId),
  }),
);
