import test from "node:test";
import assert from "node:assert/strict";
import {
  collectReferencedMigrationFilenames,
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
      "recipe_media",
      "discount_coupons",
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
          "fully_paid_at",
          "items_subtotal_amount_cents",
          "discount_source",
          "discount_type",
          "discount_value",
          "discount_amount_cents",
          "discount_label",
          "coupon_code",
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
          "purchase_equivalent_quantity",
          "purchase_equivalent_unit",
        ]),
      ],
      [
        "recipe_media",
        new Set(["recipe_id", "variation_recipe_id", "file_url", "position"]),
      ],
      [
        "discount_coupons",
        new Set([
          "code",
          "title",
          "discount_type",
          "discount_value",
          "minimum_order_amount_cents",
          "is_active",
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
      ["customers", new Set(["first_name", "last_name", "email", "is_active"])],
      [
        "users",
        new Set([
          "username",
          "email",
          "password",
          "role",
          "customer_id",
          "photo_url",
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
    "recipe_media",
    "discount_coupons",
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

test("schema guard collects unique migration filenames from missing tables and columns", () => {
  const result = validateSchemaSnapshot({
    tables: new Set(["orders", "order_items", "inventory_movements"]),
    columnsByTable: new Map([
      ["orders", new Set(["delivery_mode"])],
      ["order_items", new Set(["recipe_id"])],
      [
        "inventory_movements",
        new Set(["purchase_amount_cents", "purchase_discount_cents"]),
      ],
    ]),
  });

  assert.deepEqual(collectReferencedMigrationFilenames(result), [
    "0012_phase12_inventory_weighted_average_cost.sql",
    "0014_phase14_order_delivery_mode.sql",
    "0015_phase15_product_additionals.sql",
    "0016_phase16_customers_and_users.sql",
    "0017_phase17_user_accounts.sql",
    "0020_phase20_order_fully_paid_at.sql",
    "0021_phase21_recipe_media.sql",
    "0022_phase22_recipe_media_variation.sql",
    "0023_phase23_order_discounts_and_coupons.sql",
  ]);
});
