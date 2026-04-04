import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { AlertTriangle, ArrowLeft, Loader2, Save } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { QuantityStepperField } from "@/components/forms/QuantityStepperField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/http-client";
import { useInventoryItem } from "@/features/inventory/hooks/use-inventory-item";
import { useCreateInventoryItem } from "@/features/inventory/hooks/use-create-inventory-item";
import { useUpdateInventoryItem } from "@/features/inventory/hooks/use-update-inventory-item";
import {
  adaptInventoryFormStateToCreatePayload,
  adaptInventoryFormStateToUpdatePayload,
  adaptInventoryItemDetailToFormState,
  createEmptyInventoryFormState,
} from "@/features/inventory/lib/inventory-form-adapter";
import type {
  InventoryFormState,
  UiInventoryCategory,
  UiInventoryUnit,
} from "@/features/inventory/types/inventory-ui";
import { formatMoneyInput } from "@/features/inventory/lib/inventory-input-helpers";

export default function EstoqueForm() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isEditing = Boolean(params?.id && params.id !== "novo");
  const itemId = isEditing ? params.id : undefined;
  const { toast } = useToast();

  const inventoryItemQuery = useInventoryItem(itemId);
  const createInventoryMutation = useCreateInventoryItem();
  const updateInventoryMutation = useUpdateInventoryItem();

  const [formState, setFormState] = useState<InventoryFormState>(
    createEmptyInventoryFormState(),
  );

  const originalFormState = useMemo(
    () =>
      inventoryItemQuery.data
        ? adaptInventoryItemDetailToFormState(inventoryItemQuery.data)
        : null,
    [inventoryItemQuery.data],
  );

  const isSaving =
    createInventoryMutation.isPending || updateInventoryMutation.isPending;
  const shouldShowRecipeEquivalentFields =
    formState.category === "Ingrediente" &&
    (formState.unit === "un" || formState.unit === "caixa");

  useEffect(() => {
    if (!isEditing) {
      setFormState(createEmptyInventoryFormState());
      return;
    }

    if (inventoryItemQuery.data) {
      setFormState(adaptInventoryItemDetailToFormState(inventoryItemQuery.data));
    }
  }, [inventoryItemQuery.data, isEditing]);

  const recalibrationChecks = useMemo(() => {
    if (!isEditing || !originalFormState) {
      return {
        hasSensitiveChanges: false,
        stockChanged: false,
        costChanged: false,
        equivalenceChanged: false,
        structureChanged: false,
      };
    }

    const stockChanged =
      formState.currentQuantity.trim() !== originalFormState.currentQuantity.trim();
    const costChanged =
      formState.purchaseUnitCost.trim() !== originalFormState.purchaseUnitCost.trim();
    const equivalenceChanged =
      formState.recipeEquivalentQuantity.trim() !==
        originalFormState.recipeEquivalentQuantity.trim() ||
      formState.recipeEquivalentUnit !== originalFormState.recipeEquivalentUnit;
    const structureChanged =
      formState.category !== originalFormState.category ||
      formState.unit !== originalFormState.unit;

    return {
      hasSensitiveChanges:
        stockChanged || costChanged || equivalenceChanged || structureChanged,
      stockChanged,
      costChanged,
      equivalenceChanged,
      structureChanged,
    };
  }, [formState, isEditing, originalFormState]);

  const setField = <K extends keyof InventoryFormState>(
    key: K,
    value: InventoryFormState[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!formState.name.trim()) {
      toast({
        title: "Preencha os campos obrigatorios",
        description: "Nome do item e obrigatorio.",
        variant: "destructive",
      });
      return;
    }

    if (
      isEditing &&
      recalibrationChecks.hasSensitiveChanges &&
      !formState.confirmRecalibration
    ) {
      toast({
        title: "Confirme a recalibracao manual",
        description:
          "Saldo, custo medio ou equivalencia mudaram. Confirme essa recalibracao antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && itemId) {
        await updateInventoryMutation.mutateAsync({
          id: itemId,
          payload: adaptInventoryFormStateToUpdatePayload(formState),
        });
        toast({ title: "Item atualizado com sucesso." });
      } else {
        await createInventoryMutation.mutateAsync(
          adaptInventoryFormStateToCreatePayload(formState),
        );
        toast({ title: "Item cadastrado com sucesso." });
      }

      setLocation("/estoque");
    } catch (error) {
      toast({
        title:
          error instanceof ApiError && error.status === 409
            ? "Item alterado em outra sessão"
            : "Erro ao salvar item",
        description:
          error instanceof ApiError
            ? error.status === 409
              ? `${error.message} Reabra o item para revisar o saldo atual antes de continuar.`
              : error.message
            : "Nao foi possivel salvar o item do estoque.",
        variant: "destructive",
      });
    }
  };

  if (isEditing && inventoryItemQuery.isLoading) {
    return (
      <AppLayout title="Editar Item">
        <div className="mx-auto max-w-2xl">
          <Card className="glass-card">
            <CardContent className="flex items-center justify-center gap-3 p-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando item...</span>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (isEditing && inventoryItemQuery.isError) {
    return (
      <AppLayout title="Editar Item">
        <div className="mx-auto max-w-2xl">
          <Card className="glass-card">
            <CardContent className="space-y-4 p-10 text-center">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Item indisponivel</h2>
                <p className="text-muted-foreground">
                  {inventoryItemQuery.error instanceof ApiError
                    ? inventoryItemQuery.error.message
                    : "Nao foi possivel carregar o item do estoque."}
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => inventoryItemQuery.refetch()}>
                  Tentar novamente
                </Button>
                <Button onClick={() => setLocation("/estoque")}>
                  Voltar para o estoque
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isEditing ? "Editar Item" : "Novo Item de Estoque"}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/estoque")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {isEditing ? "Editar Item" : "Novo Item"}
              </h2>
            </div>
          </div>
          <Button onClick={handleSave} className="gap-2 rounded-xl" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>

        <Card className="glass-card">
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nome do item *</Label>
                <Input
                  id="name"
                  value={formState.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Ex: Leite Condensado, Caixa Kraft 20x20..."
                  className="py-6 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <select
                  className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formState.category}
                  onChange={(event) =>
                    setField("category", event.target.value as UiInventoryCategory)
                  }
                >
                  <option value="Produto Pronto">Produto Pronto</option>
                  <option value="Ingrediente">Ingrediente</option>
                  <option value="Embalagem">Embalagem</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Unidade de medida</Label>
                <select
                  className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formState.unit}
                  onChange={(event) => {
                    const nextUnit = event.target.value as UiInventoryUnit;
                    setFormState((current) => ({
                      ...current,
                      unit: nextUnit,
                      recipeEquivalentQuantity:
                        nextUnit === "un" || nextUnit === "caixa"
                          ? current.recipeEquivalentQuantity
                          : "",
                    }));
                  }}
                >
                  <option value="un">Unidade (un)</option>
                  <option value="kg">Quilograma (kg)</option>
                  <option value="g">Grama (g)</option>
                  <option value="l">Litro (l)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="caixa">Caixa</option>
                </select>
              </div>

              <QuantityStepperField
                id="currentQuantity"
                label="Quantidade atual *"
                value={formState.currentQuantity}
                onChange={(value) => setField("currentQuantity", value)}
                placeholder="0"
                unit={formState.unit}
                inputClassName="text-xl font-bold"
                helpText={
                  isEditing
                    ? "Ao editar, mudar este valor gera ajuste de saldo e recalibra o item."
                    : "Itens novos podem ser cadastrados com estoque inicial zero."
                }
              />

              <QuantityStepperField
                id="minQuantity"
                label="Estoque minimo (alerta)"
                value={formState.minQuantity}
                onChange={(value) => setField("minQuantity", value)}
                placeholder="0"
                unit={formState.unit}
                inputClassName="text-xl font-bold text-warning"
                helpText="Avisaremos quando chegar neste valor."
              />

              {shouldShowRecipeEquivalentFields && (
                <>
                  <QuantityStepperField
                    id="recipeEquivalentQuantity"
                    label={`Cada ${formState.unit} equivale a quanto?`}
                    value={formState.recipeEquivalentQuantity}
                    onChange={(value) =>
                      setField("recipeEquivalentQuantity", value)
                    }
                    placeholder="Ex: 500"
                    unit={formState.recipeEquivalentUnit}
                    inputClassName="text-lg"
                  />

                  <div className="space-y-2">
                    <Label>Unidade equivalente para receitas</Label>
                    <select
                      className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      value={formState.recipeEquivalentUnit}
                      onChange={(event) =>
                        setField(
                          "recipeEquivalentUnit",
                          event.target.value as UiInventoryUnit,
                        )
                      }
                    >
                      <option value="g">Grama (g)</option>
                      <option value="kg">Quilograma (kg)</option>
                      <option value="ml">Mililitro (ml)</option>
                      <option value="l">Litro (l)</option>
                      <option value="un">Unidade (un)</option>
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Exemplo: 1 unidade de manteiga equivale a 500 g.
                    </p>
                  </div>
                </>
              )}

              {formState.category === "Ingrediente" && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="purchaseUnitCost">
                    Preco unitario de compra do ingrediente
                  </Label>
                  <Input
                    id="purchaseUnitCost"
                    type="text"
                    inputMode="numeric"
                    value={formState.purchaseUnitCost}
                    onChange={(event) =>
                      setField(
                        "purchaseUnitCost",
                        formatMoneyInput(event.target.value),
                      )
                    }
                    placeholder="0,00"
                    className="text-lg"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Este custo serve para media estimada e plano de compra. O caixa so
                    recebe compra real quando a entrada for registrada com pagamento.
                  </p>
                </div>
              )}

              {isEditing && recalibrationChecks.hasSensitiveChanges && (
                <div className="space-y-4 rounded-2xl border border-amber-300/70 bg-amber-50/80 p-4 md:col-span-2 dark:border-amber-700/60 dark:bg-amber-950/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700 dark:text-amber-300" />
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-amber-900 dark:text-amber-100">
                        Esta edicao recalibra o item
                      </p>
                      <p className="text-amber-800/90 dark:text-amber-200/90">
                        O backend vai tratar essas mudancas como recalibracao manual
                        do cadastro e do estoque.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recalibrationChecks.stockChanged && (
                          <span className="rounded-full border border-amber-300 bg-background px-2.5 py-1 text-xs font-medium">
                            Saldo atual
                          </span>
                        )}
                        {recalibrationChecks.costChanged && (
                          <span className="rounded-full border border-amber-300 bg-background px-2.5 py-1 text-xs font-medium">
                            Custo medio
                          </span>
                        )}
                        {recalibrationChecks.equivalenceChanged && (
                          <span className="rounded-full border border-amber-300 bg-background px-2.5 py-1 text-xs font-medium">
                            Equivalencia de receita
                          </span>
                        )}
                        {recalibrationChecks.structureChanged && (
                          <span className="rounded-full border border-amber-300 bg-background px-2.5 py-1 text-xs font-medium">
                            Categoria ou unidade
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recalibrationReason">Motivo da recalibracao</Label>
                    <Input
                      id="recalibrationReason"
                      value={formState.recalibrationReason}
                      onChange={(event) =>
                        setField("recalibrationReason", event.target.value)
                      }
                      placeholder="Ex: contagem fisica, correcao de custo do fornecedor..."
                    />
                  </div>

                  <label className="flex items-center gap-3 rounded-xl border border-amber-300/70 bg-background/80 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={formState.confirmRecalibration}
                      onChange={(event) =>
                        setField("confirmRecalibration", event.target.checked)
                      }
                    />
                    <span>
                      Confirmo que esta edicao recalibra manualmente saldo, custo ou
                      equivalencia deste item.
                    </span>
                  </label>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Observacoes opcionais</Label>
                <textarea
                  id="notes"
                  className="min-h-[100px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Fornecedor favorito, marca preferida, validade media..."
                  value={formState.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
