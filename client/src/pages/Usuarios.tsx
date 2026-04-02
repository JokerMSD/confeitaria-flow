import { useMemo, useState } from "react";
import { Plus, Loader2, User, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUsers } from "@/features/users/hooks/use-users";
import { activateUser, deactivateUser } from "@/api/users-api";
import { useToast } from "@/hooks/use-toast";

export default function Usuarios() {
  const { data, isLoading, error, refetch } = useUsers();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const users = useMemo(() => data?.data ?? [], [data]);

  const toggleStatus = async (id: string, active: boolean) => {
    try {
      setProcessingId(id);
      if (active) {
        await activateUser(id);
      } else {
        await deactivateUser(id);
      }
      toast({
        title: "Status atualizado",
        description: "Operação realizada com sucesso.",
      });
      await refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AppLayout title="Usuários">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Usuários</h2>
        <Link href="/usuarios/novo">
          <a>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Usuário
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
            Erro ao carregar usuários.
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-2 text-primary"
            >
              Tentar novamente
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            Nenhum usuário cadastrado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <XCircle className="h-4 w-4" /> Inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Link href={`/usuarios/${user.id}`}>
                      <a className="text-primary hover:underline">Editar</a>
                    </Link>
                    {user.isActive ? (
                      <button
                        type="button"
                        disabled={processingId === user.id}
                        onClick={() => toggleStatus(user.id, false)}
                        className="text-destructive"
                      >
                        Inativar
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={processingId === user.id}
                        onClick={() => toggleStatus(user.id, true)}
                        className="text-success"
                      >
                        Ativar
                      </button>
                    )}
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
