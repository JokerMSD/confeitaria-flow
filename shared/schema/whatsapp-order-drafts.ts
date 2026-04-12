import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { recipes } from "./recipes";
import { whatsappCustomers } from "./whatsapp-customers";

export const whatsappOrderDrafts = pgTable(
  "whatsapp_order_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerPhone: varchar("customer_phone", { length: 32 }).notNull().unique(),
    whatsappCustomerId: uuid("whatsapp_customer_id").references(
      () => whatsappCustomers.id,
      {
        onDelete: "set null",
      },
    ),
    linkedCustomerId: uuid("linked_customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    productId: uuid("product_id").references(() => recipes.id, {
      onDelete: "set null",
    }),
    productName: varchar("product_name", { length: 160 }),
    quantity: integer("quantity"),
    flavor: varchar("flavor", { length: 160 }),
    deliveryDate: varchar("delivery_date", { length: 10 }),
    deliveryType: varchar("delivery_type", { length: 24 }),
    address: varchar("address", { length: 240 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    customerPhoneIdx: index("whatsapp_order_drafts_customer_phone_idx").on(
      table.customerPhone,
    ),
    linkedCustomerIdx: index(
      "whatsapp_order_drafts_linked_customer_id_idx",
    ).on(table.linkedCustomerId),
    productIdx: index("whatsapp_order_drafts_product_id_idx").on(table.productId),
  }),
);
