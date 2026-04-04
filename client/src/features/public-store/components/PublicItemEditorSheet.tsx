import type { PublicCartItem } from "../lib/public-cart";
import { usePublicProduct } from "../hooks/use-public-store";
import { PublicItemCustomizerPanel } from "./PublicItemCustomizerPanel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function PublicItemEditorSheet({
  item,
  open,
  onOpenChange,
  onSave,
}: {
  item: PublicCartItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: Omit<PublicCartItem, "lineId">) => void;
}) {
  const productQuery = usePublicProduct(item?.recipeId ?? "");
  const product = productQuery.data?.data;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] overflow-y-auto rounded-t-[2rem] border-border bg-background px-0"
      >
        <div className="mx-auto max-w-3xl px-4 pb-6 pt-3 md:px-6">
          <SheetHeader className="mb-5 px-1 text-left">
            <SheetTitle>Personalizar item</SheetTitle>
            <SheetDescription>
              Ajuste sabores, adicionais e quantidade sem sair do carrinho ou checkout.
            </SheetDescription>
          </SheetHeader>

          {product ? (
            <PublicItemCustomizerPanel
              product={product}
              initialItem={item}
              submitLabel="Salvar alteracoes"
              onSubmit={(draft) => {
                onSave(draft);
                onOpenChange(false);
              }}
            />
          ) : (
            <div className="brand-shell p-6 text-sm text-muted-foreground">
              Carregando configuracao do produto...
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
