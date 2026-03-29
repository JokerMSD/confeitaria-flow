import { useMemo } from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useOrdersQueue } from "@/features/orders/hooks/use-orders-queue";
import { adaptOrdersQueue } from "@/features/orders/lib/order-queue-adapter";
import { cn, formatDate } from "@/lib/utils";
import type {
  OrderQueueCardItem,
  UiOrderStatus,
} from "@/features/orders/types/order-ui";

function getStatusBadgeClass(status: UiOrderStatus) {
  if (status === "Pronto") {
    return "bg-success text-success-foreground";
  }

  if (status === "Em produção") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400";
  }

  return "bg-muted text-muted-foreground";
}

function sortOrders(list: OrderQueueCardItem[]) {
  return [...list].sort((a, b) => {
    const timeA = a.deliveryTime || "23:59";
    const timeB = b.deliveryTime || "23:59";

    if (timeA === timeB) {
      return a.orderNumber.localeCompare(b.orderNumber);
    }

    return timeA.localeCompare(timeB);
  });
}

export default function Fila() {
  const queueQuery = useOrdersQueue();

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const orders = useMemo(
    () => adaptOrdersQueue(queueQuery.data?.data ?? []),
    [queueQuery.data],
  );

  const groupedOrders = useMemo(() => {
    const groups = {
      atrasados: orders.filter((order) => order.deliveryDate < todayStr),
      hoje: orders.filter((order) => order.deliveryDate === todayStr),
      amanha: orders.filter((order) => order.deliveryDate === tomorrowStr),
      proximos: orders.filter((order) => order.deliveryDate > tomorrowStr),
    };

    return {
      atrasados: sortOrders(groups.atrasados),
      hoje: sortOrders(groups.hoje),
      amanha: sortOrders(groups.amanha),
      proximos: sortOrders(groups.proximos),
    };
  }, [orders, todayStr, tomorrowStr]);

  const FilaColumn = ({
    title,
    orders,
    icon: Icon,
    headerColor,
  }: {
    title: string;
    orders: OrderQueueCardItem[];
    icon: any;
    headerColor: string;
  }) => (
    <div className="flex flex-col bg-card/40 rounded-2xl border border-border/50 overflow-hidden h-[calc(100vh-12rem)] min-w-[300px] sm:min-w-[350px]">
      <div className={cn("p-4 border-b flex items-center justify-between", headerColor)}>
        <h3 className="font-bold flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
        </h3>
        <span className="bg-background/50 text-foreground text-sm font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
          {orders.length}
        </span>
      </div>

      <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        {orders.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground/50 text-sm p-4 text-center">
            Nenhum pedido nesta fila
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className={cn(
                "glass-card p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden transition-all hover:-translate-y-1",
                order.status === "Pronto" && "border-success/50 bg-success/5",
                order.paymentStatus !== "Pago" && "border-l-4 border-l-destructive",
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground">
                      {order.orderNumber}
                    </span>
                    {order.paymentStatus !== "Pago" && (
                      <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-sm uppercase">
                        $ {order.paymentStatus}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-base truncate">
                    {order.customerName}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1 font-bold bg-muted/50 px-2 py-1 rounded-md text-sm">
                    <Clock className="w-3.5 h-3.5" />
                    {order.deliveryTime || "--:--"}
                  </div>
                </div>
              </div>

              <div className="text-sm bg-muted/30 p-2 rounded-lg border border-border/50">
                <ul className="space-y-1">
                  {order.items.map((item, index) => (
                    <li key={`${order.id}-${index}`} className="flex gap-2">
                      <span className="font-bold min-w-[20px]">
                        {item.quantity}x
                      </span>
                      <span className="truncate">{item.productName}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground">
                  Criado: {formatDate(order.orderDate)}
                </div>
                <div
                  className={cn(
                    "text-xs font-bold px-2 py-1 rounded-full",
                    getStatusBadgeClass(order.status),
                  )}
                >
                  {order.status}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <AppLayout title="Fila de ProduÃ§Ã£o">
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold text-foreground">
            Quadro de ProduÃ§Ã£o
          </h2>
          <p className="text-muted-foreground">
            Visualize e organize as entregas por data.
          </p>
        </div>

        {queueQuery.isError ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="glass-card p-8 rounded-2xl border border-border/50 text-center space-y-3 max-w-md">
              <p className="font-semibold text-foreground">
                NÃ£o foi possÃ­vel carregar a fila de produÃ§Ã£o.
              </p>
              <p className="text-sm text-muted-foreground">
                Tente novamente para buscar os pedidos reais da fila.
              </p>
              <button
                type="button"
                onClick={() => queueQuery.refetch()}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : queueQuery.isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="glass-card p-8 rounded-2xl border border-border/50 text-center space-y-3 max-w-md">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Carregando fila de produÃ§Ã£o...</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-4 sm:gap-6 min-w-max h-full">
              <FilaColumn
                title="Atrasados"
                orders={groupedOrders.atrasados}
                icon={AlertCircle}
                headerColor="bg-destructive/10 text-destructive border-destructive/20"
              />

              <FilaColumn
                title="Hoje"
                orders={groupedOrders.hoje}
                icon={Clock}
                headerColor="bg-warning/20 text-warning-foreground border-warning/30"
              />

              <FilaColumn
                title="AmanhÃ£"
                orders={groupedOrders.amanha}
                icon={Clock}
                headerColor="bg-primary/10 text-primary border-primary/20"
              />

              <FilaColumn
                title="PrÃ³ximos Dias"
                orders={groupedOrders.proximos}
                icon={CheckCircle2}
                headerColor="bg-muted/50 text-foreground border-border"
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
