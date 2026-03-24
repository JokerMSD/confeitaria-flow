import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useMockData } from "@/hooks/use-mock-data";
import { mockInventory, InventoryItem } from "@/data/mock-data";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function EstoqueForm() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  
  const isEditing = params?.id && params.id !== "novo";
  const { toast } = useToast();

  const [inventory, setInventory] = useMockData<InventoryItem>("inventory", mockInventory);
  
  const existingItem = useMemo(() => {
    return isEditing ? inventory.find(i => i.id === params.id) : null;
  }, [isEditing, params.id, inventory]);

  // Form state
  const [name, setName] = useState(existingItem?.name || "");
  const [category, setCategory] = useState<InventoryItem['category']>(existingItem?.category || "Ingrediente");
  const [currentQuantity, setCurrentQuantity] = useState(existingItem?.currentQuantity?.toString() || "");
  const [minQuantity, setMinQuantity] = useState(existingItem?.minQuantity?.toString() || "0");
  const [unit, setUnit] = useState<InventoryItem['unit']>(existingItem?.unit || "un");
  const [notes, setNotes] = useState(existingItem?.notes || "");

  const handleSave = () => {
    if (!name || currentQuantity === "") {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Nome do item e quantidade atual são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const newItem: InventoryItem = {
      id: existingItem?.id || Math.random().toString(36).substr(2, 9),
      name,
      category,
      currentQuantity: parseFloat(currentQuantity.replace(',', '.')),
      minQuantity: parseFloat(minQuantity.replace(',', '.')),
      unit,
      notes
    };

    if (isEditing) {
      setInventory(inventory.map(i => i.id === newItem.id ? newItem : i));
      toast({ title: "Item atualizado com sucesso!" });
    } else {
      setInventory([newItem, ...inventory]);
      toast({ title: "Item cadastrado com sucesso!" });
    }
    
    setLocation("/estoque");
  };

  return (
    <AppLayout title={isEditing ? "Editar Item" : "Novo Item de Estoque"}>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/estoque")} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {isEditing ? "Editar Item" : "Novo Item"}
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
              {/* Nome */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nome do Item *</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Ex: Leite Condensado Moça, Caixa Kraft 20x20..."
                  className="text-lg py-6"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select 
                  className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={category} 
                  onChange={e => setCategory(e.target.value as any)}
                >
                  <option value="Produto Pronto">Produto Pronto (Trufas, Bolos...)</option>
                  <option value="Ingrediente">Ingrediente (Farinha, Chocolate...)</option>
                  <option value="Embalagem">Embalagem (Caixas, Fitas...)</option>
                </select>
              </div>

              {/* Unidade de Medida */}
              <div className="space-y-2">
                <Label>Unidade de Medida</Label>
                <select 
                  className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={unit} 
                  onChange={e => setUnit(e.target.value as any)}
                >
                  <option value="un">Unidade (un)</option>
                  <option value="kg">Quilograma (kg)</option>
                  <option value="g">Grama (g)</option>
                  <option value="l">Litro (l)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="caixa">Caixa</option>
                </select>
              </div>

              {/* Quantidade Atual */}
              <div className="space-y-2">
                <Label htmlFor="currentQuantity">Quantidade Atual *</Label>
                <Input 
                  id="currentQuantity" 
                  type="number" 
                  step="0.01" 
                  value={currentQuantity} 
                  onChange={e => setCurrentQuantity(e.target.value)} 
                  placeholder="0"
                  className="text-xl font-bold font-display"
                />
              </div>

              {/* Estoque Mínimo */}
              <div className="space-y-2">
                <Label htmlFor="minQuantity">Estoque Mínimo (Alerta)</Label>
                <Input 
                  id="minQuantity" 
                  type="number" 
                  step="0.01" 
                  value={minQuantity} 
                  onChange={e => setMinQuantity(e.target.value)} 
                  placeholder="0"
                  className="text-xl font-bold font-display text-warning"
                />
                <p className="text-xs text-muted-foreground mt-1">Avisaremos quando chegar neste valor.</p>
              </div>

              {/* Observações */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Observações Opcionais</Label>
                <textarea 
                  id="notes"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Fornecedor favorito, marca de preferência, validade média..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}