import type {
  CreateRecipeInput,
  InventoryItem,
  InventoryItemUnit,
  ListRecipesFilters,
  OrderItem,
  ProductAdditionalGroupDetail,
  Recipe,
  RecipeComponentResolved,
  RecipeDetail,
  RecipeKind,
  RecipeListItem,
  RecipeLookupItem,
  UpdateRecipeInput,
} from "@shared/types";
import { withTransaction } from "../db/transaction";
import { InventoryItemsRepository } from "../repositories/inventory-items.repository";
import { InventoryMovementsRepository } from "../repositories/inventory-movements.repository";
import { RecipeComponentsRepository } from "../repositories/recipe-components.repository";
import { RecipesRepository } from "../repositories/recipes.repository";
import { ProductAdditionalGroupsRepository } from "../repositories/product-additional-groups.repository";
import { ProductAdditionalOptionsRepository } from "../repositories/product-additional-options.repository";
import {
  convertQuantity,
  convertRecipeQuantityToInventoryUnits,
  formatInventoryShortage,
  normalizeInventoryQuantity,
  normalizeRecipeName,
  shouldConsumeOrderStock,
} from "../domain/recipes/recipe-domain";
import { HttpError } from "../utils/http-error";

const QUANTITY_SCALE = 1000;
const ORDER_CONSUMPTION_SOURCE = "Pedido";

type Executor = any;
type RecipeRow = any;
type RecipeComponentRow = any;

interface RecipeCostNode {
  recipeRow: RecipeRow;
  totalCostCents: number;
  unitCostCents: number;
  suggestedSalePriceCents: number | null;
  effectiveSalePriceCents: number | null;
  hasIncompleteCost: boolean;
  components: RecipeComponentResolved[];
  ingredientUsage: Map<string, number>;
}

export interface ResolvedOrderItemRecipe {
  recipeId: string;
  fillingRecipeIds: string[];
  resolutionStrategy: "explicit" | "exact-match" | "legacy-name";
}

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

function toMilli(value: number) {
  return Math.round(value * QUANTITY_SCALE);
}

function fromMilli(value: number) {
  return Number(value) / QUANTITY_SCALE;
}

function roundCents(value: number) {
  return Math.round(value);
}

export class RecipesService {
  private readonly recipesRepository = new RecipesRepository();
  private readonly recipeComponentsRepository = new RecipeComponentsRepository();
  private readonly productAdditionalGroupsRepository =
    new ProductAdditionalGroupsRepository();
  private readonly productAdditionalOptionsRepository =
    new ProductAdditionalOptionsRepository();
  private readonly inventoryItemsRepository = new InventoryItemsRepository();
  private readonly inventoryMovementsRepository =
    new InventoryMovementsRepository();

  async list(filters: ListRecipesFilters) {
    const rows = await this.recipesRepository.list(filters);
    const cache = new Map<string, RecipeCostNode>();
    return Promise.all(
      rows.map(async (row: any) => this.buildRecipeDetail(row.id, cache)),
    );
  }

  async listLookup(kind?: RecipeKind) {
    const rows = await this.recipesRepository.list(kind ? { kind } : {});
    const cache = new Map<string, RecipeCostNode>();
    const data: RecipeLookupItem[] = [];

    for (const row of rows as any[]) {
      const detail = await this.buildRecipeDetail(row.id, cache);
      data.push({
        id: detail.id,
        name: detail.name,
        kind: detail.kind,
        outputQuantity: detail.outputQuantity,
        outputUnit: detail.outputUnit,
        totalCostCents: detail.totalCostCents,
        unitCostCents: detail.unitCostCents,
        suggestedSalePriceCents: detail.suggestedSalePriceCents,
        salePriceCents: detail.salePriceCents,
        effectiveSalePriceCents: detail.effectiveSalePriceCents,
      });
    }

    return data;
  }

  async getById(id: string) {
    return this.buildRecipeDetail(id, new Map());
  }

