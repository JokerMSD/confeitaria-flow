import type {
  CreateInventoryItemInput,
  InventoryItem,
  ListInventoryItemsFilters,
  UpdateInventoryItemInput,
} from "@shared/types";
import { withTransaction } from "../db/transaction";
import { InventoryItemsRepository } from "../repositories/inventory-items.repository";
import { InventoryMovementsRepository } from "../repositories/inventory-movements.repository";
import { HttpError } from "../utils/http-error";

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

export class InventoryItemsService {
  private readonly inventoryItemsRepository = new InventoryItemsRepository();
  private readonly inventoryMovementsRepository =
    new InventoryMovementsRepository();

  async list(filters: ListInventoryItemsFilters) {
    const rows = await this.inventoryItemsRepository.list(filters);
    return rows.map((row: any) => this.mapInventoryItem(row));
  }

  async getById(id: string) {
    const row = await this.inventoryItemsRepository.findById(id);

    if (!row) {
      throw new HttpError(404, "Inventory item not found.");
    }

    return this.mapInventoryItem(row);
  }

  async create(input: CreateInventoryItemInput) {
    const normalized = this.normalizeInput(input);

    return withTransaction<InventoryItem>(async (tx) => {
      const created = await this.inventoryItemsRepository.create(normalized, tx);

      if (normalized.currentQuantity > 0) {
        await this.inventoryMovementsRepository.create(
          {
            itemId: created.id,
            type: "Ajuste",
            quantity: normalized.currentQuantity,
            reason: "Saldo inicial do item",
            reference: `inventory-item:create:${created.id}`,
          },
          tx,
        );
      }

      return this.mapInventoryItem(created);
    });
  }

  async update(id: string, input: UpdateInventoryItemInput) {
    const normalized = this.normalizeInput(input);

    return withTransaction<InventoryItem>(async (tx) => {
      const existing = await this.inventoryItemsRepository.findById(id, tx);

      if (!existing) {
        throw new HttpError(404, "Inventory item not found.");
      }

      const updated = await this.inventoryItemsRepository.updateMetadata(
        id,
        {
          name: normalized.name,
          category: normalized.category,
          minQuantity: normalized.minQuantity,
          unit: normalized.unit,
          recipeEquivalentQuantity: normalized.recipeEquivalentQuantity,
          recipeEquivalentUnit: normalized.recipeEquivalentUnit,
          purchaseUnitCostCents: normalized.purchaseUnitCostCents,
          notes: normalized.notes,
          updatedAt: new Date(),
        },
        tx,
      );

      if (!updated) {
        throw new HttpError(404, "Inventory item not found.");
      }

      const delta = normalized.currentQuantity - existing.currentQuantity;

      if (delta !== 0) {
        const stockUpdated = await this.inventoryItemsRepository.applyQuantityDelta(
          id,
          delta,
          new Date(),
          tx,
        );

        if (!stockUpdated) {
          throw new HttpError(400, "Inventory item quantity would become negative.");
        }

        await this.inventoryMovementsRepository.create(
          {
            itemId: id,
            type: "Ajuste",
            quantity: delta,
            reason: "Ajuste automático do item",
            reference: `inventory-item:update:${id}`,
          },
          tx,
        );
      }

      const row = delta !== 0 ? await this.inventoryItemsRepository.findById(id, tx) : updated;

      if (!row) {
        throw new HttpError(404, "Inventory item not found.");
      }

      return this.mapInventoryItem(row);
    });
  }

  async remove(id: string) {
    const deletedAt = new Date();
    const deleted = await this.inventoryItemsRepository.markDeleted(id, deletedAt);

    if (!deleted) {
      throw new HttpError(404, "Inventory item not found.");
    }

    return {
      id: deleted.id,
      deletedAt: deletedAt.toISOString(),
    };
  }

  private normalizeInput(
    input: CreateInventoryItemInput | UpdateInventoryItemInput,
  ) {
    const name = input.name.trim();
    const notes = input.notes?.trim() || null;

    if (!name) {
      throw new HttpError(400, "Inventory item name is required.");
    }

    if (!Number.isFinite(input.currentQuantity) || input.currentQuantity < 0) {
      throw new HttpError(400, "Inventory item currentQuantity must be non-negative.");
    }

    if (!Number.isFinite(input.minQuantity) || input.minQuantity < 0) {
      throw new HttpError(400, "Inventory item minQuantity must be non-negative.");
    }

    return {
      name,
      category: input.category,
      currentQuantity: input.currentQuantity,
      minQuantity: input.minQuantity,
      unit: input.unit,
      recipeEquivalentQuantity:
        input.category === "Ingrediente"
          ? input.recipeEquivalentQuantity ?? null
          : null,
      recipeEquivalentUnit:
        input.category === "Ingrediente"
          ? input.recipeEquivalentUnit ?? null
          : null,
      purchaseUnitCostCents:
        input.category === "Ingrediente"
          ? input.purchaseUnitCostCents ?? null
          : null,
      notes,
    };
  }

  private mapInventoryItem(row: any): InventoryItem {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      currentQuantity: Number(row.currentQuantity),
      minQuantity: Number(row.minQuantity),
      unit: row.unit,
      recipeEquivalentQuantity:
        row.recipeEquivalentQuantity == null
          ? null
          : Number(row.recipeEquivalentQuantity),
      recipeEquivalentUnit: row.recipeEquivalentUnit ?? null,
      purchaseUnitCostCents:
        row.purchaseUnitCostCents == null ? null : Number(row.purchaseUnitCostCents),
      notes: row.notes ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      deletedAt: toIsoString(row.deletedAt),
    };
  }
}
