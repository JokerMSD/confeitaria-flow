import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useMockData } from "@/hooks/use-mock-data";
import { mockOrders, Order, OrderItem, OrderStatus, PaymentMethod } from "@/data/mock-data";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function PedidoForm() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isEditing = params?.id && params.id !== "novo";
  const { toast } = useToast();

  const [orders, setOrders] = useMockData<Order>("orders", mockOrders);
  
  // Encontrar pedido existente
  const existingOrder = useMemo(() => {
    return isEditing ? orders.find(o => o.id === params.id) : null;
  }, [isEditing, params.id, orders]);

  // Form state
  const [customerName, setCustomerName] = useState(existingOrder?.customerName || "");
  const [phone, setPhone] = useState(existingOrder?.phone || "");
  const [orderDate, setOrderDate] = useState(existingOrder?.orderDate || new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(existingOrder?.deliveryDate || "");
  const [deliveryTime, setDeliveryTime] = useState(existingOrder?.deliveryTime || "");
  const [status, setStatus] = useState<OrderStatus>(existingOrder?.status || "Novo");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(existingOrder?.paymentMethod || "Pix");
  const [paidAmount, setPaidAmount] = useState<string>(existingOrder?.paidAmount?.toString() || "0");
  const [notes, setNotes] = useState(existingOrder?.notes || "");
  const [items, setItems] = useState<OrderItem[]>(existingOrder?.items || []);

  const [newItemName, setNewItemName] = useState("");
  const [newItemQtd, setNewItemQtd] = useState("1");
  const [newItemPrice, setNewItemPrice] = useState("");

  // Calculations
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  
  const paymentStatus = useMemo(() => {
    const paid = parseFloat(paidAmount.replace(',', '.') || "0");
    if (paid <= 0) return "Pendente";
    if (paid >= totalAmount && totalAmount > 0) return "Pago";
    return "Parcial";
  }, [paidAmount, totalAmount]);

  const handleAddItem = () => {
    if (!newItemName || !newItemPrice || !newItemQtd) return;
    
    const price = parseFloat(newItemPrice.replace(',', '.'));
    const qty = parseInt(newItemQtd, 10);
    
    if (isNaN(price) || isNaN(qty) || qty <= 0) return;

    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: 'custom',
      productName: newItemName,
      quantity: qty,
      unitPrice: price,
      subtotal: price * qty
    };

    setItems([...items, newItem]);
    setNewItemName("");
    setNewItemQtd("1");
    setNewItemPrice("");
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSave = () => {
    if (!customerName || !deliveryDate || items.length === 0) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Nome do cliente, data de entrega e pelo menos um item são necessários.",
        variant: "destructive"
      });
      return;
    }

    const paid = parseFloat(paidAmount.replace(',', '.') || "0");
    const newOrder: Order = {
      id: existingOrder?.id || Math.random().toString(36).substr(2, 9),
      orderNumber: existingOrder?.orderNumber || `PED-${String(orders.length + 1).padStart(3, '0')}`,
      customerName,
      phone,
      orderDate,
      deliveryDate,
      deliveryTime,
      status,
      paymentMethod,
      paymentStatus,
      totalAmount,
      paidAmount: paid,
      notes,
      items
    };

    if (isEditing) {
      setOrders(orders.map(o => o.id === newOrder.id ? newOrder : o));
      toast({ title: "Pedido atualizado com sucesso!" });
    } else {
      setOrders([newOrder, ...orders]);
      toast({ title: "Pedido criado com sucesso!" });
    }
    
    setLocation("/pedidos");
  };

  return (
    <AppLayout title={isEditing ? "Editar Pedido" : "Novo Pedido"}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/pedidos")} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {isEditing ? `Editar Pedido ${existingOrder?.orderNumber}` : "Novo Pedido"}
              </h2>
            </div>
          </div>
          <Button onClick={handleSave} className="gap-2 rounded-xl">
            <Save className="w-4 h-4" />
            Salvar Pedido
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg border-b border-border pb-2">Dados do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Nome do Cliente *</Label>
                    <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex: Maria Silva" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 90000-0000" />
                  </div>
                </div>

                <h3 className="font-bold text-lg border-b border-border pb-2 mt-6">Prazos e Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryDate">Data de Entrega *</Label>
                    <Input id="deliveryDate" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryTime">Horário de Entrega</Label>
                    <Input id="deliveryTime" type="time" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status do Pedido</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={status} 
                      onChange={e => setStatus(e.target.value as OrderStatus)}
                    >
                      <option value="Novo">Novo</option>
                      <option value="Confirmado">Confirmado</option>
                      <option value="Em produção">Em produção</option>
                      <option value="Pronto">Pronto</option>
                      <option value="Entregue">Entregue</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orderDate">Data do Pedido</Label>
                    <Input id="orderDate" type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg border-b border-border pb-2">Itens do Pedido</h3>
                
                {/* Adicionar Item */}
                <div className="flex flex-col md:flex-row gap-3 items-end bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Produto</Label>
                    <Input placeholder="Ex: Bolo de Cenoura" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                  </div>
                  <div className="space-y-2 w-full md:w-24">
                    <Label>Qtd.</Label>
                    <Input type="number" min="1" value={newItemQtd} onChange={e => setNewItemQtd(e.target.value)} />
                  </div>
                  <div className="space-y-2 w-full md:w-32">
                    <Label>Preço Un.</Label>
                    <Input type="number" step="0.01" placeholder="0.00" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
                  </div>
                  <Button type="button" onClick={handleAddItem} variant="secondary" className="w-full md:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>

                {/* Lista de Itens */}
                {items.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                    Nenhum item adicionado ainda.
                  </div>
                ) : (
                  <div className="divide-y divide-border/50 border border-border rounded-xl overflow-hidden">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-card hover:bg-muted/30">
                        <div className="flex-1">
                          <p className="font-bold text-sm">{item.quantity}x {item.productName}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} un.</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => handleRemoveItem(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="p-4 bg-muted/30 flex justify-between items-center font-bold text-lg">
                      <span>Total dos Itens:</span>
                      <span className="text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg border-b border-border pb-2">Pagamento</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
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

                  <div className="space-y-2">
                    <Label>Valor Pago</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={paidAmount} 
                      onChange={e => setPaidAmount(e.target.value)} 
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total do Pedido:</span>
                      <span className="font-bold">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor Pago:</span>
                      <span className="font-bold text-success">{formatCurrency(parseFloat(paidAmount || "0"))}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-border/50 pt-2 mt-2">
                      <span className="text-muted-foreground">Falta Pagar:</span>
                      <span className="font-bold text-destructive">
                        {formatCurrency(Math.max(0, totalAmount - parseFloat(paidAmount || "0")))}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <span className="text-sm font-semibold">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      paymentStatus === 'Pago' ? 'bg-success/10 text-success border border-success/20' :
                      paymentStatus === 'Parcial' ? 'bg-warning/10 text-warning-foreground border border-warning/20' :
                      'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}>
                      {paymentStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg border-b border-border pb-2">Observações</h3>
                <textarea 
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Detalhes da decoração, restrições alimentares, etc."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}