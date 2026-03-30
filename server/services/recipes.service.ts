import type {
  CreateRecipeInput,
  InventoryItem,
  InventoryItemUnit,
  ListRecipesFilters,
  OrderItem,
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
import { HttpError } from "../utils/http-error";

const QUANTITY_SCALE = 1000;
const ORDER_CONSUMPTION_SOURCE = "Pedido";
const ORDER_STOCK_CONSUMPTION_STATUSES = new Set(["Pronto", "Entregue"]);

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

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bovo de pascoa recheado\b/g, "ovo trufado")
    .replace(/\b(ovo de colher|ovo trufado)\s+(350|500)\b/g, "$1 $2g")
    .replace(/\s+/g, " ")
    .trim();
}

function getUnitFamily(unit: InventoryItemUnit) {
  if (unit === "g" || unit === "kg") {
    return "massa";
  }

  if (unit === "ml" || unit === "l") {
    return "volume";
  }

  if (unit === "un") {
    return "unidade";
  }

  if (unit === "caixa") {
    return "caixa";
  }

  return "desconhecido";
}

function convertQuantity(
  quantity: number,
  fromUnit: InventoryItemUnit,
  toUnit: InventoryItemUnit,
) {
  if (fromUnit === toUnit) {
    return quantity;
  }

  const fromFamily = getUnitFamily(fromUnit);
  const toFamily = getUnitFamily(toUnit);

  if (fromFamily !== toFamily) {
    throw new HttpError(
      400,
      `Recipe quantity unit ${fromUnit} is incompatible with ${toUnit}.`,
    );
  }

  if (fromFamily === "massa") {
    if (fromUnit === "kg" && toUnit === "g") return quantity * 1000;
    if (fromUnit === "g" && toUnit === "kg") return quantity / 1000;
  }

  if (fromFamily === "volume") {
    if (fromUnit === "l" && toUnit === "ml") return quantity * 1000;
    if (fromUnit === "ml" && toUnit === "l") return quantity / 1000;
  }

  throw new HttpError(
    400,
    `Recipe unit conversion from ${fromUnit} to ${toUnit} is not supported.`,
  );
}

function convertRecipeQuantityToInventoryUnits(
  quantity: number,
  fromUnit: InventoryItemUnit,
  item: InventoryItem,
) {
  if (fromUnit === item.unit) {
    return quantity;
  }

  try {
    return convertQuantity(quantity, fromUnit, item.unit);
  } catch {}

  if (
    item.recipeEquivalentQuantity != null &&
    item.recipeEquivalentUnit != null &&
    (item.unit === "un" || item.unit === "caixa")
  ) {
    const equivalentQuantity = convertQuantity(
      quantity,
      fromUnit,
      item.recipeEquivalentUnit,
    );

    return equivalentQuantity / item.recipeEquivalentQuantity;
  }

  throw new HttpError(
    400,
    `Recipe quantity unit ${fromUnit} is incompatible with inventory unit ${item.unit} for item ${item.name}.`,
  );
}

export class RecipesService {
  private readonly recipesRepository = new RecipesRepository();
  private readonly recipeComponentsRepository = new RecipeComponentsRepository();
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
        -Number(movement.quantity),
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

    if (!ORDER_STOCK_CONSUMPTION_STATUSES.has(order.status)) {
      return;
    }

    const requirements = new Map<string, number>();

    for (const orderItem of orderItems) {
      const resolvedRecipe = orderItem.recipeId
        ? {
            recipeId: orderItem.recipeId,
            fillingRecipeIds: [
              orderItem.fillingRecipeId,
              orderItem.secondaryFillingRecipeId,
              orderItem.tertiaryFillingRecipeId,
            ].filter((value): value is string => Boolean(value)),
          }
        : await this.resolveLegacyOrderItemRecipes(orderItem.productName, executor);

      if (!resolvedRecipe?.recipeId) {
        continue;
      }

      const exploded = await this.explodeRecipeToInventory(
        resolvedRecipe.recipeId,
        orderItem.quantity,
        executor,
        resolvedRecipe.fillingRecipeIds,
      );

      for (const [itemId, quantity] of Array.from(exploded.entries())) {
        requirements.set(itemId, (requirements.get(itemId) ?? 0) + quantity);
      }
    }

    for (const [itemId, quantity] of Array.from(requirements.entries())) {
      const updated = await this.inventoryItemsRepository.applyQuantityDelta(
        itemId,
        -quantity,
        new Date(),
        executor,
      );

      if (!updated) {
        throw new HttpError(
          400,
          `Order ${order.orderNumber} would make stock negative for one or more ingredients.`,
        );
      }

      await this.inventoryMovementsRepository.create(
        {
          itemId,
          type: "Saida",
          quantity: -quantity,
          reason: `Consumo automatico do pedido ${order.orderNumber}`,
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
  ): Promise<{ recipeId: string; fillingRecipeIds: string[] } | null> {
    const normalizedProductName = normalizeName(productName);

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
      (recipe) => normalizeName(recipe.name) === normalizedProductName,
    );

    if (exactProductMatch) {
      return {
        recipeId: exactProductMatch.id,
        fillingRecipeIds: [],
      };
    }

    const productParts = productName.split(/\s+-\s+/).map((part) => part.trim());
    const baseProductName = normalizeName(productParts[0] ?? productName);
    const fillingNames =
      productParts.length > 1
        ? productParts
            .slice(1)
            .join(" - ")
            .split("/")
            .map((value) => normalizeName(value))
            .filter(Boolean)
        : [];

    const baseProductMatch = sellableRecipes.find(
      (recipe) => normalizeName(recipe.name) === baseProductName,
    );

    if (!baseProductMatch) {
      return null;
    }

    const fillingRecipeIds = fillingNames
      .map(
        (fillingName) =>
          preparationRecipes.find(
            (recipe) => normalizeName(recipe.name) === fillingName,
          ) ?? null,
      )
      .filter((recipe): recipe is RecipeRow => Boolean(recipe))
      .map((recipe) => recipe.id);

    return {
      recipeId: baseProductMatch.id,
      fillingRecipeIds,
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
    };
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
    };
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
