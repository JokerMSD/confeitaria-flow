import test from "node:test";
import assert from "node:assert/strict";
import {
  adaptFormStateToCreatePayload,
  adaptOrderDetailToFormState,
  buildOrderFormItem,
  createEmptyOrderFormState,
} from "../../client/src/features/orders/lib/order-form-adapter";

test("catalog item prices keep cent precision when payload is built", () => {
  const state = createEmptyOrderFormState();
  state.customerName = "Cliente";
  state.deliveryDate = "2026-03-31";
  state.items = [
    {
      id: "item-1",
      recipeId: "recipe-1",
      fillingRecipeId: "fill-1",
      secondaryFillingRecipeId: null,
      tertiaryFillingRecipeId: null,
      productName: "Ovo de colher 350g - Brigadeiro",
      quantity: 2,
      unitPrice: 39.9,
      subtotal: 79.8,
      position: 0,
      additionals: [],
    },
  ];

  const payload = adaptFormStateToCreatePayload(state);

  assert.equal(payload.data.items[0]?.unitPriceCents, 3990);
});

test("item subtotal preview includes selected additionals", () => {
  const item = buildOrderFormItem(
    "item-1",
    "recipe-1",
    "fill-1",
    null,
    null,
    "Ovo de colher 350g - Brigadeiro",
    2,
    39.9,
    0,
    [
      {
        groupId: "group-1",
        optionId: "option-1",
        groupName: "Extras",
        optionName: "Laço",
        priceDelta: 2.5,
        position: 0,
      },
      {
        groupId: "group-1",
        optionId: "option-2",
        groupName: "Extras",
        optionName: "Colher",
        priceDelta: 1,
        position: 1,
      },
    ],
  );

  assert.equal(item.subtotal, 86.8);
});

test("order detail rehydrates saved additionals in edit mode", () => {
  const state = adaptOrderDetailToFormState({
    data: {
      id: "order-1",
      orderNumber: "PED-000001",
      customerName: "Cliente",
      customerPhone: null,
      orderDate: "2026-04-02",
      deliveryDate: "2026-04-03",
      deliveryTime: null,
      deliveryMode: "Entrega",
      deliveryAddress: "Rua A",
      deliveryReference: null,
      deliveryDistrict: "Centro",
      deliveryFeeCents: 0,
      status: "Novo",
      paymentMethod: "Pix",
      paymentStatus: "Pendente",
      notes: null,
      subtotalAmountCents: 4580,
      paidAmountCents: 0,
      remainingAmountCents: 4580,
      itemCount: 1,
      createdAt: "2026-04-02T10:00:00.000Z",
      updatedAt: "2026-04-02T10:00:00.000Z",
      deletedAt: null,
      items: [
        {
          id: "item-1",
          orderId: "order-1",
          recipeId: "recipe-1",
          fillingRecipeId: "fill-1",
          secondaryFillingRecipeId: null,
          tertiaryFillingRecipeId: null,
          productName: "Ovo de colher 350g - Brigadeiro",
          quantity: 1,
          unitPriceCents: 3990,
          lineTotalCents: 4580,
          position: 0,
          additionals: [
            {
              id: "additional-1",
              orderItemId: "item-1",
              groupId: "group-1",
              optionId: "option-1",
              groupName: "Extras",
              optionName: "Laco",
              priceDeltaCents: 590,
              position: 0,
              createdAt: "2026-04-02T10:00:00.000Z",
              updatedAt: "2026-04-02T10:00:00.000Z",
            },
          ],
          createdAt: "2026-04-02T10:00:00.000Z",
          updatedAt: "2026-04-02T10:00:00.000Z",
        },
      ],
    },
  });

  assert.equal(state.items[0]?.additionals.length, 1);
  assert.equal(state.items[0]?.additionals[0]?.optionName, "Laco");
  assert.equal(state.items[0]?.subtotal, 45.8);
});

test("pickup orders clear delivery fields and fee in payload", () => {
  const state = createEmptyOrderFormState();
  state.customerName = "Cliente";
  state.deliveryDate = "2026-04-03";
  state.deliveryMode = "Retirada";
  state.deliveryAddress = "Rua A";
  state.deliveryReference = "Casa azul";
  state.deliveryDistrict = "Centro";
  state.deliveryFee = "12,50";
  state.items = [
    {
      id: "item-1",
      recipeId: "recipe-1",
      fillingRecipeId: "fill-1",
      secondaryFillingRecipeId: null,
      tertiaryFillingRecipeId: null,
      productName: "Ovo de colher 350g - Brigadeiro",
      quantity: 1,
      unitPrice: 39.9,
      subtotal: 39.9,
      position: 0,
      additionals: [],
    },
  ];

  const payload = adaptFormStateToCreatePayload(state);

  assert.equal(payload.data.deliveryMode, "Retirada");
  assert.equal(payload.data.deliveryAddress, null);
  assert.equal(payload.data.deliveryReference, null);
  assert.equal(payload.data.deliveryDistrict, null);
  assert.equal(payload.data.deliveryFeeCents, 0);
});
