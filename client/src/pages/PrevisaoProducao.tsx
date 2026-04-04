import { useMemo, useState } from "react";
import type { InventoryItemUnit } from "@shared/types";
import {
  CalendarDays,
  ClipboardList,
  CupSoda,
  Layers3,
  PackageCheck,
  PackageSearch,
  Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductionForecast } from "@/features/production/hooks/use-production-forecast";
import { cn, formatDate, getLocalDateKey } from "@/lib/utils";
import { ApiError } from "@/api/http-client";

function normalizeNearInteger(value: number) {
  const rounded = Math.round(value);

  if (Math.abs(value - rounded) < 0.001) {
    return rounded;
  }

  return value;
}

function normalizeDisplayQuantity(quantity: number, unit: string) {
  if (unit === "g" && Math.abs(quantity) >= 1000) {
    return { quantity: quantity / 1000, unit: "kg" };
  }

  if (unit === "ml" && Math.abs(quantity) >= 1000) {
    return { quantity: quantity / 1000, unit: "l" };
  }

  return { quantity, unit };
}

function getDisplayPrecision(unit: string, quantity: number) {
  if (unit === "g" || unit === "ml") {
    return Math.abs(Math.round(quantity) - quantity) < 0.01 ? 0 : 1;
  }

  if (unit === "un" || unit === "caixa") {
    return Math.abs(Math.round(quantity) - quantity) < 0.01 ? 0 : 2;
  }

  return Math.abs(Math.round(quantity) - quantity) < 0.001 ? 0 : 3;
}

function formatBaseQuantity(quantity: number, unit: InventoryItemUnit) {
  const normalized = normalizeDisplayQuantity(quantity, unit);
  const fractionDigits = getDisplayPrecision(
    normalized.unit,
    normalized.quantity,
  );

  return {
    value: new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits,
    }).format(normalizeNearInteger(normalized.quantity)),
    unit: normalized.unit as InventoryItemUnit,
  };
}

function formatOperationalQuantity(
  quantity: number,
  unit: InventoryItemUnit,
  recipeEquivalentQuantity?: number | null,
  recipeEquivalentUnit?: InventoryItemUnit | null,
) {
  if (
    (unit === "un" || unit === "caixa") &&
    recipeEquivalentQuantity != null &&
    recipeEquivalentQuantity > 0 &&
    recipeEquivalentUnit != null
  ) {
    const converted = formatBaseQuantity(
      quantity * recipeEquivalentQuantity,
      recipeEquivalentUnit,
    );
    const original = formatBaseQuantity(quantity, unit);

    return {
      label: `${converted.value} ${converted.unit}`,
      detail: `saldo real: ${original.value} ${original.unit}`,
    };
  }

  const base = formatBaseQuantity(quantity, unit);
  return {
    label: `${base.value} ${base.unit}`,
    detail: null,
  };
}

function getStatusTone(status: string) {
  switch (status) {
    case "EmProducao":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "Confirmado":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    default:
      return "border-border bg-muted/30 text-muted-foreground";
  }
}

function buildDateRangeLabel(dateFrom?: string, dateTo?: string) {
  if (dateFrom && dateTo) {
    return `${formatDate(dateFrom)} ate ${formatDate(dateTo)}`;
  }

  if (dateFrom) {
    return `a partir de ${formatDate(dateFrom)}`;
  }

  if (dateTo) {
    return `ate ${formatDate(dateTo)}`;
  }

  return "todos os pedidos ativos";
}

