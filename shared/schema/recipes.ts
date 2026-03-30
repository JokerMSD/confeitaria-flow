import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 160 }).notNull(),
    kind: varchar("kind", { length: 24 }).notNull(),
    outputQuantityMilli: integer("output_quantity_milli").notNull(),
    outputUnit: varchar("output_unit", { length: 16 }).notNull(),
    markupPercent: integer("markup_percent").notNull().default(100),
    notes: varchar("notes", { length: 1000 }),
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
    nameIdx: index("recipes_name_idx").on(table.name),
    kindIdx: index("recipes_kind_idx").on(table.kind),
    deletedAtIdx: index("recipes_deleted_at_idx").on(table.deletedAt),
  }),
);
