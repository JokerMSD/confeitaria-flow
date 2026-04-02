import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { QuantityStepperField } from "@/components/forms/QuantityStepperField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/http-client";
import { useInventoryItems } from "@/features/inventory/hooks/use-inventory-items";
import { useRecipes } from "@/features/recipes/hooks/use-recipes";
import { useRecipe } from "@/features/recipes/hooks/use-recipe";
import { useCreateRecipe } from "@/features/recipes/hooks/use-create-recipe";
import { useUpdateRecipe } from "@/features/recipes/hooks/use-update-recipe";
import {
  adaptRecipeDetailToFormState,
  adaptRecipeFormToCreatePayload,
  adaptRecipeFormToUpdatePayload,
  createEmptyRecipeAdditionalGroupState,
  createEmptyRecipeAdditionalOptionState,
  createEmptyRecipeComponentState,
  createEmptyRecipeFormState,
} from "@/features/recipes/lib/recipe-form-adapter";
import { formatMoneyInput } from "@/features/inventory/lib/inventory-input-helpers";
import type { RecipeFormState } from "@/features/recipes/types/recipe-ui";
import { formatCurrency } from "@/lib/utils";

export default function ReceitaForm() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isCatalogRoute = location.startsWith("/catalogo");
  const isEditing = Boolean(
    params?.id &&
      params.id !== "nova" &&
      params.id !== "novo",
  );
  const recipeId = isEditing ? params.id : undefined;
  const { toast } = useToast();
  const listingPath = isCatalogRoute ? "/catalogo" : "/receitas";
  const defaultKind: RecipeFormState["kind"] = isCatalogRoute
    ? "ProdutoVenda"
    : "Preparacao";
  const pageTitle = isCatalogRoute
    ? isEditing
      ? "Editar Produto"
      : "Novo Produto"
    : isEditing
      ? "Editar Receita"
      : "Nova Receita";
  const pageDescription = isCatalogRoute
    ? "Cadastre os produtos do catalogo vendidos nos pedidos."
    : "Cadastre bases, recheios e preparações usadas na produção.";

  const [formState, setFormState] = useState<RecipeFormState>(
    createEmptyRecipeFormState(defaultKind),
  );

  const recipeQuery = useRecipe(recipeId);
  const inventoryQuery = useInventoryItems({ category: "Ingrediente" });
  const recipesQuery = useRecipes();
  const createRecipeMutation = useCreateRecipe();
  const updateRecipeMutation = useUpdateRecipe();

  const isSaving =
    createRecipeMutation.isPending || updateRecipeMutation.isPending;

  useEffect(() => {
    if (!isEditing) {
      setFormState(createEmptyRecipeFormState(defaultKind));
      return;
    }

    if (recipeQuery.data) {
      setFormState(adaptRecipeDetailToFormState(recipeQuery.data));
    }
  }, [defaultKind, isEditing, recipeQuery.data]);

  const recipeSummary = recipeQuery.data?.data;
  const ingredientOptions = inventoryQuery.data?.data ?? [];
  const recipeOptions = useMemo(
    () =>
      (recipesQuery.data?.data ?? []).filter((recipe) => recipe.id !== recipeId),
    [recipeId, recipesQuery.data],
  );
  const ingredientUnitById = useMemo(
    () =>
      new Map(ingredientOptions.map((item) => [item.id, item.unit] as const)),
    [ingredientOptions],
  );
  const recipeUnitById = useMemo(
    () =>
      new Map(recipeOptions.map((recipe) => [recipe.id, recipe.outputUnit] as const)),
    [recipeOptions],
  );

  const setField = <K extends keyof RecipeFormState>(
    key: K,
    value: RecipeFormState[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const setComponentField = (
    componentId: string,
    key: keyof RecipeFormState["components"][number],
    value: string | number,
  ) => {
    setFormState((current) => ({
      ...current,
      components: current.components.map((component) =>
        component.id === componentId
          ? {
              ...component,
              [key]: value,
              ...(key === "componentType"
                ? {
                    inventoryItemId: "",
                    childRecipeId: "",
                    quantityUnit: value === "Receita" ? "un" : "g",
                  }
                : {}),
            }
          : component,
      ),
    }));
  };

  const addComponent = () => {
    setFormState((current) => ({
      ...current,
      components: [
        ...current.components,
        createEmptyRecipeComponentState("Ingrediente", current.components.length),
      ],
    }));
  };

  const setAdditionalGroupField = (
    groupId: string,
    key: keyof RecipeFormState["additionalGroups"][number],
    value: string | number,
  ) => {
    setFormState((current) => ({
      ...current,
      additionalGroups: current.additionalGroups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const nextGroup = {
          ...group,
          [key]: value,
        };

        if (key === "selectionType" && value === "single") {
          return {
            ...nextGroup,
            maxSelections: "1",
            minSelections: Number(nextGroup.minSelections || "0") > 0 ? "1" : "0",
          };
        }

        return nextGroup;
      }),
    }));
  };

  const setAdditionalOptionField = (
    groupId: string,
    optionId: string,
    key: keyof RecipeFormState["additionalGroups"][number]["options"][number],
    value: string | number | boolean,
  ) => {
    setFormState((current) => ({
      ...current,
      additionalGroups: current.additionalGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId
                  ? {
                      ...option,
                      [key]: value,
                    }
                  : option,
              ),
            }
          : group,
      ),
    }));
  };

  const addAdditionalGroup = () => {
    setFormState((current) => ({
      ...current,
      additionalGroups: [
        ...current.additionalGroups,
        createEmptyRecipeAdditionalGroupState(current.additionalGroups.length),
      ],
    }));
  };

  const removeAdditionalGroup = (groupId: string) => {
    setFormState((current) => ({
      ...current,
      additionalGroups: current.additionalGroups
        .filter((group) => group.id !== groupId)
        .map((group, index) => ({
          ...group,
          position: index,
        })),
    }));
  };

  const addAdditionalOption = (groupId: string) => {
    setFormState((current) => ({
      ...current,
      additionalGroups: current.additionalGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: [
                ...group.options,
                createEmptyRecipeAdditionalOptionState(group.options.length),
              ],
            }
          : group,
      ),
    }));
  };

  const removeAdditionalOption = (groupId: string, optionId: string) => {
    setFormState((current) => ({
      ...current,
      additionalGroups: current.additionalGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options
                .filter((option) => option.id !== optionId)
                .map((option, index) => ({
                  ...option,
                  position: index,
                })),
            }
          : group,
      ),
    }));
  };

  const handleIngredientChange = (componentId: string, inventoryItemId: string) => {
    const nextUnit = ingredientUnitById.get(inventoryItemId) ?? "g";

    setFormState((current) => ({
      ...current,
      components: current.components.map((component) =>
        component.id === componentId
          ? {
              ...component,
              inventoryItemId,
              quantityUnit: nextUnit,
            }
          : component,
      ),
    }));
  };

  const handleChildRecipeChange = (componentId: string, childRecipeId: string) => {
    const nextUnit = recipeUnitById.get(childRecipeId) ?? "un";

    setFormState((current) => ({
      ...current,
      components: current.components.map((component) =>
        component.id === componentId
          ? {
              ...component,
              childRecipeId,
              quantityUnit: nextUnit,
            }
          : component,
      ),
    }));
  };

  const removeComponent = (componentId: string) => {
    setFormState((current) => ({
      ...current,
      components: current.components
        .filter((component) => component.id !== componentId)
        .map((component, index) => ({
          ...component,
          position: index,
        })),
    }));
  };

  const handleSave = async () => {
    if (!formState.name.trim() || !formState.outputQuantity.trim()) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Nome e rendimento da receita são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formState.components.length === 0) {
      toast({
        title: "Adicione componentes",
        description: "Toda receita precisa ter pelo menos um componente.",
        variant: "destructive",
      });
      return;
    }

    if (formState.kind === "ProdutoVenda") {
      const invalidGroup = formState.additionalGroups.find((group) => {
        const activeOptions = group.options.filter((option) => option.isActive);
        const hasAnyContent =
          group.name.trim() !== "" ||
          group.options.some(
            (option) =>
              option.name.trim() !== "" ||
              option.priceDelta.trim() !== "" ||
              option.notes.trim() !== "",
          );

        if (!hasAnyContent) {
          return false;
        }

        if (!group.name.trim() || activeOptions.length === 0) {
          return true;
        }

        const minSelections = Number.parseInt(group.minSelections || "0", 10) || 0;
        const maxSelections = Number.parseInt(group.maxSelections || "0", 10) || 0;

        if (group.selectionType === "single" && maxSelections !== 1) {
          return true;
        }

        if (minSelections > maxSelections) {
          return true;
        }

        return activeOptions.some((option) => option.name.trim() === "");
      });

      if (invalidGroup) {
        toast({
          title: "Revise os adicionais",
          description:
            "Cada grupo precisa de nome, opcoes ativas validas e regras coerentes de selecao.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      if (isEditing && recipeId) {
        await updateRecipeMutation.mutateAsync({
          id: recipeId,
          payload: adaptRecipeFormToUpdatePayload(formState),
        });
        toast({ title: "Receita atualizada com sucesso!" });
      } else {
        await createRecipeMutation.mutateAsync(
          adaptRecipeFormToCreatePayload(formState),
        );
        toast({ title: "Receita criada com sucesso!" });
      }

      setLocation(listingPath);
    } catch (error) {
      toast({
        title: "Erro ao salvar receita",
        description:
          error instanceof ApiError
            ? error.message
            : "Não foi possível salvar a receita.",
        variant: "destructive",
      });
    }
  };

  if (isEditing && recipeQuery.isLoading) {
    return (
      <AppLayout title={pageTitle}>
        <div className="max-w-5xl mx-auto">
          <Card className="glass-card">
            <CardContent className="p-10 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando receita...</span>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (isEditing && recipeQuery.isError) {
    return (
      <AppLayout title={pageTitle}>
        <div className="max-w-5xl mx-auto">
          <Card className="glass-card">
            <CardContent className="p-10 text-center space-y-4">
              <p className="text-muted-foreground">
                Não foi possível carregar a receita.
              </p>
              <Button onClick={() => setLocation(listingPath)}>Voltar</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={pageTitle}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(listingPath)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {pageTitle}
              </h2>
              <p className="text-muted-foreground">
                {pageDescription}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} className="gap-2 rounded-xl" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isCatalogRoute ? "Salvar Produto" : "Salvar Receita"}
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg border-b border-border pb-2">
                  Dados da Receita
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formState.name}
                      onChange={(event) => setField("name", event.target.value)}
                      placeholder="Ex: Recheio simples"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      value={formState.kind}
                      disabled
                      onChange={(event) =>
                        setField("kind", event.target.value as RecipeFormState["kind"])
                      }
                    >
                      {isCatalogRoute ? (
                        <option value="ProdutoVenda">Produto de venda</option>
                      ) : (
                        <option value="Preparacao">Preparacao</option>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Markup (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formState.markupPercent}
                      onChange={(event) =>
                        setField("markupPercent", event.target.value)
                      }
                    />
                  </div>
                  {isCatalogRoute && (
                    <div className="space-y-2">
                      <Label>Preço praticado</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formState.salePrice}
                        onChange={(event) =>
                          setField("salePrice", formatMoneyInput(event.target.value))
                        }
                        placeholder="Ex: 39,90"
                      />
                    </div>
                  )}
                  <QuantityStepperField
                    id="outputQuantity"
                    label="Rendimento *"
                    value={formState.outputQuantity}
                    onChange={(value) => setField("outputQuantity", value)}
                    unit={formState.outputUnit}
                  />
                  <div className="space-y-2">
                    <Label>Unidade de rendimento</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      value={formState.outputUnit}
                      onChange={(event) =>
                        setField(
                          "outputUnit",
                          event.target.value as RecipeFormState["outputUnit"],
                        )
                      }
                    >
                      <option value="un">un</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="l">l</option>
                      <option value="ml">ml</option>
                      <option value="caixa">caixa</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Observações</Label>
                    <textarea
                      className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      value={formState.notes}
                      onChange={(event) => setField("notes", event.target.value)}
                      placeholder="Ex: base usada em recheios de maracuja e morango"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="font-bold text-lg">Componentes</h3>
                  <Button type="button" variant="secondary" onClick={addComponent}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar componente
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Ingredientes podem ser usados na receita mesmo com estoque atual zerado.
                  O saldo so sera validado quando houver baixa automatica por venda.
                </p>

                <div className="space-y-4">
                  {formState.components.map((component, index) => (
                    <div
                      key={component.id}
                      className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Componente {index + 1}</h4>
                        {formState.components.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => removeComponent(component.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                            value={component.componentType}
                            onChange={(event) =>
                              setComponentField(
                                component.id,
                                "componentType",
                                event.target.value,
                              )
                            }
                          >
                            <option value="Ingrediente">Ingrediente</option>
                            <option value="Receita">Receita</option>
                          </select>
                        </div>

                        <QuantityStepperField
                          id={`component-quantity-${component.id}`}
                          label="Quantidade"
                          value={component.quantity}
                          onChange={(value) =>
                            setComponentField(component.id, "quantity", value)
                          }
                          unit={component.quantityUnit}
                        />

                        <div className="space-y-2">
                          <Label>Unidade</Label>
                          <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                            value={component.quantityUnit}
                            onChange={(event) =>
                              setComponentField(
                                component.id,
                                "quantityUnit",
                                event.target.value,
                              )
                            }
                          >
                            <option value="un">un</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="l">l</option>
                            <option value="ml">ml</option>
                            <option value="caixa">caixa</option>
                          </select>
                        </div>

                        {component.componentType === "Ingrediente" ? (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Ingrediente</Label>
                            <select
                              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                              value={component.inventoryItemId}
                              onChange={(event) =>
                                handleIngredientChange(component.id, event.target.value)
                              }
                            >
                              <option value="">Selecione um ingrediente</option>
                              {ingredientOptions.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} ({item.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Receita base</Label>
                            <select
                              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                              value={component.childRecipeId}
                              onChange={(event) =>
                                handleChildRecipeChange(component.id, event.target.value)
                              }
                            >
                              <option value="">Selecione uma receita</option>
                              {recipeOptions.map((recipe) => (
                                <option key={recipe.id} value={recipe.id}>
                                  {recipe.name} ({recipe.outputQuantity} {recipe.outputUnit})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="space-y-2 md:col-span-2">
                          <Label>Observações do componente</Label>
                          <Input
                            value={component.notes}
                            onChange={(event) =>
                              setComponentField(component.id, "notes", event.target.value)
                            }
                            placeholder="Ex: recheio base do produto"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {isCatalogRoute ? (
              <Card className="glass-card">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <div>
                      <h3 className="font-bold text-lg">Adicionais do produto</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure grupos e opcoes que aparecem no pedido para este produto.
                      </p>
                    </div>
                    <Button type="button" variant="secondary" onClick={addAdditionalGroup}>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo grupo
                    </Button>
                  </div>

                  {formState.additionalGroups.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                      Nenhum adicional configurado ainda. Use grupos para recheio extra, embalagem premium, frase, laco ou extras similares.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formState.additionalGroups.map((group, groupIndex) => {
                        const activeOptions = group.options.filter((option) => option.isActive);
                        const isRequired =
                          (Number.parseInt(group.minSelections || "0", 10) || 0) > 0;

                        return (
                          <div
                            key={group.id}
                            className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h4 className="font-semibold">Grupo {groupIndex + 1}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {activeOptions.length} opcao(oes) ativa(s)
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => removeAdditionalGroup(group.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                              <div className="space-y-2 xl:col-span-2">
                                <Label>Nome do grupo</Label>
                                <Input
                                  value={group.name}
                                  onChange={(event) =>
                                    setAdditionalGroupField(group.id, "name", event.target.value)
                                  }
                                  placeholder="Ex: Embalagem premium"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Selecao</Label>
                                <select
                                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                  value={group.selectionType}
                                  onChange={(event) =>
                                    setAdditionalGroupField(
                                      group.id,
                                      "selectionType",
                                      event.target.value,
                                    )
                                  }
                                >
                                  <option value="single">Escolha unica</option>
                                  <option value="multiple">Multipla</option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                <Label>Obrigatoriedade</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    type="button"
                                    variant={isRequired ? "default" : "outline"}
                                    className="rounded-xl"
                                    onClick={() =>
                                      setAdditionalGroupField(group.id, "minSelections", "1")
                                    }
                                  >
                                    Obrigatorio
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={!isRequired ? "default" : "outline"}
                                    className="rounded-xl"
                                    onClick={() =>
                                      setAdditionalGroupField(group.id, "minSelections", "0")
                                    }
                                  >
                                    Opcional
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Ordem</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={group.position}
                                  onChange={(event) =>
                                    setAdditionalGroupField(
                                      group.id,
                                      "position",
                                      Number.parseInt(event.target.value || "0", 10),
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Minimo</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={group.minSelections}
                                  onChange={(event) =>
                                    setAdditionalGroupField(
                                      group.id,
                                      "minSelections",
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Maximo</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={group.maxSelections}
                                  disabled={group.selectionType === "single"}
                                  onChange={(event) =>
                                    setAdditionalGroupField(
                                      group.id,
                                      "maxSelections",
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-3 rounded-xl border border-border/50 bg-background/70 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <h5 className="font-semibold">Opcoes</h5>
                                  <p className="text-xs text-muted-foreground">
                                    Opcoes inativas deixam de aparecer no pedido quando o produto for salvo.
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => addAdditionalOption(group.id)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Nova opcao
                                </Button>
                              </div>

                              <div className="space-y-3">
                                {group.options.map((option, optionIndex) => (
                                  <div
                                    key={option.id}
                                    className="grid grid-cols-1 gap-3 rounded-xl border border-border/50 p-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.7fr)_160px_120px_150px_44px]"
                                  >
                                    <div className="space-y-2">
                                      <Label>Opcao {optionIndex + 1}</Label>
                                      <Input
                                        value={option.name}
                                        onChange={(event) =>
                                          setAdditionalOptionField(
                                            group.id,
                                            option.id,
                                            "name",
                                            event.target.value,
                                          )
                                        }
                                        placeholder="Ex: Laco especial"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Preco adicional</Label>
                                      <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={option.priceDelta}
                                        onChange={(event) =>
                                          setAdditionalOptionField(
                                            group.id,
                                            option.id,
                                            "priceDelta",
                                            formatMoneyInput(event.target.value),
                                          )
                                        }
                                        placeholder="0,00"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Ordem</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={option.position}
                                        onChange={(event) =>
                                          setAdditionalOptionField(
                                            group.id,
                                            option.id,
                                            "position",
                                            Number.parseInt(event.target.value || "0", 10),
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Status</Label>
                                      <Button
                                        type="button"
                                        variant={option.isActive ? "default" : "outline"}
                                        className="w-full rounded-xl"
                                        onClick={() =>
                                          setAdditionalOptionField(
                                            group.id,
                                            option.id,
                                            "isActive",
                                            !option.isActive,
                                          )
                                        }
                                      >
                                        {option.isActive ? "Ativo" : "Inativo"}
                                      </Button>
                                    </div>

                                    <div className="flex items-end">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-destructive hover:bg-destructive/10"
                                        onClick={() =>
                                          removeAdditionalOption(group.id, option.id)
                                        }
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg border-b border-border pb-2">
                  Resumo calculado
                </h3>
                {recipeSummary ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Custo total</span>
                      <span className="font-bold">
                        {formatCurrency(recipeSummary.totalCostCents / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Custo por unidade</span>
                      <span className="font-bold">
                        {formatCurrency(recipeSummary.unitCostCents / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Preço ideal</span>
                      <span className="font-bold text-primary">
                        {recipeSummary.suggestedSalePriceCents == null
                          ? "-"
                          : formatCurrency(
                              recipeSummary.suggestedSalePriceCents / 100,
                            )}
                      </span>
                    </div>
                    {recipeSummary.kind === "ProdutoVenda" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Preço praticado
                        </span>
                        <span className="font-bold">
                          {recipeSummary.effectiveSalePriceCents == null
                            ? "-"
                            : formatCurrency(
                                recipeSummary.effectiveSalePriceCents / 100,
                              )}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                      O preco ideal usa o markup configurado na receita.
                      {recipeSummary.kind === "ProdutoVenda" &&
                        " Se houver preco praticado, ele prevalece nos pedidos."}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Salve a receita para ver o custo calculado e o preco ideal.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
