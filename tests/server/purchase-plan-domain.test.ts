import test from "node:test";
import assert from "node:assert/strict";
import {
  getSuggestedPurchaseQuantity,
  roundToThreeDecimals,
} from "../../server/domain/inventory/purchase-plan-domain";

test("roundToThreeDecimals keeps purchase plan quantities stable", () => {
  assert.equal(roundToThreeDecimals(1.2344), 1.234);
  assert.equal(roundToThreeDecimals(1.2345), 1.235);
});

test("getSuggestedPurchaseQuantity rounds up unit-based shortages", () => {
  assert.equal(getSuggestedPurchaseQuantity(1.1, "un"), 2);
  assert.equal(getSuggestedPurchaseQuantity(2.01, "caixa"), 3);
});

test("getSuggestedPurchaseQuantity preserves decimal shortages for weight and volume", () => {
  assert.equal(getSuggestedPurchaseQuantity(0.7054, "kg"), 0.705);
  assert.equal(getSuggestedPurchaseQuantity(105.6789, "g"), 105.679);
});
