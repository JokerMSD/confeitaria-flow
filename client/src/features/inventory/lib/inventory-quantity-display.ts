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
): {
  value: string;
  unit: UiInventoryUnit;
  inlineLabel: string;
  detail: string | null;
} {
  const safeValue = Number.isFinite(rawValue) ? rawValue : 0;

  if (unit === "g" && Math.abs(safeValue) >= 1000) {
    const converted = normalizeNearInteger(safeValue / 1000);
    const value = converted.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: getDisplayPrecision("kg"),
    });
    return {
      value,
      unit: "kg",
      inlineLabel: `${value} kg`,
      detail: null,
    };
  }

  if (unit === "ml" && Math.abs(safeValue) >= 1000) {
    const converted = normalizeNearInteger(safeValue / 1000);
    const value = converted.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: getDisplayPrecision("l"),
    });
    return {
      value,
      unit: "l",
      inlineLabel: `${value} l`,
      detail: null,
    };
  }

  const normalized = normalizeNearInteger(safeValue);
  const value = normalized.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: getDisplayPrecision(unit),
  });

  if ((unit === "un" || unit === "caixa") && normalized > 0 && normalized < 1) {
    const percent = Math.round(normalized * 100);
    const detail = `aprox. ${value} ${unit}`;
    return {
      value: `${percent}%`,
      unit,
      inlineLabel: `${percent}% da ${unit === "un" ? "unidade" : "caixa"}`,
      detail,
    };
  }

  return {
    value,
    unit,
    inlineLabel: `${value} ${unit}`,
    detail: null,
  };
}
