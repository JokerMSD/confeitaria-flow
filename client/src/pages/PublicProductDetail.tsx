import { useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Sparkles } from "lucide-react";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePublicCart } from "@/features/public-store/lib/public-cart";
import { usePublicProduct } from "@/features/public-store/hooks/use-public-store";
import { formatCurrency } from "@/lib/utils";

export default function PublicProductDetail() {
  const [, params] = useRoute("/loja/produtos/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const cart = usePublicCart();
  const productQuery = usePublicProduct(params?.id ?? "");
  const product = productQuery.data?.data;
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  const selectedAdditionals = useMemo(() => {
    if (!product) {
      return [];
    }

    return product.additionalGroups.flatMap((group) => {
      const selectedIds = selectedOptions[group.id] ?? [];
      return group.options
        .filter((option) => selectedIds.includes(option.id))
        .map((option) => ({
          groupId: group.id,
          optionId: option.id,
          groupName: group.name,
          optionName: option.name,
          priceDeltaCents: option.priceDeltaCents,
        }));
    });
  }, [product, selectedOptions]);

  const totalCents = useMemo(() => {
    const basePrice =
      product?.effectiveSalePriceCents ?? product?.salePriceCents ?? 0;
    const additionalsPrice = selectedAdditionals.reduce(
      (sum, additional) => sum + additional.priceDeltaCents,
      0,
    );
    return quantity * (basePrice + additionalsPrice);
  }, [product, quantity, selectedAdditionals]);

  const toggleOption = (
    groupId: string,
    optionId: string,
    selectionType: "single" | "multiple",
    maxSelections: number,
  ) => {
    setSelectedOptions((current) => {
      const currentSelection = current[groupId] ?? [];

      if (selectionType === "single") {
        return {
          ...current,
          [groupId]: currentSelection[0] === optionId ? [] : [optionId],
        };
      }

      if (currentSelection.includes(optionId)) {
        return {
          ...current,
          [groupId]: currentSelection.filter((id) => id !== optionId),
        };
      }

      if (currentSelection.length >= maxSelections) {
        toast({
          title: "Limite de adicionais",
          description: "Esse grupo ja atingiu o maximo permitido.",
          variant: "destructive",
        });
        return current;
      }

      return {
        ...current,
        [groupId]: [...currentSelection, optionId],
      };
    });
  };

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    const invalidGroup = product.additionalGroups.find((group) => {
      const count = (selectedOptions[group.id] ?? []).length;
      return count < group.minSelections || count > group.maxSelections;
    });

    if (invalidGroup) {
      toast({
        title: "Selecao incompleta",
        description: `Revise o grupo ${invalidGroup.name} antes de adicionar ao carrinho.`,
        variant: "destructive",
      });
      return;
    }

    cart.addItem({
      recipeId: product.id,
      name: product.name,
      quantity,
      unitPriceCents:
        product.effectiveSalePriceCents ?? product.salePriceCents ?? 0,
      additionals: selectedAdditionals,
    });

    toast({
      title: "Produto adicionado",
      description: "O item foi enviado para o carrinho.",
    });
    setLocation("/loja/carrinho");
  };

  return (
    <PublicStoreLayout
      title={product?.name ?? "Produto"}
      subtitle={
        product?.notes ||
        "Escolha a quantidade, revise os adicionais e envie o produto para o carrinho."
      }
    >
      {product ? (
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Card className="brand-shell overflow-hidden">
            <CardContent className="space-y-6 p-6">
              <div className="rounded-[1.75rem] border border-border/70 bg-background/55 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">
                  personalizacao
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Selecione os adicionais com calma. O backend continua validando limites e grupos.
                </p>
              </div>

              {product.additionalGroups.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-border bg-background/45 p-5 text-sm leading-6 text-muted-foreground">
                  Esse produto nao possui adicionais opcionais no momento.
                </div>
              ) : null}

              {product.additionalGroups.map((group) => (
                <div key={group.id} className="space-y-3">
                  <div>
                    <h2 className="font-semibold text-foreground">{group.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Escolha entre {group.minSelections} e {group.maxSelections} opcoes.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {group.options.map((option) => {
                      const active = (selectedOptions[group.id] ?? []).includes(
                        option.id,
                      );
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            toggleOption(
                              group.id,
                              option.id,
                              group.selectionType,
                              group.maxSelections,
                            )
                          }
                          className={
                            active
                              ? "rounded-[1.5rem] border border-primary bg-secondary px-4 py-4 text-left shadow-sm transition-colors"
                              : "rounded-[1.5rem] border border-border bg-card/70 px-4 py-4 text-left transition-colors hover:border-primary/45 hover:bg-background/70"
                          }
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-medium text-foreground">
                              {option.name}
                            </span>
                            <span className="text-sm font-semibold text-primary">
                              {option.priceDeltaCents > 0
                                ? `+ ${formatCurrency(option.priceDeltaCents / 100)}`
                                : "Incluso"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="brand-shell overflow-hidden">
            <CardContent className="space-y-6 p-6">
              <div className="brand-hero rounded-[1.9rem] border border-border/70 p-5">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                    resumo do produto
                  </p>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Preco base</p>
                <p className="mt-1 font-display text-4xl font-bold text-foreground">
                  {formatCurrency(
                    (product.effectiveSalePriceCents ??
                      product.salePriceCents ??
                      0) / 100,
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Quantidade
                </label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Math.max(1, Number(event.target.value) || 1))
                  }
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="rounded-[1.75rem] border border-border/70 bg-background/55 p-4">
                <p className="text-sm text-muted-foreground">Total estimado</p>
                <p className="mt-1 font-display text-3xl font-bold text-foreground">
                  {formatCurrency(totalCents / 100)}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleAddToCart}
                  className="brand-button h-12 rounded-full"
                >
                  Adicionar ao carrinho
                </Button>
                <Link href="/loja/catalogo">
                  <a className="text-center text-sm font-medium text-primary hover:underline">
                    Voltar ao catalogo
                  </a>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="brand-shell p-8 text-muted-foreground">Carregando produto...</div>
      )}
    </PublicStoreLayout>
  );
}
