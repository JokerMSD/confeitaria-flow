import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { emailVerificationTokens } from "@shared/schema";

type Executor = ReturnType<typeof getDb> | any;

export class EmailVerificationTokensRepository {
  async create(
    data: typeof emailVerificationTokens.$inferInsert,
    executor: Executor = getDb(),
  ) {
    const [row] = await executor
      .insert(emailVerificationTokens)
      .values(data)
      .returning();

    return row;
  }

  async findActiveByTokenHash(
    tokenHash: string,
    executor: Executor = getDb(),
  ) {
    const [row] = await executor
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, tokenHash),
          isNull(emailVerificationTokens.consumedAt),
          gt(emailVerificationTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async consume(id: string, consumedAt: Date, executor: Executor = getDb()) {
    const [row] = await executor
      .update(emailVerificationTokens)
      .set({
        consumedAt,
        updatedAt: consumedAt,
      })
      .where(eq(emailVerificationTokens.id, id))
      .returning();

    return row ?? null;
  }

  async invalidateByUserId(userId: string, executor: Executor = getDb()) {
    await executor
      .update(emailVerificationTokens)
      .set({
        consumedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(emailVerificationTokens.userId, userId),
          isNull(emailVerificationTokens.consumedAt),
        ),
      );
  }
}
