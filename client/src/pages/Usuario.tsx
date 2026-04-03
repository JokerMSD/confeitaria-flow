import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, Shield, UserCog } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/features/users/hooks/use-user";
import { createUser, updateUser } from "@/api/users-api";
import type { UserRole } from "@shared/types";

interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  isActive: boolean;
}

function roleDescription(role: UserRole) {
  return role === "admin"
    ? "Pode configurar usuários e ajustar áreas mais sensíveis."
    : "Perfil operacional para pedidos, produção, caixa e rotina da loja.";
}

export default function Usuario() {
  const params = useParams<{ id?: string }>();
  const id = params.id ?? "";
  const isEditing = Boolean(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data, isLoading } = useUser(id);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      role: "operador",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!data?.data) {
      return;
    }

    reset({
      username: data.data.username,
      email: data.data.email,
      fullName: data.data.fullName,
      password: "",
      role: data.data.role,
      isActive: data.data.isActive,
    });
  }, [data, reset]);

  const selectedRole = watch("role");
  const isActive = watch("isActive");

  const onSubmit = async (values: UserFormData) => {
    try {
      const payload = {
        username: values.username,
        email: values.email,
        fullName: values.fullName,
        role: values.role,
        isActive: values.isActive,
        ...(values.password.trim() ? { password: values.password } : {}),
      };

      if (isEditing) {
        await updateUser(id, payload);
        toast({
          title: "Usuário atualizado",
          description: "Os dados internos foram salvos com sucesso.",
        });
      } else {
        if (!values.password.trim()) {
          toast({
            title: "Senha obrigatória",
            description: "Informe uma senha para criar o usuário.",
            variant: "destructive",
          });
          return;
        }

        await createUser({
          ...payload,
          password: values.password,
        });
        toast({
          title: "Usuário criado",
          description: "O novo acesso já pode ser usado no login.",
        });
      }

      setLocation("/usuarios");
    } catch (error) {
      toast({
        title: "Falha ao salvar usuário",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a operação.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title={isEditing ? "Editar usuário" : "Novo usuário"}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/usuarios">
              <a>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </a>
            </Link>
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground">
                {isEditing ? "Editar usuário" : "Novo usuário"}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Configure acesso, perfil e status sem depender do fallback por
                variável de ambiente.
              </p>
            </div>
          </div>
        </div>

        {isEditing && isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center gap-3 rounded-[28px] border border-border bg-card/80 p-10 text-muted-foreground shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando dados do usuário...</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
          >
            <Card className="border-border/70 bg-card/80">
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome completo</Label>
                    <Input
                      id="fullName"
                      {...register("fullName", {
                        required: "Informe o nome completo.",
                      })}
                      placeholder="Ex.: Igor da confeitaria"
                    />
                    {errors.fullName ? (
                      <p className="text-sm text-destructive">
                        {errors.fullName.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nome de usuário</Label>
                    <Input
                      id="username"
                      {...register("username", {
                        required: "Informe o nome de usuário.",
                        minLength: {
                          value: 3,
                          message: "Use pelo menos 3 caracteres.",
                        },
                      })}
                      placeholder="Ex.: igor"
                    />
                    {errors.username ? (
                      <p className="text-sm text-destructive">
                        {errors.username.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email", {
                        required: "Informe o e-mail.",
                      })}
                      placeholder="contato@confeitaria.com"
                    />
                    {errors.email ? (
                      <p className="text-sm text-destructive">
                        {errors.email.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="password">
                      {isEditing ? "Nova senha" : "Senha"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password", {
                        minLength: {
                          value: 8,
                          message: "Use pelo menos 8 caracteres.",
                        },
                      })}
                      placeholder={
                        isEditing
                          ? "Deixe em branco para manter a senha atual"
                          : "Mínimo de 8 caracteres"
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      {isEditing
                        ? "Preencha apenas se quiser trocar a senha."
                        : "Use uma senha segura para o login interno."}
                    </p>
                    {errors.password ? (
                      <p className="text-sm text-destructive">
                        {errors.password.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/70 bg-card/80">
                <CardContent className="space-y-4 p-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Perfil</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Escolha o nível de autonomia do usuário no sistema.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {([
                      {
                        value: "operador",
                        label: "Operador",
                        icon: UserCog,
                      },
                      {
                        value: "admin",
                        label: "Administrador",
                        icon: Shield,
                      },
                    ] as const).map((option) => {
                      const Icon = option.icon;
                      const active = selectedRole === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setValue("role", option.value)}
                          className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                            active
                              ? "border-primary bg-primary/10"
                              : "border-border bg-background hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="mt-0.5 h-4 w-4 text-primary" />
                            <div>
                              <p className="font-semibold text-foreground">
                                {option.label}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {roleDescription(option.value)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Status</h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Usuários inativos continuam cadastrados, mas sem acesso.
                      </p>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) => setValue("isActive", checked)}
                    />
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-muted-foreground">
                    {isActive
                      ? "Este usuário poderá entrar no sistema."
                      : "Este usuário ficará bloqueado no login até ser reativado."}
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isEditing ? "Salvar alterações" : "Criar usuário"}
                </Button>
                <Link href="/usuarios">
                  <a>
                    <Button type="button" variant="outline" className="w-full">
                      Cancelar
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
