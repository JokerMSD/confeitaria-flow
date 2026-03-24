import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useMockData } from "@/hooks/use-mock-data";
import { mockInventory } from "@/data/mock-data";
import { Search, Plus, AlertTriangle, PackageSearch, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Estoque() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [inventory, setInventory] = useMockData("inventory", mockInventory);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");

  const categories = ['todas', 'Produto Pronto', 'Ingrediente', 'Embalagem'];

  const handleDelete = (id: string, name: string) => {
    if(confirm(`Tem certeza que deseja excluir "${name}" do estoque?`)) {
      setInventory(inventory.filter(i => i.id !== id));
      toast({
        title: "Item excluído",
        description: "O item foi removido do estoque com sucesso."
      });
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "todas" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    // Alertas primeiro
    const aAlert = a.currentQuantity <= a.minQuantity;
    const bAlert = b.currentQuantity <= b.minQuantity;
    if (aAlert && !bAlert) return -1;
    if (!aAlert && bAlert) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <AppLayout title="Estoque">
      <div className="space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar item no estoque..." 
                className="pl-9 bg-card"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border",
                    categoryFilter === cat 
                      ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                      : "bg-card text-foreground border-border hover:bg-muted"
                  )}
                >
                  {cat === 'todas' ? 'Todas as Categorias' : cat}
                </button>
              ))}
            </div>
          </div>

          <Link href="/estoque/novo">
            <a className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-primary/90 transition-all shrink-0">
              <Plus className="w-5 h-5" />
              Novo Item
            </a>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Item</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 hidden sm:table-cell">Categoria</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Quantidade</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-right hidden md:table-cell">Mínimo</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Status</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <PackageSearch className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Nenhum item encontrado.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => {
                    const isLowStock = item.currentQuantity <= item.minQuantity;
                    
                    return (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => setLocation(`/estoque/${item.id}`)}>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <div className="font-bold text-foreground text-base">{item.name}</div>
                          <div className="text-xs text-muted-foreground sm:hidden mt-0.5">{item.category}</div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 hidden sm:table-cell text-muted-foreground">
                          <span className="bg-muted px-2 py-1 rounded text-xs font-medium border border-border">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                          <span className={cn(
                            "font-bold text-lg",
                            isLowStock ? "text-destructive" : "text-foreground"
                          )}>
                            {item.currentQuantity}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 text-right hidden md:table-cell text-muted-foreground">
                          {item.minQuantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                          {isLowStock ? (
                            <div className="inline-flex items-center gap-1.5 bg-destructive/10 text-destructive px-2.5 py-1 rounded-full text-xs font-bold border border-destructive/20">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Baixo</span>
                            </div>
                          ) : (
                            <span className="inline-flex bg-success/10 text-success px-2.5 py-1 rounded-full text-xs font-bold border border-success/20">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setLocation(`/estoque/${item.id}/editar`)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id, item.name)}>
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