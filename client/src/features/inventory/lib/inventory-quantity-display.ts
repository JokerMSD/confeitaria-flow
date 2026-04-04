import type { UiInventoryUnit } from "../types/inventory-ui";

function normalizeNearInteger(value: number) {
  const rounded = Math.round(value);

  if (Math.abs(value - rounded) < 0.001) {
    return rounded;
  }

  return value;
}

function getDisplayPrecision(unit: UiInventoryUnit) {
  if (unit === "un" || unit === "caixa" || unit === "kg" || unit === "l") {
    return 2;
  }

  return 1;
}

export function formatInventoryQuantity(
  rawValue: number,
  unit: UiInventoryUnit,
): { value: string; unit: UiInventoryUnit } {
  const safeValue = Number.isFinite(rawValue) ? rawValue : 0;

  if (unit === "g" && Math.abs(safeValue) >= 1000) {
    const converted = normalizeNearInteger(safeValue / 1000);
    return {
      value: converted.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: getDisplayPrecision("kg"),
      }),
      unit: "kg",
    };
  }

  if (unit === "ml" && Math.abs(safeValue) >= 1000) {
    const converted = normalizeNearInteger(safeValue / 1000);
    return {
      value: converted.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: getDisplayPrecision("l"),
      }),
      unit: "l",
    };
  }

  const normalized = normalizeNearInteger(safeValue);

  return {
    value: normalized.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: getDisplayPrecision(unit),
    }),
    unit,
  };
}
