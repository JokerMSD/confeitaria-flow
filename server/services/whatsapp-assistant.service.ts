import type {
  CreateOrderInput,
  PublicStoreProductDetail,
  PublicStoreProductSummary,
  WhatsAppAssistantCatalogItem,
  WhatsAppAssistantCustomer,
  WhatsAppAssistantCustomerUpsertInput,
  WhatsAppAssistantDraftConfirmInput,
  WhatsAppAssistantDraftOrder,
  WhatsAppAssistantDraftUpsertInput,
  WhatsAppAssistantOrderSummary,
  WhatsAppAssistantSessionStatus,
} from "@shared/types";
import { HttpError } from "../utils/http-error";
import { getTodayOperationalDate } from "../utils/operational-date";
import { CustomersRepository } from "../repositories/customers.repository";
import { OrdersRepository } from "../repositories/orders.repository";
import { WhatsAppCustomersRepository } from "../repositories/whatsapp-customers.repository";
import { WhatsAppOrderDraftsRepository } from "../repositories/whatsapp-order-drafts.repository";
import { OrdersService } from "./orders.service";
import { PublicStoreService } from "./public-store.service";

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").trim();
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.replace(/\s+/g, " ").trim() ?? "";
  return normalized || null;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function classifyCatalogCategory(productName: string) {
  const normalized = normalizeSearch(productName);

  if (normalized.includes("ovo")) return "Ovos";
  if (normalized.includes("barra")) return "Barras";
  if (normalized.includes("bolo")) return "Bolos";
  if (normalized.includes("trufa")) return "Trufas";
  return "Doces";
}

function getProductPriceCents(product: PublicStoreProductSummary) {
  return product.effectiveSalePriceCents ?? product.salePriceCents ?? 0;
}

function formatCustomerName(customer: {
  firstName: string;
  lastName: string;
} | null) {
  if (!customer) {
    return null;
  }

  return `${customer.firstName} ${customer.lastName}`.trim();
}

function mergePartialText(
  previous: string | null | undefined,
  next: string | undefined,
) {
  const normalized = normalizeText(next);
  return normalized ?? previous ?? null;
}

export class WhatsAppAssistantService {
  private readonly customersRepository = new CustomersRepository();
  private readonly ordersRepository = new OrdersRepository();
  private readonly whatsappCustomersRepository =
    new WhatsAppCustomersRepository();
  private readonly whatsappOrderDraftsRepository =
    new WhatsAppOrderDraftsRepository();
  private readonly publicStoreService = new PublicStoreService();
  private readonly ordersService = new OrdersService();

  async getCustomerByPhone(phone: string): Promise<WhatsAppAssistantCustomer | null> {
    const phoneDigits = this.assertPhone(phone);
    const [whatsappCustomer, directCustomer] = await Promise.all([
      this.whatsappCustomersRepository.findByPhone(phoneDigits),
      this.customersRepository.findByPhoneDigits(phoneDigits),
    ]);

    const linkedCustomer =
      directCustomer ??
      (whatsappCustomer?.linkedCustomerId
        ? await this.customersRepository.findById(
            whatsappCustomer.linkedCustomerId,
          )
        : null);

    if (!whatsappCustomer && !linkedCustomer) {
      return null;
    }

    return {
      whatsappCustomerId: whatsappCustomer?.id ?? null,
      customerId: linkedCustomer?.id ?? whatsappCustomer?.linkedCustomerId ?? null,
      phone: phoneDigits,
      name: whatsappCustomer?.name ?? formatCustomerName(linkedCustomer as any) ?? null,
      email: linkedCustomer?.email ?? null,
      address: whatsappCustomer?.address ?? null,
      notes: whatsappCustomer?.notes ?? linkedCustomer?.notes ?? null,
      isActive: linkedCustomer?.isActive ?? null,
      source:
        whatsappCustomer && linkedCustomer
          ? "linked"
          : linkedCustomer
            ? "customer"
            : "whatsapp",
      lastInteractionAt: whatsappCustomer?.lastInteractionAt?.toISOString() ?? null,
    };
  }

