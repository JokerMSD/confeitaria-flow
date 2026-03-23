import { AppLayout } from "@/components/layout/AppLayout";
import { useMockData } from "@/hooks/use-mock-data";
import { mockTransactions } from "@/data/mock-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Plus, Filter, DollarSign, Wallet } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Caixa() {
  const [transactions] = useMockData("transactions", mockTransactions);
  const [typeFilter, setTypeFilter] = useState<string>("todos");

  // Hoje
  const todayStr = new Date().toISOString().split('T')[0];

  const transactionsHoje = transactions.filter(t => t.date.startsWith(todayStr));

  const totalEntradas = transactionsHoje
    .filter(t => t.type === 'Entrada')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSaidas = transactionsHoje
    .filter(t => t.type === 'Saída')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldo = totalEntradas - totalSaidas;

  const filteredTransactions = transactions.filter(t => {
    if (typeFilter === "todos") return true;
    return t.type.toLowerCase() === typeFilter.toLowerCase();
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <AppLayout title="Caixa">
      <div className="space-y-6">
        
        {/* Resumo do Dia */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-card bg-success/5 border-success/20">
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-success/80">
                <span className="text-sm font-bold uppercase tracking-wider">Entradas Hoje</span>
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div className="text-3xl font-display font-bold text-success">
                {formatCurrency(totalEntradas)}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card bg-destructive/5 border-destructive/20">
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-destructive/80">
                <span className="text-sm font-bold uppercase tracking-wider">Saídas Hoje</span>
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div className="text-3xl font-display font-bold text-destructive">
                {formatCurrency(totalSaidas)}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card bg-primary/5 border-primary/20 sm:col-span-1">
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-primary/80">
                <span className="text-sm font-bold uppercase tracking-wider">Saldo do Dia</span>
                <Wallet className="w-5 h-5" />
              </div>
              <div className="text-3xl font-display font-bold text-primary">
                {formatCurrency(saldo)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header Actions & List */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {['todos', 'entrada', 'saída'].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border capitalize",
                  typeFilter === type 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-card text-foreground border-border hover:bg-muted"
                )}
              >
                {type === 'todos' ? 'Todas as Movimentações' : `${type}s`}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button className="flex-1 sm:flex-none gap-2 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              <ArrowDownRight className="w-4 h-4" />
              Nova Saída
            </Button>
            <Button className="flex-1 sm:flex-none gap-2 rounded-xl bg-success hover:bg-success/90 text-success-foreground">
              <ArrowUpRight className="w-4 h-4" />
              Nova Entrada
            </Button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Descrição</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 hidden sm:table-cell">Categoria</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 hidden md:table-cell">Data/Hora</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 hidden sm:table-cell">Pagamento</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Nenhuma movimentação encontrada.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(t => {
                    const isEntrada = t.type === 'Entrada';
                    
                    return (
                      <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              isEntrada ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                            )}>
                              {isEntrada ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-foreground">{t.description}</div>
                              <div className="text-xs text-muted-foreground sm:hidden mt-0.5">
                                {t.category} • {formatDateTime(t.date).split(' ')[0]}
                              </div>
                              {t.orderId && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm mt-1 inline-block">
                                  Pedido #{t.orderId}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 hidden sm:table-cell text-muted-foreground">
                          {t.category}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                          {formatDateTime(t.date)}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 hidden sm:table-cell">
                          <span className="bg-muted px-2 py-1 rounded text-xs font-medium border border-border">
                            {t.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                          <span className={cn(
                            "font-bold whitespace-nowrap",
                            isEntrada ? "text-success" : "text-destructive"
                          )}>
                            {isEntrada ? '+' : '-'} {formatCurrency(t.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}