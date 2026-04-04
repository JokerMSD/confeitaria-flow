import { useEffect, useMemo, useState } from "react";
import type {
  ProductAdditionalGroupDetail,
  PublicStoreProductDetail,
} from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type {
  PublicCartItem,
  PublicCartItemAdditional,
} from "../lib/public-cart";
import {
  buildPublicOrderItemName,
  calculatePublicItemUnitTotalCents,
  getPublicProductUnitPriceCents,
} from "../lib/public-store-item";
import { formatCurrency } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/resolve-media-url";

type DraftItem = Omit<PublicCartItem, "lineId">;

function buildAdditionalGroupRule(group: ProductAdditionalGroupDetail) {
  if (group.selectionType === "single") {
    return group.minSelections > 0 ? "Escolha 1 opcao" : "Opcional";
  }

  if (group.minSelections > 0) {
    return `Escolha de ${group.minSelections} ate ${group.maxSelections}`;
  }

  return `Ate ${group.maxSelections} opcao(oes)`;
}

function dedupeFillings(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

export function PublicItemCustomizerPanel({
  product,
  initialItem,
  submitLabel,
  onSubmit,
  onSelectionPreviewChange,
}: {
  product: PublicStoreProductDetail;
  initialItem?: PublicCartItem | null;
  submitLabel: string;
  onSubmit: (item: DraftItem) => void;
  onSelectionPreviewChange?: (selectedFillingIds: string[]) => void;
}) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedFillingIds, setSelectedFillingIds] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(
    {},
  );

  useEffect(() => {
    if (!initialItem) {
      setQuantity(1);
      setSelectedFillingIds([]);
      setSelectedOptions({});
      return;
    }

    setQuantity(initialItem.quantity);
    setSelectedFillingIds(initialItem.fillingRecipeIds);
    setSelectedOptions(
      initialItem.additionals.reduce<Record<string, string[]>>((acc, additional) => {
        acc[additional.groupId] = [...(acc[additional.groupId] ?? []), additional.optionId];
        return acc;
      }, {}),
    );
  }, [initialItem]);

  const selectedFillings = useMemo(
    () =>
      dedupeFillings(selectedFillingIds)
        .map((id) => product.fillingOptions.find((option) => option.id === id))
        .filter((value): value is NonNullable<typeof value> => Boolean(value)),
    [product.fillingOptions, selectedFillingIds],
  );

  useEffect(() => {
    onSelectionPreviewChange?.(dedupeFillings(selectedFillingIds));
  }, [onSelectionPreviewChange, selectedFillingIds]);

  const selectedAdditionals = useMemo(() => {
    return product.additionalGroups.flatMap((group) => {
      const selectedIds = selectedOptions[group.id] ?? [];
      return group.options
        .filter((option) => selectedIds.includes(option.id))
        .map<PublicCartItemAdditional>((option) => ({
          groupId: group.id,
          optionId: option.id,
          groupName: group.name,
          optionName: option.name,
          priceDeltaCents: option.priceDeltaCents,
        }));
    });
  }, [product.additionalGroups, selectedOptions]);

  const unitPriceCents = getPublicProductUnitPriceCents(product);
  const totalCents = quantity *
    calculatePublicItemUnitTotalCents({
      unitPriceCents,
      additionals: selectedAdditionals,
    });

  const toggleFilling = (fillingId: string) => {
    setSelectedFillingIds((current) => {
      if (current.includes(fillingId)) {
        if (current.length <= product.minFillings) {
          return current;
        }

        return current.filter((id) => id !== fillingId);
      }

      if (current.length >= product.maxFillings) {
        toast({
          title: "Limite de sabores",
          description: `Esse produto aceita no maximo ${product.maxFillings} sabor(es).`,
          variant: "destructive",
        });
        return current;
      }

      return [...current, fillingId];
    });
  };

  const toggleAdditional = (
    group: ProductAdditionalGroupDetail,
    optionId: string,
  ) => {
    setSelectedOptions((current) => {
      const currentSelection = current[group.id] ?? [];

      if (group.selectionType === "single") {
        return {
          ...current,
          [group.id]: currentSelection[0] === optionId ? [] : [optionId],
        };
      }

      if (currentSelection.includes(optionId)) {
        if (currentSelection.length <= group.minSelections) {
          return current;
        }

        return {
          ...current,
          [group.id]: currentSelection.filter((id) => id !== optionId),
        };
      }

      if (currentSelection.length >= group.maxSelections) {
        toast({
          title: "Limite de adicionais",
          description: `O grupo "${group.name}" aceita no maximo ${group.maxSelections} opcao(oes).`,
          variant: "destructive",
        });
        return current;
      }

      return {
        ...current,
        [group.id]: [...currentSelection, optionId],
      };
    });
  };

  const handleSubmit = () => {
    const dedupedFillingIds = dedupeFillings(selectedFillingIds);

    if (dedupedFillingIds.length < product.minFillings) {
      toast({
        title: "Escolha o sabor",
        description: `Selecione pelo menos ${product.minFillings} sabor(es) para continuar.`,
        variant: "destructive",
      });
      return;
    }

    if (dedupedFillingIds.length > product.maxFillings) {
      toast({
        title: "Sabores em excesso",
        description: `Esse produto aceita no maximo ${product.maxFillings} sabor(es).`,
        variant: "destructive",
      });
      return;
    }

    for (const group of product.additionalGroups) {
      const selectedCount = (selectedOptions[group.id] ?? []).length;

      if (selectedCount < group.minSelections) {
        toast({
          title: "Adicionais obrigatorios",
          description: `O grupo "${group.name}" exige pelo menos ${group.minSelections} selecao(oes).`,
          variant: "destructive",
        });
        return;
      }

      if (selectedCount > group.maxSelections) {
        toast({
          title: "Quantidade de adicionais invalida",
          description: `O grupo "${group.name}" aceita no maximo ${group.maxSelections} selecao(oes).`,
          variant: "destructive",
        });
        return;
      }
    }

    onSubmit({
      recipeId: product.id,
      baseName: product.name,
      name: buildPublicOrderItemName(
        product.name,
        selectedFillings.map((filling) => filling.name),
      ),
      quantity,
      unitPriceCents,
      fillingRecipeIds: dedupedFillingIds,
      fillingNames: selectedFillings.map((filling) => filling.name),
      additionals: selectedAdditionals,
    });
  };

  return (
    <div className="space-y-6">
      <div className="brand-hero rounded-[1.75rem] border border-border/70 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full bg-primary/12 px-3 py-1 text-primary hover:bg-primary/12">
            Monte seu pedido
          </Badge>
          <Badge variant="outline" className="rounded-full border-border/70 bg-background/70">
            A partir de {formatCurrency(unitPriceCents / 100)}
          </Badge>
        </div>
        <h3 className="mt-4 font-display text-3xl font-bold text-foreground">
          {product.name}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {product.notes || "Escolha sabores, extras e quantidade antes de adicionar ao pedido."}
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Sabor
            </p>
            <p className="text-sm text-muted-foreground">
              Escolha de {product.minFillings} ate {product.maxFillings} opcao(oes).
            </p>
          </div>
          <Badge variant="outline" className="rounded-full border-border/70 bg-background/70">
            {selectedFillings.length}/{product.maxFillings}
          </Badge>
        </div>
        <div className="grid gap-3">
          {product.fillingOptions.map((filling) => {
            const active = selectedFillingIds.includes(filling.id);
            return (
              <button
                key={filling.id}
                type="button"
                onClick={() => toggleFilling(filling.id)}
                className={
                  active
                    ? "rounded-[1.4rem] border border-primary bg-secondary px-4 py-4 text-left shadow-sm transition-colors"
                    : "rounded-[1.4rem] border border-border bg-card/70 px-4 py-4 text-left transition-colors hover:border-primary/35 hover:bg-background/70"
                }
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {filling.photoUrl ? (
                      <img
                        src={resolveMediaUrl(filling.photoUrl)}
                        alt={filling.name}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : null}
                    <span className="font-medium text-foreground">{filling.name}</span>
                  </div>
                  {active ? (
                    <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">
                      Selecionado
                    </Badge>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {product.additionalGroups.length > 0 ? (
        <section className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Adicionais
            </p>
            <p className="text-sm text-muted-foreground">
              Escolha extras por grupo, com limite e valor de forma bem clara.
            </p>
          </div>

          {product.additionalGroups.map((group) => (
            <div key={group.id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-foreground">{group.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {buildAdditionalGroupRule(group)}
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                {group.options.map((option) => {
                  const active = (selectedOptions[group.id] ?? []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleAdditional(group, option.id)}
                      className={
                        active
                          ? "rounded-[1.4rem] border border-primary bg-secondary px-4 py-4 text-left shadow-sm transition-colors"
                          : "rounded-[1.4rem] border border-border bg-card/70 px-4 py-4 text-left transition-colors hover:border-primary/35 hover:bg-background/70"
                      }
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-foreground">{option.name}</p>
                          {option.notes ? (
                            <p className="mt-1 text-sm text-muted-foreground">{option.notes}</p>
                          ) : null}
                        </div>
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
        </section>
      ) : null}

      <section className="space-y-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Quantidade</label>
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
      </section>

      <div className="rounded-[1.75rem] border border-border/70 bg-background/60 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total deste item</p>
            <p className="font-display text-3xl font-bold text-foreground">
              {formatCurrency(totalCents / 100)}
            </p>
          </div>
          <Button
            type="button"
            onClick={handleSubmit}
            className="brand-button h-12 rounded-full px-6"
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
