import { Link } from "wouter";
import {
  ArrowRight,
  HeartHandshake,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { usePublicStoreHome } from "@/features/public-store/hooks/use-public-store";
import { formatCurrency } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { resolveMediaUrl } from "@/lib/resolve-media-url";

export default function PublicStoreHome() {
  const homeQuery = usePublicStoreHome();

  return (
    <PublicStoreLayout
      title="Encomende doces da Universo Doce em um site feito para vender"
      subtitle="Escolha seus doces favoritos, personalize sabores e finalize seu pedido de um jeito simples e bonito."
    >
      <div className="space-y-6">
        <section className="brand-shell brand-hero overflow-hidden p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="brand-pill">feito sob encomenda</div>
                <Badge
                  variant="outline"
                  className="rounded-full border-border/70 bg-background/70"
                >
                  Pedido online via Pix
                </Badge>
              </div>
              <h2 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
                Bolos e doces com visual delicado, pedido simples e foco total em compra.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                O cliente escolhe produto, sabor, extras, quantidade, entrega ou retirada em um fluxo mais comercial e muito mais claro no celular.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/loja/catalogo">
                  <a>
                    <Button className="brand-button gap-2 rounded-full px-6">
                      Ver catalogo
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </Link>
                <Link href="/loja/carrinho">
                  <a>
                    <Button
                      variant="outline"
                      className="rounded-full border-border bg-card/80 px-6"
                    >
                      Ir para o carrinho
                    </Button>
                  </a>
                </Link>
              </div>
            </div>

            <div className="brand-grid rounded-[2rem] border border-border/70 bg-background/60 p-6">
              <div className="mx-auto max-w-sm">
                <BrandLogo
                  className="justify-center"
                  imageClassName="h-auto w-full max-w-[18rem] rounded-[1.75rem]"
                  showWordmark={false}
                />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-border/70 bg-card/85 p-4">
                  <Truck className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Entrega ou retirada
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 bg-card/85 p-4">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Sabores e extras
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 bg-card/85 p-4">
                  <HeartHandshake className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Atendimento humano
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="brand-shell self-start p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">
              Como comprar
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "1. Escolha",
                  text: "Navegue pelo catalogo, encontre o produto e veja o preco com linguagem mais comercial.",
                },
                {
                  title: "2. Personalize",
                  text: "Escolha sabores, extras e quantidade do seu jeito antes de seguir para o carrinho.",
                },
                {
                  title: "3. Confirme",
                  text: "Informe entrega ou retirada, escolha data e horario e confirme o pedido.",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="rounded-[1.75rem] border border-border/70 bg-background/60 p-5"
                >
                  <p className="text-sm font-semibold text-primary">
                    {step.title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Card className="brand-shell self-start overflow-hidden">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">
                Mais pedidos da loja
              </p>
              {homeQuery.data?.data.featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-[1.5rem] border border-border/70 bg-background/55 px-4 py-4"
                >
                  {product.primaryImageUrl ? (
                    <div className="mb-3 aspect-[4/3] overflow-hidden rounded-[1.2rem] border border-border/60 bg-muted/20">
                      <img
                        src={resolveMediaUrl(product.primaryImageUrl)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        {product.name}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {product.notes ||
                          "Escolha ideal para montar seu pedido com o seu toque."}
                      </p>
                    </div>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                      {formatCurrency(
                        (product.effectiveSalePriceCents ??
                          product.salePriceCents ??
                          0) / 100,
                      )}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Star className="h-3.5 w-3.5 text-primary" />
                    pronto para encomenda
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            "Vitrine clara para escolher doces, bolos e presentes especiais.",
            "Sabores e extras para montar o pedido do seu jeito.",
            "Checkout simples para combinar entrega ou retirada.",
          ].map((highlight) => (
            <div
              key={highlight}
              className="brand-shell p-5 text-sm leading-6 text-muted-foreground"
            >
              {highlight}
            </div>
          ))}
        </section>
      </div>
    </PublicStoreLayout>
  );
}
