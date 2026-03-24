import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useMockData } from "@/hooks/use-mock-data";
import { mockTransactions, CashTransaction, PaymentMethod, mockOrders } from "@/data/mock-data";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "wouter/use-browser-location";

export default function CaixaForm() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const defaultType = searchParams.get('tipo') as 'Entrada' | 'Saída' || 'Entrada';
  
  const isEditing = params?.id && params.id !== "novo";
  const { toast } = useToast();

  const [transactions, setTransactions] = useMockData<CashTransaction>("transactions", mockTransactions);
  const [orders] = useMockData("orders", mockOrders);
  
  const existingTransaction = useMemo(() => {
    return isEditing ? transactions.find(t => t.id === params.id) : null;
  }, [isEditing, params.id, transactions]);

  // Form state
  const [type, setType] = useState<'Entrada' | 'Saída'>(existingTransaction?.type || defaultType);
  const [category, setCategory] = useState(existingTransaction?.category || (defaultType === 'Entrada' ? "Venda" : "Insumos"));
  const [description, setDescription] = useState(existingTransaction?.description || "");
  const [amount, setAmount] = useState(existingTransaction?.amount?.toString() || "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(existingTransaction?.paymentMethod || "Pix");
  const [date, setDate] = useState(
    existingTransaction?.date 
      ? existingTransaction.date.substring(0, 16) 
      : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().substring(0, 16)
  );
  const [orderId, setOrderId] = useState(existingTransaction?.orderId || "");

  // Categorias predefinidas baseadas no tipo
  const categoriasEntrada = ['Venda', 'Sinal', 'Estorno', 'Outros'];
  const categoriasSaida = ['Insumos', 'Embalagens', 'Transporte', 'Equipamentos', 'Impostos', 'Taxas', 'Salários', 'Outros'];

  const handleSave = () => {
    if (!description || !amount || parseFloat(amount.replace(',', '.')) <= 0) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Descrição e um valor maior que zero são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    
    const newTransaction: CashTransaction = {
      id: existingTransaction?.id || Math.random().toString(36).substr(2, 9),
      type,
      category,
      description,
      amount: numAmount,
      paymentMethod,
      date: new Date(date).toISOString(),
      orderId: orderId || undefined
    };

    if (isEditing) {
      setTransactions(transactions.map(t => t.id === newTransaction.id ? newTransaction : t));
      toast({ title: "Movimentação atualizada com sucesso!" });
    } else {
      setTransactions([newTransaction, ...transactions]);
      toast({ title: "Movimentação registrada com sucesso!" });
    }
    
    setLocation("/caixa");
  };

  return (
    <AppLayout title={isEditing ? "Editar Movimentação" : `Nova ${type}`}>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/caixa")} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {isEditing ? "Editar Movimentação" : `Nova ${type}`}
              </h2>
            </div>
          </div>
          <Button onClick={handleSave} className="gap-2 rounded-xl">
            <Save className="w-4 h-4" />
            Salvar
          </Button>
        </div>

        <Card className="glass-card">
          <CardContent className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo (Só mostra se for edição para não quebrar fluxo, ou se for novo e quiser trocar rápido) */}
              <div className="space-y-2">
                <Label>Tipo de Movimentação</Label>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant={type === 'Entrada' ? 'default' : 'outline'}
                    className={`flex-1 ${type === 'Entrada' ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}`}
                    onClick={() => { setType('Entrada'); setCategory('Venda'); }}
                  >
                    Entrada
                  </Button>
                  <Button 
                    type="button"
                    variant={type === 'Saída' ? 'default' : 'outline'}
                    className={`flex-1 ${type === 'Saída' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`}
                    onClick={() => { setType('Saída'); setCategory('Insumos'); }}
                  >
                    Saída
                  </Button>
                </div>
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="date">Data e Hora *</Label>
                <Input 
                  id="date" 
                  type="datetime-local" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input 
                  id="description" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Ex: Compra de Chocolate, Pagamento Pedido #123"
                  className="text-lg py-6"
                />
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  step="0.01" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  placeholder="0,00"
                  className="text-2xl font-bold font-display py-6"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select 
                  className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                >
                  {(type === 'Entrada' ? categoriasEntrada : categoriasSaida).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <select 
                  className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão de crédito">Cartão de crédito</option>
                  <option value="Cartão de débito">Cartão de débito</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>

              {/* Vínculo Opcional com Pedido */}
              <div className="space-y-2">
                <Label>Vincular a um Pedido (Opcional)</Label>
                <select 
                  className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={orderId} 
                  onChange={e => setOrderId(e.target.value)}
                >
                  <option value="">Nenhum pedido vinculado</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber} - {order.customerName}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}