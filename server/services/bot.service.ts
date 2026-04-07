import type {
  BotAvailabilityResponse,
  BotCheckoutLinkInput,
  BotCheckoutLinkResponse,
  BotOrderStatusLookupInput,
  BotOrderStatusLookupResponse,
  BotProductDetailResponse,
  BotStoreSummaryResponse,
} from "@shared/types";
import {
  type BotOrderStatusLookupRow,
  OrdersRepository,
} from "../repositories/orders.repository";
import { getPublicAppOrigin } from "../config";
import { PublicStoreService } from "./public-store.service";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export class BotService {
  private readonly publicStoreService = new PublicStoreService();
  private readonly ordersRepository = new OrdersRepository();

  private getAppOrigin() {
    return trimTrailingSlash(getPublicAppOrigin());
  }

  async getStoreSummary(): Promise<BotStoreSummaryResponse["data"]> {
    const products = await this.publicStoreService.listProducts();
    const appOrigin = this.getAppOrigin();

    return {
      generatedAt: new Date().toISOString(),
      storeName: "Universo Doce",
      catalogUrl: `${appOrigin}/loja/catalogo`,
      checkoutUrl: `${appOrigin}/loja/checkout`,
      featuredProducts: products.slice(0, 8).map((product) => ({
        id: product.id,
        name: product.name,
        notes: product.notes,
        priceFromCents: product.effectiveSalePriceCents ?? product.salePriceCents,
        productUrl: `${appOrigin}/loja/produtos/${product.id}`,
        additionalGroupCount: product.additionalGroupCount,
      })),
    };
  }

  async getProductDetail(id: string): Promise<BotProductDetailResponse["data"]> {
    const product = await this.publicStoreService.getProduct(id);
    const appOrigin = this.getAppOrigin();

    return {
      id: product.id,
      name: product.name,
      notes: product.notes,
      priceFromCents: product.effectiveSalePriceCents ?? product.salePriceCents,
      productUrl: `${appOrigin}/loja/produtos/${product.id}`,
      checkoutUrl: `${appOrigin}/loja/checkout`,
      fillingOptions: product.fillingOptions.map((option) => ({
        id: option.id,
        name: option.name,
      })),
      additionalGroups: product.additionalGroups.map((group) => ({
        id: group.id,
        name: group.name,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        options: group.options.map((option) => ({
          id: option.id,
          name: option.name,
          priceDeltaCents: option.priceDeltaCents,
        })),
      })),
    };
  }

  async getAvailability(input: {
    deliveryMode: "Entrega" | "Retirada";
    selectedDate?: string;
  }): Promise<BotAvailabilityResponse["data"]> {
    const availability = await this.publicStoreService.getAvailability(input);

    return {
      ...availability,
      checkoutUrl: `${this.getAppOrigin()}/loja/checkout`,
    };
  }

  async getOrderStatus(
    input: BotOrderStatusLookupInput,
  ): Promise<BotOrderStatusLookupResponse["data"]> {
    const rows = await this.ordersRepository.listBotStatusRows({
      customerPhoneDigits: input.customerPhone,
      orderNumber: input.orderNumber ?? null,
      limit: input.limit ?? 5,
    });

    return {
      generatedAt: new Date().toISOString(),
      matchCount: rows.length,
      orders: rows.map((row: BotOrderStatusLookupRow) => ({
        id: row.id,
        orderNumber: row.orderNumber,
        customerName: row.customerName,
        deliveryDate: row.deliveryDate,
        deliveryTime: row.deliveryTime,
        deliveryMode: row.deliveryMode,
        status: row.status,
        paymentStatus: row.paymentStatus,
        subtotalAmountCents: row.subtotalAmountCents,
        itemSummary: row.itemSummary ?? "Sem itens listados",
      })),
    };
  }

  async getCheckoutLink(
    input: BotCheckoutLinkInput,
  ): Promise<BotCheckoutLinkResponse["data"]> {
    const appOrigin = this.getAppOrigin();

    if (input.productId) {
      await this.publicStoreService.getProduct(input.productId);

      return {
        generatedAt: new Date().toISOString(),
        target: "product",
        url: `${appOrigin}/loja/produtos/${input.productId}`,
        message:
          "Abra o produto para escolher sabores, adicionais e depois seguir para o checkout.",
      };
    }

    return {
      generatedAt: new Date().toISOString(),
      target: "catalog",
      url: `${appOrigin}/loja/catalogo`,
      message:
        "Abra o catalogo para escolher o produto e seguir para o checkout publico.",
    };
  }
}
