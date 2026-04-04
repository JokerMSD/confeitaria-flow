import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { usePublicProducts } from "@/features/public-store/hooks/use-public-store";
import { formatCurrency } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/resolve-media-url";

export default function PublicCatalog() {
  const productsQuery = usePublicProducts();
  const [search, setSearch] = useState("");
  const products = productsQuery.data?.data ?? [];
  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.notes ?? ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [products, search],
  );

  return (
    <PublicStoreLayout
      title="Catalogo da loja"
      subtitle="Uma vitrine mais focada em compra: busca rapida, preco claro, leitura comercial e atalhos para montar o pedido."
    >
      <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="brand-shell p-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por bolo, doce, sabor ou destaque..."
            className="h-12 rounded-2xl border-border/70 bg-background/70"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="rounded-full border-border/70 bg-card/85 px-4 py-2"
          >
            {filteredProducts.length} item(ns)
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full border-border/70 bg-card/85 px-4 py-2"
          >
            Pedido online
          </Badge>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <Link key={product.id} href={`/loja/produtos/${product.id}`}>
            <a>
              <Card className="brand-shell h-full overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
                <CardContent className="space-y-5 p-6">
                  <div className="aspect-[4/3] overflow-hidden rounded-[1.6rem] border border-border/70 bg-muted/20">
                    {product.primaryImageUrl ? (
                      <img
                        src={resolveMediaUrl(product.primaryImageUrl)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/15 to-background text-sm text-muted-foreground">
                        Universo Doce
                      </div>
                    )}
                  </div>
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
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/70 bg-background/70"
                    >
                      {product.additionalGroupCount > 0
                        ? `${product.additionalGroupCount} grupos de extras`
                        : "Montagem simples"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/70 bg-background/70"
                    >
                      Checkout online
                    </Badge>
                  </div>
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
