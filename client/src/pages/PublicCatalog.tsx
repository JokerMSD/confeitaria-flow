import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { usePublicProducts } from "@/features/public-store/hooks/use-public-store";
import { formatCurrency } from "@/lib/utils";

export default function PublicCatalog() {
  const productsQuery = usePublicProducts();

  return (
    <PublicStoreLayout
      title="Catálogo público"
      subtitle="Produtos vendáveis do catálogo interno disponíveis para pedido do cliente final."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {productsQuery.data?.data.map((product) => (
          <Link key={product.id} href={`/loja/produtos/${product.id}`}>
            <a>
              <Card className="h-full border-rose-100 bg-white/90 transition-transform hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="font-display text-xl font-bold text-rose-950">
                      {product.name}
                    </h2>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                      {formatCurrency(
                        (product.effectiveSalePriceCents ??
                          product.salePriceCents ??
                          0) / 100,
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-rose-800">
                    {product.notes || "Produto disponível para pedido público."}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-rose-600">
                    {product.additionalGroupCount > 0
                      ? `${product.additionalGroupCount} grupos de adicionais`
                      : "Sem adicionais opcionais"}
                  </p>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>
    </PublicStoreLayout>
  );
}
