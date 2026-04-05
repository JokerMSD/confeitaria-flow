import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { checkoutAccountRequests } from "@shared/schema";

type Executor = ReturnType<typeof getDb> | any;

export class CheckoutAccountRequestsRepository {
  async findByOrderId(orderId: string, executor: Executor = getDb()) {
    const [row] = await executor
      .select()
      .from(checkoutAccountRequests)
      .where(eq(checkoutAccountRequests.orderId, orderId))
      .limit(1);

    return row ?? null;
  }

  async upsertByOrderId(
    data: typeof checkoutAccountRequests.$inferInsert,
    executor: Executor = getDb(),
  ) {
    const existing = await this.findByOrderId(data.orderId, executor);

    if (existing) {
      const [updated] = await executor
        .update(checkoutAccountRequests)
        .set({
          email: data.email,
          fullName: data.fullName,
          customerId: data.customerId ?? null,
          passwordHash: data.passwordHash,
          cancelledAt: null,
          updatedAt: new Date(),
        })
        .where(eq(checkoutAccountRequests.id, existing.id))
        .returning();

      return updated;
    }

    const [created] = await executor
      .insert(checkoutAccountRequests)
      .values(data)
      .returning();

    return created;
  }

  async findPendingByOrderId(orderId: string, executor: Executor = getDb()) {
    const [row] = await executor
      .select()
      .from(checkoutAccountRequests)
      .where(
        and(
          eq(checkoutAccountRequests.orderId, orderId),
          isNull(checkoutAccountRequests.processedAt),
          isNull(checkoutAccountRequests.cancelledAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async markProcessed(id: string, processedAt: Date, executor: Executor = getDb()) {
    const [row] = await executor
      .update(checkoutAccountRequests)
      .set({
        processedAt,
        updatedAt: processedAt,
      })
      .where(eq(checkoutAccountRequests.id, id))
      .returning();

    return row ?? null;
  }
}
