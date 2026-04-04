import { useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  CupSoda,
  Layers3,
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

function formatQuantity(quantity: number, unit: string) {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(quantity)} ${unit}`;
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                  Nao foi possivel carregar a previsao.
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
                      highlight.items.map((item) => (
                        <div
                          key={`${highlight.label}-${item.id}`}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-foreground">{item.name}</span>
                          <span className="font-semibold text-primary">
                            {formatQuantity(item.quantity, item.unit)}
                          </span>
                        </div>
                      ))
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
                        {formatQuantity(item.quantity, item.unit)}
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
                topIngredients.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/70 bg-background/80 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <span className="text-sm font-semibold text-primary">
                        {formatQuantity(item.quantity, item.unit)}
                      </span>
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
                ))
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
                        {formatQuantity(item.quantity, item.unit)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
