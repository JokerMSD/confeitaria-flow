import { shouldConsumeOrderStock } from "../recipes/recipe-domain";

type StockAwareOrderItem = {
  recipeId: string | null;
  fillingRecipeId?: string | null;
  secondaryFillingRecipeId?: string | null;
  tertiaryFillingRecipeId?: string | null;
  quantity: number;
  productName?: string | null;
};

function normalizeItemToken(value: string | null | undefined) {
  return value?.trim() || null;
}

function buildOrderItemStockKey(item: StockAwareOrderItem) {
  return JSON.stringify({
    recipeId: normalizeItemToken(item.recipeId),
    fillingRecipeId: normalizeItemToken(item.fillingRecipeId),
    secondaryFillingRecipeId: normalizeItemToken(item.secondaryFillingRecipeId),
    tertiaryFillingRecipeId: normalizeItemToken(item.tertiaryFillingRecipeId),
    quantity: item.quantity,
    productName: normalizeItemToken(item.productName),
  });
}

function hasStockRelevantItemChanges(
  previousItems: StockAwareOrderItem[],
  nextItems: StockAwareOrderItem[],
) {
  if (previousItems.length !== nextItems.length) {
    return true;
  }

  return previousItems.some((item, index) => {
    const nextItem = nextItems[index];
    return buildOrderItemStockKey(item) !== buildOrderItemStockKey(nextItem);
  });
}

export function shouldResyncOrderStock(input: {
  previousStatus: string;
  nextStatus: string;
  previousItems: StockAwareOrderItem[];
  nextItems: StockAwareOrderItem[];
}) {
  const previouslyConsumed = shouldConsumeOrderStock(input.previousStatus);
  const nextConsumes = shouldConsumeOrderStock(input.nextStatus);

  if (previouslyConsumed !== nextConsumes) {
    return true;
  }

  if (!nextConsumes) {
    return false;
  }

  return hasStockRelevantItemChanges(input.previousItems, input.nextItems);
}
