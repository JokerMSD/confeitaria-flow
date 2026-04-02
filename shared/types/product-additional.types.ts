export type ProductAdditionalSelectionType = "single" | "multiple";

export interface ProductAdditionalOption {
  id: string;
  groupId: string;
  name: string;
  priceDeltaCents: number;
  position: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProductAdditionalGroup {
  id: string;
  productRecipeId: string;
  name: string;
  selectionType: ProductAdditionalSelectionType;
  minSelections: number;
  maxSelections: number;
  position: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProductAdditionalGroupDetail extends ProductAdditionalGroup {
  options: ProductAdditionalOption[];
}

export interface CreateProductAdditionalOptionInput {
  name: string;
  priceDeltaCents?: number;
  position?: number;
  notes?: string | null;
}

export interface CreateProductAdditionalGroupInput {
  productRecipeId?: string;
  name: string;
  selectionType: ProductAdditionalSelectionType;
  minSelections?: number;
  maxSelections?: number;
  position?: number;
  notes?: string | null;
  options: CreateProductAdditionalOptionInput[];
}

export interface UpdateProductAdditionalGroupInput
  extends CreateProductAdditionalGroupInput {}

export interface ListProductAdditionalGroupsFilters {
  productRecipeId: string;
}
