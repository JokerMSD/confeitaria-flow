import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import type { ListInventoryItemsFilters } from "@shared/types";
import {
  AlertTriangle,
  Edit,
  Minus,
  PackageSearch,
  Plus,
  ReceiptText,
  Search,
  Trash2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ApiError } from "@/api/http-client";
import { useInventoryItems } from "@/features/inventory/hooks/use-inventory-items";
import { useDeleteInventoryItem } from "@/features/inventory/hooks/use-delete-inventory-item";
import { useCreateInventoryMovement } from "@/features/inventory/hooks/use-create-inventory-movement";
import { adaptInventoryItemsToList } from "@/features/inventory/lib/inventory-list-adapter";
import { formatInventoryQuantity } from "@/features/inventory/lib/inventory-quantity-display";
import { getQuantityStep } from "@/features/inventory/lib/inventory-input-helpers";

export default function Estoque() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [quickQuantities, setQuickQuantities] = useState<Record<string, string>>(
    {},
  );
  const [pendingQuickItemId, setPendingQuickItemId] = useState<string | null>(
    null,
  );

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
  const deleteInventoryMutation = useDeleteInventoryItem();
  const createInventoryMovementMutation = useCreateInventoryMovement();

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

  const getQuickQuantityValue = (itemId: string) => quickQuantities[itemId] ?? "";

  const parseQuickQuantity = (itemId: string) => {
    const rawValue = getQuickQuantityValue(itemId).replace(",", ".").trim();

    if (!rawValue) {
      return 1;
    }

    const parsedValue = Number.parseFloat(rawValue);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return null;
    }

    return parsedValue;
  };

  const formatQuantity = (
    value: number,
    unit: Parameters<typeof formatInventoryQuantity>[1],
    recipeEquivalentQuantity?: number | null,
    recipeEquivalentUnit?: Parameters<typeof formatInventoryQuantity>[3],
  ) =>
    formatInventoryQuantity(
      value,
      unit,
      recipeEquivalentQuantity,
      recipeEquivalentUnit,
    );

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${name}" do estoque?`)) {
      return;
    }

    try {
      await deleteInventoryMutation.mutateAsync(id);
      toast({
        title: "Item excluido",
        description: "O item foi removido do estoque com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir item",
        description:
          error instanceof ApiError
            ? error.message
            : "Nao foi possivel excluir o item do estoque.",
        variant: "destructive",
      });
    }
  };

  const handleQuickQuantityChange = async (
    itemId: string,
    itemName: string,
    type: "Entrada" | "Saida",
  ) => {
    const quantity = parseQuickQuantity(itemId);

    if (quantity == null) {
      toast({
        title: "Quantidade invalida",
        description: "Informe uma quantidade maior que zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      setPendingQuickItemId(itemId);

      await createInventoryMovementMutation.mutateAsync({
        data: {
          itemId,
          type,
          quantity,
          reason:
            type === "Entrada"
              ? "Ajuste rapido no estoque"
              : "Baixa rapida no estoque",
          reference: "Tela de estoque",
        },
      });

      toast({
        title: "Estoque atualizado",
        description: `${itemName} ${type === "Entrada" ? "aumentado" : "reduzido"} em ${quantity} ${filteredInventory.find((item) => item.id === itemId)?.unit ?? ""}.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar estoque",
        description:
          error instanceof ApiError
            ? error.message
            : "Nao foi possivel atualizar o estoque rapidamente.",
        variant: "destructive",
      });
    } finally {
      setPendingQuickItemId(null);
    }
  };

  return (
    <AppLayout title="Estoque">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar item no estoque..."
                className="bg-card pl-9"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="scrollbar-hide no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 sm:pb-0">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    categoryFilter === category
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {category === "todas" ? "Todas as Categorias" : category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 gap-3">
            <Link href="/estoque/importar-nota">
              <a className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 font-medium text-foreground shadow-sm transition-all hover:bg-muted">
                <ReceiptText className="h-5 w-5" />
                Importar nota
              </a>
            </Link>
            <Link href="/estoque/novo">
              <a className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md">
                <Plus className="h-5 w-5" />
                Novo Item
              </a>
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Item</th>
                  <th className="hidden px-4 py-3 sm:table-cell sm:px-6 sm:py-4">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-right sm:px-6 sm:py-4">Quantidade</th>
                  <th className="hidden px-4 py-3 text-right md:table-cell sm:px-6 sm:py-4">
                    Minimo
                  </th>
                  <th className="px-4 py-3 text-right sm:px-6 sm:py-4">Status</th>
                  <th className="px-4 py-3 text-right sm:px-6 sm:py-4">Acoes</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/50">
                {inventoryQuery.isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      Carregando itens do estoque...
                    </td>
                  </tr>
                ) : inventoryQuery.isError ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="space-y-3 px-6 py-12 text-center text-muted-foreground"
                    >
                      <p>Nao foi possivel carregar o estoque.</p>
                      <Button variant="outline" onClick={() => inventoryQuery.refetch()}>
                        Tentar novamente
                      </Button>
                    </td>
                  </tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <PackageSearch className="mx-auto mb-3 h-12 w-12 opacity-20" />
                      <p>Nenhum item encontrado.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const current = formatQuantity(
                      item.currentQuantity,
                      item.unit,
                      item.recipeEquivalentQuantity,
                      item.recipeEquivalentUnit,
                    );
                    const minimum = formatQuantity(
                      item.minQuantity,
                      item.unit,
                      item.recipeEquivalentQuantity,
                      item.recipeEquivalentUnit,
                    );

                    return (
                      <tr
                        key={item.id}
                        className="group cursor-pointer transition-colors hover:bg-muted/30"
                        onClick={() => setLocation(`/estoque/${item.id}`)}
                      >
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <div className="text-base font-bold text-foreground">
                            {item.name}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                            {item.category}
                          </div>
                        </td>

                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell sm:px-6 sm:py-4">
                          <span className="rounded border border-border bg-muted px-2 py-1 text-xs font-medium">
                            {item.category}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right sm:px-6 sm:py-4">
                          <div className="space-y-0.5">
                            <div>
                              <span
                                className={cn(
                                  "text-lg font-bold",
                                  item.isLowStock ? "text-destructive" : "text-foreground",
                                )}
                              >
                                {current.value}
                              </span>
                              <span className="ml-1 text-xs text-muted-foreground">
                                {current.unit}
                              </span>
                            </div>
                            {current.detail ? (
                              <div className="text-[11px] text-muted-foreground">
                                {current.detail}
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="hidden px-4 py-3 text-right text-muted-foreground md:table-cell sm:px-6 sm:py-4">
                          <div className="space-y-0.5">
                            <div>{minimum.inlineLabel}</div>
                            {minimum.detail ? (
                              <div className="text-[11px] text-muted-foreground">
                                {minimum.detail}
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right sm:px-6 sm:py-4">
                          {item.isLowStock ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Baixo</span>
                            </div>
                          ) : (
                            <span className="inline-flex rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                              Normal
                            </span>
                          )}
                        </td>

                        <td
                          className="px-4 py-3 text-right sm:px-6 sm:py-4"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                            <Input
                              type="number"
                              min="0.001"
                              step={getQuantityStep(item.unit)}
                              inputMode="decimal"
                              value={getQuickQuantityValue(item.id)}
                              placeholder="1"
                              className="h-8 w-16 text-right text-xs"
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                setQuickQuantities((currentState) => ({
                                  ...currentState,
                                  [item.id]: event.target.value,
                                }))
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              disabled={
                                pendingQuickItemId === item.id || item.currentQuantity <= 0
                              }
                              onClick={() =>
                                handleQuickQuantityChange(item.id, item.name, "Saida")
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              disabled={pendingQuickItemId === item.id}
                              onClick={() =>
                                handleQuickQuantityChange(item.id, item.name, "Entrada")
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => setLocation(`/estoque/${item.id}/editar`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(item.id, item.name)}
                            >
                              <Trash2 className="h-4 w-4" />
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
