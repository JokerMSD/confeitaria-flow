import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useCustomers } from "@/features/customers/hooks/use-customers";

function getCustomerFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card className="rounded-[1.8rem] border-border/70 bg-card/80 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-display text-4xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </Card>
  );
}

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
  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.isActive).length,
    [customers],
  );

  return (
    <AppLayout title="Clientes">
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-sm uppercase tracking-[0.32em] text-primary">
                Hub comercial
              </p>
              <div className="space-y-2">
                <h1 className="font-display text-4xl font-bold text-foreground">
                  Clientes
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  Acompanhe histórico, recorrência, pedidos em aberto e sinais
                  comerciais sem sair do fluxo operacional.
                </p>
              </div>
            </div>

            <Link href="/clientes/novo">
              <a>
                <Button className="rounded-full px-6">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo cliente
                </Button>
              </a>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Clientes no filtro"
            value={customers.length}
            detail="Contatos retornados pela busca atual."
          />
          <StatCard
            label="Clientes ativos"
            value={activeCustomers}
            detail="Cadastros ativos e disponíveis para operação."
          />
          <StatCard
            label="Pedidos em aberto"
            value={totalOpenOrders}
            detail="Pedidos ainda pendentes de produção, entrega ou retirada."
          />
          <StatCard
            label="Receita histórica"
            value={formatCurrency(totalRevenue / 100)}
            detail="Soma do histórico comercial dos clientes filtrados."
          />
        </section>

        <Card className="rounded-[1.8rem] border-border/70 bg-card/80 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                Busca comercial
              </h2>
              <p className="text-sm text-muted-foreground">
                Pesquise por nome, telefone ou e-mail para abrir rapidamente o
                contexto do cliente.
              </p>
            </div>

            <div className="relative w-full max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-12 rounded-full border-border/80 pl-11 pr-4"
                placeholder="Buscar por nome, telefone ou e-mail"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="rounded-[1.8rem] border-border/70 bg-card/80 p-4 shadow-sm sm:p-5">
          {isLoading ? (
            <div className="flex min-h-[280px] items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando clientes...</span>
            </div>
          ) : error ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Erro ao carregar clientes
                </h2>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  Não foi possível montar a visão comercial agora. Tente recarregar
                  a lista.
                </p>
              </div>
              <Button variant="outline" className="rounded-full" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full border border-border bg-muted/30 p-4">
                <UserRound className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Nenhum cliente encontrado
                </h2>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  Ajuste a busca ou crie um novo cadastro para começar a montar a
                  base comercial.
                </p>
              </div>
              <Link href="/clientes/novo">
                <a>
                  <Button className="rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar cliente
                  </Button>
                </a>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {customers.map((customer) => {
                const fullName = getCustomerFullName(
                  customer.firstName,
                  customer.lastName,
                );

                return (
                  <article
                    key={customer.id}
                    className="rounded-[1.6rem] border border-border/70 bg-background/55 p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <UserRound className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate text-xl font-semibold text-foreground">
                              {fullName}
                            </h2>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <span
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs font-semibold",
                                  customer.isActive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/30 dark:text-emerald-300"
                                    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-300",
                                )}
                              >
                                {customer.isActive ? "Ativo" : "Inativo"}
                              </span>
                              {customer.openOrderCount > 0 ? (
                                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                  {customer.openOrderCount} pedido(s) em aberto
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span>E-mail</span>
                            </div>
                            <p className="mt-2 break-all font-medium text-foreground">
                              {customer.email}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>Telefone</span>
                            </div>
                            <p className="mt-2 font-medium text-foreground">
                              {customer.phone ?? "Não informado"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ShoppingBag className="h-4 w-4" />
                              <span>Último pedido</span>
                            </div>
                            <p className="mt-2 font-medium text-foreground">
                              {customer.lastOrderDate
                                ? formatDate(customer.lastOrderDate)
                                : "Sem histórico"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid min-w-full gap-3 sm:grid-cols-3 xl:min-w-[360px]">
                        <div className="rounded-2xl border border-border/70 bg-card px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Total gasto
                          </p>
                          <p className="mt-2 text-2xl font-bold text-foreground">
                            {formatCurrency(customer.totalSpentCents / 100)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-card px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Pedidos
                          </p>
                          <p className="mt-2 text-2xl font-bold text-foreground">
                            {customer.orderCount}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-card px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Em aberto
                          </p>
                          <p className="mt-2 text-2xl font-bold text-foreground">
                            {customer.openOrderCount}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        Atualizado em {formatDate(customer.updatedAt)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/clientes/${customer.id}`}>
                          <a>
                            <Button variant="outline" className="rounded-full">
                              Ver detalhes
                            </Button>
                          </a>
                        </Link>
                        <Link href={`/clientes/${customer.id}/editar`}>
                          <a>
                            <Button variant="ghost" className="rounded-full">
                              Editar cadastro
                            </Button>
                          </a>
                        </Link>
                        <Link href={`/pedidos/novo?customerId=${customer.id}`}>
                          <a>
                            <Button className="rounded-full">
                              Novo pedido
                            </Button>
                          </a>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
