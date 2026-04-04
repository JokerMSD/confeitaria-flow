import { useState } from "react";
import { Link } from "wouter";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { PublicItemEditorSheet } from "@/features/public-store/components/PublicItemEditorSheet";
import {
  usePublicCart,
  type PublicCartItem,
} from "@/features/public-store/lib/public-cart";
import {
  calculatePublicItemLineTotalCents,
  calculatePublicItemUnitTotalCents,
} from "@/features/public-store/lib/public-store-item";
import { formatCurrency } from "@/lib/utils";

export default function PublicCart() {
  const cart = usePublicCart();
  const [editingItem, setEditingItem] = useState<PublicCartItem | null>(null);

  return (
    <PublicStoreLayout
      title="Carrinho"
      subtitle="Revise os itens como em um app de delivery: quantidade, sabores, extras e total antes de fechar o pedido."
    >
      {cart.items.length === 0 ? (
        <Card className="brand-shell">
          <CardContent className="space-y-4 p-8 text-center">
            <p className="text-lg font-semibold text-foreground">
              Seu carrinho esta vazio.
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Escolha produtos no catalogo para montar o pedido.
            </p>
            <Link href="/loja/catalogo">
              <a>
                <Button className="brand-button rounded-full px-6">
                  Voltar ao catalogo
                </Button>
              </a>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {cart.items.map((item) => {
              const unitTotalCents = calculatePublicItemUnitTotalCents(item);

              return (
                <Card key={item.lineId} className="brand-shell">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-semibold text-foreground">
                          {item.name}
                        </h2>
                        {item.fillingNames.length > 0 ? (
                          <p className="mt-1 text-sm font-medium text-primary">
                            Sabor(es): {item.fillingNames.join(" / ")}
                          </p>
                        ) : null}
                        {item.additionals.length > 0 ? (
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.additionals
                              .map(
                                (additional) =>
                                  `${additional.groupName}: ${additional.optionName}`,
                              )
                              .join(", ")}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Sem adicionais.
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Preco unitario
                        </p>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(unitTotalCents / 100)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="rounded-full"
                          onClick={() =>
                            cart.updateQuantity(item.lineId, item.quantity - 1)
                          }
                        >
                          -
                        </Button>
                        <span className="min-w-10 text-center font-semibold text-foreground">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          className="rounded-full"
                          onClick={() =>
                            cart.updateQuantity(item.lineId, item.quantity + 1)
                          }
                        >
                          +
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-2xl font-bold text-foreground">
                          {formatCurrency(
                            calculatePublicItemLineTotalCents(item) / 100,
                          )}
                        </span>
                        <Button
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setEditingItem(item)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => cart.removeItem(item.lineId)}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="brand-shell">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm uppercase tracking-[0.28em] text-primary">
                Resumo
              </p>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Itens</span>
                <span className="font-semibold text-foreground">
                  {cart.itemCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-display text-2xl font-bold text-foreground">
                  {formatCurrency(cart.totalCents / 100)}
                </span>
              </div>
              <div className="rounded-[1.5rem] border border-dashed border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
                A taxa de entrega e definida no checkout. Voce ainda pode editar sabores e extras de cada item antes de concluir.
              </div>
              <Link href="/loja/checkout">
                <a>
                  <Button className="brand-button w-full rounded-full">
                    Ir para checkout
                  </Button>
                </a>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      <PublicItemEditorSheet
        item={editingItem}
        open={Boolean(editingItem)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
          }
        }}
        onSave={(item) => {
          if (!editingItem) {
            return;
          }

          cart.replaceItem(editingItem.lineId, item);
        }}
      />
    </PublicStoreLayout>
  );
}
