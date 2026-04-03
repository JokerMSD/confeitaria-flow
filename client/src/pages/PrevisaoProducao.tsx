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
  const [deliveryDate, setDeliveryDate] = useState("");
  const forecastQuery = useProductionForecast(deliveryDate || undefined);
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
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Previsão por pedidos confirmados
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              O módulo explode receitas, adicionais e preparações dos pedidos em confirmação ou produção para antecipar chocolate, recheios e totais por receita.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={deliveryDate}
              onChange={(event) => setDeliveryDate(event.target.value)}
              className="w-full md:w-[180px]"
            />
            <Button variant="outline" onClick={() => setDeliveryDate("")}>
              Limpar
            </Button>
          </div>
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

        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Totais por receita</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {forecastQuery.isLoading ? <p>Carregando previsão...</p> : null}
              {forecastQuery.isError ? (
                <p className="text-destructive">
                  Não foi possível carregar a previsão.
                </p>
              ) : null}
              {forecast && forecast.totalsByRecipe.length === 0 ? (
                <p className="text-muted-foreground">
                  Nenhum pedido confirmado encontrado para o filtro atual.
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

          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Ingredientes previstos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {forecast?.totalsByIngredient.slice(0, 12).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{item.name}</span>
                    <span className="font-semibold text-foreground">
                      {formatQuantity(item.quantity, item.unit)}
                    </span>
                  </div>
                ))}
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
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.customerName}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
