import { useEffect, useMemo } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
  ShoppingBag,
  Trash2,
  UserRound,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useCustomer } from "@/features/customers/hooks/use-customer";
import { useDeleteCustomer } from "@/features/customers/hooks/use-delete-customer";
import { useToast } from "@/hooks/use-toast";

function getCustomerFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function getOrderStatusTone(status: string) {
  switch (status) {
    case "Novo":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-300";
    case "Confirmado":
      return "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/30 dark:text-indigo-300";
    case "EmProducao":
    case "Em produção":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300";
    case "Pronto":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300";
    case "Cancelado":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card className="rounded-[1.7rem] border-border/70 bg-card/80 p-5 shadow-sm">
      <div className="flex min-h-[112px] items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
        </div>
        <p className="shrink-0 text-right font-display text-4xl font-bold text-foreground">
          {value}
        </p>
      </div>
    </Card>
  );
}

function OrderCard({
  order,
  showAddress,
}: {
  order: {
    id: string;
    orderNumber: string;
    orderDate: string;
    deliveryDate: string;
    deliveryTime?: string | null;
    deliveryMode: "Entrega" | "Retirada";
    deliveryAddress?: string | null;
    deliveryDistrict?: string | null;
    status: string;
    subtotalAmountCents: number;
    paidAmountCents: number;
    remainingAmountCents: number;
  };
  showAddress?: boolean;
}) {
  return (
    <article className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ReceiptText className="h-4 w-4 text-primary" />
              <span>{order.orderNumber}</span>
            </div>
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold",
                getOrderStatusTone(order.status),
              )}
            >
              {order.status === "EmProducao" ? "Em produção" : order.status}
            </span>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              {order.deliveryMode} em {formatDate(order.deliveryDate)}
              {order.deliveryTime ? ` às ${order.deliveryTime}` : ""}
            </p>
            <p>Pedido criado em {formatDate(order.orderDate)}</p>
            {showAddress && order.deliveryMode === "Entrega" ? (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {order.deliveryAddress || "Endereço não informado"}
                  {order.deliveryDistrict ? ` • ${order.deliveryDistrict}` : ""}
                </span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Valor
            </p>
            <p className="mt-2 font-semibold text-foreground">
              {formatCurrency(order.subtotalAmountCents / 100)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Pago
            </p>
            <p className="mt-2 font-semibold text-emerald-600">
              {formatCurrency(order.paidAmountCents / 100)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Falta
            </p>
            <p className="mt-2 font-semibold text-amber-600">
              {formatCurrency(order.remainingAmountCents / 100)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link href={`/pedidos/${order.id}`}>
          <a>
            <Button variant="outline" className="rounded-full">
              Abrir pedido
            </Button>
          </a>
        </Link>
      </div>
    </article>
  );
}

export default function Cliente() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = params.id ?? "";
  const { data, isLoading, isError } = useCustomer(id);
  const deleteCustomerMutation = useDeleteCustomer();
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const customer = data?.data;
  const openOrders = useMemo(
    () =>
      customer?.orders.filter(
        (order) => !["Entregue", "Cancelado"].includes(order.status),
      ) ?? [],
    [customer],
  );
  const closedOrders = useMemo(
    () =>
      customer?.orders.filter((order) =>
        ["Entregue", "Cancelado"].includes(order.status),
      ) ?? [],
    [customer],
  );

  const handleDeleteCustomer = async () => {
    if (!customer) {
      return;
    }

    try {
      await deleteCustomerMutation.mutateAsync(customer.id);
      toast({
        title: "Cliente excluído",
        description: "O cadastro foi removido com sucesso.",
      });
      setLocation("/clientes");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o cliente agora.";
      toast({
        title: "Erro ao excluir cliente",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title="Cliente">
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Link href="/clientes">
                  <a>
                    <Button variant="outline" className="rounded-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                  </a>
                </Link>
                <span className="text-sm uppercase tracking-[0.28em] text-primary">
                  Perfil comercial
                </span>
              </div>

              {customer ? (
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-primary/10 text-primary">
                    <UserRound className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="font-display text-4xl font-bold text-foreground">
                      {getCustomerFullName(customer.firstName, customer.lastName)}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold",
                          customer.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300",
                        )}
                      >
                        {customer.isActive ? "Cadastro ativo" : "Cadastro inativo"}
                      </span>
                      {customer.openOrderCount > 0 ? (
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {customer.openOrderCount} pedido(s) em aberto
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <h1 className="font-display text-4xl font-bold text-foreground">
                  Cliente
                </h1>
              )}
            </div>

            {customer ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={`/clientes/${customer.id}/editar`}>
                  <a>
                    <Button variant="outline" className="w-full rounded-full sm:w-auto">
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar cadastro
                    </Button>
                  </a>
                </Link>
                <Link href={`/pedidos/novo?customerId=${customer.id}`}>
                  <a>
                    <Button className="w-full rounded-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo pedido
                    </Button>
                  </a>
                </Link>
                <AlertDialog>
                  <Button
                    variant="ghost"
                    className="w-full rounded-full text-destructive hover:text-destructive sm:w-auto"
                    asChild
                  >
                    <AlertDialogTrigger>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir cliente
                    </AlertDialogTrigger>
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
                      <AlertDialogDescription>
                        O cadastro só pode ser removido quando não houver pedidos nem
                        conta de usuário vinculada.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-primary" />
                      <p>
                        Se este cliente já tiver histórico comercial, a exclusão será
                        recusada para preservar os vínculos operacionais.
                      </p>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleDeleteCustomer}
                        disabled={deleteCustomerMutation.isPending}
                      >
                        {deleteCustomerMutation.isPending
                          ? "Excluindo..."
                          : "Excluir cliente"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : null}
          </div>
        </section>

        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center gap-3 rounded-[1.8rem] border border-border/70 bg-card/80 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando cliente...</span>
          </div>
        ) : isError || !customer ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-[1.8rem] border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
            Cliente não encontrado.
          </div>
        ) : (
          <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total gasto"
                value={formatCurrency(customer.totalSpentCents / 100)}
                detail="Histórico consolidado do relacionamento."
              />
              <StatCard
                label="Último pedido"
                value={
                  customer.lastOrderDate ? formatDate(customer.lastOrderDate) : "-"
                }
                detail="Data mais recente de venda registrada."
              />
              <StatCard
                label="Pedidos em aberto"
                value={customer.openOrderCount}
                detail="Pedidos ainda em produção, entrega ou retirada."
              />
              <StatCard
                label="Pedidos totais"
                value={customer.orderCount}
                detail="Quantidade total de pedidos no histórico."
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <Card className="rounded-[1.8rem] border-border/70 bg-card/80 p-6 shadow-sm">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-primary">
                      Dados do cliente
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-foreground">
                      Contato e cadastro
                    </h2>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/55 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>E-mail</span>
                      </div>
                      <p className="mt-2 break-all font-medium text-foreground">
                        {customer.email}
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/55 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>Telefone</span>
                      </div>
                      <p className="mt-2 font-medium text-foreground">
                        {customer.phone ?? "Não informado"}
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/55 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShoppingBag className="h-4 w-4" />
                        <span>Status cadastral</span>
                      </div>
                      <p className="mt-2 font-medium text-foreground">
                        {customer.isActive ? "Ativo para operação" : "Inativo"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-border/70 bg-background/55 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Observações
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {customer.notes?.trim() || "Sem observações registradas."}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[1.8rem] border-border/70 bg-card/80 p-6 shadow-sm">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-primary">
                      Leitura comercial
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-foreground">
                      Situação atual
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/55 p-4">
                      <p className="text-sm text-muted-foreground">
                        Valor médio por pedido
                      </p>
                      <p className="mt-2 text-2xl font-bold text-foreground">
                        {formatCurrency(
                          customer.orderCount > 0
                            ? customer.totalSpentCents / customer.orderCount / 100
                            : 0,
                        )}
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/55 p-4">
                      <p className="text-sm text-muted-foreground">
                        Carteira em aberto
                      </p>
                      <p className="mt-2 text-2xl font-bold text-foreground">
                        {formatCurrency(
                          openOrders.reduce(
                            (sum, order) => sum + order.remainingAmountCents,
                            0,
                          ) / 100,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-border/70 bg-background/55 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Resumo do relacionamento
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                      <li>
                        {customer.openOrderCount > 0
                          ? "Há pedidos ativos exigindo acompanhamento operacional."
                          : "Não há pedidos ativos no momento."}
                      </li>
                      <li>
                        {customer.lastOrderDate
                          ? `Última movimentação em ${formatDate(customer.lastOrderDate)}.`
                          : "Ainda sem histórico de compra."}
                      </li>
                      <li>
                        {customer.orderCount > 1
                          ? "Cliente com recorrência suficiente para leitura comercial."
                          : "Base histórica ainda curta para leitura de recorrência."}
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </section>

            <Card className="rounded-[1.8rem] border-border/70 bg-card/80 p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold text-foreground">
                  Pedidos em aberto
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Pedidos que ainda exigem produção, entrega, retirada ou cobrança.
                </p>
              </div>

              {openOrders.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border p-8 text-center text-muted-foreground">
                  Nenhum pedido em aberto.
                </div>
              ) : (
                <div className="space-y-4">
                  {openOrders.map((order) => (
                    <OrderCard key={order.id} order={order} showAddress />
                  ))}
                </div>
              )}
            </Card>

            <Card className="rounded-[1.8rem] border-border/70 bg-card/80 p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold text-foreground">
                  Histórico completo
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Pedidos concluídos ou cancelados continuam compondo a leitura
                  comercial do cliente.
                </p>
              </div>

              {closedOrders.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border p-8 text-center text-muted-foreground">
                  Ainda não há histórico fechado.
                </div>
              ) : (
                <div className="space-y-4">
                  {closedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
