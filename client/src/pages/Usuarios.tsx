import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  Shield,
  UserCog,
  XCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useUsers } from "@/features/users/hooks/use-users";
import { activateUser, deactivateUser } from "@/api/users-api";
import { useToast } from "@/hooks/use-toast";
import type { UserItem } from "@shared/types";

function getRoleLabel(role: UserItem["role"]) {
  if (role === "admin") {
    return "Administrador";
  }

  if (role === "user") {
    return "Cliente";
  }

  return "Operador";
}

function UserStatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
        <p className="font-display text-4xl font-bold text-foreground">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function Usuarios() {
  const { data, isLoading, error, refetch } = useUsers();
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const users = useMemo(() => data?.data ?? [], [data]);
  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return users;
    }

    return users.filter((user) =>
      [
        user.fullName,
        user.username,
        user.email,
        getRoleLabel(user.role),
        user.isActive ? "ativo" : "inativo",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [search, users]);

  const activeCount = filteredUsers.filter((user) => user.isActive).length;
  const inactiveCount = filteredUsers.length - activeCount;
  const adminCount = filteredUsers.filter((user) => user.role === "admin").length;
  const customerCount = filteredUsers.filter((user) => user.role === "user").length;

  const toggleStatus = async (id: string, active: boolean) => {
    try {
      setProcessingId(id);

      if (active) {
        await activateUser(id);
      } else {
        await deactivateUser(id);
      }

      toast({
        title: "Usuário atualizado",
        description: active
          ? "Usuário reativado com sucesso."
          : "Usuário inativado com sucesso.",
      });
      await refetch();
    } catch {
      toast({
        title: "Erro ao atualizar usuário",
        description: "Não foi possível alterar o status agora.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AppLayout title="Usuários">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-border bg-card/80 p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl space-y-2">
              <h2 className="text-3xl font-display font-bold text-foreground">
                Usuários internos
              </h2>
              <p className="text-base leading-7 text-muted-foreground">
                Controle quem entra no sistema, o perfil de cada pessoa e quais
                acessos continuam válidos no dia a dia.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome, usuário ou e-mail"
                  className="pl-9"
                />
              </div>
              <Link href="/usuarios/novo">
                <a>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo usuário
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <UserStatCard
            title="Ativos"
            value={activeCount}
            description="Usuários que podem entrar no sistema agora."
          />
          <UserStatCard
            title="Inativos"
            value={inactiveCount}
            description="Cadastros preservados, mas sem acesso de login."
          />
          <UserStatCard
            title="Administradores"
            value={adminCount}
            description="Perfis com mais autonomia para ajustes internos."
          />
          <UserStatCard
            title="Contas cliente"
            value={customerCount}
            description="Usuários da loja pública com histórico e conta própria."
          />
        </div>

        <Card className="border-border/70 bg-card/80">
          {isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center gap-3 p-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando usuários...</span>
            </div>
          ) : error ? (
            <div className="space-y-4 p-10 text-center">
              <p className="font-medium text-destructive">
                Não foi possível carregar os usuários.
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="space-y-4 p-10 text-center text-muted-foreground">
              <p>Nenhum usuário encontrado no filtro atual.</p>
              <Link href="/usuarios/novo">
                <a>
                  <Button variant="outline">Criar primeiro usuário</Button>
                </a>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">
                          {user.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
                        {user.role === "admin" ? (
                          <Shield className="h-3.5 w-3.5" />
                        ) : (
                          <UserCog className="h-3.5 w-3.5" />
                        )}
                        {getRoleLabel(user.role)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/5 px-3 py-1 text-xs font-semibold text-destructive">
                          <XCircle className="h-3.5 w-3.5" />
                          Inativo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/usuarios/${user.id}`}>
                          <a className="inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-muted">
                            Editar
                          </a>
                        </Link>
                        {user.isActive ? (
                          <button
                            type="button"
                            disabled={processingId === user.id}
                            onClick={() => toggleStatus(user.id, false)}
                            className="inline-flex h-9 items-center justify-center rounded-full border border-destructive/20 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-60"
                          >
                            {processingId === user.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Inativar
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={processingId === user.id}
                            onClick={() => toggleStatus(user.id, true)}
                            className="inline-flex h-9 items-center justify-center rounded-full border border-emerald-200 px-4 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-60"
                          >
                            {processingId === user.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Ativar
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
