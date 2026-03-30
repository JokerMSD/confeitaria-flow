import test from "node:test";
import assert from "node:assert/strict";
import { supportsMultipleFillings } from "../../client/src/features/orders/lib/order-item-composer";

test("supports multiple fillings for spoon eggs", () => {
  assert.equal(supportsMultipleFillings("Ovo de colher 350g"), true);
});

test("supports multiple fillings for truffled eggs", () => {
  assert.equal(supportsMultipleFillings("Ovo Trufado 500g"), true);
  assert.equal(supportsMultipleFillings("Ovo de Páscoa Recheado 350g"), true);
});

test("does not enable multiple fillings for unrelated catalog items", () => {
  assert.equal(supportsMultipleFillings("Barra recheada 350g"), false);
  assert.equal(supportsMultipleFillings("Trufa 20g"), false);
});
