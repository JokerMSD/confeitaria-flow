import type {
  CreateDiscountCouponInput,
  DiscountCouponItem,
  UpdateDiscountCouponInput,
} from "@shared/types";
import { DiscountCouponsRepository } from "../repositories/discount-coupons.repository";
import { HttpError } from "../utils/http-error";

function normalizeCouponCode(code: string) {
  return code
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .slice(0, 64);
}

export class DiscountCouponsService {
  private readonly repository = new DiscountCouponsRepository();

  private mapItem(row: any): DiscountCouponItem {
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description ?? null,
      discountType: row.discountType,
      discountValue: row.discountValue,
      minimumOrderAmountCents: row.minimumOrderAmountCents,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      deletedAt: row.deletedAt?.toISOString() ?? null,
    };
  }

  async list(search?: string) {
    const rows = await this.repository.list(search);
    return rows.map((row: any) => this.mapItem(row));
  }

  async getById(id: string) {
    const row = await this.repository.findById(id);

    if (!row) {
      throw new HttpError(404, "Cupom nao encontrado.");
    }

    return this.mapItem(row);
  }

  async getByCode(code: string) {
    const normalizedCode = normalizeCouponCode(code);
    const row = await this.repository.findByCode(normalizedCode);

    if (!row) {
      throw new HttpError(404, "Cupom nao encontrado.");
    }

    return this.mapItem(row);
  }

  async create(input: CreateDiscountCouponInput) {
    const normalizedCode = normalizeCouponCode(input.code);
    const existing = await this.repository.findByCode(normalizedCode);

    if (existing) {
      throw new HttpError(400, "Ja existe um cupom com esse codigo.");
    }

    const row = await this.repository.create({
      code: normalizedCode,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minimumOrderAmountCents: Math.max(0, input.minimumOrderAmountCents ?? 0),
      isActive: input.isActive ?? true,
    });

    return this.mapItem(row);
  }

  async update(id: string, input: UpdateDiscountCouponInput) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new HttpError(404, "Cupom nao encontrado.");
    }

    const nextCode = input.code
      ? normalizeCouponCode(input.code)
      : existing.code;

    if (nextCode !== existing.code) {
      const duplicate = await this.repository.findByCode(nextCode);
      if (duplicate && duplicate.id !== id) {
        throw new HttpError(400, "Ja existe um cupom com esse codigo.");
      }
    }

    const row = await this.repository.update(id, {
      code: nextCode,
      title: input.title?.trim() ?? existing.title,
      description:
        input.description !== undefined
          ? input.description?.trim() || null
          : existing.description ?? null,
      discountType: input.discountType ?? existing.discountType,
      discountValue: input.discountValue ?? existing.discountValue,
      minimumOrderAmountCents:
        input.minimumOrderAmountCents ?? existing.minimumOrderAmountCents,
      isActive: input.isActive ?? existing.isActive,
      updatedAt: new Date(),
    });

    if (!row) {
      throw new HttpError(404, "Cupom nao encontrado.");
    }

    return this.mapItem(row);
  }
}
