import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { recipeMedia } from "@shared/schema";
import { getDb } from "../db";

type Executor = ReturnType<typeof getDb> | any;

export interface RecipeMediaRowInsert {
  recipeId: string;
  fileUrl: string;
  altText: string | null;
  position: number;
}

export class RecipeMediaRepository {
  async listByRecipeIds(recipeIds: string[], executor: Executor = getDb()) {
    if (recipeIds.length === 0) {
      return [];
    }

    return executor
      .select()
      .from(recipeMedia)
      .where(
        and(inArray(recipeMedia.recipeId, recipeIds), isNull(recipeMedia.deletedAt)),
      )
      .orderBy(asc(recipeMedia.recipeId), asc(recipeMedia.position), asc(recipeMedia.createdAt));
  }

  async findById(id: string, executor: Executor = getDb()) {
    const [row] = await executor
      .select()
      .from(recipeMedia)
      .where(and(eq(recipeMedia.id, id), isNull(recipeMedia.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async create(data: RecipeMediaRowInsert, executor: Executor = getDb()) {
    const [row] = await executor.insert(recipeMedia).values(data).returning();
    return row;
  }

  async countByRecipeId(recipeId: string, executor: Executor = getDb()) {
    const rows = await this.listByRecipeIds([recipeId], executor);
    return rows.length;
  }

  async markDeleted(id: string, deletedAt: Date, executor: Executor = getDb()) {
    const [row] = await executor
      .update(recipeMedia)
      .set({
        deletedAt,
        updatedAt: deletedAt,
      })
      .where(and(eq(recipeMedia.id, id), isNull(recipeMedia.deletedAt)))
      .returning();

    return row ?? null;
  }

  async markDeletedByRecipeId(
    recipeId: string,
    deletedAt: Date,
    executor: Executor = getDb(),
  ) {
    return executor
      .update(recipeMedia)
      .set({
        deletedAt,
        updatedAt: deletedAt,
      })
      .where(and(eq(recipeMedia.recipeId, recipeId), isNull(recipeMedia.deletedAt)))
      .returning();
  }
}
