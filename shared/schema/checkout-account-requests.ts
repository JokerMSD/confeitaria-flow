import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { customers } from "./customers";

export const checkoutAccountRequests = pgTable(
  "checkout_account_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" })
      .unique(),
    email: varchar("email", { length: 320 }).notNull(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    passwordHash: text("password_hash").notNull(),
    processedAt: timestamp("processed_at", {
      withTimezone: true,
      mode: "date",
    }),
    cancelledAt: timestamp("cancelled_at", {
      withTimezone: true,
      mode: "date",
    }),
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
    emailIdx: index("checkout_account_requests_email_idx").on(table.email),
    processedAtIdx: index("checkout_account_requests_processed_at_idx").on(
      table.processedAt,
    ),
  }),
);