  async upsertCustomer(
    input: WhatsAppAssistantCustomerUpsertInput,
  ): Promise<WhatsAppAssistantCustomer> {
    const phoneDigits = this.assertPhone(input.phone);
    const [existing, linkedCustomer] = await Promise.all([
      this.whatsappCustomersRepository.findByPhone(phoneDigits),
      this.customersRepository.findByPhoneDigits(phoneDigits),
    ]);
    const now = new Date();

    if (existing) {
      await this.whatsappCustomersRepository.update(existing.id, {
        linkedCustomerId: linkedCustomer?.id ?? existing.linkedCustomerId ?? null,
        name: mergePartialText(existing.name, input.name),
        address: mergePartialText(existing.address, input.address),
        notes: mergePartialText(existing.notes, input.notes),
        lastInteractionAt: now,
        updatedAt: now,
      });
    } else {
      await this.whatsappCustomersRepository.create({
        phone: phoneDigits,
        linkedCustomerId: linkedCustomer?.id ?? null,
        name: normalizeText(input.name),
        address: normalizeText(input.address),
        notes: normalizeText(input.notes),
        lastInteractionAt: now,
      });
    }

    const customer = await this.getCustomerByPhone(phoneDigits);

    if (!customer) {
      throw new HttpError(500, "Nao foi possivel salvar o cliente do WhatsApp.");
    }

    console.info(`[whatsapp-assistant] upserted customer ${phoneDigits}`);
    return customer;
  }

  async getCatalog(): Promise<WhatsAppAssistantCatalogItem[]> {
    const products = await this.publicStoreService.listProducts();
    const pricedProducts = products.filter(
      (product) => getProductPriceCents(product) > 0,
    );

    return Promise.all(
      pricedProducts.map((product) => this.mapCatalogItem(product)),
    );
  }

  async searchCatalog(query: string): Promise<WhatsAppAssistantCatalogItem[]> {
    const normalizedQuery = normalizeSearch(query);
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const catalog = await this.getCatalog();

    return catalog
      .map((item) => {
        const haystacks = [
          normalizeSearch(item.name),
          normalizeSearch(item.category),
          normalizeSearch(item.notes ?? ""),
        ];

        let score = 0;
        for (const token of tokens) {
          if (haystacks[0].startsWith(token)) score += 10;
          if (haystacks[0].includes(token)) score += 6;
          if (haystacks[1].includes(token)) score += 4;
          if (haystacks[2].includes(token)) score += 2;
        }

        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.item.name.localeCompare(right.item.name);
      })
      .map((entry) => entry.item);
  }

  async getDraftByPhone(phone: string): Promise<WhatsAppAssistantDraftOrder | null> {
    const phoneDigits = this.assertPhone(phone);
    const row = await this.whatsappOrderDraftsRepository.findByPhone(phoneDigits);

    if (!row) {
      return null;
    }

    return this.mapDraft(row);
  }

