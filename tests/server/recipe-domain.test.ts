import test from "node:test";
import assert from "node:assert/strict";
import type { InventoryItem } from "@shared/types";
import {
  convertQuantity,
  convertRecipeQuantityToInventoryUnits,
  normalizeRecipeName,
  shouldConsumeOrderStock,
} from "../../server/domain/recipes/recipe-domain";
import { HttpError } from "../../server/utils/http-error";

const butterItem: InventoryItem = {
  id: "butter",
  name: "Manteiga",
  category: "Ingrediente",
  currentQuantity: 10,
  minQuantity: 0,
  unit: "un",
  recipeEquivalentQuantity: 500,
  recipeEquivalentUnit: "g",
  purchaseUnitCostCents: 1100,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
};

test("normalizeRecipeName standardizes common legacy names", () => {
  assert.equal(normalizeRecipeName("Ovo de Páscoa Recheado 350"), "ovo trufado 350g");
  assert.equal(normalizeRecipeName("  Leite   Ninho  "), "leite ninho");
});

test("shouldConsumeOrderStock only consumes on final production statuses", () => {
  assert.equal(shouldConsumeOrderStock("Novo"), false);
  assert.equal(shouldConsumeOrderStock("Em producao"), false);
  assert.equal(shouldConsumeOrderStock("Pronto"), true);
  assert.equal(shouldConsumeOrderStock("Entregue"), true);
});

test("convertQuantity converts within compatible families", () => {
  assert.equal(convertQuantity(1, "kg", "g"), 1000);
  assert.equal(convertQuantity(750, "g", "kg"), 0.75);
  assert.equal(convertQuantity(2, "l", "ml"), 2000);
});

test("convertQuantity rejects incompatible unit families", () => {
  assert.throws(() => convertQuantity(1, "un", "g"), (error) => {
    assert.ok(error instanceof HttpError);
    assert.equal(error.status, 400);
    return true;
  });
});

test("convertRecipeQuantityToInventoryUnits uses direct conversion when possible", () => {
  const chocolateItem: InventoryItem = {
    ...butterItem,
    id: "chocolate",
    name: "Chocolate",
    unit: "kg",
    recipeEquivalentQuantity: null,
    recipeEquivalentUnit: null,
  };

  assert.equal(convertRecipeQuantityToInventoryUnits(500, "g", chocolateItem), 0.5);
});

test("convertRecipeQuantityToInventoryUnits uses recipe equivalence for unit-based ingredients", () => {
  assert.equal(convertRecipeQuantityToInventoryUnits(5, "g", butterItem), 0.01);
  assert.equal(convertRecipeQuantityToInventoryUnits(250, "g", butterItem), 0.5);
});
