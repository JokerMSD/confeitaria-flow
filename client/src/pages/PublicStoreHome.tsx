import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { usePublicStoreHome } from "@/features/public-store/hooks/use-public-store";
import { formatCurrency } from "@/lib/utils";

export default function PublicStoreHome() {
  const homeQuery = usePublicStoreHome();

  return (
    <PublicStoreLayout
      title="Doces sob encomenda, com retirada ou entrega"
      subtitle="Escolha produtos do catálogo público, personalize com adicionais e conclua em Pix manual."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] bg-rose-500 p-8 text-white shadow-xl shadow-rose-500/20">
          <p className="text-sm uppercase tracking-[0.25em] text-rose-100">
            Confeitaria
          </p>
          <h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight">
            Catálogo público integrado ao fluxo real de pedidos.
          </h2>
          <p className="mt-4 max-w-2xl text-rose-50/90">
            O pedido já nasce confirmado, com retirada ou entrega, e segue o mesmo domínio de catálogo, adicionais e produção do sistema interno.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/loja/catalogo">
              <a>
                <Button className="bg-white text-rose-700 hover:bg-rose-50">
                  Ver catálogo
                </Button>
              </a>
            </Link>
            <Link href="/loja/carrinho">
              <a>
                <Button
                  variant="outline"
                  className="border-white/50 bg-transparent text-white hover:bg-white/10"
                >
                  Ir para o carrinho
                </Button>
              </a>
            </Link>
          </div>
        </section>

        <Card className="border-rose-100 bg-white/90 shadow-lg">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">
              Destaques da loja
            </p>
            {homeQuery.data?.data.featuredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl border border-rose-100 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-rose-950">{product.name}</p>
                    <p className="mt-1 text-sm text-rose-800">
                      {product.notes || "Produto do catálogo com adicionais opcionais."}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-rose-700">
                    {formatCurrency(
                      (product.effectiveSalePriceCents ??
                        product.salePriceCents ??
                        0) / 100,
                    )}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PublicStoreLayout>
  );
}
