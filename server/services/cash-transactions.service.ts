import type {
  CashSummary,
  CashTransaction,
  CreateCashTransactionInput,
  ListCashTransactionsFilters,
  PaymentMethod,
  UpdateCashTransactionInput,
} from "@shared/types";
import { OrdersRepository } from "../repositories/orders.repository";
import { CashTransactionsRepository } from "../repositories/cash-transactions.repository";
import { HttpError } from "../utils/http-error";
import { withTransaction } from "../db/transaction";

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

export class CashTransactionsService {
  private readonly cashTransactionsRepository = new CashTransactionsRepository();
  private readonly ordersRepository = new OrdersRepository();

  async list(filters: ListCashTransactionsFilters) {
    const rows = await this.cashTransactionsRepository.list(filters);
    return rows.map((row: any) => this.mapCashTransaction(row));
  }

  async getSummary(date?: string): Promise<CashSummary> {
    const orderSummary = await this.ordersRepository.getFinancialSummaryByDate(
      date,
    );
    const expenseRows = await this.cashTransactionsRepository.list({
      type: "Saida",
      category: "CompraEstoque",
      dateFrom: date,
      dateTo: date,
    });

    return {
      soldAmountCents: Number(orderSummary.soldAmountCents ?? 0),
      receivedAmountCents: Number(orderSummary.receivedAmountCents ?? 0),
      receivableAmountCents: Number(orderSummary.receivableAmountCents ?? 0),
      expenseAmountCents: expenseRows.reduce(
        (sum: number, row: any) => sum + row.amountCents,
        0,
      ),
    };
  }

  async reconcileOrderReceipts() {
    return withTransaction(async (tx) => {
      const orders = await this.ordersRepository.listCashSyncRows(tx);

      for (const order of orders) {
        await this.syncOrderReceipt(
          {
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            paymentMethod: order.paymentMethod,
            orderDate: order.orderDate,
            paidAmountCents: order.paidAmountCents,
          },
          tx,
        );
      }
    });
  }

  async getById(id: string) {
    const row = await this.cashTransactionsRepository.findById(id);

    if (!row) {
      throw new HttpError(404, "Cash transaction not found.");
    }

    return this.mapCashTransaction(row);
  }

  async create(input: CreateCashTransactionInput) {
    const normalized = await this.normalizeInput(input);
    const created = await this.cashTransactionsRepository.create(normalized);
    return this.mapCashTransaction(created);
  }

  async update(id: string, input: UpdateCashTransactionInput) {
    const existing = await this.cashTransactionsRepository.findById(id);

    if (!existing) {
      throw new HttpError(404, "Cash transaction not found.");
    }

    if (existing.isSystemGenerated) {
      throw new HttpError(
        400,
        "System-generated cash transactions cannot be edited manually.",
      );
    }

    const normalized = await this.normalizeInput(input);
    const updated = await this.cashTransactionsRepository.update(id, {
      ...normalized,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw new HttpError(404, "Cash transaction not found.");
    }

    return this.mapCashTransaction(updated);
  }

  async remove(id: string) {
    const existing = await this.cashTransactionsRepository.findById(id);

    if (!existing) {
      throw new HttpError(404, "Cash transaction not found.");
    }

    if (existing.isSystemGenerated) {
      throw new HttpError(
        400,
        "System-generated cash transactions cannot be removed manually.",
      );
    }

    const deletedAt = new Date();
    const deleted = await this.cashTransactionsRepository.markDeleted(
      id,
      deletedAt,
    );

    if (!deleted) {
      throw new HttpError(404, "Cash transaction not found.");
    }

    return {
      id: deleted.id,
      deletedAt: deletedAt.toISOString(),
    };
  }

  async syncOrderReceipt(
    order: {
      id: string;
      orderNumber: string;
      customerName: string;
      paymentMethod: PaymentMethod;
      orderDate: string;
      paidAmountCents: number;
    },
    executor: any,
  ) {
    const existing = await this.cashTransactionsRepository.findBySource(
      "PedidoRecebimento",
      order.id,
      executor,
    );

    if (order.paidAmountCents <= 0) {
      if (existing) {
        await this.cashTransactionsRepository.markDeletedBySource(
          "PedidoRecebimento",
          order.id,
          new Date(),
          executor,
        );
      }

      return null;
    }

    const payload = {
      type: "Entrada" as const,
      category: "RecebimentoPedido",
      description: `Recebimento ${order.orderNumber} - ${order.customerName}`,
      amountCents: order.paidAmountCents,
      paymentMethod: order.paymentMethod,
      transactionDate: new Date(`${order.orderDate}T12:00:00.000Z`),
      orderId: order.id,
      sourceType: "PedidoRecebimento",
      sourceId: order.id,
      isSystemGenerated: 1,
    };

    if (existing) {
      return this.cashTransactionsRepository.update(
        existing.id,
        {
          ...payload,
          updatedAt: new Date(),
        },
        executor,
      );
    }

    return this.cashTransactionsRepository.create(payload, executor);
  }

  async registerInventoryPurchaseExpense(
    input: {
      movementId: string;
      itemName: string;
      amountCents: number;
      paymentMethod: PaymentMethod;
    },
    executor: any,
  ) {
    if (input.amountCents <= 0) {
      return null;
    }

    return this.cashTransactionsRepository.create(
      {
        type: "Saida",
        category: "CompraEstoque",
        description: `Compra de estoque - ${input.itemName}`,
        amountCents: input.amountCents,
        paymentMethod: input.paymentMethod,
        transactionDate: new Date(),
        orderId: null,
        sourceType: "CompraEstoque",
        sourceId: input.movementId,
        isSystemGenerated: 1,
      },
      executor,
    );
  }

  private async normalizeInput(
    input: CreateCashTransactionInput | UpdateCashTransactionInput,
  ) {
    const category = input.category.trim();
    const description = input.description.trim();
    const amountCents = input.amountCents;
    const orderId = input.orderId?.trim() || null;
    const transactionDate = new Date(input.transactionDate);

    if (!category) {
      throw new HttpError(400, "Cash transaction category is required.");
    }

    if (!description) {
      throw new HttpError(400, "Cash transaction description is required.");
    }

    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new HttpError(400, "Cash transaction amountCents must be greater than zero.");
    }

    if (Number.isNaN(transactionDate.getTime())) {
      throw new HttpError(400, "Cash transaction transactionDate is invalid.");
    }

    if (orderId) {
      const order = await this.ordersRepository.findById(orderId);

      if (!order) {
        throw new HttpError(400, "Referenced order was not found.");
      }
    }

    return {
      type: input.type,
      category,
      description,
      amountCents,
      paymentMethod: input.paymentMethod,
      transactionDate,
      orderId,
      sourceType: null,
      sourceId: null,
      isSystemGenerated: 0,
    };
  }

  private mapCashTransaction(row: any): CashTransaction {
    return {
      id: row.id,
      type: row.type,
      category: row.category,
      description: row.description,
      amountCents: row.amountCents,
      paymentMethod: row.paymentMethod,
      transactionDate: row.transactionDate.toISOString(),
      orderId: row.orderId ?? null,
      sourceType: row.sourceType ?? null,
      sourceId: row.sourceId ?? null,
      isSystemGenerated: Boolean(row.isSystemGenerated),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      deletedAt: toIsoString(row.deletedAt),
    };
  }
}
