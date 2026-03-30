import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { ApiError } from "@/api/http-client";
import { useCreateOrder } from "@/features/orders/hooks/use-create-order";
import { useOrder } from "@/features/orders/hooks/use-order";
import { useUpdateOrder } from "@/features/orders/hooks/use-update-order";
import { useRecipes } from "@/features/recipes/hooks/use-recipes";
import {
  adaptFillingRecipesToOptions,
  adaptProductRecipesToOptions,
} from "@/features/recipes/lib/recipe-list-adapter";
import {
  adaptFormStateToCreatePayload,
  adaptFormStateToUpdatePayload,
  adaptOrderDetailToFormState,
  buildOrderFormItem,
  createEmptyOrderFormState,
} from "@/features/orders/lib/order-form-adapter";
import type {
  OrderFormState,
  UiOrderStatus,
  UiPaymentMethod,
} from "@/features/orders/types/order-ui";

function createTemporaryItemId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 11);
}

function parseCurrencyInput(value: string) {
  const normalized = value.replace(",", ".").trim();
  const amount = Number.parseFloat(normalized || "0");

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return amount;
}

function buildPaymentStatusPreview(totalAmount: number, paidAmount: string) {
  const paid = parseCurrencyInput(paidAmount);

  if (paid <= 0) {
    return "Pendente";
  }

  if (paid >= totalAmount && totalAmount > 0) {
    return "Pago";
  }

  return "Parcial";
}

function normalizeValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function supportsMultipleFillings(productName: string) {
  return normalizeValue(productName).includes("ovo de colher");
}

