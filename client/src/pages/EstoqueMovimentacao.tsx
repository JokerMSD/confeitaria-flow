import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BadgeDollarSign,
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
  InventoryMovementListItem,
  UiInventoryMovementType,
} from "@/features/inventory/types/inventory-ui";

const originBadgeMap: Record<
  InventoryMovementListItem["originKind"],
  { className: string; label: string }
> = {
  Manual: {
    className: "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200",
    label: "Manual",
  },
  Pedido: {
    className: "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-200",
    label: "Pedido",
  },
  AjusteAutomatico: {
    className: "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
    label: "Ajuste automático",
  },
  Compra: {
    className: "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
    label: "Compra",
  },
  Sistema: {
    className: "border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200",
    label: "Sistema",
  },
};

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
      formState.registerPurchaseCost &&
      (purchaseAmountCents == null || purchaseAmountCents <= 0)
    ) {
      toast({
        title: purchaseUsesUnitPrice
          ? "Preco unitario invalido"
          : "Valor de compra invalido",
        description: purchaseUsesUnitPrice
          ? "Informe um preco por unidade maior que zero para calcular o total da compra."
          : "Informe um valor maior que zero para registrar o custo da compra.",
        variant: "destructive",
      });
      return;
    }

    if (
      formState.registerPurchaseCost &&
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

      toast({ title: "Movimentacao registrada com sucesso." });
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
        <div className="mx-auto max-w-4xl">
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

  if (itemQuery.isError || !item) {
    return (
      <AppLayout title="Item nao encontrado">
        <div className="mx-auto max-w-4xl">
          <Card className="glass-card">
            <CardContent className="space-y-4 p-10 text-center">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Item indisponivel</h2>
                <p className="text-muted-foreground">
                  {itemQuery.error instanceof ApiError
                    ? itemQuery.error.message
                    : "O item de estoque nao foi encontrado."}
                </p>
              </div>
              <Button onClick={() => setLocation("/estoque")}>
                Voltar para estoque
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Estoque: ${item.name}`}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/estoque")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h2 className="line-clamp-1 text-2xl font-bold text-foreground">
              {item.name}
            </h2>
            <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="glass-card h-fit">
            <CardContent className="space-y-6 p-6">
              <h3 className="border-b border-border pb-2 text-lg font-bold">
                Nova movimentacao
              </h3>

              <div className="space-y-2">
                <Label>Tipo de movimentacao</Label>
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
                            "bg-success text-success-foreground hover:bg-success/90",
                          type === "Saida" &&
                            formState.type === "Saida" &&
                            "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                          type === "Ajuste" &&
                            formState.type === "Ajuste" &&
                            "bg-primary hover:bg-primary/90",
                        )}
                        onClick={() =>
                          setFormState((current) => ({
                            ...current,
                            type,
                            registerPurchaseCost:
                              type === "Entrada" ? current.registerPurchaseCost : false,
                            registerCashExpense:
                              type === "Entrada" ? current.registerCashExpense : false,
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
                label={`${formState.type === "Ajuste" ? "Nova quantidade total" : "Quantidade"} (${item.unit}) *`}
                value={formState.quantity}
                onChange={(value) => setField("quantity", value)}
                placeholder="0"
                unit={item.unit}
                inputClassName="py-6 text-xl font-bold"
              />

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo / observacao *</Label>
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
                <Label htmlFor="reference">Referencia opcional</Label>
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
                        {item.recipeEquivalentQuantity} {item.recipeEquivalentUnit} por{" "}
                        {item.unit}
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
                      checked={formState.registerPurchaseCost}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          registerPurchaseCost: event.target.checked,
                          registerCashExpense: event.target.checked
                            ? current.registerCashExpense
                            : false,
                        }))
                      }
                    />
                    <span className="text-sm text-foreground">
                      Usar esta entrada para atualizar custo medio e rendimento
                    </span>
                  </label>

                  {formState.registerPurchaseCost && (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                            Custo liquido considerado na media:{" "}
                            {formatCurrency((computedPurchaseTotalCents ?? 0) / 100)}.
                          </p>
                        </div>

                        <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-100">
                          <div className="flex items-center gap-2 font-semibold">
                            <BadgeDollarSign className="h-4 w-4" />
                            Financeiro real separado
                          </div>
                          <p className="mt-1 text-xs leading-5 text-emerald-800/90 dark:text-emerald-200/90">
                            Sem marcar a opcao abaixo, esta entrada atualiza apenas
                            custo e rendimento. O caixa nao recebe nenhuma saida.
                          </p>
                        </div>
                      </div>

                      <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={formState.registerCashExpense}
                          onChange={(event) =>
                            setField("registerCashExpense", event.target.checked)
                          }
                        />
                        <span className="text-sm text-foreground">
                          Tambem lancar no caixa como compra real paga agora
                        </span>
                      </label>

                      {formState.registerCashExpense && (
                        <div className="space-y-2">
                          <Label>Forma de pagamento</Label>
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
                </>
              )}

              <Button
                onClick={handleSave}
                className="h-12 w-full gap-2 rounded-xl text-base"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                Registrar
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card flex h-[560px] flex-col">
            <CardContent className="flex h-full flex-col p-0">
              <div className="border-b border-border p-6 pb-4">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Historico de movimentacoes
                </h3>
              </div>

              <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-2">
                {movementsQuery.isLoading ? (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <Loader2 className="mb-3 h-12 w-12 animate-spin opacity-30" />
                    <p>Carregando movimentacoes...</p>
                  </div>
                ) : movementsQuery.isError ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                    <p>Nao foi possivel carregar o historico.</p>
                    <Button variant="outline" onClick={() => movementsQuery.refetch()}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : itemMovements.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <RefreshCw className="mb-3 h-12 w-12 opacity-20" />
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
                    const originBadge = originBadgeMap[movement.originKind];

                    return (
                      <div
                        key={movement.id}
                        className="space-y-3 rounded-xl p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                              isEntrada
                                ? "border-success/20 bg-success/10 text-success"
                                : isSaida
                                  ? "border-destructive/20 bg-destructive/10 text-destructive"
                                  : "border-primary/20 bg-primary/10 text-primary",
                            )}
                          >
                            {movement.type === "Ajuste" ? (
                              <RefreshCw className="h-5 w-5" />
                            ) : isEntrada ? (
                              <ArrowUpRight className="h-5 w-5" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold">{movement.type}</span>
                              <span
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                                  originBadge.className,
                                )}
                              >
                                {movement.affectsCash &&
                                movement.originKind === "Compra"
                                  ? `${originBadge.label} + caixa`
                                  : movement.originLabel}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDateTime(movement.createdAt)}
                              </span>
                            </div>

                            <p className="text-sm text-foreground">{movement.reason}</p>
                            <p className="text-xs leading-5 text-muted-foreground">
                              {movement.explanation}
                            </p>

                            {(movement.purchaseAmountCents != null ||
                              movement.reference ||
                              movement.purchasePaymentMethod) && (
                              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                {movement.reference && (
                                  <span className="rounded-full border border-border px-2 py-1">
                                    Ref: {movement.reference}
                                  </span>
                                )}
                                {movement.purchaseAmountCents != null && (
                                  <span className="rounded-full border border-border px-2 py-1">
                                    Custo:{" "}
                                    {formatCurrency(
                                      (movement.purchaseAmountCents -
                                        (movement.purchaseDiscountCents ?? 0)) / 100,
                                    )}
                                  </span>
                                )}
                                {movement.purchasePaymentMethod && (
                                  <span className="rounded-full border border-border px-2 py-1">
                                    Pagamento: {movement.purchasePaymentMethod}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div
                            className={cn(
                              "shrink-0 text-right font-bold",
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
