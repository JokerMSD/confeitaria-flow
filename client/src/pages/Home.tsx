import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockData } from "@/hooks/use-mock-data";
import { mockOrders, mockInventory, mockTransactions, OrderStatus, Order } from "@/data/mock-data";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  Clock, 
  AlertCircle, 
  DollarSign, 
  TrendingUp, 
  PackageMinus,
  CalendarDays,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const [orders] = useMockData("orders", mockOrders);
  const [inventory] = useMockData("inventory", mockInventory);
  const [transactions] = useMockData("transactions", mockTransactions);

  // Hoje
  const todayStr = new Date().toISOString().split('T')[0];

  // Cálculos do Dashboard
  const pedidosHoje = orders.filter(o => o.deliveryDate === todayStr && o.status !== 'Cancelado' && o.status !== 'Entregue').length;
  
  const pedidosAtrasados = orders.filter(o => {
    return o.deliveryDate < todayStr && o.status !== 'Cancelado' && o.status !== 'Entregue';
  }).length;

  const pedidosPendentesPagamento = orders.filter(o => 
    o.paymentStatus !== 'Pago' && o.status !== 'Cancelado'
  ).length;

  const totalRecebidoHoje = transactions
    .filter(t => t.type === 'Entrada' && t.date.startsWith(todayStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const estoqueBaixo = inventory.filter(i => i.currentQuantity <= i.minQuantity).length;

  // Próximos na Fila (Não entregues, ordenados por data e hora)
  const proximosFila = [...orders]
    .filter(o => o.status !== 'Cancelado' && o.status !== 'Entregue')
    .sort((a, b) => {
      const dateA = new Date(`${a.deliveryDate}T${a.deliveryTime || '23:59'}`);
      const dateB = new Date(`${b.deliveryDate}T${b.deliveryTime || '23:59'}`);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Novo': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Confirmado': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'Em produção': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Pronto': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Entregue': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      case 'Cancelado': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Olá, Doce Gestão 👋</h2>
            <p className="text-muted-foreground">Aqui está o resumo da sua confeitaria hoje.</p>
          </div>
          <Link href="/pedidos/novo">
            <a className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-primary/90 transition-all active:scale-95">
              + Novo Pedido
            </a>
          </Link>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <Card className="glass-card border-l-4 border-l-warning">
            <CardContent className="p-4 md:p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Para Hoje</span>
                <CalendarDays className="w-5 h-5 text-warning" />
              </div>
              <div className="text-3xl font-display font-bold">{pedidosHoje}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-destructive">
            <CardContent className="p-4 md:p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium text-destructive">Atrasados</span>
                <Clock className="w-5 h-5 text-destructive" />
              </div>
              <div className="text-3xl font-display font-bold text-destructive">{pedidosAtrasados}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-primary">
            <CardContent className="p-4 md:p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">A Receber</span>
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div className="text-3xl font-display font-bold">{pedidosPendentesPagamento}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-success">
            <CardContent className="p-4 md:p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Entradas Hoje</span>
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div className="text-2xl font-display font-bold">{formatCurrency(totalRecebidoHoje)}</div>
            </CardContent>
          </Card>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Fila Preview */}
          <Card className="glass-card lg:col-span-2 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Próximos na Fila
              </CardTitle>
              <Link href="/fila">
                <a className="text-sm font-medium text-primary hover:underline flex items-center">
                  Ver Fila Completa <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {proximosFila.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex-1 flex items-center justify-center flex-col gap-2">
                  <span className="text-4xl">🎉</span>
                  <p>Nenhum pedido na fila no momento!</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50 flex-1 overflow-auto max-h-[400px]">
                  {proximosFila.map((pedido) => {
                    const isAtrasado = pedido.deliveryDate < todayStr;
                    const isHoje = pedido.deliveryDate === todayStr;
                    
                    return (
                      <div key={pedido.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-foreground truncate">{pedido.customerName}</span>
                            <span className={cn(
                              "text-xs font-semibold px-2 py-0.5 rounded-full border",
                              isAtrasado ? "bg-destructive/10 text-destructive border-destructive/20" :
                              isHoje ? "bg-warning/10 text-warning-foreground border-warning/20" :
                              "bg-muted text-muted-foreground border-border"
                            )}>
                              {isAtrasado ? "Atrasado" : isHoje ? "Hoje" : "Próximos"}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 truncate">
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{pedido.orderNumber}</span>
                            <span>•</span>
                            <span className="truncate">{pedido.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2 shrink-0">
                          <div className="text-sm font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {pedido.deliveryTime || 'A combinar'}
                          </div>
                          <span className={cn("status-badge", getStatusColor(pedido.status))}>
                            {pedido.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas */}
          <div className="space-y-6 flex flex-col">
            
            {/* Estoque Baixo */}
            <Card className="glass-card flex-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <PackageMinus className="w-5 h-5" />
                  Estoque Baixo
                </CardTitle>
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
                  {estoqueBaixo}
                </span>
              </CardHeader>
              <CardContent className="p-0">
                {estoqueBaixo === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>Estoque em dia!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {inventory.filter(i => i.currentQuantity <= i.minQuantity).slice(0, 4).map(item => (
                      <div key={item.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-destructive">
                            {item.currentQuantity} <span className="text-xs font-normal">{item.unit}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">Mín: {item.minQuantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {estoqueBaixo > 4 && (
                  <div className="p-3 border-t border-border/50 text-center">
                    <Link href="/estoque">
                      <a className="text-sm font-medium text-primary hover:underline">Ver todos</a>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}