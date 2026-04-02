import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/features/users/hooks/use-user";
import { createUser, getUser, updateUser } from "@/api/users-api";

interface FormData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: "admin" | "operador";
}

export default function Usuario() {
  const params = useParams();
  const id = params.id ?? "";
  const [, setLocation] = useLocation();
  const toast = useToast();
  const { data, isLoading } = useUser(id);

  const { register, handleSubmit, reset, formState } = useForm<FormData>({
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      role: "operador",
    },
  });

  useEffect(() => {
    if (data?.data) {
      reset({
        username: data.data.username,
        email: data.data.email,
        fullName: data.data.fullName,
        password: "",
        role: data.data.role,
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: FormData) => {
    try {
      if (id) {
        await updateUser(id, values);
        toast.toast({ title: "Usuário atualizado" });
      } else {
        await createUser(values);
        toast.toast({ title: "Usuário criado" });
      }
      setLocation("/usuarios");
    } catch (error) {
      toast.toast({ title: "Erro", description: "Falha ao salvar usuário.", variant: "destructive" });
    }
  };

  return (
    <AppLayout title={id ? "Editar Usuário" : "Novo Usuário"}>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/usuarios">
          <a>
            <Button variant="secondary" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </a>
        </Link>
        <h2 className="text-2xl font-display font-bold">{id ? "Editar Usuário" : "Novo Usuário"}</h2>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">
          <Loader2 className="inline h-5 w-5 animate-spin mr-2" /> Carregando...
        </div>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Nome de usuário</label>
              <Input {...register("username", { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">E-mail</label>
              <Input type="email" {...register("email", { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Nome completo</label>
              <Input {...register("fullName", { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Senha</label>
              <Input type="password" {...register("password", { required: !id })} placeholder={id ? "Deixe em branco para manter" : "Senha"} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Perfil</label>
              <select className="w-full border rounded-md p-2" {...register("role")}> 
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="pt-4">
              <Button type="submit" disabled={formState.isSubmitting}>{id ? "Salvar" : "Criar"}</Button>
            </div>
          </form>
        </Card>
      )}
    </AppLayout>
  );
}