  async upsertDraft(
    input: WhatsAppAssistantDraftUpsertInput,
  ): Promise<WhatsAppAssistantDraftOrder> {
    const phoneDigits = this.assertPhone(input.customerPhone);
    const [existingDraft, customer] = await Promise.all([
      this.whatsappOrderDraftsRepository.findByPhone(phoneDigits),
      this.getCustomerByPhone(phoneDigits),
    ]);

    let resolvedProductName =
      normalizeText(input.productName) ?? existingDraft?.productName ?? null;

    if (input.productId) {
      const product = await this.publicStoreService.getProduct(input.productId);
      resolvedProductName = product.name;
    }

    if (existingDraft) {
      const updated = await this.whatsappOrderDraftsRepository.update(
        existingDraft.id,
        {
          whatsappCustomerId:
            customer?.whatsappCustomerId ?? existingDraft.whatsappCustomerId ?? null,
          linkedCustomerId: customer?.customerId ?? existingDraft.linkedCustomerId ?? null,
          productId: input.productId ?? existingDraft.productId ?? null,
          productName: resolvedProductName,
          quantity:
            input.quantity != null ? input.quantity : existingDraft.quantity ?? null,
          flavor: mergePartialText(existingDraft.flavor, input.flavor),
          deliveryDate: input.deliveryDate ?? existingDraft.deliveryDate ?? null,
          deliveryType: input.deliveryType ?? existingDraft.deliveryType ?? null,
          address: mergePartialText(existingDraft.address, input.address),
          notes: mergePartialText(existingDraft.notes, input.notes),
          updatedAt: new Date(),
        },
      );

      if (!updated) {
        throw new HttpError(500, "Nao foi possivel atualizar o rascunho.");
      }

      console.info(`[whatsapp-assistant] updated draft for ${phoneDigits}`);
      return this.mapDraft(updated);
    }

    const created = await this.whatsappOrderDraftsRepository.create({
      customerPhone: phoneDigits,
      whatsappCustomerId: customer?.whatsappCustomerId ?? null,
      linkedCustomerId: customer?.customerId ?? null,
      productId: input.productId ?? null,
      productName: resolvedProductName,
      quantity: input.quantity ?? null,
      flavor: normalizeText(input.flavor),
      deliveryDate: input.deliveryDate ?? null,
      deliveryType: input.deliveryType ?? null,
      address: normalizeText(input.address),
      notes: normalizeText(input.notes),
    });

    console.info(`[whatsapp-assistant] created draft for ${phoneDigits}`);
    return this.mapDraft(created);
  }

