import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
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

  const orderQuery = useOrder(orderId);
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

  const setField = <K extends keyof OrderFormState>(
    key: K,
    value: OrderFormState[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleAddItem = () => {
    if (!newItemName || !newItemPrice || !newItemQtd) {
      return;
    }

    const quantity = Number.parseInt(newItemQtd, 10);
    const unitPrice = parseCurrencyInput(newItemPrice);

    if (!Number.isInteger(quantity) || quantity <= 0 || unitPrice <= 0) {
      return;
    }

    setFormState((current) => ({
      ...current,
      items: [
        ...current.items,
        buildOrderFormItem(
          createTemporaryItemId(),
          newItemName.trim(),
          quantity,
          unitPrice,
          current.items.length,
        ),
      ],
    }));

    setNewItemName("");
    setNewItemQtd("1");
    setNewItemPrice("");
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
        <div className="flex items-center justify-between">
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
          <Button onClick={handleSave} className="gap-2 rounded-xl" disabled={isSaving}>
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

                <div className="flex flex-col md:flex-row gap-3 items-end bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Produto</Label>
                    <Input
                      placeholder="Ex: Bolo de Cenoura"
                      value={newItemName}
                      onChange={(event) => setNewItemName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 w-full md:w-24">
                    <Label>Qtd.</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newItemQtd}
                      onChange={(event) => setNewItemQtd(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 w-full md:w-32">
                    <Label>Preço Un.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newItemPrice}
                      onChange={(event) => setNewItemPrice(event.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    variant="secondary"
                    className="w-full md:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
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
                        className="flex items-center justify-between p-3 bg-card hover:bg-muted/30"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-sm">
                            {item.quantity}x {item.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.unitPrice)} un.
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">
                            {formatCurrency(item.subtotal)}
                          </span>
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
