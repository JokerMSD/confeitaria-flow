import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { QuantityStepperField } from "@/components/forms/QuantityStepperField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ApiError } from "@/api/http-client";
import {
  formatMoneyInput,
  parseMoneyInputToCents,
} from "@/features/inventory/lib/inventory-input-helpers";
import { useCreateOrder } from "@/features/orders/hooks/use-create-order";
import { useOrder } from "@/features/orders/hooks/use-order";
import { useUpdateOrder } from "@/features/orders/hooks/use-update-order";
import {
  formatOrderItemAdditionalsSummary,
  getOrderItemAdditionalsUnitTotal,
} from "@/features/orders/lib/order-additionals";
import { useRecipe } from "@/features/recipes/hooks/use-recipe";
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
import { supportsMultipleFillings } from "@/features/orders/lib/order-item-composer";
import { useCustomer } from "@/features/customers/hooks/use-customer";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import type { ProductAdditionalGroupDetail } from "@shared/types";
import type {
  OrderFormItemAdditional,
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
  return (parseMoneyInputToCents(value) ?? 0) / 100;
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

function buildAdditionalGroupRule(group: ProductAdditionalGroupDetail) {
  if (group.selectionType === "single") {
    return group.minSelections > 0 ? "Escolha 1 opcao" : "Opcional";
  }

  if (group.minSelections > 0) {
    return `Escolha de ${group.minSelections} ate ${group.maxSelections}`;
  }

  return `Ate ${group.maxSelections} opcao(oes)`;
}

function getDeliveryMomentLabel(mode: OrderFormState["deliveryMode"]) {
  return mode === "Entrega" ? "entrega" : "retirada";
}

function getCustomerIdFromQueryString() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("customerId") ?? "";
}

