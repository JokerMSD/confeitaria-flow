export function parseDecimalInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  const normalized =
    trimmed.includes(",") && trimmed.includes(".")
      ? trimmed.replace(/\./g, "").replace(",", ".")
      : trimmed.replace(",", ".");

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatQuantityValue(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return String(Number(value.toFixed(3)));
}

export function getQuantityStep(unit: string) {
  if (unit === "un" || unit === "caixa") {
    return "1";
  }

  if (unit === "g" || unit === "ml") {
    return "10";
  }

  return "0.1";
}

export function getQuickQuantityActions(unit: string) {
  if (unit === "un" || unit === "caixa") {
    return [1, 5, 10];
  }

  if (unit === "g" || unit === "ml") {
    return [10, 50, 100];
  }

  return [0.1, 0.5, 1];
}

export function applyQuantityDelta(currentValue: string, delta: number) {
  const nextValue = Math.max(0, parseDecimalInput(currentValue) + delta);
  return formatQuantityValue(nextValue);
}

export function formatMoneyInput(rawValue: string) {
  const digits = rawValue.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const amount = Number.parseInt(digits, 10) / 100;
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseMoneyInputToCents(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return Number.parseInt(digits, 10);
}
