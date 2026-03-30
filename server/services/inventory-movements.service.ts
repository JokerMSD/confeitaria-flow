import type {
  CreateInventoryMovementInput,
  InventoryMovement,
  ListInventoryMovementsFilters,
} from "@shared/types";
import { withTransaction } from "../db/transaction";
import { HttpError } from "../utils/http-error";
import { InventoryItemsRepository } from "../repositories/inventory-items.repository";
import { InventoryMovementsRepository } from "../repositories/inventory-movements.repository";
import { CashTransactionsService } from "./cash-transactions.service";

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

function isUnitPurchase(unit: string) {
  return unit === "un" || unit === "caixa";
}

export class InventoryMovementsService {
  private readonly inventoryItemsRepository = new InventoryItemsRepository();
  private readonly inventoryMovementsRepository =
    new InventoryMovementsRepository();
  private readonly cashTransactionsService = new CashTransactionsService();

  async list(filters: ListInventoryMovementsFilters) {
    const rows = await this.inventoryMovementsRepository.list(filters);
    return rows.map((row: any) => this.mapInventoryMovement(row));
  }

  async getById(id: string) {
    const row = await this.inventoryMovementsRepository.findById(id);

    if (!row) {
      throw new HttpError(404, "Inventory movement not found.");
    }

    return this.mapInventoryMovement(row);
  }

  async create(input: CreateInventoryMovementInput) {
    const normalized = this.normalizeInput(input);

    return withTransaction<InventoryMovement>(async (tx) => {
      const item = await this.inventoryItemsRepository.findById(
        normalized.itemId,
        tx,
      );

      if (!item) {
        throw new HttpError(404, "Inventory item not found.");
      }

      if (
        normalized.purchaseEquivalentQuantity != null &&
        (item.category !== "Ingrediente" ||
          item.recipeEquivalentUnit == null ||
          (item.unit !== "un" && item.unit !== "caixa"))
      ) {
        throw new HttpError(
          400,
          "Only unit-based ingredients with recipe equivalence can record purchase yield.",
        );
      }

      const delta = this.resolveDelta(item.currentQuantity, normalized.type, normalized.quantity);
      const effectivePurchaseAmountCents =
        normalized.purchaseAmountCents != null && isUnitPurchase(item.unit)
          ? Math.round(normalized.purchaseAmountCents * normalized.quantity)
          : normalized.purchaseAmountCents;
      const purchaseCashAmountCents =
        normalized.purchasePaymentMethod != null &&
        effectivePurchaseAmountCents != null
          ? effectivePurchaseAmountCents
          : null;

      if (delta === 0) {
        throw new HttpError(400, "Inventory movement must change the item quantity.");
      }

      const updatedItem = await this.inventoryItemsRepository.applyQuantityDelta(
        item.id,
        delta,
        new Date(),
        tx,
      );

      if (!updatedItem) {
        throw new HttpError(400, "Inventory movement would make the stock negative.");
      }

      const createdMovement = await this.inventoryMovementsRepository.create(
        {
          itemId: item.id,
          type: normalized.type,
          quantity: delta,
          reason: normalized.reason,
          reference: normalized.reference,
          purchaseAmountCents: effectivePurchaseAmountCents,
          purchaseEquivalentQuantity: normalized.purchaseEquivalentQuantity,
          purchaseEquivalentUnit:
            normalized.purchaseEquivalentQuantity != null
              ? item.recipeEquivalentUnit ?? null
              : null,
          sourceType: null,
          sourceId: null,
          isSystemGenerated: false,
        },
        tx,
      );

      if (
        normalized.type === "Entrada" &&
        purchaseCashAmountCents != null &&
        normalized.purchasePaymentMethod != null
      ) {
        await this.cashTransactionsService.registerInventoryPurchaseExpense(
          {
            movementId: createdMovement.id,
            itemName: item.name,
            quantity: normalized.quantity,
            unit: item.unit,
            amountCents: purchaseCashAmountCents,
            paymentMethod: normalized.purchasePaymentMethod,
          },
          tx,
        );
      } else if (
        item.category === "Ingrediente" &&
        item.purchaseUnitCostCents != null &&
        item.purchaseUnitCostCents > 0 &&
        normalized.type === "Entrada"
      ) {
        await this.cashTransactionsService.registerInventoryPurchaseExpense(
          {
            movementId: createdMovement.id,
            itemName: item.name,
            quantity: normalized.quantity,
            unit: item.unit,
            amountCents: Math.round(normalized.quantity * item.purchaseUnitCostCents),
            paymentMethod: "Pix",
          },
          tx,
        );
      }

      if (
        item.category === "Ingrediente" &&
        normalized.type === "Entrada" &&
        (effectivePurchaseAmountCents != null ||
          normalized.purchaseEquivalentQuantity != null)
      ) {
        const pricingAccumulatedQuantity =
          effectivePurchaseAmountCents != null
            ? (item.pricingAccumulatedQuantity == null
                ? 0
                : Number(item.pricingAccumulatedQuantity)) + normalized.quantity
            : item.pricingAccumulatedQuantity == null
              ? 0
              : Number(item.pricingAccumulatedQuantity);
        const pricingAccumulatedCostCents =
          effectivePurchaseAmountCents != null
            ? (item.pricingAccumulatedCostCents == null
                ? 0
                : Number(item.pricingAccumulatedCostCents)) + effectivePurchaseAmountCents
            : item.pricingAccumulatedCostCents == null
              ? 0
              : Number(item.pricingAccumulatedCostCents);

        const equivalentAccumulatedBaseQuantity =
          normalized.purchaseEquivalentQuantity != null
            ? (item.equivalentAccumulatedBaseQuantity == null
                ? 0
                : Number(item.equivalentAccumulatedBaseQuantity)) + normalized.quantity
            : item.equivalentAccumulatedBaseQuantity == null
              ? 0
              : Number(item.equivalentAccumulatedBaseQuantity);
        const equivalentAccumulatedQuantity =
          normalized.purchaseEquivalentQuantity != null
            ? (item.equivalentAccumulatedQuantity == null
                ? 0
                : Number(item.equivalentAccumulatedQuantity)) +
              normalized.purchaseEquivalentQuantity
            : item.equivalentAccumulatedQuantity == null
              ? 0
              : Number(item.equivalentAccumulatedQuantity);

        await this.inventoryItemsRepository.updatePurchaseMetrics(
          item.id,
          {
            recipeEquivalentQuantity:
              equivalentAccumulatedBaseQuantity > 0
                ? equivalentAccumulatedQuantity / equivalentAccumulatedBaseQuantity
                : item.recipeEquivalentQuantity == null
                  ? null
                  : Number(item.recipeEquivalentQuantity),
            purchaseUnitCostCents:
              pricingAccumulatedQuantity > 0
                ? Math.round(pricingAccumulatedCostCents / pricingAccumulatedQuantity)
                : item.purchaseUnitCostCents == null
                  ? null
                  : Number(item.purchaseUnitCostCents),
            pricingAccumulatedQuantity,
            pricingAccumulatedCostCents,
            equivalentAccumulatedQuantity,
            equivalentAccumulatedBaseQuantity,
            updatedAt: new Date(),
          },
          tx,
        );
      }

      return this.mapInventoryMovement(createdMovement);
    });
  }

