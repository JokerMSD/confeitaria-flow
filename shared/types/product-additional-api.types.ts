import type {
  CreateProductAdditionalGroupInput,
  ListProductAdditionalGroupsFilters,
  ProductAdditionalGroupDetail,
  UpdateProductAdditionalGroupInput,
} from "./product-additional.types";

export interface ListProductAdditionalGroupsResponse {
  data: ProductAdditionalGroupDetail[];
  filters: ListProductAdditionalGroupsFilters;
}

export interface ProductAdditionalGroupDetailResponse {
  data: ProductAdditionalGroupDetail;
}

export interface CreateProductAdditionalGroupRequest {
  data: CreateProductAdditionalGroupInput;
}

export interface UpdateProductAdditionalGroupRequest {
  data: UpdateProductAdditionalGroupInput;
}
