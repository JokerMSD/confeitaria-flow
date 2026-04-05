import { useMemo } from "react";
import { Link } from "wouter";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Clock,
  DollarSign,
  PieChart as PieChartIcon,
  PackageMinus,
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useCashTransactions } from "@/features/cash/hooks/use-cash-transactions";
import { useOrdersDashboardSummary } from "@/features/orders/hooks/use-orders-dashboard-summary";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { adaptOrderListToCards } from "@/features/orders/lib/order-list-adapter";
import { useInventoryItems } from "@/features/inventory/hooks/use-inventory-items";
import { adaptInventoryItemsToList } from "@/features/inventory/lib/inventory-list-adapter";
import type { UiOrderStatus } from "@/features/orders/types/order-ui";
import { cn, formatCurrency, getLocalDateKey, getTodayLocalDateKey } from "@/lib/utils";

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

  const orderCards = useMemo(() => {
    if (!ordersQuery.data) {
      return [];
    }

    return adaptOrderListToCards(ordersQuery.data.data);
  }, [ordersQuery.data]);

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
      orderCards.filter(
        (order) =>
          order.deliveryDate === todayStr &&
          order.status !== "Cancelado" &&
          order.status !== "Entregue",
      ).length,
    [orderCards, todayStr],
  );

  const pedidosAtrasados = useMemo(
    () =>
      orderCards.filter(
        (order) =>
          order.deliveryDate < todayStr &&
          order.status !== "Cancelado" &&
          order.status !== "Entregue",
      ).length,
    [orderCards, todayStr],
  );

  const pedidosPendentesPagamento = useMemo(
    () =>
      orderCards.filter(
        (order) =>
          order.paymentStatus !== "Pago" && order.status !== "Cancelado",
      ).length,
    [orderCards],
  );

  const estoqueBaixoItens = useMemo(
    () => inventoryItems.filter((item) => item.isLowStock),
    [inventoryItems],
  );

  const proximosFila = useMemo(
    () =>
      [...orderCards]
        .filter(
          (order) => order.status !== "Cancelado" && order.status !== "Entregue",
        )
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
    [orderCards],
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card border-l-4 border-l-warning">
            <CardContent className="p-4 md:p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Para Hoje</span>
                <CalendarDays className="w-5 h-5 text-warning" />
              </div>
              <div className="text-3xl font-display font-bold">
                {ordersQuery.isLoading ? "..." : pedidosHoje}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-destructive">
            <CardContent className="p-4 md:p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium text-destructive">
                  Atrasados
                </span>
                <Clock className="w-5 h-5 text-destructive" />
              </div>
              <div className="text-3xl font-display font-bold text-destructive">
                {ordersQuery.isLoading ? "..." : pedidosAtrasados}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-primary">
            <CardContent className="p-4 md:p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">A Receber</span>
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div className="text-3xl font-display font-bold">
                {ordersQuery.isLoading ? "..." : pedidosPendentesPagamento}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-success">
            <CardContent className="p-4 md:p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Estoque Baixo</span>
                <PackageMinus className="w-5 h-5 text-success" />
              </div>
              <div className="text-3xl font-display font-bold text-success">
                {inventoryQuery.isLoading ? "..." : estoqueBaixoItens.length}
              </div>
            </CardContent>
          </Card>
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
          <Card className="glass-card border-l-4 border-l-pink-400">
            <CardContent className="p-5 md:p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Produto mais vendido</span>
                <ShoppingBag className="w-5 h-5 text-pink-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-display font-bold leading-tight">
                  {dashboardSummaryQuery.isLoading
                    ? "..."
                    : dashboardSummary?.highlights.topSellingProduct?.productName ??
                      "Sem vendas"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dashboardSummary?.highlights.topSellingProduct?.quantitySold ?? 0}{" "}
                  unidade(s) vendidas nos ultimos 30 dias
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-amber-400">
            <CardContent className="p-5 md:p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Produto mais lucrativo</span>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-display font-bold leading-tight">
                  {dashboardSummaryQuery.isLoading
                    ? "..."
                    : dashboardSummary?.highlights.mostProfitableProduct?.productName ??
                      "Sem base suficiente"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Lucro estimado:{" "}
                  {formatCurrency(
                    (dashboardSummary?.highlights.mostProfitableProduct
                      ?.estimatedProfitCents ?? 0) / 100,
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-primary">
            <CardContent className="p-5 md:p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Itens vendidos</span>
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-display font-bold">
                {dashboardSummaryQuery.isLoading
                  ? "..."
                  : dashboardSummary?.totals.unitsSold ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Quantidade total de unidades vendidas no recorte.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-emerald-400">
            <CardContent className="p-5 md:p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Lucro estimado</span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-display font-bold text-emerald-400">
                {dashboardSummaryQuery.isLoading
                  ? "..."
                  : formatCurrency(
                      (dashboardSummary?.totals.estimatedProfitCents ?? 0) / 100,
                    )}
              </p>
              <p className="text-sm text-muted-foreground">
                Baseado em custo atual das receitas com custo conhecido.
              </p>
            </CardContent>
          </Card>
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
      </div>
    </AppLayout>
  );
}