  async create(input: CreateRecipeInput) {
    const normalized = await this.normalizeInput(input);

    return withTransaction<RecipeDetail>(async (tx) => {
      const recipe = await this.recipesRepository.create(
        {
          name: normalized.name,
          kind: normalized.kind,
          outputQuantityMilli: normalized.outputQuantityMilli,
          outputUnit: normalized.outputUnit,
          markupPercent: normalized.markupPercent,
          salePriceCents: normalized.salePriceCents,
          notes: normalized.notes,
        },
        tx,
      );

      await this.recipeComponentsRepository.insertMany(
        normalized.components.map((component, index) => ({
          recipeId: recipe.id,
          componentType: component.componentType,
          inventoryItemId: component.inventoryItemId,
          childRecipeId: component.childRecipeId,
          quantityMilli: component.quantityMilli,
          quantityUnit: component.quantityUnit,
          position: component.position ?? index,
          notes: component.notes,
        })),
        tx,
      );

      await this.syncProductAdditionalGroups(
        recipe.id,
        normalized.kind,
        normalized.additionalGroups,
        tx,
      );

      return this.buildRecipeDetail(recipe.id, new Map(), tx);
    });
  }

  async update(id: string, input: UpdateRecipeInput) {
    const normalized = await this.normalizeInput(input, id);

    return withTransaction<RecipeDetail>(async (tx) => {
      const existing = await this.recipesRepository.findById(id, tx);

      if (!existing) {
        throw new HttpError(404, "Recipe not found.");
      }

      const updated = await this.recipesRepository.update(
        id,
        {
          name: normalized.name,
          kind: normalized.kind,
          outputQuantityMilli: normalized.outputQuantityMilli,
          outputUnit: normalized.outputUnit,
          markupPercent: normalized.markupPercent,
          salePriceCents: normalized.salePriceCents,
          notes: normalized.notes,
          updatedAt: new Date(),
        },
        tx,
      );

      if (!updated) {
        throw new HttpError(404, "Recipe not found.");
      }

      await this.recipeComponentsRepository.deleteByRecipeId(id, tx);
      await this.recipeComponentsRepository.insertMany(
        normalized.components.map((component, index) => ({
          recipeId: id,
          componentType: component.componentType,
          inventoryItemId: component.inventoryItemId,
          childRecipeId: component.childRecipeId,
          quantityMilli: component.quantityMilli,
          quantityUnit: component.quantityUnit,
          position: component.position ?? index,
          notes: component.notes,
        })),
        tx,
      );

      await this.syncProductAdditionalGroups(
        id,
        normalized.kind,
        normalized.additionalGroups,
        tx,
      );

      return this.buildRecipeDetail(id, new Map(), tx);
    });
  }

  async remove(id: string) {
    const deletedAt = new Date();
    const deleted = await this.recipesRepository.markDeleted(id, deletedAt);

    if (!deleted) {
      throw new HttpError(404, "Recipe not found.");
    }

    return {
      id: deleted.id,
      deletedAt: deletedAt.toISOString(),
    };
  }

  async assertOrderRecipesAreSellable(recipeIds: string[], executor?: Executor) {
    for (const recipeId of recipeIds) {
      const recipe = await this.recipesRepository.findById(recipeId, executor);

      if (!recipe) {
        throw new HttpError(400, "Order item recipe was not found.");
      }

      if (recipe.kind !== "ProdutoVenda") {
        throw new HttpError(
          400,
          "Only sellable recipes can be attached to order items.",
        );
      }
    }
  }

  async assertFillingRecipesArePreparations(
    recipeIds: string[],
    executor?: Executor,
  ) {
    for (const recipeId of recipeIds) {
      const recipe = await this.recipesRepository.findById(recipeId, executor);

      if (!recipe) {
        throw new HttpError(400, "Order item filling recipe was not found.");
      }

      if (recipe.kind !== "Preparacao") {
        throw new HttpError(
          400,
          "Only preparation recipes can be used as filling.",
        );
      }
    }
  }

