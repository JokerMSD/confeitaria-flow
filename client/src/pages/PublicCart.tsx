import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { usePublicCart } from "@/features/public-store/lib/public-cart";
import { formatCurrency } from "@/lib/utils";

export default function PublicCart() {
  const cart = usePublicCart();

  return (
    <PublicStoreLayout
      title="Carrinho"
      subtitle="Revise os itens antes de seguir para o checkout público."
    >
      {cart.items.length === 0 ? (
        <Card className="border-rose-100 bg-white/90">
          <CardContent className="space-y-4 p-8 text-center">
            <p className="text-lg font-semibold text-rose-950">
              Seu carrinho está vazio.
            </p>
            <Link href="/loja/catalogo">
              <a>
                <Button className="bg-rose-500 hover:bg-rose-600">
                  Voltar ao catálogo
                </Button>
              </a>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <Card key={item.lineId} className="border-rose-100 bg-white/90">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold text-rose-950">{item.name}</h2>
                      {item.additionals.length > 0 ? (
                        <p className="mt-1 text-sm text-rose-700">
                          {item.additionals
                            .map((additional) => additional.optionName)
                            .join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <span className="font-semibold text-rose-700">
                      {formatCurrency(
                        (item.unitPriceCents +
                          item.additionals.reduce(
                            (sum, additional) => sum + additional.priceDeltaCents,
                            0,
                          )) /
                          100,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          cart.updateQuantity(item.lineId, item.quantity - 1)
                        }
                      >
                        -
                      </Button>
                      <span className="min-w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() =>
                          cart.updateQuantity(item.lineId, item.quantity + 1)
                        }
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => cart.removeItem(item.lineId)}
                    >
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-rose-100 bg-white/90">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm uppercase tracking-wide text-rose-700">
                Resumo
              </p>
              <div className="flex items-center justify-between">
                <span>Itens</span>
                <span className="font-semibold">{cart.itemCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span className="font-display text-2xl font-bold text-rose-950">
                  {formatCurrency(cart.totalCents / 100)}
                </span>
              </div>
              <Link href="/loja/checkout">
                <a>
                  <Button className="w-full bg-rose-500 hover:bg-rose-600">
                    Ir para checkout
                  </Button>
                </a>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </PublicStoreLayout>
  );
}
