import type {
  InventoryItemUnit,
  InventoryReceiptImportMatch,
  InventoryReceiptImportSuggestedLine,
} from "@shared/types";

interface InventoryItemForMatch {
  id: string;
  name: string;
  unit: InventoryItemUnit;
}

const ignoredLinePatterns = [
  /\bsubtotal\b/i,
  /\bdesconto\b/i,
  /\btotal\b/i,
  /\btroco\b/i,
  /\bpagamento\b/i,
  /\bcart[aã]o\b/i,
  /\bpix\b/i,
  /\bdinheiro\b/i,
  /\boperador\b/i,
  /\bcaixa\b/i,
  /\bcnpj\b/i,
  /\bcpf\b/i,
  /\bwww\b/i,
  /\bobrigad[oa]\b/i,
  /\bdata\b/i,
  /\bhora\b/i,
  /^\d{2}\/\d{2}\/\d{2,4}/,
];

const moneyTokenRegex = /\d{1,3}(?:\.\d{3})*,\d{2}/g;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeForMatch(value: string) {
  return normalizeWhitespace(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " "),
  );
}

function parseMoneyToken(token: string) {
  const normalized = token.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * 100);
}

function detectQuantity(rawLine: string) {
  const quantityMatch =
    rawLine.match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*[xX](?=\s|\d)/) ??
    rawLine.match(/\bqt(?:de)?\.?\s*(\d+(?:[.,]\d+)?)/i);

  if (!quantityMatch) {
    return 1;
  }

  const parsed = Number.parseFloat(quantityMatch[1].replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function shouldIgnoreLine(line: string) {
  if (line.length < 4) {
    return true;
  }

  if (!/[a-zA-Z]/.test(line)) {
    return true;
  }

  return ignoredLinePatterns.some((pattern) => pattern.test(line));
}

function buildDescription(rawLine: string) {
  return normalizeWhitespace(
    rawLine
      .replace(moneyTokenRegex, " ")
      .replace(/(?:^|\s)\d+(?:[.,]\d+)?\s*[xX](?=\s|\d)/g, " ")
      .replace(/\bqt(?:de)?\.?\s*\d+(?:[.,]\d+)?/gi, " ")
      .replace(/\b(?:r\$|rs)\b/gi, " ")
      .replace(/\s+/g, " "),
  );
}

function scoreMatch(description: string, itemName: string) {
  const normalizedDescription = normalizeForMatch(description);
  const normalizedItemName = normalizeForMatch(itemName);

  if (!normalizedDescription || !normalizedItemName) {
    return 0;
  }

  if (normalizedDescription === normalizedItemName) {
    return 100;
  }

  let score = 0;

  if (normalizedDescription.includes(normalizedItemName)) {
    score += 40;
  }

  if (normalizedItemName.includes(normalizedDescription)) {
    score += 25;
  }

  const descriptionTokens = new Set(
    normalizedDescription.split(" ").map((token) => token.trim()).filter(Boolean),
  );
  const itemTokens = normalizedItemName
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

  for (const token of itemTokens) {
    if (descriptionTokens.has(token)) {
      score += token.length >= 5 ? 18 : 10;
    }
  }

  return Math.min(score, 99);
}

function buildMatches(
  description: string,
  items: InventoryItemForMatch[],
): InventoryReceiptImportMatch[] {
  return items
    .map((item) => ({
      itemId: item.id,
      itemName: item.name,
      itemUnit: item.unit,
      score: scoreMatch(description, item.name),
    }))
    .filter((item) => item.score >= 18)
    .sort((left, right) => right.score - left.score || left.itemName.localeCompare(right.itemName))
    .slice(0, 5);
}

export function extractInventoryReceiptSuggestions(input: {
  text: string;
  items: InventoryItemForMatch[];
}): {
  lines: InventoryReceiptImportSuggestedLine[];
  skippedLineCount: number;
} {
  const rawLines = input.text
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const lines: InventoryReceiptImportSuggestedLine[] = [];
  let skippedLineCount = 0;

  rawLines.forEach((rawLine, index) => {
    if (shouldIgnoreLine(rawLine)) {
      skippedLineCount += 1;
      return;
    }

    const description = buildDescription(rawLine);
    if (!description || description.length < 3) {
      skippedLineCount += 1;
      return;
    }

    const moneyTokens = rawLine.match(moneyTokenRegex) ?? [];
    const totalAmountCents =
      moneyTokens.length > 0
        ? parseMoneyToken(moneyTokens[moneyTokens.length - 1] ?? "")
        : null;
    const matches = buildMatches(description, input.items);

    lines.push({
      lineId: `receipt-line-${index + 1}`,
      rawText: rawLine,
      normalizedDescription: description,
      quantity: detectQuantity(rawLine),
      totalAmountCents,
      suggestedItemId: matches[0]?.itemId ?? null,
      matches,
    });
  });

  return {
    lines,
    skippedLineCount,
  };
}
