import { getDb } from "./client";

export async function withTransaction<T>(
  callback: Parameters<ReturnType<typeof getDb>["transaction"]>[0],
): Promise<T> {
  const db = getDb();
  return db.transaction(callback as never) as Promise<T>;
}
