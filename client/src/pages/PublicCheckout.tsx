import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
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
    ? "border-rose-500 bg-rose-50"
    : "border-rose-100 bg-white hover:border-rose-300";
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
        title: "Nome obrigatório",
        description: "Informe o nome para identificar o pedido.",
        variant: "destructive",
      });
      return;
    }

    if (!form.customerPhone.trim()) {
      toast({
        title: "Telefone obrigatório",
        description: "Informe um telefone para contato da confeitaria.",
        variant: "destructive",
      });
      return;
    }

    if (!form.deliveryDate) {
      toast({
        title: "Data obrigatória",
        description: "Escolha a data desejada para entrega ou retirada.",
        variant: "destructive",
      });
      return;
    }

    if (!form.deliveryTime.trim()) {
      toast({
        title: "Horário obrigatório",
        description: "Informe o horário desejado.",
        variant: "destructive",
      });
      return;
    }

    if (form.deliveryMode === "Entrega" && !form.deliveryAddress.trim()) {
      toast({
        title: "Endereço obrigatório",
        description: "Pedidos com entrega precisam de endereço completo.",
        variant: "destructive",
      });
      return;
    }

    if (form.deliveryMode === "Entrega" && !form.deliveryDistrict.trim()) {
      toast({
        title: "Bairro obrigatório",
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
            : "Não foi possível concluir o pedido.",
        variant: "destructive",
      });
    }
  };

  return (
    <PublicStoreLayout
      title="Checkout"
      subtitle="Feche seu pedido com dados de contato, entrega ou retirada e confirmação por Pix manual."
    >
      {success ? (
        <Card className="border-rose-100 bg-white/90">
          <CardContent className="space-y-4 p-8">
            <p className="text-sm uppercase tracking-wide text-rose-700">
              Pedido enviado
            </p>
            <h2 className="font-display text-3xl font-bold text-rose-950">
              {success.orderNumber}
            </h2>
            <p className="text-rose-800">
              Total do pedido:{" "}
              <strong>{formatCurrency(success.subtotalAmountCents / 100)}</strong>
            </p>
            <p className="text-rose-800">{success.pixInstructions}</p>
            <Link href="/loja/catalogo">
              <a>
                <Button className="bg-rose-500 hover:bg-rose-600">
                  Voltar ao catálogo
                </Button>
              </a>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-rose-100 bg-white/90">
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-rose-950">
                  Seus dados
                </h2>
                <p className="text-sm leading-6 text-rose-700">
                  Preencha as informações para a confeitaria separar produção,
                  atendimento e entrega corretamente.
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
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-rose-900">
                  Como você vai receber?
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
                      className={`rounded-2xl border px-4 py-4 text-left transition-colors ${checkoutFieldClass(
                        form.deliveryMode === mode,
                      )}`}
                    >
                      <p className="font-semibold text-rose-950">{mode}</p>
                      <p className="mt-1 text-sm leading-6 text-rose-700">
                        {mode === "Entrega"
                          ? "Informe endereço, bairro e taxa combinada."
                          : "O pedido ficará separado para retirada no local."}
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
                />
              </div>

              {form.deliveryMode === "Entrega" ? (
                <div className="space-y-4 rounded-3xl border border-rose-100 bg-rose-50/60 p-4">
                  <Input
                    placeholder="Endereço"
                    value={form.deliveryAddress}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        deliveryAddress: event.target.value,
                      }))
                    }
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
                    />
                  </div>
                  <Input
                    placeholder="Referência"
                    value={form.deliveryReference}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        deliveryReference: event.target.value,
                      }))
                    }
                  />
                </div>
              ) : (
                <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-4 text-sm leading-6 text-rose-700">
                  Pedido configurado para retirada. Endereço e taxa não serão
                  enviados.
                </div>
              )}

              <Input
                placeholder="Observações do pedido"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </CardContent>
          </Card>

          <Card className="border-rose-100 bg-white/90">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-rose-700">
                  Resumo do pedido
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-rose-950">
                  {cart.itemCount} item(ns) no carrinho
                </h2>
              </div>

              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div
                    key={item.lineId}
                    className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-rose-950">
                          {item.quantity}x {item.name}
                        </p>
                        {item.additionals.length > 0 ? (
                          <p className="mt-1 text-sm text-rose-700">
                            {item.additionals
                              .map((additional) => additional.optionName)
                              .join(", ")}
                          </p>
                        ) : null}
                      </div>
                      <span className="font-semibold text-rose-800">
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

              <div className="space-y-3 rounded-3xl border border-rose-100 bg-rose-50/60 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-rose-700">Subtotal dos itens</span>
                  <span className="font-semibold text-rose-950">
                    {formatCurrency(cart.totalCents / 100)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-rose-700">Entrega</span>
                  <span className="font-semibold text-rose-950">
                    {form.deliveryMode === "Entrega"
                      ? formatCurrency(deliveryFeeCents / 100)
                      : "Retirada no local"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-rose-100 pt-3">
                  <span className="font-semibold text-rose-900">Total</span>
                  <span className="font-display text-3xl font-bold text-rose-950">
                    {formatCurrency(finalTotalCents / 100)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-rose-200 px-4 py-3 text-sm leading-6 text-rose-700">
                O pagamento continua manual em Pix. O pedido entra como
                confirmado e a confeitaria valida o comprovante depois.
              </div>

              <Button
                className="w-full bg-rose-500 hover:bg-rose-600"
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
