import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  CheckCircle2,
  CreditCard,
  Pencil,
  QrCode,
  TicketPercent,
  Truck,
  X,
} from "lucide-react";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PublicItemEditorSheet } from "@/features/public-store/components/PublicItemEditorSheet";
import {
  usePublicCart,
  type PublicCartItem,
} from "@/features/public-store/lib/public-cart";
import {
  usePublicCheckout,
  usePublicCheckoutPreview,
  usePublicStorePaymentConfig,
} from "@/features/public-store/hooks/use-public-store";
import {
  calculatePublicItemLineTotalCents,
  calculatePublicItemUnitTotalCents,
} from "@/features/public-store/lib/public-store-item";
import { formatCurrency, getTodayLocalDateKey } from "@/lib/utils";
import {
  formatMoneyInput,
  parseMoneyInputToCents,
} from "@/features/inventory/lib/inventory-input-helpers";
import {
  MercadoPagoCardForm,
  type MercadoPagoCardFormHandle,
} from "@/features/public-store/components/MercadoPagoCardForm";

type DeliveryMode = "Entrega" | "Retirada";

function checkoutFieldClass(active: boolean) {
  return active
    ? "border-primary bg-secondary shadow-sm"
    : "border-border bg-card/70 hover:border-primary/35";
}

export default function PublicCheckout() {
  const cart = usePublicCart();
  const checkoutMutation = usePublicCheckout();
  const previewMutation = usePublicCheckoutPreview();
  const paymentConfigQuery = usePublicStorePaymentConfig();
  const { toast } = useToast();
  const mercadoPagoCardFormRef = useRef<MercadoPagoCardFormHandle | null>(null);
  const [editingItem, setEditingItem] = useState<PublicCartItem | null>(null);
  const [isMercadoPagoReady, setIsMercadoPagoReady] = useState(false);
  const [success, setSuccess] = useState<Awaited<
    ReturnType<typeof checkoutMutation.mutateAsync>
  >["data"] | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryMode: "Entrega" as DeliveryMode,
    deliveryDate: getTodayLocalDateKey(),
    deliveryTime: "",
    deliveryAddress: "",
    deliveryDistrict: "",
    deliveryReference: "",
    deliveryFee: "0,00",
    couponCode: "",
    paymentMethod: "Pix" as "Pix" | "MercadoPagoCartao",
    payerIdentificationType: "CPF" as "CPF" | "CNPJ",
    payerIdentificationNumber: "",
    notes: "",
  });
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    title: string;
    discountAmountCents: number;
  } | null>(null);

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

  useEffect(() => {
    setAppliedCoupon(null);
  }, [
    cart.totalCents,
    form.deliveryMode,
    deliveryFeeCents,
    form.couponCode,
    cart.items.length,
  ]);

  const finalTotalCents =
    cart.totalCents + deliveryFeeCents - (appliedCoupon?.discountAmountCents ?? 0);
  const mercadoPagoEnabled =
    paymentConfigQuery.data?.data.mercadoPago.enabled === true &&
    Boolean(paymentConfigQuery.data?.data.mercadoPago.publicKey);

  useEffect(() => {
    if (!mercadoPagoEnabled && form.paymentMethod === "MercadoPagoCartao") {
      setForm((current) => ({ ...current, paymentMethod: "Pix" }));
    }
  }, [form.paymentMethod, mercadoPagoEnabled]);

  const handleApplyCoupon = async () => {
    if (!form.couponCode.trim()) {
      toast({
        title: "Informe o cupom",
        description: "Digite o codigo antes de aplicar.",
        variant: "destructive",
      });
      return;
    }

    if (cart.items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens antes de testar um cupom.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await previewMutation.mutateAsync({
        data: {
          deliveryMode: form.deliveryMode,
          deliveryFeeCents,
          couponCode: form.couponCode.trim(),
          items: cart.items.map((item) => ({
            recipeId: item.recipeId,
            quantity: item.quantity,
            fillingRecipeId: item.fillingRecipeIds[0] ?? null,
            secondaryFillingRecipeId: item.fillingRecipeIds[1] ?? null,
            tertiaryFillingRecipeId: item.fillingRecipeIds[2] ?? null,
            additionals: item.additionals.map((additional, index) => ({
              groupId: additional.groupId,
              optionId: additional.optionId,
              position: index,
            })),
          })),
        },
      });

      if (!response.data.appliedCoupon) {
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon({
        code: response.data.appliedCoupon.code,
        title: response.data.appliedCoupon.title,
        discountAmountCents: response.data.appliedCoupon.discountAmountCents,
      });
      toast({
        title: "Cupom aplicado",
        description: `${response.data.appliedCoupon.code} ativo no pedido.`,
      });
    } catch (error) {
      setAppliedCoupon(null);
      toast({
        title: "Nao foi possivel aplicar o cupom",
        description:
          error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

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

    if (form.paymentMethod === "MercadoPagoCartao" && !form.customerEmail.trim()) {
      toast({
        title: "E-mail obrigatorio",
        description: "Informe um e-mail para o pagamento com cartao.",
        variant: "destructive",
      });
      return;
    }

    if (
      form.paymentMethod === "MercadoPagoCartao" &&
      !form.payerIdentificationNumber.trim()
    ) {
      toast({
        title: "Documento obrigatorio",
        description: "Informe CPF ou CNPJ do pagador.",
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
      const mercadoPagoCard =
        form.paymentMethod === "MercadoPagoCartao"
          ? await mercadoPagoCardFormRef.current?.requestPaymentData()
          : null;

      if (form.paymentMethod === "MercadoPagoCartao" && !mercadoPagoCard) {
        throw new Error("O formulario do cartao ainda nao esta pronto.");
      }

      const response = await checkoutMutation.mutateAsync({
        data: {
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim() || null,
          customerEmail: form.customerEmail.trim() || null,
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
          couponCode: appliedCoupon?.code ?? null,
          paymentMethod: form.paymentMethod,
          payer:
            form.paymentMethod === "MercadoPagoCartao"
              ? {
                  email: form.customerEmail.trim(),
                  identificationType: form.payerIdentificationType,
                  identificationNumber: form.payerIdentificationNumber.trim(),
                }
              : null,
          mercadoPagoCard:
            form.paymentMethod === "MercadoPagoCartao" ? mercadoPagoCard : null,
          notes: form.notes.trim() || null,
          items: cart.items.map((item) => ({
            recipeId: item.recipeId,
            quantity: item.quantity,
            fillingRecipeId: item.fillingRecipeIds[0] ?? null,
            secondaryFillingRecipeId: item.fillingRecipeIds[1] ?? null,
            tertiaryFillingRecipeId: item.fillingRecipeIds[2] ?? null,
            additionals: item.additionals.map((additional, index) => ({
              groupId: additional.groupId,
              optionId: additional.optionId,
              position: index,
            })),
          })),
        },
      });

      setSuccess({
        ...response.data,
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
      subtitle="Confirme seus dados, escolha entrega ou retirada e finalize seu pedido."
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
            {success.paymentInstructions ? (
              <div className="rounded-[1.75rem] border border-border/70 bg-background/60 p-4 text-sm leading-6 text-muted-foreground">
                {success.paymentInstructions}
              </div>
            ) : null}
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
                <Input
                  placeholder="E-mail"
                  type="email"
                  value={form.customerEmail}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      customerEmail: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl md:col-span-2"
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

              <div className="space-y-3 rounded-[1.8rem] border border-border/70 bg-background/60 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <CreditCard className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">
                    pagamento
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({ ...current, paymentMethod: "Pix" }))
                    }
                    className={`rounded-[1.4rem] border px-4 py-4 text-left transition-colors ${checkoutFieldClass(
                      form.paymentMethod === "Pix",
                    )}`}
                  >
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-primary" />
                      <p className="font-semibold text-foreground">Pix manual</p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Finalize agora e envie o comprovante para a confeitaria.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        paymentMethod: "MercadoPagoCartao",
                      }))
                    }
                    disabled={!mercadoPagoEnabled}
                    className={`rounded-[1.4rem] border px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${checkoutFieldClass(
                      form.paymentMethod === "MercadoPagoCartao",
                    )}`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <p className="font-semibold text-foreground">
                        Cartao online
                      </p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Checkout transparente pelo Mercado Pago.
                    </p>
                  </button>
                </div>
                {form.paymentMethod === "MercadoPagoCartao" ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                      <select
                        value={form.payerIdentificationType}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            payerIdentificationType: event.target
                              .value as "CPF" | "CNPJ",
                          }))
                        }
                        className="h-12 rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none"
                      >
                        <option value="CPF">CPF</option>
                        <option value="CNPJ">CNPJ</option>
                      </select>
                      <Input
                        placeholder="Documento do pagador"
                        value={form.payerIdentificationNumber}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            payerIdentificationNumber: event.target.value,
                          }))
                        }
                        className="h-12 rounded-2xl"
                      />
                    </div>
                    {mercadoPagoEnabled && paymentConfigQuery.data?.data.mercadoPago.publicKey ? (
                      <MercadoPagoCardForm
                        ref={mercadoPagoCardFormRef}
                        publicKey={paymentConfigQuery.data.data.mercadoPago.publicKey}
                        amountCents={finalTotalCents}
                        customerEmail={form.customerEmail.trim()}
                        identificationType={form.payerIdentificationType}
                        identificationNumber={form.payerIdentificationNumber}
                        onReadyChange={setIsMercadoPagoReady}
                      />
                    ) : (
                      <div className="rounded-[1.4rem] border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                        O pagamento com cartao ainda nao esta configurado neste ambiente.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 rounded-[1.8rem] border border-border/70 bg-background/60 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <TicketPercent className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">
                    cupom de desconto
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    placeholder="Ex.: BEMVINDO10"
                    value={form.couponCode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        couponCode: event.target.value.toUpperCase(),
                      }))
                    }
                    className="h-12 rounded-2xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-full px-6"
                    onClick={handleApplyCoupon}
                    disabled={previewMutation.isPending}
                  >
                    {previewMutation.isPending ? "Aplicando..." : "Aplicar"}
                  </Button>
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-[1.3rem] border border-primary/20 bg-primary/10 px-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-primary">{appliedCoupon.code}</p>
                      <p className="text-muted-foreground">{appliedCoupon.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setForm((current) => ({ ...current, couponCode: "" }));
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
                      aria-label="Remover cupom"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
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
                        {item.fillingNames.length > 0 ? (
                          <p className="mt-1 text-sm font-medium text-primary">
                            Sabor(es): {item.fillingNames.join(" / ")}
                          </p>
                        ) : null}
                        {item.additionals.length > 0 ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.additionals
                              .map(
                                (additional) =>
                                  `${additional.groupName}: ${additional.optionName}`,
                              )
                              .join(", ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-foreground">
                          {formatCurrency(
                            calculatePublicItemLineTotalCents(item) / 100,
                          )}
                        </span>
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => setEditingItem(item)}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Unitario{" "}
                      {formatCurrency(
                        calculatePublicItemUnitTotalCents(item) / 100,
                      )}
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
                {appliedCoupon ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Desconto ({appliedCoupon.code})
                    </span>
                    <span className="font-semibold text-primary">
                      - {formatCurrency(appliedCoupon.discountAmountCents / 100)}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-display text-3xl font-bold text-foreground">
                    {formatCurrency(finalTotalCents / 100)}
                  </span>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-dashed border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
                {form.paymentMethod === "Pix"
                  ? "Pix manual: finalize o pedido e envie o comprovante para a confeitaria."
                  : "Cartao online: o pagamento e processado no checkout transparente do Mercado Pago."}
              </div>

              <Button
                className="brand-button h-12 w-full rounded-full"
                onClick={handleSubmit}
                disabled={
                  checkoutMutation.isPending ||
                  (form.paymentMethod === "MercadoPagoCartao" && !isMercadoPagoReady)
                }
              >
                {checkoutMutation.isPending
                  ? "Processando pedido..."
                  : form.paymentMethod === "Pix"
                    ? "Concluir com Pix"
                    : "Pagar com cartao"}
              </Button>
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
