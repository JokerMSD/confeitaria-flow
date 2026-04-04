import { Link, useLocation, useRoute } from "wouter";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  ImageIcon,
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
import { resolveMediaUrl } from "@/lib/resolve-media-url";

export default function PublicProductDetail() {
  const [, params] = useRoute("/loja/produtos/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const cart = usePublicCart();
  const productQuery = usePublicProduct(params?.id ?? "");
  const product = productQuery.data?.data;
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  const [previewFillingIds, setPreviewFillingIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedGalleryImage(product?.imageUrls[0] ?? null);
    setPreviewFillingIds([]);
  }, [product?.id, product?.imageUrls]);

  const activeFillingPhotoUrl = useMemo(() => {
    if (!product) {
      return null;
    }

    for (const fillingId of previewFillingIds) {
      const filling = product.fillingOptions.find((option) => option.id === fillingId);
      if (filling?.photoUrl) {
        return filling.photoUrl;
      }
    }

    return null;
  }, [previewFillingIds, product]);

  const heroImageUrl = activeFillingPhotoUrl ?? selectedGalleryImage ?? product?.imageUrls[0] ?? null;

  return (
    <PublicStoreLayout
      title={product?.name ?? "Produto"}
      subtitle={
        product?.notes ||
        "Escolha sabores, extras e quantidade para montar o seu pedido."
      }
    >
      {product ? (
        <div className="space-y-6">
          <section className="brand-shell overflow-hidden p-5 md:p-7">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link href="/loja">
                <a className="transition-colors hover:text-foreground">Loja</a>
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/loja/catalogo">
                <a className="transition-colors hover:text-foreground">Catalogo</a>
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{product.name}</span>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-6">
              <section className="brand-shell overflow-hidden p-5 md:p-6">
                <div className="grid gap-5 lg:grid-cols-[0.2fr_0.8fr]">
                  {product.imageUrls.length > 1 ? (
                    <div className="order-2 grid grid-cols-4 gap-3 lg:order-1 lg:grid-cols-1">
                      {product.imageUrls.slice(0, 5).map((imageUrl) => {
                        const isActive =
                          imageUrl === selectedGalleryImage && !activeFillingPhotoUrl;

                        return (
                          <button
                            type="button"
                            key={imageUrl}
                            onClick={() => setSelectedGalleryImage(imageUrl)}
                            className={
                              isActive
                                ? "aspect-square overflow-hidden rounded-[1.2rem] border-2 border-primary bg-muted/20 shadow-md shadow-primary/10"
                                : "aspect-square overflow-hidden rounded-[1.2rem] border border-border/70 bg-muted/20 transition-colors hover:border-primary/35"
                            }
                          >
                            <img
                              src={resolveMediaUrl(imageUrl)}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className="order-1 space-y-4 lg:order-2">
                    <div className="aspect-[1.08/1] overflow-hidden rounded-[2rem] border border-border/70 bg-muted/20 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
                      {heroImageUrl ? (
                        <img
                          src={resolveMediaUrl(heroImageUrl)}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/10 via-secondary/15 to-background text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                          <span className="text-sm">Imagem em breve</span>
                        </div>
                      )}
                    </div>

                    {activeFillingPhotoUrl ? (
                      <div className="rounded-[1.35rem] border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                        A foto principal acompanha o sabor selecionado.
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="brand-shell brand-hero p-6 md:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">
                    Feito sob encomenda
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/70 bg-background/75"
                  >
                    {product.maxFillings > 1
                      ? `Ate ${product.maxFillings} sabores`
                      : "1 sabor por item"}
                  </Badge>
                  {product.additionalGroupCount > 0 ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/70 bg-background/75"
                    >
                      Extras disponiveis
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <h2 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
                      {product.name}
                    </h2>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                      {product.notes ||
                        "Escolha sabores, quantidade e extras para montar um pedido do seu jeito."}
                    </p>
                  </div>

                  <div className="rounded-[1.8rem] border border-border/70 bg-background/70 px-5 py-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      A partir de
                    </p>
                    <p className="mt-2 font-display text-4xl font-bold text-foreground">
                      {formatCurrency(
                        (product.effectiveSalePriceCents ??
                          product.salePriceCents ??
                          0) / 100,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1.35rem] border border-border/70 bg-background/55 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Sabores
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {product.fillingOptions.length || 0}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Opcoes para combinar
                    </p>
                  </div>
                  <div className="rounded-[1.35rem] border border-border/70 bg-background/55 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Extras
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {product.additionalGroupCount}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Grupos para personalizar
                    </p>
                  </div>
                  <div className="rounded-[1.35rem] border border-border/70 bg-background/55 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Pedido
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      Entrega ou retirada
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Escolha no checkout
                    </p>
                  </div>
                </div>

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
              </section>
            </div>

            <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
              <Card className="brand-shell overflow-hidden">
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-center gap-2 text-primary">
                    <ShoppingBag className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                      Monte do seu jeito
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    {[
                      "Escolha o sabor que mais combina com o seu pedido.",
                      "Acrescente extras para deixar tudo ainda mais especial.",
                      "Defina a quantidade e envie para o carrinho.",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-[1.35rem] border border-border/70 bg-background/55 px-4 py-4 text-sm leading-6 text-muted-foreground"
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <PublicItemCustomizerPanel
                    product={product}
                    onSelectionPreviewChange={setPreviewFillingIds}
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

              <Card className="brand-shell">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                      Sugestao de pedido
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
                    <p className="text-sm text-muted-foreground">
                      Uma combinacao que costuma funcionar muito bem
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
                      A partir de{" "}
                      {formatCurrency(
                        (product.effectiveSalePriceCents ??
                          product.salePriceCents ??
                          0) / 100,
                      )}
                      {product.additionalGroups[0]?.options[0]
                        ? ` e com extras a partir de ${formatCurrency(
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

                  <div className="rounded-[1.5rem] border border-dashed border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
                    O valor final muda conforme sabores, extras e quantidade escolhidos antes de ir para o carrinho.
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