export default function PrevisaoProducao() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const forecastQuery = useProductionForecast({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const forecast = forecastQuery.data?.data;

  const highlights = useMemo(
    () => [
      {
        label: "Chocolate",
        items: forecast?.highlightedTotals.chocolate ?? [],
        empty: "Sem consumo previsto",
      },
      {
        label: "Recheios",
        items: forecast?.highlightedTotals.filling ?? [],
        empty: "Sem recheios previstos",
      },
      {
        label: "Leite condensado",
        items: forecast?.highlightedTotals.leiteCondensado ?? [],
        empty: "Sem consumo previsto",
      },
      {
        label: "Creme de leite",
        items: forecast?.highlightedTotals.cremeDeLeite ?? [],
        empty: "Sem consumo previsto",
      },
    ],
    [forecast],
  );

  const groupedOrders = useMemo(() => {
    if (!forecast) {
      return [];
    }

    const groups = new Map<
      string,
      {
        deliveryDate: string;
        orders: typeof forecast.orders;
      }
    >();

    for (const order of forecast.orders) {
      const current = groups.get(order.deliveryDate) ?? {
        deliveryDate: order.deliveryDate,
        orders: [],
      };
      current.orders.push(order);
      groups.set(order.deliveryDate, current);
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.deliveryDate.localeCompare(b.deliveryDate),
    );
  }, [forecast]);

  const recipeMaxQuantity = useMemo(
    () =>
      Math.max(
        1,
        ...(forecast?.totalsByRecipe.map((item) => item.quantity) ?? [1]),
      ),
    [forecast],
  );

  const ingredientMaxQuantity = useMemo(
    () =>
      Math.max(
        1,
        ...(forecast?.totalsByIngredient.map((item) => item.quantity) ?? [1]),
      ),
    [forecast],
  );

  const topIngredients = useMemo(
    () => forecast?.totalsByIngredient.slice(0, 12) ?? [],
    [forecast],
  );
  const purchaseSuggestions = forecast?.purchaseSuggestions;

  const rangeLabel = useMemo(
    () =>
      buildDateRangeLabel(
        forecast?.filters.dateFrom,
        forecast?.filters.dateTo,
      ),
    [forecast?.filters.dateFrom, forecast?.filters.dateTo],
  );

  const generatedAtLabel = useMemo(() => {
    if (!forecast?.generatedAt) {
      return "";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(forecast.generatedAt));
  }, [forecast?.generatedAt]);

  const applyQuickRange = (days: number) => {
    const start = getLocalDateKey(new Date());
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days - 1);
    const end = getLocalDateKey(endDate);
    setDateFrom(start);
    setDateTo(end);
  };

  const forecastErrorMessage = useMemo(() => {
    const error = forecastQuery.error;

    if (error instanceof ApiError && error.status === 401) {
      return "Sua sessao administrativa expirou. Entre novamente para carregar a previsao.";
    }

    return "Nao foi possivel carregar a previsao.";
  }, [forecastQuery.error]);

  return (
    <AppLayout title="Previsao de Producao">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-[#4f2530] via-[#352027] to-[#201418] text-white shadow-xl">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.9fr] lg:p-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                Painel operacional
              </div>
              <div className="space-y-3">
                <h2 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">
                  Produza com clareza, nao com listas soltas.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-white/75 lg:text-base">
                  A previsao resume o que realmente precisa sair da cozinha no
                  periodo selecionado: pedidos ativos, receitas acionadas,
                  ingredientes mais pressionados e adicionais escolhidos.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/65">
                    Periodo
                  </p>
                  <p className="mt-2 font-semibold">{rangeLabel}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/65">
                    Pedidos
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {forecast?.orderCount ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/65">
                    Atualizado
                  </p>
                  <p className="mt-2 font-semibold">
                    {generatedAtLabel || "agora"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-black/10 p-5 backdrop-blur-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs uppercase tracking-wide text-white/65">
                    Data inicial
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="border-white/10 bg-white/10 text-white"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs uppercase tracking-wide text-white/65">
                    Data final
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="border-white/10 bg-white/10 text-white"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-0 bg-white text-[#4f2530] hover:bg-white/90"
                  onClick={() => applyQuickRange(1)}
                >
                  Hoje
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-0 bg-white/15 text-white hover:bg-white/20"
                  onClick={() => applyQuickRange(3)}
                >
                  3 dias
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-0 bg-white/15 text-white hover:bg-white/20"
                  onClick={() => applyQuickRange(7)}
                >
                  7 dias
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-0 bg-white/15 text-white hover:bg-white/20"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            {
              label: "Pedidos em producao",
              value: forecast?.orderCount ?? 0,
              helper: "Pedidos confirmados ou em producao.",
              icon: ClipboardList,
            },
            {
              label: "Itens do periodo",
              value: forecast?.itemCount ?? 0,
              helper: "Soma dos itens considerados no recorte.",
              icon: Layers3,
            },
            {
              label: "Receitas acionadas",
              value: forecast?.totalsByRecipe.length ?? 0,
              helper: "Receitas ou bases que serao preparadas.",
              icon: CupSoda,
            },
            {
              label: "Adicionais pedidos",
              value: forecast?.totalsByAdditional.length ?? 0,
              helper: "Extras que afetam montagem e separacao.",
              icon: PackageSearch,
            },
            {
              label: "Itens para comprar",
              value: purchaseSuggestions?.shortageItemCount ?? 0,
              helper: "Ingredientes em falta frente ao estoque atual.",
              icon: PackageCheck,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className="overflow-hidden border-border/70 bg-card/95 shadow-sm"
              >
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="mt-2 font-display text-3xl font-bold text-foreground">
                      {item.value}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {item.helper}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-primary/15 bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Agenda de pedidos considerados
              </CardTitle>
              <CardDescription>
                Ordem pratica por data para a producao saber o que precisa sair
                primeiro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              {forecastQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Carregando previsao...
                </p>
              ) : null}
              {forecastQuery.isError ? (
                <p className="text-sm text-destructive">
                  {forecastErrorMessage}
                </p>
              ) : null}
              {!forecastQuery.isLoading &&
              !forecastQuery.isError &&
              groupedOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-sm text-muted-foreground">
                  Nenhum pedido ativo encontrado para o periodo selecionado.
                </div>
              ) : null}

              {groupedOrders.map((group) => (
                <div key={group.deliveryDate} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {formatDate(group.deliveryDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {group.orders.length} pedido(s) no dia
                      </p>
                    </div>
                    <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                      {group.orders.reduce((sum, order) => sum + 1, 0)} ordem(ns)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.orders.map((order) => (
                      <div
                        key={order.orderId}
                        className="rounded-2xl border border-border/70 bg-background/80 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">
                              {order.orderNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.customerName}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                              getStatusTone(order.status),
                            )}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <CardTitle>Radar dos itens criticos</CardTitle>
              <CardDescription>
                Leitura rapida do que mais pesa na cozinha e na montagem.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-5">
              {highlights.map((highlight) => (
                <div
                  key={highlight.label}
                  className="rounded-2xl border border-border/70 bg-background/80 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {highlight.label}
                  </p>
                  <div className="mt-2 space-y-2">
                    {highlight.items.length > 0 ? (
                      highlight.items.map((item) => {
                        const formatted = formatOperationalQuantity(
                          item.quantity,
                          item.unit,
                          item.recipeEquivalentQuantity,
                          item.recipeEquivalentUnit,
                        );

                        return (
                          <div
                            key={`${highlight.label}-${item.id}`}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="text-foreground">{item.name}</span>
                            <div className="text-right">
                              <span className="font-semibold text-primary">
                                {formatted.label}
                              </span>
                              {formatted.detail ? (
                                <div className="text-[11px] text-muted-foreground">
                                  {formatted.detail}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {highlight.empty}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_1.05fr_0.9fr]">
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <CardTitle>Receitas mais acionadas</CardTitle>
              <CardDescription>
                Ranking visual do que mais precisa ser preparado no periodo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {(forecast?.totalsByRecipe ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma receita acionada no periodo.
                </p>
              ) : (
                forecast?.totalsByRecipe.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/70 bg-background/80 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <span className="text-sm font-semibold text-primary">
                        {
                          formatOperationalQuantity(
                            item.quantity,
                            item.unit,
                            item.recipeEquivalentQuantity,
                            item.recipeEquivalentUnit,
                          ).label
                        }
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-[#ef9fb3]"
                        style={{
                          width: `${Math.max(
                            8,
                            (item.quantity / recipeMaxQuantity) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <CardTitle>Ingredientes mais pressionados</CardTitle>
              <CardDescription>
                Foco no que mais consome estoque dentro da previsao atual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {topIngredients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum ingrediente previsto no periodo.
                </p>
              ) : (
                topIngredients.map((item) => {
                  const formatted = formatOperationalQuantity(
                    item.quantity,
                    item.unit,
                    item.recipeEquivalentQuantity,
                    item.recipeEquivalentUnit,
                  );

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border/70 bg-background/80 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-primary">
                            {formatted.label}
                          </span>
                          {formatted.detail ? (
                            <div className="text-[11px] text-muted-foreground">
                              {formatted.detail}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#6f3d2f] to-[#ef9fb3]"
                        style={{
                          width: `${Math.max(
                            8,
                            (item.quantity / ingredientMaxQuantity) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <CardTitle>Adicionais selecionados</CardTitle>
              <CardDescription>
                Apoio de montagem para frutas, chocolates e extras.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {(forecast?.totalsByAdditional ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum adicional selecionado no periodo.
                </p>
              ) : (
                forecast?.totalsByAdditional.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/70 bg-background/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.groupName}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {
                          formatOperationalQuantity(
                            item.quantity,
                            item.unit,
                            item.recipeEquivalentQuantity,
                            item.recipeEquivalentUnit,
                          ).label
                        }
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-primary" />
                Compra sugerida pelo estoque
              </CardTitle>
              <CardDescription>
                Itens que faltam para atender a previsao atual, com quantidade
                sugerida de compra e estimativa de gasto quando houver custo medio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Itens faltando
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {purchaseSuggestions?.shortageItemCount ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Gasto estimado
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {purchaseSuggestions
                      ? new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(
                          purchaseSuggestions.estimatedPurchaseCostCents / 100,
                        )
                      : new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Custos incompletos
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {purchaseSuggestions?.hasItemsWithoutCost
                      ? "Ha itens sem custo medio suficiente"
                      : "Todos os itens faltantes tem custo estimado"}
                  </p>
                </div>
              </div>

              {(purchaseSuggestions?.items.length ?? 0) === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-sm text-muted-foreground">
                  Nenhuma compra sugerida. O estoque atual cobre a previsao do
                  periodo.
                </div>
              ) : (
                <div className="grid gap-3 xl:grid-cols-2">
                  {purchaseSuggestions?.items.slice(0, 8).map((item) => {
                    const current = formatOperationalQuantity(
                      item.currentQuantity,
                      item.itemUnit,
                      item.recipeEquivalentQuantity,
                      item.recipeEquivalentUnit,
                    );
                    const required = formatOperationalQuantity(
                      item.requiredQuantity,
                      item.itemUnit,
                      item.recipeEquivalentQuantity,
                      item.recipeEquivalentUnit,
                    );
                    const deficit = formatOperationalQuantity(
                      item.deficitQuantity,
                      item.itemUnit,
                      item.recipeEquivalentQuantity,
                      item.recipeEquivalentUnit,
                    );
                    const suggested = formatOperationalQuantity(
                      item.suggestedPurchaseQuantity,
                      item.itemUnit,
                      item.recipeEquivalentQuantity,
                      item.recipeEquivalentUnit,
                    );

                    return (
                      <div
                      key={item.itemId}
                      className="rounded-2xl border border-border/70 bg-background/80 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {item.itemName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Em estoque:{" "}
                            {current.label}{" "}
                            • Necessario:{" "}
                            {required.label}
                          </p>
                        </div>
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          Falta{" "}
                          {deficit.label}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Comprar
                          </p>
                          <p className="text-lg font-bold text-foreground">
                            {suggested.label}
                          </p>
                          {suggested.detail ? (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {suggested.detail}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Gasto
                          </p>
                          <p className="text-lg font-bold text-foreground">
                            {item.estimatedPurchaseCostCents == null
                              ? "Sem custo"
                              : new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(item.estimatedPurchaseCostCents / 100)}
                          </p>
                        </div>
                      </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
