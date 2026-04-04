import { sql } from "drizzle-orm";
import {
  bigserial,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: varchar("order_number", { length: 32 }).notNull().unique(),
    customerName: varchar("customer_name", { length: 160 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 40 }),
    customerId: uuid("customer_id"),
    orderDate: varchar("order_date", { length: 10 }).notNull(),
    deliveryDate: varchar("delivery_date", { length: 10 }).notNull(),
    deliveryTime: varchar("delivery_time", { length: 5 }),
    deliveryMode: varchar("delivery_mode", { length: 24 })
      .notNull()
      .default("Entrega"),
    deliveryAddress: varchar("delivery_address", { length: 240 }),
    deliveryReference: varchar("delivery_reference", { length: 240 }),
    deliveryDistrict: varchar("delivery_district", { length: 120 }),
    deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
    status: varchar("status", { length: 32 }).notNull(),
    paymentMethod: varchar("payment_method", { length: 32 }).notNull(),
    paymentStatus: varchar("payment_status", { length: 32 }).notNull(),
    paymentProvider: varchar("payment_provider", { length: 32 }),
    paymentProviderPaymentId: varchar("payment_provider_payment_id", {
      length: 128,
    }),
    paymentProviderStatus: varchar("payment_provider_status", { length: 64 }),
    paymentProviderStatusDetail: varchar("payment_provider_status_detail", {
      length: 160,
    }),
    notes: text("notes"),
    itemsSubtotalAmountCents: integer("items_subtotal_amount_cents")
      .notNull()
      .default(0),
    discountSource: varchar("discount_source", { length: 24 }),
    discountType: varchar("discount_type", { length: 24 }),
    discountValue: integer("discount_value"),
    discountAmountCents: integer("discount_amount_cents")
      .notNull()
      .default(0),
    discountLabel: varchar("discount_label", { length: 160 }),
    couponCode: varchar("coupon_code", { length: 64 }),
    subtotalAmountCents: integer("subtotal_amount_cents").notNull().default(0),
    paidAmountCents: integer("paid_amount_cents").notNull().default(0),
    remainingAmountCents: integer("remaining_amount_cents")
      .notNull()
      .default(0),
    fullyPaidAt: timestamp("fully_paid_at", {
      withTimezone: true,
      mode: "date",
    }),
    itemCount: integer("item_count").notNull().default(0),
    orderSequence: bigserial("order_sequence", { mode: "number" }).notNull(),
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
    orderSequenceIdx: index("orders_order_sequence_idx").on(
      table.orderSequence,
    ),
    deliveryDateIdx: index("orders_delivery_date_idx").on(table.deliveryDate),
    statusIdx: index("orders_status_idx").on(table.status),
    paymentProviderPaymentIdIdx: index(
      "orders_payment_provider_payment_id_idx",
    ).on(table.paymentProviderPaymentId),
    deletedAtIdx: index("orders_deleted_at_idx").on(table.deletedAt),
  }),
);
