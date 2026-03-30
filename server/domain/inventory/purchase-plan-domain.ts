import type { InventoryItem } from "@shared/types";

export function roundToThreeDecimals(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function getSuggestedPurchaseQuantity(
  shortageQuantity: number,
  itemUnit: InventoryItem["unit"],
) {
  if (itemUnit === "un" || itemUnit === "caixa") {
    return Math.ceil(shortageQuantity);
  }

  return roundToThreeDecimals(shortageQuantity);
}
