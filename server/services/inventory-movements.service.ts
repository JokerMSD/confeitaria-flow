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

      const delta = this.resolveDelta(item.currentQuantity, normalized.type, normalized.quantity);

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
        },
        tx,
      );

      if (
        item.category === "Ingrediente" &&
        item.purchaseUnitCostCents != null &&
        item.purchaseUnitCostCents > 0 &&
        normalized.type === "Entrada"
      ) {
        await this.cashTransactionsService.registerInventoryPurchaseExpense(
          {
            movementId: createdMovement.id,
            itemName: item.name,
            amountCents: Math.round(normalized.quantity * item.purchaseUnitCostCents),
            paymentMethod:
              normalized.purchasePaymentMethod ?? "Pix",
          },
          tx,
        );
      } else if (
        normalized.purchaseAmountCents != null &&
        normalized.purchasePaymentMethod != null
      ) {
        await this.cashTransactionsService.registerInventoryPurchaseExpense(
          {
            movementId: createdMovement.id,
            itemName: item.name,
            amountCents: normalized.purchaseAmountCents,
            paymentMethod: normalized.purchasePaymentMethod,
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

    return {
      itemId: input.itemId,
      type: input.type,
      quantity: input.quantity,
      reason,
      reference,
      purchaseAmountCents: input.purchaseAmountCents ?? null,
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
      createdAt: row.createdAt.toISOString(),
    };
  }
}
