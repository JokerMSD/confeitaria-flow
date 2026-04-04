import test from "node:test";
import assert from "node:assert/strict";
import {
  adaptInventoryMovementFormStateToCreatePayload,
  createEmptyInventoryMovementFormState,
  resolveInventoryPurchaseAmountCents,
  resolveInventoryPurchaseGrossPreviewCents,
  resolveInventoryPurchaseTotalPreviewCents,
} from "../../client/src/features/inventory/lib/inventory-movement-adapter";

test("unit-based purchase keeps entered price and previews multiplied total", () => {
  const state = createEmptyInventoryMovementFormState();
  state.quantity = "3";
  state.registerPurchaseCost = true;
  state.purchaseAmount = "32,00";

  assert.equal(resolveInventoryPurchaseAmountCents(state), 3200);
  assert.equal(resolveInventoryPurchaseGrossPreviewCents(state, "un"), 9600);
  assert.equal(resolveInventoryPurchaseTotalPreviewCents(state, "un"), 9600);

  const payload = adaptInventoryMovementFormStateToCreatePayload("item-1", state);

  assert.equal(payload.purchaseAmountCents, 3200);
});

test("weight-based purchase keeps entered amount as total", () => {
  const state = createEmptyInventoryMovementFormState();
  state.quantity = "0,705";
  state.registerPurchaseCost = true;
  state.purchaseAmount = "14,90";

  assert.equal(resolveInventoryPurchaseAmountCents(state), 1490);
  assert.equal(resolveInventoryPurchaseGrossPreviewCents(state, "kg"), 1490);
  assert.equal(resolveInventoryPurchaseTotalPreviewCents(state, "kg"), 1490);

  const payload = adaptInventoryMovementFormStateToCreatePayload("item-2", state);

  assert.equal(payload.purchaseAmountCents, 1490);
});

test("purchase discount reduces the effective total preview and payload carries discount", () => {
  const state = createEmptyInventoryMovementFormState();
  state.quantity = "3";
  state.registerPurchaseCost = true;
  state.purchaseAmount = "39,98";
  state.purchaseDiscount = "2,40";

  assert.equal(resolveInventoryPurchaseGrossPreviewCents(state, "un"), 11994);
  assert.equal(resolveInventoryPurchaseTotalPreviewCents(state, "un"), 11754);

  const payload = adaptInventoryMovementFormStateToCreatePayload("item-3", state);

  assert.equal(payload.purchaseAmountCents, 3998);
  assert.equal(payload.purchaseDiscountCents, 240);
});
