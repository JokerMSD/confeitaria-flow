import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Plus, Clock, MoreVertical, X, Calendar, DollarSign, Trash2, ClipboardList } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/http-client";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { useDeleteOrder } from "@/features/orders/hooks/use-delete-order";
import { adaptOrderListToCards } from "@/features/orders/lib/order-list-adapter";
import {
  mapUiPaymentStatusToApi,
  mapUiStatusToApi,
  normalizeOrderFilters,
} from "@/features/orders/lib/order-filters";
import type { UiOrderStatus } from "@/features/orders/types/order-ui";

export default function Pedidos() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [paymentFilter, setPaymentFilter] = useState<string>("todos");
  const [dateFilter, setDateFilter] = useState("");

  const filters = useMemo(
    () =>
      normalizeOrderFilters({
        search: searchTerm || undefined,
        status: statusFilter === "todos" ? undefined : mapUiStatusToApi(statusFilter),
        deliveryDate: dateFilter || undefined,
        paymentStatus:
          paymentFilter === "todos"
            ? undefined
            : mapUiPaymentStatusToApi(paymentFilter),
      }),
    [dateFilter, paymentFilter, searchTerm, statusFilter],
  );

  const { data, isLoading, isError, error, refetch } = useOrders(filters);
  const deleteOrderMutation = useDeleteOrder();

  const orders = useMemo(() => adaptOrderListToCards(data?.data ?? []), [data]);

  const getStatusColor = (status: UiOrderStatus) => {
    switch (status) {
      case "Novo":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "Confirmado":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800";
      case "Em produção":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "Pronto":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "Entregue":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
      case "Cancelado":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "Pago":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">PAGO</span>;
      case "Parcial":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning-foreground border border-warning/20">PARCIAL</span>;
      case "Pendente":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">PENDENTE</span>;
      default:
        return null;
    }
  };

  const handleDeleteOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (confirm("Tem certeza que deseja excluir este pedido?")) {
      deleteOrderMutation.mutate(id, {
        onSuccess: () => {
          toast({
            title: "Pedido excluído",
            description: "O pedido foi removido com sucesso.",
          });
        },
        onError: (mutationError) => {
          const message =
            mutationError instanceof ApiError
              ? mutationError.message
              : "Não foi possível excluir o pedido.";

          toast({
            title: "Erro ao excluir pedido",
            description: message,
            variant: "destructive",
          });
        },
      });
    }
  };

  const statusOptions = ["todos", "Novo", "Confirmado", "Em produção", "Pronto", "Entregue", "Cancelado"];

  return (
    <AppLayout title="Pedidos">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-display font-bold text-foreground hidden sm:block">Gerenciar Pedidos</h2>
            <Link href="/pedidos/novo">
              <a className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-primary/90 transition-all shrink-0 w-full sm:w-auto">
                <Plus className="w-5 h-5" />
                Novo Pedido
              </a>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card p-4 rounded-xl border border-border/50">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou nº..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <Input
                type="date"
                className="pl-9 text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </div>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="todos">Pgto (Todos)</option>
                <option value="Pago">Pago</option>
                <option value="Parcial">Parcial</option>
                <option value="Pendente">Pendente</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border",
                  statusFilter === status
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:bg-muted",
                )}
              >
                {status === "todos" ? "Todos os Status" : status}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card/50 rounded-2xl border border-dashed border-border">
              <p>Carregando pedidos...</p>
            </div>
          ) : isError ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card/50 rounded-2xl border border-dashed border-border">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Não foi possível carregar os pedidos.</p>
              <Button variant="link" onClick={() => refetch()} className="mt-2 text-primary">
                Tentar Novamente
              </Button>
              {error instanceof ApiError && <p className="mt-2 text-xs text-destructive">{error.message}</p>}
            </div>
          ) : orders.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card/50 rounded-2xl border border-dashed border-border">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum pedido encontrado.</p>
              {(searchTerm || statusFilter !== "todos" || dateFilter || paymentFilter !== "todos") && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("todos");
                    setDateFilter("");
                    setPaymentFilter("todos");
                  }}
                  className="mt-2 text-primary"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                className="glass-card overflow-hidden hover:border-primary/30 transition-all group cursor-pointer hover:-translate-y-1"
                onClick={() => setLocation(`/pedidos/${order.id}`)}
              >
                <div className="p-5 flex flex-col h-full gap-4 relative">
                  <div
                    className={cn(
                      "absolute top-0 left-0 right-0 h-1",
                      order.status === "Pronto"
                        ? "bg-success"
                        : order.status === "Em produção"
                          ? "bg-amber-400"
                          : order.status === "Cancelado"
                            ? "bg-destructive"
                            : "bg-transparent",
                    )}
                  />

                  <div className="flex justify-between items-start mt-1">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-muted-foreground">{order.orderNumber}</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", getStatusColor(order.status))}>
                          {order.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg leading-tight line-clamp-1">{order.customerName}</h3>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted focus:outline-none">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setLocation(`/pedidos/${order.id}`)}>
                            Editar Pedido
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            onClick={(e) => handleDeleteOrder(order.id, e as any)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-2">{order.itemSummary}</p>
                    {order.notes && (
                      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Observações
                        </p>
                        <p className="mt-1 text-sm text-foreground/90 line-clamp-3 break-words">
                          {order.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm mt-4">
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-md border",
                          order.deliveryDate < new Date().toISOString().split("T")[0] &&
                            order.status !== "Entregue" &&
                            order.status !== "Cancelado"
                            ? "bg-destructive/10 text-destructive border-destructive/20 font-bold"
                            : "bg-muted/50 text-muted-foreground border-transparent",
                        )}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {formatDate(order.deliveryDate)} {order.deliveryTime && `às ${order.deliveryTime}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between bg-muted/10 -mx-5 -mb-5 px-5 pb-5">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                      <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      {getPaymentBadge(order.paymentStatus)}
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{order.paymentMethod}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
