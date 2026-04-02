import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { orderItems } from "./order-items";
import { productAdditionalGroups } from "./product-additional-groups";
import { productAdditionalOptions } from "./product-additional-options";

export const orderItemAdditionals = pgTable(
  "order_item_additionals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => productAdditionalGroups.id, { onDelete: "restrict" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => productAdditionalOptions.id, { onDelete: "restrict" }),
    groupName: varchar("group_name", { length: 120 }).notNull(),
    optionName: varchar("option_name", { length: 120 }).notNull(),
    priceDeltaCents: integer("price_delta_cents").notNull().default(0),
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
    orderItemIdIdx: index("order_item_additionals_order_item_id_idx").on(
      table.orderItemId,
    ),
    optionIdIdx: index("order_item_additionals_option_id_idx").on(table.optionId),
  }),
);
