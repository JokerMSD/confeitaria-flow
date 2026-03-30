import { asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { orderItems } from "@shared/schema";

type Executor = ReturnType<typeof getDb> | any;

export interface OrderItemRowInsert {
  orderId: string;
  recipeId: string | null;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  position: number;
}

export class OrderItemsRepository {
  async listByOrderId(orderId: string, executor: Executor = getDb()) {
    return executor
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .orderBy(asc(orderItems.position), asc(orderItems.createdAt));
  }

  async insertMany(items: OrderItemRowInsert[], executor: Executor = getDb()) {
    if (items.length === 0) {
      return [];
    }

    return executor.insert(orderItems).values(items).returning();
  }

  async deleteByOrderId(orderId: string, executor: Executor = getDb()) {
    await executor.delete(orderItems).where(eq(orderItems.orderId, orderId));
  }
}
