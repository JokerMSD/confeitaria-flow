import { useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
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
          description: "Esse grupo já atingiu o máximo permitido.",
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
        title: "Seleção incompleta",
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
        "Escolha a quantidade e os adicionais antes de enviar para o carrinho."
      }
    >
      {product ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-rose-100 bg-white/90">
            <CardContent className="space-y-6 p-6">
              {product.additionalGroups.map((group) => (
                <div key={group.id} className="space-y-3">
                  <div>
                    <h2 className="font-semibold text-rose-950">{group.name}</h2>
                    <p className="text-sm text-rose-700">
                      Escolha entre {group.minSelections} e {group.maxSelections} opções.
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
                          className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                            active
                              ? "border-rose-500 bg-rose-50"
                              : "border-rose-100 bg-white hover:border-rose-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-medium text-rose-950">
                              {option.name}
                            </span>
                            <span className="text-sm font-semibold text-rose-700">
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

          <Card className="border-rose-100 bg-white/90">
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-rose-700">
                  Preço base
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-rose-950">
                  {formatCurrency(
                    (product.effectiveSalePriceCents ??
                      product.salePriceCents ??
                      0) / 100,
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-rose-900">
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
                />
              </div>

              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-sm text-rose-700">Total estimado</p>
                <p className="mt-1 font-display text-2xl font-bold text-rose-950">
                  {formatCurrency(totalCents / 100)}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleAddToCart}
                  className="bg-rose-500 hover:bg-rose-600"
                >
                  Adicionar ao carrinho
                </Button>
                <Link href="/loja/catalogo">
                  <a className="text-center text-sm font-medium text-rose-700 hover:underline">
                    Voltar ao catálogo
                  </a>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p>Carregando produto...</p>
      )}
    </PublicStoreLayout>
  );
}
