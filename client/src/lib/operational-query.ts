import { accountQueryKeys } from "@/features/account/lib/account-query-keys";
import { cashQueryKeys } from "@/features/cash/lib/cash-query-keys";
import { customerQueryKeys } from "@/features/customers/lib/customer-query-keys";
import { inventoryMovementQueryKeys } from "@/features/inventory/lib/inventory-movement-query-keys";
import { inventoryQueryKeys } from "@/features/inventory/lib/inventory-query-keys";
import { orderQueryKeys } from "@/features/orders/lib/order-query-keys";
import { queryClient } from "@/lib/queryClient";

export const operationalQueryOptions = {
  refetchInterval: 15 * 1000,
  refetchOnMount: "always" as const,
  refetchOnReconnect: "always" as const,
};

export async function invalidateOperationalData(options?: {
  orderId?: string;
  inventoryItemId?: string;
  cashTransactionId?: string;
  customerId?: string;
}) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: orderQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: cashQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["cash-summary"] }),
    queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: inventoryMovementQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: customerQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["production"] }),
    queryClient.invalidateQueries({ queryKey: accountQueryKeys.orders() }),
    ...(options?.orderId
      ? [queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(options.orderId) })]
      : []),
    ...(options?.inventoryItemId
      ? [
          queryClient.invalidateQueries({
            queryKey: inventoryQueryKeys.detail(options.inventoryItemId),
          }),
          queryClient.invalidateQueries({
            queryKey: inventoryMovementQueryKeys.item(options.inventoryItemId),
          }),
        ]
      : []),
    ...(options?.cashTransactionId
      ? [
          queryClient.invalidateQueries({
            queryKey: cashQueryKeys.detail(options.cashTransactionId),
          }),
        ]
      : []),
    ...(options?.customerId
      ? [
          queryClient.invalidateQueries({
            queryKey: customerQueryKeys.detail(options.customerId),
          }),
        ]
      : []),
  ]);
}
