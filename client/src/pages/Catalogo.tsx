import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  MoreVertical,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/http-client";
import { formatCurrency } from "@/lib/utils";
import { useRecipes } from "@/features/recipes/hooks/use-recipes";
import { useDeleteRecipe } from "@/features/recipes/hooks/use-delete-recipe";
import { adaptRecipesToCards } from "@/features/recipes/lib/recipe-list-adapter";

export default function Catalogo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const recipesQuery = useRecipes({
    search: searchTerm || undefined,
    kind: "ProdutoVenda",
  });
  const deleteRecipeMutation = useDeleteRecipe();

  const recipes = useMemo(
    () => adaptRecipesToCards(recipesQuery.data?.data ?? []),
    [recipesQuery.data],
  );

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!window.confirm("Deseja excluir este produto do catalogo?")) {
      return;
    }

    deleteRecipeMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Produto excluido",
          description: "O produto foi removido do catalogo com sucesso.",
        });
      },
      onError: (error) => {
        toast({
          title: "Erro ao excluir produto",
          description:
            error instanceof ApiError
              ? error.message
              : "Nao foi possivel excluir o produto.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <AppLayout title="Catalogo">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                Catalogo
              </h2>
              <p className="text-muted-foreground">
                Cadastre os produtos vendidos e seus precos sugeridos.
              </p>
            </div>
            <Link href="/catalogo/novo">
              <a className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-primary/90 transition-all shrink-0">
                <Plus className="w-5 h-5" />
                Novo Produto
              </a>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 bg-card p-4 rounded-xl border border-border/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-9"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recipesQuery.isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card/50 rounded-2xl border border-dashed border-border">
              Carregando catalogo...
            </div>
          ) : recipesQuery.isError ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card/50 rounded-2xl border border-dashed border-border">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nao foi possivel carregar o catalogo.</p>
              <Button
                variant="link"
                onClick={() => recipesQuery.refetch()}
                className="mt-2 text-primary"
              >
                Tentar novamente
              </Button>
            </div>
          ) : recipes.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card/50 rounded-2xl border border-dashed border-border">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum produto cadastrado.</p>
            </div>
          ) : (
            recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="glass-card overflow-hidden hover:border-primary/30 transition-all group cursor-pointer hover:-translate-y-1"
                onClick={() => setLocation(`/catalogo/${recipe.id}`)}
              >
                <div className="p-5 flex flex-col gap-4 h-full">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-muted text-muted-foreground">
                          PRODUTO
                        </span>
                      </div>
                      <h3 className="font-bold text-lg leading-tight line-clamp-2">
                        {recipe.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Rendimento: {recipe.outputLabel}
                      </p>
                    </div>

                    <div onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted focus:outline-none">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => setLocation(`/catalogo/${recipe.id}`)}
                          >
                            Editar Produto
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            onClick={(event) => handleDelete(recipe.id, event as any)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Custo total
                      </p>
                      <p className="mt-1 font-bold">
                        {formatCurrency(recipe.totalCost)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Preco ideal
                      </p>
                      <p className="mt-1 font-bold">
                        {recipe.suggestedSalePrice == null
                          ? "-"
                          : formatCurrency(recipe.suggestedSalePrice)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{recipe.unitCostLabel}</p>
                    <p>{recipe.componentCount} componentes</p>
                    <p>Markup: {recipe.markupPercent}%</p>
                    {recipe.notes && <p className="line-clamp-3">{recipe.notes}</p>}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
