import type {
  CreateOrderInput,
  ListOrdersFilters,
  OrderDetail,
  OrderListItem,
  UpdateOrderInput,
} from "./order.types";

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

export interface DeleteOrderResponse {
  data: {
    id: string;
    deletedAt: string;
  };
}
