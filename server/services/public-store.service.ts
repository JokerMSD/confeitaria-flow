import type {
  PublicCheckoutInput,
  PublicCheckoutResponse,
  PublicStoreHome,
  PublicStoreProductDetail,
  PublicStoreProductSummary,
} from "@shared/types";
import { HttpError } from "../utils/http-error";
import { getTodayOperationalDate } from "../utils/operational-date";
import { CustomerOrderSyncService } from "./customer-order-sync.service";
import { OrdersService } from "./orders.service";
import { RecipesService } from "./recipes.service";

function toSummary(detail: Awaited<ReturnType<RecipesService["getById"]>>): PublicStoreProductSummary {
  return {
    id: detail.id,
    name: detail.name,
    notes: detail.notes,
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

    return {
      ...toSummary(product),
      additionalGroups: product.additionalGroups,
    };
  }

  async checkout(input: PublicCheckoutInput): Promise<PublicCheckoutResponse["data"]> {
    const resolvedItems = await Promise.all(
      input.items.map(async (item, index) => {
        const product = await this.getProduct(item.recipeId);
        const unitPriceCents =
          product.effectiveSalePriceCents ?? product.salePriceCents ?? 0;

        return {
          recipeId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPriceCents,
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
}
