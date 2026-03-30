import { asc, eq, inArray } from "drizzle-orm";
import { recipeComponents } from "@shared/schema";
import { getDb } from "../db";

type Executor = ReturnType<typeof getDb> | any;

export interface RecipeComponentRowInsert {
  recipeId: string;
  componentType: "Ingrediente" | "Receita";
  inventoryItemId: string | null;
  childRecipeId: string | null;
  quantityMilli: number;
  quantityUnit: string;
  position: number;
  notes: string | null;
}

export class RecipeComponentsRepository {
  async listByRecipeId(recipeId: string, executor: Executor = getDb()) {
    return executor
      .select()
      .from(recipeComponents)
      .where(eq(recipeComponents.recipeId, recipeId))
      .orderBy(asc(recipeComponents.position), asc(recipeComponents.createdAt));
  }

  async listByRecipeIds(recipeIds: string[], executor: Executor = getDb()) {
    if (recipeIds.length === 0) {
      return [];
    }

    return executor
      .select()
      .from(recipeComponents)
      .where(inArray(recipeComponents.recipeId, recipeIds))
      .orderBy(asc(recipeComponents.recipeId), asc(recipeComponents.position));
  }

  async listAll(executor: Executor = getDb()) {
    return executor
      .select()
      .from(recipeComponents)
      .orderBy(asc(recipeComponents.recipeId), asc(recipeComponents.position));
  }

  async insertMany(
    values: RecipeComponentRowInsert[],
    executor: Executor = getDb(),
  ) {
    if (values.length === 0) {
      return [];
    }

    return executor.insert(recipeComponents).values(values).returning();
  }

  async deleteByRecipeId(recipeId: string, executor: Executor = getDb()) {
    await executor
      .delete(recipeComponents)
      .where(eq(recipeComponents.recipeId, recipeId));
  }
}
