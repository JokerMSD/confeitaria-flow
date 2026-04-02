import test from "node:test";
import assert from "node:assert/strict";
import {
  formatSchemaMismatchMessage,
  validateSchemaSnapshot,
} from "../../server/db/schema-guard";

test("schema guard passes when required runtime tables and columns exist", () => {
  const result = validateSchemaSnapshot({
    tables: new Set([
      "orders",
      "order_items",
      "recipes",
      "customers",
      "users",
      "recipe_components",
      "cash_transactions",
      "inventory_items",
      "inventory_movements",
      "product_additional_groups",
      "product_additional_options",
      "order_item_additionals",
    ]),
    columnsByTable: new Map([
      [
        "orders",
        new Set([
          "delivery_mode",
          "delivery_address",
          "delivery_reference",
          "delivery_district",
          "delivery_fee_cents",
          "customer_id",
        ]),
      ],
      [
        "order_items",
        new Set([
          "recipe_id",
          "filling_recipe_id",
          "secondary_filling_recipe_id",
          "tertiary_filling_recipe_id",
        ]),
      ],
      [
        "cash_transactions",
        new Set(["source_type", "source_id", "is_system_generated"]),
      ],
      [
        "inventory_items",
        new Set([
          "purchase_unit_cost_cents",
          "recipe_equivalent_quantity",
          "recipe_equivalent_unit",
          "pricing_accumulated_quantity",
          "pricing_accumulated_cost_cents",
        ]),
      ],
      [
        "inventory_movements",
        new Set([
          "purchase_amount_cents",
          "purchase_discount_cents",
          "purchase_payment_method",
          "purchase_recipe_yield_quantity",
          "purchase_recipe_yield_unit",
        ]),
      ],
      [
        "product_additional_groups",
        new Set([
          "product_recipe_id",
          "selection_type",
          "min_selections",
          "max_selections",
        ]),
      ],
      [
        "product_additional_options",
        new Set(["group_id", "price_delta_cents"]),
      ],
      [
        "order_item_additionals",
        new Set([
          "order_item_id",
          "group_id",
          "option_id",
          "group_name",
          "option_name",
          "price_delta_cents",
        ]),
      ],
      [
        "customers",
        new Set([
          "first_name",
          "last_name",
          "email",
          "is_active",
        ]),
      ],
      [
        "users",
        new Set([
          "username",
          "email",
          "password",
          "role",
          "is_active",
        ]),
      ],
    ]),
  });

  assert.deepEqual(result, {
    missingTables: [],
    missingColumns: [],
  });
});

test("schema guard reports pending migrations for missing recent tables and columns", () => {
  const result = validateSchemaSnapshot({
    tables: new Set(["orders", "order_items"]),
    columnsByTable: new Map([
      ["orders", new Set(["delivery_mode"])],
      ["order_items", new Set(["recipe_id"])],
    ]),
  });

  assert.deepEqual(result.missingTables, [
    "recipes",
    "customers",
    "users",
    "recipe_components",
    "cash_transactions",
    "inventory_items",
    "inventory_movements",
    "product_additional_groups",
    "product_additional_options",
    "order_item_additionals",
  ]);
  assert.ok(
    result.missingColumns.some(
      (entry) =>
        entry.table === "orders" && entry.column === "delivery_address",
    ),
  );

  const message = formatSchemaMismatchMessage(result);
  assert.match(message, /0014_phase14_order_delivery_mode\.sql/);
  assert.match(message, /0015_phase15_product_additionals\.sql/);
  assert.match(message, /Database schema is behind the runtime code/);
});
