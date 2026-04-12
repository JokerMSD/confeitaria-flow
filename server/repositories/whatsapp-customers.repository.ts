import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { whatsappCustomers } from "@shared/schema";

type Executor = ReturnType<typeof getDb> | any;

export interface WhatsAppCustomerInsertRow {
  phone: string;
  linkedCustomerId: string | null;
  name: string | null;
  address: string | null;
  notes: string | null;
  lastInteractionAt: Date | null;
}

export interface WhatsAppCustomerUpdateRow
  extends Partial<WhatsAppCustomerInsertRow> {
  updatedAt: Date;
}

export class WhatsAppCustomersRepository {
  async findByPhone(phone: string, executor: Executor = getDb()) {
    const [row] = await executor
      .select()
      .from(whatsappCustomers)
      .where(eq(whatsappCustomers.phone, phone))
      .limit(1);

    return row ?? null;
  }

  async create(data: WhatsAppCustomerInsertRow, executor: Executor = getDb()) {
    const [row] = await executor
      .insert(whatsappCustomers)
      .values(data)
      .returning();

    return row;
  }

  async update(
    id: string,
    data: WhatsAppCustomerUpdateRow,
    executor: Executor = getDb(),
  ) {
    const [row] = await executor
      .update(whatsappCustomers)
      .set(data)
      .where(eq(whatsappCustomers.id, id))
      .returning();

    return row ?? null;
  }
}
