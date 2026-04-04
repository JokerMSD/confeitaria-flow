import type {
  AppliedDiscountCoupon,
  PublicCheckoutInput,
  PublicCheckoutPricingPreviewInput,
  PublicCheckoutResponse,
  PublicStoreFillingOption,
  PublicStoreHome,
  PublicStoreProductDetail,
  PublicStoreProductSummary,
} from "@shared/types";
import { HttpError } from "../utils/http-error";
import { getTodayOperationalDate } from "../utils/operational-date";
import { CustomerOrderSyncService } from "./customer-order-sync.service";
import { DiscountCouponsService } from "./discount-coupons.service";
import { OrdersService } from "./orders.service";
import { ProductAdditionalsService } from "./product-additionals.service";
import { RecipeMediaService } from "./recipe-media.service";
import { RecipesService } from "./recipes.service";
import { RecipesRepository } from "../repositories/recipes.repository";
import { ProductAdditionalGroupsRepository } from "../repositories/product-additional-groups.repository";

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

function toSummary(
  detail: Awaited<ReturnType<RecipesService["getById"]>>,
): PublicStoreProductSummary {
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

function fromMilli(value: number) {
  return Number(value) / 1000;
}

function toSummaryFromRow(
  row: any,
  additionalGroupCount: number,
  primaryImageUrl: string | null,
): PublicStoreProductSummary {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes ?? null,
    primaryImageUrl,
    outputQuantity: fromMilli(Number(row.outputQuantityMilli)),
    outputUnit: row.outputUnit,
    salePriceCents: row.salePriceCents == null ? null : Number(row.salePriceCents),
    effectiveSalePriceCents:
      row.salePriceCents == null ? null : Number(row.salePriceCents),
    additionalGroupCount,
  };
}

export class PublicStoreService {
  private readonly recipesService = new RecipesService();
  private readonly ordersService = new OrdersService();
  private readonly customerOrderSyncService = new CustomerOrderSyncService();
  private readonly discountCouponsService = new DiscountCouponsService();
  private readonly productAdditionalsService = new ProductAdditionalsService();
  private readonly recipeMediaService = new RecipeMediaService();
  private readonly recipesRepository = new RecipesRepository();
  private readonly productAdditionalGroupsRepository =
    new ProductAdditionalGroupsRepository();

  async getHome(): Promise<PublicStoreHome> {
    const products = await this.listProducts();

    return {
      generatedAt: new Date().toISOString(),
      featuredProducts: products.slice(0, 4),
      catalogCount: products.length,
    };
  }

  async listProducts(): Promise<PublicStoreProductSummary[]> {
    const products = await this.recipesRepository.list({ kind: "ProdutoVenda" });
    const productIds = (products as any[]).map((product) => product.id);
    const [mediaByRecipeId, additionalGroups] = await Promise.all([
      this.recipeMediaService.listByRecipeIds(productIds),
      this.productAdditionalGroupsRepository.listByProductRecipeIds(productIds),
    ]);

    const additionalGroupCountByProductId = new Map<string, number>();
    for (const group of additionalGroups as any[]) {
      additionalGroupCountByProductId.set(
        group.productRecipeId,
        (additionalGroupCountByProductId.get(group.productRecipeId) ?? 0) + 1,
      );
    }

    return (products as any[]).map((product) =>
      toSummaryFromRow(
        product,
        additionalGroupCountByProductId.get(product.id) ?? 0,
        (mediaByRecipeId.get(product.id) ?? []).find(
          (media) => !media.variationRecipeId,
        )?.fileUrl ?? null,
      ),
    );
  }

  async getProduct(id: string): Promise<PublicStoreProductDetail> {
    const product = await this.recipesService.getById(id);

    if (product.kind !== "ProdutoVenda") {
      throw new HttpError(404, "Produto nao encontrado.");
    }

    const fillingOptions = await this.listFillingOptions(product.id);
    const maxFillings =
      fillingOptions.length === 0
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

  async previewCheckout(input: PublicCheckoutPricingPreviewInput) {
    const preview = await this.buildCheckoutPreview(input);

    return {
      itemsSubtotalAmountCents: preview.itemsSubtotalAmountCents,
      deliveryFeeCents: preview.deliveryFeeCents,
      discountAmountCents: preview.discountAmountCents,
      subtotalAmountCents: preview.subtotalAmountCents,
      appliedCoupon: preview.appliedCoupon,
    };
  }

  async checkout(input: PublicCheckoutInput): Promise<PublicCheckoutResponse["data"]> {
    const pricingPreview = await this.buildCheckoutPreview({
      deliveryMode: input.deliveryMode,
      deliveryFeeCents: input.deliveryFeeCents ?? 0,
      couponCode: input.couponCode ?? null,
      items: input.items,
    });

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
      discount: pricingPreview.orderDiscount,
      notes: [input.notes?.trim(), "Checkout publico com Pix manual."]
        .filter(Boolean)
        .join("\n"),
      items: pricingPreview.resolvedItems.map((item) => ({
        recipeId: item.recipeId,
        productName: item.productName,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        fillingRecipeId: item.fillingRecipeId,
        secondaryFillingRecipeId: item.secondaryFillingRecipeId,
        tertiaryFillingRecipeId: item.tertiaryFillingRecipeId,
        position: item.position,
        additionals: item.additionals,
      })),
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: "Pix",
      paymentStatus: order.paymentStatus,
      itemsSubtotalAmountCents: order.itemsSubtotalAmountCents,
      discountAmountCents: order.discountAmountCents,
      appliedCoupon: pricingPreview.appliedCoupon,
      subtotalAmountCents: order.subtotalAmountCents,
      pixInstructions:
        "Pedido recebido. Envie o comprovante do Pix manual para confirmar o pagamento com a confeitaria.",
    };
  }

