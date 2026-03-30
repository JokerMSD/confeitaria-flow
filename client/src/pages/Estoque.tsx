import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import type { ListInventoryItemsFilters } from "@shared/types";
import {
  AlertTriangle,
  Calculator,
  Edit,
  PackageSearch,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { ApiError } from "@/api/http-client";
import { useInventoryItems } from "@/features/inventory/hooks/use-inventory-items";
import { useInventoryPurchasePlan } from "@/features/inventory/hooks/use-inventory-purchase-plan";
import { useDeleteInventoryItem } from "@/features/inventory/hooks/use-delete-inventory-item";
import { adaptInventoryItemsToList } from "@/features/inventory/lib/inventory-list-adapter";
import { adaptInventoryPurchasePlan } from "@/features/inventory/lib/inventory-purchase-plan-adapter";

export default function Estoque() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");

  const categories = ["todas", "Produto Pronto", "Ingrediente", "Embalagem"];

  const filters = useMemo<ListInventoryItemsFilters>(
    () => ({
      search: searchTerm.trim() || undefined,
      category:
        categoryFilter === "Produto Pronto"
          ? "ProdutoPronto"
          : categoryFilter === "Ingrediente"
            ? "Ingrediente"
            : categoryFilter === "Embalagem"
              ? "Embalagem"
              : undefined,
    }),
    [categoryFilter, searchTerm],
  );

  const inventoryQuery = useInventoryItems(filters);
  const purchasePlanQuery = useInventoryPurchasePlan();
  const deleteInventoryMutation = useDeleteInventoryItem();

  const inventory = useMemo(
    () => adaptInventoryItemsToList(inventoryQuery.data?.data ?? []),
    [inventoryQuery.data],
  );

  const filteredInventory = useMemo(
    () =>
      inventory.slice().sort((a, b) => {
        if (a.isLowStock && !b.isLowStock) return -1;
        if (!a.isLowStock && b.isLowStock) return 1;
        return a.name.localeCompare(b.name);
      }),
    [inventory],
  );
  const purchasePlan = useMemo(
    () =>
      purchasePlanQuery.data?.data
        ? adaptInventoryPurchasePlan(purchasePlanQuery.data.data)
        : null,
    [purchasePlanQuery.data],
  );

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${name}" do estoque?`)) {
      return;
    }

    try {
      await deleteInventoryMutation.mutateAsync(id);
      toast({
        title: "Item excluído",
        description: "O item foi removido do estoque com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir item",
        description:
          error instanceof ApiError
            ? error.message
            : "Não foi possível excluir o item do estoque.",
        variant: "destructive",
      });
    }
  };

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
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border",
                    categoryFilter === category
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-foreground border-border hover:bg-muted",
                  )}
                >
                  {category === "todas" ? "Todas as Categorias" : category}
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
          <div className="border-b border-border/50 p-5 sm:p-6 bg-muted/20">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Necessidade de Compra
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Calculado pelos pedidos ainda em producao: novo, confirmado e em producao.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-1.5 rounded-full border bg-background">
                    Pedidos: {purchasePlanQuery.isLoading ? "..." : purchasePlan?.pendingOrderCount ?? 0}
                  </span>
                  <span className="px-3 py-1.5 rounded-full border bg-background">
                    Itens faltando: {purchasePlanQuery.isLoading ? "..." : purchasePlan?.shortageItemCount ?? 0}
                  </span>
                  <span className="px-3 py-1.5 rounded-full border bg-background font-semibold">
                    Gasto estimado: {purchasePlanQuery.isLoading ? "..." : formatCurrency(purchasePlan?.estimatedPurchaseCost ?? 0)}
                  </span>
                </div>
              </div>

              {purchasePlanQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">
                  Calculando necessidade de compra...
                </div>
              ) : purchasePlanQuery.isError ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Nao foi possivel calcular a necessidade de compra.
                  </p>
                  <Button variant="outline" onClick={() => purchasePlanQuery.refetch()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : !purchasePlan || purchasePlan.items.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Nenhuma compra necessaria para os pedidos ainda nao finalizados.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {purchasePlan.items.map((planItem) => (
                    <div
                      key={planItem.itemId}
                      className="rounded-xl border border-border bg-background p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{planItem.itemName}</p>
                          <p className="text-xs text-muted-foreground">
                            Estoque atual: {planItem.currentQuantity} {planItem.itemUnit} • Necessario: {planItem.requiredQuantity} {planItem.itemUnit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-destructive">
                            Comprar {planItem.suggestedPurchaseQuantity} {planItem.itemUnit}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Falta: {planItem.deficitQuantity} {planItem.itemUnit}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calculator className="w-4 h-4" />
                          Gasto estimado
                        </span>
                        <span className="font-semibold">
                          {planItem.estimatedPurchaseCost == null
                            ? "Sem custo cadastrado"
                            : formatCurrency(planItem.estimatedPurchaseCost)}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Usado em {planItem.sourceCount} item(ns) de pedido.</p>
                        <p className="line-clamp-2">
                          {planItem.sources
                            .slice(0, 3)
                            .map((source) => `${source.orderNumber} • ${source.productName}`)
                            .join(" | ")}
                          {planItem.sources.length > 3 ? " | ..." : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {purchasePlan?.hasItemsWithoutCost && (
                <p className="text-xs text-amber-700">
                  Alguns ingredientes sem custo cadastrado ficaram fora do gasto estimado.
                </p>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Item</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 hidden sm:table-cell">
                    Categoria
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                    Quantidade
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-right hidden md:table-cell">
                    Mínimo
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Status</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {inventoryQuery.isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      Carregando itens do estoque...
                    </td>
                  </tr>
                ) : inventoryQuery.isError ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-muted-foreground space-y-3"
                    >
                      <p>Não foi possível carregar o estoque.</p>
                      <Button variant="outline" onClick={() => inventoryQuery.refetch()}>
                        Tentar novamente
                      </Button>
                    </td>
                  </tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      <PackageSearch className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Nenhum item encontrado.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => setLocation(`/estoque/${item.id}`)}
                    >
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="font-bold text-foreground text-base">
                          {item.name}
                        </div>
                        <div className="text-xs text-muted-foreground sm:hidden mt-0.5">
                          {item.category}
                        </div>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 hidden sm:table-cell text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded text-xs font-medium border border-border">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                        <span
                          className={cn(
                            "font-bold text-lg",
                            item.isLowStock ? "text-destructive" : "text-foreground",
                          )}
                        >
                          {item.currentQuantity}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-right hidden md:table-cell text-muted-foreground">
                        {item.minQuantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                        {item.isLowStock ? (
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
                      <td
                        className="px-4 py-3 sm:px-6 sm:py-4 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => setLocation(`/estoque/${item.id}/editar`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(item.id, item.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
