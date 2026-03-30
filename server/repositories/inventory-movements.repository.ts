import { and, desc, eq } from "drizzle-orm";
import { inventoryMovements } from "@shared/schema";
import type {
  InventoryMovementType,
  ListInventoryMovementsFilters,
} from "@shared/types";
import { getDb } from "../db";

type Executor = ReturnType<typeof getDb> | any;

export interface InventoryMovementRowInsert {
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  reference: string | null;
  purchaseAmountCents?: number | null;
  purchaseDiscountCents?: number | null;
  purchaseEquivalentQuantity?: number | null;
  purchaseEquivalentUnit?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  isSystemGenerated?: boolean;
}

export class InventoryMovementsRepository {
  async list(
    filters: ListInventoryMovementsFilters = {},
    executor: Executor = getDb(),
  ) {
    const conditions = [];

    if (filters.itemId) {
      conditions.push(eq(inventoryMovements.itemId, filters.itemId));
    }

    if (filters.type) {
      conditions.push(eq(inventoryMovements.type, filters.type));
    }

    return executor
      .select()
      .from(inventoryMovements)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(inventoryMovements.createdAt));
  }

  async create(data: InventoryMovementRowInsert, executor: Executor = getDb()) {
    const [movement] = await executor
      .insert(inventoryMovements)
      .values(data)
      .returning();

    return movement;
  }

  async findById(id: string, executor: Executor = getDb()) {
    const [movement] = await executor
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.id, id))
      .limit(1);

    return movement ?? null;
  }

  async listBySource(
    sourceType: string,
    sourceId: string,
    executor: Executor = getDb(),
  ) {
    return executor
      .select()
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.sourceType, sourceType),
          eq(inventoryMovements.sourceId, sourceId),
        ),
      )
      .orderBy(desc(inventoryMovements.createdAt));
  }

  async deleteBySource(
    sourceType: string,
    sourceId: string,
    executor: Executor = getDb(),
  ) {
    await executor
      .delete(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.sourceType, sourceType),
          eq(inventoryMovements.sourceId, sourceId),
        ),
      );
  }
}
