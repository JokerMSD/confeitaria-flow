import { Link, useLocation, useRoute } from "wouter";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
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
                    "Escolha a combinacao que mais combina com a sua encomenda."}
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
                  <div className="aspect-[4/3] overflow-hidden rounded-[1.6rem] border border-border/70 bg-muted/20">
                    {heroImageUrl ? (
                      <img
                        src={resolveMediaUrl(heroImageUrl)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/15 to-background text-sm text-muted-foreground">
                        Universo Doce
                      </div>
                    )}
                  </div>
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                    destaques do item
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
                      {activeFillingPhotoUrl ? (
                        <p className="mt-1 text-xs text-primary">
                          A foto principal acompanha o sabor selecionado.
                        </p>
                      ) : null}
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
                {product.imageUrls.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {product.imageUrls.slice(0, 4).map((imageUrl) => (
                      <button
                        type="button"
                        key={imageUrl}
                        onClick={() => setSelectedGalleryImage(imageUrl)}
                        className={
                          imageUrl === selectedGalleryImage && !activeFillingPhotoUrl
                            ? "aspect-[4/3] overflow-hidden rounded-[1.25rem] border-2 border-primary bg-muted/20"
                            : "aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-border/70 bg-muted/20"
                        }
                      >
                        <img
                          src={resolveMediaUrl(imageUrl)}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
                {activeFillingPhotoUrl ? (
                  <div className="rounded-[1.25rem] border border-primary/30 bg-primary/8 px-4 py-3 text-sm text-primary">
                    Mostrando a foto do sabor selecionado. Sem sabor selecionado, a galeria do produto volta a ser a principal.
                  </div>
                ) : null}
                <div className="flex items-center gap-2 text-primary">
                  <ShoppingBag className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                    monte do seu jeito
                  </p>
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

            <div className="space-y-6">
              <Card className="brand-shell">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                      escolha ideal para voce
                    </p>
                  </div>
                  {[
                    "Combine sabores para deixar o pedido do seu jeito.",
                    "Acrescente extras para deixar tudo ainda mais especial.",
                    "Escolha a quantidade e finalize com entrega ou retirada.",
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
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                    sugestao de montagem
                  </p>
                  <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
                    <p className="text-sm text-muted-foreground">
                      Seu item pode ficar assim
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