export default function PedidoForm() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isEditing = Boolean(params?.id && params.id !== "novo");
  const orderId = isEditing ? params.id : undefined;
  const { toast } = useToast();
  const customerIdFromQuery = useMemo(() => getCustomerIdFromQueryString(), []);

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
  const [newItemAdditionals, setNewItemAdditionals] = useState<
    OrderFormItemAdditional[]
  >([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");

  const orderQuery = useOrder(orderId);
  const customerPrefillQuery = useCustomer(customerIdFromQuery);
  const customersQuery = useCustomers(customerSearch || undefined);
  const productRecipesQuery = useRecipes({ kind: "ProdutoVenda" });
  const fillingRecipesQuery = useRecipes({ kind: "Preparacao" });
  const selectedProductDetailQuery = useRecipe(newItemRecipeId || undefined);
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

  useEffect(() => {
    if (
      isEditing ||
      !customerPrefillQuery.data ||
      formState.customerId === customerPrefillQuery.data.data.id
    ) {
      return;
    }

    setFormState((current) => ({
      ...current,
      customerId: customerPrefillQuery.data!.data.id,
      customerName:
        current.customerName.trim() ||
        `${customerPrefillQuery.data!.data.firstName} ${customerPrefillQuery.data!.data.lastName}`,
      phone: current.phone.trim() || customerPrefillQuery.data!.data.phone || "",
    }));
  }, [customerPrefillQuery.data, formState.customerId, isEditing]);

  const itemsTotalAmount = useMemo(
    () => formState.items.reduce((sum, item) => sum + item.subtotal, 0),
    [formState.items],
  );

  const deliveryFeeAmount = useMemo(
    () =>
      formState.deliveryMode === "Entrega"
        ? parseCurrencyInput(formState.deliveryFee)
        : 0,
    [formState.deliveryFee, formState.deliveryMode],
  );

  const totalAmount = useMemo(
    () => itemsTotalAmount + deliveryFeeAmount,
    [deliveryFeeAmount, itemsTotalAmount],
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
  const customerOptions = useMemo(
    () => customersQuery.data?.data ?? [],
    [customersQuery.data],
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
  const selectedProductDetail = selectedProductDetailQuery.data?.data ?? null;
  const selectedProductAdditionalGroups =
    selectedProductDetail?.additionalGroups ?? [];
  const fillingRecipeOptionsById = useMemo(
    () => new Map(fillingRecipeOptions.map((recipe) => [recipe.id, recipe])),
    [fillingRecipeOptions],
  );
  const additionalsUnitTotal = useMemo(
    () => getOrderItemAdditionalsUnitTotal(newItemAdditionals),
    [newItemAdditionals],
  );
  const itemSubtotalPreview = useMemo(() => {
    const quantity = Number.parseInt(newItemQtd || "0", 10);
    const unitPrice = parseCurrencyInput(newItemPrice);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return 0;
    }

    return quantity * (unitPrice + additionalsUnitTotal);
  }, [additionalsUnitTotal, newItemPrice, newItemQtd]);
  const allowsMultipleFillings = useMemo(
    () => supportsMultipleFillings(selectedProductRecipe?.name ?? newItemName),
    [newItemName, selectedProductRecipe],
  );
  const productSelectPlaceholder = productRecipesQuery.isLoading
    ? "Carregando produtos..."
    : productRecipesQuery.isError
      ? "Não foi possível carregar produtos"
      : productRecipeOptions.length === 0
        ? "Nenhum produto do catálogo cadastrado"
        : "Selecione um produto do catálogo";
  const fillingSelectPlaceholder = !newItemRecipeId
    ? "Escolha um produto primeiro"
    : fillingRecipesQuery.isLoading
      ? "Carregando recheios..."
      : fillingRecipesQuery.isError
        ? "Não foi possível carregar recheios"
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

  const applyCustomerSelection = (customerId: string) => {
    if (!customerId) {
      setFormState((current) => ({
        ...current,
        customerId: null,
      }));
      return;
    }

    const customer = customerOptions.find((option) => option.id === customerId);

    if (!customer) {
      return;
    }

    setFormState((current) => ({
      ...current,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      phone: customer.phone ?? current.phone,
    }));
  };

  const setDeliveryMode = (mode: OrderFormState["deliveryMode"]) => {
    setFormState((current) => {
      if (mode === "Retirada") {
        return {
          ...current,
          deliveryMode: mode,
          deliveryAddress: "",
          deliveryReference: "",
          deliveryDistrict: "",
          deliveryFee: "0",
        };
      }

      return {
        ...current,
        deliveryMode: mode,
      };
    });
  };

  const getSelectedOptionIdsForGroup = (groupId: string) =>
    newItemAdditionals
      .filter((additional) => additional.groupId === groupId)
      .map((additional) => additional.optionId);

  const toggleAdditionalSelection = (
    group: NonNullable<typeof selectedProductDetail>["additionalGroups"][number],
    option: NonNullable<typeof selectedProductDetail>["additionalGroups"][number]["options"][number],
  ) => {
    setNewItemAdditionals((current) => {
      const alreadySelected = current.some(
        (additional) =>
          additional.groupId === group.id && additional.optionId === option.id,
      );
      const groupSelections = current.filter(
        (additional) => additional.groupId === group.id,
      );
      const otherSelections = current.filter(
        (additional) => additional.groupId !== group.id,
      );

      if (group.selectionType === "single") {
        if (alreadySelected) {
          return group.minSelections === 0 ? otherSelections : current;
        }

        return [
          ...otherSelections,
          {
            groupId: group.id,
            optionId: option.id,
            groupName: group.name,
            optionName: option.name,
            priceDelta: option.priceDeltaCents / 100,
            position: groupSelections.length,
          },
        ];
      }

      if (alreadySelected) {
        if (groupSelections.length <= group.minSelections) {
          return current;
        }

        return current.filter(
          (additional) =>
            !(
              additional.groupId === group.id && additional.optionId === option.id
            ),
        );
      }

      if (groupSelections.length >= group.maxSelections) {
        toast({
          title: "Limite de adicionais",
          description: `O grupo "${group.name}" aceita no maximo ${group.maxSelections} selecao(oes).`,
          variant: "destructive",
        });
        return current;
      }

      return [
        ...current,
        {
          groupId: group.id,
          optionId: option.id,
          groupName: group.name,
          optionName: option.name,
          priceDelta: option.priceDeltaCents / 100,
          position: groupSelections.length,
        },
      ];
    });
  };

  const validateAdditionalSelections = () => {
    for (const group of selectedProductAdditionalGroups) {
      const selectedCount = newItemAdditionals.filter(
        (additional) => additional.groupId === group.id,
      ).length;

      if (selectedCount < group.minSelections) {
        toast({
          title: "Selecione os adicionais obrigatorios",
          description: `O grupo "${group.name}" exige pelo menos ${group.minSelections} selecao(oes).`,
          variant: "destructive",
        });
        return false;
      }

      if (selectedCount > group.maxSelections) {
        toast({
          title: "Quantidade de adicionais invalida",
          description: `O grupo "${group.name}" aceita no maximo ${group.maxSelections} selecao(oes).`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const resetItemComposer = () => {
    setNewItemName("");
    setNewItemQtd("1");
    setNewItemPrice("");
    setNewItemRecipeId("");
    setNewItemFillingRecipeId("");
    setNewItemSecondaryFillingRecipeId("");
    setNewItemTertiaryFillingRecipeId("");
    setNewItemAdditionals([]);
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
    setNewItemAdditionals(item.additionals);
    setNewItemName(item.productName);
    setNewItemQtd(String(item.quantity));
    setNewItemPrice(formatMoneyInput(String(Math.round(item.unitPrice * 100))));
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

    if (selectedProductDetailQuery.isLoading) {
      toast({
        title: "Carregando adicionais",
        description: "Aguarde os detalhes do produto antes de adicionar o item.",
        variant: "destructive",
      });
      return;
    }

    if (selectedProductDetailQuery.isError) {
      toast({
        title: "Não foi possível carregar o produto",
        description: "Tente novamente antes de adicionar o item.",
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

    if (!validateAdditionalSelections()) {
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
      newItemAdditionals.map((additional, index) => ({
        ...additional,
        position: index,
      })),
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

    if (
      formState.deliveryMode === "Entrega" &&
      !formState.deliveryAddress.trim()
    ) {
      toast({
        title: "Endereço obrigatório",
        description:
          "Pedidos com entrega precisam de um endereço antes de salvar.",
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

      setLocation(
        formState.customerId ? `/clientes/${formState.customerId}` : "/pedidos",
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.status === 409
            ? `${error.message} Suas alterações locais ficaram desatualizadas.`
            : error.message
          : "Não foi possível salvar o pedido.";

      toast({
        title:
          error instanceof ApiError && error.status === 409
            ? "Pedido alterado em outra sessão"
            : "Erro ao salvar pedido",
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
              onClick={() =>
                setLocation(
                  !isEditing && formState.customerId
                    ? `/clientes/${formState.customerId}`
                    : "/pedidos",
                )
              }
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
                      onChange={(event) => {
                        setField("customerName", event.target.value);
                        setField("customerId", null);
                        setCustomerSearch(event.target.value);
                      }}
                      placeholder="Ex: Maria Silva"
                    />
                    <div className="space-y-2">
                      <Label htmlFor="customerLookup">Vincular cliente cadastrado</Label>
                      <select
                        id="customerLookup"
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        value={formState.customerId ?? ""}
                        onChange={(event) => applyCustomerSelection(event.target.value)}
                      >
                        <option value="">Sem vínculo explícito</option>
                        {customerOptions.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.firstName} {customer.lastName}
                            {customer.phone ? ` • ${customer.phone}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    {formState.customerId ? (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Pedido vinculado ao cadastro do cliente.
                        </p>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => {
                            setField("customerId", null);
                            setCustomerSearch("");
                          }}
                        >
                          Desvincular
                        </button>
                      </div>
                    ) : null}
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
                    <Label htmlFor="deliveryDate">
                      Data de {getDeliveryMomentLabel(formState.deliveryMode)} *
                    </Label>
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
                    <Label htmlFor="deliveryTime">
                      Horário de {getDeliveryMomentLabel(formState.deliveryMode)}
                    </Label>
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
                    <Label>Modo do Pedido</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["Entrega", "Retirada"] as const).map((mode) => (
                        <Button
                          key={mode}
                          type="button"
                          variant={
                            formState.deliveryMode === mode ? "default" : "outline"
                          }
                          className="justify-center rounded-xl"
                          onClick={() => setDeliveryMode(mode)}
                        >
                          {mode}
                        </Button>
                      ))}
                    </div>
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

                {formState.deliveryMode === "Entrega" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="deliveryAddress">Endereço de entrega *</Label>
                      <Input
                        id="deliveryAddress"
                        value={formState.deliveryAddress}
                        onChange={(event) =>
                          setField("deliveryAddress", event.target.value)
                        }
                        placeholder="Rua, número e complemento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryDistrict">Bairro</Label>
                      <Input
                        id="deliveryDistrict"
                        value={formState.deliveryDistrict}
                        onChange={(event) =>
                          setField("deliveryDistrict", event.target.value)
                        }
                        placeholder="Ex: Centro"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryFee">Taxa de entrega</Label>
                      <Input
                        id="deliveryFee"
                        type="text"
                        inputMode="numeric"
                        value={formState.deliveryFee}
                        onChange={(event) =>
                          setField("deliveryFee", formatMoneyInput(event.target.value))
                        }
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="deliveryReference">Referência</Label>
                      <Input
                        id="deliveryReference"
                        value={formState.deliveryReference}
                        onChange={(event) =>
                          setField("deliveryReference", event.target.value)
                        }
                        placeholder="Ponto de referência, bloco, apartamento..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Pedido marcado como retirada. Endereço, bairro, referência e taxa ficam fora do payload final.
                  </div>
                )}

                <div className="rounded-xl border border-border/60 bg-background px-4 py-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Resumo operacional
                  </p>
                  <div className="mt-3 space-y-2 text-foreground">
                    <p>
                      <span className="font-semibold">Modo:</span>{" "}
                      {formState.deliveryMode === "Entrega" ? "Entrega" : "Retirada"}
                    </p>
                    <p>
                      <span className="font-semibold">
                        {formState.deliveryMode === "Entrega" ? "Entrega" : "Retirada"}:
                      </span>{" "}
                      {formState.deliveryDate
                        ? `${formatDate(formState.deliveryDate)}${
                            formState.deliveryTime ? ` às ${formState.deliveryTime}` : ""
                          }`
                        : `Defina a data de ${getDeliveryMomentLabel(formState.deliveryMode)}`}
                    </p>
                    {formState.deliveryMode === "Entrega" ? (
                      <>
                        <p>
                          <span className="font-semibold">Endereço:</span>{" "}
                          {formState.deliveryAddress || "Não informado"}
                        </p>
                        <p>
                          <span className="font-semibold">Bairro:</span>{" "}
                          {formState.deliveryDistrict || "Não informado"}
                        </p>
                        <p>
                          <span className="font-semibold">Referência:</span>{" "}
                          {formState.deliveryReference || "Não informada"}
                        </p>
                        <p>
                          <span className="font-semibold">Taxa:</span>{" "}
                          {formatCurrency(deliveryFeeAmount)}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">
                        Cliente retira no local. Não haverá endereço nem taxa neste pedido.
                      </p>
                    )}
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
                    <Label>Produto do catálogo</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      value={newItemRecipeId}
                      disabled={productRecipesQuery.isLoading || productRecipesQuery.isError}
                      onChange={(event) => {
                        const selectedId = event.target.value;
                        setNewItemRecipeId(selectedId);
                        setNewItemFillingRecipeId("");
                        setNewItemAdditionals([]);

                        const selectedRecipe = productRecipeOptions.find(
                          (recipe) => recipe.id === selectedId,
                        );

                        if (selectedRecipe) {
                          applyItemNameFromSelections(selectedRecipe.name, []);
                          setNewItemPrice(
                            selectedRecipe.salePrice == null
                              ? ""
                              : formatMoneyInput(
                                  String(Math.round(selectedRecipe.salePrice * 100)),
                                ),
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
                        Não foi possível carregar os produtos do catálogo.
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
                        Não foi possível carregar os recheios.
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
                      Item que será adicionado
                    </p>
                    <p className="mt-1 font-semibold">
                      {newItemName || "Selecione produto e recheio"}
                    </p>
                    {newItemAdditionals.length > 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatOrderItemAdditionalsSummary(newItemAdditionals)}
                      </p>
                    ) : null}
                  </div>
                  <QuantityStepperField
                    id="newItemQtd"
                    label="Qtd."
                    value={newItemQtd}
                    onChange={setNewItemQtd}
                    unit="un"
                    min="1"
                  />
                  <div className="space-y-2">
                    <Label>Preço un.</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={newItemPrice}
                      onChange={(event) =>
                        setNewItemPrice(formatMoneyInput(event.target.value))
                      }
                      disabled={Boolean(newItemRecipeId)}
                    />
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background px-4 py-3 md:col-span-2 xl:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Subtotal do item
                    </p>
                    <p className="mt-1 font-semibold">{formatCurrency(itemSubtotalPreview)}</p>
                    {additionalsUnitTotal > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Inclui {formatCurrency(additionalsUnitTotal)} em adicionais por unidade.
                      </p>
                    ) : null}
                  </div>
                  {newItemRecipeId ? (
                    <div className="space-y-3 rounded-xl border border-border/60 bg-background px-4 py-4 md:col-span-2 xl:col-span-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">Adicionais</p>
                          <p className="text-xs text-muted-foreground">
                            Selecione extras configurados para este produto.
                          </p>
                        </div>
                        {selectedProductDetailQuery.isLoading ? (
                          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Carregando...
                          </span>
                        ) : null}
                      </div>

                      {selectedProductDetailQuery.isError ? (
                        <p className="text-sm text-destructive">
                          Nao foi possivel carregar os adicionais deste produto.
                        </p>
                      ) : selectedProductAdditionalGroups.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Este produto nao possui adicionais configurados.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {selectedProductAdditionalGroups.map((group) => {
                            const selectedOptionIds = new Set(
                              getSelectedOptionIdsForGroup(group.id),
                            );

                            return (
                              <div
                                key={group.id}
                                className="rounded-xl border border-border/60 bg-muted/20 p-4"
                              >
                                <div className="mb-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold">{group.name}</p>
                                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                                      {group.selectionType === "single"
                                        ? "Escolha unica"
                                        : `Ate ${group.maxSelections}`}
                                    </span>
                                    {group.minSelections > 0 ? (
                                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                                        Obrigatorio
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {buildAdditionalGroupRule(group)}
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                  {group.options.map((option) => {
                                    const isSelected = selectedOptionIds.has(option.id);

                                    return (
                                      <button
                                        key={option.id}
                                        type="button"
                                        onClick={() =>
                                          toggleAdditionalSelection(group, option)
                                        }
                                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                                          isSelected
                                            ? "border-primary bg-primary/10"
                                            : "border-border bg-background hover:bg-muted/40"
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <p className="font-medium">{option.name}</p>
                                            {option.notes ? (
                                              <p className="mt-1 text-xs text-muted-foreground">
                                                {option.notes}
                                              </p>
                                            ) : null}
                                          </div>
                                          <div className="text-sm font-semibold text-primary">
                                            {option.priceDeltaCents > 0
                                              ? `+ ${formatCurrency(
                                                  option.priceDeltaCents / 100,
                                                )}`
                                              : "Sem custo"}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}
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
                      Cancelar edição
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
                          {item.additionals.length > 0 && (
                            <p className="mt-2 text-[11px] text-primary">
                              {formatOrderItemAdditionalsSummary(item.additionals)}
                            </p>
                          )}
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
                      type="text"
                      inputMode="numeric"
                      value={formState.paidAmount}
                      onChange={(event) =>
                        setField("paidAmount", formatMoneyInput(event.target.value))
                      }
                      placeholder="0,00"
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
                      {formState.deliveryMode === "Entrega" ? (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Taxa de entrega:
                          </span>
                          <span className="font-bold">
                            {formatCurrency(deliveryFeeAmount)}
                          </span>
                        </div>
                      ) : null}
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
                  placeholder="Detalhes da decoração, restrições alimentares, sabores, embalagem, etc."
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
