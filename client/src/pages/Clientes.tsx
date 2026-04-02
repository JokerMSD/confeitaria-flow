import { useMemo } from "react";
import { Link } from "wouter";
import { Plus, Loader2, User as UserIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { formatDate } from "@/lib/utils";

export default function Clientes() {
  const { data, isLoading, error, refetch } = useCustomers();

  const customers = useMemo(() => data?.data ?? [], [data]);

  return (
    <AppLayout title="Clientes">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Clientes</h2>
        <Link href="/clientes/novo">
          <a>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </a>
        </Link>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">
            <Loader2 className="inline h-5 w-5 animate-spin mr-2" />{" "}
            Carregando...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-destructive">
            Erro ao carregar clientes.
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-2 text-primary"
            >
              Tentar novamente
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            Nenhum cliente cadastrado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Total gasto</TableHead>
                <TableHead>Último pedido</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <UserIcon className="h-4 w-4" />
                      {customer.firstName} {customer.lastName}
                    </div>
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone ?? "-"}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{customer.isActive ? "Sim" : "Não"}</TableCell>
                  <TableCell>
                    <Link href={`/clientes/${customer.id}`}>
                      <a className="text-primary hover:underline">Detalhes</a>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </AppLayout>
  );
}
