import test from "node:test";
import assert from "node:assert/strict";
import {
  getRuntimeMigrationFilenames,
  shouldAutoApplyMigrations,
} from "../../server/db/runtime-migrations";

test("runtime migrations only consider sql files and keep them ordered", () => {
  const filenames = getRuntimeMigrationFilenames([
    "meta",
    "0015_phase15_product_additionals.sql",
    "0009_phase9_order_item_filling_recipe.sql",
    "README.md",
    "0014_phase14_order_delivery_mode.sql",
  ]);

  assert.deepEqual(filenames, [
    "0009_phase9_order_item_filling_recipe.sql",
    "0014_phase14_order_delivery_mode.sql",
    "0015_phase15_product_additionals.sql",
  ]);
});

test("auto-apply migrations is enabled by default and can be disabled explicitly", () => {
  const original = process.env.AUTO_APPLY_MIGRATIONS;

  delete process.env.AUTO_APPLY_MIGRATIONS;
  assert.equal(shouldAutoApplyMigrations(), true);

  process.env.AUTO_APPLY_MIGRATIONS = "false";
  assert.equal(shouldAutoApplyMigrations(), false);

  if (original === undefined) {
    delete process.env.AUTO_APPLY_MIGRATIONS;
  } else {
    process.env.AUTO_APPLY_MIGRATIONS = original;
  }
});
