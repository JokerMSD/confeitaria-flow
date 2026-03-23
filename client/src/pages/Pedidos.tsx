import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockData } from "@/hooks/use-mock-data";
import { mockOrders, Order, OrderStatus } from "@/data/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Filter, Plus, Clock, MoreVertical, X } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Pedidos() {
  const [orders] = useMockData("orders", mockOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Novo': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'Confirmado': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
      case 'Em produção': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Pronto': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'Entregue': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      case 'Cancelado': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'Pago': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">PAGO</span>;
      case 'Parcial': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning-foreground border border-warning/20">PARCIAL</span>;
      case 'Pendente': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">PENDENTE</span>;
      default: return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

  const statusOptions = ['todos', 'Novo', 'Confirmado', 'Em produção', 'Pronto', 'Entregue', 'Cancelado'];

  return (
    <AppLayout title="Pedidos">
      <div className="space-y-6">
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por cliente ou nº do pedido..." 
                className="pl-9 bg-card border-border"
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
            
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {statusOptions.map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border",
                    statusFilter === status 
                      ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                      : "bg-card text-foreground border-border hover:bg-muted"
                  )}
                >
                  {status === 'todos' ? 'Todos os Pedidos' : status}
                </button>
              ))}
            </div>
          </div>

          <Link href="/pedidos/novo">
            <a className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-primary/90 transition-all shrink-0">
              <Plus className="w-5 h-5" />
              Novo Pedido
            </a>
          </Link>
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card/50 rounded-2xl border border-dashed border-border">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum pedido encontrado.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <Card key={order.id} className="glass-card overflow-hidden hover:border-primary/30 transition-colors group cursor-pointer">
                <div className="p-5 flex flex-col h-full gap-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-muted-foreground">{order.orderNumber}</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", getStatusColor(order.status))}>
                          {order.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg leading-tight line-clamp-1">{order.customerName}</h3>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Order Details */}
                  <div className="space-y-2 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm mt-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(order.deliveryDate)} {order.deliveryTime && `às ${order.deliveryTime}`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                      <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      {getPaymentBadge(order.paymentStatus)}
                      <span className="text-[10px] text-muted-foreground uppercase">{order.paymentMethod}</span>
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

// Dummy import since it's used in the empty state
import { ClipboardList } from "lucide-react";