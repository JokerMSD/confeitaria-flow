import Tesseract from "tesseract.js";
import type {
  ConfirmInventoryReceiptImportInput,
  InventoryReceiptImportAnalysis,
  InventoryReceiptImportInput,
} from "@shared/types";
import { withTransaction } from "../db/transaction";
import { InventoryItemsRepository } from "../repositories/inventory-items.repository";
import { InventoryMovementsService } from "./inventory-movements.service";
import { HttpError } from "../utils/http-error";
import { extractInventoryReceiptSuggestions } from "../domain/inventory/receipt-import-domain";

const maxReceiptImageBytes = 5 * 1024 * 1024;

function decodeBase64Image(contentBase64: string) {
  const buffer = Buffer.from(contentBase64, "base64");

  if (!buffer.length) {
    throw new HttpError(400, "A imagem da nota esta vazia.");
  }

  if (buffer.length > maxReceiptImageBytes) {
    throw new HttpError(400, "A imagem da nota excede 5 MB.");
  }

  return buffer;
}

export class InventoryReceiptImportService {
  private readonly inventoryItemsRepository = new InventoryItemsRepository();
  private readonly inventoryMovementsService = new InventoryMovementsService();

  async analyze(input: InventoryReceiptImportInput): Promise<InventoryReceiptImportAnalysis> {
    const buffer = decodeBase64Image(input.contentBase64);

    let extractedText = "";
    try {
      const result = await Tesseract.recognize(buffer, "por+eng");
      extractedText = result.data.text?.trim() ?? "";
    } catch (error) {
      throw new HttpError(
        400,
        error instanceof Error
          ? `Nao foi possivel ler a nota: ${error.message}`
          : "Nao foi possivel ler a nota.",
      );
    }

    if (!extractedText) {
      throw new HttpError(400, "Nao foi possivel extrair texto da nota.");
    }

    const items = await this.inventoryItemsRepository.list();
    const suggestionResult = extractInventoryReceiptSuggestions({
      text: extractedText,
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
      })),
    });

    return {
      extractedText,
      lines: suggestionResult.lines,
      skippedLineCount: suggestionResult.skippedLineCount,
    };
  }

  async confirm(input: ConfirmInventoryReceiptImportInput) {
    return withTransaction(async (tx) => {
      const movementIds: string[] = [];

      for (const line of input.lines) {
        const item = await this.inventoryItemsRepository.findById(line.itemId, tx);

        if (!item) {
          throw new HttpError(404, "Inventory item not found during receipt import.");
        }

        const purchaseAmountCents =
          line.totalAmountCents == null
            ? null
            : item.unit === "un" || item.unit === "caixa"
              ? Math.max(1, Math.round(line.totalAmountCents / line.quantity))
              : line.totalAmountCents;

        const movement = await this.inventoryMovementsService.createWithExecutor(
          {
            itemId: line.itemId,
            type: "Entrada",
            quantity: line.quantity,
            reason: `Compra importada de nota: ${line.rawText}`.slice(0, 240),
            reference:
              input.reference?.trim() ||
              `Nota importada: ${input.fileName}`.slice(0, 120),
            purchaseAmountCents,
            purchasePaymentMethod: input.registerCashExpense
              ? input.paymentMethod ?? null
              : null,
          },
          tx,
        );

        movementIds.push(movement.id);
      }

      return {
        importedCount: movementIds.length,
        movementIds,
      };
    });
  }
}
