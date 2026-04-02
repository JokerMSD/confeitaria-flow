import test from "node:test";
import assert from "node:assert/strict";
import { buildQueueDateGroups } from "../../client/src/features/orders/lib/order-queue-groups";
import type { OrderQueueCardItem } from "../../client/src/features/orders/types/order-ui";

function buildOrder(
  id: string,
  deliveryDate: string,
  deliveryTime: string | undefined,
): OrderQueueCardItem {
  return {
    id,
    orderNumber: `PED-${id}`,
    customerName: `Cliente ${id}`,
    orderDate: "2026-04-02",
    deliveryDate,
    deliveryTime,
    deliveryMode: "Entrega",
    deliveryAddress: "Rua A",
    deliveryDistrict: "Centro",
    deliveryReference: undefined,
    deliveryFee: 0,
    status: "Confirmado",
    paymentMethod: "Pix",
    paymentStatus: "Pendente",
    notes: "",
    totalAmount: 39.9,
    paidAmount: 0,
    remainingAmount: 39.9,
    itemCount: 1,
    items: [{ productName: "Ovo", quantity: 1 }],
  };
}

test("queue groups keep different delivery dates separated before grouping by time", () => {
  const groups = buildQueueDateGroups([
    buildOrder("3", "2026-04-03", "15:00"),
    buildOrder("1", "2026-04-02", "15:00"),
    buildOrder("2", "2026-04-02", "09:00"),
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0]?.dateKey, "2026-04-02");
  assert.equal(groups[0]?.slots[0]?.slot, "09:00");
  assert.equal(groups[0]?.slots[1]?.slot, "15:00");
  assert.equal(groups[1]?.dateKey, "2026-04-03");
});

test("queue groups place orders without time at the end of each day", () => {
  const groups = buildQueueDateGroups([
    buildOrder("1", "2026-04-02", undefined),
    buildOrder("2", "2026-04-02", "10:00"),
  ]);

  assert.equal(groups[0]?.slots[0]?.slot, "10:00");
  assert.equal(groups[0]?.slots[1]?.slot, "Sem horário");
});
