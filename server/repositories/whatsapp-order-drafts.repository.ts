import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { whatsappOrderDrafts } from "@shared/schema";

type Executor = ReturnType<typeof getDb> | any;

export interface WhatsAppOrderDraftInsertRow {
  customerPhone: string;
  whatsappCustomerId: string | null;
  linkedCustomerId: string | null;
  productId: string | null;
  productName: string | null;
  quantity: number | null;
  flavor: string | null;
  deliveryDate: string | null;
  deliveryType: string | null;
  address: string | null;
  notes: string | null;
}

export interface WhatsAppOrderDraftUpdateRow
  extends Partial<WhatsAppOrderDraftInsertRow> {
  updatedAt: Date;
}

export class WhatsAppOrderDraftsRepository {
  async findByPhone(customerPhone: string, executor: Executor = getDb()) {
    const [row] = await executor
      .select()
      .from(whatsappOrderDrafts)
      .where(eq(whatsappOrderDrafts.customerPhone, customerPhone))
      .limit(1);

    return row ?? null;
  }

  async create(
    data: WhatsAppOrderDraftInsertRow,
    executor: Executor = getDb(),
  ) {
    const [row] = await executor
      .insert(whatsappOrderDrafts)
      .values(data)
      .returning();

    return row;
  }

  async update(
    id: string,
    data: WhatsAppOrderDraftUpdateRow,
    executor: Executor = getDb(),
  ) {
    const [row] = await executor
      .update(whatsappOrderDrafts)
      .set(data)
      .where(eq(whatsappOrderDrafts.id, id))
      .returning();

    return row ?? null;
  }

  async deleteByPhone(customerPhone: string, executor: Executor = getDb()) {
    const [row] = await executor
      .delete(whatsappOrderDrafts)
      .where(eq(whatsappOrderDrafts.customerPhone, customerPhone))
      .returning();

    return row ?? null;
  }
}
