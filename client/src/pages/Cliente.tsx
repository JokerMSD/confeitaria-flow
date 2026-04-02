import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCustomer } from "@/features/customers/hooks/use-customer";
import { formatDate } from "@/lib/utils";

export default function Cliente() {
  const params = useParams();
  const id = params.id ?? "";
  const { data, isLoading, isError } = useCustomer(id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  return (
    <AppLayout title="Detalhes do Cliente">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/clientes">
          <a>
            <Button variant="secondary" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </a>
        </Link>
        <h2 className="text-2xl font-display font-bold">Detalhes do Cliente</h2>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">
          <Loader2 className="inline h-5 w-5 animate-spin mr-2" /> Carregando...
        </div>
      ) : isError || !data ? (
        <div className="p-10 text-center text-destructive">Cliente não encontrado.</div>
      ) : (
        <Card className="space-y-4 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm">Nome</h3>
              <p>{data.data.firstName} {data.data.lastName}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm">E-mail</h3>
              <p>{data.data.email}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Telefone</h3>
              <p>{data.data.phone ?? "-"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Ativo</h3>
              <p>{data.data.isActive ? "Sim" : "Não"}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm">Informações</h3>
            <p>{data.data.notes ?? "Sem observações"}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold text-sm">Total gasto</h3>
              <p>{(data.data.totalSpentCents / 100).toFixed(2)}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Último Pedido</h3>
              <p>{data.data.lastOrderDate ? formatDate(data.data.lastOrderDate) : "-"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Pedidos</h3>
              <p>{data.data.orderCount}</p>
            </div>
          </div>
        </Card>
      )}
    </AppLayout>
  );
}