  async createAutomaticAdjustment(
    itemId: string,
    delta: number,
    reason: string,
    reference: string | null,
    executor: any,
  ) {
    if (delta === 0) {
      return null;
    }

    return this.inventoryMovementsRepository.create(
      {
        itemId,
        type: "Ajuste",
        quantity: delta,
        reason,
        reference,
        sourceType: null,
        sourceId: null,
        isSystemGenerated: false,
      },
      executor,
    );
  }

  private normalizeInput(input: CreateInventoryMovementInput) {
    const reason = input.reason.trim();
    const reference = input.reference?.trim() || null;

    if (!reason) {
      throw new HttpError(400, "Inventory movement reason is required.");
    }

    if (!Number.isFinite(input.quantity) || input.quantity < 0) {
      throw new HttpError(400, "Inventory movement quantity must be non-negative.");
    }

    if (input.type !== "Ajuste" && input.quantity <= 0) {
      throw new HttpError(400, "Inventory movement quantity must be greater than zero.");
    }

    if (
      (input.purchaseAmountCents == null) !==
      (input.purchasePaymentMethod == null)
    ) {
      throw new HttpError(
        400,
        "Inventory purchase amount and payment method must be provided together.",
      );
    }

    if (input.purchaseAmountCents != null && input.purchaseAmountCents <= 0) {
      throw new HttpError(
        400,
        "Inventory purchase amount must be greater than zero.",
      );
    }

    if (input.purchaseAmountCents != null && input.type !== "Entrada") {
      throw new HttpError(
        400,
        "Inventory purchase cash integration is only available for stock entries.",
      );
    }

    if (input.purchaseEquivalentQuantity != null && input.type !== "Entrada") {
      throw new HttpError(
        400,
        "Inventory purchase equivalent quantity is only available for stock entries.",
      );
    }

    return {
      itemId: input.itemId,
      type: input.type,
      quantity: input.quantity,
      reason,
      reference,
      purchaseAmountCents: input.purchaseAmountCents ?? null,
      purchaseEquivalentQuantity: input.purchaseEquivalentQuantity ?? null,
      purchasePaymentMethod: input.purchasePaymentMethod ?? null,
    };
  }

  private resolveDelta(
    currentQuantity: number,
    type: CreateInventoryMovementInput["type"],
    quantity: number,
  ) {
    if (type === "Entrada") {
      return quantity;
    }

    if (type === "Saida") {
      return -quantity;
    }

    return quantity - currentQuantity;
  }

  private mapInventoryMovement(row: any): InventoryMovement {
    return {
      id: row.id,
      itemId: row.itemId,
      type: row.type,
      quantity: Number(row.quantity),
      reason: row.reason,
      reference: row.reference ?? null,
      sourceType: row.sourceType ?? null,
      sourceId: row.sourceId ?? null,
      isSystemGenerated: Boolean(row.isSystemGenerated),
      createdAt: row.createdAt.toISOString(),
    };
  }
}
