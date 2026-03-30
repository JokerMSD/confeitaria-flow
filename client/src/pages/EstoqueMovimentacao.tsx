import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Clock,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { QuantityStepperField } from "@/components/forms/QuantityStepperField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/http-client";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { useInventoryItem } from "@/features/inventory/hooks/use-inventory-item";
import { useInventoryMovements } from "@/features/inventory/hooks/use-inventory-movements";
import { useCreateInventoryMovement } from "@/features/inventory/hooks/use-create-inventory-movement";
import {
  adaptInventoryMovementFormStateToCreatePayload,
  adaptInventoryMovementsToList,
  createEmptyInventoryMovementFormState,
  resolveInventoryPurchaseAmountCents,
  resolveInventoryPurchaseGrossPreviewCents,
  resolveInventoryPurchaseTotalPreviewCents,
} from "../features/inventory/lib/inventory-movement-adapter";
import {
  formatMoneyInput,
  parseDecimalInput,
} from "@/features/inventory/lib/inventory-input-helpers";
import type {
  InventoryMovementFormState,
  UiInventoryMovementType,
} from "@/features/inventory/types/inventory-ui";

export default function EstoqueMovimentacao() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const itemId = params.id;
  const { toast } = useToast();

  const itemQuery = useInventoryItem(itemId);
  const movementsQuery = useInventoryMovements({ itemId });
  const createMovementMutation = useCreateInventoryMovement();

  const [formState, setFormState] = useState<InventoryMovementFormState>(
    createEmptyInventoryMovementFormState(),
  );

  useEffect(() => {
    setFormState(createEmptyInventoryMovementFormState());
  }, [itemId]);

  const item = itemQuery.data?.data;
  const itemMovements = useMemo(
    () =>
      adaptInventoryMovementsToList(movementsQuery.data?.data ?? []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [movementsQuery.data],
  );

  const isSaving = createMovementMutation.isPending;
  const isIngredient = item?.category === "Ingrediente";
  const purchaseUsesUnitPrice = item?.unit === "un" || item?.unit === "caixa";
  const purchaseAmountCents = useMemo(
    () => resolveInventoryPurchaseAmountCents(formState),
    [formState],
  );
  const computedPurchaseGrossCents = useMemo(
    () => resolveInventoryPurchaseGrossPreviewCents(formState, item?.unit),
    [formState, item?.unit],
  );
  const computedPurchaseTotalCents = useMemo(
    () => resolveInventoryPurchaseTotalPreviewCents(formState, item?.unit),
    [formState, item?.unit],
  );
  const allowsPurchaseYield =
    item?.category === "Ingrediente" &&
    item.recipeEquivalentUnit != null &&
    (item.unit === "un" || item.unit === "caixa");

  const setField = <K extends keyof InventoryMovementFormState>(
    key: K,
    value: InventoryMovementFormState[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    const quantity = parseDecimalInput(formState.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({
        title: "Quantidade invalida",
        description: "A quantidade deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (!formState.reason.trim()) {
      toast({
        title: "Preencha os campos obrigatorios",
        description: "Informe um motivo para a movimentacao.",
        variant: "destructive",
      });
      return;
    }

    if (
      formState.registerPurchase &&
      (purchaseAmountCents == null || purchaseAmountCents <= 0)
    ) {
      toast({
        title: purchaseUsesUnitPrice
          ? "Preco unitario invalido"
          : "Valor de compra invalido",
        description: purchaseUsesUnitPrice
          ? "Informe um preco por unidade maior que zero para calcular o total da compra."
          : "Informe um valor maior que zero para registrar a compra no caixa.",
        variant: "destructive",
      });
      return;
    }

    if (
      formState.registerPurchase &&
      computedPurchaseTotalCents != null &&
      computedPurchaseTotalCents <= 0
    ) {
      toast({
        title: "Valor liquido invalido",
        description:
          "O total da compra apos desconto precisa ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (
      formState.purchaseEquivalentQuantity.trim() &&
      parseDecimalInput(formState.purchaseEquivalentQuantity) <= 0
    ) {
      toast({
        title: "Rendimento invalido",
        description: "Informe um rendimento total maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (item && formState.type === "Saida" && quantity > item.currentQuantity) {
      toast({
        title: "Estoque insuficiente",
        description: "A saida nao pode deixar o saldo negativo.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMovementMutation.mutateAsync({
        data: adaptInventoryMovementFormStateToCreatePayload(itemId, formState),
      });

      toast({ title: "Movimentacao registrada com sucesso!" });
      setFormState(createEmptyInventoryMovementFormState());
    } catch (error) {
      toast({
        title: "Erro ao registrar movimentacao",
        description:
          error instanceof ApiError
            ? error.message
            : "Nao foi possivel registrar a movimentacao.",
        variant: "destructive",
      });
    }
  };

  if (itemQuery.isLoading) {
    return (
      <AppLayout title="Estoque">
        <div className="max-w-4xl mx-auto">
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

  if (itemQuery.isError || !item) {
    return (
      <AppLayout title="Item nao encontrado">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-card">
            <CardContent className="p-10 text-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-display font-bold text-foreground">
                  Item indisponivel
                </h2>
                <p className="text-muted-foreground">
                  {itemQuery.error instanceof ApiError
                    ? itemQuery.error.message
                    : "O item de estoque nao foi encontrado."}
                </p>
              </div>
              <Button onClick={() => setLocation("/estoque")}>
                Voltar para Estoque
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Estoque: ${item.name}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/estoque")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-2xl font-display font-bold text-foreground line-clamp-1">
              {item.name}
            </h2>
            <p className="text-muted-foreground flex items-center gap-2 flex-wrap">
              <span className="bg-muted px-2 py-0.5 rounded text-xs font-semibold">
                {item.category}
              </span>
              <span>
                Estoque atual:{" "}
                <strong
                  className={cn(
                    item.currentQuantity <= item.minQuantity && "text-destructive",
                  )}
                >
                  {item.currentQuantity} {item.unit}
                </strong>
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card h-fit">
            <CardContent className="p-6 space-y-6">
              <h3 className="font-bold text-lg border-b border-border pb-2">
                Nova Movimentacao
              </h3>

              <div className="space-y-2">
                <Label>Tipo de Movimentacao</Label>
                <div className="flex gap-2">
                  {(["Entrada", "Saida", "Ajuste"] as UiInventoryMovementType[]).map(
                    (type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={formState.type === type ? "default" : "outline"}
                        className={cn(
                          "flex-1",
                          type === "Entrada" &&
                            formState.type === "Entrada" &&
                            "bg-success hover:bg-success/90 text-success-foreground",
                          type === "Saida" &&
                            formState.type === "Saida" &&
                            "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
                          type === "Ajuste" &&
                            formState.type === "Ajuste" &&
                            "bg-primary hover:bg-primary/90",
                        )}
                        onClick={() =>
                          setFormState((current) => ({
                            ...current,
                            type,
                            registerPurchase:
                              type === "Entrada" ? current.registerPurchase : false,
                            quantity:
                              type === "Ajuste" && current.quantity === ""
                                ? String(item.currentQuantity)
                                : current.quantity,
                          }))
                        }
                      >
                        {type}
                      </Button>
                    ),
                  )}
                </div>
              </div>

              <QuantityStepperField
                id="quantity"
                label={`${formState.type === "Ajuste" ? "Nova Quantidade Total" : "Quantidade"} (${item.unit}) *`}
                value={formState.quantity}
                onChange={(value) => setField("quantity", value)}
                placeholder="0"
                unit={item.unit}
                inputClassName="text-xl font-bold font-display py-6"
              />

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo / Observacao *</Label>
                <Input
                  id="reason"
                  value={formState.reason}
                  onChange={(event) => setField("reason", event.target.value)}
                  placeholder={
                    formState.type === "Entrada"
                      ? "Ex: Compra NF 1234"
                      : formState.type === "Saida"
                        ? "Ex: Producao Bolo Morango"
                        : "Ex: Inventario mensal"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Referencia Opcional</Label>
                <Input
                  id="reference"
                  value={formState.reference}
                  onChange={(event) => setField("reference", event.target.value)}
                  placeholder="Ex: Pedido #123, NF 456, lote..."
                />
              </div>

              {formState.type === "Entrada" && isIngredient && (
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Custo medio atual:{" "}
                  <strong className="text-foreground">
                    {item.purchaseUnitCostCents == null
                      ? "nao definido"
                      : formatCurrency((item.purchaseUnitCostCents ?? 0) / 100)}
                  </strong>
                  {allowsPurchaseYield && item.recipeEquivalentQuantity != null && (
                    <>
                      {" "}por {item.unit}. Equivalencia media atual:{" "}
                      <strong className="text-foreground">
                        {item.recipeEquivalentQuantity} {item.recipeEquivalentUnit} por {item.unit}
                      </strong>
                      .
                    </>
                  )}
                </div>
              )}

              {formState.type === "Entrada" && (
                <>
                  <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={formState.registerPurchase}
                      onChange={(event) =>
                        setField("registerPurchase", event.target.checked)
                      }
                    />
                    <span className="text-sm text-foreground">
                      Registrar esta entrada como compra e atualizar custo medio
                    </span>
                  </label>

                  {formState.registerPurchase && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="purchaseAmount">
                          {purchaseUsesUnitPrice
                            ? `Preco por ${item.unit} (R$)`
                            : "Valor total da compra (R$)"}
                        </Label>
                        <Input
                          id="purchaseAmount"
                          type="text"
                          inputMode="numeric"
                          value={formState.purchaseAmount}
                          onChange={(event) =>
                            setField(
                              "purchaseAmount",
                              formatMoneyInput(event.target.value),
                            )
                          }
                          placeholder="0,00"
                        />
                        <p className="text-xs text-muted-foreground">
                          {purchaseUsesUnitPrice
                            ? `Quantidade comprada: ${formState.quantity || "0"} ${item.unit}. Valor bruto calculado: ${formatCurrency((computedPurchaseGrossCents ?? 0) / 100)}.`
                            : "Informe o valor bruto desta compra antes de desconto."}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="purchaseDiscount">Desconto da compra (R$)</Label>
                        <Input
                          id="purchaseDiscount"
                          type="text"
                          inputMode="numeric"
                          value={formState.purchaseDiscount}
                          onChange={(event) =>
                            setField(
                              "purchaseDiscount",
                              formatMoneyInput(event.target.value),
                            )
                          }
                          placeholder="0,00"
                        />
                        <p className="text-xs text-muted-foreground">
                          Total liquido no caixa e no custo medio:{" "}
                          {formatCurrency((computedPurchaseTotalCents ?? 0) / 100)}.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Forma de Pagamento</Label>
                        <select
                          className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                          value={formState.purchasePaymentMethod}
                          onChange={(event) =>
                            setField(
                              "purchasePaymentMethod",
                              event.target.value as InventoryMovementFormState["purchasePaymentMethod"],
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
                    </div>
                  )}

                  {allowsPurchaseYield && (
                    <QuantityStepperField
                      id="purchaseEquivalentQuantity"
                      label={`Rendimento real total da compra (${item.recipeEquivalentUnit})`}
                      value={formState.purchaseEquivalentQuantity}
                      onChange={(value) =>
                        setField("purchaseEquivalentQuantity", value)
                      }
                      placeholder={
                        item.recipeEquivalentUnit === "kg" ||
                        item.recipeEquivalentUnit === "l"
                          ? "0,705"
                          : "705"
                      }
                      unit={item.recipeEquivalentUnit ?? item.unit}
                      helpText={`Use este campo quando o item e comprado em ${item.unit}, mas consumido em ${item.recipeEquivalentUnit}. Ex.: 2 unidades renderam 0,705 kg.`}
                    />
                  )}
                </>
              )}

              <Button
                onClick={handleSave}
                className="w-full gap-2 rounded-xl h-12 text-base"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Registrar
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card flex flex-col h-[500px]">
            <CardContent className="p-0 flex flex-col h-full">
              <div className="p-6 pb-4 border-b border-border">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Historico de Movimentacoes
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {movementsQuery.isLoading ? (
                  <div className="text-center p-8 text-muted-foreground h-full flex flex-col justify-center items-center">
                    <Loader2 className="w-12 h-12 mb-3 animate-spin opacity-30" />
                    <p>Carregando movimentacoes...</p>
                  </div>
                ) : movementsQuery.isError ? (
                  <div className="text-center p-8 text-muted-foreground h-full flex flex-col justify-center items-center gap-3">
                    <p>Nao foi possivel carregar o historico.</p>
                    <Button variant="outline" onClick={() => movementsQuery.refetch()}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : itemMovements.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground h-full flex flex-col justify-center items-center">
                    <RefreshCw className="w-12 h-12 mb-3 opacity-20" />
                    <p>Nenhuma movimentacao registrada.</p>
                  </div>
                ) : (
                  itemMovements.map((movement) => {
                    const isEntrada = movement.type === "Entrada";
                    const isSaida = movement.type === "Saida";
                    const signedQuantity =
                      movement.type === "Saida"
                        ? -Math.abs(movement.quantity)
                        : movement.quantity;

                    return (
                      <div
                        key={movement.id}
                        className="p-4 rounded-xl hover:bg-muted/30 transition-colors flex items-center gap-4"
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                            isEntrada
                              ? "bg-success/10 text-success border-success/20"
                              : isSaida
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : "bg-primary/10 text-primary border-primary/20",
                          )}
                        >
                          {movement.type === "Ajuste" ? (
                            <RefreshCw className="w-5 h-5" />
                          ) : isEntrada ? (
                            <ArrowUpRight className="w-5 h-5" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-sm">{movement.type}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDateTime(movement.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {movement.reason || "Sem observacao"}
                          </p>
                          {movement.reference && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {movement.reference}
                            </p>
                          )}
                        </div>

                        <div
                          className={cn(
                            "font-bold text-right shrink-0",
                            isEntrada
                              ? "text-success"
                              : isSaida
                                ? "text-destructive"
                                : "text-primary",
                          )}
                        >
                          {signedQuantity > 0 ? "+" : ""}
                          {signedQuantity} {item.unit}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
