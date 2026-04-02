import { and, asc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { inventoryItems } from "@shared/schema";
import type {
  InventoryItemCategory,
  InventoryItemUnit,
  ListInventoryItemsFilters,
} from "@shared/types";
import { getDb } from "../db";

type Executor = ReturnType<typeof getDb> | any;
const INVENTORY_QUANTITY_DECIMALS = 3;

export interface InventoryItemRowInsert {
  name: string;
  category: InventoryItemCategory;
  currentQuantity: number;
  minQuantity: number;
  unit: InventoryItemUnit;
  recipeEquivalentQuantity: number | null;
  recipeEquivalentUnit: InventoryItemUnit | null;
  purchaseUnitCostCents: number | null;
  pricingAccumulatedQuantity: number;
  pricingAccumulatedCostCents: number;
  equivalentAccumulatedQuantity: number;
  equivalentAccumulatedBaseQuantity: number;
  notes: string | null;
}

export interface InventoryItemRowUpdate extends InventoryItemRowInsert {
  updatedAt: Date;
}

export interface InventoryItemMetadataUpdate {
  name: string;
  category: InventoryItemCategory;
  minQuantity: number;
  unit: InventoryItemUnit;
  recipeEquivalentQuantity: number | null;
  recipeEquivalentUnit: InventoryItemUnit | null;
  purchaseUnitCostCents: number | null;
  notes: string | null;
  updatedAt: Date;
}

export interface InventoryItemPurchaseMetricsUpdate {
  recipeEquivalentQuantity: number | null;
  purchaseUnitCostCents: number | null;
  pricingAccumulatedQuantity: number;
  pricingAccumulatedCostCents: number;
  equivalentAccumulatedQuantity: number;
  equivalentAccumulatedBaseQuantity: number;
  updatedAt: Date;
}

export class InventoryItemsRepository {
  async list(
    filters: ListInventoryItemsFilters = {},
    executor: Executor = getDb(),
  ) {
    const conditions = [isNull(inventoryItems.deletedAt)];

    if (filters.category) {
      conditions.push(eq(inventoryItems.category, filters.category));
    }

    if (filters.search) {
      const search = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(inventoryItems.name, search),
          ilike(inventoryItems.notes, search),
        )!,
      );
    }

    return executor
      .select()
      .from(inventoryItems)
      .where(and(...conditions))
      .orderBy(asc(inventoryItems.name), asc(inventoryItems.createdAt));
  }

  async findById(id: string, executor: Executor = getDb()) {
    const [item] = await executor
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), isNull(inventoryItems.deletedAt)))
      .limit(1);

    return item ?? null;
  }

  async create(data: InventoryItemRowInsert, executor: Executor = getDb()) {
    const [item] = await executor.insert(inventoryItems).values(data).returning();
    return item;
  }

  async update(
    id: string,
    data: InventoryItemRowUpdate,
    executor: Executor = getDb(),
  ) {
    const [item] = await executor
      .update(inventoryItems)
      .set(data)
      .where(and(eq(inventoryItems.id, id), isNull(inventoryItems.deletedAt)))
      .returning();

    return item ?? null;
  }

  async updateMetadata(
    id: string,
    data: InventoryItemMetadataUpdate,
    executor: Executor = getDb(),
  ) {
    const [item] = await executor
      .update(inventoryItems)
      .set(data)
      .where(and(eq(inventoryItems.id, id), isNull(inventoryItems.deletedAt)))
      .returning();

    return item ?? null;
  }

  async updatePurchaseMetrics(
    id: string,
    data: InventoryItemPurchaseMetricsUpdate,
    executor: Executor = getDb(),
  ) {
    const [item] = await executor
      .update(inventoryItems)
      .set(data)
      .where(and(eq(inventoryItems.id, id), isNull(inventoryItems.deletedAt)))
      .returning();

    return item ?? null;
  }

  async applyQuantityDelta(
    id: string,
    delta: number,
    updatedAt: Date,
    executor: Executor = getDb(),
  ) {
    const nextQuantityExpression =
      sql`round((${inventoryItems.currentQuantity} + ${delta})::numeric, ${INVENTORY_QUANTITY_DECIMALS})::double precision`;

    const [item] = await executor
      .update(inventoryItems)
      .set({
        currentQuantity: nextQuantityExpression,
        updatedAt,
      })
      .where(
        and(
          eq(inventoryItems.id, id),
          isNull(inventoryItems.deletedAt),
          sql`round((${inventoryItems.currentQuantity} + ${delta})::numeric, ${INVENTORY_QUANTITY_DECIMALS}) >= 0`,
        ),
      )
      .returning();

    return item ?? null;
  }

  async markDeleted(id: string, deletedAt: Date, executor: Executor = getDb()) {
    const [item] = await executor
      .update(inventoryItems)
      .set({
        deletedAt,
        updatedAt: deletedAt,
      })
      .where(and(eq(inventoryItems.id, id), isNull(inventoryItems.deletedAt)))
      .returning();

    return item ?? null;
  }
}
