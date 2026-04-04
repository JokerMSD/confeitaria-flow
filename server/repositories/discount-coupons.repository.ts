import { and, asc, eq, ilike, isNull } from "drizzle-orm";
import { discountCoupons } from "@shared/schema";
import { getDb } from "../db";

type Executor = ReturnType<typeof getDb> | any;

export interface DiscountCouponRowInsert {
  code: string;
  title: string;
  description: string | null;
  discountType: "Percentual" | "ValorFixo";
  discountValue: number;
  minimumOrderAmountCents: number;
  isActive: boolean;
}

export interface DiscountCouponRowUpdate extends DiscountCouponRowInsert {
  updatedAt: Date;
}

export class DiscountCouponsRepository {
  async list(search?: string, executor: Executor = getDb()) {
    const conditions: any[] = [isNull(discountCoupons.deletedAt)];

    if (search?.trim()) {
      const query = `%${search.trim()}%`;
      conditions.push(ilike(discountCoupons.code, query));
    }

    return executor
      .select()
      .from(discountCoupons)
      .where(and(...conditions))
      .orderBy(asc(discountCoupons.code), asc(discountCoupons.createdAt));
  }

  async findById(id: string, executor: Executor = getDb()) {
    const [row] = await executor
      .select()
      .from(discountCoupons)
      .where(and(eq(discountCoupons.id, id), isNull(discountCoupons.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findByCode(code: string, executor: Executor = getDb()) {
    const [row] = await executor
      .select()
      .from(discountCoupons)
      .where(
        and(
          eq(discountCoupons.code, code),
          isNull(discountCoupons.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async create(data: DiscountCouponRowInsert, executor: Executor = getDb()) {
    const [row] = await executor.insert(discountCoupons).values(data).returning();
    return row;
  }

  async update(
    id: string,
    data: DiscountCouponRowUpdate,
    executor: Executor = getDb(),
  ) {
    const [row] = await executor
      .update(discountCoupons)
      .set(data)
      .where(and(eq(discountCoupons.id, id), isNull(discountCoupons.deletedAt)))
      .returning();

    return row ?? null;
  }
}
