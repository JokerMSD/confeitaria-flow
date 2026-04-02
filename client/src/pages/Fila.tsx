import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/http-client";
import { useOrdersQueue } from "@/features/orders/hooks/use-orders-queue";
import { useUpdateOrderStatus } from "@/features/orders/hooks/use-update-order-status";
import { adaptOrdersQueue } from "@/features/orders/lib/order-queue-adapter";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type {
  OrderQueueCardItem,
  UiOrderStatus,
} from "@/features/orders/types/order-ui";

type QueueFilter = "todos" | "acao" | "prontos" | "nao-pagos";
type QuickStatus = "Confirmado" | "EmProducao" | "Pronto" | "Entregue";

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(12, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const weekday = next.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  next.setDate(next.getDate() + offset);
  next.setHours(12, 0, 0, 0);
  return next;
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getWeekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
  })
    .format(date)
    .replace(".", "");
}

function getFullDateLabel(dateStr: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(parseLocalDate(dateStr));
}

function getTimeLabel(value?: string) {
  return value?.trim() ? value : "Sem horário";
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

function getStatusBadgeClass(status: UiOrderStatus) {
  switch (status) {
    case "Novo":
      return "border-sky-200 bg-sky-100 text-sky-700";
    case "Confirmado":
      return "border-indigo-200 bg-indigo-100 text-indigo-700";
    case "Em produção":
      return "border-amber-200 bg-amber-100 text-amber-700";
    case "Pronto":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "Entregue":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "Cancelado":
      return "border-red-200 bg-red-100 text-red-700";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getStatusCountMap(orders: OrderQueueCardItem[]) {
  return orders.reduce<Record<UiOrderStatus, number>>(
    (acc, order) => {
      acc[order.status] += 1;
      return acc;
    },
    {
      Novo: 0,
      Confirmado: 0,
      "Em produção": 0,
      Pronto: 0,
      Entregue: 0,
      Cancelado: 0,
    },
  );
}

function buildSearchableText(order: OrderQueueCardItem) {
  return [
    order.orderNumber,
    order.customerName,
    order.customerPhone,
    order.notes,
    ...order.items.map((item) => item.productName),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function orderMatchesFilter(order: OrderQueueCardItem, filter: QueueFilter) {
  switch (filter) {
    case "acao":
      return order.status !== "Pronto" && order.paymentStatus !== "Pago";
    case "prontos":
      return order.status === "Pronto";
    case "nao-pagos":
      return order.paymentStatus !== "Pago";
    default:
      return true;
  }
}

function getActionsForStatus(status: UiOrderStatus): Array<{
  label: string;
  nextStatus: QuickStatus;
  tone: "primary" | "secondary" | "success";
}> {
  switch (status) {
    case "Novo":
      return [{ label: "Confirmar", nextStatus: "Confirmado", tone: "primary" }];
    case "Confirmado":
      return [{ label: "Iniciar produção", nextStatus: "EmProducao", tone: "secondary" }];
    case "Em produção":
      return [
        { label: "Voltar", nextStatus: "Confirmado", tone: "secondary" },
        { label: "Marcar pronto", nextStatus: "Pronto", tone: "success" },
      ];
    case "Pronto":
      return [
        { label: "Reabrir", nextStatus: "Confirmado", tone: "secondary" },
        { label: "Entregar", nextStatus: "Entregue", tone: "success" },
      ];
    default:
      return [];
  }
}

function getActionClass(tone: "primary" | "secondary" | "success") {
  switch (tone) {
    case "secondary":
      return "bg-muted text-foreground hover:bg-muted/80";
    case "success":
      return "bg-emerald-600 text-white hover:bg-emerald-700";
    default:
      return "bg-primary text-primary-foreground hover:bg-primary/90";
  }
}

function buildCalendarDays(referenceMonth: Date) {
  const monthStart = startOfMonth(referenceMonth);
  const monthEnd = endOfMonth(referenceMonth);
  const firstGridDay = startOfWeek(monthStart);
  const days: Date[] = [];

  for (
    let cursor = new Date(firstGridDay);
    cursor <= addDays(monthEnd, 13);
    cursor = addDays(cursor, 1)
  ) {
    days.push(cursor);
    if (days.length >= 42) {
      break;
    }
  }

  return days;
}

function QueueStatCard({
  title,
  value,
  description,
  tone = "default",
}: {
  title: string;
  value: string | number;
  description: string;
  tone?: "default" | "danger" | "success" | "primary";
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-5",
        tone === "danger" && "border-destructive/20 bg-destructive/5",
        tone === "success" && "border-emerald-200 bg-emerald-50",
        tone === "primary" && "border-primary/20 bg-primary/5",
        tone === "default" && "border-border bg-card/75",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
      <p className="mt-3 text-4xl font-display font-bold text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function QueueOrderCard({
  order,
  pending,
  onMoveStatus,
}: {
  order: OrderQueueCardItem;
  pending: boolean;
  onMoveStatus: (order: OrderQueueCardItem, nextStatus: QuickStatus) => void;
}) {
  const actions = getActionsForStatus(order.status);

  return (
    <article className="rounded-3xl border border-border bg-card/90 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {order.orderNumber}
            </span>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-bold",
                getStatusBadgeClass(order.status),
              )}
            >
              {order.status}
            </span>
            {order.paymentStatus !== "Pago" ? (
              <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive">
                {order.paymentStatus}
              </span>
            ) : null}
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{order.customerName}</h3>
            {order.customerPhone ? (
              <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
            ) : null}
          </div>
        </div>

        <div className="min-w-[116px] rounded-2xl border border-border/70 bg-background px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Entrega</p>
          <p className="mt-1 font-display text-3xl font-bold text-foreground">
            {getTimeLabel(order.deliveryTime)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Valor</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {formatCurrency(order.totalAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Recebido</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(order.paidAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Falta receber</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {formatCurrency(order.remainingAmount)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border/70 bg-background/80 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Itens do pedido</p>
        <ul className="mt-3 space-y-2 text-sm leading-6">
          {order.items.map((item, index) => (
            <li key={`${order.id}-${index}`} className="flex gap-2">
              <span className="font-bold">{item.quantity}x</span>
              <span>{item.productName}</span>
            </li>
          ))}
        </ul>
      </div>

      {order.notes ? (
        <div className="mt-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Observações</p>
          <p className="mt-2 text-sm leading-6 text-foreground/90">{order.notes}</p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="text-sm text-muted-foreground">
          Criado em {formatDate(order.orderDate)} • {order.paymentMethod}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/pedidos/${order.id}`}>
            <a className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-muted">
              Abrir pedido
            </a>
          </Link>
          {actions.map((action) => (
            <button
              key={action.nextStatus}
              type="button"
              disabled={pending}
              onClick={() => onMoveStatus(order, action.nextStatus)}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                getActionClass(action.tone),
              )}
            >
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function Fila() {
  const { toast } = useToast();
  const queueQuery = useOrdersQueue();
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const [searchTerm, setSearchTerm] = useState("");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("todos");
  const todayKey = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const orders = useMemo(
    () => adaptOrdersQueue(queueQuery.data?.data ?? []),
    [queueQuery.data],
  );

  const dateCounts = useMemo(
    () =>
      orders.reduce<Record<string, number>>((acc, order) => {
        acc[order.deliveryDate] = (acc[order.deliveryDate] ?? 0) + 1;
        return acc;
      }, {}),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return sortOrders(
      orders.filter((order) => {
        if (!orderMatchesFilter(order, queueFilter)) {
          return false;
        }

        if (selectedDate && order.deliveryDate !== selectedDate) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return buildSearchableText(order).includes(normalizedSearch);
      }),
    );
  }, [orders, queueFilter, searchTerm, selectedDate]);

  const overdueOrders = useMemo(
    () => filteredOrders.filter((order) => order.deliveryDate < todayKey),
    [filteredOrders, todayKey],
  );

  const selectedDayOrders = useMemo(
    () => (selectedDate ? filteredOrders.filter((order) => order.deliveryDate === selectedDate) : filteredOrders),
    [filteredOrders, selectedDate],
  );

  const selectedDayStatusCounts = useMemo(
    () => getStatusCountMap(selectedDayOrders),
    [selectedDayOrders],
  );

  const receivableAmount = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + order.remainingAmount, 0),
    [filteredOrders],
  );

  const readyCount = filteredOrders.filter((order) => order.status === "Pronto").length;
  const unpaidCount = filteredOrders.filter(
    (order) => order.paymentStatus !== "Pago",
  ).length;

  const agendaGroups = useMemo(() => {
    const groups = new Map<string, OrderQueueCardItem[]>();

    for (const order of selectedDayOrders) {
      const key = getTimeLabel(order.deliveryTime);
      const current = groups.get(key) ?? [];
      current.push(order);
      groups.set(key, current);
    }

    return Array.from(groups.entries())
      .sort(([slotA], [slotB]) => {
        if (slotA === "Sem horário") return 1;
        if (slotB === "Sem horário") return -1;
        return slotA.localeCompare(slotB);
      })
      .map(([slot, items]) => ({
        slot,
        items: sortOrders(items),
      }));
  }, [selectedDayOrders]);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  const handleMoveStatus = async (
    order: OrderQueueCardItem,
    nextStatus: QuickStatus,
  ) => {
    try {
      setPendingOrderId(order.id);
      await updateOrderStatusMutation.mutateAsync({
        id: order.id,
        status: nextStatus,
      });

      toast({
        title: "Fila atualizada",
        description: `${order.orderNumber} movido com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar pedido",
        description:
          error instanceof ApiError
            ? error.message
            : "Não foi possível mover o pedido na fila.",
        variant: "destructive",
      });
    } finally {
      setPendingOrderId(null);
    }
  };

  return (
    <AppLayout title="Fila de Produção" contentClassName="max-w-[1700px] 2xl:px-10">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-border bg-card/80 p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,680px)] xl:items-start">
            <div className="max-w-3xl space-y-2">
              <h2 className="text-3xl font-display font-bold text-foreground">
                Central de Produção
              </h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Visão operacional completa, com todos os pedidos ativos por padrão e calendário apenas como filtro opcional.
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por cliente, pedido ou item..."
                  className="h-12 w-full rounded-full border border-border bg-background pl-11 pr-4 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["todos", "Tudo"],
                  ["acao", "Precisa agir"],
                  ["prontos", "Prontos"],
                  ["nao-pagos", "Não pagos"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setQueueFilter(value as QueueFilter)}
                    className={cn(
                      "inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-medium transition-colors",
                      queueFilter === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    {label}
                  </button>
                ))}
                {selectedDate ? (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                    Limpar filtro
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <QueueStatCard
            title="Atrasados"
            value={overdueOrders.length}
            description="Pedidos com data anterior a hoje."
            tone="danger"
          />
          <QueueStatCard
            title="No filtro"
            value={selectedDayOrders.length}
            description={selectedDate ? getFullDateLabel(selectedDate) : "Todos os pedidos ativos."}
            tone="primary"
          />
          <QueueStatCard
            title="Prontos"
            value={readyCount}
            description="Aguardando retirada ou entrega."
            tone="success"
          />
          <QueueStatCard
            title="A receber"
            value={formatCurrency(receivableAmount)}
            description={`${unpaidCount} pedido(s) com pendência no filtro.`}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-[28px] border border-border bg-card/75 p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  Calendário operacional
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Clique no dia para abrir a agenda.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() =>
                    setVisibleMonth(
                      startOfMonth(
                        new Date(
                          visibleMonth.getFullYear(),
                          visibleMonth.getMonth() - 1,
                          1,
                          12,
                        ),
                      ),
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() =>
                    setVisibleMonth(
                      startOfMonth(
                        new Date(
                          visibleMonth.getFullYear(),
                          visibleMonth.getMonth() + 1,
                          1,
                          12,
                        ),
                      ),
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mb-4 text-lg font-semibold capitalize text-foreground">
              {getMonthLabel(visibleMonth)}
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-7 gap-2">
              {calendarDays.map((date) => {
                const dateKey = toDateKey(date);
                const orderCount = dateCounts[dateKey] ?? 0;
                const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDate;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateKey);
                      setVisibleMonth(startOfMonth(date));
                    }}
                    className={cn(
                      "min-h-[84px] rounded-3xl border p-2.5 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/8 shadow-sm"
                        : "border-border bg-background hover:bg-muted/40",
                      !isCurrentMonth && "opacity-45",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          isToday && "rounded-full bg-primary px-2 py-0.5 text-primary-foreground",
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {orderCount > 0 ? (
                        <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-bold text-background">
                          {orderCount}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 text-[11px] text-muted-foreground">
                      {getWeekdayLabel(date)}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_320px] 2xl:grid-cols-[minmax(0,1.4fr)_340px]">

            <section className="rounded-[28px] border border-border bg-card/75 p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
                    <Clock3 className="h-5 w-5 text-primary" />
                    Agenda operacional
                  </h3>
                  <p className="mt-2 text-sm capitalize leading-6 text-muted-foreground">
                    {selectedDate
                      ? getFullDateLabel(selectedDate)
                      : "Todos os pedidos ativos organizados por data e horário."}
                  </p>
                </div>
                <div className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground">
                  {selectedDayOrders.length} pedido(s)
                </div>
              </div>

              {queueQuery.isError ? (
                <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
                  <p className="font-semibold text-foreground">
                    Não foi possível carregar a fila.
                  </p>
                  <Button className="mt-4" variant="outline" onClick={() => queueQuery.refetch()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : queueQuery.isLoading ? (
                <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-border/60 bg-background/70">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Carregando agenda...</span>
                  </div>
                </div>
              ) : agendaGroups.length === 0 ? (
                <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-border/70 bg-background/70 p-8 text-center text-muted-foreground">
                  Nenhum pedido no filtro atual.
                </div>
              ) : (
                <div className="space-y-4">
                  {agendaGroups.map((group) => (
                    <div key={group.slot} className="space-y-3">
                      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3">
                        <div>
                          <p className="text-lg font-bold text-foreground">{group.slot}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.items.length} pedido(s) nesta faixa
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {group.items.map((order) => (
                          <QueueOrderCard
                            key={order.id}
                            order={order}
                            pending={pendingOrderId === order.id}
                            onMoveStatus={handleMoveStatus}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="rounded-[28px] border border-border bg-card/75 p-5 shadow-sm">
                <h3 className="text-xl font-bold text-foreground">Resumo do filtro</h3>
                <div className="mt-4 space-y-3">
                  {([
                    ["Novos", selectedDayStatusCounts.Novo],
                    ["Confirmados", selectedDayStatusCounts.Confirmado],
                    ["Em produção", selectedDayStatusCounts["Em produção"]],
                    ["Prontos", selectedDayStatusCounts.Pronto],
                  ] as const).map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3"
                    >
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-lg font-bold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-border bg-card/75 p-5 shadow-sm">
                <h3 className="text-xl font-bold text-foreground">Modo operação</h3>
                <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                    Confirme pedidos novos cedo para travar a produção do dia.
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                    Use os horários como fila de expedição e os atrasados como prioridade máxima.
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                    Marcar pronto reduz atrito entre produção, embalagem e retirada.
                  </div>
                </div>
              </div>

              {overdueOrders.length > 0 ? (
                <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-destructive">Atrasados</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {overdueOrders.length} pedido(s) ainda aberto(s) antes de hoje.
                      </p>
                      <div className="mt-4 space-y-2">
                        {overdueOrders.slice(0, 5).map((order) => (
                          <button
                            key={order.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-2xl border border-destructive/20 bg-background px-4 py-3 text-left"
                            onClick={() => {
                              setSelectedDate(order.deliveryDate);
                              setVisibleMonth(startOfMonth(parseLocalDate(order.deliveryDate)));
                            }}
                          >
                            <span className="truncate pr-3 font-medium text-foreground">
                              {order.orderNumber} • {order.customerName}
                            </span>
                            <span className="shrink-0 text-xs text-destructive">
                              {formatDate(order.deliveryDate)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}





