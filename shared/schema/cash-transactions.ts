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

export const cashTransactions = pgTable(
  "cash_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: varchar("type", { length: 16 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    description: varchar("description", { length: 240 }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    paymentMethod: varchar("payment_method", { length: 32 }).notNull(),
    transactionDate: timestamp("transaction_date", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    sourceType: varchar("source_type", { length: 32 }),
    sourceId: uuid("source_id"),
    isSystemGenerated: integer("is_system_generated").notNull().default(0),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "restrict",
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
    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => ({
    transactionDateIdx: index("cash_transactions_transaction_date_idx").on(
      table.transactionDate,
    ),
    typeIdx: index("cash_transactions_type_idx").on(table.type),
    orderIdIdx: index("cash_transactions_order_id_idx").on(table.orderId),
    sourceIdx: index("cash_transactions_source_idx").on(
      table.sourceType,
      table.sourceId,
    ),
    deletedAtIdx: index("cash_transactions_deleted_at_idx").on(table.deletedAt),
  }),
);
