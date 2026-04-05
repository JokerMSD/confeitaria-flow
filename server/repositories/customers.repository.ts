import { and, asc, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb } from "../db";
import { customers, orders, users } from "@shared/schema";
import type { InsertCustomer, Customer } from "@shared/schema";
import type { ListCustomersFilters } from "@shared/types";

type Executor = ReturnType<typeof getDb> | any;

function toSafeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class CustomersRepository {
  async list(filters: ListCustomersFilters = {}, executor: Executor = getDb()) {
    const conditions = [isNull(customers.deletedAt)];

    if (filters.search) {
      const search = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(customers.firstName, search),
          ilike(customers.lastName, search),
          ilike(customers.email, search),
          ilike(customers.phone, search),
          sql`concat(${customers.firstName}, ' ', ${customers.lastName}) ilike ${search}`,
        )!,
      );
    }

    return executor
      .select()
      .from(customers)
      .where(and(...conditions))
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
    const [customer] = await executor
      .insert(customers)
      .values(data)
      .returning();
    return customer;
  }

  async update(
    id: string,
    data: Partial<InsertCustomer>,
    executor: Executor = getDb(),
  ) {
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
        openOrderCount: sql<number>`coalesce(sum(case when ${orders.status} not in ('Entregue', 'Cancelado') then 1 else 0 end), 0)`,
      })
      .from(orders)
      .where(eq(orders.customerId, id));

    return {
      totalSpentCents: toSafeNumber(stats?.totalSpentCents),
      lastOrderDate: stats?.lastOrderDate ?? null,
      orderCount: toSafeNumber(stats?.orderCount),
      openOrderCount: toSafeNumber(stats?.openOrderCount),
    };
  }

  async listOrders(id: string, executor: Executor = getDb()) {
    return executor
      .select()
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.orderDate), desc(orders.createdAt));
  }

  async countLinkedUsers(id: string, executor: Executor = getDb()) {
    const [row] = await executor
      .select({
        total: sql<number>`count(${users.id})`,
      })
      .from(users)
      .where(and(eq(users.customerId, id), isNull(users.deletedAt)));

    return toSafeNumber(row?.total);
  }
}
