import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb } from "../db";
import { orders } from "@shared/schema";
import type { ListOrdersFilters, OrderStatus, PaymentMethod, PaymentStatus } from "@shared/types";

type Executor = ReturnType<typeof getDb> | any;

export interface OrderRowInsert {
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string | null;
  subtotalAmountCents: number;
  paidAmountCents: number;
  remainingAmountCents: number;
  itemCount: number;
}

export interface OrderRowUpdate extends OrderRowInsert {
  updatedAt: Date;
}

export class OrdersRepository {
  async list(filters: ListOrdersFilters = {}, executor: Executor = getDb()) {
    const conditions = [isNull(orders.deletedAt)];

    if (filters.status) {
      conditions.push(eq(orders.status, filters.status));
    }

    if (filters.deliveryDate) {
      conditions.push(eq(orders.deliveryDate, filters.deliveryDate));
    }

    if (filters.paymentStatus) {
      conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
    }

    if (filters.search) {
      const search = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(orders.customerName, search),
          ilike(orders.orderNumber, search),
        )!,
      );
    }

    return executor
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.orderDate), desc(orders.createdAt));
  }

  async findById(id: string, executor: Executor = getDb()) {
    const [order] = await executor
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), isNull(orders.deletedAt)))
      .limit(1);

    return order ?? null;
  }

  async findByIdIncludingDeleted(id: string, executor: Executor = getDb()) {
    const [order] = await executor
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    return order ?? null;
  }

  async create(data: OrderRowInsert, executor: Executor = getDb()) {
    const [order] = await executor
      .insert(orders)
      .values(data)
      .returning();

    return order;
  }

  async update(id: string, data: OrderRowUpdate, executor: Executor = getDb()) {
    const [order] = await executor
      .update(orders)
      .set(data)
      .where(and(eq(orders.id, id), isNull(orders.deletedAt)))
      .returning();

    return order ?? null;
  }

  async markDeleted(id: string, deletedAt: Date, executor: Executor = getDb()) {
    const [order] = await executor
      .update(orders)
      .set({
        deletedAt,
        updatedAt: deletedAt,
      })
      .where(and(eq(orders.id, id), isNull(orders.deletedAt)))
      .returning();

    return order ?? null;
  }

  async nextOrderSequence(executor: Executor = getDb()) {
    const result = await executor.execute(
      sql`select nextval(pg_get_serial_sequence('orders', 'order_sequence')) as value`,
    );

    const rawRow = result.rows[0] as { value: string | number };
    return Number(rawRow.value);
  }
}
