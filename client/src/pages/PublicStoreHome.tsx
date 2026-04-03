import { Link } from "wouter";
import { ArrowRight, HeartHandshake, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { usePublicStoreHome } from "@/features/public-store/hooks/use-public-store";
import { formatCurrency } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function PublicStoreHome() {
  const homeQuery = usePublicStoreHome();

  return (
    <PublicStoreLayout
      title="Doces sob encomenda com a cara da Universo Doce"
      subtitle="Escolha no catalogo publico, personalize com adicionais e finalize com retirada ou entrega em um fluxo simples no celular."
    >
      <div className="space-y-6">
        <section className="brand-shell brand-hero overflow-hidden p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="brand-pill">feito sob encomenda</div>
              <h2 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
                Bolos e doces com visual delicado, pedido simples e atendimento real.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                A frente publica conversa com o mesmo catalogo usado internamente.
                Isso deixa entrega, retirada, adicionais e producao alinhados desde o checkout.
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
                    Adicionais no checkout
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

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="brand-shell p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">
              Como funciona
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "1. Escolha",
                  text: "Navegue pelo catalogo e abra o detalhe do produto para montar o pedido.",
                },
                {
                  title: "2. Personalize",
                  text: "Adicione opcoes extras e confira tudo no carrinho antes de fechar.",
                },
                {
                  title: "3. Confirme",
                  text: "Informe entrega ou retirada, data e horario e finalize em Pix manual.",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="rounded-[1.75rem] border border-border/70 bg-background/60 p-5"
                >
                  <p className="text-sm font-semibold text-primary">{step.title}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Card className="brand-shell overflow-hidden">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">
                Destaques da loja
              </p>
              {homeQuery.data?.data.featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-[1.5rem] border border-border/70 bg-background/55 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{product.name}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {product.notes || "Produto do catalogo com adicionais opcionais."}
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
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            "Paleta suave inspirada na marca, sem perder contraste.",
            "Modo claro e escuro persistidos para loja e painel.",
            "Logo aplicada nos pontos de maior valor visual da experiencia.",
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
