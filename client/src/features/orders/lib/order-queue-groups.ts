import type { OrderQueueCardItem } from "../types/order-ui";

export function parseOperationalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function toOperationalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTimeLabel(value?: string) {
  return value?.trim() ? value : "Sem horário";
}

export function sortQueueOrders(list: OrderQueueCardItem[]) {
  return [...list].sort((a, b) => {
    if (a.deliveryDate !== b.deliveryDate) {
      return a.deliveryDate.localeCompare(b.deliveryDate);
    }

    const timeA = a.deliveryTime || "23:59";
    const timeB = b.deliveryTime || "23:59";

    if (timeA !== timeB) {
      return timeA.localeCompare(timeB);
    }

    return a.orderNumber.localeCompare(b.orderNumber);
  });
}

export interface QueueTimeGroup {
  slot: string;
  items: OrderQueueCardItem[];
}

export interface QueueDateGroup {
  dateKey: string;
  itemsCount: number;
  slots: QueueTimeGroup[];
}

export function buildQueueDateGroups(orders: OrderQueueCardItem[]) {
  const ordersByDate = new Map<string, OrderQueueCardItem[]>();

  for (const order of sortQueueOrders(orders)) {
    const current = ordersByDate.get(order.deliveryDate) ?? [];
    current.push(order);
    ordersByDate.set(order.deliveryDate, current);
  }

  return Array.from(ordersByDate.entries()).map(([dateKey, dateOrders]) => {
    const slots = new Map<string, OrderQueueCardItem[]>();

    for (const order of dateOrders) {
      const slotKey = getTimeLabel(order.deliveryTime);
      const current = slots.get(slotKey) ?? [];
      current.push(order);
      slots.set(slotKey, current);
    }

    const groupedSlots = Array.from(slots.entries())
      .sort(([slotA], [slotB]) => {
        if (slotA === "Sem horário") return 1;
        if (slotB === "Sem horário") return -1;
        return slotA.localeCompare(slotB);
      })
      .map(([slot, items]) => ({
        slot,
        items: sortQueueOrders(items),
      }));

    return {
      dateKey,
      itemsCount: dateOrders.length,
      slots: groupedSlots,
    } satisfies QueueDateGroup;
  });
}
