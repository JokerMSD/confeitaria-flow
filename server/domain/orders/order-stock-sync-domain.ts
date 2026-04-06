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

function haveComparableReferencesChanged(
  previousValue: string | null | undefined,
  nextValue: string | null | undefined,
) {
  const previousNormalized = normalizeItemToken(previousValue);
  const nextNormalized = normalizeItemToken(nextValue);

  if (previousNormalized === nextNormalized) {
    return false;
  }

  if (!previousNormalized || !nextNormalized) {
    return false;
  }

  return true;
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

    if (!nextItem) {
      return true;
    }

    if (item.quantity !== nextItem.quantity) {
      return true;
    }

    const previousProductName = normalizeItemToken(item.productName);
    const nextProductName = normalizeItemToken(nextItem.productName);

    if (previousProductName !== nextProductName) {
      return true;
    }

    return (
      haveComparableReferencesChanged(item.recipeId, nextItem.recipeId) ||
      haveComparableReferencesChanged(
        item.fillingRecipeId,
        nextItem.fillingRecipeId,
      ) ||
      haveComparableReferencesChanged(
        item.secondaryFillingRecipeId,
        nextItem.secondaryFillingRecipeId,
      ) ||
      haveComparableReferencesChanged(
        item.tertiaryFillingRecipeId,
        nextItem.tertiaryFillingRecipeId,
      )
    );
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
