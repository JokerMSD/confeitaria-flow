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

function formatBaseQuantity(value: number, unit: UiInventoryUnit) {
  if (unit === "g" && Math.abs(value) >= 1000) {
    return formatBaseQuantity(value / 1000, "kg");
  }

  if (unit === "ml" && Math.abs(value) >= 1000) {
    return formatBaseQuantity(value / 1000, "l");
  }

  const normalized = normalizeNearInteger(value);
  const formatted = normalized.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: getDisplayPrecision(unit),
  });

  return {
    value: formatted,
    unit,
    inlineLabel: `${formatted} ${unit}`,
  };
}

function formatFractionalUnitLabel(value: number, unit: "un" | "caixa") {
  const wholeUnits = Math.floor(value);
  const fractionalPart = value - wholeUnits;
  const percent = Math.round(fractionalPart * 100);
  const detail = `real: ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${unit}`;

  if (wholeUnits <= 0) {
    return {
      value: `${percent}%`,
      unit,
      inlineLabel: `${percent}% da ${unit === "un" ? "unidade" : "caixa"}`,
      detail,
    };
  }

  if (percent <= 0) {
    return {
      value: String(wholeUnits),
      unit,
      inlineLabel: `${wholeUnits} ${unit}`,
      detail: null,
    };
  }

  return {
    value: `${wholeUnits} + ${percent}%`,
    unit,
    inlineLabel: `${wholeUnits} ${unit} + ${percent}%`,
    detail,
  };
}

export function formatInventoryQuantity(
  rawValue: number,
  unit: UiInventoryUnit,
  recipeEquivalentQuantity?: number | null,
  recipeEquivalentUnit?: UiInventoryUnit | null,
): {
  value: string;
  unit: UiInventoryUnit;
  inlineLabel: string;
  detail: string | null;
} {
  const safeValue = Number.isFinite(rawValue) ? rawValue : 0;

  if (
    (unit === "un" || unit === "caixa") &&
    recipeEquivalentQuantity != null &&
    recipeEquivalentQuantity > 0 &&
    recipeEquivalentUnit != null
  ) {
    const converted = safeValue * recipeEquivalentQuantity;
    const convertedDisplay = formatBaseQuantity(converted, recipeEquivalentUnit);
    const originalDisplay = formatBaseQuantity(safeValue, unit);

    return {
      value: convertedDisplay.value,
      unit: convertedDisplay.unit,
      inlineLabel: convertedDisplay.inlineLabel,
      detail: `real: ${originalDisplay.inlineLabel}`,
    };
  }

  if (unit === "g" && Math.abs(safeValue) >= 1000) {
    const { value, unit: convertedUnit, inlineLabel } = formatBaseQuantity(
      safeValue,
      unit,
    );
    return {
      value,
      unit: convertedUnit,
      inlineLabel,
      detail: null,
    };
  }

  if (unit === "ml" && Math.abs(safeValue) >= 1000) {
    const { value, unit: convertedUnit, inlineLabel } = formatBaseQuantity(
      safeValue,
      unit,
    );
    return {
      value,
      unit: convertedUnit,
      inlineLabel,
      detail: null,
    };
  }

  const normalized = normalizeNearInteger(safeValue);
  const value = normalized.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: getDisplayPrecision(unit),
  });

  if (
    (unit === "un" || unit === "caixa") &&
    normalized > 0 &&
    !Number.isInteger(normalized)
  ) {
    return formatFractionalUnitLabel(normalized, unit);
  }

  return {
    value,
    unit,
    inlineLabel: `${value} ${unit}`,
    detail: null,
  };
}
