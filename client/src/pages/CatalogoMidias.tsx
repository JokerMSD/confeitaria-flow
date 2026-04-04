import { ChangeEvent, useMemo, useState } from "react";
import { ImagePlus, Loader2, Search, Sparkles, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

  const items = catalogMediaQuery.data?.data ?? [];
  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        item.recipeName.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [items, search],
  );

  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    recipeId: string,
    recipeName: string,
    variationRecipeId?: string | null,
    variationName?: string,
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const uploadTarget = variationRecipeId
      ? `${recipeId}:${variationRecipeId}`
      : recipeId;

    try {
      setPendingTarget(uploadTarget);

      for (const file of files) {
        const contentBase64 = await fileToBase64(file);
        await uploadRecipeMediaMutation.mutateAsync({
          data: {
            recipeId,
            variationRecipeId: variationRecipeId ?? null,
            fileName: file.name,
            mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
            contentBase64,
            altText: variationName ? `${recipeName} - ${variationName}` : recipeName,
          },
        });
      }

      toast({
        title: "Fotos atualizadas",
        description: variationName
          ? `A foto de ${variationName} foi atualizada em ${recipeName}.`
          : `${files.length} imagem(ns) enviada(s) para ${recipeName}.`,
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
      setPendingTarget(null);
    }
  };

  const handleDelete = async (mediaId: string) => {
    try {
      await deleteRecipeMediaMutation.mutateAsync(mediaId);
      toast({
        title: "Foto removida",
        description: "A imagem foi removida com sucesso.",
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Midias do catalogo</h2>
            <p className="text-muted-foreground">
              Gerencie a galeria padrao do produto e, se quiser, uma foto especifica
              para cada sabor. A loja publica passa a trocar a imagem conforme a
              variacao escolhida.
            </p>
          </div>
          <Link href="/catalogo">
            <a>
              <Button variant="outline">Voltar ao catalogo</Button>
            </a>
          </Link>
        </div>

        <div className="brand-shell p-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar produto para editar galeria e fotos por sabor..."
              className="pl-9"
            />
          </div>
        </div>

        {catalogMediaQuery.isLoading ? (
          <Card className="glass-card">
            <CardContent className="flex items-center justify-center gap-3 p-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando midias do catalogo...
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {filteredItems.map((item) => (
              <Card key={item.recipeId} className="glass-card overflow-hidden">
                <CardContent className="space-y-6 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full bg-primary/12 px-3 py-1 text-primary hover:bg-primary/12">
                          Produto
                        </Badge>
                        <Badge variant="outline" className="rounded-full border-border/70 bg-background/70">
                          {item.media.length}/{item.maxPhotos} foto(s) padrao
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-xl font-bold text-foreground">{item.recipeName}</h3>
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        Use a galeria padrao para a vitrine do produto. Se quiser deixar a experiencia
                        mais rica, envie tambem uma foto opcional para cada sabor relevante.
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                      {pendingTarget === item.recipeId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      Adicionar foto ao produto
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(event) => void handleUpload(event, item.recipeId, item.recipeName)}
                      />
                    </label>
                  </div>

                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.24em]">
                        Galeria padrao do produto
                      </p>
                    </div>

                    {item.media.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-5 py-8 text-center text-sm text-muted-foreground">
                        Nenhuma foto padrao cadastrada para este produto.
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                  </section>

                  <section className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                        Fotos por sabor
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Opcional. Quando um sabor tiver foto propria, a loja publica usa essa
                        imagem ao seleciona-lo. Sem foto propria, a tela continua usando a galeria
                        do produto ou a foto global herdada do sabor.
                      </p>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-2">
                      {item.variations.map((variation) => {
                        const variationTarget = `${item.recipeId}:${variation.variationRecipeId}`;
                        const specificMedia = variation.media[0] ?? null;
                        const previewMedia = specificMedia ?? variation.fallbackMedia;

                        return (
                          <div
                            key={variation.variationRecipeId}
                            className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-semibold text-foreground">
                                  {variation.variationName}
                                </h4>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {specificMedia ? (
                                    <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">
                                      Foto propria
                                    </Badge>
                                  ) : variation.fallbackMedia ? (
                                    <Badge variant="outline" className="rounded-full border-border/70 bg-background/70">
                                      Herdando foto global
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="rounded-full border-border/70 bg-background/70">
                                      Sem foto
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">
                                {pendingTarget === variationTarget ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ImagePlus className="h-4 w-4" />
                                )}
                                {specificMedia ? "Trocar" : "Enviar"}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  onChange={(event) =>
                                    void handleUpload(
                                      event,
                                      item.recipeId,
                                      item.recipeName,
                                      variation.variationRecipeId,
                                      variation.variationName,
                                    )
                                  }
                                />
                              </label>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-[108px_1fr] sm:items-center">
                              <div className="aspect-square overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
                                {previewMedia ? (
                                  <img
                                    src={resolveMediaUrl(previewMedia.fileUrl)}
                                    alt={previewMedia.altText ?? variation.variationName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
                                    Sem imagem
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  {specificMedia
                                    ? "Esta foto substitui a imagem padrao quando o cliente selecionar este sabor."
                                    : variation.fallbackMedia
                                      ? "Sem foto especifica neste produto. A loja pode herdar a foto global do sabor."
                                      : "Sem foto especifica nem herdada para este sabor."}
                                </p>
                                {specificMedia ? (
                                  <Button
                                    variant="ghost"
                                    className="h-auto justify-start px-0 text-destructive hover:bg-transparent hover:text-destructive"
                                    onClick={() => void handleDelete(specificMedia.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remover foto deste sabor
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
