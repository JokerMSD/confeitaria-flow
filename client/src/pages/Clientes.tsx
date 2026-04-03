import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Loader2, Plus, Search, User as UserIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Clientes() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error, refetch } = useCustomers(search);
  const customers = useMemo(() => data?.data ?? [], [data]);

  const totalOpenOrders = useMemo(
    () => customers.reduce((sum, customer) => sum + customer.openOrderCount, 0),
    [customers],
  );
  const totalRevenue = useMemo(
    () => customers.reduce((sum, customer) => sum + customer.totalSpentCents, 0),
    [customers],
  );

  return (
    <AppLayout title="Clientes">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Clientes</h2>
          <p className="text-sm text-muted-foreground">
            Visão comercial com histórico, pedidos em aberto e busca por contato.
          </p>
        </div>
        <Link href="/clientes/novo">
          <a>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo cliente
            </Button>
          </a>
        </Link>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Clientes no filtro</p>
          <p className="mt-2 text-3xl font-display font-bold">{customers.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pedidos em aberto</p>
          <p className="mt-2 text-3xl font-display font-bold">{totalOpenOrders}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Receita histórica</p>
          <p className="mt-2 text-3xl font-display font-bold">
            {formatCurrency(totalRevenue / 100)}
          </p>
        </Card>
      </div>

      <div className="mb-4">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, telefone ou e-mail"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">
            <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
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
            Nenhum cliente encontrado.
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
                <TableHead>Em aberto</TableHead>
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
                  <TableCell>{formatCurrency(customer.totalSpentCents / 100)}</TableCell>
                  <TableCell>
                    {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : "-"}
                  </TableCell>
                  <TableCell>{customer.openOrderCount}</TableCell>
                  <TableCell>{customer.isActive ? "Sim" : "Não"}</TableCell>
                  <TableCell>
                    <div className="flex gap-3">
                      <Link href={`/clientes/${customer.id}`}>
                        <a className="text-primary hover:underline">Detalhes</a>
                      </Link>
                      <Link href={`/clientes/${customer.id}/editar`}>
                        <a className="text-muted-foreground hover:text-foreground">
                          Editar
                        </a>
                      </Link>
                    </div>
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
