import type {
  InventoryItem,
  ProductionForecast,
  ProductionForecastAggregate,
  RecipeDetail,
} from "@shared/types";
import {
  convertQuantity,
  convertRecipeQuantityToInventoryUnits,
  normalizeRecipeName,
} from "../domain/recipes/recipe-domain";
import { InventoryItemsRepository } from "../repositories/inventory-items.repository";
import { OrdersRepository } from "../repositories/orders.repository";
import { RecipesService } from "./recipes.service";

function roundQuantity(value: number) {
  return Math.round(value * 1000) / 1000;
}

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function addAggregate(
  target: Map<string, ProductionForecastAggregate>,
  aggregate: ProductionForecastAggregate,
) {
  const existing = target.get(aggregate.id);

  if (existing) {
    existing.quantity = roundQuantity(existing.quantity + aggregate.quantity);
    return;
  }

  target.set(aggregate.id, { ...aggregate, quantity: roundQuantity(aggregate.quantity) });
}

export class ProductionForecastService {
  private readonly ordersRepository = new OrdersRepository();
  private readonly recipesService = new RecipesService();
  private readonly inventoryItemsRepository = new InventoryItemsRepository();
  private readonly recipeCache = new Map<string, RecipeDetail>();
  private readonly inventoryCache = new Map<string, InventoryItem>();

  async getForecast(filters: { deliveryDate?: string }): Promise<ProductionForecast> {
    const rows = await this.ordersRepository.listPendingProductionRows();
    const recipeTotals = new Map<string, ProductionForecastAggregate>();
    const ingredientTotals = new Map<string, ProductionForecastAggregate>();
    const fillingTotals = new Map<string, ProductionForecastAggregate>();
    const orders = new Map<string, ProductionForecast["orders"][number]>();
    let itemCount = 0;

    for (const row of rows) {
      if (!["Confirmado", "EmProducao"].includes(row.status)) {
        continue;
      }

      if (filters.deliveryDate && row.deliveryDate !== filters.deliveryDate) {
        continue;
      }

      const resolvedRecipe =
        row.recipeId != null
          ? {
              recipeId: row.recipeId,
              fillingRecipeIds: [
                row.fillingRecipeId,
                row.secondaryFillingRecipeId,
                row.tertiaryFillingRecipeId,
              ].filter((value): value is string => Boolean(value)),
            }
          : await this.recipesService.resolveLegacyOrderItemRecipes(row.productName);

      if (!resolvedRecipe?.recipeId) {
        continue;
      }

      itemCount += 1;
      orders.set(row.orderId, {
        orderId: row.orderId,
        orderNumber: row.orderNumber,
        customerName: row.customerName,
        deliveryDate: row.deliveryDate,
        status: row.status,
      });

      await this.collectRecipeDemand(
        resolvedRecipe.recipeId,
        row.quantity,
        recipeTotals,
        ingredientTotals,
        fillingTotals,
        [],
        resolvedRecipe.fillingRecipeIds,
        true,
      );
    }

    const totalsByRecipe = Array.from(recipeTotals.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
    const totalsByIngredient = Array.from(ingredientTotals.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );

    return {
      generatedAt: new Date().toISOString(),
      filters,
      orderCount: orders.size,
      itemCount,
      totalsByRecipe,
      totalsByIngredient,
      highlightedTotals: {
        chocolate: totalsByIngredient.filter((item) =>
          normalizeLabel(item.name).includes("chocolate"),
        ),
        filling: Array.from(fillingTotals.values()).sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR"),
        ),
        leiteCondensado: totalsByIngredient.filter((item) =>
          normalizeLabel(item.name).includes("leite condensado"),
        ),
        cremeDeLeite: totalsByIngredient.filter((item) =>
          normalizeLabel(item.name).includes("creme de leite"),
        ),
      },
      orders: Array.from(orders.values()).sort((a, b) =>
        a.deliveryDate === b.deliveryDate
          ? a.orderNumber.localeCompare(b.orderNumber)
          : a.deliveryDate.localeCompare(b.deliveryDate),
      ),
    };
  }

