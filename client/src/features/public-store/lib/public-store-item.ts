import type { PublicStoreProductDetail } from "@shared/types";

type AdditionalLike = {
  groupId: string;
  optionId: string;
  priceDeltaCents: number;
};

type ItemLike = {
  unitPriceCents: number;
  quantity: number;
  additionals: AdditionalLike[];
};

function normalizeValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function supportsMultiplePublicFillings(productName: string) {
  const normalized = normalizeValue(productName);
  return (
    normalized.includes("ovo de colher") ||
    normalized.includes("ovo trufado") ||
    normalized.includes("ovo de pascoa recheado")
  );
}

export function buildPublicOrderItemName(
  productName: string,
  fillingNames: string[],
) {
  return fillingNames.length > 0
    ? `${productName} - ${fillingNames.join(" / ")}`
    : productName;
}

export function getPublicProductUnitPriceCents(product: PublicStoreProductDetail) {
  return product.effectiveSalePriceCents ?? product.salePriceCents ?? 0;
}

export function calculatePublicItemUnitTotalCents(item: {
  unitPriceCents: number;
  additionals: AdditionalLike[];
}) {
  return (
    item.unitPriceCents +
    item.additionals.reduce(
      (sum, additional) => sum + additional.priceDeltaCents,
      0,
    )
  );
}

export function calculatePublicItemLineTotalCents(item: ItemLike) {
  return item.quantity * calculatePublicItemUnitTotalCents(item);
}

export function buildPublicCartLineId(
  recipeId: string,
  fillingRecipeIds: string[],
  additionals: AdditionalLike[],
) {
  const fillingSuffix = fillingRecipeIds.slice().sort().join("|");
  const additionalsSuffix = additionals
    .map((additional) => `${additional.groupId}:${additional.optionId}`)
    .sort()
    .join("|");

  return [recipeId, fillingSuffix, additionalsSuffix].filter(Boolean).join(":");
}
