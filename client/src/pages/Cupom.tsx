import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  createDiscountCoupon,
  updateDiscountCoupon,
} from "@/api/discount-coupons-api";
import { useDiscountCoupon } from "@/features/discount-coupons/hooks/use-discount-coupon";
import {
  formatMoneyInput,
  parseMoneyInputToCents,
} from "@/features/inventory/lib/inventory-input-helpers";

interface CouponFormData {
  code: string;
  title: string;
  description: string;
  discountType: "Percentual" | "ValorFixo";
  discountValue: string;
  minimumOrderAmount: string;
  isActive: boolean;
}

export default function Cupom() {
  const params = useParams<{ id?: string }>();
  const id = params.id ?? "";
  const isEditing = Boolean(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data, isLoading } = useDiscountCoupon(id);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<CouponFormData>({
    defaultValues: {
      code: "",
      title: "",
      description: "",
      discountType: "Percentual",
      discountValue: "",
      minimumOrderAmount: "0,00",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!data?.data) {
      return;
    }

    reset({
      code: data.data.code,
      title: data.data.title,
      description: data.data.description ?? "",
      discountType: data.data.discountType,
      discountValue:
        data.data.discountType === "Percentual"
          ? String(data.data.discountValue)
          : formatMoneyInput(String(data.data.discountValue)),
      minimumOrderAmount: formatMoneyInput(
        String(data.data.minimumOrderAmountCents),
      ),
      isActive: data.data.isActive,
    });
  }, [data, reset]);

  const discountType = watch("discountType");
  const isActive = watch("isActive");

  const onSubmit = async (values: CouponFormData) => {
    try {
      const payload = {
        code: values.code,
        title: values.title,
        description: values.description || null,
        discountType: values.discountType,
        discountValue:
          values.discountType === "Percentual"
            ? Number.parseInt(values.discountValue || "0", 10)
            : parseMoneyInputToCents(values.discountValue) ?? 0,
        minimumOrderAmountCents:
          parseMoneyInputToCents(values.minimumOrderAmount) ?? 0,
        isActive: values.isActive,
      };

      if (isEditing) {
        await updateDiscountCoupon(id, { data: payload });
        toast({
          title: "Cupom atualizado",
          description: "As alteracoes foram salvas com sucesso.",
        });
      } else {
        await createDiscountCoupon({ data: payload });
        toast({
          title: "Cupom criado",
          description: "O codigo ja pode ser usado no checkout.",
        });
      }

      setLocation("/cupons");
    } catch (error) {
      toast({
        title: "Falha ao salvar cupom",
        description:
          error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title={isEditing ? "Editar cupom" : "Novo cupom"}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/cupons">
            <a>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </a>
          </Link>
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground">
              {isEditing ? "Editar cupom" : "Novo cupom"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure o codigo, o tipo de desconto e o valor minimo do pedido.
            </p>
          </div>
        </div>

        {isEditing && isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center gap-3 rounded-[28px] border border-border bg-card/80 p-10 text-muted-foreground shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando cupom...</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
          >
            <Card className="border-border/70 bg-card/80">
              <CardContent className="grid gap-5 p-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Codigo</Label>
                  <Input
                    id="code"
                    value={watch("code")}
                    onChange={(event) =>
                      setValue(
                        "code",
                        event.target.value.toUpperCase().replace(/\s+/g, ""),
                      )
                    }
                    placeholder="BEMVINDO10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Titulo</Label>
                  <Input id="title" {...register("title")} placeholder="Primeira compra" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descricao</Label>
                  <Input
                    id="description"
                    {...register("description")}
                    placeholder="Use na sua primeira compra"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de desconto</Label>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={discountType}
                    onChange={(event) =>
                      setValue(
                        "discountType",
                        event.target.value as CouponFormData["discountType"],
                      )
                    }
                  >
                    <option value="Percentual">Percentual</option>
                    <option value="ValorFixo">Valor fixo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    {discountType === "Percentual" ? "Percentual (%)" : "Valor"}
                  </Label>
                  <Input
                    id="discountValue"
                    value={watch("discountValue")}
                    onChange={(event) =>
                      setValue(
                        "discountValue",
                        discountType === "Percentual"
                          ? event.target.value.replace(/\D/g, "").slice(0, 3)
                          : formatMoneyInput(event.target.value),
                      )
                    }
                    placeholder={discountType === "Percentual" ? "10" : "6,00"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumOrderAmount">Pedido minimo</Label>
                  <Input
                    id="minimumOrderAmount"
                    value={watch("minimumOrderAmount")}
                    onChange={(event) =>
                      setValue(
                        "minimumOrderAmount",
                        formatMoneyInput(event.target.value),
                      )
                    }
                    placeholder="0,00"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/70 bg-card/80">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Status</h3>
                      <p className="text-sm text-muted-foreground">
                        Cupons inativos nao podem ser aplicados no checkout.
                      </p>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) => setValue("isActive", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isEditing ? "Salvar alteracoes" : "Criar cupom"}
                </Button>
                <Link href="/cupons">
                  <a>
                    <Button type="button" variant="outline" className="w-full">
                      Cancelar
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
