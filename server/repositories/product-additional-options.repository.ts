import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { productAdditionalOptions } from "@shared/schema";
import { getDb } from "../db";

type Executor = ReturnType<typeof getDb> | any;

export interface ProductAdditionalOptionRowInsert {
  groupId: string;
  name: string;
  priceDeltaCents: number;
  position: number;
  notes: string | null;
}

export class ProductAdditionalOptionsRepository {
  async listByGroupIds(groupIds: string[], executor: Executor = getDb()) {
    if (groupIds.length === 0) {
      return [];
    }

    return executor
      .select()
      .from(productAdditionalOptions)
      .where(
        and(
          inArray(productAdditionalOptions.groupId, groupIds),
          isNull(productAdditionalOptions.deletedAt),
        ),
      )
      .orderBy(
        asc(productAdditionalOptions.position),
        asc(productAdditionalOptions.createdAt),
      );
  }

  async listByGroupId(groupId: string, executor: Executor = getDb()) {
    return executor
      .select()
      .from(productAdditionalOptions)
      .where(
        and(
          eq(productAdditionalOptions.groupId, groupId),
          isNull(productAdditionalOptions.deletedAt),
        ),
      )
      .orderBy(
        asc(productAdditionalOptions.position),
        asc(productAdditionalOptions.createdAt),
      );
  }

  async insertMany(
    rows: ProductAdditionalOptionRowInsert[],
    executor: Executor = getDb(),
  ) {
    if (rows.length === 0) {
      return [];
    }

    return executor.insert(productAdditionalOptions).values(rows).returning();
  }

  async markDeletedByGroupId(
    groupId: string,
    deletedAt: Date,
    executor: Executor = getDb(),
  ) {
    return executor
      .update(productAdditionalOptions)
      .set({
        deletedAt,
        updatedAt: deletedAt,
      })
      .where(
        and(
          eq(productAdditionalOptions.groupId, groupId),
          isNull(productAdditionalOptions.deletedAt),
        ),
      )
      .returning();
  }
}
