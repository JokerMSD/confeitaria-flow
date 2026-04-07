import { useMemo } from "react";
import { useState } from "react";
import { Link } from "wouter";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Clock,
  DollarSign,
  Loader2,
  PieChart as PieChartIcon,
  PackageMinus,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useCashTransactions } from "@/features/cash/hooks/use-cash-transactions";
import { useOrdersDashboardDrilldown } from "@/features/orders/hooks/use-orders-dashboard-drilldown";
import { useOrdersDashboardSummary } from "@/features/orders/hooks/use-orders-dashboard-summary";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { adaptOrderListToCards } from "@/features/orders/lib/order-list-adapter";
import { useInventoryItems } from "@/features/inventory/hooks/use-inventory-items";
import { adaptInventoryItemsToList } from "@/features/inventory/lib/inventory-list-adapter";
import type { UiOrderStatus } from "@/features/orders/types/order-ui";
import { cn, formatCurrency, getLocalDateKey, getTodayLocalDateKey } from "@/lib/utils";
import type { OrdersDashboardDrilldownFilters } from "@shared/types";

function getStatusColor(status: UiOrderStatus) {
  switch (status) {
    case "Novo":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "Confirmado":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
    case "Em produção":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "Pronto":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "Entregue":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    case "Cancelado":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function SummaryStatCard({
  title,
  icon,
  accentClassName,
  value,
  body,
  onClick,
  disabled = false,
}: {
  title: string;
  icon: React.ReactNode;
  accentClassName: string;
  value: React.ReactNode;
  body?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const clickable = Boolean(onClick) && !disabled;

  return (
    <Card
      className={cn(
        "glass-card border-l-4 transition-all",
        accentClassName,
        clickable
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
          : "",
        disabled ? "opacity-60" : "",
      )}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <CardContent className="p-4 md:p-6 flex flex-col gap-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-sm font-medium">{title}</span>
          {icon}
        </div>
        <div className="text-3xl font-display font-bold">{value}</div>
        {body ? <div className="text-sm text-muted-foreground">{body}</div> : null}
        {clickable ? (
          <div className="pt-1 text-xs font-medium uppercase tracking-[0.22em] text-primary/80">
            Ver pedidos
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const todayStr = getTodayLocalDateKey();
  const dashboardDateFrom = useMemo(() => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 29);
    return getLocalDateKey(baseDate);
  }, []);
  const ordersQuery = useOrders();
  const dashboardSummaryQuery = useOrdersDashboardSummary({
    dateFrom: dashboardDateFrom,
    dateTo: todayStr,
  });
  const cashQuery = useCashTransactions({
    dateFrom: todayStr,
    dateTo: todayStr,
  });
  const inventoryQuery = useInventoryItems();
  const [activeDrilldown, setActiveDrilldown] =
    useState<OrdersDashboardDrilldownFilters | null>(null);

  const orderCards = useMemo(() => {
    if (!ordersQuery.data) {
      return [];
    }

    return adaptOrderListToCards(ordersQuery.data.data);
  }, [ordersQuery.data]);
  const nonCancelledOrders = useMemo(
    () => orderCards.filter((order) => order.status !== "Cancelado"),
    [orderCards],
  );
  const cancelledOrders = useMemo(
    () => orderCards.filter((order) => order.status === "Cancelado").length,
    [orderCards],
  );

  const inventoryItems = useMemo(
    () => adaptInventoryItemsToList(inventoryQuery.data?.data ?? []),
    [inventoryQuery.data],
  );

  const entriesToday = useMemo(
    () =>
      (cashQuery.data?.data ?? [])
        .filter((transaction) => transaction.type === "Entrada")
        .reduce((sum, transaction) => sum + transaction.amountCents / 100, 0),
    [cashQuery.data],
  );

  const exitsToday = useMemo(
    () =>
      (cashQuery.data?.data ?? [])
        .filter((transaction) => transaction.type === "Saida")
        .reduce((sum, transaction) => sum + transaction.amountCents / 100, 0),
    [cashQuery.data],
  );

  const balanceToday = entriesToday - exitsToday;

  const pedidosHoje = useMemo(
    () =>
      nonCancelledOrders.filter(
        (order) => order.deliveryDate === todayStr && order.status !== "Entregue",
      ).length,
    [nonCancelledOrders, todayStr],
  );

  const pedidosAtrasados = useMemo(
    () =>
      nonCancelledOrders.filter(
        (order) => order.deliveryDate < todayStr && order.status !== "Entregue",
      ).length,
    [nonCancelledOrders, todayStr],
  );

  const pedidosPendentesPagamento = useMemo(
    () =>
      nonCancelledOrders.filter((order) => order.paymentStatus !== "Pago").length,
    [nonCancelledOrders],
  );

  const estoqueBaixoItens = useMemo(
    () => inventoryItems.filter((item) => item.isLowStock),
    [inventoryItems],
  );

  const proximosFila = useMemo(
    () =>
      [...nonCancelledOrders]
        .filter((order) => order.status !== "Entregue")
        .sort((a, b) => {
          const dateA = new Date(
            `${a.deliveryDate}T${a.deliveryTime || "23:59"}`,
          );
          const dateB = new Date(
            `${b.deliveryDate}T${b.deliveryTime || "23:59"}`,
          );
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 5),
    [nonCancelledOrders],
  );

  const dashboardSummary = dashboardSummaryQuery.data?.data ?? null;

  const topSellingProducts = useMemo(
    () =>
      [...(dashboardSummary?.products ?? [])]
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 6)
        .map((product) => ({
          ...product,
          shortName:
            product.productName.length > 20
              ? `${product.productName.slice(0, 20)}...`
              : product.productName,
        })),
    [dashboardSummary],
  );

  const deliveryModeChartData = useMemo(
    () =>
      (dashboardSummary?.deliveryModes ?? []).map((item) => ({
        ...item,
        label: item.deliveryMode === "Entrega" ? "Entrega" : "Retirada",
      })),
    [dashboardSummary],
  );

  const soldItemsRanking = useMemo(
    () =>
      [...(dashboardSummary?.products ?? [])]
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 8),
    [dashboardSummary],
  );

  const drilldownQuery = useOrdersDashboardDrilldown(activeDrilldown);

  const topSellingDrilldownFilters = dashboardSummary?.highlights.topSellingProduct
    ? {
        kind: "top-selling-product" as const,
        dateFrom: dashboardDateFrom,
        dateTo: todayStr,
        recipeId:
          topSellingProducts.find(
            (product) =>
              product.productName ===
              dashboardSummary.highlights.topSellingProduct?.productName,
          )?.recipeId ?? undefined,
        productName: dashboardSummary.highlights.topSellingProduct.productName,
      }
    : null;

  const mostProfitableDrilldownFilters =
    dashboardSummary?.highlights.mostProfitableProduct
      ? {
          kind: "most-profitable-product" as const,
          dateFrom: dashboardDateFrom,
          dateTo: todayStr,
          recipeId:
            soldItemsRanking.find(
              (product) =>
                product.productName ===
                dashboardSummary.highlights.mostProfitableProduct?.productName,
            )?.recipeId ?? undefined,
          productName:
            dashboardSummary.highlights.mostProfitableProduct.productName,
        }
      : null;

  const openDrilldown = (filters: OrdersDashboardDrilldownFilters) => {
    setActiveDrilldown(filters);
  };

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Ola, Universo Doce
            </h2>
            <p className="text-muted-foreground">
              Aqui está o resumo da sua confeitaria hoje.
            </p>
          </div>
          <Link href="/pedidos/novo">
            <a className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-primary/90 transition-all active:scale-95">
              + Novo Pedido
            </a>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <SummaryStatCard
            title="Para Hoje"
            icon={<CalendarDays className="w-5 h-5 text-warning" />}
            accentClassName="border-l-warning"
            value={ordersQuery.isLoading ? "..." : pedidosHoje}
            onClick={() =>
              openDrilldown({
                kind: "today",
                dateFrom: dashboardDateFrom,
                dateTo: todayStr,
              })
            }
          />

          <SummaryStatCard
            title="Atrasados"
            icon={<Clock className="w-5 h-5 text-destructive" />}
            accentClassName="border-l-destructive"
            value={
              <span className="text-destructive">
                {ordersQuery.isLoading ? "..." : pedidosAtrasados}
              </span>
            }
            onClick={() =>
              openDrilldown({
                kind: "overdue",
                dateFrom: dashboardDateFrom,
                dateTo: todayStr,
              })
            }
          />

          <SummaryStatCard
            title="Cancelados"
            icon={<PackageMinus className="w-5 h-5 text-rose-400" />}
            accentClassName="border-l-rose-500"
            value={
              <span className="text-rose-400">
                {ordersQuery.isLoading ? "..." : cancelledOrders}
              </span>
            }
            onClick={() =>
              openDrilldown({
                kind: "cancelled",
                dateFrom: dashboardDateFrom,
                dateTo: todayStr,
              })
            }
          />

          <SummaryStatCard
            title="A Receber"
            icon={<DollarSign className="w-5 h-5 text-primary" />}
            accentClassName="border-l-primary"
            value={ordersQuery.isLoading ? "..." : pedidosPendentesPagamento}
            onClick={() =>
              openDrilldown({
                kind: "receivable",
                dateFrom: dashboardDateFrom,
                dateTo: todayStr,
              })
            }
          />

          <SummaryStatCard
            title="Estoque Baixo"
            icon={<PackageMinus className="w-5 h-5 text-success" />}
            accentClassName="border-l-success"
            value={
              <span className="text-success">
                {inventoryQuery.isLoading ? "..." : estoqueBaixoItens.length}
              </span>
            }
            disabled
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card bg-success/5 border-success/20">
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-success/80">
                <span className="text-sm font-bold uppercase tracking-wider">
                  Entradas Hoje
                </span>
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-3xl font-display font-bold text-success">
                {cashQuery.isLoading ? "..." : formatCurrency(entriesToday)}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card bg-destructive/5 border-destructive/20">
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-destructive/80">
                <span className="text-sm font-bold uppercase tracking-wider">
                  Saídas Hoje
                </span>
                <TrendingDown className="w-5 h-5" />
              </div>
              <div className="text-3xl font-display font-bold text-destructive">
                {cashQuery.isLoading ? "..." : formatCurrency(exitsToday)}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-primary/80">
                <span className="text-sm font-bold uppercase tracking-wider">
                  Saldo do Dia
                </span>
                <DollarSign className="w-5 h-5" />
              </div>
              <div
                className={cn(
                  "text-3xl font-display font-bold",
                  balanceToday >= 0 ? "text-primary" : "text-destructive",
                )}
              >
                {cashQuery.isLoading ? "..." : formatCurrency(balanceToday)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryStatCard
            title="Produto mais vendido"
            icon={<ShoppingBag className="w-5 h-5 text-pink-400" />}
            accentClassName="border-l-pink-400"
            value={
              dashboardSummaryQuery.isLoading
                ? "..."
                : dashboardSummary?.highlights.topSellingProduct?.productName ??
                  "Sem vendas"
            }
            body={
              <>
                {dashboardSummary?.highlights.topSellingProduct?.quantitySold ?? 0}{" "}
                unidade(s) vendidas nos ultimos 30 dias
              </>
            }
            onClick={
              topSellingDrilldownFilters
                ? () => openDrilldown(topSellingDrilldownFilters)
                : undefined
            }
            disabled={!topSellingDrilldownFilters}
          />

          <SummaryStatCard
            title="Produto mais lucrativo"
            icon={<Sparkles className="w-5 h-5 text-amber-400" />}
            accentClassName="border-l-amber-400"
            value={
              dashboardSummaryQuery.isLoading
                ? "..."
                : dashboardSummary?.highlights.mostProfitableProduct?.productName ??
                  "Sem base suficiente"
            }
            body={
              <>
                Lucro estimado:{" "}
                {formatCurrency(
                  (dashboardSummary?.highlights.mostProfitableProduct
                    ?.estimatedProfitCents ?? 0) / 100,
                )}
              </>
            }
            onClick={
              mostProfitableDrilldownFilters
                ? () => openDrilldown(mostProfitableDrilldownFilters)
                : undefined
            }
            disabled={!mostProfitableDrilldownFilters}
          />

          <SummaryStatCard
            title="Itens vendidos"
            icon={<BarChart3 className="w-5 h-5 text-primary" />}
            accentClassName="border-l-primary"
            value={
              dashboardSummaryQuery.isLoading
                ? "..."
                : dashboardSummary?.totals.unitsSold ?? 0
            }
            body="Quantidade total de unidades vendidas no recorte."
            onClick={() =>
              openDrilldown({
                kind: "units-sold",
                dateFrom: dashboardDateFrom,
                dateTo: todayStr,
              })
            }
          />

          <SummaryStatCard
            title="Lucro estimado"
            icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
            accentClassName="border-l-emerald-400"
            value={
              <span className="text-emerald-400">
                {dashboardSummaryQuery.isLoading
                  ? "..."
                  : formatCurrency(
                      (dashboardSummary?.totals.estimatedProfitCents ?? 0) / 100,
                    )}
              </span>
            }
            body="Baseado em custo atual das receitas com custo conhecido."
            onClick={() =>
              openDrilldown({
                kind: "estimated-profit",
                dateFrom: dashboardDateFrom,
                dateTo: todayStr,
              })
            }
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="glass-card xl:col-span-2">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Quantidade vendida por item
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Produtos mais vendidos nos ultimos 30 dias.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {dashboardSummaryQuery.isError ? (
                <p className="text-sm text-muted-foreground">
                  Nao foi possivel carregar as metricas comerciais.
                </p>
              ) : topSellingProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ainda nao ha vendas suficientes para montar o grafico.
                </p>
              ) : (
                <ChartContainer
                  className="h-[320px] w-full"
                  config={{
                    quantitySold: {
                      label: "Quantidade vendida",
                      color: "var(--primary)",
                    },
                  }}
                >
                  <BarChart data={topSellingProducts} margin={{ left: 8, right: 16 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={72}
                    />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, item) => (
                            <div className="flex w-full items-center justify-between gap-3">
                              <span className="text-muted-foreground">
                                {String(item.payload.productName)}
                              </span>
                              <span className="font-mono font-medium text-foreground">
                                {Number(value)} un
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Bar
                      dataKey="quantitySold"
                      radius={[10, 10, 0, 0]}
                      fill="var(--color-quantitySold)"
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-primary" />
                Entrega x retirada
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribuicao do faturamento no mesmo recorte.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {dashboardSummaryQuery.isError ? (
                <p className="text-sm text-muted-foreground">
                  Nao foi possivel carregar o grafico.
                </p>
              ) : deliveryModeChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem pedidos suficientes para comparar os modos.
                </p>
              ) : (
                <>
                  <ChartContainer
                    className="mx-auto h-[260px] w-full max-w-[320px]"
                    config={{
                      Entrega: { label: "Entrega", color: "#f08cb3" },
                      Retirada: { label: "Retirada", color: "#7c5cff" },
                    }}
                  >
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            nameKey="label"
                            formatter={(value, _name, item) => (
                              <div className="flex w-full items-center justify-between gap-3">
                                <span className="text-muted-foreground">
                                  {String(item.payload.label)}
                                </span>
                                <span className="font-mono font-medium text-foreground">
                                  {formatCurrency(Number(value) / 100)}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Pie
                        data={deliveryModeChartData}
                        dataKey="revenueCents"
                        nameKey="label"
                        innerRadius={64}
                        outerRadius={94}
                        strokeWidth={4}
                      >
                        {deliveryModeChartData.map((item) => (
                          <Cell
                            key={item.deliveryMode}
                            fill={
                              item.deliveryMode === "Entrega"
                                ? "var(--color-Entrega)"
                                : "var(--color-Retirada)"
                            }
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="mt-4 space-y-2">
                    {deliveryModeChartData.map((item) => (
                      <div
                        key={item.deliveryMode}
                        className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.orderCount} pedido(s)
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(item.revenueCents / 100)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader className="pb-2 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Quantidade vendida de cada item
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ranking comercial com faturamento e lucro estimado por produto.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {dashboardSummaryQuery.isError ? (
              <div className="p-6 text-sm text-muted-foreground">
                Nao foi possivel carregar o ranking comercial.
              </div>
            ) : soldItemsRanking.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                Nenhum item vendido no recorte atual.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {soldItemsRanking.map((item, index) => (
                  <div
                    key={`${item.recipeId ?? item.productName}-${index}`}
                    className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.6fr)_120px_140px_160px]"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {item.productName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.orderCount} pedido(s) com este item
                      </p>
                    </div>
                    <div className="text-sm md:text-right">
                      <p className="font-semibold">{item.quantitySold} un</p>
                      <p className="text-muted-foreground">vendidas</p>
                    </div>
                    <div className="text-sm md:text-right">
                      <p className="font-semibold">
                        {formatCurrency(item.revenueCents / 100)}
                      </p>
                      <p className="text-muted-foreground">faturamento</p>
                    </div>
                    <div className="text-sm md:text-right">
                      <p className="font-semibold">
                        {item.estimatedProfitCents == null
                          ? "Sem base"
                          : formatCurrency(item.estimatedProfitCents / 100)}
                      </p>
                      <p className="text-muted-foreground">lucro estimado</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(dashboardSummary?.totals.productsWithoutEstimatedCostCount ?? 0) > 0 && (
              <div className="border-t border-border/50 px-5 py-3 text-xs text-muted-foreground">
                {dashboardSummary?.totals.productsWithoutEstimatedCostCount} produto(s)
                ficaram sem lucro estimado por falta de custo confiavel na receita.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-card lg:col-span-2 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Próximos na Fila
              </CardTitle>
              <Link href="/fila">
                <a className="text-sm font-medium text-primary hover:underline flex items-center">
                  Ver Fila Completa <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {ordersQuery.isError ? (
                <div className="p-8 text-center text-muted-foreground flex-1 flex items-center justify-center flex-col gap-3">
                  <p>Não foi possível carregar os pedidos do dashboard.</p>
                  <Button variant="outline" onClick={() => ordersQuery.refetch()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : ordersQuery.isLoading ? (
                <div className="p-8 text-center text-muted-foreground flex-1 flex items-center justify-center flex-col gap-2">
                  <p>Carregando pedidos...</p>
                </div>
              ) : proximosFila.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex-1 flex items-center justify-center flex-col gap-2">
                  <span className="text-4xl">🎉</span>
                  <p>Nenhum pedido na fila no momento!</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50 flex-1 overflow-auto max-h-[400px]">
                  {proximosFila.map((pedido) => {
                    const isAtrasado = pedido.deliveryDate < todayStr;
                    const isHoje = pedido.deliveryDate === todayStr;

                    return (
                      <div
                        key={pedido.id}
                        className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-foreground truncate">
                              {pedido.customerName}
                            </span>
                            <span
                              className={cn(
                                "text-xs font-semibold px-2 py-0.5 rounded-full border",
                                isAtrasado
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : isHoje
                                    ? "bg-warning/10 text-warning-foreground border-warning/20"
                                    : "bg-muted text-muted-foreground border-border",
                              )}
                            >
                              {isAtrasado ? "Atrasado" : isHoje ? "Hoje" : "Próximos"}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 truncate">
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                              {pedido.orderNumber}
                            </span>
                            <span>•</span>
                            <span className="truncate">{pedido.itemSummary}</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2 shrink-0">
                          <div className="text-sm font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {pedido.deliveryTime || "A combinar"}
                          </div>
                          <span
                            className={cn(
                              "status-badge",
                              getStatusColor(pedido.status),
                            )}
                          >
                            {pedido.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6 flex flex-col">
            <Card className="glass-card flex-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <PackageMinus className="w-5 h-5" />
                  Estoque Baixo
                </CardTitle>
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
                  {estoqueBaixoItens.length}
                </span>
              </CardHeader>
              <CardContent className="p-0">
                {inventoryQuery.isError ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>Não foi possível carregar o estoque.</p>
                  </div>
                ) : estoqueBaixoItens.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>Estoque em dia!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {estoqueBaixoItens.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-destructive">
                            {item.currentQuantity}{" "}
                            <span className="text-xs font-normal">{item.unit}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Mín: {item.minQuantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {estoqueBaixoItens.length > 4 && (
                  <div className="p-3 border-t border-border/50 text-center">
                    <Link href="/estoque">
                      <a className="text-sm font-medium text-primary hover:underline">
                        Ver todos
                      </a>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <Dialog
          open={Boolean(activeDrilldown)}
          onOpenChange={(open) => {
            if (!open) {
              setActiveDrilldown(null);
            }
          }}
        >
          <DialogContent className="max-w-3xl border-border/70 bg-card/95 sm:max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-display">
                <ReceiptText className="h-5 w-5 text-primary" />
                {drilldownQuery.data?.data.title ?? "Pedidos correspondentes"}
              </DialogTitle>
              <DialogDescription>
                {drilldownQuery.data?.data.description ??
                  "Pedidos usados para compor a estatistica selecionada."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto pr-1">
              {drilldownQuery.isLoading ? (
                <div className="flex min-h-40 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando pedidos...
                </div>
              ) : drilldownQuery.isError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  Nao foi possivel carregar os pedidos desta estatistica.
                </div>
              ) : drilldownQuery.data?.data.orders.length ? (
                <>
                  <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                    {drilldownQuery.data.data.totalOrders} pedido(s) encontrados.
                  </div>
                  <div className="space-y-3">
                    {drilldownQuery.data.data.orders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-[1.4rem] border border-border/60 bg-background/50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-1">
                            <p className="font-semibold text-foreground">
                              {order.orderNumber} • {order.customerName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.itemSummary}
                            </p>
                          </div>
                          <div className="text-sm sm:text-right">
                            <p className="font-semibold">
                              {formatCurrency(order.subtotalAmountCents / 100)}
                            </p>
                            <p className="text-muted-foreground">
                              {order.deliveryMode} • {order.itemCount} item(ns)
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full border border-border/60 px-3 py-1 text-muted-foreground">
                            {order.deliveryDate}
                            {order.deliveryTime ? ` • ${order.deliveryTime}` : ""}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 font-medium",
                              getStatusColor(order.status as UiOrderStatus),
                            )}
                          >
                            {order.status}
                          </span>
                          <span className="rounded-full border border-border/60 px-3 py-1 text-muted-foreground">
                            {order.paymentStatus}
                          </span>
                          <Link href={`/pedidos/${order.id}`}>
                            <a className="rounded-full border border-primary/30 px-3 py-1 font-medium text-primary transition-colors hover:bg-primary/10">
                              Abrir pedido
                            </a>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-background/60 p-6 text-center text-sm text-muted-foreground">
                  Nenhum pedido encontrado para esta estatistica.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

