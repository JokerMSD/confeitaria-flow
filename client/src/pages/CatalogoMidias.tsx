import { ChangeEvent, useMemo, useState } from "react";
import { ImagePlus, Loader2, Search, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/http-client";
import {
  useCatalogMediaAdmin,
  useDeleteRecipeMedia,
  useUploadRecipeMedia,
} from "@/features/recipes/hooks/use-catalog-media-admin";
import { resolveMediaUrl } from "@/lib/resolve-media-url";

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Nao foi possivel ler a imagem selecionada."));
        return;
      }

      const [, contentBase64 = ""] = result.split(",", 2);
      resolve(contentBase64);
    };
    reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem selecionada."));
    reader.readAsDataURL(file);
  });
}

export default function CatalogoMidias() {
  const { toast } = useToast();
  const catalogMediaQuery = useCatalogMediaAdmin();
  const uploadRecipeMediaMutation = useUploadRecipeMedia();
  const deleteRecipeMediaMutation = useDeleteRecipeMedia();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"ProdutoVenda" | "Preparacao">("ProdutoVenda");
  const [pendingRecipeId, setPendingRecipeId] = useState<string | null>(null);

  const items = catalogMediaQuery.data?.data ?? [];
  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.recipeKind === tab &&
          item.recipeName.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [items, search, tab],
  );

  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    recipeId: string,
    recipeName: string,
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    try {
      setPendingRecipeId(recipeId);

      for (const file of files) {
        const contentBase64 = await fileToBase64(file);
        await uploadRecipeMediaMutation.mutateAsync({
          data: {
            recipeId,
            fileName: file.name,
            mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
            contentBase64,
            altText: recipeName,
          },
        });
      }

      toast({
        title: "Fotos atualizadas",
        description: `${files.length} imagem(ns) enviada(s) para ${recipeName}.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar imagem",
        description:
          error instanceof ApiError
            ? error.message
            : "Nao foi possivel enviar a imagem do produto.",
        variant: "destructive",
      });
    } finally {
      setPendingRecipeId(null);
    }
  };

  const handleDelete = async (mediaId: string) => {
    try {
      await deleteRecipeMediaMutation.mutateAsync(mediaId);
      toast({
        title: "Foto removida",
        description: "A imagem foi removida da galeria.",
      });
    } catch (error) {
      toast({
        title: "Erro ao remover foto",
        description:
          error instanceof ApiError ? error.message : "Nao foi possivel remover a imagem.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title="Midias do catalogo">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Mídias do catálogo</h2>
            <p className="text-muted-foreground">
              Adicione fotos em lote para produtos e uma imagem opcional para cada recheio.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/catalogo">
              <a>
                <Button variant="outline">Voltar ao catálogo</Button>
              </a>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
            <TabsList className="rounded-full">
              <TabsTrigger value="ProdutoVenda">Produtos</TabsTrigger>
              <TabsTrigger value="Preparacao">Recheios</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tab === "ProdutoVenda" ? "Buscar produto..." : "Buscar recheio..."}
              className="pl-9"
            />
          </div>
        </div>

        {catalogMediaQuery.isLoading ? (
          <Card className="glass-card">
            <CardContent className="flex items-center justify-center gap-3 p-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando mídias do catálogo...
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredItems.map((item) => (
              <Card key={item.recipeId} className="glass-card overflow-hidden">
                <CardContent className="space-y-5 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                        {item.recipeKind === "ProdutoVenda" ? "Produto" : "Recheio"}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-foreground">
                        {item.recipeName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.recipeKind === "ProdutoVenda"
                          ? `${item.media.length}/${item.maxPhotos} fotos da galeria`
                          : item.media.length > 0
                            ? "1 foto configurada"
                            : "Sem foto configurada"}
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                      {pendingRecipeId === item.recipeId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      Enviar foto
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple={item.recipeKind === "ProdutoVenda"}
                        className="hidden"
                        onChange={(event) =>
                          void handleUpload(event, item.recipeId, item.recipeName)
                        }
                      />
                    </label>
                  </div>

                  {item.media.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-5 py-8 text-center text-sm text-muted-foreground">
                      {item.recipeKind === "ProdutoVenda"
                        ? "Nenhuma foto cadastrada para este produto."
                        : "Este recheio ainda nao tem foto. A foto e opcional."}
                    </div>
                  ) : (
                    <div
                      className={
                        item.recipeKind === "ProdutoVenda"
                          ? "grid gap-3 sm:grid-cols-2"
                          : "grid gap-3"
                      }
                    >
                      {item.media.map((media) => (
                        <div
                          key={media.id}
                          className="overflow-hidden rounded-2xl border border-border bg-background"
                        >
                          <div className="aspect-[4/3] overflow-hidden bg-muted/20">
                            <img
                              src={resolveMediaUrl(media.fileUrl)}
                              alt={media.altText ?? item.recipeName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-3 p-3">
                            <p className="min-w-0 truncate text-xs text-muted-foreground">
                              {media.altText ?? item.recipeName}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => void handleDelete(media.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
