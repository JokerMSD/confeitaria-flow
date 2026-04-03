import { useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Loader2, Pencil, Plus, ReceiptText } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCustomer } from "@/features/customers/hooks/use-customer";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Cliente() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const { data, isLoading, isError } = useCustomer(id);

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

  return (
    <AppLayout title="Detalhes do Cliente">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clientes">
            <a>
              <Button variant="secondary" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </a>
          </Link>
          <h2 className="text-2xl font-display font-bold">Detalhes do Cliente</h2>
        </div>

        {customer ? (
          <div className="flex gap-2">
            <Link href={`/clientes/${customer.id}/editar`}>
              <a>
                <Button variant="outline">
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar cadastro
                </Button>
              </a>
            </Link>
            <Link href={`/pedidos/novo?customerId=${customer.id}`}>
              <a>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo pedido para este cliente
                </Button>
              </a>
            </Link>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">
          <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
          Carregando...
        </div>
      ) : isError || !customer ? (
        <div className="p-10 text-center text-destructive">Cliente não encontrado.</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Total gasto</p>
              <p className="mt-2 text-3xl font-display font-bold">
                {formatCurrency(customer.totalSpentCents / 100)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Último pedido</p>
              <p className="mt-2 text-3xl font-display font-bold">
                {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : "-"}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Pedidos em aberto</p>
              <p className="mt-2 text-3xl font-display font-bold">
                {customer.openOrderCount}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Pedidos totais</p>
              <p className="mt-2 text-3xl font-display font-bold">
                {customer.orderCount}
              </p>
            </Card>
          </div>

          <Card className="space-y-4 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">Nome</h3>
                <p>
                  {customer.firstName} {customer.lastName}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">E-mail</h3>
                <p>{customer.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Telefone</h3>
                <p>{customer.phone ?? "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Ativo</h3>
                <p>{customer.isActive ? "Sim" : "Não"}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Informações</h3>
              <p>{customer.notes ?? "Sem observações."}</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold">Pedidos em aberto</h3>
              <p className="text-sm text-muted-foreground">
                Pedidos que ainda exigem produção, entrega, retirada ou pagamento.
              </p>
            </div>

            {openOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                Nenhum pedido em aberto.
              </div>
            ) : (
              <div className="divide-y rounded-xl border">
                {openOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <ReceiptText className="h-4 w-4" />
                        <span>{order.orderNumber}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.deliveryMode} • {formatDate(order.deliveryDate)}
                        {order.deliveryTime ? ` às ${order.deliveryTime}` : ""}
                      </p>
                      {order.deliveryMode === "Entrega" ? (
                        <p className="text-sm text-muted-foreground">
                          {order.deliveryAddress || "Endereço não informado"}
                          {order.deliveryDistrict ? ` • ${order.deliveryDistrict}` : ""}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-start gap-2 text-sm sm:items-end">
                      <div className="font-semibold">
                        {formatCurrency(order.subtotalAmountCents / 100)}
                      </div>
                      <div className="text-muted-foreground">Status: {order.status}</div>
                      <div className="text-muted-foreground">
                        Falta: {formatCurrency(order.remainingAmountCents / 100)}
                      </div>
                      <Link href={`/pedidos/${order.id}`}>
                        <a className="text-primary hover:underline">Abrir pedido</a>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold">Histórico completo</h3>
              <p className="text-sm text-muted-foreground">
                Pedidos concluídos ou cancelados permanecem no histórico comercial.
              </p>
            </div>

            {closedOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                Ainda não há histórico fechado.
              </div>
            ) : (
              <div className="divide-y rounded-xl border">
                {closedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <ReceiptText className="h-4 w-4" />
                        <span>{order.orderNumber}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pedido: {formatDate(order.orderDate)} • {order.deliveryMode}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 text-sm sm:items-end">
                      <div className="font-semibold">
                        {formatCurrency(order.subtotalAmountCents / 100)}
                      </div>
                      <div className="text-muted-foreground">Status: {order.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
