import test from "node:test";
import assert from "node:assert/strict";
import { formatInventoryQuantity } from "../../client/src/features/inventory/lib/inventory-quantity-display";

test("inventory quantity display translates unit-based items using recipe equivalence", () => {
  const formatted = formatInventoryQuantity(33.37, "un", 200, "g");

  assert.equal(formatted.inlineLabel, "6,67 kg");
  assert.equal(formatted.detail, "real: 33,37 un");
});

test("inventory quantity display makes fractional units readable without raw decimals", () => {
  const formatted = formatInventoryQuantity(1.35, "un");

  assert.equal(formatted.inlineLabel, "1 un + 35%");
  assert.equal(formatted.detail, "real: 1,35 un");
});

test("inventory quantity display keeps sub-unit fractions readable as percentage", () => {
  const formatted = formatInventoryQuantity(0.76, "un");

  assert.equal(formatted.inlineLabel, "76% da unidade");
  assert.equal(formatted.detail, "real: 0,76 un");
});