  private async collectRecipeDemand(
    recipeId: string,
    requestedOutputQuantity: number,
    recipeTotals: Map<string, ProductionForecastAggregate>,
    ingredientTotals: Map<string, ProductionForecastAggregate>,
    fillingTotals: Map<string, ProductionForecastAggregate>,
    stack: string[],
    fillingRecipeIds: string[] = [],
    allowFillingOverride = false,
  ) {
    if (stack.includes(recipeId)) {
      return;
    }

    const recipe = await this.getRecipe(recipeId);
    addAggregate(recipeTotals, {
      id: recipe.id,
      name: recipe.name,
      quantity: requestedOutputQuantity,
      unit: recipe.outputUnit,
    });

    const factor =
      recipe.outputQuantity > 0 ? requestedOutputQuantity / recipe.outputQuantity : 0;
    let fillingApplied = false;

    for (const component of recipe.components) {
      const requestedComponentQuantity = component.quantity * factor;

      if (component.componentType === "Ingrediente" && component.inventoryItemId) {
        const item = await this.getInventoryItem(component.inventoryItemId);
        const inventoryQuantity = convertRecipeQuantityToInventoryUnits(
          requestedComponentQuantity,
          component.quantityUnit,
          item,
        );

        addAggregate(ingredientTotals, {
          id: item.id,
          name: item.name,
          quantity: inventoryQuantity,
          unit: item.unit,
        });
        continue;
      }

      const overrideFillingIds =
        allowFillingOverride && !fillingApplied ? fillingRecipeIds : [];

      if (overrideFillingIds.length > 0) {
        fillingApplied = true;
        const splitQuantity = requestedComponentQuantity / overrideFillingIds.length;

        for (const fillingRecipeId of overrideFillingIds) {
          const fillingRecipe = await this.getRecipe(fillingRecipeId);
          const fillingOutputQuantity = convertQuantity(
            splitQuantity,
            component.quantityUnit,
            fillingRecipe.outputUnit,
          );

          addAggregate(fillingTotals, {
            id: fillingRecipe.id,
            name: fillingRecipe.name,
            quantity: fillingOutputQuantity,
            unit: fillingRecipe.outputUnit,
          });

          await this.collectRecipeDemand(
            fillingRecipeId,
            fillingOutputQuantity,
            recipeTotals,
            ingredientTotals,
            fillingTotals,
            [...stack, recipeId],
            [],
            false,
          );
        }

        continue;
      }

      if (!component.childRecipeId) {
        continue;
      }

      const childRecipe = await this.getRecipe(component.childRecipeId);
      const childOutputQuantity = convertQuantity(
        requestedComponentQuantity,
        component.quantityUnit,
        childRecipe.outputUnit,
      );

      await this.collectRecipeDemand(
        component.childRecipeId,
        childOutputQuantity,
        recipeTotals,
        ingredientTotals,
        fillingTotals,
        [...stack, recipeId],
        [],
        false,
      );
    }
  }

  private async getRecipe(recipeId: string) {
    if (!this.recipeCache.has(recipeId)) {
      this.recipeCache.set(recipeId, await this.recipesService.getById(recipeId));
    }

    return this.recipeCache.get(recipeId)!;
  }

  private async getInventoryItem(itemId: string) {
    if (!this.inventoryCache.has(itemId)) {
      const row = await this.inventoryItemsRepository.findById(itemId);

      if (!row) {
        throw new Error("Inventory item not found.");
      }

      this.inventoryCache.set(itemId, {
        id: row.id,
        name: row.name,
        category: row.category,
        currentQuantity: Number(row.currentQuantity),
        minQuantity: Number(row.minQuantity),
        unit: row.unit,
        recipeEquivalentQuantity:
          row.recipeEquivalentQuantity == null
            ? null
            : Number(row.recipeEquivalentQuantity),
        recipeEquivalentUnit: row.recipeEquivalentUnit ?? null,
        purchaseUnitCostCents:
          row.purchaseUnitCostCents == null
            ? null
            : Number(row.purchaseUnitCostCents),
        notes: row.notes ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        deletedAt: row.deletedAt?.toISOString() ?? null,
      });
    }

    return this.inventoryCache.get(itemId)!;
  }
}
