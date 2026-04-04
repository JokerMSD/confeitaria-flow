import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const discountCoupons = pgTable(
  "discount_coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 64 }).notNull().unique(),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description"),
    discountType: varchar("discount_type", { length: 24 }).notNull(),
    discountValue: integer("discount_value").notNull(),
    minimumOrderAmountCents: integer("minimum_order_amount_cents")
      .notNull()
      .default(0),
    isActive: boolean("is_active").notNull().default(true),
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
    codeIdx: index("discount_coupons_code_idx").on(table.code),
    activeIdx: index("discount_coupons_is_active_idx").on(table.isActive),
    deletedAtIdx: index("discount_coupons_deleted_at_idx").on(table.deletedAt),
  }),
);