  async confirmDraft(input: WhatsAppAssistantDraftConfirmInput) {
    const phoneDigits = this.assertPhone(input.customerPhone);
    const draft = await this.whatsappOrderDraftsRepository.findByPhone(phoneDigits);

    if (!draft) {
      throw new HttpError(404, "Nao existe rascunho de pedido para esse telefone.");
    }

    const [customer, lastOrder] = await Promise.all([
      this.getCustomerByPhone(phoneDigits),
      this.ordersRepository.findLatestByPhoneDigits(phoneDigits),
    ]);
    const customerName = customer?.name ?? null;
    const product = await this.resolveDraftProduct(draft.productId, draft.productName);
    const productDetail = await this.publicStoreService.getProduct(product.id);
    const missingFields = await this.buildMissingFields({
      customerName,
      draft,
      productDetail,
    });

    if (missingFields.length > 0) {
      throw new HttpError(
        400,
        `Rascunho incompleto. Faltam: ${missingFields.join(", ")}.`,
      );
    }

    const fillingOption = this.resolveFlavorOption(productDetail, draft.flavor);
    const deliveryMode = draft.deliveryType === "delivery" ? "Entrega" : "Retirada";
    const orderInput: CreateOrderInput = {
      customerId: customer?.customerId ?? null,
      customerName: customerName!,
      customerPhone: phoneDigits,
      orderDate: getTodayOperationalDate(),
      deliveryDate: draft.deliveryDate!,
      deliveryTime: null,
      deliveryMode,
      deliveryAddress:
        deliveryMode === "Entrega" ? normalizeText(draft.address) : null,
      deliveryReference: null,
      deliveryDistrict: null,
      deliveryFeeCents: 0,
      status: "Novo",
      paymentMethod: "Pix",
      paidAmountCents: 0,
      notes: [normalizeText(draft.notes), "Pedido criado pelo assistente WhatsApp."]
        .filter(Boolean)
        .join("\n"),
      items: [
        {
          recipeId: product.id,
          productName: fillingOption
            ? `${product.name} - ${fillingOption.name}`
            : product.name,
          quantity: draft.quantity!,
          unitPriceCents: getProductPriceCents(product),
          fillingRecipeId: fillingOption?.id ?? null,
          secondaryFillingRecipeId: null,
          tertiaryFillingRecipeId: null,
          additionals: [],
        },
      ],
    };

    const order = await this.ordersService.create(orderInput);
    await this.whatsappOrderDraftsRepository.deleteByPhone(phoneDigits);

    if (customer?.whatsappCustomerId) {
      await this.whatsappCustomersRepository.update(customer.whatsappCustomerId, {
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.info(
      `[whatsapp-assistant] confirmed draft for ${phoneDigits} into ${order.orderNumber}`,
    );

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      reusedLastOrderId: lastOrder?.id ?? null,
    };
  }

  async listOrdersByPhone(phone: string): Promise<WhatsAppAssistantOrderSummary[]> {
    const phoneDigits = this.assertPhone(phone);
    const rows = await this.ordersRepository.listByPhoneDigits(phoneDigits, 10);

    console.info(
      `[whatsapp-assistant] fetched ${rows.length} orders for ${phoneDigits}`,
    );

    return rows.map((row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      customerName: row.customerName,
      orderDate: row.orderDate,
      deliveryDate: row.deliveryDate,
      deliveryTime: row.deliveryTime,
      deliveryMode: row.deliveryMode,
      status: row.status,
      paymentStatus: row.paymentStatus,
      subtotalAmountCents: row.subtotalAmountCents,
      paidAmountCents: row.paidAmountCents,
      remainingAmountCents: row.remainingAmountCents,
      itemSummary: row.itemSummary,
    }));
  }

  async getOrderById(id: string) {
    return this.ordersService.getById(id);
  }

  async getSessionStatus(phone: string): Promise<WhatsAppAssistantSessionStatus> {
    const phoneDigits = this.assertPhone(phone);
    const [customer, draft, lastOrder] = await Promise.all([
      this.getCustomerByPhone(phoneDigits),
      this.whatsappOrderDraftsRepository.findByPhone(phoneDigits),
      this.ordersRepository.findLatestByPhoneDigits(phoneDigits),
    ]);

    const productDetail =
      draft?.productId
        ? await this.safeGetProductDetail(draft.productId)
        : null;

    const missingFields = await this.buildMissingFields({
      customerName: customer?.name ?? null,
      draft,
      productDetail,
    });

    console.info(`[whatsapp-assistant] built session status for ${phoneDigits}`);

    return {
      customerExists: Boolean(customer),
      hasDraftOrder: Boolean(draft),
      missingFields,
      lastOrderId: lastOrder?.id ?? undefined,
    };
  }

  private async buildMissingFields(input: {
    customerName: string | null;
    draft: any | null;
    productDetail: PublicStoreProductDetail | null;
  }) {
    const missingFields: string[] = [];

    if (!input.customerName) missingFields.push("customerName");
    if (!input.draft?.productId && !input.draft?.productName) {
      missingFields.push("product");
    }
    if (!input.draft?.quantity) missingFields.push("quantity");
    if (!input.draft?.deliveryDate) missingFields.push("deliveryDate");
    if (!input.draft?.deliveryType) missingFields.push("deliveryType");

    if (
      input.draft?.deliveryType === "delivery" &&
      !normalizeText(input.draft?.address)
    ) {
      missingFields.push("address");
    }

    if ((input.productDetail?.minFillings ?? 0) > 0 && !normalizeText(input.draft?.flavor)) {
      missingFields.push("flavor");
    }

    return missingFields;
  }

  private async resolveDraftProduct(
    productId: string | null,
    productName: string | null,
  ): Promise<PublicStoreProductSummary> {
    if (productId) {
      const product = await this.publicStoreService.getProduct(productId);
      return {
        id: product.id,
        name: product.name,
        notes: product.notes,
        primaryImageUrl: product.primaryImageUrl,
        outputQuantity: product.outputQuantity,
        outputUnit: product.outputUnit,
        salePriceCents: product.salePriceCents,
        effectiveSalePriceCents: product.effectiveSalePriceCents,
        additionalGroupCount: product.additionalGroupCount,
      };
    }

    const normalizedName = normalizeSearch(productName ?? "");
    if (!normalizedName) {
      throw new HttpError(400, "Produto do rascunho nao foi informado.");
    }

    const catalog = await this.publicStoreService.listProducts();
    const exactMatch = catalog.find(
      (item) => normalizeSearch(item.name) === normalizedName,
    );

    if (exactMatch) {
      return exactMatch;
    }

    const fuzzyMatches = catalog.filter((item) =>
      normalizeSearch(item.name).includes(normalizedName),
    );

    if (fuzzyMatches.length === 1) {
      return fuzzyMatches[0];
    }

    if (fuzzyMatches.length > 1) {
      throw new HttpError(
        400,
        "O nome do produto ficou ambiguo. Informe o produto com mais clareza.",
      );
    }

    throw new HttpError(404, "Produto nao encontrado para esse rascunho.");
  }

  private resolveFlavorOption(
    productDetail: PublicStoreProductDetail,
    flavorName: string | null,
  ) {
    const normalizedFlavor = normalizeSearch(flavorName ?? "");

    if (!normalizedFlavor) {
      return null;
    }

    const exactMatch = productDetail.fillingOptions.find(
      (option) => normalizeSearch(option.name) === normalizedFlavor,
    );

    if (exactMatch) {
      return exactMatch;
    }

    const fuzzyMatches = productDetail.fillingOptions.filter((option) => {
      const normalizedOption = normalizeSearch(option.name);
      return (
        normalizedOption.includes(normalizedFlavor) ||
        normalizedFlavor.includes(normalizedOption)
      );
    });

    if (fuzzyMatches.length === 1) {
      return fuzzyMatches[0];
    }

    if (fuzzyMatches.length > 1) {
      throw new HttpError(
        400,
        "O sabor informado ficou ambiguo. Informe o nome do sabor com mais clareza.",
      );
    }

    throw new HttpError(
      400,
      "O sabor informado nao existe para esse produto.",
    );
  }

  private async mapCatalogItem(
    product: PublicStoreProductSummary,
  ): Promise<WhatsAppAssistantCatalogItem> {
    const productDetail = await this.publicStoreService.getProduct(product.id);

    return {
      id: product.id,
      name: product.name,
      category: classifyCatalogCategory(product.name),
      priceCents: getProductPriceCents(product),
      available: true,
      notes: product.notes,
      primaryImageUrl: product.primaryImageUrl,
      availableFlavors: this.extractAvailableFlavors(productDetail),
      minFillings: productDetail.minFillings,
      maxFillings: productDetail.maxFillings,
      additionalGroups: productDetail.additionalGroups,
    };
  }

  private extractAvailableFlavors(productDetail: PublicStoreProductDetail) {
    if ((productDetail.minFillings ?? 0) <= 0) {
      return [];
    }

    return productDetail.fillingOptions.map((option) => option.name);
  }

  private mapDraft(row: any): WhatsAppAssistantDraftOrder {
    return {
      id: row.id,
      customerPhone: row.customerPhone,
      whatsappCustomerId: row.whatsappCustomerId ?? null,
      customerId: row.linkedCustomerId ?? null,
      productId: row.productId ?? null,
      productName: row.productName ?? null,
      quantity: row.quantity == null ? null : Number(row.quantity),
      flavor: row.flavor ?? null,
      deliveryDate: row.deliveryDate ?? null,
      deliveryType:
        row.deliveryType === "pickup" || row.deliveryType === "delivery"
          ? row.deliveryType
          : null,
      address: row.address ?? null,
      notes: row.notes ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async safeGetProductDetail(productId: string) {
    try {
      return await this.publicStoreService.getProduct(productId);
    } catch {
      return null;
    }
  }

  private assertPhone(phone: string) {
    const phoneDigits = normalizePhone(phone);

    if (phoneDigits.length < 8) {
      throw new HttpError(400, "Telefone invalido para o canal WhatsApp.");
    }

    return phoneDigits;
  }
}
