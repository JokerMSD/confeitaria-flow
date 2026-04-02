import type {
  CreateOrderItemAdditionalInput,
  CreateProductAdditionalGroupInput,
  ProductAdditionalGroupDetail,
  UpdateProductAdditionalGroupInput,
} from "@shared/types";
import { withTransaction } from "../db/transaction";
import { ProductAdditionalGroupsRepository } from "../repositories/product-additional-groups.repository";
import { ProductAdditionalOptionsRepository } from "../repositories/product-additional-options.repository";
import { RecipesRepository } from "../repositories/recipes.repository";
import { HttpError } from "../utils/http-error";

type Executor = any;

type AdditionalGroupRow = {
  id: string;
  productRecipeId: string;
  name: string;
  selectionType: "single" | "multiple";
  minSelections: number;
  maxSelections: number;
  position: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type AdditionalOptionRow = {
  id: string;
  groupId: string;
  name: string;
  priceDeltaCents: number;
  position: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export interface ResolvedOrderItemAdditional {
  groupId: string;
  optionId: string;
  groupName: string;
  optionName: string;
  priceDeltaCents: number;
  position: number;
}

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

export class ProductAdditionalsService {
  private readonly groupsRepository = new ProductAdditionalGroupsRepository();
  private readonly optionsRepository = new ProductAdditionalOptionsRepository();
  private readonly recipesRepository = new RecipesRepository();

  async listByProductRecipeId(productRecipeId: string) {
    return this.buildGroupsDetail(productRecipeId);
  }

  async getById(id: string) {
    const group = await this.groupsRepository.findById(id);

    if (!group) {
      throw new HttpError(404, "Product additional group not found.");
    }

    const details = await this.buildGroupsDetail(group.productRecipeId);
    const match = details.find((item) => item.id === id);

    if (!match) {
      throw new HttpError(404, "Product additional group not found.");
    }

    return match;
  }

  async create(input: CreateProductAdditionalGroupInput) {
    return withTransaction(async (tx) => {
      const productRecipeId = input.productRecipeId;

      if (!productRecipeId) {
        throw new HttpError(400, "Product recipe is required.");
      }

      await this.assertProductRecipeIsSellable(productRecipeId, tx);

      const group = await this.groupsRepository.create(
        {
          productRecipeId,
          name: input.name.trim(),
          selectionType: input.selectionType,
          minSelections: input.minSelections ?? 0,
          maxSelections: input.maxSelections ?? 1,
          position: input.position ?? 0,
          notes: input.notes?.trim() || null,
        },
        tx,
      );

      await this.optionsRepository.insertMany(
        input.options.map((option, index) => ({
          groupId: group.id,
          name: option.name.trim(),
          priceDeltaCents: option.priceDeltaCents ?? 0,
          position: option.position ?? index,
          notes: option.notes?.trim() || null,
        })),
        tx,
      );

      return this.getById(group.id);
    });
  }

  async update(id: string, input: UpdateProductAdditionalGroupInput) {
    return withTransaction(async (tx) => {
      const existing = await this.groupsRepository.findById(id, tx);

      if (!existing) {
        throw new HttpError(404, "Product additional group not found.");
      }

      const productRecipeId = input.productRecipeId;

      if (!productRecipeId) {
        throw new HttpError(400, "Product recipe is required.");
      }

      await this.assertProductRecipeIsSellable(productRecipeId, tx);

      const updated = await this.groupsRepository.update(
        id,
        {
          productRecipeId,
          name: input.name.trim(),
          selectionType: input.selectionType,
          minSelections: input.minSelections ?? 0,
          maxSelections: input.maxSelections ?? 1,
          position: input.position ?? 0,
          notes: input.notes?.trim() || null,
          updatedAt: new Date(),
        },
        tx,
      );

      if (!updated) {
        throw new HttpError(404, "Product additional group not found.");
      }

      await this.optionsRepository.markDeletedByGroupId(id, new Date(), tx);
      await this.optionsRepository.insertMany(
        input.options.map((option, index) => ({
          groupId: id,
          name: option.name.trim(),
          priceDeltaCents: option.priceDeltaCents ?? 0,
          position: option.position ?? index,
          notes: option.notes?.trim() || null,
        })),
        tx,
      );

      return this.getById(id);
    });
  }

  async remove(id: string) {
    const deletedAt = new Date();

    return withTransaction(async (tx) => {
      const existing = await this.groupsRepository.findById(id, tx);

      if (!existing) {
        throw new HttpError(404, "Product additional group not found.");
      }

      await this.optionsRepository.markDeletedByGroupId(id, deletedAt, tx);
      await this.groupsRepository.markDeleted(id, deletedAt, tx);

      return {
        id,
        deletedAt: deletedAt.toISOString(),
      };
    });
  }

  async resolveOrderItemAdditionals(
    productRecipeId: string | null | undefined,
    inputs: CreateOrderItemAdditionalInput[] | undefined,
    executor?: Executor,
  ): Promise<ResolvedOrderItemAdditional[]> {
    if (!productRecipeId || !inputs || inputs.length === 0) {
      return [];
    }

    const groups = (await this.groupsRepository.listByProductRecipeId(
      productRecipeId,
      executor,
    )) as AdditionalGroupRow[];
    const options = (await this.optionsRepository.listByGroupIds(
      groups.map((group) => group.id),
      executor,
    )) as AdditionalOptionRow[];

    const groupById = new Map(groups.map((group) => [group.id, group]));
    const optionById = new Map(options.map((option) => [option.id, option]));
    const selectionCounts = new Map<string, number>();
    const seenOptions = new Set<string>();

    const resolved = inputs.map((input, index) => {
      if (seenOptions.has(input.optionId)) {
        throw new HttpError(400, "Order item has duplicate additional option.");
      }

      const group = groupById.get(input.groupId);
      if (!group) {
        throw new HttpError(
          400,
          "Additional group does not belong to the selected product.",
        );
      }

      const option = optionById.get(input.optionId);
      if (!option || option.groupId !== group.id) {
        throw new HttpError(
          400,
          "Additional option does not belong to the selected group.",
        );
      }

      seenOptions.add(input.optionId);
      selectionCounts.set(group.id, (selectionCounts.get(group.id) ?? 0) + 1);

      return {
        groupId: group.id,
        optionId: option.id,
        groupName: group.name,
        optionName: option.name,
        priceDeltaCents: option.priceDeltaCents,
        position: input.position ?? index,
      };
    });

    for (const group of groups) {
      const selectedCount = selectionCounts.get(group.id) ?? 0;

      if (selectedCount < group.minSelections) {
        throw new HttpError(
          400,
          `Grupo de adicional "${group.name}" exige pelo menos ${group.minSelections} seleção(ões).`,
        );
      }

      if (selectedCount > group.maxSelections) {
        throw new HttpError(
          400,
          `Grupo de adicional "${group.name}" aceita no máximo ${group.maxSelections} seleção(ões).`,
        );
      }

      if (group.selectionType === "single" && selectedCount > 1) {
        throw new HttpError(
          400,
          `Grupo de adicional "${group.name}" aceita apenas uma seleção.`,
        );
      }
    }

    return resolved.sort((a, b) => a.position - b.position);
  }

  private async buildGroupsDetail(productRecipeId: string, executor?: Executor) {
    const groups = (await this.groupsRepository.listByProductRecipeId(
      productRecipeId,
      executor,
    )) as AdditionalGroupRow[];
    const options = (await this.optionsRepository.listByGroupIds(
      groups.map((group) => group.id),
      executor,
    )) as AdditionalOptionRow[];

    return groups.map<ProductAdditionalGroupDetail>((group) => ({
      id: group.id,
      productRecipeId: group.productRecipeId,
      name: group.name,
      selectionType: group.selectionType,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      position: group.position,
      notes: group.notes ?? null,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
      deletedAt: toIsoString(group.deletedAt),
      options: options
        .filter((option) => option.groupId === group.id)
        .map((option) => ({
          id: option.id,
          groupId: option.groupId,
          name: option.name,
          priceDeltaCents: option.priceDeltaCents,
          position: option.position,
          notes: option.notes ?? null,
          createdAt: option.createdAt.toISOString(),
          updatedAt: option.updatedAt.toISOString(),
          deletedAt: toIsoString(option.deletedAt),
        })),
    }));
  }

  private async assertProductRecipeIsSellable(
    recipeId: string,
    executor?: Executor,
  ) {
    const recipe = await this.recipesRepository.findById(recipeId, executor);

    if (!recipe) {
      throw new HttpError(400, "Product recipe was not found.");
    }

    if (recipe.kind !== "ProdutoVenda") {
      throw new HttpError(
        400,
        "Only sellable recipes can receive additional groups.",
      );
    }
  }
}
