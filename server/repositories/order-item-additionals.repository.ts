import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { orderItemAdditionals } from "@shared/schema";

type Executor = ReturnType<typeof getDb> | any;

export interface OrderItemAdditionalRowInsert {
  orderItemId: string;
  groupId: string;
  optionId: string;
  groupName: string;
  optionName: string;
  priceDeltaCents: number;
  position: number;
}

export class OrderItemAdditionalsRepository {
  async listByOrderItemIds(orderItemIds: string[], executor: Executor = getDb()) {
    if (orderItemIds.length === 0) {
      return [];
    }

    return executor
      .select()
      .from(orderItemAdditionals)
      .where(inArray(orderItemAdditionals.orderItemId, orderItemIds))
      .orderBy(
        asc(orderItemAdditionals.position),
        asc(orderItemAdditionals.createdAt),
      );
  }

  async insertMany(
    rows: OrderItemAdditionalRowInsert[],
    executor: Executor = getDb(),
  ) {
    if (rows.length === 0) {
      return [];
    }

    return executor.insert(orderItemAdditionals).values(rows).returning();
  }

  async deleteByOrderItemIds(orderItemIds: string[], executor: Executor = getDb()) {
    if (orderItemIds.length === 0) {
      return;
    }

    await executor
      .delete(orderItemAdditionals)
      .where(inArray(orderItemAdditionals.orderItemId, orderItemIds));
  }

  async deleteByOrderItemId(orderItemId: string, executor: Executor = getDb()) {
    await executor
      .delete(orderItemAdditionals)
      .where(eq(orderItemAdditionals.orderItemId, orderItemId));
  }
}
