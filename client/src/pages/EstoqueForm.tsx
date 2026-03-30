import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, Save } from "lucide-react";
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

    try {
      if (isEditing && itemId) {
        await updateInventoryMutation.mutateAsync({
          id: itemId,
          payload: adaptInventoryFormStateToUpdatePayload(formState),
        });
        toast({ title: "Item atualizado com sucesso!" });
      } else {
        await createInventoryMutation.mutateAsync(
          adaptInventoryFormStateToCreatePayload(formState),
        );
        toast({ title: "Item cadastrado com sucesso!" });
      }

      setLocation("/estoque");
    } catch (error) {
      toast({
        title: "Erro ao salvar item",
        description:
          error instanceof ApiError
            ? error.message
            : "Nao foi possivel salvar o item do estoque.",
        variant: "destructive",
      });
    }
  };

  if (isEditing && inventoryItemQuery.isLoading) {
    return (
      <AppLayout title="Editar Item">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardContent className="p-10 flex items-center justify-center gap-3 text-muted-foreground">
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
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardContent className="p-10 text-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-display font-bold text-foreground">
                  Item indisponivel
                </h2>
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/estoque")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {isEditing ? "Editar Item" : "Novo Item"}
              </h2>
            </div>
          </div>
          <Button onClick={handleSave} className="gap-2 rounded-xl" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar
          </Button>
        </div>

        <Card className="glass-card">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nome do Item *</Label>
                <Input
                  id="name"
                  value={formState.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Ex: Leite Condensado, Caixa Kraft 20x20..."
                  className="text-lg py-6"
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
                <Label>Unidade de Medida</Label>
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
                label="Quantidade Atual *"
                value={formState.currentQuantity}
                onChange={(value) => setField("currentQuantity", value)}
                placeholder="0"
                unit={formState.unit}
                inputClassName="text-xl font-bold font-display"
                helpText="Itens novos podem ser cadastrados com estoque inicial zero."
              />

              <QuantityStepperField
                id="minQuantity"
                label="Estoque Minimo (Alerta)"
                value={formState.minQuantity}
                onChange={(value) => setField("minQuantity", value)}
                placeholder="0"
                unit={formState.unit}
                inputClassName="text-xl font-bold font-display text-warning"
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
                    inputClassName="text-lg font-display"
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
                    <p className="text-xs text-muted-foreground mt-1">
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
                    className="text-lg font-display"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Toda entrada deste ingrediente vai gerar automaticamente uma saida no caixa com base neste preco.
                  </p>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Observacoes Opcionais</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
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
