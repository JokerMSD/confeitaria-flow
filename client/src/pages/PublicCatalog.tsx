import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { usePublicProducts } from "@/features/public-store/hooks/use-public-store";
import { formatCurrency } from "@/lib/utils";

export default function PublicCatalog() {
  const productsQuery = usePublicProducts();

  return (
    <PublicStoreLayout
      title="Catalogo publico"
      subtitle="Produtos vendaveis do catalogo interno com leitura mais limpa, preco claro e indicacao de adicionais."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {productsQuery.data?.data.map((product) => (
          <Link key={product.id} href={`/loja/produtos/${product.id}`}>
            <a>
              <Card className="brand-shell h-full overflow-hidden transition-transform duration-300 hover:-translate-y-1">
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                        Universo Doce
                      </p>
                      <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
                        {product.name}
                      </h2>
                    </div>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                      {formatCurrency(
                        (product.effectiveSalePriceCents ??
                          product.salePriceCents ??
                          0) / 100,
                      )}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {product.notes || "Produto disponivel para pedido publico."}
                  </p>
                  <div className="flex items-center justify-between rounded-[1.4rem] border border-border/70 bg-background/55 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      {product.additionalGroupCount > 0
                        ? `${product.additionalGroupCount} grupos de adicionais`
                        : "sem adicionais opcionais"}
                    </p>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>
    </PublicStoreLayout>
  );
}
