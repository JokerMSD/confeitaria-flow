import test from "node:test";
import assert from "node:assert/strict";
import {
  applyQuantityDelta,
  formatMoneyInput,
  formatQuantityValue,
  getQuantityStep,
  getQuickQuantityActions,
  parseDecimalInput,
  parseMoneyInputToCents,
} from "../../client/src/features/inventory/lib/inventory-input-helpers";

test("parseDecimalInput handles pt-BR and mixed separators", () => {
  assert.equal(parseDecimalInput(""), 0);
  assert.equal(parseDecimalInput("12,5"), 12.5);
  assert.equal(parseDecimalInput("1.234,567"), 1234.567);
  assert.equal(parseDecimalInput("10.25"), 10.25);
});

test("money helpers mask and parse currency consistently", () => {
  assert.equal(formatMoneyInput(""), "");
  assert.equal(formatMoneyInput("1"), "0,01");
  assert.equal(formatMoneyInput("123456"), "1.234,56");
  assert.equal(parseMoneyInputToCents("1.234,56"), 123456);
  assert.equal(parseMoneyInputToCents(""), null);
});

test("quantity helpers respect unit context", () => {
  assert.equal(getQuantityStep("un"), "1");
  assert.equal(getQuantityStep("g"), "10");
  assert.equal(getQuantityStep("kg"), "0.1");
  assert.deepEqual(getQuickQuantityActions("un"), [1, 5, 10]);
  assert.deepEqual(getQuickQuantityActions("ml"), [10, 50, 100]);
  assert.deepEqual(getQuickQuantityActions("l"), [0.1, 0.5, 1]);
});

test("applyQuantityDelta never goes negative and keeps friendly precision", () => {
  assert.equal(applyQuantityDelta("", 10), "10");
  assert.equal(applyQuantityDelta("0,5", 0.5), "1");
  assert.equal(applyQuantityDelta("1", -5), "0");
  assert.equal(formatQuantityValue(1.23456), "1.235");
});
