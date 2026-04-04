import type {
  InventoryItem,
  ProductionForecast,
  ProductionForecastAggregate,
  ProductionForecastPurchaseSuggestion,
  RecipeDetail,
} from "@shared/types";
import {
  convertQuantity,
  convertRecipeQuantityToInventoryUnits,
  normalizeRecipeName,
} from "../domain/recipes/recipe-domain";
import {
  getSuggestedPurchaseQuantity,
  roundToThreeDecimals,
} from "../domain/inventory/purchase-plan-domain";
import { InventoryItemsRepository } from "../repositories/inventory-items.repository";
import { OrderItemAdditionalsRepository } from "../repositories/order-item-additionals.repository";
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

function isForecastSkippableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message === "Recipe not found." ||
    error.message === "Inventory item not found."
  );
}

export class ProductionForecastService {
  private readonly ordersRepository = new OrdersRepository();
  private readonly orderItemAdditionalsRepository =
    new OrderItemAdditionalsRepository();
  private readonly recipesService = new RecipesService();
  private readonly inventoryItemsRepository = new InventoryItemsRepository();
  private readonly recipeCache = new Map<string, RecipeDetail>();
  private readonly inventoryCache = new Map<string, InventoryItem>();

  async getForecast(filters: {
    deliveryDate?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ProductionForecast> {
    const rows = await this.ordersRepository.listPendingProductionRows();
    const recipeTotals = new Map<string, ProductionForecastAggregate>();
    const ingredientTotals = new Map<string, ProductionForecastAggregate>();
    const fillingTotals = new Map<string, ProductionForecastAggregate>();
    const additionalTotals = new Map<
      string,
      ProductionForecastAggregate & { groupName: string }
    >();
    const orders = new Map<string, ProductionForecast["orders"][number]>();
    const additionals = await this.orderItemAdditionalsRepository.listByOrderItemIds(
      rows.map((row: any) => row.itemId),
    );
    const additionalsByOrderItemId = new Map<string, typeof additionals>();

    for (const additional of additionals as any[]) {
      const current = additionalsByOrderItemId.get(additional.orderItemId) ?? [];
      current.push(additional);
      additionalsByOrderItemId.set(additional.orderItemId, current);
    }

    let itemCount = 0;

    for (const row of rows) {
      if (!["Confirmado", "EmProducao"].includes(row.status)) {
        continue;
      }

      if (filters.deliveryDate && row.deliveryDate !== filters.deliveryDate) {
        continue;
      }

      if (filters.dateFrom && row.deliveryDate < filters.dateFrom) {
        continue;
      }

      if (filters.dateTo && row.deliveryDate > filters.dateTo) {
        continue;
      }

      try {
        const resolvedRecipe =
          row.recipeId != null
            ? {
                recipeId: row.recipeId,
                fillingRecipeIds: [
                  row.fillingRecipeId,
                  row.secondaryFillingRecipeId,
                  row.tertiaryFillingRecipeId,
                ].filter((value): value is string => Boolean(value)),
                resolutionStrategy: "explicit" as const,
              }
            : await this.recipesService.resolveLegacyOrderItemRecipes(
                row.productName,
              );

        if (!resolvedRecipe?.recipeId) {
          continue;
        }

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

        itemCount += 1;
        orders.set(row.orderId, {
          orderId: row.orderId,
          orderNumber: row.orderNumber,
          customerName: row.customerName,
          deliveryDate: row.deliveryDate,
          status: row.status,
        });

        const itemAdditionals = additionalsByOrderItemId.get(row.itemId) ?? [];

        for (const additional of itemAdditionals as any[]) {
          const aggregateId = `${additional.groupId}:${additional.optionId}`;
          const current = additionalTotals.get(aggregateId);
          const nextQuantity = roundQuantity(
            (current?.quantity ?? 0) + row.quantity,
          );

          additionalTotals.set(aggregateId, {
            id: aggregateId,
            groupName: additional.groupName,
            name: additional.optionName,
            quantity: nextQuantity,
            unit: "un",
          });
        }
      } catch (error) {
        if (!isForecastSkippableError(error)) {
          throw error;
        }

        console.warn(
          `[ProductionForecast] skipped order item ${row.itemId} from ${row.orderNumber}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    const totalsByRecipe = Array.from(recipeTotals.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
    const totalsByIngredient = Array.from(ingredientTotals.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
    const purchaseSuggestions = await this.buildPurchaseSuggestions(
      ingredientTotals,
    );

    return {
      generatedAt: new Date().toISOString(),
      filters,
      orderCount: orders.size,
      itemCount,
      totalsByRecipe,
      totalsByIngredient,
      totalsByAdditional: Array.from(additionalTotals.values()).sort((a, b) =>
        a.groupName === b.groupName
          ? a.name.localeCompare(b.name, "pt-BR")
          : a.groupName.localeCompare(b.groupName, "pt-BR"),
      ),
      highlightedTotals: {
        chocolate: this.mergeHighlightGroups(
          ingredientTotals,
          additionalTotals,
          ["chocolate", "cacau"],
        ),
        filling: Array.from(fillingTotals.values()).sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR"),
        ),
        leiteCondensado: this.mergeHighlightGroups(
          ingredientTotals,
          additionalTotals,
          ["leite condensado"],
        ),
        cremeDeLeite: this.mergeHighlightGroups(
          ingredientTotals,
          additionalTotals,
          ["creme de leite"],
        ),
      },
      purchaseSuggestions,
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

  private async buildPurchaseSuggestions(
    ingredientTotals: Map<string, ProductionForecastAggregate>,
  ) {
    const items: ProductionForecastPurchaseSuggestion[] = [];
    let estimatedPurchaseCostCents = 0;
    let hasItemsWithoutCost = false;

    for (const ingredient of Array.from(ingredientTotals.values())) {
      const item = await this.getInventoryItem(ingredient.id);
      const requiredQuantity = roundToThreeDecimals(ingredient.quantity);
      const deficitQuantity = roundToThreeDecimals(
        Math.max(0, requiredQuantity - item.currentQuantity),
      );

      if (deficitQuantity <= 0) {
        continue;
      }

      const suggestedPurchaseQuantity = getSuggestedPurchaseQuantity(
        deficitQuantity,
        item.unit,
      );
      const estimatedItemCostCents =
        item.purchaseUnitCostCents == null
          ? null
          : Math.round(suggestedPurchaseQuantity * item.purchaseUnitCostCents);

      if (estimatedItemCostCents == null) {
        hasItemsWithoutCost = true;
      } else {
        estimatedPurchaseCostCents += estimatedItemCostCents;
      }

      items.push({
        itemId: item.id,
        itemName: item.name,
        itemUnit: item.unit,
        currentQuantity: roundToThreeDecimals(item.currentQuantity),
        requiredQuantity,
        deficitQuantity,
        suggestedPurchaseQuantity,
        estimatedPurchaseCostCents: estimatedItemCostCents,
      });
    }

    items.sort((a, b) => {
      if (b.deficitQuantity !== a.deficitQuantity) {
        return b.deficitQuantity - a.deficitQuantity;
      }

      return a.itemName.localeCompare(b.itemName, "pt-BR");
    });

    return {
      shortageItemCount: items.length,
      estimatedPurchaseCostCents,
      hasItemsWithoutCost,
      items,
    };
  }

  private mergeHighlightGroups(
    ingredientTotals: Map<string, ProductionForecastAggregate>,
    additionalTotals: Map<string, ProductionForecastAggregate & { groupName: string }>,
    keywords: string[],
  ) {
    const matchesKeywords = (value: string) =>
      keywords.some((keyword) => normalizeLabel(value).includes(keyword));

    return [
      ...Array.from(ingredientTotals.values()).filter((item) =>
        matchesKeywords(item.name),
      ),
      ...Array.from(additionalTotals.values()).filter((item) =>
        matchesKeywords(`${item.groupName} ${item.name}`),
      ),
    ].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }
}
