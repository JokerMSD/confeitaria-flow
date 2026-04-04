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

export const recipeMedia = pgTable(
  "recipe_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id),
    variationRecipeId: uuid("variation_recipe_id").references(() => recipes.id),
    fileUrl: varchar("file_url", { length: 400 }).notNull(),
    altText: varchar("alt_text", { length: 200 }),
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
    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => ({
    recipeIdIdx: index("recipe_media_recipe_id_idx").on(table.recipeId),
    variationRecipeIdIdx: index("recipe_media_variation_recipe_id_idx").on(
      table.variationRecipeId,
    ),
    deletedAtIdx: index("recipe_media_deleted_at_idx").on(table.deletedAt),
    positionIdx: index("recipe_media_position_idx").on(table.position),
  }),
);
