import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useSearch } from "wouter/use-browser-location";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/http-client";
import { useOrderLookup } from "@/features/orders/hooks/use-order-lookup";
import { useCashTransaction } from "@/features/cash/hooks/use-cash-transaction";
import { useCreateCashTransaction } from "@/features/cash/hooks/use-create-cash-transaction";
import { useUpdateCashTransaction } from "@/features/cash/hooks/use-update-cash-transaction";
import {
  adaptCashFormStateToCreatePayload,
  adaptCashFormStateToUpdatePayload,
  adaptCashTransactionDetailToFormState,
  createEmptyCashFormState,
} from "@/features/cash/lib/cash-form-adapter";
import type {
  CashFormState,
  UiCashPaymentMethod,
  UiCashTransactionType,
} from "@/features/cash/types/cash-ui";

export default function CaixaForm() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const defaultType =
    (searchParams.get("tipo") as UiCashTransactionType | null) || "Entrada";

  const isEditing = Boolean(params?.id && params.id !== "novo");
  const transactionId = isEditing ? params.id : undefined;
  const { toast } = useToast();

  const transactionQuery = useCashTransaction(transactionId);
  const createTransactionMutation = useCreateCashTransaction();
  const updateTransactionMutation = useUpdateCashTransaction();
  const orderLookupQuery = useOrderLookup();

  const [formState, setFormState] = useState<CashFormState>(
    createEmptyCashFormState(defaultType),
  );

  const isSaving =
    createTransactionMutation.isPending || updateTransactionMutation.isPending;

  useEffect(() => {
    if (!isEditing) {
      setFormState(createEmptyCashFormState(defaultType));
      return;
    }

    if (transactionQuery.data) {
      setFormState(adaptCashTransactionDetailToFormState(transactionQuery.data));
    }
  }, [defaultType, isEditing, transactionQuery.data]);

  const setField = <K extends keyof CashFormState>(
    key: K,
    value: CashFormState[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const categoriasEntrada = ["Venda", "Sinal", "Estorno", "Outros"];
  const categoriasSaida = [
    "Insumos",
    "Embalagens",
    "Transporte",
    "Equipamentos",
    "Impostos",
    "Taxas",
    "Salários",
    "Outros",
  ];

  const handleSave = async () => {
    if (
      !formState.description.trim() ||
      !formState.amount ||
      Number.parseFloat(formState.amount.replace(",", ".")) <= 0
    ) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Descrição e um valor maior que zero são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && transactionId) {
        await updateTransactionMutation.mutateAsync({
          id: transactionId,
          payload: adaptCashFormStateToUpdatePayload(formState),
        });

        toast({ title: "Movimentação atualizada com sucesso!" });
      } else {
        await createTransactionMutation.mutateAsync(
          adaptCashFormStateToCreatePayload(formState),
        );

        toast({ title: "Movimentação registrada com sucesso!" });
      }

      setLocation("/caixa");
    } catch (error) {
      toast({
        title: "Erro ao salvar movimentação",
        description:
          error instanceof ApiError
            ? error.message
            : "Não foi possível salvar a movimentação.",
        variant: "destructive",
      });
    }
  };

  if (isEditing && transactionQuery.isLoading) {
    return (
      <AppLayout title="Editar Movimentação">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardContent className="p-10 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando movimentação...</span>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (isEditing && transactionQuery.isError) {
    return (
      <AppLayout title="Editar Movimentação">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardContent className="p-10 text-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-display font-bold text-foreground">
                  Movimentação indisponível
                </h2>
                <p className="text-muted-foreground">
                  {transactionQuery.error instanceof ApiError
                    ? transactionQuery.error.message
                    : "Não foi possível carregar a movimentação."}
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => transactionQuery.refetch()}>
                  Tentar novamente
                </Button>
                <Button onClick={() => setLocation("/caixa")}>
                  Voltar para o caixa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isEditing ? "Editar Movimentação" : `Nova ${formState.type}`}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/caixa")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {isEditing ? "Editar Movimentação" : `Nova ${formState.type}`}
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
              <div className="space-y-2">
                <Label>Tipo de Movimentação</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formState.type === "Entrada" ? "default" : "outline"}
                    className={`flex-1 ${formState.type === "Entrada" ? "bg-success hover:bg-success/90 text-success-foreground" : ""}`}
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        type: "Entrada",
                        category: "Venda",
                      }))
                    }
                  >
                    Entrada
                  </Button>
                  <Button
                    type="button"
                    variant={formState.type === "Saída" ? "default" : "outline"}
                    className={`flex-1 ${formState.type === "Saída" ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}`}
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        type: "Saída",
                        category: "Insumos",
                      }))
                    }
                  >
                    Saída
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data e Hora *</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formState.date}
                  onChange={(event) => setField("date", event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={formState.description}
                  onChange={(event) => setField("description", event.target.value)}
                  placeholder="Ex: Compra de Chocolate, Pagamento Pedido #123"
                  className="text-lg py-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formState.amount}
                  onChange={(event) => setField("amount", event.target.value)}
                  placeholder="0,00"
                  className="text-2xl font-bold font-display py-6"
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <select
                  className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formState.category}
                  onChange={(event) => setField("category", event.target.value)}
                >
                  {(formState.type === "Entrada"
                    ? categoriasEntrada
                    : categoriasSaida
                  ).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <select
                  className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formState.paymentMethod}
                  onChange={(event) =>
                    setField(
                      "paymentMethod",
                      event.target.value as UiCashPaymentMethod,
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
                <Label>Vincular a um Pedido (Opcional)</Label>
                <select
                  className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formState.orderId}
                  onChange={(event) => setField("orderId", event.target.value)}
                >
                  <option value="">Nenhum pedido vinculado</option>
                  {orderLookupQuery.isLoading && (
                    <option value="" disabled>
                      Carregando pedidos...
                    </option>
                  )}
                  {orderLookupQuery.options.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
