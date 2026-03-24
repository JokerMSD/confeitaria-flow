import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useMockData } from "@/hooks/use-mock-data";
import { mockInventory, InventoryItem, InventoryMovement } from "@/data/mock-data";
import { mockMovements } from "@/data/mock-movements";
import { ArrowLeft, Save, ArrowDownRight, ArrowUpRight, RefreshCw, Clock } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDateTime } from "@/lib/utils";

export default function EstoqueMovimentacao() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();

  const [inventory, setInventory] = useMockData<InventoryItem>("inventory", mockInventory);
  const [movements, setMovements] = useMockData<InventoryMovement>("movements", mockMovements);
  
  const item = useMemo(() => {
    return inventory.find(i => i.id === params.id);
  }, [params.id, inventory]);

  const itemMovements = useMemo(() => {
    return movements
      .filter(m => m.itemId === params.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, params.id]);

  // Form state
  const [type, setType] = useState<'Entrada' | 'Saída' | 'Ajuste'>('Entrada');
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  if (!item) {
    return (
      <AppLayout title="Item não encontrado">
        <div className="text-center p-12">
          <p className="text-muted-foreground">O item de estoque não foi encontrado.</p>
          <Button className="mt-4" onClick={() => setLocation("/estoque")}>Voltar para Estoque</Button>
        </div>
      </AppLayout>
    );
  }

  const handleSave = () => {
    const qty = parseFloat(quantity.replace(',', '.'));
    
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser maior que zero.",
        variant: "destructive"
      });
      return;
    }

    let diff = 0;
    if (type === 'Entrada') diff = qty;
    if (type === 'Saída') diff = -qty;
    if (type === 'Ajuste') diff = qty - item.currentQuantity; // Ajuste define o novo valor total

    if (type === 'Saída' && item.currentQuantity - qty < 0) {
       if(!confirm("Atenção: A saída é maior que o estoque atual. O saldo ficará negativo. Deseja continuar?")) {
           return;
       }
    }

    const newMovement: InventoryMovement = {
      id: Math.random().toString(36).substr(2, 9),
      itemId: item.id,
      type,
      quantity: type === 'Ajuste' ? diff : qty, // Salva a diferença no movimento
      date: new Date().toISOString(),
      reason
    };

    const updatedItem = {
      ...item,
      currentQuantity: type === 'Ajuste' ? qty : item.currentQuantity + diff
    };

    setMovements([newMovement, ...movements]);
    setInventory(inventory.map(i => i.id === item.id ? updatedItem : i));
    
    toast({ title: "Movimentação registrada com sucesso!" });
    
    // Reset form
    setQuantity("");
    setReason("");
  };

  return (
    <AppLayout title={`Estoque: ${item.name}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/estoque")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground line-clamp-1">
              {item.name}
            </h2>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className="bg-muted px-2 py-0.5 rounded text-xs font-semibold">{item.category}</span>
              <span>Estoque atual: <strong className={item.currentQuantity <= item.minQuantity ? "text-destructive" : ""}>{item.currentQuantity} {item.unit}</strong></span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Movimentação */}
          <Card className="glass-card h-fit">
            <CardContent className="p-6 space-y-6">
              <h3 className="font-bold text-lg border-b border-border pb-2">Nova Movimentação</h3>
              
              <div className="space-y-2">
                <Label>Tipo de Movimentação</Label>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant={type === 'Entrada' ? 'default' : 'outline'}
                    className={`flex-1 ${type === 'Entrada' ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}`}
                    onClick={() => setType('Entrada')}
                  >
                    Entrada
                  </Button>
                  <Button 
                    type="button"
                    variant={type === 'Saída' ? 'default' : 'outline'}
                    className={`flex-1 ${type === 'Saída' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`}
                    onClick={() => setType('Saída')}
                  >
                    Saída
                  </Button>
                  <Button 
                    type="button"
                    variant={type === 'Ajuste' ? 'default' : 'outline'}
                    className={`flex-1 ${type === 'Ajuste' ? 'bg-primary hover:bg-primary/90' : ''}`}
                    onClick={() => setType('Ajuste')}
                  >
                    Ajuste
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">
                  {type === 'Ajuste' ? 'Nova Quantidade Total' : 'Quantidade'} ({item.unit}) *
                </Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  step="0.01" 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)} 
                  placeholder="0"
                  className="text-xl font-bold font-display py-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo / Observação</Label>
                <Input 
                  id="reason" 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  placeholder={
                    type === 'Entrada' ? "Ex: Compra NF 1234" : 
                    type === 'Saída' ? "Ex: Produção Bolo Morango" : 
                    "Ex: Inventário mensal"
                  }
                />
              </div>

              <Button onClick={handleSave} className="w-full gap-2 rounded-xl h-12 text-base">
                <Save className="w-5 h-5" />
                Registrar
              </Button>
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card className="glass-card flex flex-col h-[500px]">
            <CardContent className="p-0 flex flex-col h-full">
              <div className="p-6 pb-4 border-b border-border">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Histórico de Movimentações
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {itemMovements.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground h-full flex flex-col justify-center items-center">
                    <RefreshCw className="w-12 h-12 mb-3 opacity-20" />
                    <p>Nenhuma movimentação registrada.</p>
                  </div>
                ) : (
                  itemMovements.map(m => {
                    const isEntrada = m.type === 'Entrada' || (m.type === 'Ajuste' && m.quantity > 0);
                    const isSaida = m.type === 'Saída' || (m.type === 'Ajuste' && m.quantity < 0);
                    
                    return (
                      <div key={m.id} className="p-4 rounded-xl hover:bg-muted/30 transition-colors flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                          isEntrada ? "bg-success/10 text-success border-success/20" : 
                          isSaida ? "bg-destructive/10 text-destructive border-destructive/20" :
                          "bg-primary/10 text-primary border-primary/20"
                        )}>
                          {m.type === 'Ajuste' ? <RefreshCw className="w-5 h-5" /> : 
                           isEntrada ? <ArrowUpRight className="w-5 h-5" /> : 
                           <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-sm">{m.type}</span>
                            <span className="text-[10px] text-muted-foreground">{formatDateTime(m.date)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {m.reason || "Sem observação"}
                          </p>
                        </div>

                        <div className={cn(
                          "font-bold text-right shrink-0",
                          isEntrada ? "text-success" : isSaida ? "text-destructive" : "text-primary"
                        )}>
                          {m.quantity > 0 ? '+' : ''}{m.quantity} {item.unit}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}