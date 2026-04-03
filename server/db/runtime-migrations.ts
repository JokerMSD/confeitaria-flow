import { readdir, readFile } from "fs/promises";
import path from "path";
import type { PoolClient } from "pg";
import { getPool } from "./client";

const MIGRATION_HISTORY_TABLE = "app_runtime_migrations";
const MIGRATION_LOCK_KEY = 2042026;

export function shouldAutoApplyMigrations() {
  return process.env.AUTO_APPLY_MIGRATIONS !== "false";
}

export function getRuntimeMigrationFilenames(entries: string[]) {
  return entries
    .filter((entry) => entry.toLowerCase().endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
}

async function ensureMigrationHistoryTable(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_HISTORY_TABLE} (
      filename varchar(255) PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(client: PoolClient) {
  const result = await client.query<{ filename: string }>(
    `SELECT filename FROM ${MIGRATION_HISTORY_TABLE};`,
  );

  return new Set(result.rows.map((row) => row.filename));
}

async function applyMigration(client: PoolClient, filename: string, sqlText: string) {
  await client.query("BEGIN");

  try {
    await client.query(sqlText);
    await client.query(
      `INSERT INTO ${MIGRATION_HISTORY_TABLE} (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING;`,
      [filename],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function applyRuntimeMigrations({
  forceFilenames,
}: {
  forceFilenames?: Iterable<string>;
} = {}) {
  const migrationsDir = path.resolve(process.cwd(), "migrations");
  const migrationEntries = await readdir(migrationsDir);
  const filenames = getRuntimeMigrationFilenames(migrationEntries);

  if (filenames.length === 0) {
    return;
  }

  const forced = new Set(forceFilenames ?? []);
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1);", [MIGRATION_LOCK_KEY]);
    await ensureMigrationHistoryTable(client);

    const appliedMigrations = await getAppliedMigrations(client);

    for (const filename of filenames) {
      if (!forced.has(filename) && appliedMigrations.has(filename)) {
        continue;
      }

      const sqlText = await readFile(path.join(migrationsDir, filename), "utf-8");
      await applyMigration(client, filename, sqlText);
    }
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1);", [MIGRATION_LOCK_KEY]);
    } finally {
      client.release();
    }
  }
}

export async function applyPendingRuntimeMigrations() {
  if (!shouldAutoApplyMigrations()) {
    return;
  }

  await applyRuntimeMigrations();
}

export async function reapplyRuntimeMigrations(filenames: string[]) {
  if (filenames.length === 0) {
    return;
  }

  await applyRuntimeMigrations({ forceFilenames: filenames });
}