  async syncOrderInventoryConsumption(
    order: { id: string; orderNumber: string; status: string },
    orderItems: Array<
      Pick<
        OrderItem,
        | "recipeId"
        | "fillingRecipeId"
        | "secondaryFillingRecipeId"
        | "tertiaryFillingRecipeId"
        | "quantity"
        | "productName"
      >
    >,
    executor?: Executor,
  ) {
    const existingMovements = await this.inventoryMovementsRepository.listBySource(
      ORDER_CONSUMPTION_SOURCE,
      order.id,
      executor,
    );

    for (const movement of existingMovements as any[]) {
      const reversed = await this.inventoryItemsRepository.applyQuantityDelta(
        movement.itemId,
        normalizeInventoryQuantity(-Number(movement.quantity)),
        new Date(),
        executor,
      );

      if (!reversed) {
        throw new HttpError(
          400,
          "Failed to reverse automatic stock consumption for the order.",
        );
      }
    }

    if ((existingMovements as any[]).length > 0) {
      await this.inventoryMovementsRepository.deleteBySource(
        ORDER_CONSUMPTION_SOURCE,
        order.id,
        executor,
      );
    }

    if (!shouldConsumeOrderStock(order.status)) {
      return;
    }

    const requirements = new Map<string, number>();
    let usedLegacyResolution = false;

    for (const orderItem of orderItems) {
      const resolvedRecipe = orderItem.recipeId
        ? {
            recipeId: orderItem.recipeId,
            fillingRecipeIds: [
              orderItem.fillingRecipeId,
              orderItem.secondaryFillingRecipeId,
              orderItem.tertiaryFillingRecipeId,
            ].filter((value): value is string => Boolean(value)),
            resolutionStrategy: "explicit" as const,
          }
        : await this.resolveLegacyOrderItemRecipes(orderItem.productName, executor);

      if (!resolvedRecipe?.recipeId) {
        continue;
      }

      usedLegacyResolution =
        usedLegacyResolution ||
        resolvedRecipe.resolutionStrategy === "legacy-name";

      const exploded = await this.explodeRecipeToInventory(
        resolvedRecipe.recipeId,
        orderItem.quantity,
        executor,
        resolvedRecipe.fillingRecipeIds,
      );

      for (const [itemId, quantity] of Array.from(exploded.entries())) {
        requirements.set(
          itemId,
          normalizeInventoryQuantity((requirements.get(itemId) ?? 0) + quantity),
        );
      }
    }

    const shortages: string[] = [];

    for (const [itemId, rawQuantity] of Array.from(requirements.entries())) {
      const quantity = normalizeInventoryQuantity(rawQuantity);
      const itemRow = await this.inventoryItemsRepository.findById(itemId, executor);

      if (!itemRow) {
        throw new HttpError(
          400,
          "Failed to validate automatic stock consumption for the order.",
        );
      }

      const availableQuantity = normalizeInventoryQuantity(
        Number(itemRow.currentQuantity),
      );
      const missingQuantity = normalizeInventoryQuantity(
        quantity - availableQuantity,
      );

      if (missingQuantity > 0) {
        shortages.push(
          formatInventoryShortage(this.mapInventoryItem(itemRow), missingQuantity),
        );
      }
    }

    if (shortages.length > 0) {
      const actionLabel =
        order.status === "Entregue" ? "entregue" : "pronto";

      throw new HttpError(
        400,
        `Estoque insuficiente para marcar o pedido ${order.orderNumber} como ${actionLabel}. Faltam: ${shortages.join(", ")}.`,
      );
    }

    for (const [itemId, rawQuantity] of Array.from(requirements.entries())) {
      const quantity = normalizeInventoryQuantity(rawQuantity);
      const updated = await this.inventoryItemsRepository.applyQuantityDelta(
        itemId,
        -quantity,
        new Date(),
        executor,
      );

      if (!updated) {
        const itemRow = await this.inventoryItemsRepository.findById(itemId, executor);
        const shortageDetail = itemRow
          ? formatInventoryShortage(
              this.mapInventoryItem(itemRow),
              normalizeInventoryQuantity(
                Math.max(quantity - Number(itemRow.currentQuantity), quantity),
              ),
            )
          : "ingredientes sem saldo suficiente";
        const actionLabel =
          order.status === "Entregue" ? "entregue" : "pronto";

        throw new HttpError(
          400,
          `Estoque insuficiente para marcar o pedido ${order.orderNumber} como ${actionLabel}. Faltam: ${shortageDetail}.`,
        );
      }

      await this.inventoryMovementsRepository.create(
        {
          itemId,
          type: "Saida",
          quantity: -quantity,
          reason: usedLegacyResolution
            ? `Consumo automatico do pedido ${order.orderNumber} com item legado inferido por nome`
            : `Consumo automatico do pedido ${order.orderNumber}`,
          reference: order.orderNumber,
          sourceType: ORDER_CONSUMPTION_SOURCE,
          sourceId: order.id,
          isSystemGenerated: true,
        },
        executor,
      );
    }
  }

