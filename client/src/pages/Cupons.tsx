import { Link } from "wouter";
import { Loader2, Plus, TicketPercent } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDiscountCoupons } from "@/features/discount-coupons/hooks/use-discount-coupons";
import { formatCurrency } from "@/lib/utils";

function formatCouponValue(type: "Percentual" | "ValorFixo", value: number) {
  return type === "Percentual" ? `${value}%` : formatCurrency(value / 100);
}

export default function Cupons() {
  const { data, isLoading, error, refetch } = useDiscountCoupons();
  const coupons = data?.data ?? [];

  return (
    <AppLayout title="Cupons">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-border bg-card/80 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold text-foreground">
                Cupons de desconto
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Cadastre codigos para o checkout publico e acompanhe se estao ativos.
              </p>
            </div>
            <Link href="/cupons/novo">
              <a>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo cupom
                </Button>
              </a>
            </Link>
          </div>
        </section>

        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center gap-3 rounded-[28px] border border-border bg-card/80 p-10 text-muted-foreground shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando cupons...</span>
          </div>
        ) : error ? (
          <div className="space-y-4 rounded-[28px] border border-border bg-card/80 p-10 text-center shadow-sm">
            <p className="font-medium text-destructive">
              Nao foi possivel carregar os cupons.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : coupons.length === 0 ? (
          <div className="space-y-4 rounded-[28px] border border-border bg-card/80 p-10 text-center shadow-sm">
            <p className="text-muted-foreground">
              Nenhum cupom cadastrado ainda.
            </p>
            <Link href="/cupons/novo">
              <a>
                <Button variant="outline">Criar primeiro cupom</Button>
              </a>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {coupons.map((coupon) => (
              <Card key={coupon.id} className="border-border/70 bg-card/80">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        <TicketPercent className="h-3.5 w-3.5" />
                        {coupon.code}
                      </div>
                      <h3 className="mt-3 text-xl font-semibold text-foreground">
                        {coupon.title}
                      </h3>
                      {coupon.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {coupon.description}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        coupon.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-destructive/20 bg-destructive/5 text-destructive"
                      }`}
                    >
                      {coupon.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Desconto
                      </p>
                      <p className="mt-2 font-semibold text-foreground">
                        {formatCouponValue(coupon.discountType, coupon.discountValue)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Minimo
                      </p>
                      <p className="mt-2 font-semibold text-foreground">
                        {coupon.minimumOrderAmountCents > 0
                          ? formatCurrency(coupon.minimumOrderAmountCents / 100)
                          : "Sem minimo"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Tipo
                      </p>
                      <p className="mt-2 font-semibold text-foreground">
                        {coupon.discountType === "Percentual"
                          ? "Percentual"
                          : "Valor fixo"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link href={`/cupons/${coupon.id}`}>
                      <a className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                        Editar cupom
                      </a>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
