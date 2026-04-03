import { useState } from "react";
import { Link } from "wouter";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePublicCart } from "@/features/public-store/lib/public-cart";
import { usePublicCheckout } from "@/features/public-store/hooks/use-public-store";
import { formatCurrency, getTodayLocalDateKey } from "@/lib/utils";

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
    deliveryMode: "Entrega" as "Entrega" | "Retirada",
    deliveryDate: getTodayLocalDateKey(),
    deliveryTime: "",
    deliveryAddress: "",
    deliveryDistrict: "",
    deliveryReference: "",
    deliveryFeeCents: "0",
    notes: "",
  });

  const handleSubmit = async () => {
    if (cart.items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens antes de concluir o checkout.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await checkoutMutation.mutateAsync({
        data: {
          customerName: form.customerName,
          customerPhone: form.customerPhone || null,
          deliveryMode: form.deliveryMode,
          deliveryDate: form.deliveryDate,
          deliveryTime: form.deliveryTime || null,
          deliveryAddress:
            form.deliveryMode === "Entrega" ? form.deliveryAddress || null : null,
          deliveryDistrict:
            form.deliveryMode === "Entrega" ? form.deliveryDistrict || null : null,
          deliveryReference:
            form.deliveryMode === "Entrega"
              ? form.deliveryReference || null
              : null,
          deliveryFeeCents:
            form.deliveryMode === "Entrega"
              ? Math.max(0, Math.round(Number(form.deliveryFeeCents || "0") * 100))
              : 0,
          notes: form.notes || null,
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
      title="Checkout público"
      subtitle="Informe nome, telefone, entrega ou retirada e envie o pedido em Pix manual."
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
              Total:{" "}
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
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-rose-100 bg-white/90">
            <CardContent className="space-y-4 p-6">
              <Input
                placeholder="Nome"
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

              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.deliveryMode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryMode: event.target.value as "Entrega" | "Retirada",
                    }))
                  }
                >
                  <option value="Entrega">Entrega</option>
                  <option value="Retirada">Retirada</option>
                </select>
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
              </div>

              <div className="grid gap-3 md:grid-cols-2">
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
                {form.deliveryMode === "Entrega" ? (
                  <Input
                    placeholder="Taxa de entrega"
                    value={form.deliveryFeeCents}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        deliveryFeeCents: event.target.value,
                      }))
                    }
                  />
                ) : null}
              </div>

              {form.deliveryMode === "Entrega" ? (
                <>
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
                    placeholder="Referência"
                    value={form.deliveryReference}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        deliveryReference: event.target.value,
                      }))
                    }
                  />
                </>
              ) : null}

              <Input
                placeholder="Observações"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </CardContent>
          </Card>

          <Card className="border-rose-100 bg-white/90">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm uppercase tracking-wide text-rose-700">
                Resumo
              </p>
              {cart.items.map((item) => (
                <div
                  key={item.lineId}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="font-medium text-rose-950">
                      {item.quantity}x {item.name}
                    </p>
                    {item.additionals.length > 0 ? (
                      <p className="text-rose-700">
                        {item.additionals
                          .map((additional) => additional.optionName)
                          .join(", ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span className="font-display text-2xl font-bold text-rose-950">
                  {formatCurrency(cart.totalCents / 100)}
                </span>
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