  async resolveLegacyOrderItemRecipes(
    productName: string,
    executor?: Executor,
  ): Promise<ResolvedOrderItemRecipe | null> {
    const normalizedProductName = normalizeRecipeName(productName);

    if (!normalizedProductName) {
      return null;
    }

    const recipes = await this.recipesRepository.listAll(executor);
    const sellableRecipes = (recipes as RecipeRow[]).filter(
      (recipe) => recipe.kind === "ProdutoVenda",
    );
    const preparationRecipes = (recipes as RecipeRow[]).filter(
      (recipe) => recipe.kind === "Preparacao",
    );

    const exactProductMatch = sellableRecipes.find(
      (recipe) => normalizeRecipeName(recipe.name) === normalizedProductName,
    );

    if (exactProductMatch) {
      return {
        recipeId: exactProductMatch.id,
        fillingRecipeIds: [],
        resolutionStrategy: "exact-match",
      };
    }

    const productParts = productName.split(/\s+-\s+/).map((part) => part.trim());
    const baseProductName = normalizeRecipeName(productParts[0] ?? productName);
    const fillingNames =
      productParts.length > 1
        ? productParts
            .slice(1)
            .join(" - ")
            .split("/")
            .map((value) => normalizeRecipeName(value))
            .filter(Boolean)
        : [];

    const baseProductMatch = sellableRecipes.find(
      (recipe) => normalizeRecipeName(recipe.name) === baseProductName,
    );

    if (!baseProductMatch) {
      return null;
    }

    const fillingRecipeIds = fillingNames
      .map(
        (fillingName) =>
          preparationRecipes.find(
            (recipe) => normalizeRecipeName(recipe.name) === fillingName,
          ) ?? null,
      )
      .filter((recipe): recipe is RecipeRow => Boolean(recipe))
      .map((recipe) => recipe.id);

    return {
      recipeId: baseProductMatch.id,
      fillingRecipeIds,
      resolutionStrategy: "legacy-name",
    };
  }

  async explodeRecipeToInventory(
    recipeId: string,
    batchCount = 1,
    executor?: Executor,
    fillingRecipeIds: string[] = [],
  ) {
    const aggregation = new Map<string, number>();
    await this.collectInventoryUsage(
      recipeId,
      batchCount,
      aggregation,
      [],
      executor,
      fillingRecipeIds,
      true,
    );
    return aggregation;
  }

  private async buildRecipeDetail(
    recipeId: string,
    cache: Map<string, RecipeCostNode>,
    executor?: Executor,
  ): Promise<RecipeDetail> {
    const node = await this.computeRecipeNode(recipeId, cache, [], executor);

    return {
      ...this.mapRecipe(node.recipeRow),
      componentCount: node.components.length,
      totalCostCents: node.totalCostCents,
      unitCostCents: node.unitCostCents,
      suggestedSalePriceCents: node.suggestedSalePriceCents,
      effectiveSalePriceCents: node.effectiveSalePriceCents,
      hasIncompleteCost: node.hasIncompleteCost,
      components: node.components,
      additionalGroups: await this.listProductAdditionalGroups(recipeId, executor),
    };
  }

