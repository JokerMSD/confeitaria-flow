import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductionForecast } from "@/features/production/hooks/use-production-forecast";
import { formatDate } from "@/lib/utils";

function formatQuantity(quantity: number, unit: string) {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(quantity)} ${unit}`;
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
        label: "Recheio",
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

  return (
    <AppLayout title="Previsão de Produção">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Previsão operacional
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                A previsão considera pedidos em confirmação ou produção, separa o período e soma receitas, ingredientes e adicionais selecionados.
              </p>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              <Button
                variant="outline"
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="glass-card p-5">
            <p className="text-sm text-muted-foreground">Pedidos no período</p>
            <p className="mt-2 text-3xl font-display font-bold">
              {forecast?.orderCount ?? 0}
            </p>
          </Card>
          <Card className="glass-card p-5">
            <p className="text-sm text-muted-foreground">Itens considerados</p>
            <p className="mt-2 text-3xl font-display font-bold">
              {forecast?.itemCount ?? 0}
            </p>
          </Card>
          <Card className="glass-card p-5">
            <p className="text-sm text-muted-foreground">Receitas acionadas</p>
            <p className="mt-2 text-3xl font-display font-bold">
              {forecast?.totalsByRecipe.length ?? 0}
            </p>
          </Card>
          <Card className="glass-card p-5">
            <p className="text-sm text-muted-foreground">Adicionais ativos</p>
            <p className="mt-2 text-3xl font-display font-bold">
              {forecast?.totalsByAdditional.length ?? 0}
            </p>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((highlight) => (
            <Card key={highlight.label} className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {highlight.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-lg font-bold text-foreground">
                  {highlight.items.length > 0
                    ? highlight.items
                        .map((item) => formatQuantity(item.quantity, item.unit))
                        .join(" • ")
                    : highlight.empty}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr_0.9fr]">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Totais por receita</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {forecastQuery.isLoading ? <p>Carregando previsão...</p> : null}
              {forecastQuery.isError ? (
                <p className="text-destructive">Não foi possível carregar a previsão.</p>
              ) : null}
              {forecast && forecast.totalsByRecipe.length === 0 ? (
                <p className="text-muted-foreground">
                  Nenhum pedido encontrado para o período informado.
                </p>
              ) : null}
              {forecast?.totalsByRecipe.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3"
                >
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="text-sm font-semibold text-primary">
                    {formatQuantity(item.quantity, item.unit)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Ingredientes e adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">
                  Ingredientes previstos
                </p>
                {forecast?.totalsByIngredient.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="font-semibold">
                      {formatQuantity(item.quantity, item.unit)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-semibold text-muted-foreground">
                  Adicionais selecionados
                </p>
                {forecast?.totalsByAdditional.length ? (
                  forecast.totalsByAdditional.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p>{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.groupName}</p>
                      </div>
                      <span className="font-semibold">
                        {formatQuantity(item.quantity, item.unit)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum adicional selecionado no período.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Pedidos considerados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {forecast?.orders.map((order) => (
                <div
                  key={order.orderId}
                  className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{order.orderNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.deliveryDate)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{order.customerName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{order.status}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