export default function PedidoForm() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isEditing = Boolean(params?.id && params.id !== "novo");
  const orderId = isEditing ? params.id : undefined;
  const { toast } = useToast();

  const [formState, setFormState] = useState<OrderFormState>(
    createEmptyOrderFormState(),
  );
  const [newItemName, setNewItemName] = useState("");
  const [newItemQtd, setNewItemQtd] = useState("1");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemRecipeId, setNewItemRecipeId] = useState("");
  const [newItemFillingRecipeId, setNewItemFillingRecipeId] = useState("");
  const [newItemSecondaryFillingRecipeId, setNewItemSecondaryFillingRecipeId] =
    useState("");
  const [newItemTertiaryFillingRecipeId, setNewItemTertiaryFillingRecipeId] =
    useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const orderQuery = useOrder(orderId);
  const productRecipesQuery = useRecipes({ kind: "ProdutoVenda" });
  const fillingRecipesQuery = useRecipes({ kind: "Preparacao" });
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();

  const isSaving =
    createOrderMutation.isPending || updateOrderMutation.isPending;

  useEffect(() => {
    if (!isEditing) {
      setFormState(createEmptyOrderFormState());
      return;
    }

    if (orderQuery.data) {
      setFormState(adaptOrderDetailToFormState(orderQuery.data));
    }
  }, [isEditing, orderQuery.data]);

  const totalAmount = useMemo(
    () => formState.items.reduce((sum, item) => sum + item.subtotal, 0),
    [formState.items],
  );

  const paidAmountValue = useMemo(
    () => parseCurrencyInput(formState.paidAmount),
    [formState.paidAmount],
  );

  const paymentStatusPreview = useMemo(
    () => buildPaymentStatusPreview(totalAmount, formState.paidAmount),
    [formState.paidAmount, totalAmount],
  );

  const remainingAmountPreview = useMemo(
    () => Math.max(0, totalAmount - paidAmountValue),
    [paidAmountValue, totalAmount],
  );

  const productRecipeOptions = useMemo(
    () => adaptProductRecipesToOptions(productRecipesQuery.data?.data ?? []),
    [productRecipesQuery.data],
  );
  const fillingRecipeOptions = useMemo(
    () => adaptFillingRecipesToOptions(fillingRecipesQuery.data?.data ?? []),
    [fillingRecipesQuery.data],
  );

  const selectedProductRecipe = useMemo(
    () =>
      productRecipeOptions.find((recipe) => recipe.id === newItemRecipeId) ?? null,
    [newItemRecipeId, productRecipeOptions],
  );
  const fillingRecipeOptionsById = useMemo(
    () => new Map(fillingRecipeOptions.map((recipe) => [recipe.id, recipe])),
    [fillingRecipeOptions],
  );
  const allowsMultipleFillings = useMemo(
    () => supportsMultipleFillings(selectedProductRecipe?.name ?? newItemName),
    [newItemName, selectedProductRecipe],
  );
  const productSelectPlaceholder = productRecipesQuery.isLoading
    ? "Carregando produtos..."
    : productRecipesQuery.isError
      ? "Nao foi possivel carregar produtos"
      : productRecipeOptions.length === 0
        ? "Nenhum produto do catalogo cadastrado"
        : "Selecione um produto do catalogo";
  const fillingSelectPlaceholder = !newItemRecipeId
    ? "Escolha um produto primeiro"
    : fillingRecipesQuery.isLoading
      ? "Carregando recheios..."
      : fillingRecipesQuery.isError
        ? "Nao foi possivel carregar recheios"
        : fillingRecipeOptions.length === 0
          ? "Nenhum recheio disponivel"
          : "Selecione um recheio";

  const setField = <K extends keyof OrderFormState>(
    key: K,
    value: OrderFormState[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetItemComposer = () => {
    setNewItemName("");
    setNewItemQtd("1");
    setNewItemPrice("");
    setNewItemRecipeId("");
    setNewItemFillingRecipeId("");
    setNewItemSecondaryFillingRecipeId("");
    setNewItemTertiaryFillingRecipeId("");
    setEditingItemId(null);
  };

  const buildItemNameFromSelections = (
    productName: string,
    fillingIds: string[],
  ) => {
    const fillingNames = fillingIds
      .map((id) => fillingRecipeOptionsById.get(id)?.name ?? "")
      .filter(Boolean);

    return fillingNames.length > 0
      ? `${productName} - ${fillingNames.join(" / ")}`
      : productName;
  };

  const applyItemNameFromSelections = (
    productName: string,
    fillingIds: string[],
  ) => {
    setNewItemName(buildItemNameFromSelections(productName, fillingIds));
  };

  const startEditingItem = (itemId: string) => {
    const item = formState.items.find((currentItem) => currentItem.id === itemId);

    if (!item) {
      return;
    }

    setEditingItemId(item.id);
    setNewItemRecipeId(item.recipeId ?? "");
    setNewItemFillingRecipeId(item.fillingRecipeId ?? "");
    setNewItemSecondaryFillingRecipeId(item.secondaryFillingRecipeId ?? "");
    setNewItemTertiaryFillingRecipeId(item.tertiaryFillingRecipeId ?? "");
    setNewItemName(item.productName);
    setNewItemQtd(String(item.quantity));
    setNewItemPrice(String(item.unitPrice));
  };

  const handleAddItem = () => {
    if (!newItemRecipeId || !newItemName || !newItemPrice || !newItemQtd) {
      toast({
        title: "Selecione um produto",
        description: "Escolha um produto do catalogo antes de adicionar o item.",
        variant: "destructive",
      });
      return;
    }

    if (newItemRecipeId && !newItemFillingRecipeId) {
      toast({
        title: "Selecione o recheio",
        description:
          "Para produtos do catalogo, escolha tambem um recheio disponivel.",
        variant: "destructive",
      });
      return;
    }

    const quantity = Number.parseInt(newItemQtd, 10);
    const unitPrice = parseCurrencyInput(newItemPrice);
    const fillingIds = [
      newItemFillingRecipeId,
      newItemSecondaryFillingRecipeId,
      newItemTertiaryFillingRecipeId,
    ].filter((value): value is string => Boolean(value));

    if (!Number.isInteger(quantity) || quantity <= 0 || unitPrice <= 0) {
      return;
    }

    if (new Set(fillingIds).size !== fillingIds.length) {
      toast({
        title: "Recheios repetidos",
        description: "Escolha recheios diferentes no mesmo item.",
        variant: "destructive",
      });
      return;
    }

    const nextItem = buildOrderFormItem(
      editingItemId ?? createTemporaryItemId(),
      newItemRecipeId || null,
      newItemFillingRecipeId || null,
      allowsMultipleFillings ? newItemSecondaryFillingRecipeId || null : null,
      allowsMultipleFillings ? newItemTertiaryFillingRecipeId || null : null,
      buildItemNameFromSelections(selectedProductRecipe?.name ?? newItemName.trim(), fillingIds),
      quantity,
      unitPrice,
      editingItemId == null ? formState.items.length : 0,
    );

    setFormState((current) => {
      const items =
        editingItemId == null
          ? [...current.items, { ...nextItem, position: current.items.length }]
          : current.items.map((item, index) =>
              item.id === editingItemId
                ? { ...nextItem, position: index }
                : item,
            );

      return {
        ...current,
        items,
      };
    });

    resetItemComposer();
  };

  const handleRemoveItem = (id: string) => {
    setFormState((current) => ({
      ...current,
      items: current.items
        .filter((item) => item.id !== id)
        .map((item, index) => ({
          ...item,
          position: index,
        })),
    }));
  };

  const handleSave = async () => {
    if (
      !formState.customerName.trim() ||
      !formState.deliveryDate ||
      formState.items.length === 0
    ) {
      toast({
        title: "Preencha os campos obrigatórios",
        description:
          "Nome do cliente, data de entrega e pelo menos um item são necessários.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && orderId) {
        await updateOrderMutation.mutateAsync({
          id: orderId,
          payload: adaptFormStateToUpdatePayload(formState),
        });

        toast({ title: "Pedido atualizado com sucesso!" });
      } else {
        await createOrderMutation.mutateAsync(
          adaptFormStateToCreatePayload(formState),
        );

        toast({ title: "Pedido criado com sucesso!" });
      }

      setLocation("/pedidos");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Não foi possível salvar o pedido.";

      toast({
        title: "Erro ao salvar pedido",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (isEditing && orderQuery.isLoading) {
    return (
      <AppLayout title="Editar Pedido">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-card">
            <CardContent className="p-10 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando pedido...</span>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (isEditing && orderQuery.isError) {
    const message =
      orderQuery.error instanceof ApiError
        ? orderQuery.error.message
        : "Não foi possível carregar o pedido.";

    return (
      <AppLayout title="Editar Pedido">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-card">
            <CardContent className="p-10 text-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-display font-bold text-foreground">
                  Pedido indisponível
                </h2>
                <p className="text-muted-foreground">{message}</p>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => orderQuery.refetch()}>
                  Tentar novamente
                </Button>
                <Button onClick={() => setLocation("/pedidos")}>
                  Voltar para pedidos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const currentOrderNumber = orderQuery.data?.data.orderNumber;

  return (
    <AppLayout title={isEditing ? "Editar Pedido" : "Novo Pedido"}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/pedidos")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {isEditing && currentOrderNumber
                  ? `Editar Pedido ${currentOrderNumber}`
                  : "Novo Pedido"}
              </h2>
            </div>
          </div>
          <Button
            onClick={handleSave}
            className="gap-2 rounded-xl w-full md:w-auto"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Pedido
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg border-b border-border pb-2">
                  Dados do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Nome do Cliente *</Label>
                    <Input
                      id="customerName"
                      value={formState.customerName}
                      onChange={(event) =>
                        setField("customerName", event.target.value)
                      }
                      placeholder="Ex: Maria Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formState.phone}
                      onChange={(event) => setField("phone", event.target.value)}
                      placeholder="(11) 90000-0000"
                    />
                  </div>
                </div>

                <h3 className="font-bold text-lg border-b border-border pb-2 mt-6">
                  Prazos e Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryDate">Data de Entrega *</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={formState.deliveryDate}
                      onChange={(event) =>
                        setField("deliveryDate", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryTime">Horário de Entrega</Label>
                    <Input
                      id="deliveryTime"
                      type="time"
                      value={formState.deliveryTime}
                      onChange={(event) =>
                        setField("deliveryTime", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status do Pedido</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formState.status}
                      onChange={(event) =>
                        setField("status", event.target.value as UiOrderStatus)
                      }
                    >
                      <option value="Novo">Novo</option>
                      <option value="Confirmado">Confirmado</option>
                      <option value="Em produção">Em produção</option>
                      <option value="Pronto">Pronto</option>
                      <option value="Entregue">Entregue</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orderDate">Data do Pedido</Label>
                    <Input
                      id="orderDate"
                      type="date"
                      value={formState.orderDate}
                      onChange={(event) =>
                        setField("orderDate", event.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg border-b border-border pb-2">
                  Itens do Pedido
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="space-y-2 md:col-span-2 xl:col-span-2">
                    <Label>Produto do catalogo</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      value={newItemRecipeId}
                      disabled={productRecipesQuery.isLoading || productRecipesQuery.isError}
                      onChange={(event) => {
                        const selectedId = event.target.value;
                        setNewItemRecipeId(selectedId);
                        setNewItemFillingRecipeId("");

                        const selectedRecipe = productRecipeOptions.find(
                          (recipe) => recipe.id === selectedId,
                        );

                        if (selectedRecipe) {
                          applyItemNameFromSelections(selectedRecipe.name, []);
                          setNewItemPrice(
                            selectedRecipe.salePrice == null
                              ? ""
                              : selectedRecipe.salePrice.toString(),
                          );
                        } else {
                          setNewItemName("");
                          setNewItemPrice("");
                        }

                        setNewItemSecondaryFillingRecipeId("");
                        setNewItemTertiaryFillingRecipeId("");
                      }}
                    >
                      <option value="">{productSelectPlaceholder}</option>
                      {productRecipeOptions.map((recipe) => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.name} ({recipe.outputLabel})
                        </option>
                      ))}
                    </select>
                    {productRecipesQuery.isError && (
                      <p className="text-xs text-destructive">
                        Nao foi possivel carregar os produtos do catalogo.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2 xl:col-span-2">
                    <Label>Recheio</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      value={newItemFillingRecipeId}
                      onChange={(event) => {
                        const selectedId = event.target.value;
                        setNewItemFillingRecipeId(selectedId);

                        if (selectedProductRecipe) {
                          applyItemNameFromSelections(selectedProductRecipe.name, [
                            selectedId,
                            newItemSecondaryFillingRecipeId,
                            newItemTertiaryFillingRecipeId,
                          ].filter((value): value is string => Boolean(value)));
                        }
                      }}
                      disabled={
                        !newItemRecipeId ||
                        fillingRecipesQuery.isLoading ||
                        fillingRecipesQuery.isError
                      }
                    >
                      <option value="">{fillingSelectPlaceholder}</option>
                      {fillingRecipeOptions.map((recipe) => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.name} ({recipe.outputLabel})
                        </option>
                      ))}
                    </select>
                    {newItemRecipeId && fillingRecipesQuery.isError && (
                      <p className="text-xs text-destructive">
                        Nao foi possivel carregar os recheios.
                      </p>
                    )}
                  </div>
                  {allowsMultipleFillings && (
                    <div className="space-y-2 md:col-span-2 xl:col-span-2">
                      <Label>Recheio 2</Label>
                      <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        value={newItemSecondaryFillingRecipeId}
                        onChange={(event) => {
                          const selectedId = event.target.value;
                          setNewItemSecondaryFillingRecipeId(selectedId);

                          if (selectedProductRecipe) {
                            applyItemNameFromSelections(selectedProductRecipe.name, [
                              newItemFillingRecipeId,
                              selectedId,
                              newItemTertiaryFillingRecipeId,
                            ].filter((value): value is string => Boolean(value)));
                          }
                        }}
                      >
                        <option value="">Opcional</option>
                        {fillingRecipeOptions.map((recipe) => (
                          <option key={recipe.id} value={recipe.id}>
                            {recipe.name} ({recipe.outputLabel})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {allowsMultipleFillings && (
                    <div className="space-y-2 md:col-span-2 xl:col-span-2">
                      <Label>Recheio 3</Label>
                      <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        value={newItemTertiaryFillingRecipeId}
                        onChange={(event) => {
                          const selectedId = event.target.value;
                          setNewItemTertiaryFillingRecipeId(selectedId);

                          if (selectedProductRecipe) {
                            applyItemNameFromSelections(selectedProductRecipe.name, [
                              newItemFillingRecipeId,
                              newItemSecondaryFillingRecipeId,
                              selectedId,
                            ].filter((value): value is string => Boolean(value)));
                          }
                        }}
                      >
                        <option value="">Opcional</option>
                        {fillingRecipeOptions.map((recipe) => (
                          <option key={recipe.id} value={recipe.id}>
                            {recipe.name} ({recipe.outputLabel})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="rounded-xl border border-border/60 bg-background px-4 py-3 md:col-span-2 xl:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Item que sera adicionado
                    </p>
                    <p className="mt-1 font-semibold">
                      {newItemName || "Selecione produto e recheio"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Qtd.</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newItemQtd}
                      onChange={(event) => setNewItemQtd(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço Un.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newItemPrice}
                      onChange={(event) => setNewItemPrice(event.target.value)}
                      disabled={Boolean(newItemRecipeId)}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    variant="secondary"
                    className="w-full md:col-span-2 xl:self-end"
                  >
                    {editingItemId ? (
                      <Save className="w-4 h-4 mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {editingItemId ? "Salvar Item" : "Adicionar Item"}
                  </Button>
                  {editingItemId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetItemComposer}
                      className="w-full md:col-span-2 xl:self-end"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar Edicao
                    </Button>
                  )}
                </div>

                {formState.items.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                    Nenhum item adicionado ainda.
                  </div>
                ) : (
                  <div className="divide-y divide-border/50 border border-border rounded-xl overflow-hidden">
                    {formState.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 p-3 bg-card hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-sm">
                            {item.quantity}x {item.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.unitPrice)} un.
                          </p>
                          {item.recipeId && (
                            <p className="text-[11px] text-primary font-medium">
                              Vinculado a receita
                            </p>
                          )}
                          {item.fillingRecipeId && (
                            <p className="text-[11px] text-muted-foreground">
                              Recheio selecionado
                            </p>
                          )}
                          {(item.secondaryFillingRecipeId ||
                            item.tertiaryFillingRecipeId) && (
                            <p className="text-[11px] text-muted-foreground">
                              Multiplos recheios
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <span className="font-bold">
                            {formatCurrency(item.subtotal)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => startEditingItem(item.id)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 h-8 w-8"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="p-4 bg-muted/30 flex justify-between items-center font-bold text-lg">
                      <span>Total dos Itens:</span>
                      <span className="text-primary">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg border-b border-border pb-2">
                  Pagamento
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      value={formState.paymentMethod}
                      onChange={(event) =>
                        setField(
                          "paymentMethod",
                          event.target.value as UiPaymentMethod,
                        )
                      }
                    >
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de crédito">Cartão de crédito</option>
                      <option value="Cartão de débito">Cartão de débito</option>
                      <option value="Transferência">Transferência</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Pago</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formState.paidAmount}
                      onChange={(event) =>
                        setField("paidAmount", event.target.value)
                      }
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Total do Pedido:
                      </span>
                      <span className="font-bold">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor Pago:</span>
                      <span className="font-bold text-success">
                        {formatCurrency(paidAmountValue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-border/50 pt-2 mt-2">
                      <span className="text-muted-foreground">Falta Pagar:</span>
                      <span className="font-bold text-destructive">
                        {formatCurrency(remainingAmountPreview)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <span className="text-sm font-semibold">Status:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        paymentStatusPreview === "Pago"
                          ? "bg-success/10 text-success border border-success/20"
                          : paymentStatusPreview === "Parcial"
                            ? "bg-warning/10 text-warning-foreground border border-warning/20"
                            : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {paymentStatusPreview.toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg border-b border-border pb-2">
                  Observações
                </h3>
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Detalhes da decoração, restrições alimentares, etc."
                  value={formState.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
