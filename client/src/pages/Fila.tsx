import { useMemo } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  Clock,
  Loader2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useOrdersQueue } from "@/features/orders/hooks/use-orders-queue";
import { adaptOrdersQueue } from "@/features/orders/lib/order-queue-adapter";
import { cn, formatDate } from "@/lib/utils";
import type {
  OrderQueueCardItem,
  UiOrderStatus,
} from "@/features/orders/types/order-ui";

function getStatusBadgeClass(status: UiOrderStatus) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("pronto")) {
    return "bg-success text-success-foreground";
  }

  if (normalizedStatus.includes("produ")) {
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

function getDayLabel(dateStr: string, todayStr: string, tomorrowStr: string) {
  if (dateStr === todayStr) {
    return "Hoje";
  }

  if (dateStr === tomorrowStr) {
    return "Amanhã";
  }

  return formatDate(dateStr);
}

function formatWeekday(dateStr: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${dateStr}T12:00:00`));
}

function getTimeRange(orders: OrderQueueCardItem[]) {
  const times = orders
    .map((order) => order.deliveryTime)
    .filter((time): time is string => Boolean(time))
    .sort((a, b) => a.localeCompare(b));

  if (times.length === 0) {
    return "Horários a combinar";
  }

  if (times[0] === times[times.length - 1]) {
    return times[0];
  }

  return `${times[0]} -> ${times[times.length - 1]}`;
}

function QueueOrderCard({
  order,
  compact = false,
}: {
  order: OrderQueueCardItem;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl flex flex-col gap-3 relative overflow-hidden transition-all hover:-translate-y-1",
        compact ? "p-3" : "p-4",
        order.status === "Pronto" && "border-success/50 bg-success/5",
        order.paymentStatus !== "Pago" && "border-l-4 border-l-destructive",
      )}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground">
              {order.orderNumber}
            </span>
            {order.paymentStatus !== "Pago" && (
              <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-sm uppercase">
                {order.paymentStatus}
              </span>
            )}
          </div>
          <h4 className="font-bold text-base leading-tight">
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
              <span className="font-bold min-w-[20px]">{item.quantity}x</span>
              <span className="truncate">{item.productName}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 mt-auto pt-2 border-t border-border/50">
        <div className="text-xs text-muted-foreground">
          Criado: {formatDate(order.orderDate)}
        </div>
        <div
          className={cn(
            "text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap",
            getStatusBadgeClass(order.status),
          )}
        >
          {order.status}
        </div>
      </div>
    </div>
  );
}

function QueueSection({
  title,
  orders,
  icon: Icon,
  headerColor,
  mobileDescription,
}: {
  title: string;
  orders: OrderQueueCardItem[];
  icon: typeof Clock;
  headerColor: string;
  mobileDescription?: string;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden">
      <div className={cn("p-4 border-b flex items-center justify-between gap-3", headerColor)}>
        <div>
          <h3 className="font-bold flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {title}
          </h3>
          {mobileDescription ? (
            <p className="text-xs opacity-80 mt-1">{mobileDescription}</p>
          ) : null}
        </div>
        <span className="bg-background/50 text-foreground text-sm font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm shrink-0">
          {orders.length}
        </span>
      </div>

      <div className="p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-background/40 p-5 text-center text-sm text-muted-foreground">
            Nenhum pedido nesta fila
          </div>
        ) : (
          orders.map((order) => <QueueOrderCard key={order.id} order={order} />)
        )}
      </div>
    </section>
  );
}

function UpcomingDaysSection({
  orders,
  todayStr,
  tomorrowStr,
}: {
  orders: OrderQueueCardItem[];
  todayStr: string;
  tomorrowStr: string;
}) {
  const groupedUpcomingDays = useMemo(() => {
    const groups = new Map<
      string,
      {
        date: string;
        orders: OrderQueueCardItem[];
      }
    >();

    for (const order of orders) {
      const current = groups.get(order.deliveryDate);
      if (current) {
        current.orders.push(order);
        continue;
      }

      groups.set(order.deliveryDate, {
        date: order.deliveryDate,
        orders: [order],
      });
    }

    return Array.from(groups.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((group) => ({
        ...group,
        orders: sortOrders(group.orders),
      }));
  }, [orders]);

  return (
    <section className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden h-full">
      <div className="p-4 border-b bg-muted/50 text-foreground border-border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold flex items-center gap-2">
              <CalendarClock className="w-5 h-5" />
              Próximos Dias
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Agenda agrupada por data para facilitar a produção.
            </p>
          </div>
          <span className="bg-background/70 text-foreground text-sm font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm shrink-0">
            {orders.length}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {groupedUpcomingDays.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-background/40 p-5 text-center text-sm text-muted-foreground">
            Nenhum pedido agendado para os próximos dias
          </div>
        ) : (
          groupedUpcomingDays.map((group) => (
            <div
              key={group.date}
              className="rounded-2xl border border-border/60 bg-background/70 overflow-hidden"
            >
              <div className="p-4 border-b border-border/50 bg-muted/30">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {getDayLabel(group.date, todayStr, tomorrowStr)}
                      </span>
                      <span className="text-sm font-semibold capitalize text-foreground/80">
                        {formatWeekday(group.date)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {group.orders.length} pedido{group.orders.length > 1 ? "s" : ""} na fila
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 font-medium text-muted-foreground">
                      Janela: {getTimeRange(group.orders)}
                    </span>
                    <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 font-medium text-muted-foreground">
                      Clientes: {group.orders.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-3">
                {group.orders.map((order) => (
                  <QueueOrderCard key={order.id} order={order} compact />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function QueueColumn({
  title,
  orders,
  icon: Icon,
  headerColor,
}: {
  title: string;
  orders: OrderQueueCardItem[];
  icon: typeof Clock;
  headerColor: string;
}) {
  return (
    <div className="flex flex-col bg-card/40 rounded-2xl border border-border/50 overflow-hidden h-[calc(100vh-12rem)] min-w-[300px] sm:min-w-[350px]">
      <div className={cn("p-4 border-b flex items-center justify-between gap-3", headerColor)}>
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
          orders.map((order) => <QueueOrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
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

  return (
    <AppLayout title="Fila de Produção">
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold text-foreground">
            Quadro de Produção
          </h2>
          <p className="text-muted-foreground">
            Visualize e organize as entregas por data.
          </p>
        </div>

        {queueQuery.isError ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="glass-card p-8 rounded-2xl border border-border/50 text-center space-y-3 max-w-md">
              <p className="font-semibold text-foreground">
                Não foi possível carregar a fila de produção.
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
                <span>Carregando fila de produção...</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-4 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">
                    Atrasados
                  </p>
                  <p className="mt-2 text-3xl font-display font-bold text-destructive">
                    {groupedOrders.atrasados.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Hoje + Amanhã
                  </p>
                  <p className="mt-2 text-3xl font-display font-bold text-primary">
                    {groupedOrders.hoje.length + groupedOrders.amanha.length}
                  </p>
                </div>
              </div>

              <QueueSection
                title="Atrasados"
                orders={groupedOrders.atrasados}
                icon={AlertCircle}
                headerColor="bg-destructive/10 text-destructive border-destructive/20"
                mobileDescription="Pedidos que ja passaram da data prometida."
              />

              <QueueSection
                title="Hoje"
                orders={groupedOrders.hoje}
                icon={Clock}
                headerColor="bg-warning/20 text-warning-foreground border-warning/30"
                mobileDescription="Entregas que precisam sair hoje."
              />

              <QueueSection
                title="Amanhã"
                orders={groupedOrders.amanha}
                icon={ArrowRight}
                headerColor="bg-primary/10 text-primary border-primary/20"
                mobileDescription="Preparação imediata para o dia seguinte."
              />

              <UpcomingDaysSection
                orders={groupedOrders.proximos}
                todayStr={todayStr}
                tomorrowStr={tomorrowStr}
              />
            </div>

            <div className="hidden md:block flex-1 overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex gap-4 sm:gap-6 min-w-max h-full">
                <QueueColumn
                  title="Atrasados"
                  orders={groupedOrders.atrasados}
                  icon={AlertCircle}
                  headerColor="bg-destructive/10 text-destructive border-destructive/20"
                />

                <QueueColumn
                  title="Hoje"
                  orders={groupedOrders.hoje}
                  icon={Clock}
                  headerColor="bg-warning/20 text-warning-foreground border-warning/30"
                />

                <QueueColumn
                  title="Amanhã"
                  orders={groupedOrders.amanha}
                  icon={ArrowRight}
                  headerColor="bg-primary/10 text-primary border-primary/20"
                />

                <div className="flex flex-col bg-card/40 rounded-2xl border border-border/50 overflow-hidden h-[calc(100vh-12rem)] min-w-[360px] sm:min-w-[420px]">
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <UpcomingDaysSection
                      orders={groupedOrders.proximos}
                      todayStr={todayStr}
                      tomorrowStr={tomorrowStr}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
