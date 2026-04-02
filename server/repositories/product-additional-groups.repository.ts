import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { productAdditionalGroups } from "@shared/schema";
import { getDb } from "../db";

type Executor = ReturnType<typeof getDb> | any;

export interface ProductAdditionalGroupRowInsert {
  productRecipeId: string;
  name: string;
  selectionType: "single" | "multiple";
  minSelections: number;
  maxSelections: number;
  position: number;
  notes: string | null;
}

export interface ProductAdditionalGroupRowUpdate
  extends ProductAdditionalGroupRowInsert {
  updatedAt: Date;
}

export class ProductAdditionalGroupsRepository {
  async findById(id: string, executor: Executor = getDb()) {
    const [group] = await executor
      .select()
      .from(productAdditionalGroups)
      .where(
        and(
          eq(productAdditionalGroups.id, id),
          isNull(productAdditionalGroups.deletedAt),
        ),
      )
      .limit(1);

    return group ?? null;
  }

  async listByProductRecipeIds(
    productRecipeIds: string[],
    executor: Executor = getDb(),
  ) {
    if (productRecipeIds.length === 0) {
      return [];
    }

    return executor
      .select()
      .from(productAdditionalGroups)
      .where(
        and(
          inArray(productAdditionalGroups.productRecipeId, productRecipeIds),
          isNull(productAdditionalGroups.deletedAt),
        ),
      )
      .orderBy(
        asc(productAdditionalGroups.position),
        asc(productAdditionalGroups.createdAt),
      );
  }

  async listByProductRecipeId(
    productRecipeId: string,
    executor: Executor = getDb(),
  ) {
    return executor
      .select()
      .from(productAdditionalGroups)
      .where(
        and(
          eq(productAdditionalGroups.productRecipeId, productRecipeId),
          isNull(productAdditionalGroups.deletedAt),
        ),
      )
      .orderBy(
        asc(productAdditionalGroups.position),
        asc(productAdditionalGroups.createdAt),
      );
  }

  async create(
    data: ProductAdditionalGroupRowInsert,
    executor: Executor = getDb(),
  ) {
    const [group] = await executor
      .insert(productAdditionalGroups)
      .values(data)
      .returning();

    return group;
  }

  async update(
    id: string,
    data: ProductAdditionalGroupRowUpdate,
    executor: Executor = getDb(),
  ) {
    const [group] = await executor
      .update(productAdditionalGroups)
      .set(data)
      .where(
        and(
          eq(productAdditionalGroups.id, id),
          isNull(productAdditionalGroups.deletedAt),
        ),
      )
      .returning();

    return group ?? null;
  }

  async markDeleted(
    id: string,
    deletedAt: Date,
    executor: Executor = getDb(),
  ) {
    const [group] = await executor
      .update(productAdditionalGroups)
      .set({
        deletedAt,
        updatedAt: deletedAt,
      })
      .where(
        and(
          eq(productAdditionalGroups.id, id),
          isNull(productAdditionalGroups.deletedAt),
        ),
      )
      .returning();

    return group ?? null;
  }
}
