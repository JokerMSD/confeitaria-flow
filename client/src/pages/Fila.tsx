import { AppLayout } from "@/components/layout/AppLayout";
import { useMockData } from "@/hooks/use-mock-data";
import { mockOrders } from "@/data/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export default function Fila() {
  const [orders] = useMockData("orders", mockOrders);
  
  // Data atual para referência
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Filtra pedidos ativos (não cancelados nem entregues)
  const activeOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'Cancelado' && o.status !== 'Entregue');
  }, [orders]);

  // Agrupa pedidos
  const groupedOrders = useMemo(() => {
    const groups = {
      atrasados: activeOrders.filter(o => o.deliveryDate < todayStr),
      hoje: activeOrders.filter(o => o.deliveryDate === todayStr),
      amanha: activeOrders.filter(o => o.deliveryDate === tomorrowStr),
      proximos: activeOrders.filter(o => o.deliveryDate > tomorrowStr)
    };

    // Ordenação: primeiro hora de entrega, depois ordem de criação (ID/número como fallback)
    const sortOrders = (list: typeof activeOrders) => {
      return [...list].sort((a, b) => {
        const timeA = a.deliveryTime || '23:59';
        const timeB = b.deliveryTime || '23:59';
        
        // Se as horas forem iguais, ordenar pelo número do pedido (assumindo que indica ordem de criação)
        if (timeA === timeB) {
            return a.orderNumber.localeCompare(b.orderNumber);
        }
        
        return timeA.localeCompare(timeB);
      });
    };

    return {
      atrasados: sortOrders(groups.atrasados),
      hoje: sortOrders(groups.hoje),
      amanha: sortOrders(groups.amanha),
      proximos: sortOrders(groups.proximos),
    };
  }, [activeOrders, todayStr, tomorrowStr]);

  const FilaColumn = ({ 
    title, 
    orders, 
    icon: Icon,
    colorClass,
    headerColor
  }: { 
    title: string, 
    orders: typeof activeOrders, 
    icon: any,
    colorClass: string,
    headerColor: string
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
          orders.map(order => (
            <div 
              key={order.id} 
              className={cn(
                "glass-card p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden transition-all hover:-translate-y-1",
                order.status === 'Pronto' && "border-success/50 bg-success/5",
                order.paymentStatus !== 'Pago' && "border-l-4 border-l-destructive"
              )}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground">{order.orderNumber}</span>
                    {order.paymentStatus !== 'Pago' && (
                      <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-sm uppercase">
                        $ {order.paymentStatus}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-base truncate">{order.customerName}</h4>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1 font-bold bg-muted/50 px-2 py-1 rounded-md text-sm">
                    <Clock className="w-3.5 h-3.5" />
                    {order.deliveryTime || '--:--'}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="text-sm bg-muted/30 p-2 rounded-lg border border-border/50">
                <ul className="space-y-1">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="font-bold min-w-[20px]">{item.quantity}x</span>
                      <span className="truncate">{item.productName}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status / Footer */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground">
                  Criado: {formatDate(order.orderDate)}
                </div>
                <div className={cn(
                  "text-xs font-bold px-2 py-1 rounded-full",
                  order.status === 'Pronto' ? "bg-success text-success-foreground" :
                  order.status === 'Em produção' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" :
                  "bg-muted text-muted-foreground"
                )}>
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
    <AppLayout title="Fila de Produção">
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold text-foreground">Quadro de Produção</h2>
          <p className="text-muted-foreground">Visualize e organize as entregas por data.</p>
        </div>

        {/* Scroll horizontal para as colunas */}
        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-4 sm:gap-6 min-w-max h-full">
            
            {/* Coluna Atrasados */}
            <FilaColumn 
              title="Atrasados" 
              orders={groupedOrders.atrasados} 
              icon={AlertCircle}
              colorClass="border-destructive"
              headerColor="bg-destructive/10 text-destructive border-destructive/20"
            />

            {/* Coluna Hoje */}
            <FilaColumn 
              title="Hoje" 
              orders={groupedOrders.hoje} 
              icon={Clock}
              colorClass="border-warning"
              headerColor="bg-warning/20 text-warning-foreground border-warning/30"
            />

            {/* Coluna Amanhã */}
            <FilaColumn 
              title="Amanhã" 
              orders={groupedOrders.amanha} 
              icon={Clock}
              colorClass="border-primary"
              headerColor="bg-primary/10 text-primary border-primary/20"
            />

            {/* Coluna Próximos */}
            <FilaColumn 
              title="Próximos Dias" 
              orders={groupedOrders.proximos} 
              icon={CheckCircle2}
              colorClass="border-muted"
              headerColor="bg-muted/50 text-foreground border-border"
            />

          </div>
        </div>
      </div>
    </AppLayout>
  );
}