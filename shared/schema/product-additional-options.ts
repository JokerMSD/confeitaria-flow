import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { productAdditionalGroups } from "./product-additional-groups";

export const productAdditionalOptions = pgTable(
  "product_additional_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => productAdditionalGroups.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 120 }).notNull(),
    priceDeltaCents: integer("price_delta_cents").notNull().default(0),
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
    groupIdIdx: index("product_additional_options_group_id_idx").on(table.groupId),
    deletedAtIdx: index("product_additional_options_deleted_at_idx").on(
      table.deletedAt,
    ),
  }),
);
