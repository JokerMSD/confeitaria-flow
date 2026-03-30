import test from "node:test";
import assert from "node:assert/strict";
import {
  adaptFormStateToCreatePayload,
  createEmptyOrderFormState,
} from "../../client/src/features/orders/lib/order-form-adapter";

test("catalog item prices keep cent precision when payload is built", () => {
  const state = createEmptyOrderFormState();
  state.customerName = "Cliente";
  state.deliveryDate = "2026-03-31";
  state.items = [
    {
      id: "item-1",
      recipeId: "recipe-1",
      fillingRecipeId: "fill-1",
      secondaryFillingRecipeId: null,
      tertiaryFillingRecipeId: null,
      productName: "Ovo de colher 350g - Brigadeiro",
      quantity: 2,
      unitPrice: 39.9,
      subtotal: 79.8,
      position: 0,
    },
  ];

  const payload = adaptFormStateToCreatePayload(state);

  assert.equal(payload.data.items[0]?.unitPriceCents, 3990);
});
