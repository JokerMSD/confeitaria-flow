import type { InventoryItem, InventoryPurchasePlan } from "@shared/types";
import {
  getSuggestedPurchaseQuantity,
  roundToThreeDecimals,
} from "../domain/inventory/purchase-plan-domain";
import { InventoryItemsRepository } from "../repositories/inventory-items.repository";
import { OrdersRepository } from "../repositories/orders.repository";
import { RecipesService } from "./recipes.service";

function mapInventoryItem(row: any): InventoryItem {
  return {
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
  };
}

export class InventoryPurchasePlanService {
  private readonly ordersRepository = new OrdersRepository();
  private readonly recipesService = new RecipesService();
  private readonly inventoryItemsRepository = new InventoryItemsRepository();

  async getPlan(): Promise<InventoryPurchasePlan> {
    const rows = await this.ordersRepository.listPendingProductionRows();
    const pendingOrderIds = new Set<string>();
    const requirements = new Map<string, number>();
    const orderCountByItemId = new Map<string, Set<string>>();
    const sourcesByItemId = new Map<
      string,
      InventoryPurchasePlan["items"][number]["sources"]
    >();

    for (const row of rows as any[]) {
      pendingOrderIds.add(row.orderId);
      const resolvedRecipe = row.recipeId
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

      const exploded = await this.recipesService.explodeRecipeToInventory(
        resolvedRecipe.recipeId,
        row.quantity,
        undefined,
        resolvedRecipe.fillingRecipeIds,
      );

      for (const [itemId, quantity] of Array.from(exploded.entries())) {
        requirements.set(itemId, (requirements.get(itemId) ?? 0) + quantity);

        const affectedOrders = orderCountByItemId.get(itemId) ?? new Set<string>();
        affectedOrders.add(row.orderId);
        orderCountByItemId.set(itemId, affectedOrders);

        const sources = sourcesByItemId.get(itemId) ?? [];
        sources.push({
          orderId: row.orderId,
          orderNumber: row.orderNumber,
          customerName: row.customerName,
          deliveryDate: row.deliveryDate,
          productName: row.productName,
          quantity: row.quantity,
          usesLegacyRecipeResolution:
            resolvedRecipe.resolutionStrategy === "legacy-name",
        });
        sourcesByItemId.set(itemId, sources);
      }
    }

    const items: InventoryPurchasePlan["items"] = [];
    let totalEstimatedPurchaseCostCents = 0;
    let hasItemsWithoutCost = false;

    for (const [itemId, requiredQuantityRaw] of Array.from(requirements.entries())) {
      const itemRow = await this.inventoryItemsRepository.findById(itemId);

      if (!itemRow) {
        continue;
      }

      const item = mapInventoryItem(itemRow);
      const requiredQuantity = roundToThreeDecimals(requiredQuantityRaw);
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
      const estimatedPurchaseCostForItemCents =
        item.purchaseUnitCostCents == null
          ? null
          : Math.round(suggestedPurchaseQuantity * item.purchaseUnitCostCents);

      if (estimatedPurchaseCostForItemCents == null) {
        hasItemsWithoutCost = true;
      } else {
        totalEstimatedPurchaseCostCents += estimatedPurchaseCostForItemCents;
      }

      const sources = sourcesByItemId.get(itemId) ?? [];

      items.push({
        itemId: item.id,
        itemName: item.name,
        itemUnit: item.unit,
        currentQuantity: roundToThreeDecimals(item.currentQuantity),
        requiredQuantity,
        deficitQuantity,
        suggestedPurchaseQuantity,
        purchaseUnitCostCents: item.purchaseUnitCostCents,
        estimatedPurchaseCostCents: estimatedPurchaseCostForItemCents,
        sourceCount: orderCountByItemId.get(itemId)?.size ?? 0,
        sources,
      });
    }

    items.sort((a, b) => {
      if (b.deficitQuantity !== a.deficitQuantity) {
        return b.deficitQuantity - a.deficitQuantity;
      }

      return a.itemName.localeCompare(b.itemName);
    });

    return {
      pendingOrderCount: pendingOrderIds.size,
      pendingOrderItemCount: rows.length,
      shortageItemCount: items.length,
      estimatedPurchaseCostCents: totalEstimatedPurchaseCostCents,
      hasItemsWithoutCost,
      items,
    };
  }
}
