import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Loader2, Plus, ReceiptText } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCustomer } from "@/features/customers/hooks/use-customer";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Cliente() {
  const params = useParams();
  const id = params.id ?? "";
  const { data, isLoading, isError } = useCustomer(id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  return (
    <AppLayout title="Detalhes do Cliente">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clientes">
            <a>
              <Button variant="secondary" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            </a>
          </Link>
          <h2 className="text-2xl font-display font-bold">Detalhes do Cliente</h2>
        </div>

        {data ? (
          <Link href={`/pedidos/novo?customerId=${data.data.id}`}>
            <a>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo pedido para este cliente
              </Button>
            </a>
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">
          <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
          Carregando...
        </div>
      ) : isError || !data ? (
        <div className="p-10 text-center text-destructive">
          Cliente nÃ£o encontrado.
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">Nome</h3>
                <p>
                  {data.data.firstName} {data.data.lastName}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">E-mail</h3>
                <p>{data.data.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Telefone</h3>
                <p>{data.data.phone ?? "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Ativo</h3>
                <p>{data.data.isActive ? "Sim" : "NÃ£o"}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Informações</h3>
              <p>{data.data.notes ?? "Sem observações"}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <h3 className="text-sm font-semibold">Total gasto</h3>
                <p>{formatCurrency(data.data.totalSpentCents / 100)}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Último pedido</h3>
                <p>
                  {data.data.lastOrderDate
                    ? formatDate(data.data.lastOrderDate)
                    : "-"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Pedidos</h3>
                <p>{data.data.orderCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Pedidos deste cliente</h3>
                <p className="text-sm text-muted-foreground">
                  Histórico comercial e operacional vinculado ao cadastro.
                </p>
              </div>
            </div>

            {data.data.orders.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                Nenhum pedido vinculado ainda.
              </div>
            ) : (
              <div className="divide-y rounded-xl border">
                {data.data.orders.map((order) => (
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
                        Pedido: {formatDate(order.orderDate)} | Entrega/retirada:{" "}
                        {formatDate(order.deliveryDate)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {order.status}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-2 text-sm sm:items-end">
                      <div className="font-semibold">
                        {formatCurrency(order.subtotalAmountCents / 100)}
                      </div>
                      <div className="text-muted-foreground">
                        Pago: {formatCurrency(order.paidAmountCents / 100)}
                      </div>
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
        </div>
      )}
    </AppLayout>
  );
}
