import test from "node:test";
import assert from "node:assert/strict";
import {
  adaptInventoryMovementFormStateToCreatePayload,
  createEmptyInventoryMovementFormState,
  resolveInventoryPurchaseAmountCents,
  resolveInventoryPurchaseTotalPreviewCents,
} from "../../client/src/features/inventory/lib/inventory-movement-adapter";

test("unit-based purchase keeps entered price and previews multiplied total", () => {
  const state = createEmptyInventoryMovementFormState();
  state.quantity = "3";
  state.registerPurchase = true;
  state.purchaseAmount = "32,00";

  assert.equal(resolveInventoryPurchaseAmountCents(state), 3200);
  assert.equal(resolveInventoryPurchaseTotalPreviewCents(state, "un"), 9600);

  const payload = adaptInventoryMovementFormStateToCreatePayload("item-1", state);

  assert.equal(payload.purchaseAmountCents, 3200);
});

test("weight-based purchase keeps entered amount as total", () => {
  const state = createEmptyInventoryMovementFormState();
  state.quantity = "0,705";
  state.registerPurchase = true;
  state.purchaseAmount = "14,90";

  assert.equal(resolveInventoryPurchaseAmountCents(state), 1490);
  assert.equal(resolveInventoryPurchaseTotalPreviewCents(state, "kg"), 1490);

  const payload = adaptInventoryMovementFormStateToCreatePayload("item-2", state);

  assert.equal(payload.purchaseAmountCents, 1490);
});
