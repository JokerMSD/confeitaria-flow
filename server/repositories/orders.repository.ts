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
import type {
  ListOrdersFilters,
  OrdersDashboardSummaryFilters,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@shared/types";

type Executor = ReturnType<typeof getDb> | any;

function toSafeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export interface OrderRowInsert {
  orderNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string | null;
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string | null;
  deliveryMode: "Entrega" | "Retirada";
  deliveryAddress: string | null;
  deliveryReference: string | null;
  deliveryDistrict: string | null;
  deliveryFeeCents: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  paymentProviderPaymentId: string | null;
  paymentProviderStatus: string | null;
  paymentProviderStatusDetail: string | null;
  notes: string | null;
  itemsSubtotalAmountCents: number;
  discountSource: "Manual" | "Cupom" | null;
  discountType: "Percentual" | "ValorFixo" | null;
  discountValue: number | null;
  discountAmountCents: number;
  discountLabel: string | null;
  couponCode: string | null;
  subtotalAmountCents: number;
  paidAmountCents: number;
  remainingAmountCents: number;
  fullyPaidAt: Date | null;
  itemCount: number;
}

export interface OrderRowUpdate extends OrderRowInsert {
  updatedAt: Date;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  updatedAt: Date;
}

export interface OrderPaymentSyncUpdate {
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  paymentProviderPaymentId: string | null;
  paymentProviderStatus: string | null;
  paymentProviderStatusDetail: string | null;
  paidAmountCents: number;
  remainingAmountCents: number;
  fullyPaidAt: Date | null;
  updatedAt: Date;
}

export interface OrderDashboardProductRow {
  recipeId: string | null;
  productName: string;
  quantitySold: number;
  orderCount: number;
  revenueCents: number;
}

export interface OrderDashboardDeliveryModeRow {
  deliveryMode: "Entrega" | "Retirada";
  orderCount: number;
  revenueCents: number;
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

  async findByPaymentProviderPaymentId(
    paymentProvider: string,
    paymentProviderPaymentId: string,
    executor: Executor = getDb(),
  ) {
    const [order] = await executor
      .select()
      .from(orders)
      .where(
        and(
          isNull(orders.deletedAt),
          eq(orders.paymentProvider, paymentProvider),
          eq(orders.paymentProviderPaymentId, paymentProviderPaymentId),
        ),
      )
      .limit(1);

    return order ?? null;
  }

  async listQueueRows(executor: Executor = getDb()) {
    return executor
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        orderDate: orders.orderDate,
        deliveryDate: orders.deliveryDate,
        deliveryTime: orders.deliveryTime,
        deliveryMode: orders.deliveryMode,
        deliveryAddress: orders.deliveryAddress,
        deliveryReference: orders.deliveryReference,
        deliveryDistrict: orders.deliveryDistrict,
        deliveryFeeCents: orders.deliveryFeeCents,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        paymentProvider: orders.paymentProvider,
        paymentProviderPaymentId: orders.paymentProviderPaymentId,
        paymentProviderStatus: orders.paymentProviderStatus,
        paymentProviderStatusDetail: orders.paymentProviderStatusDetail,
        notes: orders.notes,
        itemsSubtotalAmountCents: orders.itemsSubtotalAmountCents,
        discountSource: orders.discountSource,
        discountType: orders.discountType,
        discountValue: orders.discountValue,
        discountAmountCents: orders.discountAmountCents,
        discountLabel: orders.discountLabel,
        couponCode: orders.couponCode,
        subtotalAmountCents: orders.subtotalAmountCents,
        paidAmountCents: orders.paidAmountCents,
        remainingAmountCents: orders.remainingAmountCents,
        itemCount: orders.itemCount,
        updatedAt: orders.updatedAt,
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
        deliveryTime: orders.deliveryTime,
        deliveryMode: orders.deliveryMode,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        subtotalAmountCents: orders.subtotalAmountCents,
        itemCount: orders.itemCount,
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

  async listPublicAvailabilityRows(
    filters: {
      deliveryMode: "Entrega" | "Retirada";
      dateFrom: string;
      dateTo: string;
    },
    executor: Executor = getDb(),
  ) {
    return executor
      .select({
        deliveryDate: orders.deliveryDate,
        deliveryTime: orders.deliveryTime,
      })
      .from(orders)
      .where(
        and(
          isNull(orders.deletedAt),
          eq(orders.deliveryMode, filters.deliveryMode),
          notInArray(orders.status, ["Cancelado"]),
          sql`${orders.deliveryDate} >= ${filters.dateFrom}`,
          sql`${orders.deliveryDate} <= ${filters.dateTo}`,
        ),
      )
      .orderBy(asc(orders.deliveryDate), asc(orders.deliveryTime));
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
        fullyPaidAt: orders.fullyPaidAt,
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
        soldAmountCents: sql<number>`coalesce(sum(${orders.subtotalAmountCents}), 0)`,
        receivedAmountCents: sql<number>`coalesce(sum(${orders.paidAmountCents}), 0)`,
        receivableAmountCents: sql<number>`coalesce(sum(${orders.remainingAmountCents}), 0)`,
      })
      .from(orders)
      .where(and(...conditions));

    return {
      soldAmountCents: toSafeNumber(summary?.soldAmountCents),
      receivedAmountCents: toSafeNumber(summary?.receivedAmountCents),
      receivableAmountCents: toSafeNumber(summary?.receivableAmountCents),
    };
  }

  async listDashboardProductRows(
    filters: OrdersDashboardSummaryFilters = {},
    executor: Executor = getDb(),
  ): Promise<OrderDashboardProductRow[]> {
    const conditions = [
      isNull(orders.deletedAt),
      notInArray(orders.status, ["Cancelado"]),
    ];

    if (filters.dateFrom) {
      conditions.push(sql`${orders.orderDate} >= ${filters.dateFrom}`);
    }

    if (filters.dateTo) {
      conditions.push(sql`${orders.orderDate} <= ${filters.dateTo}`);
    }

    const rows = await executor
      .select({
        recipeId: orderItems.recipeId,
        productName: orderItems.productName,
        quantitySold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
        orderCount: sql<number>`count(distinct ${orders.id})`,
        revenueCents: sql<number>`coalesce(sum(${orderItems.lineTotalCents}), 0)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(...conditions))
      .groupBy(orderItems.recipeId, orderItems.productName)
      .orderBy(sql`coalesce(sum(${orderItems.lineTotalCents}), 0) desc`);

    return rows.map((row: any) => ({
      recipeId: row.recipeId ?? null,
      productName: row.productName,
      quantitySold: toSafeNumber(row.quantitySold),
      orderCount: toSafeNumber(row.orderCount),
      revenueCents: toSafeNumber(row.revenueCents),
    }));
  }

  async getDashboardDeliveryModeRows(
    filters: OrdersDashboardSummaryFilters = {},
    executor: Executor = getDb(),
  ): Promise<OrderDashboardDeliveryModeRow[]> {
    const conditions = [
      isNull(orders.deletedAt),
      notInArray(orders.status, ["Cancelado"]),
    ];

    if (filters.dateFrom) {
      conditions.push(sql`${orders.orderDate} >= ${filters.dateFrom}`);
    }

    if (filters.dateTo) {
      conditions.push(sql`${orders.orderDate} <= ${filters.dateTo}`);
    }

    const rows = await executor
      .select({
        deliveryMode: orders.deliveryMode,
        orderCount: sql<number>`count(*)`,
        revenueCents: sql<number>`coalesce(sum(${orders.subtotalAmountCents}), 0)`,
      })
      .from(orders)
      .where(and(...conditions))
      .groupBy(orders.deliveryMode)
      .orderBy(sql`coalesce(sum(${orders.subtotalAmountCents}), 0) desc`);

    return rows.map((row: any) => ({
      deliveryMode: row.deliveryMode,
      orderCount: toSafeNumber(row.orderCount),
      revenueCents: toSafeNumber(row.revenueCents),
    }));
  }

  async getDashboardOrderTotals(
    filters: OrdersDashboardSummaryFilters = {},
    executor: Executor = getDb(),
  ) {
    const conditions = [
      isNull(orders.deletedAt),
      notInArray(orders.status, ["Cancelado"]),
    ];

    if (filters.dateFrom) {
      conditions.push(sql`${orders.orderDate} >= ${filters.dateFrom}`);
    }

    if (filters.dateTo) {
      conditions.push(sql`${orders.orderDate} <= ${filters.dateTo}`);
    }

    const [summary] = await executor
      .select({
        ordersCount: sql<number>`count(*)`,
        itemLinesCount: sql<number>`coalesce(sum(${orders.itemCount}), 0)`,
        revenueCents: sql<number>`coalesce(sum(${orders.subtotalAmountCents}), 0)`,
      })
      .from(orders)
      .where(and(...conditions));

    return {
      ordersCount: toSafeNumber(summary?.ordersCount),
      itemLinesCount: toSafeNumber(summary?.itemLinesCount),
      revenueCents: toSafeNumber(summary?.revenueCents),
    };
  }

  async create(data: OrderRowInsert, executor: Executor = getDb()) {
    const [order] = await executor.insert(orders).values(data).returning();

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

  async updatePaymentSync(
    id: string,
    data: OrderPaymentSyncUpdate,
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
