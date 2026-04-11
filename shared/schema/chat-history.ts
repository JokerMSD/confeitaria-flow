import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const conversationMessages = pgTable(
  "conversation_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerPhone: varchar("customer_phone", { length: 32 }).notNull(),
    role: varchar("role", { length: 16 }).notNull(),
    message: text("message").notNull(),
    channel: varchar("channel", { length: 32 }).notNull().default("whatsapp"),
    metadataJson: jsonb("metadata_json"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    customerPhoneIdx: index("conversation_messages_customer_phone_idx").on(
      table.customerPhone,
    ),
    createdAtIdx: index("conversation_messages_created_at_idx").on(
      table.createdAt,
    ),
    customerPhoneCreatedAtIdx: index(
      "conversation_messages_customer_phone_created_at_idx",
    ).on(table.customerPhone, table.createdAt),
  }),
);
