import type { InventoryPurchasePlan } from "@shared/types";
import type { InventoryPurchasePlanView } from "../types/inventory-ui";

function mapUnit(unit: InventoryPurchasePlan["items"][number]["itemUnit"]) {
  return unit;
}

export function adaptInventoryPurchasePlan(
  plan: InventoryPurchasePlan,
): InventoryPurchasePlanView {
  return {
    pendingOrderCount: plan.pendingOrderCount,
    pendingOrderItemCount: plan.pendingOrderItemCount,
    shortageItemCount: plan.shortageItemCount,
    estimatedPurchaseCost: plan.estimatedPurchaseCostCents / 100,
    hasItemsWithoutCost: plan.hasItemsWithoutCost,
    items: plan.items.map((item) => ({
      itemId: item.itemId,
      itemName: item.itemName,
      itemUnit: mapUnit(item.itemUnit),
      currentQuantity: item.currentQuantity,
      requiredQuantity: item.requiredQuantity,
      deficitQuantity: item.deficitQuantity,
      suggestedPurchaseQuantity: item.suggestedPurchaseQuantity,
      estimatedPurchaseCost:
        item.estimatedPurchaseCostCents == null
          ? null
          : item.estimatedPurchaseCostCents / 100,
      sourceCount: item.sourceCount,
      sources: item.sources.map((source) => ({
        orderId: source.orderId,
        orderNumber: source.orderNumber,
        customerName: source.customerName,
        deliveryDate: source.deliveryDate,
        productName: source.productName,
        quantity: source.quantity,
        usesLegacyRecipeResolution: source.usesLegacyRecipeResolution,
      })),
    })),
  };
}
