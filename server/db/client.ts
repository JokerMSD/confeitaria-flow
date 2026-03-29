import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to initialize the database client.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  if (!dbInstance) {
    dbInstance = drizzle(pool, { schema });
  }

  return dbInstance;
}

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required to initialize the database client.");
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return pool;
}

export type DbClient = ReturnType<typeof getDb>;
