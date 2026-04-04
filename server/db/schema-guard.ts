import { getPool } from "./client";

interface RequiredSchemaShape {
  tables: string[];
  columnsByTable: Record<string, string[]>;
}

interface SchemaSnapshot {
  tables: Set<string>;
  columnsByTable: Map<string, Set<string>>;
}

interface SchemaValidationResult {
  missingTables: string[];
  missingColumns: Array<{ table: string; column: string }>;
}

const requiredRuntimeSchema: RequiredSchemaShape = {
  tables: [
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
    "product_additional_groups",
    "product_additional_options",
    "order_item_additionals",
  ],
  columnsByTable: {
    orders: [
      "delivery_mode",
      "delivery_address",
      "delivery_reference",
      "delivery_district",
      "delivery_fee_cents",
      "customer_id",
      "fully_paid_at",
    ],
    order_items: [
      "recipe_id",
      "filling_recipe_id",
      "secondary_filling_recipe_id",
      "tertiary_filling_recipe_id",
    ],
    cash_transactions: ["source_type", "source_id", "is_system_generated"],
    inventory_items: [
      "purchase_unit_cost_cents",
      "recipe_equivalent_quantity",
      "recipe_equivalent_unit",
      "pricing_accumulated_quantity",
      "pricing_accumulated_cost_cents",
    ],
    inventory_movements: [
      "purchase_amount_cents",
      "purchase_discount_cents",
      "purchase_equivalent_quantity",
      "purchase_equivalent_unit",
    ],
    recipe_media: ["recipe_id", "file_url", "position"],
    product_additional_groups: [
      "product_recipe_id",
      "selection_type",
      "min_selections",
      "max_selections",
    ],
    product_additional_options: ["group_id", "price_delta_cents"],
    order_item_additionals: [
      "order_item_id",
      "group_id",
      "option_id",
      "group_name",
      "option_name",
      "price_delta_cents",
    ],
    customers: ["first_name", "last_name", "email", "is_active"],
    users: [
      "username",
      "email",
      "password",
      "role",
      "customer_id",
      "photo_url",
      "is_active",
    ],
  },
};

const migrationHints: Record<string, string> = {
  "orders.delivery_mode": "0014_phase14_order_delivery_mode.sql",
  "orders.delivery_address": "0014_phase14_order_delivery_mode.sql",
  "orders.delivery_reference": "0014_phase14_order_delivery_mode.sql",
  "orders.delivery_district": "0014_phase14_order_delivery_mode.sql",
  "orders.delivery_fee_cents": "0014_phase14_order_delivery_mode.sql",
  "orders.customer_id": "0016_phase16_customers_and_users.sql",
  "orders.fully_paid_at": "0020_phase20_order_fully_paid_at.sql",
  "inventory_movements.purchase_amount_cents":
    "0012_phase12_inventory_weighted_average_cost.sql",
  "inventory_movements.purchase_equivalent_quantity":
    "0012_phase12_inventory_weighted_average_cost.sql",
  "inventory_movements.purchase_equivalent_unit":
    "0012_phase12_inventory_weighted_average_cost.sql",
  "inventory_movements.purchase_discount_cents":
    "0013_phase13_inventory_purchase_discount.sql",
  recipe_media: "0021_phase21_recipe_media.sql",
  "recipe_media.recipe_id": "0021_phase21_recipe_media.sql",
  "recipe_media.file_url": "0021_phase21_recipe_media.sql",
  "recipe_media.position": "0021_phase21_recipe_media.sql",
  product_additional_groups: "0015_phase15_product_additionals.sql",
  product_additional_options: "0015_phase15_product_additionals.sql",
  order_item_additionals: "0015_phase15_product_additionals.sql",
  "product_additional_groups.product_recipe_id":
    "0015_phase15_product_additionals.sql",
  "product_additional_groups.selection_type":
    "0015_phase15_product_additionals.sql",
  "product_additional_groups.min_selections":
    "0015_phase15_product_additionals.sql",
  "product_additional_groups.max_selections":
    "0015_phase15_product_additionals.sql",
  "product_additional_options.group_id": "0015_phase15_product_additionals.sql",
  "product_additional_options.price_delta_cents":
    "0015_phase15_product_additionals.sql",
  "order_item_additionals.order_item_id":
    "0015_phase15_product_additionals.sql",
  "order_item_additionals.group_id": "0015_phase15_product_additionals.sql",
  "order_item_additionals.option_id": "0015_phase15_product_additionals.sql",
  "order_item_additionals.group_name": "0015_phase15_product_additionals.sql",
  "order_item_additionals.option_name": "0015_phase15_product_additionals.sql",
  "order_item_additionals.price_delta_cents":
    "0015_phase15_product_additionals.sql",
  customers: "0016_phase16_customers_and_users.sql",
  users: "0016_phase16_customers_and_users.sql",
  "customers.first_name": "0016_phase16_customers_and_users.sql",
  "customers.last_name": "0016_phase16_customers_and_users.sql",
  "customers.email": "0016_phase16_customers_and_users.sql",
  "customers.is_active": "0016_phase16_customers_and_users.sql",
  "users.username": "0016_phase16_customers_and_users.sql",
  "users.email": "0016_phase16_customers_and_users.sql",
  "users.password": "0016_phase16_customers_and_users.sql",
  "users.role": "0016_phase16_customers_and_users.sql",
  "users.is_active": "0016_phase16_customers_and_users.sql",
  "users.customer_id": "0017_phase17_user_accounts.sql",
  "users.photo_url": "0017_phase17_user_accounts.sql",
};