  private async listProductAdditionalGroups(
    recipeId: string,
    executor?: Executor,
  ): Promise<ProductAdditionalGroupDetail[]> {
    const groups = await this.productAdditionalGroupsRepository.listByProductRecipeId(
      recipeId,
      executor,
    );

    if ((groups as any[]).length === 0) {
      return [];
    }

    const options = await this.productAdditionalOptionsRepository.listByGroupIds(
      (groups as any[]).map((group) => group.id),
      executor,
    );

    const optionsByGroupId = new Map<string, any[]>();

    for (const option of options as any[]) {
      const current = optionsByGroupId.get(option.groupId) ?? [];
      current.push(option);
      optionsByGroupId.set(option.groupId, current);
    }

    return (groups as any[]).map((group) => ({
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
      options: (optionsByGroupId.get(group.id) ?? []).map((option) => ({
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

  private async computeRecipeNode(
    recipeId: string,
    cache: Map<string, RecipeCostNode>,
    stack: string[],
    executor?: Executor,
  ): Promise<RecipeCostNode> {
    if (cache.has(recipeId)) {
      return cache.get(recipeId)!;
    }

    if (stack.includes(recipeId)) {
      throw new HttpError(400, "Recipe composition cannot contain cycles.");
    }

    const nextStack = [...stack, recipeId];
    const recipe = await this.recipesRepository.findById(recipeId, executor);

    if (!recipe) {
      throw new HttpError(404, "Recipe not found.");
    }

    const componentRows = await this.recipeComponentsRepository.listByRecipeId(
      recipeId,
      executor,
    );

    const components: RecipeComponentResolved[] = [];
    const ingredientUsage = new Map<string, number>();
    let totalCostCents = 0;
    let hasIncompleteCost = false;

    for (const row of componentRows as RecipeComponentRow[]) {
      const requestedQuantity = fromMilli(row.quantityMilli);

      if (row.componentType === "Ingrediente") {
        if (!row.inventoryItemId) {
          throw new HttpError(400, "Recipe component ingredient is invalid.");
        }

        const itemRow = await this.inventoryItemsRepository.findById(
          row.inventoryItemId,
          executor,
        );

        if (!itemRow) {
          throw new HttpError(400, "Recipe component inventory item not found.");
        }

        const item = this.mapInventoryItem(itemRow);
        const inventoryQuantity = convertRecipeQuantityToInventoryUnits(
          requestedQuantity,
          row.quantityUnit,
          item,
        );
        const unitCostCents = item.purchaseUnitCostCents ?? 0;
        const componentCostCents = roundCents(unitCostCents * inventoryQuantity);

        if (item.purchaseUnitCostCents == null) {
          hasIncompleteCost = true;
        }

        totalCostCents += componentCostCents;
        ingredientUsage.set(
          item.id,
          (ingredientUsage.get(item.id) ?? 0) + inventoryQuantity,
        );
        components.push({
          ...this.mapComponent(row),
          inventoryItemName: item.name,
          inventoryItemUnit: item.unit,
          childRecipeName: null,
          childRecipeOutputUnit: null,
          sourceName: item.name,
          sourceUnit: item.unit,
          totalCostCents: componentCostCents,
          unitCostCents,
        });

        continue;
      }

      if (!row.childRecipeId) {
        throw new HttpError(400, "Recipe component child recipe is invalid.");
      }

      const childNode = await this.computeRecipeNode(
        row.childRecipeId,
        cache,
        nextStack,
        executor,
      );
      const childRecipe = this.mapRecipe(childNode.recipeRow);
      const requestedChildQuantity = convertQuantity(
        requestedQuantity,
        row.quantityUnit,
        childRecipe.outputUnit,
      );
      const usageFactor =
        childRecipe.outputQuantity > 0
          ? requestedChildQuantity / childRecipe.outputQuantity
          : 0;
      const componentCostCents = roundCents(
        childNode.totalCostCents * usageFactor,
      );
      const unitCostCents =
        childRecipe.outputQuantity > 0
          ? roundCents(childNode.totalCostCents / childRecipe.outputQuantity)
          : 0;

      totalCostCents += componentCostCents;
      hasIncompleteCost = hasIncompleteCost || childNode.hasIncompleteCost;

      for (const [itemId, quantity] of Array.from(childNode.ingredientUsage.entries())) {
        ingredientUsage.set(
          itemId,
          (ingredientUsage.get(itemId) ?? 0) + quantity * usageFactor,
        );
      }

      components.push({
        ...this.mapComponent(row),
        inventoryItemName: null,
        inventoryItemUnit: null,
        childRecipeName: childRecipe.name,
        childRecipeOutputUnit: childRecipe.outputUnit,
        sourceName: childRecipe.name,
        sourceUnit: childRecipe.outputUnit,
        totalCostCents: componentCostCents,
        unitCostCents,
      });
    }

    const recipeOutputQuantity = fromMilli(recipe.outputQuantityMilli);
    const result: RecipeCostNode = {
      recipeRow: recipe,
      totalCostCents: roundCents(totalCostCents),
      unitCostCents:
        recipeOutputQuantity > 0
          ? roundCents(totalCostCents / recipeOutputQuantity)
          : 0,
      suggestedSalePriceCents:
        recipe.kind === "ProdutoVenda"
          ? roundCents(totalCostCents * (1 + Number(recipe.markupPercent) / 100))
          : null,
      effectiveSalePriceCents:
        recipe.kind === "ProdutoVenda"
          ? recipe.salePriceCents ??
            roundCents(totalCostCents * (1 + Number(recipe.markupPercent) / 100))
          : null,
      hasIncompleteCost,
      components,
      ingredientUsage,
    };

    cache.set(recipeId, result);
    return result;
  }

  private async collectInventoryUsage(
    recipeId: string,
    batchCount: number,
    aggregation: Map<string, number>,
    stack: string[],
    executor?: Executor,
    fillingRecipeIds: string[] = [],
    allowFillingOverride = false,
  ) {
    if (stack.includes(recipeId)) {
      throw new HttpError(400, "Recipe composition cannot contain cycles.");
    }

    const nextStack = [...stack, recipeId];
    const recipe = await this.recipesRepository.findById(recipeId, executor);

    if (!recipe) {
      throw new HttpError(404, "Recipe not found.");
    }

    const components = await this.recipeComponentsRepository.listByRecipeId(
      recipeId,
      executor,
    );

    let fillingApplied = false;

    for (const component of components as RecipeComponentRow[]) {
      const requestedQuantity = fromMilli(component.quantityMilli) * batchCount;

      if (component.componentType === "Ingrediente") {
        if (!component.inventoryItemId) {
          throw new HttpError(400, "Recipe component ingredient is invalid.");
        }

        const itemRow = await this.inventoryItemsRepository.findById(
          component.inventoryItemId,
          executor,
        );

        if (!itemRow) {
          throw new HttpError(400, "Recipe component inventory item not found.");
        }

        const item = this.mapInventoryItem(itemRow);
        const inventoryQuantity = convertRecipeQuantityToInventoryUnits(
          requestedQuantity,
          component.quantityUnit,
          item,
        );

        aggregation.set(
          component.inventoryItemId,
          (aggregation.get(component.inventoryItemId) ?? 0) + inventoryQuantity,
        );
        continue;
      }

      if (!component.childRecipeId) {
        throw new HttpError(400, "Recipe component child recipe is invalid.");
      }

      const overrideFillingIds =
        allowFillingOverride && !fillingApplied ? fillingRecipeIds : [];

      if (overrideFillingIds.length > 0) {
        fillingApplied = true;

        for (const overrideFillingId of overrideFillingIds) {
          const childRecipe = await this.recipesRepository.findById(
            overrideFillingId,
            executor,
          );

          if (!childRecipe) {
            throw new HttpError(404, "Recipe component child recipe not found.");
          }

          const childOutputQuantity = fromMilli(childRecipe.outputQuantityMilli);
          const requestedChildQuantity = convertQuantity(
            requestedQuantity / overrideFillingIds.length,
            component.quantityUnit,
            childRecipe.outputUnit,
          );
          const childBatchCount =
            childOutputQuantity > 0 ? requestedChildQuantity / childOutputQuantity : 0;

          await this.collectInventoryUsage(
            overrideFillingId,
            childBatchCount,
            aggregation,
            nextStack,
            executor,
            [],
            false,
          );
        }

        continue;
      }

      const childRecipe = await this.recipesRepository.findById(
        component.childRecipeId,
        executor,
      );

      if (!childRecipe) {
        throw new HttpError(404, "Recipe component child recipe not found.");
      }

      const childOutputQuantity = fromMilli(childRecipe.outputQuantityMilli);
      const requestedChildQuantity = convertQuantity(
        requestedQuantity,
        component.quantityUnit,
        childRecipe.outputUnit,
      );
      const childBatchCount =
        childOutputQuantity > 0 ? requestedChildQuantity / childOutputQuantity : 0;

      await this.collectInventoryUsage(
        component.childRecipeId,
        childBatchCount,
        aggregation,
        nextStack,
        executor,
        [],
        false,
      );
    }
  }

  private async normalizeInput(
    input: CreateRecipeInput | UpdateRecipeInput,
    currentRecipeId?: string,
  ) {
    const name = input.name.trim();
    const notes = input.notes?.trim() || null;

    if (!name) {
      throw new HttpError(400, "Recipe name is required.");
    }

    if (!Number.isFinite(input.outputQuantity) || input.outputQuantity <= 0) {
      throw new HttpError(400, "Recipe outputQuantity must be greater than zero.");
    }

    if (!Number.isInteger(input.markupPercent) || input.markupPercent < 0) {
      throw new HttpError(
        400,
        "Recipe markupPercent must be a non-negative integer.",
      );
    }

    if (
      input.salePriceCents != null &&
      (!Number.isInteger(input.salePriceCents) || input.salePriceCents < 0)
    ) {
      throw new HttpError(
        400,
        "Recipe salePriceCents must be a non-negative integer.",
      );
    }

    if (
      input.kind === "ProdutoVenda" &&
      (input.outputUnit !== "un" || input.outputQuantity !== 1)
    ) {
      throw new HttpError(
        400,
        "Sellable recipes must have outputQuantity 1 and outputUnit un.",
      );
    }

    const components = input.components.map((component, index) => {
      const componentNotes = component.notes?.trim() || null;

      if (!Number.isFinite(component.quantity) || component.quantity <= 0) {
        throw new HttpError(
          400,
          "Recipe component quantity must be greater than zero.",
        );
      }

      if (
        component.componentType === "Ingrediente" &&
        !component.inventoryItemId
      ) {
        throw new HttpError(
          400,
          "Recipe ingredient component requires inventoryItemId.",
        );
      }

      if (component.componentType === "Receita" && !component.childRecipeId) {
        throw new HttpError(
          400,
          "Recipe child recipe component requires childRecipeId.",
        );
      }

      if (
        currentRecipeId &&
        component.componentType === "Receita" &&
        component.childRecipeId === currentRecipeId
      ) {
        throw new HttpError(400, "Recipe cannot reference itself as a component.");
      }

      return {
        componentType: component.componentType,
        inventoryItemId:
          component.componentType === "Ingrediente"
            ? component.inventoryItemId ?? null
            : null,
        childRecipeId:
          component.componentType === "Receita"
            ? component.childRecipeId ?? null
            : null,
        quantityMilli: toMilli(component.quantity),
        quantityUnit: component.quantityUnit,
        position: component.position ?? index,
        notes: componentNotes,
      };
    });

    if (components.length === 0) {
      throw new HttpError(400, "Recipe must have at least one component.");
    }

    return {
      name,
      kind: input.kind,
      outputUnit: input.outputUnit,
      outputQuantityMilli: toMilli(input.outputQuantity),
      markupPercent: input.markupPercent,
      salePriceCents: input.salePriceCents ?? null,
      notes,
      components,
      additionalGroups:
        input.kind === "ProdutoVenda"
          ? (input.additionalGroups ?? []).map((group, index) => ({
              name: group.name.trim(),
              selectionType: group.selectionType,
              minSelections: group.minSelections ?? 0,
              maxSelections: group.maxSelections ?? 1,
              position: group.position ?? index,
              notes: group.notes?.trim() || null,
              options: group.options.map((option, optionIndex) => ({
                name: option.name.trim(),
                priceDeltaCents: option.priceDeltaCents ?? 0,
                position: option.position ?? optionIndex,
                notes: option.notes?.trim() || null,
              })),
            }))
          : [],
    };
  }

  private async syncProductAdditionalGroups(
    recipeId: string,
    kind: RecipeKind,
    groups: Array<{
      name: string;
      selectionType: "single" | "multiple";
      minSelections: number;
      maxSelections: number;
      position: number;
      notes: string | null;
      options: Array<{
        name: string;
        priceDeltaCents: number;
        position: number;
        notes: string | null;
      }>;
    }>,
    executor?: Executor,
  ) {
    const existingGroups = await this.productAdditionalGroupsRepository.listByProductRecipeId(
      recipeId,
      executor,
    );

    for (const existingGroup of existingGroups as any[]) {
      await this.productAdditionalOptionsRepository.markDeletedByGroupId(
        existingGroup.id,
        new Date(),
        executor,
      );
      await this.productAdditionalGroupsRepository.markDeleted(
        existingGroup.id,
        new Date(),
        executor,
      );
    }

    if (kind !== "ProdutoVenda" || groups.length === 0) {
      return;
    }

    for (const group of groups) {
      const createdGroup = await this.productAdditionalGroupsRepository.create(
        {
          productRecipeId: recipeId,
          name: group.name,
          selectionType: group.selectionType,
          minSelections: group.minSelections,
          maxSelections: group.maxSelections,
          position: group.position,
          notes: group.notes,
        },
        executor,
      );

      await this.productAdditionalOptionsRepository.insertMany(
        group.options.map((option) => ({
          groupId: createdGroup.id,
          name: option.name,
          priceDeltaCents: option.priceDeltaCents,
          position: option.position,
          notes: option.notes,
        })),
        executor,
      );
    }
  }

  private mapRecipe(row: RecipeRow): Recipe {
    return {
      id: row.id,
      name: row.name,
      kind: row.kind as RecipeKind,
      outputQuantity: fromMilli(row.outputQuantityMilli),
      outputUnit: row.outputUnit as InventoryItemUnit,
      markupPercent: row.markupPercent,
      salePriceCents:
        row.salePriceCents == null ? null : Number(row.salePriceCents),
      notes: row.notes ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      deletedAt: toIsoString(row.deletedAt),
    };
  }

  private mapComponent(row: RecipeComponentRow) {
    return {
      id: row.id,
      recipeId: row.recipeId,
      componentType: row.componentType as "Ingrediente" | "Receita",
      inventoryItemId: row.inventoryItemId ?? null,
      inventoryItemName: null,
      inventoryItemUnit: null,
      childRecipeId: row.childRecipeId ?? null,
      childRecipeName: null,
      childRecipeOutputUnit: null,
      quantity: fromMilli(row.quantityMilli),
      quantityUnit: row.quantityUnit as InventoryItemUnit,
      position: row.position,
      notes: row.notes ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapInventoryItem(row: any): InventoryItem {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      currentQuantity: Number(row.currentQuantity),
      minQuantity: Number(row.minQuantity),
      unit: row.unit,
      recipeEquivalentQuantity:
        row.recipeEquivalentQuantity == null
          ? null
          : Number(row.recipeEquivalentQuantity),
      recipeEquivalentUnit: row.recipeEquivalentUnit ?? null,
      purchaseUnitCostCents:
        row.purchaseUnitCostCents == null
          ? null
          : Number(row.purchaseUnitCostCents),
      notes: row.notes ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      deletedAt: toIsoString(row.deletedAt),
    };
  }
}
