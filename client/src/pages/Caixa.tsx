import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useMockData } from "@/hooks/use-mock-data";
import { mockTransactions, CashTransaction } from "@/data/mock-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Plus, DollarSign, Wallet, Calendar, Search, Trash2, Edit } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Caixa() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [transactions, setTransactions] = useMockData("transactions", mockTransactions);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = typeFilter === "todos" || t.type.toLowerCase() === typeFilter;
      const matchesCat = categoryFilter === "todas" || t.category === categoryFilter;
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !dateFilter || t.date.startsWith(dateFilter);
      
      return matchesType && matchesCat && matchesSearch && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, typeFilter, categoryFilter, searchTerm, dateFilter]);

  // Cálculos do dia/período filtrado
  const totalEntradas = filteredTransactions
    .filter(t => t.type === 'Entrada')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSaidas = filteredTransactions
    .filter(t => t.type === 'Saída')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldo = totalEntradas - totalSaidas;

  const handleDelete = (id: string) => {
    if(confirm("Tem certeza que deseja excluir esta movimentação?")) {
      setTransactions(transactions.filter(t => t.id !== id));
      toast({
        title: "Movimentação excluída",
        description: "O registro foi removido do caixa."
      });
    }
  };

  const categorias = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return ['todas', ...Array.from(cats)];
  }, [transactions]);

  return (
    <AppLayout title="Caixa">
      <div className="space-y-6">
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Controle de Caixa</h2>
            <p className="text-muted-foreground">Acompanhe as finanças da sua confeitaria.</p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Link href="/caixa/novo?tipo=Saída" className="flex-1 sm:flex-none">
              <a className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all border border-destructive/20 w-full">
                <ArrowDownRight className="w-5 h-5" />
                Nova Saída
              </a>
            </Link>
            <Link href="/caixa/novo?tipo=Entrada" className="flex-1 sm:flex-none">
              <a className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-success text-success-foreground hover:bg-success/90 transition-all shadow-sm w-full">
                <ArrowUpRight className="w-5 h-5" />
                Nova Entrada
              </a>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card p-4 rounded-xl border border-border/50">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por descrição..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <Input 
              type="date" 
              className="pl-9"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="todas">Todas Categorias</option>
            {categorias.filter(c => c !== 'todas').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Resumo do Período */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card bg-success/5 border-success/20">
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-success/80">
                <span className="text-sm font-bold uppercase tracking-wider">Entradas</span>
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
                <span className="text-sm font-bold uppercase tracking-wider">Saídas</span>
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div className="text-3xl font-display font-bold text-destructive">
                {formatCurrency(totalSaidas)}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-primary/80">
                <span className="text-sm font-bold uppercase tracking-wider">Saldo do Período</span>
                <Wallet className="w-5 h-5" />
              </div>
              <div className={cn(
                "text-3xl font-display font-bold",
                saldo >= 0 ? "text-primary" : "text-destructive"
              )}>
                {formatCurrency(saldo)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
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

        {/* Transactions List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Descrição</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 hidden sm:table-cell">Categoria</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 hidden md:table-cell">Data/Hora</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Valor</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Nenhuma movimentação encontrada para os filtros selecionados.</p>
                      {(searchTerm || dateFilter || categoryFilter !== 'todas' || typeFilter !== 'todos') && (
                        <Button variant="link" onClick={() => {
                          setSearchTerm(""); setDateFilter(""); setCategoryFilter("todas"); setTypeFilter("todos");
                        }} className="mt-2 text-primary">
                          Limpar Filtros
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(t => {
                    const isEntrada = t.type === 'Entrada';
                    
                    return (
                      <tr key={t.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                              isEntrada ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"
                            )}>
                              {isEntrada ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="font-bold text-foreground text-base">{t.description}</div>
                              <div className="text-xs text-muted-foreground sm:hidden mt-0.5">
                                {t.category} • {formatDateTime(t.date).split(' ')[0]}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase font-semibold">
                                  {t.paymentMethod}
                                </span>
                                {t.orderId && (
                                  <Link href={`/pedidos/${t.orderId}`}>
                                    <a className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm hover:underline">
                                      Pedido #{t.orderId}
                                    </a>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 hidden sm:table-cell">
                          <span className="bg-muted px-2 py-1 rounded-md text-xs font-medium border border-border">
                            {t.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                          {formatDateTime(t.date)}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                          <span className={cn(
                            "font-bold text-base whitespace-nowrap",
                            isEntrada ? "text-success" : "text-destructive"
                          )}>
                            {isEntrada ? '+' : '-'} {formatCurrency(t.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Link href={`/caixa/${t.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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