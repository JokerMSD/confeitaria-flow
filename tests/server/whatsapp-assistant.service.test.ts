import assert from "node:assert/strict";
import test from "node:test";
import { WhatsAppAssistantService } from "../../server/services/whatsapp-assistant.service";

test("whatsapp assistant catalog exposes available flavors from product detail", async () => {
  const service = new WhatsAppAssistantService() as any;

  service.publicStoreService = {
    listProducts: async () => [
      {
        id: "prod-1",
        name: "Ovo de colher 500g",
        notes: "Peso nominal 500g.",
        primaryImageUrl: "/uploads/catalog/prod-1.jpg",
        salePriceCents: 4990,
        effectiveSalePriceCents: 4990,
      },
      {
        id: "prod-2",
        name: "Caixa presente",
        notes: null,
        primaryImageUrl: null,
        salePriceCents: 2990,
        effectiveSalePriceCents: 2990,
      },
    ],
    getProduct: async (id: string) =>
      id === "prod-1"
        ? {
            id,
            minFillings: 1,
            maxFillings: 3,
            fillingOptions: [
              { id: "fill-base", name: "Base recheio" },
              { id: "fill-simple", name: "Recheio simples" },
              { id: "fill-1", name: "Ninho" },
              { id: "fill-2", name: "Brigadeiro" },
            ],
            additionalGroups: [
              {
                id: "group-1",
                productRecipeId: id,
                name: "Adicionais da casa",
                minSelections: 0,
                maxSelections: 2,
                position: 0,
                options: [
                  {
                    id: "opt-1",
                    groupId: "group-1",
                    name: "Kit Kat",
                    priceDeltaCents: 600,
                    position: 0,
                  },
                ],
              },
            ],
          }
        : {
            id,
            minFillings: 0,
            maxFillings: 0,
            fillingOptions: [{ id: "fill-3", name: "Nao deve aparecer" }],
            additionalGroups: [],
          },
  };

  const result = await service.getCatalog();

  assert.deepEqual(result[0].availableFlavors, ["Ninho", "Brigadeiro"]);
  assert.equal(result[0].minFillings, 1);
  assert.equal(result[0].maxFillings, 3);
  assert.equal(result[0].additionalGroups[0]?.options[0]?.name, "Kit Kat");
  assert.deepEqual(result[1].availableFlavors, []);
  assert.equal(result[1].minFillings, 0);
  assert.equal(result[1].maxFillings, 0);
  assert.deepEqual(result[1].additionalGroups, []);
});

test("whatsapp assistant does not accept base recipes as sellable flavors", () => {
  const service = new WhatsAppAssistantService() as any;

  assert.throws(
    () =>
      service.resolveFlavorOption(
        {
          fillingOptions: [
            { id: "fill-base", name: "Base recheio" },
            { id: "fill-simple", name: "Recheio simples" },
            { id: "fill-1", name: "Ninho" },
          ],
        },
        "Base recheio",
      ),
    {
      message: "O sabor informado nao existe para esse produto.",
    },
  );

  assert.equal(
    service.resolveFlavorOption(
      {
        fillingOptions: [
          { id: "fill-base", name: "Base recheio" },
          { id: "fill-simple", name: "Recheio simples" },
          { id: "fill-1", name: "Ninho" },
        ],
      },
      "Ninho",
    )?.name,
    "Ninho",
  );
});

test("whatsapp assistant sanitizes phone and merges customer profile data", async () => {
  const service = new WhatsAppAssistantService() as any;

  service.whatsappCustomersRepository = {
    findByPhone: async (phone: string) => ({
      id: "wa-1",
      phone,
      linkedCustomerId: "cust-1",
      name: "Igor WhatsApp",
      address: "Rua A, 100",
      notes: "Cliente recorrente",
      lastInteractionAt: new Date("2026-04-12T10:00:00.000Z"),
    }),
  };
  service.customersRepository = {
    findByPhoneDigits: async () => ({
      id: "cust-1",
      firstName: "Igor",
      lastName: "Silva",
      email: "igor@email.com",
      notes: "Cadastro interno",
      isActive: true,
    }),
    findById: async () => null,
  };

  const result = await service.getCustomerByPhone("(31) 8250-2353");

  assert.equal(result?.phone, "3182502353");
  assert.equal(result?.name, "Igor WhatsApp");
  assert.equal(result?.email, "igor@email.com");
  assert.equal(result?.source, "linked");
});

