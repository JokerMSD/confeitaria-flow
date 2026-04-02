import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../db";
import { customers, orders } from "@shared/schema";
import type { InsertCustomer, Customer } from "@shared/schema";

type Executor = ReturnType<typeof getDb> | any;

export class CustomersRepository {
  async list(executor: Executor = getDb()) {
    return executor
      .select()
      .from(customers)
      .where(isNull(customers.deletedAt))
      .orderBy(asc(customers.lastName), asc(customers.firstName));
  }

  async findById(id: string, executor: Executor = getDb()) {
    const [customer] = await executor
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .limit(1);

    return customer ?? null;
  }

  async findByEmail(email: string, executor: Executor = getDb()) {
    const [customer] = await executor
      .select()
      .from(customers)
      .where(eq(customers.email, email.toLowerCase()))
      .limit(1);

    return customer ?? null;
  }

  async create(data: InsertCustomer, executor: Executor = getDb()) {
    const [customer] = await executor.insert(customers).values(data).returning();
    return customer;
  }

  async update(id: string, data: Partial<InsertCustomer>, executor: Executor = getDb()) {
    const [customer] = await executor
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();

    return customer ?? null;
  }

  async deactivate(id: string, executor: Executor = getDb()) {
    const [customer] = await executor
      .update(customers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();

    return customer ?? null;
  }

  async softDelete(id: string, deletedAt: Date, executor: Executor = getDb()) {
    const [customer] = await executor
      .update(customers)
      .set({ deletedAt, updatedAt: deletedAt, isActive: false })
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .returning();

    return customer ?? null;
  }

  async getStats(id: string, executor: Executor = getDb()) {
    const [stats] = await executor
      .select({
        totalSpentCents: sql<number>`coalesce(sum(${orders.subtotalAmountCents}), 0)`,
        lastOrderDate: sql<string | null>`max(${orders.orderDate})`,
        orderCount: sql<number>`coalesce(count(${orders.id}), 0)`,
      })
      .from(orders)
      .where(eq(orders.customerId, id));

    return stats ?? { totalSpentCents: 0, lastOrderDate: null, orderCount: 0 };
  }

  async listOrders(id: string, executor: Executor = getDb()) {
    return executor
      .select()
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.orderDate), desc(orders.createdAt));
  }
}
