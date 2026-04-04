import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, ReceiptText, ScanText, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/http-client";
import { useInventoryItems } from "@/features/inventory/hooks/use-inventory-items";
import { useAnalyzeInventoryReceipt } from "@/features/inventory/hooks/use-analyze-inventory-receipt";
import { useConfirmInventoryReceiptImport } from "@/features/inventory/hooks/use-confirm-inventory-receipt-import";
import { formatMoneyInput, parseDecimalInput, parseMoneyInputToCents } from "@/features/inventory/lib/inventory-input-helpers";
import { adaptInventoryItemsToList } from "@/features/inventory/lib/inventory-list-adapter";
import { cn, formatCurrency } from "@/lib/utils";

interface ReceiptLineState {
  lineId: string;
  rawText: string;
  normalizedDescription: string;
  enabled: boolean;
  itemId: string;
  quantity: string;
  totalAmount: string;
  score: number | null;
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Nao foi possivel ler o arquivo."));
        return;
      }

      const [, base64 = ""] = result.split(",", 2);
      resolve(base64);
    };
    reader.onerror = () => {
      reject(new Error("Nao foi possivel ler o arquivo."));
    };
    reader.readAsDataURL(file);
  });
}

export default function EstoqueImportacaoNota() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const inventoryItemsQuery = useInventoryItems();
  const analyzeReceiptMutation = useAnalyzeInventoryReceipt();
  const confirmReceiptImportMutation = useConfirmInventoryReceiptImport();

  const inventoryItems = useMemo(
    () => adaptInventoryItemsToList(inventoryItemsQuery.data?.data ?? []),
    [inventoryItemsQuery.data],
  );

  const inventoryItemOptions = useMemo(
    () =>
      inventoryItems.map((item) => ({
        id: item.id,
        label: `${item.name} (${item.unit})`,
      })),
    [inventoryItems],
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileBase64, setSelectedFileBase64] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [registerCashExpense, setRegisterCashExpense] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "Pix" | "Dinheiro" | "CartaoCredito" | "CartaoDebito" | "Transferencia"
  >("Pix");
  const [extractedText, setExtractedText] = useState("");
  const [receiptLines, setReceiptLines] = useState<ReceiptLineState[]>([]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setExtractedText("");
    setReceiptLines([]);

    if (!file) {
      setSelectedFileBase64(null);
      return;
    }

    try {
      const contentBase64 = await readFileAsBase64(file);
      setSelectedFileBase64(contentBase64);
      if (!reference.trim()) {
        setReference(`Nota ${file.name}`);
      }
    } catch (error) {
      setSelectedFileBase64(null);
      toast({
        title: "Erro ao carregar arquivo",
        description:
          error instanceof Error ? error.message : "Nao foi possivel carregar a imagem.",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !selectedFileBase64) {
      toast({
        title: "Selecione uma imagem",
        description: "Escolha a foto da notinha antes de analisar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await analyzeReceiptMutation.mutateAsync({
        data: {
          fileName: selectedFile.name,
          mimeType: selectedFile.type as "image/jpeg" | "image/png" | "image/webp",
          contentBase64: selectedFileBase64,
        },
      });

      setExtractedText(response.data.extractedText);
      setReceiptLines(
        response.data.lines.map((line) => ({
          lineId: line.lineId,
          rawText: line.rawText,
          normalizedDescription: line.normalizedDescription,
          enabled: Boolean(line.suggestedItemId),
          itemId: line.suggestedItemId ?? "",
          quantity: String(line.quantity),
          totalAmount:
            line.totalAmountCents == null
              ? ""
              : (line.totalAmountCents / 100).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
          score:
            line.matches.find((match) => match.itemId === line.suggestedItemId)?.score ??
            line.matches[0]?.score ??
            null,
        })),
      );

      toast({
        title: "Nota analisada",
        description: `${response.data.lines.length} linha(s) sugeridas para conferência.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao analisar nota",
        description:
          error instanceof ApiError
            ? error.message
            : "Nao foi possivel analisar a imagem da nota.",
        variant: "destructive",
      });
    }
  };

  const updateLine = (lineId: string, partial: Partial<ReceiptLineState>) => {
    setReceiptLines((current) =>
      current.map((line) => (line.lineId === lineId ? { ...line, ...partial } : line)),
    );
  };

  const includedLines = receiptLines.filter((line) => line.enabled && line.itemId);

  const estimatedImportedTotal = includedLines.reduce((sum, line) => {
    const amount = parseMoneyInputToCents(line.totalAmount);
    return sum + (amount ?? 0);
  }, 0);

  const handleConfirmImport = async () => {
    if (!selectedFile) {
      toast({
        title: "Selecione uma imagem",
        description: "A nota precisa continuar selecionada para confirmar a importacao.",
        variant: "destructive",
      });
      return;
    }

    if (includedLines.length === 0) {
      toast({
        title: "Nada para importar",
        description: "Selecione pelo menos uma linha vinculada a um item do estoque.",
        variant: "destructive",
      });
      return;
    }

    const invalidLine = includedLines.find((line) => parseDecimalInput(line.quantity) <= 0);
    if (invalidLine) {
      toast({
        title: "Quantidade invalida",
        description: "Todas as linhas selecionadas precisam ter quantidade maior que zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await confirmReceiptImportMutation.mutateAsync({
        data: {
          fileName: selectedFile.name,
          reference: reference.trim() || null,
          registerCashExpense,
          paymentMethod: registerCashExpense ? paymentMethod : null,
          lines: includedLines.map((line) => ({
            lineId: line.lineId,
            itemId: line.itemId,
            quantity: parseDecimalInput(line.quantity),
            totalAmountCents: parseMoneyInputToCents(line.totalAmount),
            rawText: line.rawText,
          })),
        },
      });

      toast({
        title: "Nota importada",
        description: `${response.data.importedCount} entrada(s) de estoque registradas.`,
      });

      setLocation("/estoque");
    } catch (error) {
      toast({
        title: "Erro ao importar nota",
        description:
          error instanceof ApiError
            ? error.message
            : "Nao foi possivel confirmar a importacao da nota.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title="Importar nota de compra">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setLocation("/estoque")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Importar nota do supermercado</h2>
            <p className="text-muted-foreground">
              Envie a foto da nota, revise as linhas sugeridas e confirme as entradas reais no estoque.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="glass-card h-fit">
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="receipt-file">Foto da nota</Label>
                <Input
                  id="receipt-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  Use uma foto nítida da nota inteira. JPG, PNG ou WEBP.
                </p>
              </div>

              {selectedFile ? (
                <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                  <p className="font-semibold text-foreground">{selectedFile.name}</p>
                  <p className="text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="reference">Referencia da compra</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Ex.: Nota Assaí 04/04"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={registerCashExpense}
                  onChange={(event) => setRegisterCashExpense(event.target.checked)}
                />
                Lançar também no caixa como compra real paga agora
              </label>

              {registerCashExpense ? (
                <div className="space-y-2">
                  <Label>Forma de pagamento</Label>
                  <select
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target.value as
                          | "Pix"
                          | "Dinheiro"
                          | "CartaoCredito"
                          | "CartaoDebito"
                          | "Transferencia",
                      )
                    }
                  >
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="CartaoCredito">Cartão de crédito</option>
                    <option value="CartaoDebito">Cartão de débito</option>
                    <option value="Transferencia">Transferência</option>
                  </select>
                </div>
              ) : null}

              <Button
                className="w-full gap-2"
                onClick={handleAnalyze}
                disabled={!selectedFileBase64 || analyzeReceiptMutation.isPending}
              >
                {analyzeReceiptMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanText className="h-4 w-4" />
                )}
                Analisar nota
              </Button>

              <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                <p className="font-semibold text-foreground">Como funciona</p>
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  <li>1. A IA local lê o texto da foto.</li>
                  <li>2. O sistema sugere itens já cadastrados no estoque.</li>
                  <li>3. Você confere quantidade e valor antes de importar.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="glass-card">
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold">
                      <ReceiptText className="h-5 w-5 text-primary" />
                      Conferência da importação
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Revise as linhas antes de registrar entradas no estoque.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full border bg-background px-3 py-1.5">
                      Selecionadas: {includedLines.length}
                    </span>
                    <span className="rounded-full border bg-background px-3 py-1.5 font-semibold">
                      Total lido: {formatCurrency(estimatedImportedTotal / 100)}
                    </span>
                  </div>
                </div>

                {receiptLines.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/10 px-6 py-10 text-center text-sm text-muted-foreground">
                    Envie a imagem e clique em <strong>Analisar nota</strong> para começar.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receiptLines.map((line) => (
                      <div
                        key={line.lineId}
                        className={cn(
                          "space-y-4 rounded-2xl border p-4",
                          line.enabled ? "border-border bg-background" : "border-border/60 bg-muted/10",
                        )}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">
                              {line.normalizedDescription}
                            </p>
                            <p className="text-xs text-muted-foreground">{line.rawText}</p>
                          </div>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={line.enabled}
                              onChange={(event) =>
                                updateLine(line.lineId, { enabled: event.target.checked })
                              }
                            />
                            Importar
                          </label>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.4fr)_120px_140px]">
                          <div className="space-y-2">
                            <Label>Item do estoque</Label>
                            <select
                              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                              value={line.itemId}
                              onChange={(event) =>
                                updateLine(line.lineId, { itemId: event.target.value })
                              }
                            >
                              <option value="">Selecionar item...</option>
                              {inventoryItemOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-muted-foreground">
                              {line.score == null
                                ? "Sem sugestão confiável."
                                : `Melhor correspondência automática: ${line.score}%`}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Qtd.</Label>
                            <Input
                              value={line.quantity}
                              onChange={(event) =>
                                updateLine(line.lineId, { quantity: event.target.value })
                              }
                              inputMode="decimal"
                              placeholder="1"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Valor total</Label>
                            <Input
                              value={line.totalAmount}
                              onChange={(event) =>
                                updateLine(line.lineId, {
                                  totalAmount: formatMoneyInput(event.target.value),
                                })
                              }
                              inputMode="numeric"
                              placeholder="0,00"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setLocation("/estoque")}>
                    Cancelar
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={handleConfirmImport}
                    disabled={
                      receiptLines.length === 0 || confirmReceiptImportMutation.isPending
                    }
                  >
                    {confirmReceiptImportMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Confirmar importação
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="space-y-3 p-6">
                <h3 className="text-base font-bold text-foreground">Texto extraído</h3>
                <Textarea
                  value={extractedText}
                  readOnly
                  className="min-h-56 resize-y bg-background/70"
                  placeholder="O texto lido da nota vai aparecer aqui."
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
