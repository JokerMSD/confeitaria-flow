import test from "node:test";
import assert from "node:assert/strict";
import { shouldResyncOrderStock } from "../../server/domain/orders/order-stock-sync-domain";

const baseItem = {
  recipeId: "recipe-1",
  fillingRecipeId: "filling-1",
  secondaryFillingRecipeId: null,
  tertiaryFillingRecipeId: null,
  quantity: 1,
  productName: "Ovo de colher 500g - Ninho",
};

test("order stock sync does not reconsume when moving from pronto to entregue", () => {
  assert.equal(
    shouldResyncOrderStock({
      previousStatus: "Pronto",
      nextStatus: "Entregue",
      previousItems: [baseItem],
      nextItems: [baseItem],
    }),
    false,
  );
});

test("order stock sync ignores non-stock edits while order remains consumed", () => {
  assert.equal(
    shouldResyncOrderStock({
      previousStatus: "Pronto",
      nextStatus: "Pronto",
      previousItems: [baseItem],
      nextItems: [{ ...baseItem, productName: `${baseItem.productName} ` }],
    }),
    false,
  );
});

test("order stock sync reruns when consumed order changes quantity", () => {
  assert.equal(
    shouldResyncOrderStock({
      previousStatus: "Pronto",
      nextStatus: "Pronto",
      previousItems: [baseItem],
      nextItems: [{ ...baseItem, quantity: 2 }],
    }),
    true,
  );
});

test("order stock sync reruns when crossing consumption boundary", () => {
  assert.equal(
    shouldResyncOrderStock({
      previousStatus: "Confirmado",
      nextStatus: "Pronto",
      previousItems: [baseItem],
      nextItems: [baseItem],
    }),
    true,
  );

  assert.equal(
    shouldResyncOrderStock({
      previousStatus: "Entregue",
      nextStatus: "Confirmado",
      previousItems: [baseItem],
      nextItems: [baseItem],
    }),
    true,
  );
});

test("order stock sync reruns legacy items when inferred product changes", () => {
  assert.equal(
    shouldResyncOrderStock({
      previousStatus: "Pronto",
      nextStatus: "Pronto",
      previousItems: [{ ...baseItem, recipeId: null }],
      nextItems: [{ ...baseItem, recipeId: null, productName: "Outro legado" }],
    }),
    true,
  );
});