  private async buildCheckoutPreview(input: PublicCheckoutPricingPreviewInput) {
    const resolvedItems = await this.resolveCheckoutItems(input.items);
    const itemsSubtotalAmountCents = resolvedItems.reduce(
      (sum, item) => sum + item.lineTotalCents,
      0,
    );
    const deliveryFeeCents =
      input.deliveryMode === "Entrega"
        ? Math.max(0, input.deliveryFeeCents ?? 0)
        : 0;
    const grossAmountCents = itemsSubtotalAmountCents + deliveryFeeCents;
    const appliedCoupon = input.couponCode?.trim()
      ? await this.resolveCoupon(input.couponCode, grossAmountCents)
      : null;
    const discountAmountCents = appliedCoupon?.discountAmountCents ?? 0;

    return {
      resolvedItems,
      itemsSubtotalAmountCents,
      deliveryFeeCents,
      discountAmountCents,
      subtotalAmountCents: Math.max(0, grossAmountCents - discountAmountCents),
      appliedCoupon,
      orderDiscount: appliedCoupon
        ? {
            source: "Cupom" as const,
            type: appliedCoupon.discountType,
            value: appliedCoupon.discountValue,
            label: appliedCoupon.title,
            couponCode: appliedCoupon.code,
          }
        : null,
    };
  }

  private async resolveCheckoutItems(inputItems: PublicCheckoutInput["items"]) {
    return Promise.all(
      inputItems.map(async (item, index) => {
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

        const resolvedAdditionals =
          await this.productAdditionalsService.resolveOrderItemAdditionals(
            product.id,
            item.additionals,
          );

        return {
          recipeId: product.id,
          productName: buildPublicProductName(product.name, fillingNames),
          quantity: item.quantity,
          unitPriceCents,
          fillingRecipeId: uniqueFillingIds[0] ?? null,
          secondaryFillingRecipeId: uniqueFillingIds[1] ?? null,
          tertiaryFillingRecipeId: uniqueFillingIds[2] ?? null,
          position: index,
          additionals: (item.additionals ?? []).map((additional, additionalIndex) => ({
            ...additional,
            position: additional.position ?? additionalIndex,
          })),
          lineTotalCents:
            item.quantity *
            (unitPriceCents +
              resolvedAdditionals.reduce(
                (sum, additional) => sum + additional.priceDeltaCents,
                0,
              )),
        };
      }),
    );
  }

  private async resolveCoupon(
    couponCode: string,
    grossAmountCents: number,
  ): Promise<AppliedDiscountCoupon> {
    const coupon = await this.discountCouponsService.getByCode(couponCode);

    if (!coupon.isActive) {
      throw new HttpError(400, "Este cupom nao esta ativo.");
    }

    if (coupon.minimumOrderAmountCents > grossAmountCents) {
      throw new HttpError(
        400,
        "Este cupom exige um valor minimo maior para ser aplicado.",
      );
    }

    const discountAmountCents =
      coupon.discountType === "Percentual"
        ? Math.min(
            grossAmountCents,
            Math.round((grossAmountCents * coupon.discountValue) / 100),
          )
        : Math.min(grossAmountCents, coupon.discountValue);

    if (discountAmountCents <= 0) {
      throw new HttpError(400, "Este cupom nao gera desconto para esse pedido.");
    }

    return {
      id: coupon.id,
      code: coupon.code,
      title: coupon.title,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmountCents,
    };
  }

  private async listFillingOptions(
    productId: string,
  ): Promise<PublicStoreFillingOption[]> {
    const fillings = await this.recipesService.list({ kind: "Preparacao" });
    const globalMediaByRecipeId = await this.recipeMediaService.listByRecipeIds(
      fillings.map((filling) => filling.id),
    );
    const productMediaByRecipeId = await this.recipeMediaService.listByRecipeIds([
      productId,
    ]);
    const productVariationMedia = new Map(
      (productMediaByRecipeId.get(productId) ?? [])
        .filter((media) => media.variationRecipeId)
        .map((media) => [media.variationRecipeId as string, media]),
    );

    return fillings
      .map((filling) => ({
        id: filling.id,
        name: filling.name,
        photoUrl:
          productVariationMedia.get(filling.id)?.fileUrl ??
          globalMediaByRecipeId
            .get(filling.id)
            ?.find((media) => !media.variationRecipeId)?.fileUrl ??
          null,
        hasProductSpecificPhoto: productVariationMedia.has(filling.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
