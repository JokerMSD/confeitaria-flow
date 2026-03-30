import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNull,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "../db";
import { orderItems, orders } from "@shared/schema";
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

export interface OrderStatusUpdate {
  status: OrderStatus;
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

  async listQueueRows(executor: Executor = getDb()) {
    return executor
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        orderDate: orders.orderDate,
        deliveryDate: orders.deliveryDate,
        deliveryTime: orders.deliveryTime,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        itemProductName: orderItems.productName,
        itemQuantity: orderItems.quantity,
        itemPosition: orderItems.position,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          isNull(orders.deletedAt),
          notInArray(orders.status, ["Entregue", "Cancelado"]),
        ),
      )
      .orderBy(
        asc(orders.deliveryDate),
        sql`coalesce(${orders.deliveryTime}, '23:59')`,
        asc(orders.createdAt),
        asc(orderItems.position),
      );
  }

  async listLookupRows(executor: Executor = getDb()) {
    return executor
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        deliveryDate: orders.deliveryDate,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
      })
      .from(orders)
      .where(isNull(orders.deletedAt))
      .orderBy(desc(orders.createdAt));
  }

  async listPendingProductionRows(executor: Executor = getDb()) {
    return executor
      .select({
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        deliveryDate: orders.deliveryDate,
        status: orders.status,
        itemId: orderItems.id,
        productName: orderItems.productName,
        recipeId: orderItems.recipeId,
        fillingRecipeId: orderItems.fillingRecipeId,
        secondaryFillingRecipeId: orderItems.secondaryFillingRecipeId,
        tertiaryFillingRecipeId: orderItems.tertiaryFillingRecipeId,
        quantity: orderItems.quantity,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          isNull(orders.deletedAt),
          notInArray(orders.status, ["Pronto", "Entregue", "Cancelado"]),
        ),
      )
      .orderBy(
        asc(orders.deliveryDate),
        asc(orders.createdAt),
        asc(orderItems.position),
      );
  }

  async listCashSyncRows(executor: Executor = getDb()) {
    return executor
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        paymentMethod: orders.paymentMethod,
        orderDate: orders.orderDate,
        paidAmountCents: orders.paidAmountCents,
      })
      .from(orders)
      .where(isNull(orders.deletedAt))
      .orderBy(desc(orders.createdAt));
  }

  async getFinancialSummaryByDate(date?: string, executor: Executor = getDb()) {
    const conditions = [isNull(orders.deletedAt)];

    if (date) {
      conditions.push(eq(orders.orderDate, date));
    }

    const [summary] = await executor
      .select({
        soldAmountCents:
          sql<number>`coalesce(sum(${orders.subtotalAmountCents}), 0)`,
        receivedAmountCents:
          sql<number>`coalesce(sum(${orders.paidAmountCents}), 0)`,
        receivableAmountCents:
          sql<number>`coalesce(sum(${orders.remainingAmountCents}), 0)`,
      })
      .from(orders)
      .where(and(...conditions));

    return summary ?? {
      soldAmountCents: 0,
      receivedAmountCents: 0,
      receivableAmountCents: 0,
    };
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

  async updateStatus(
    id: string,
    data: OrderStatusUpdate,
    executor: Executor = getDb(),
  ) {
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
