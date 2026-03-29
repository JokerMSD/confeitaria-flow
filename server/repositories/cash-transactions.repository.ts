import {
  and,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import { getDb } from "../db";
import { cashTransactions } from "@shared/schema";
import type {
  CashTransactionType,
  ListCashTransactionsFilters,
  PaymentMethod,
} from "@shared/types";

type Executor = ReturnType<typeof getDb> | any;

export interface CashTransactionRowInsert {
  type: CashTransactionType;
  category: string;
  description: string;
  amountCents: number;
  paymentMethod: PaymentMethod;
  transactionDate: Date;
  orderId: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  isSystemGenerated?: number;
}

export interface CashTransactionRowUpdate extends CashTransactionRowInsert {
  updatedAt: Date;
}

export class CashTransactionsRepository {
  async list(
    filters: ListCashTransactionsFilters = {},
    executor: Executor = getDb(),
  ) {
    const conditions = [isNull(cashTransactions.deletedAt)];

    if (filters.type) {
      conditions.push(eq(cashTransactions.type, filters.type));
    }

    if (filters.category) {
      conditions.push(eq(cashTransactions.category, filters.category));
    }

    if (filters.paymentMethod) {
      conditions.push(eq(cashTransactions.paymentMethod, filters.paymentMethod));
    }

    if (filters.search) {
      conditions.push(
        ilike(cashTransactions.description, `%${filters.search}%`),
      );
    }

    if (filters.dateFrom) {
      conditions.push(
        gte(sql`date(${cashTransactions.transactionDate})`, filters.dateFrom),
      );
    }

    if (filters.dateTo) {
      conditions.push(
        lte(sql`date(${cashTransactions.transactionDate})`, filters.dateTo),
      );
    }

    return executor
      .select()
      .from(cashTransactions)
      .where(and(...conditions))
      .orderBy(desc(cashTransactions.transactionDate), desc(cashTransactions.createdAt));
  }

  async findById(id: string, executor: Executor = getDb()) {
    const [transaction] = await executor
      .select()
      .from(cashTransactions)
      .where(and(eq(cashTransactions.id, id), isNull(cashTransactions.deletedAt)))
      .limit(1);

    return transaction ?? null;
  }

  async findBySource(
    sourceType: string,
    sourceId: string,
    executor: Executor = getDb(),
  ) {
    const [transaction] = await executor
      .select()
      .from(cashTransactions)
      .where(
        and(
          eq(cashTransactions.sourceType, sourceType),
          eq(cashTransactions.sourceId, sourceId),
          isNull(cashTransactions.deletedAt),
        ),
      )
      .limit(1);

    return transaction ?? null;
  }

  async create(data: CashTransactionRowInsert, executor: Executor = getDb()) {
    const [transaction] = await executor
      .insert(cashTransactions)
      .values(data)
      .returning();

    return transaction;
  }

  async update(
    id: string,
    data: CashTransactionRowUpdate,
    executor: Executor = getDb(),
  ) {
    const [transaction] = await executor
      .update(cashTransactions)
      .set(data)
      .where(and(eq(cashTransactions.id, id), isNull(cashTransactions.deletedAt)))
      .returning();

    return transaction ?? null;
  }

  async markDeleted(
    id: string,
    deletedAt: Date,
    executor: Executor = getDb(),
  ) {
    const [transaction] = await executor
      .update(cashTransactions)
      .set({
        deletedAt,
        updatedAt: deletedAt,
      })
      .where(and(eq(cashTransactions.id, id), isNull(cashTransactions.deletedAt)))
      .returning();

    return transaction ?? null;
  }

  async markDeletedBySource(
    sourceType: string,
    sourceId: string,
    deletedAt: Date,
    executor: Executor = getDb(),
  ) {
    const [transaction] = await executor
      .update(cashTransactions)
      .set({
        deletedAt,
        updatedAt: deletedAt,
      })
      .where(
        and(
          eq(cashTransactions.sourceType, sourceType),
          eq(cashTransactions.sourceId, sourceId),
          isNull(cashTransactions.deletedAt),
        ),
      )
      .returning();

    return transaction ?? null;
  }
}