test("whatsapp assistant upserts draft without erasing previous partial fields", async () => {
  const service = new WhatsAppAssistantService() as any;
  let updatedPayload: Record<string, unknown> | null = null;

  service.whatsappOrderDraftsRepository = {
    findByPhone: async () => ({
      id: "draft-1",
      customerPhone: "553182502353",
      whatsappCustomerId: "wa-1",
      linkedCustomerId: "cust-1",
      productId: "prod-1",
      productName: "Ovo de colher 500g",
      quantity: 2,
      flavor: "Ninho",
      deliveryDate: "2026-04-15",
      deliveryType: "delivery",
      address: "Rua A, 100",
      notes: "Sem pressa",
      createdAt: new Date("2026-04-12T10:00:00.000Z"),
      updatedAt: new Date("2026-04-12T10:00:00.000Z"),
    }),
    update: async (_id: string, payload: Record<string, unknown>) => {
      updatedPayload = payload;

      return {
        id: "draft-1",
        customerPhone: "553182502353",
        whatsappCustomerId: "wa-1",
        linkedCustomerId: "cust-1",
        productId: "prod-1",
        productName: "Ovo de colher 500g",
        quantity: 2,
        flavor: "Ninho",
        deliveryDate: "2026-04-15",
        deliveryType: "delivery",
        address: "Rua A, 100",
        notes: "Atualizar observacao",
        createdAt: new Date("2026-04-12T10:00:00.000Z"),
        updatedAt: new Date("2026-04-12T10:05:00.000Z"),
      };
    },
  };
  service.getCustomerByPhone = async () => ({
    whatsappCustomerId: "wa-1",
    customerId: "cust-1",
  });

  const result = await service.upsertDraft({
    customerPhone: "553182502353",
    notes: "Atualizar observacao",
  });

  assert.equal(updatedPayload?.productId, "prod-1");
  assert.equal(updatedPayload?.address, "Rua A, 100");
  assert.equal(result.notes, "Atualizar observacao");
});

test("whatsapp assistant session reports missing fields for delivery draft", async () => {
  const service = new WhatsAppAssistantService() as any;

  service.getCustomerByPhone = async () => null;
  service.whatsappOrderDraftsRepository = {
    findByPhone: async () => ({
      id: "draft-1",
      customerPhone: "553182502353",
      productId: "prod-1",
      productName: "Ovo de colher 500g",
      quantity: 2,
      flavor: null,
      deliveryDate: null,
      deliveryType: "delivery",
      address: null,
      notes: null,
      createdAt: new Date("2026-04-12T10:00:00.000Z"),
      updatedAt: new Date("2026-04-12T10:00:00.000Z"),
    }),
  };
  service.ordersRepository = {
    findLatestByPhoneDigits: async () => ({ id: "order-1" }),
  };
  service.safeGetProductDetail = async () => ({
    minFillings: 1,
  });

  const result = await service.getSessionStatus("553182502353");

  assert.equal(result.customerExists, false);
  assert.equal(result.hasDraftOrder, true);
  assert.deepEqual(result.missingFields, [
    "customerName",
    "deliveryDate",
    "address",
    "flavor",
  ]);
  assert.equal(result.lastOrderId, "order-1");
});

test("whatsapp assistant confirms draft into regular order flow", async () => {
  const service = new WhatsAppAssistantService() as any;
  let deletedPhone = "";

  service.whatsappOrderDraftsRepository = {
    findByPhone: async () => ({
      id: "draft-1",
      customerPhone: "553182502353",
      productId: "prod-1",
      productName: "Ovo de colher 500g",
      quantity: 2,
      flavor: "Ninho",
      deliveryDate: "2026-04-15",
      deliveryType: "pickup",
      address: null,
      notes: "Cliente do WhatsApp",
    }),
    deleteByPhone: async (phone: string) => {
      deletedPhone = phone;
      return { id: "draft-1" };
    },
  };
  service.getCustomerByPhone = async () => ({
    whatsappCustomerId: "wa-1",
    customerId: "cust-1",
    name: "Igor Silva",
  });
  service.ordersRepository = {
    findLatestByPhoneDigits: async () => null,
  };
  service.resolveDraftProduct = async () => ({
    id: "prod-1",
    name: "Ovo de colher 500g",
    salePriceCents: 4990,
    effectiveSalePriceCents: 4990,
  });
  service.publicStoreService = {
    getProduct: async () => ({
      id: "prod-1",
      name: "Ovo de colher 500g",
      salePriceCents: 4990,
      effectiveSalePriceCents: 4990,
      minFillings: 1,
      fillingOptions: [{ id: "fill-1", name: "Ninho" }],
    }),
  };
  service.ordersService = {
    create: async (input: Record<string, unknown>) => ({
      id: "order-1",
      orderNumber: "PED-000123",
      status: input.status,
      paymentStatus: "Pendente",
    }),
  };
  service.whatsappCustomersRepository = {
    update: async () => null,
  };

  const result = await service.confirmDraft({
    customerPhone: "553182502353",
  });

  assert.equal(result.orderId, "order-1");
  assert.equal(result.orderNumber, "PED-000123");
  assert.equal(deletedPhone, "553182502353");
});
