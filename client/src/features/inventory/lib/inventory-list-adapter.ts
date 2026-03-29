import type {
  InventoryItem as ApiInventoryItem,
  InventoryItemCategory as ApiInventoryCategory,
} from "@shared/types";
import type { InventoryListItem, UiInventoryCategory } from "../types/inventory-ui";

const categoryLabelMap: Record<ApiInventoryCategory, UiInventoryCategory> = {
  ProdutoPronto: "Produto Pronto",
  Ingrediente: "Ingrediente",
  Embalagem: "Embalagem",
};

export function adaptInventoryItemToListItem(
  item: ApiInventoryItem,
): InventoryListItem {
  return {
    id: item.id,
    name: item.name,
    category: categoryLabelMap[item.category],
    currentQuantity: item.currentQuantity,
    minQuantity: item.minQuantity,
    unit: item.unit,
    notes: item.notes ?? "",
    isLowStock: item.currentQuantity <= item.minQuantity,
  };
}

export function adaptInventoryItemsToList(items: ApiInventoryItem[]) {
  return items.map(adaptInventoryItemToListItem);
}
