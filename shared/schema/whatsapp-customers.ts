import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";

export const whatsappCustomers = pgTable(
  "whatsapp_customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: varchar("phone", { length: 32 }).notNull().unique(),
    linkedCustomerId: uuid("linked_customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 160 }),
    address: varchar("address", { length: 240 }),
    notes: text("notes"),
    lastInteractionAt: timestamp("last_interaction_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    phoneIdx: index("whatsapp_customers_phone_idx").on(table.phone),
    linkedCustomerIdx: index("whatsapp_customers_linked_customer_id_idx").on(
      table.linkedCustomerId,
    ),
  }),
);
