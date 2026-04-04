import type {
  PublicCheckoutInput,
  PublicCheckoutResponse,
  PublicStoreFillingOption,
  PublicStoreHome,
  PublicStoreProductDetail,
  PublicStoreProductSummary,
} from "@shared/types";
import { HttpError } from "../utils/http-error";
import { getTodayOperationalDate } from "../utils/operational-date";
import { CustomerOrderSyncService } from "./customer-order-sync.service";
import { OrdersService } from "./orders.service";
import { RecipeMediaService } from "./recipe-media.service";
import { RecipesService } from "./recipes.service";

function normalizeValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function supportsMultipleFillings(productName: string) {
  const normalized = normalizeValue(productName);
  return (
    normalized.includes("ovo de colher") ||
    normalized.includes("ovo trufado") ||
    normalized.includes("ovo de pascoa recheado")
  );
}

function buildPublicProductName(productName: string, fillingNames: string[]) {
  return fillingNames.length > 0
    ? `${productName} - ${fillingNames.join(" / ")}`
    : productName;
}

function toSummary(detail: Awaited<ReturnType<RecipesService["getById"]>>): PublicStoreProductSummary {
  return {
    id: detail.id,
    name: detail.name,
    notes: detail.notes,
    primaryImageUrl: detail.media[0]?.fileUrl ?? null,
    outputQuantity: detail.outputQuantity,
    outputUnit: detail.outputUnit,
    salePriceCents: detail.salePriceCents,
    effectiveSalePriceCents: detail.effectiveSalePriceCents,
    additionalGroupCount: detail.additionalGroups.length,
  };
}

export class PublicStoreService {
  private readonly recipesService = new RecipesService();
  private readonly ordersService = new OrdersService();
  private readonly customerOrderSyncService = new CustomerOrderSyncService();
  private readonly recipeMediaService = new RecipeMediaService();

  async getHome(): Promise<PublicStoreHome> {
    const products = await this.listProducts();

    return {
      generatedAt: new Date().toISOString(),
      featuredProducts: products.slice(0, 4),
      catalogCount: products.length,
    };
  }

  async listProducts(): Promise<PublicStoreProductSummary[]> {
    const products = await this.recipesService.list({ kind: "ProdutoVenda" });
    return products.map((product) => toSummary(product));
  }

  async getProduct(id: string): Promise<PublicStoreProductDetail> {
    const product = await this.recipesService.getById(id);

    if (product.kind !== "ProdutoVenda") {
      throw new HttpError(404, "Produto não encontrado.");
    }

    const fillingOptions = await this.listFillingOptions();
    const maxFillings = fillingOptions.length === 0
      ? 0
      : supportsMultipleFillings(product.name)
        ? 3
        : 1;

    return {
      ...toSummary(product),
      imageUrls: product.media.map((media) => media.fileUrl),
      fillingOptions,
      minFillings: maxFillings > 0 ? 1 : 0,
      maxFillings,
      additionalGroups: product.additionalGroups,
    };
  }

  async checkout(input: PublicCheckoutInput): Promise<PublicCheckoutResponse["data"]> {
    const resolvedItems = await Promise.all(
      input.items.map(async (item, index) => {
        const product = await this.getProduct(item.recipeId);
        const unitPriceCents =
          product.effectiveSalePriceCents ?? product.salePriceCents ?? 0;
        const fillingIds = [
          item.fillingRecipeId,
          item.secondaryFillingRecipeId,
          item.tertiaryFillingRecipeId,
        ].filter((value): value is string => Boolean(value));
        const uniqueFillingIds = Array.from(new Set(fillingIds));

        if (uniqueFillingIds.length < product.minFillings) {
          throw new HttpError(
            400,
            `Selecione pelo menos ${product.minFillings} sabor(es) para o item "${product.name}".`,
          );
        }

        if (uniqueFillingIds.length > product.maxFillings) {
          throw new HttpError(
            400,
            `O item "${product.name}" aceita no maximo ${product.maxFillings} sabor(es).`,
          );
        }

        const fillingMap = new Map(
          product.fillingOptions.map((option) => [option.id, option]),
        );
        const fillingNames = uniqueFillingIds.map((id) => {
          const filling = fillingMap.get(id);

          if (!filling) {
            throw new HttpError(
              400,
              `O sabor selecionado nao esta disponivel para o item "${product.name}".`,
            );
          }

          return filling.name;
        });

        return {
          recipeId: product.id,
          productName: buildPublicProductName(product.name, fillingNames),
          quantity: item.quantity,
          unitPriceCents,
          fillingRecipeId: uniqueFillingIds[0] ?? null,
          secondaryFillingRecipeId: uniqueFillingIds[1] ?? null,
          tertiaryFillingRecipeId: uniqueFillingIds[2] ?? null,
          position: index,
          additionals: item.additionals ?? [],
        };
      }),
    );

    const customer = await this.customerOrderSyncService.ensureCustomerForContact(
      input.customerName,
      input.customerPhone,
    );

    const order = await this.ordersService.create({
      customerId: customer.id,
      customerName: input.customerName,
      customerPhone: input.customerPhone ?? null,
      orderDate: getTodayOperationalDate(),
      deliveryDate: input.deliveryDate,
      deliveryTime: input.deliveryTime ?? null,
      deliveryMode: input.deliveryMode,
      deliveryAddress: input.deliveryAddress ?? null,
      deliveryReference: input.deliveryReference ?? null,
      deliveryDistrict: input.deliveryDistrict ?? null,
      deliveryFeeCents: input.deliveryFeeCents ?? 0,
      status: "Confirmado",
      paymentMethod: "Pix",
      paidAmountCents: 0,
      notes: [input.notes?.trim(), "Checkout público com Pix manual."]
        .filter(Boolean)
        .join("\n"),
      items: resolvedItems,
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: "Pix",
      paymentStatus: order.paymentStatus,
      subtotalAmountCents: order.subtotalAmountCents,
      pixInstructions:
        "Pedido recebido. Envie o comprovante do Pix manual para confirmar o pagamento com a confeitaria.",
    };
  }

  private async listFillingOptions(): Promise<PublicStoreFillingOption[]> {
    const fillings = await this.recipesService.list({ kind: "Preparacao" });
    const mediaByRecipeId = await this.recipeMediaService.listByRecipeIds(
      fillings.map((filling) => filling.id),
    );

    return fillings
      .map((filling) => ({
        id: filling.id,
        name: filling.name,
        photoUrl: mediaByRecipeId.get(filling.id)?.[0]?.fileUrl ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
