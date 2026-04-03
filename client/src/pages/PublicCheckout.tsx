import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Truck } from "lucide-react";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePublicCart } from "@/features/public-store/lib/public-cart";
import { usePublicCheckout } from "@/features/public-store/hooks/use-public-store";
import { formatCurrency, getTodayLocalDateKey } from "@/lib/utils";
import {
  formatMoneyInput,
  parseMoneyInputToCents,
} from "@/features/inventory/lib/inventory-input-helpers";

type DeliveryMode = "Entrega" | "Retirada";

function checkoutFieldClass(active: boolean) {
  return active
    ? "border-primary bg-secondary shadow-sm"
    : "border-border bg-card/70 hover:border-primary/35";
}

export default function PublicCheckout() {
  const cart = usePublicCart();
  const checkoutMutation = usePublicCheckout();
  const { toast } = useToast();
  const [success, setSuccess] = useState<{
    orderNumber: string;
    subtotalAmountCents: number;
    pixInstructions: string;
  } | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    deliveryMode: "Entrega" as DeliveryMode,
    deliveryDate: getTodayLocalDateKey(),
    deliveryTime: "",
    deliveryAddress: "",
    deliveryDistrict: "",
    deliveryReference: "",
    deliveryFee: "0,00",
    notes: "",
  });

  useEffect(() => {
    if (form.deliveryMode === "Retirada") {
      setForm((current) => ({
        ...current,
        deliveryAddress: "",
        deliveryDistrict: "",
        deliveryReference: "",
        deliveryFee: "0,00",
      }));
    }
  }, [form.deliveryMode]);

  const deliveryFeeCents = useMemo(
    () =>
      form.deliveryMode === "Entrega"
        ? Math.max(0, parseMoneyInputToCents(form.deliveryFee) ?? 0)
        : 0,
    [form.deliveryFee, form.deliveryMode],
  );

  const finalTotalCents = cart.totalCents + deliveryFeeCents;

  const handleSubmit = async () => {
    if (cart.items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens antes de concluir o checkout.",
        variant: "destructive",
      });
      return;
    }

    if (!form.customerName.trim()) {
      toast({
        title: "Nome obrigatorio",
        description: "Informe o nome para identificar o pedido.",
        variant: "destructive",
      });
      return;
    }

    if (!form.customerPhone.trim()) {
      toast({
        title: "Telefone obrigatorio",
        description: "Informe um telefone para contato da confeitaria.",
        variant: "destructive",
      });
      return;
    }

    if (!form.deliveryDate) {
      toast({
        title: "Data obrigatoria",
        description: "Escolha a data desejada para entrega ou retirada.",
        variant: "destructive",
      });
      return;
    }

    if (!form.deliveryTime.trim()) {
      toast({
        title: "Horario obrigatorio",
        description: "Informe o horario desejado.",
        variant: "destructive",
      });
      return;
    }

    if (form.deliveryMode === "Entrega" && !form.deliveryAddress.trim()) {
      toast({
        title: "Endereco obrigatorio",
        description: "Pedidos com entrega precisam de endereco completo.",
        variant: "destructive",
      });
      return;
    }

    if (form.deliveryMode === "Entrega" && !form.deliveryDistrict.trim()) {
      toast({
        title: "Bairro obrigatorio",
        description: "Informe o bairro para organizar a entrega.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await checkoutMutation.mutateAsync({
        data: {
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim() || null,
          deliveryMode: form.deliveryMode,
          deliveryDate: form.deliveryDate,
          deliveryTime: form.deliveryTime.trim() || null,
          deliveryAddress:
            form.deliveryMode === "Entrega"
              ? form.deliveryAddress.trim() || null
              : null,
          deliveryDistrict:
            form.deliveryMode === "Entrega"
              ? form.deliveryDistrict.trim() || null
              : null,
          deliveryReference:
            form.deliveryMode === "Entrega"
              ? form.deliveryReference.trim() || null
              : null,
          deliveryFeeCents,
          notes: form.notes.trim() || null,
          items: cart.items.map((item) => ({
            recipeId: item.recipeId,
            quantity: item.quantity,
            additionals: item.additionals.map((additional, index) => ({
              groupId: additional.groupId,
              optionId: additional.optionId,
              position: index,
            })),
          })),
        },
      });

      setSuccess({
        orderNumber: response.data.orderNumber,
        subtotalAmountCents: response.data.subtotalAmountCents,
        pixInstructions: response.data.pixInstructions,
      });
      cart.clear();
    } catch (error) {
      toast({
        title: "Falha no checkout",
        description:
          error instanceof Error
            ? error.message
            : "Nao foi possivel concluir o pedido.",
        variant: "destructive",
      });
    }
  };

  return (
    <PublicStoreLayout
      title="Checkout"
      subtitle="Feche seu pedido com dados de contato, retirada ou entrega e confirmacao por Pix manual."
    >
      {success ? (
        <Card className="brand-shell">
          <CardContent className="space-y-5 p-8">
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                pedido enviado
              </p>
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground">
              {success.orderNumber}
            </h2>
            <p className="text-muted-foreground">
              Total do pedido:{" "}
              <strong className="text-foreground">
                {formatCurrency(success.subtotalAmountCents / 100)}
              </strong>
            </p>
            <div className="rounded-[1.75rem] border border-border/70 bg-background/60 p-4 text-sm leading-6 text-muted-foreground">
              {success.pixInstructions}
            </div>
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
        <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <Card className="brand-shell">
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <div className="brand-pill">dados do pedido</div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Seus dados
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Preencha as informacoes para a confeitaria separar producao, atendimento e entrega corretamente.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Nome completo"
                  value={form.customerName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      customerName: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl"
                />
                <Input
                  placeholder="Telefone"
                  value={form.customerPhone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      customerPhone: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Como voce vai receber?
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {(["Entrega", "Retirada"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          deliveryMode: mode,
                        }))
                      }
                      className={`rounded-[1.6rem] border px-4 py-4 text-left transition-colors ${checkoutFieldClass(
                        form.deliveryMode === mode,
                      )}`}
                    >
                      <p className="font-semibold text-foreground">{mode}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {mode === "Entrega"
                          ? "Informe endereco, bairro e taxa combinada."
                          : "O pedido ficara separado para retirada no local."}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  type="date"
                  value={form.deliveryDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryDate: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl"
                />
                <Input
                  type="time"
                  value={form.deliveryTime}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryTime: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl"
                />
              </div>

              {form.deliveryMode === "Entrega" ? (
                <div className="space-y-4 rounded-[1.8rem] border border-border/70 bg-background/60 p-4">
                  <Input
                    placeholder="Endereco"
                    value={form.deliveryAddress}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        deliveryAddress: event.target.value,
                      }))
                    }
                    className="h-12 rounded-2xl"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      placeholder="Bairro"
                      value={form.deliveryDistrict}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          deliveryDistrict: event.target.value,
                        }))
                      }
                      className="h-12 rounded-2xl"
                    />
                    <Input
                      placeholder="Taxa de entrega"
                      inputMode="numeric"
                      value={form.deliveryFee}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          deliveryFee: formatMoneyInput(event.target.value),
                        }))
                      }
                      className="h-12 rounded-2xl"
                    />
                  </div>
                  <Input
                    placeholder="Referencia"
                    value={form.deliveryReference}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        deliveryReference: event.target.value,
                      }))
                    }
                    className="h-12 rounded-2xl"
                  />
                </div>
              ) : (
                <div className="rounded-[1.8rem] border border-border/70 bg-background/55 p-4 text-sm leading-6 text-muted-foreground">
                  Pedido configurado para retirada. Endereco e taxa nao serao enviados.
                </div>
              )}

              <Input
                placeholder="Observacoes do pedido"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                className="h-12 rounded-2xl"
              />
            </CardContent>
          </Card>

          <Card className="brand-shell">
            <CardContent className="space-y-5 p-6">
              <div className="brand-hero rounded-[1.9rem] border border-border/70 p-5">
                <div className="flex items-center gap-2 text-primary">
                  <Truck className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                    resumo do pedido
                  </p>
                </div>
                <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
                  {cart.itemCount} item(ns) no carrinho
                </h2>
              </div>

              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div
                    key={item.lineId}
                    className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {item.quantity}x {item.name}
                        </p>
                        {item.additionals.length > 0 ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.additionals
                              .map((additional) => additional.optionName)
                              .join(", ")}
                          </p>
                        ) : null}
                      </div>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(
                          (item.quantity *
                            (item.unitPriceCents +
                              item.additionals.reduce(
                                (sum, additional) =>
                                  sum + additional.priceDeltaCents,
                                0,
                              ))) /
                            100,
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-[1.8rem] border border-border/70 bg-background/60 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal dos itens</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(cart.totalCents / 100)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Entrega</span>
                  <span className="font-semibold text-foreground">
                    {form.deliveryMode === "Entrega"
                      ? formatCurrency(deliveryFeeCents / 100)
                      : "Retirada no local"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-display text-3xl font-bold text-foreground">
                    {formatCurrency(finalTotalCents / 100)}
                  </span>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-dashed border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
                O pagamento continua manual em Pix. O pedido entra como confirmado e a confeitaria valida o comprovante depois.
              </div>

              <Button
                className="brand-button h-12 w-full rounded-full"
                onClick={handleSubmit}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending
                  ? "Enviando pedido..."
                  : "Concluir com Pix manual"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PublicStoreLayout>
  );
}
