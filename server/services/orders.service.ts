import type {
  CreateOrderInput,
  ListOrdersFilters,
  OrderDetail,
  OrderLookupItem,
  OrderItem,
  OrderListItem,
  OrderQueueItem,
  PaymentStatus,
  UpdateOrderInput,
} from "@shared/types";
import { OrdersRepository } from "../repositories/orders.repository";
import { OrderItemsRepository } from "../repositories/order-items.repository";
import { OrderItemAdditionalsRepository } from "../repositories/order-item-additionals.repository";
import { withTransaction } from "../db/transaction";
import { formatOrderNumber } from "../utils/order-number";
import { HttpError } from "../utils/http-error";
import { CashTransactionsService } from "./cash-transactions.service";
import { OrderRecipeConsumptionService } from "./order-recipe-consumption.service";
import { RecipesService } from "./recipes.service";
import { ProductAdditionalsService } from "./product-additionals.service";

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
  private readonly orderItemAdditionalsRepository =
    new OrderItemAdditionalsRepository();
  private readonly cashTransactionsService = new CashTransactionsService();
  private readonly orderRecipeConsumptionService =
    new OrderRecipeConsumptionService();
  private readonly recipesService = new RecipesService();
  private readonly productAdditionalsService = new ProductAdditionalsService();

  async list(filters: ListOrdersFilters) {
    const rows = await this.ordersRepository.list(filters);
    return rows.map((row: any) => this.mapOrderListItem(row));
  }

  async listQueue() {
    const rows = await this.ordersRepository.listQueueRows();
    const orders = new Map<string, OrderQueueItem>();

    for (const row of rows) {
      const current =
        orders.get(row.id) ??
        ({
          id: row.id,
          orderNumber: row.orderNumber,
          customerName: row.customerName,
          customerPhone: row.customerPhone ?? null,
          orderDate: row.orderDate,
          deliveryDate: row.deliveryDate,
          deliveryTime: row.deliveryTime ?? null,
          deliveryMode: row.deliveryMode,
          deliveryAddress: row.deliveryAddress ?? null,
          deliveryReference: row.deliveryReference ?? null,
          deliveryDistrict: row.deliveryDistrict ?? null,
          deliveryFeeCents: row.deliveryFeeCents ?? 0,
          status: row.status,
          paymentMethod: row.paymentMethod,
          paymentStatus: row.paymentStatus,
          notes: row.notes ?? null,
          subtotalAmountCents: row.subtotalAmountCents,
          paidAmountCents: row.paidAmountCents,
          remainingAmountCents: row.remainingAmountCents,
          itemCount: row.itemCount,
          items: [] as OrderQueueItem["items"],
        } satisfies OrderQueueItem);

      if (row.itemProductName && Number.isFinite(row.itemQuantity)) {
        current.items.push({
          productName: row.itemProductName,
          quantity: row.itemQuantity,
        });
      }

      orders.set(row.id, current);
    }

    return Array.from(orders.values());
  }

  async listLookup() {
    const rows = await this.ordersRepository.listLookupRows();

    return rows.map((row: any) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      customerName: row.customerName,
      deliveryDate: row.deliveryDate,
      status: row.status,
      paymentStatus: row.paymentStatus,
    } satisfies OrderLookupItem));
  }

  async getById(id: string) {
    const row = await this.ordersRepository.findById(id);

    if (!row) {
      throw new HttpError(404, "Order not found.");
    }

    const items = await this.orderItemsRepository.listByOrderId(row.id);
    const additionals = await this.orderItemAdditionalsRepository.listByOrderItemIds(
      items.map((item: any) => item.id),
    );
    return this.mapOrderDetail(row, items, additionals);
  }

  async create(input: CreateOrderInput) {
    const normalized = await this.normalizeOrderInput(input);

    return withTransaction<OrderDetail>(async (tx) => {
      await this.recipesService.assertOrderRecipesAreSellable(
        normalized.items
          .map((item) => item.recipeId)
          .filter((recipeId): recipeId is string => Boolean(recipeId)),
        tx,
      );
      await this.recipesService.assertFillingRecipesArePreparations(
        normalized.items
          .flatMap((item) => [
            item.fillingRecipeId,
            item.secondaryFillingRecipeId,
            item.tertiaryFillingRecipeId,
          ])
          .filter((recipeId): recipeId is string => Boolean(recipeId)),
        tx,
      );

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
          deliveryMode: normalized.deliveryMode,
          deliveryAddress: normalized.deliveryAddress,
          deliveryReference: normalized.deliveryReference,
          deliveryDistrict: normalized.deliveryDistrict,
          deliveryFeeCents: normalized.deliveryFeeCents,
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
          recipeId: item.recipeId,
          fillingRecipeId: item.fillingRecipeId,
          secondaryFillingRecipeId: item.secondaryFillingRecipeId,
          tertiaryFillingRecipeId: item.tertiaryFillingRecipeId,
          productName: item.productName,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents,
          position: item.position ?? index,
        })),
        tx,
      );

      await this.orderItemAdditionalsRepository.insertMany(
        createdItems.flatMap((createdItem: any, index: number) =>
          normalized.items[index].additionals.map((additional, additionalIndex) => ({
            orderItemId: createdItem.id,
            groupId: additional.groupId,
            optionId: additional.optionId,
            groupName: additional.groupName,
            optionName: additional.optionName,
            priceDeltaCents: additional.priceDeltaCents,
            position: additional.position ?? additionalIndex,
          })),
        ),
        tx,
      );

      await this.cashTransactionsService.syncOrderReceipt(
        {
          id: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          customerName: createdOrder.customerName,
          paymentMethod: createdOrder.paymentMethod,
          orderDate: createdOrder.orderDate,
          paidAmountCents: createdOrder.paidAmountCents,
        },
        tx,
      );

      await this.orderRecipeConsumptionService.syncOrderConsumption(
        {
          orderId: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          status: createdOrder.status,
          items: createdItems.map((item: any) => ({
            recipeId: item.recipeId ?? null,
            fillingRecipeId: item.fillingRecipeId ?? null,
            secondaryFillingRecipeId: item.secondaryFillingRecipeId ?? null,
            tertiaryFillingRecipeId: item.tertiaryFillingRecipeId ?? null,
            quantity: item.quantity,
            productName: item.productName,
          })),
        },
        tx,
      );

      const additionals = await this.orderItemAdditionalsRepository.listByOrderItemIds(
        createdItems.map((item: any) => item.id),
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
        additionals,
      );
    });
  }

  async update(id: string, input: UpdateOrderInput) {
    const normalized = await this.normalizeOrderInput(input);

    return withTransaction<OrderDetail>(async (tx) => {
      const existing = await this.ordersRepository.findById(id, tx);

      if (!existing) {
        throw new HttpError(404, "Order not found.");
      }

      const now = new Date();

      await this.recipesService.assertOrderRecipesAreSellable(
        normalized.items
          .map((item) => item.recipeId)
          .filter((recipeId): recipeId is string => Boolean(recipeId)),
        tx,
      );
      await this.recipesService.assertFillingRecipesArePreparations(
        normalized.items
          .flatMap((item) => [
            item.fillingRecipeId,
            item.secondaryFillingRecipeId,
            item.tertiaryFillingRecipeId,
          ])
          .filter((recipeId): recipeId is string => Boolean(recipeId)),
        tx,
      );

      const updatedOrder = await this.ordersRepository.update(
        id,
        {
          orderNumber: existing.orderNumber,
          customerName: normalized.customerName,
          customerPhone: normalized.customerPhone,
          orderDate: normalized.orderDate,
          deliveryDate: normalized.deliveryDate,
          deliveryTime: normalized.deliveryTime,
          deliveryMode: normalized.deliveryMode,
          deliveryAddress: normalized.deliveryAddress,
          deliveryReference: normalized.deliveryReference,
          deliveryDistrict: normalized.deliveryDistrict,
          deliveryFeeCents: normalized.deliveryFeeCents,
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

      const existingItems = await this.orderItemsRepository.listByOrderId(id, tx);
      await this.orderItemAdditionalsRepository.deleteByOrderItemIds(
        existingItems.map((item: any) => item.id),
        tx,
      );
      await this.orderItemsRepository.deleteByOrderId(id, tx);

      const updatedItems = await this.orderItemsRepository.insertMany(
        normalized.items.map((item, index) => ({
          orderId: id,
          recipeId: item.recipeId,
          fillingRecipeId: item.fillingRecipeId,
          secondaryFillingRecipeId: item.secondaryFillingRecipeId,
          tertiaryFillingRecipeId: item.tertiaryFillingRecipeId,
          productName: item.productName,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents,
          position: item.position ?? index,
        })),
        tx,
      );

      await this.orderItemAdditionalsRepository.insertMany(
        updatedItems.flatMap((updatedItem: any, index: number) =>
          normalized.items[index].additionals.map((additional, additionalIndex) => ({
            orderItemId: updatedItem.id,
            groupId: additional.groupId,
            optionId: additional.optionId,
            groupName: additional.groupName,
            optionName: additional.optionName,
            priceDeltaCents: additional.priceDeltaCents,
            position: additional.position ?? additionalIndex,
          })),
        ),
        tx,
      );

      await this.cashTransactionsService.syncOrderReceipt(
        {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          customerName: updatedOrder.customerName,
          paymentMethod: updatedOrder.paymentMethod,
          orderDate: updatedOrder.orderDate,
          paidAmountCents: updatedOrder.paidAmountCents,
        },
        tx,
      );

      await this.orderRecipeConsumptionService.syncOrderConsumption(
        {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          items: updatedItems.map((item: any) => ({
            recipeId: item.recipeId ?? null,
            fillingRecipeId: item.fillingRecipeId ?? null,
            secondaryFillingRecipeId: item.secondaryFillingRecipeId ?? null,
            tertiaryFillingRecipeId: item.tertiaryFillingRecipeId ?? null,
            quantity: item.quantity,
            productName: item.productName,
          })),
        },
        tx,
      );

      const additionals = await this.orderItemAdditionalsRepository.listByOrderItemIds(
        updatedItems.map((item: any) => item.id),
        tx,
      );
      return this.mapOrderDetail(updatedOrder, updatedItems, additionals);
    });
  }

  async confirm(id: string) {
    return withTransaction<OrderDetail>(async (tx) => {
      const existing = await this.ordersRepository.findById(id, tx);

      if (!existing) {
        throw new HttpError(404, "Order not found.");
      }

      if (existing.status === "Cancelado" || existing.status === "Entregue") {
        throw new HttpError(
          400,
          "Only active orders can be confirmed quickly.",
        );
      }

      if (existing.status !== "Novo") {
        const currentItems = await this.orderItemsRepository.listByOrderId(id, tx);
        const additionals =
          await this.orderItemAdditionalsRepository.listByOrderItemIds(
            currentItems.map((item: any) => item.id),
            tx,
          );
        return this.mapOrderDetail(existing, currentItems, additionals);
      }

      const updatedOrder = await this.ordersRepository.updateStatus(
        id,
        {
          status: "Confirmado",
          updatedAt: new Date(),
        },
        tx,
      );

      if (!updatedOrder) {
        throw new HttpError(404, "Order not found.");
      }

      const items = await this.orderItemsRepository.listByOrderId(id, tx);

      await this.orderRecipeConsumptionService.syncOrderConsumption(
        {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          items: items.map((item: any) => ({
            recipeId: item.recipeId ?? null,
            fillingRecipeId: item.fillingRecipeId ?? null,
            secondaryFillingRecipeId: item.secondaryFillingRecipeId ?? null,
            tertiaryFillingRecipeId: item.tertiaryFillingRecipeId ?? null,
            quantity: item.quantity,
            productName: item.productName,
          })),
        },
        tx,
      );

      const additionals = await this.orderItemAdditionalsRepository.listByOrderItemIds(
        items.map((item: any) => item.id),
        tx,
      );
      return this.mapOrderDetail(updatedOrder, items, additionals);
    });
  }

  async updateStatus(id: string, nextStatus: UpdateOrderInput["status"]) {
    return withTransaction<OrderDetail>(async (tx) => {
      const existing = await this.ordersRepository.findById(id, tx);

      if (!existing) {
        throw new HttpError(404, "Order not found.");
      }

      if (existing.status === "Cancelado") {
        throw new HttpError(400, "Canceled orders cannot be moved.");
      }

      if (existing.status === "Entregue" && nextStatus !== "Confirmado") {
        throw new HttpError(400, "Delivered orders can only be reopened to Confirmado.");
      }

      const allowedTransitions: Record<string, UpdateOrderInput["status"][]> = {
        Novo: ["Confirmado", "Cancelado"],
        Confirmado: ["EmProducao", "Pronto", "Cancelado"],
        EmProducao: ["Confirmado", "Pronto", "Cancelado"],
        Pronto: ["Confirmado", "EmProducao", "Entregue", "Cancelado"],
        Entregue: ["Confirmado"],
        Cancelado: [],
      };

      if (existing.status === nextStatus) {
        const items = await this.orderItemsRepository.listByOrderId(id, tx);
        const additionals =
          await this.orderItemAdditionalsRepository.listByOrderItemIds(
            items.map((item: any) => item.id),
            tx,
          );
        return this.mapOrderDetail(existing, items, additionals);
      }

      if (!allowedTransitions[existing.status]?.includes(nextStatus)) {
        throw new HttpError(400, "Invalid queue status transition.");
      }

      const updatedOrder = await this.ordersRepository.updateStatus(
        id,
        {
          status: nextStatus,
          updatedAt: new Date(),
        },
        tx,
      );

      if (!updatedOrder) {
        throw new HttpError(404, "Order not found.");
      }

      const items = await this.orderItemsRepository.listByOrderId(id, tx);

      await this.orderRecipeConsumptionService.syncOrderConsumption(
        {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          items: items.map((item: any) => ({
            recipeId: item.recipeId ?? null,
            fillingRecipeId: item.fillingRecipeId ?? null,
            secondaryFillingRecipeId: item.secondaryFillingRecipeId ?? null,
            tertiaryFillingRecipeId: item.tertiaryFillingRecipeId ?? null,
            quantity: item.quantity,
            productName: item.productName,
          })),
        },
        tx,
      );

      const additionals = await this.orderItemAdditionalsRepository.listByOrderItemIds(
        items.map((item: any) => item.id),
        tx,
      );
      return this.mapOrderDetail(updatedOrder, items, additionals);
    });
  }

  async remove(id: string) {
    return withTransaction(async (tx) => {
      const deletedAt = new Date();
      const deleted = await this.ordersRepository.markDeleted(id, deletedAt, tx);

      if (!deleted) {
        throw new HttpError(404, "Order not found.");
      }

      await this.cashTransactionsService.syncOrderReceipt(
        {
          id: deleted.id,
          orderNumber: deleted.orderNumber,
          customerName: deleted.customerName,
          paymentMethod: deleted.paymentMethod,
          orderDate: deleted.orderDate,
          paidAmountCents: 0,
        },
        tx,
      );

      await this.orderRecipeConsumptionService.syncOrderConsumption(
        {
          orderId: deleted.id,
          orderNumber: deleted.orderNumber,
          status: "Cancelado",
          items: [],
        },
        tx,
      );

      return {
        id: deleted.id,
        deletedAt: deletedAt.toISOString(),
      };
    });
  }

  private async normalizeOrderInput(input: CreateOrderInput | UpdateOrderInput) {
    const customerName = input.customerName.trim();
    const customerPhone = input.customerPhone?.trim() || null;
    const deliveryTime = input.deliveryTime?.trim() || null;
    const deliveryAddress = input.deliveryAddress?.trim() || null;
    const deliveryReference = input.deliveryReference?.trim() || null;
    const deliveryDistrict = input.deliveryDistrict?.trim() || null;
    const deliveryFeeCents = Math.max(0, input.deliveryFeeCents ?? 0);
    const notes = input.notes?.trim() || null;
    const paidAmountCents = Math.max(0, input.paidAmountCents);

    const items = await Promise.all(input.items.map(async (item, index) => {
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

      const additionals =
        await this.productAdditionalsService.resolveOrderItemAdditionals(
          item.recipeId ?? null,
          item.additionals,
        );

      return {
        recipeId: item.recipeId ?? null,
        fillingRecipeId: item.fillingRecipeId ?? null,
        secondaryFillingRecipeId: item.secondaryFillingRecipeId ?? null,
        tertiaryFillingRecipeId: item.tertiaryFillingRecipeId ?? null,
        additionals,
        productName,
        quantity,
        unitPriceCents,
        lineTotalCents:
          quantity *
          (unitPriceCents +
            additionals.reduce(
              (sum, additional) => sum + additional.priceDeltaCents,
              0,
            )),
        position: item.position ?? index,
      };
    }));

    if (items.length === 0) {
      throw new HttpError(400, "Order must contain at least one item.");
    }

    const itemsSubtotalAmountCents = items.reduce(
      (sum, item) => sum + item.lineTotalCents,
      0,
    );
    const subtotalAmountCents = itemsSubtotalAmountCents + deliveryFeeCents;

    const remainingAmountCents = Math.max(0, subtotalAmountCents - paidAmountCents);
    const paymentStatus = calculatePaymentStatus(subtotalAmountCents, paidAmountCents);

    return {
      customerName,
      customerPhone,
      orderDate: input.orderDate,
      deliveryDate: input.deliveryDate,
      deliveryTime,
      deliveryMode: input.deliveryMode,
      deliveryAddress: input.deliveryMode === "Entrega" ? deliveryAddress : null,
      deliveryReference: input.deliveryMode === "Entrega" ? deliveryReference : null,
      deliveryDistrict: input.deliveryMode === "Entrega" ? deliveryDistrict : null,
      deliveryFeeCents: input.deliveryMode === "Entrega" ? deliveryFeeCents : 0,
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
      deliveryMode: row.deliveryMode,
      deliveryAddress: row.deliveryAddress ?? null,
      deliveryReference: row.deliveryReference ?? null,
      deliveryDistrict: row.deliveryDistrict ?? null,
      deliveryFeeCents: row.deliveryFeeCents ?? 0,
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

  private mapOrderDetail(row: any, items: any[], additionals: any[]): OrderDetail {
    return {
      ...this.mapOrderListItem(row),
      items: items.map<OrderItem>((item) => ({
        id: item.id,
        orderId: item.orderId,
        recipeId: item.recipeId ?? null,
        fillingRecipeId: item.fillingRecipeId ?? null,
        secondaryFillingRecipeId: item.secondaryFillingRecipeId ?? null,
        tertiaryFillingRecipeId: item.tertiaryFillingRecipeId ?? null,
        productName: item.productName,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
        position: item.position,
        additionals: additionals
          .filter((additional) => additional.orderItemId === item.id)
          .map((additional) => ({
            id: additional.id,
            orderItemId: additional.orderItemId,
            groupId: additional.groupId,
            optionId: additional.optionId,
            groupName: additional.groupName,
            optionName: additional.optionName,
            priceDeltaCents: additional.priceDeltaCents,
            position: additional.position,
            createdAt: additional.createdAt.toISOString(),
            updatedAt: additional.updatedAt.toISOString(),
          })),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    };
  }
}
