import { asc, desc, eq } from "drizzle-orm";
import { conversationMessages } from "@shared/schema";
import { getDb } from "../db";

type Executor = ReturnType<typeof getDb> | any;

export interface ConversationMessageRowInsert {
  customerPhone: string;
  role: "user" | "assistant" | "system";
  message: string;
  channel: string;
  metadataJson: Record<string, unknown> | null;
}

export class ChatHistoryRepository {
  async create(data: ConversationMessageRowInsert, executor: Executor = getDb()) {
    const [row] = await executor
      .insert(conversationMessages)
      .values(data)
      .returning();

    return row;
  }

  async listRecentByCustomerPhone(
    customerPhone: string,
    limit: number,
    executor: Executor = getDb(),
  ) {
    return executor
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.customerPhone, customerPhone))
      .orderBy(desc(conversationMessages.createdAt))
      .limit(limit);
  }

  async listChronologicalByCustomerPhone(
    customerPhone: string,
    limit: number,
    executor: Executor = getDb(),
  ) {
    return executor
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.customerPhone, customerPhone))
      .orderBy(asc(conversationMessages.createdAt))
      .limit(limit);
  }
}