export function validateSchemaSnapshot(
  snapshot: SchemaSnapshot,
): SchemaValidationResult {
  const missingTables = requiredRuntimeSchema.tables.filter(
    (table) => !snapshot.tables.has(table),
  );

  const missingColumns: Array<{ table: string; column: string }> = [];

  for (const [table, columns] of Object.entries(
    requiredRuntimeSchema.columnsByTable,
  )) {
    const existingColumns =
      snapshot.columnsByTable.get(table) ?? new Set<string>();

    for (const column of columns) {
      if (!existingColumns.has(column)) {
        missingColumns.push({ table, column });
      }
    }
  }

  return {
    missingTables,
    missingColumns,
  };
}

export function formatSchemaMismatchMessage(result: SchemaValidationResult) {
  const parts: string[] = [];

  if (result.missingTables.length > 0) {
    parts.push(
      `missing tables: ${result.missingTables
        .map((table) => {
          const hint = migrationHints[table];
          return hint ? `${table} (${hint})` : table;
        })
        .join(", ")}`,
    );
  }

  if (result.missingColumns.length > 0) {
    parts.push(
      `missing columns: ${result.missingColumns
        .map(({ table, column }) => {
          const key = `${table}.${column}`;
          const hint = migrationHints[key];
          return hint ? `${table}.${column} (${hint})` : `${table}.${column}`;
        })
        .join(", ")}`,
    );
  }

  return `Database schema is behind the runtime code; apply pending migrations before starting the API (${parts.join(
    "; ",
  )}).`;
}

export function collectReferencedMigrationFilenames(
  result: SchemaValidationResult,
) {
  const filenames = new Set<string>();

  for (const table of result.missingTables) {
    const hint = migrationHints[table];
    if (hint) {
      filenames.add(hint);
    }
  }

  for (const { table, column } of result.missingColumns) {
    const hint = migrationHints[`${table}.${column}`];
    if (hint) {
      filenames.add(hint);
    }
  }

  return Array.from(filenames).sort((a, b) => a.localeCompare(b));
}

async function loadCurrentSchemaSnapshot(): Promise<SchemaSnapshot> {
  const pool = getPool();

  const tablesResult = await pool.query<{
    table_name: string;
  }>(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'`,
  );

  const columnsResult = await pool.query<{
    table_name: string;
    column_name: string;
  }>(
    `select table_name, column_name
     from information_schema.columns
     where table_schema = 'public'`,
  );

  const columnsByTable = new Map<string, Set<string>>();

  for (const row of columnsResult.rows) {
    const current = columnsByTable.get(row.table_name) ?? new Set<string>();
    current.add(row.column_name);
    columnsByTable.set(row.table_name, current);
  }

  return {
    tables: new Set(tablesResult.rows.map((row) => row.table_name)),
    columnsByTable,
  };
}

export async function getRuntimeSchemaValidationResult() {
  const snapshot = await loadCurrentSchemaSnapshot();
  return validateSchemaSnapshot(snapshot);
}

export async function assertRuntimeSchemaIsReady() {
  const result = await getRuntimeSchemaValidationResult();

  if (result.missingTables.length === 0 && result.missingColumns.length === 0) {
    return;
  }

  throw new Error(formatSchemaMismatchMessage(result));
}
