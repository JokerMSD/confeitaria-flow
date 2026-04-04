import test from "node:test";
import assert from "node:assert/strict";
import { extractInventoryReceiptSuggestions } from "../../server/domain/inventory/receipt-import-domain";

test("extractInventoryReceiptSuggestions ignores totals and suggests stock items", () => {
  const result = extractInventoryReceiptSuggestions({
    text: [
      "LEITE NINHO 750G 15,99",
      "MORANGO BANDEJA 9,50",
      "TOTAL 25,49",
    ].join("\n"),
    items: [
      { id: "1", name: "Leite ninho 750g", unit: "un" },
      { id: "2", name: "Morango", unit: "un" },
      { id: "3", name: "Creme de Leite 200g", unit: "un" },
    ],
  });

  assert.equal(result.lines.length, 2);
  assert.equal(result.skippedLineCount, 1);
  assert.equal(result.lines[0]?.suggestedItemId, "1");
  assert.equal(result.lines[1]?.suggestedItemId, "2");
  assert.equal(result.lines[0]?.totalAmountCents, 1599);
});
