import type {
  CreateOrderInput,
  ListOrdersFilters,
  OrderDetail,
  OrderListItem,
  UpdateOrderStatusInput,
  UpdateOrderInput,
} from "./order.types";
import type { OrderLookupItem } from "./order-lookup.types";
import type { OrderQueueItem } from "./order-queue.types";

export interface ListOrdersResponse {
  data: OrderListItem[];
  filters: ListOrdersFilters;
}

export interface OrderDetailResponse {
  data: OrderDetail;
}

export interface CreateOrderRequest {
  data: CreateOrderInput;
}

export interface UpdateOrderRequest {
  data: UpdateOrderInput;
}

export interface UpdateOrderStatusRequest {
  data: UpdateOrderStatusInput;
}

export interface DeleteOrderResponse {
  data: {
    id: string;
    deletedAt: string;
  };
}

export interface OrdersQueueResponse {
  data: OrderQueueItem[];
}

export interface OrdersLookupResponse {
  data: OrderLookupItem[];
}
