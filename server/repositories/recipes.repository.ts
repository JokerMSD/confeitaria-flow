import { and, asc, eq, ilike, isNull } from "drizzle-orm";
import { recipes } from "@shared/schema";
import type { ListRecipesFilters, RecipeKind } from "@shared/types";
import { getDb } from "../db";

type Executor = ReturnType<typeof getDb> | any;

export interface RecipeRowInsert {
  name: string;
  kind: RecipeKind;
  outputQuantityMilli: number;
  outputUnit: string;
  markupPercent: number;
  salePriceCents: number | null;
  notes: string | null;
}

export interface RecipeRowUpdate extends RecipeRowInsert {
  updatedAt: Date;
}

export class RecipesRepository {
  async list(
    filters: ListRecipesFilters = {},
    executor: Executor = getDb(),
  ) {
    const conditions = [isNull(recipes.deletedAt)];

    if (filters.kind) {
      conditions.push(eq(recipes.kind, filters.kind));
    }

    if (filters.search) {
      conditions.push(ilike(recipes.name, `%${filters.search}%`));
    }

    return executor
      .select()
      .from(recipes)
      .where(and(...conditions))
      .orderBy(asc(recipes.name), asc(recipes.createdAt));
  }

  async findById(id: string, executor: Executor = getDb()) {
    const [recipe] = await executor
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, id), isNull(recipes.deletedAt)))
      .limit(1);

    return recipe ?? null;
  }

  async listAll(executor: Executor = getDb()) {
    return executor
      .select()
      .from(recipes)
      .where(isNull(recipes.deletedAt))
      .orderBy(asc(recipes.name), asc(recipes.createdAt));
  }

  async create(data: RecipeRowInsert, executor: Executor = getDb()) {
    const [recipe] = await executor.insert(recipes).values(data).returning();
    return recipe;
  }

  async update(id: string, data: RecipeRowUpdate, executor: Executor = getDb()) {
    const [recipe] = await executor
      .update(recipes)
      .set(data)
      .where(and(eq(recipes.id, id), isNull(recipes.deletedAt)))
      .returning();

    return recipe ?? null;
  }

  async markDeleted(id: string, deletedAt: Date, executor: Executor = getDb()) {
    const [recipe] = await executor
      .update(recipes)
      .set({
        deletedAt,
        updatedAt: deletedAt,
      })
      .where(and(eq(recipes.id, id), isNull(recipes.deletedAt)))
      .returning();

    return recipe ?? null;
  }
}
