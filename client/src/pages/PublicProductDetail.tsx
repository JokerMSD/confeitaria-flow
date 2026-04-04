import { Link, useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { useToast } from "@/hooks/use-toast";
import { usePublicProduct } from "@/features/public-store/hooks/use-public-store";
import { usePublicCart } from "@/features/public-store/lib/public-cart";
import { PublicItemCustomizerPanel } from "@/features/public-store/components/PublicItemCustomizerPanel";
import { calculatePublicItemUnitTotalCents } from "@/features/public-store/lib/public-store-item";
import { formatCurrency } from "@/lib/utils";

export default function PublicProductDetail() {
  const [, params] = useRoute("/loja/produtos/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const cart = usePublicCart();
  const productQuery = usePublicProduct(params?.id ?? "");
  const product = productQuery.data?.data;

  return (
    <PublicStoreLayout
      title={product?.name ?? "Produto"}
      subtitle={
        product?.notes ||
        "Monte sabores, extras e quantidade em uma experiencia mais proxima de um app de delivery."
      }
    >
      {product ? (
        <div className="space-y-6">
          <section className="brand-shell brand-hero overflow-hidden p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">
                    Escolha como no iFood
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/70 bg-background/70"
                  >
                    {product.maxFillings > 1
                      ? `Ate ${product.maxFillings} sabores`
                      : "1 sabor por item"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/70 bg-background/70"
                  >
                    {product.additionalGroupCount > 0
                      ? `${product.additionalGroupCount} grupos de extras`
                      : "Montagem simples"}
                  </Badge>
                </div>
                <h2 className="mt-5 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
                  {product.name}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  {product.notes ||
                    "Produto do catalogo publico integrado ao fluxo real da confeitaria, com sabores e adicionais validados no backend."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/loja/catalogo">
                    <a>
                      <Button
                        variant="outline"
                        className="rounded-full border-border/70 bg-card/85"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao catalogo
                      </Button>
                    </a>
                  </Link>
                  <Link href="/loja/carrinho">
                    <a>
                      <Button className="brand-button rounded-full px-6">
                        Ver carrinho
                      </Button>
                    </a>
                  </Link>
                </div>
              </div>

              <Card className="brand-shell overflow-hidden">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                      resumo rapido
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Preco base</p>
                    <p className="mt-1 font-display text-4xl font-bold text-foreground">
                      {formatCurrency(
                        (product.effectiveSalePriceCents ??
                          product.salePriceCents ??
                          0) / 100,
                      )}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/55 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        sabores
                      </p>
                      <p className="mt-2 font-semibold text-foreground">
                        {product.fillingOptions.length} opcoes disponiveis
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/55 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        extras
                      </p>
                      <p className="mt-2 font-semibold text-foreground">
                        {product.additionalGroupCount > 0
                          ? "Configurados por grupo"
                          : "Sem extras opcionais"}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-dashed border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
                    O total final muda conforme sabores, extras e quantidade escolhidos antes de ir para o carrinho.
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="brand-shell overflow-hidden">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center gap-2 text-primary">
                  <ShoppingBag className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                    personalize este item
                  </p>
                </div>

                <PublicItemCustomizerPanel
                  product={product}
                  submitLabel="Adicionar ao carrinho"
                  onSubmit={(draft) => {
                    cart.addItem(draft);
                    toast({
                      title: "Produto adicionado",
                      description: "Seu item foi enviado para o carrinho.",
                    });
                    setLocation("/loja/carrinho");
                  }}
                />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="brand-shell">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                      o que voce escolhe aqui
                    </p>
                  </div>
                  {[
                    "Sabores com ate tres combinacoes quando o produto permitir.",
                    "Adicionais estruturados por grupo, com limite e preco claros.",
                    "Quantidade, carrinho e checkout com entrega ou retirada.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.4rem] border border-border/70 bg-background/55 px-4 py-4 text-sm leading-6 text-muted-foreground"
                    >
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="brand-shell">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                      por tras do checkout
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    O backend continua sendo a autoridade. Os grupos de extras, os limites de selecao e a montagem do nome do item sao validados no mesmo dominio dos pedidos internos.
                  </p>
                  <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
                    <p className="text-sm text-muted-foreground">
                      Exemplo de item montado
                    </p>
                    <p className="mt-2 font-semibold text-foreground">
                      {product.fillingOptions.length > 0
                        ? `${product.name} - ${product.fillingOptions
                            .slice(0, Math.min(product.maxFillings, 2))
                            .map((item) => item.name)
                            .join(" / ")}`
                        : product.name}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Base:{" "}
                      {formatCurrency(
                        (product.effectiveSalePriceCents ??
                          product.salePriceCents ??
                          0) / 100,
                      )}
                      {product.additionalGroups[0]?.options[0]
                        ? ` + extras a partir de ${formatCurrency(
                            calculatePublicItemUnitTotalCents({
                              unitPriceCents:
                                product.effectiveSalePriceCents ??
                                product.salePriceCents ??
                                0,
                              additionals: [
                                {
                                  groupId: product.additionalGroups[0].id,
                                  optionId: product.additionalGroups[0].options[0].id,
                                  priceDeltaCents:
                                    product.additionalGroups[0].options[0]
                                      .priceDeltaCents,
                                },
                              ],
                            }) / 100,
                          )}`
                        : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="brand-shell p-8 text-muted-foreground">
          Carregando produto...
        </div>
      )}
    </PublicStoreLayout>
  );
}
