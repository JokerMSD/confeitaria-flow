import type { InventoryItem, InventoryItemUnit } from "@shared/types";
import { HttpError } from "../../utils/http-error";

const ORDER_STOCK_CONSUMPTION_STATUSES = new Set(["Pronto", "Entregue"]);
const INVENTORY_QUANTITY_SCALE = 1000;

export function shouldConsumeOrderStock(status: string) {
  return ORDER_STOCK_CONSUMPTION_STATUSES.has(status);
}

export function normalizeInventoryQuantity(quantity: number) {
  return Math.round(quantity * INVENTORY_QUANTITY_SCALE) / INVENTORY_QUANTITY_SCALE;
}

export function normalizeRecipeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bovo de pascoa recheado\b/g, "ovo trufado")
    .replace(/\b(ovo de colher|ovo trufado)\s+(350|500|750)\b/g, "$1 $2g")
    .replace(/\s+/g, " ")
    .trim();
}

function getUnitFamily(unit: InventoryItemUnit) {
  if (unit === "g" || unit === "kg") {
    return "massa";
  }

  if (unit === "ml" || unit === "l") {
    return "volume";
  }

  if (unit === "un") {
    return "unidade";
  }

  if (unit === "caixa") {
    return "caixa";
  }

  return "desconhecido";
}

export function convertQuantity(
  quantity: number,
  fromUnit: InventoryItemUnit,
  toUnit: InventoryItemUnit,
) {
  if (fromUnit === toUnit) {
    return quantity;
  }

  const fromFamily = getUnitFamily(fromUnit);
  const toFamily = getUnitFamily(toUnit);

  if (fromFamily !== toFamily) {
    throw new HttpError(
      400,
      `Recipe quantity unit ${fromUnit} is incompatible with ${toUnit}.`,
    );
  }

  if (fromFamily === "massa") {
    if (fromUnit === "kg" && toUnit === "g") return quantity * 1000;
    if (fromUnit === "g" && toUnit === "kg") return quantity / 1000;
  }

  if (fromFamily === "volume") {
    if (fromUnit === "l" && toUnit === "ml") return quantity * 1000;
    if (fromUnit === "ml" && toUnit === "l") return quantity / 1000;
  }

  throw new HttpError(
    400,
    `Recipe unit conversion from ${fromUnit} to ${toUnit} is not supported.`,
  );
}

export function convertRecipeQuantityToInventoryUnits(
  quantity: number,
  fromUnit: InventoryItemUnit,
  item: InventoryItem,
) {
  if (fromUnit === item.unit) {
    return quantity;
  }

  try {
    return convertQuantity(quantity, fromUnit, item.unit);
  } catch {}

  if (
    item.recipeEquivalentQuantity != null &&
    item.recipeEquivalentUnit != null &&
    (item.unit === "un" || item.unit === "caixa")
  ) {
    const equivalentQuantity = convertQuantity(
      quantity,
      fromUnit,
      item.recipeEquivalentUnit,
    );

    return equivalentQuantity / item.recipeEquivalentQuantity;
  }

  throw new HttpError(
    400,
    `Recipe quantity unit ${fromUnit} is incompatible with inventory unit ${item.unit} for item ${item.name}.`,
  );
}

function roundForDisplay(value: number) {
  if (value >= 10) {
    return Math.round(value * 10) / 10;
  }

  if (value >= 1) {
    return Math.round(value * 100) / 100;
  }

  return Math.round(value * 1000) / 1000;
}

function formatNumberPtBr(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(roundForDisplay(value));
}

function formatQuantityWithUnit(quantity: number, unit: InventoryItemUnit) {
  return `${formatNumberPtBr(quantity)} ${unit}`;
}

export function formatInventoryShortage(item: InventoryItem, missingQuantity: number) {
  if (
    (item.unit === "un" || item.unit === "caixa") &&
    item.recipeEquivalentQuantity != null &&
    item.recipeEquivalentUnit != null
  ) {
    const equivalentShortage = missingQuantity * item.recipeEquivalentQuantity;
    return `${item.name} (faltam aprox. ${formatQuantityWithUnit(
      equivalentShortage,
      item.recipeEquivalentUnit,
    )})`;
  }

  return `${item.name} (faltam ${formatQuantityWithUnit(missingQuantity, item.unit)})`;
}
