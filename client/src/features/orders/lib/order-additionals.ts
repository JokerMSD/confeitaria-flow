import type { OrderFormItemAdditional } from "../types/order-ui";

export function getOrderItemAdditionalsUnitTotal(
  additionals: OrderFormItemAdditional[],
) {
  return additionals.reduce((sum, additional) => sum + additional.priceDelta, 0);
}

export function formatOrderItemAdditionalsSummary(
  additionals: OrderFormItemAdditional[],
) {
  if (additionals.length === 0) {
    return "";
  }

  const labelsByGroup = new Map<string, string[]>();

  for (const additional of additionals) {
    const current = labelsByGroup.get(additional.groupName) ?? [];
    current.push(additional.optionName);
    labelsByGroup.set(additional.groupName, current);
  }

  return Array.from(labelsByGroup.entries())
    .map(([groupName, optionNames]) => `${groupName}: ${optionNames.join(", ")}`)
    .join(" | ");
}
