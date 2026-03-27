import type {
  CreateOrderInput,
  ListOrdersFilters,
  OrderDetail,
  OrderItem,
  OrderListItem,
  PaymentStatus,
  UpdateOrderInput,
} from "@shared/types";
import { OrdersRepository } from "../repositories/orders.repository";
import { OrderItemsRepository } from "../repositories/order-items.repository";
import { withTransaction } from "../db/transaction";
import { formatOrderNumber } from "../utils/order-number";
import { HttpError } from "../utils/http-error";

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

function calculatePaymentStatus(
  subtotalAmountCents: number,
  paidAmountCents: number,
): PaymentStatus {
  if (paidAmountCents <= 0) return "Pendente";
  if (paidAmountCents >= subtotalAmountCents) return "Pago";
  return "Parcial";
}

export class OrdersService {
  private readonly ordersRepository = new OrdersRepository();
  private readonly orderItemsRepository = new OrderItemsRepository();

  async list(filters: ListOrdersFilters) {
    const rows = await this.ordersRepository.list(filters);
    return rows.map((row: any) => this.mapOrderListItem(row));
  }

  async getById(id: string) {
    const row = await this.ordersRepository.findById(id);

    if (!row) {
      throw new HttpError(404, "Order not found.");
    }

    const items = await this.orderItemsRepository.listByOrderId(row.id);
    return this.mapOrderDetail(row, items);
  }

  async create(input: CreateOrderInput) {
    const normalized = this.normalizeOrderInput(input);

    return withTransaction<OrderDetail>(async (tx) => {
      const sequence = await this.ordersRepository.nextOrderSequence(tx);
      const now = new Date();

      const createdOrder = await this.ordersRepository.create(
        {
          orderNumber: formatOrderNumber(sequence),
          customerName: normalized.customerName,
          customerPhone: normalized.customerPhone,
          orderDate: normalized.orderDate,
          deliveryDate: normalized.deliveryDate,
          deliveryTime: normalized.deliveryTime,
          status: normalized.status,
          paymentMethod: normalized.paymentMethod,
          paymentStatus: normalized.paymentStatus,
          notes: normalized.notes,
          subtotalAmountCents: normalized.subtotalAmountCents,
          paidAmountCents: normalized.paidAmountCents,
          remainingAmountCents: normalized.remainingAmountCents,
          itemCount: normalized.itemCount,
        },
        tx,
      );

      const createdItems = await this.orderItemsRepository.insertMany(
        normalized.items.map((item, index) => ({
          orderId: createdOrder.id,
          productName: item.productName,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents,
          position: item.position ?? index,
        })),
        tx,
      );

      return this.mapOrderDetail(
        {
          ...createdOrder,
          createdAt: createdOrder.createdAt ?? now,
          updatedAt: createdOrder.updatedAt ?? now,
          deletedAt: createdOrder.deletedAt ?? null,
        },
        createdItems,
      );
    });
  }

  async update(id: string, input: UpdateOrderInput) {
    const normalized = this.normalizeOrderInput(input);

    return withTransaction<OrderDetail>(async (tx) => {
      const existing = await this.ordersRepository.findById(id, tx);

      if (!existing) {
        throw new HttpError(404, "Order not found.");
      }

      const now = new Date();

      const updatedOrder = await this.ordersRepository.update(
        id,
        {
          orderNumber: existing.orderNumber,
          customerName: normalized.customerName,
          customerPhone: normalized.customerPhone,
          orderDate: normalized.orderDate,
          deliveryDate: normalized.deliveryDate,
          deliveryTime: normalized.deliveryTime,
          status: normalized.status,
          paymentMethod: normalized.paymentMethod,
          paymentStatus: normalized.paymentStatus,
          notes: normalized.notes,
          subtotalAmountCents: normalized.subtotalAmountCents,
          paidAmountCents: normalized.paidAmountCents,
          remainingAmountCents: normalized.remainingAmountCents,
          itemCount: normalized.itemCount,
          updatedAt: now,
        },
        tx,
      );

      if (!updatedOrder) {
        throw new HttpError(404, "Order not found.");
      }

      await this.orderItemsRepository.deleteByOrderId(id, tx);

      const updatedItems = await this.orderItemsRepository.insertMany(
        normalized.items.map((item, index) => ({
          orderId: id,
          productName: item.productName,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents,
          position: item.position ?? index,
        })),
        tx,
      );

      return this.mapOrderDetail(updatedOrder, updatedItems);
    });
  }

  async remove(id: string) {
    const deletedAt = new Date();
    const deleted = await this.ordersRepository.markDeleted(id, deletedAt);

    if (!deleted) {
      throw new HttpError(404, "Order not found.");
    }

    return {
      id: deleted.id,
      deletedAt: deletedAt.toISOString(),
    };
  }

  private normalizeOrderInput(input: CreateOrderInput | UpdateOrderInput) {
    const customerName = input.customerName.trim();
    const customerPhone = input.customerPhone?.trim() || null;
    const deliveryTime = input.deliveryTime?.trim() || null;
    const notes = input.notes?.trim() || null;
    const paidAmountCents = Math.max(0, input.paidAmountCents);

    const items = input.items.map((item, index) => {
      const productName = item.productName.trim();
      const quantity = item.quantity;
      const unitPriceCents = item.unitPriceCents;

      if (!productName) {
        throw new HttpError(400, "Order item productName is required.");
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new HttpError(400, "Order item quantity must be greater than zero.");
      }

      if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
        throw new HttpError(400, "Order item unitPriceCents must be a non-negative integer.");
      }

      return {
        productName,
        quantity,
        unitPriceCents,
        lineTotalCents: quantity * unitPriceCents,
        position: item.position ?? index,
      };
    });

    if (items.length === 0) {
      throw new HttpError(400, "Order must contain at least one item.");
    }

    const subtotalAmountCents = items.reduce(
      (sum, item) => sum + item.lineTotalCents,
      0,
    );

    const remainingAmountCents = Math.max(0, subtotalAmountCents - paidAmountCents);
    const paymentStatus = calculatePaymentStatus(subtotalAmountCents, paidAmountCents);

    return {
      customerName,
      customerPhone,
      orderDate: input.orderDate,
      deliveryDate: input.deliveryDate,
      deliveryTime,
      status: input.status,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      notes,
      subtotalAmountCents,
      paidAmountCents,
      remainingAmountCents,
      itemCount: items.length,
      items,
    };
  }

  private mapOrderListItem(row: any): OrderListItem {
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      customerName: row.customerName,
      customerPhone: row.customerPhone ?? null,
      orderDate: row.orderDate,
      deliveryDate: row.deliveryDate,
      deliveryTime: row.deliveryTime ?? null,
      status: row.status,
      paymentMethod: row.paymentMethod,
      paymentStatus: row.paymentStatus,
      notes: row.notes ?? null,
      subtotalAmountCents: row.subtotalAmountCents,
      paidAmountCents: row.paidAmountCents,
      remainingAmountCents: row.remainingAmountCents,
      itemCount: row.itemCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      deletedAt: toIsoString(row.deletedAt),
    };
  }

  private mapOrderDetail(row: any, items: any[]): OrderDetail {
    return {
      ...this.mapOrderListItem(row),
      items: items.map<OrderItem>((item) => ({
        id: item.id,
        orderId: item.orderId,
        productName: item.productName,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
        position: item.position,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    };
  }
}
