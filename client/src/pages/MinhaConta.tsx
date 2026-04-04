import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Loader2, LockKeyhole, Save, ShoppingBag, UserCircle2 } from "lucide-react";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  useAccountOrders,
  useAccountProfile,
  useChangeAccountPassword,
  useUpdateAccountProfile,
} from "@/features/account/hooks/use-account";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import { formatCurrency, formatDate } from "@/lib/utils";

function isStaffRole(role?: string) {
  return role === "admin" || role === "operador";
}

export default function MinhaConta() {
  const { toast } = useToast();
  const authSessionQuery = useAuthSession();
  const profileQuery = useAccountProfile();
  const ordersQuery = useAccountOrders();
  const updateProfileMutation = useUpdateAccountProfile();
  const changePasswordMutation = useChangeAccountPassword();
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    photoUrl: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!profileQuery.data?.data) {
      return;
    }

    setProfileForm({
      fullName: profileQuery.data.data.fullName,
      email: profileQuery.data.data.email,
      phone: profileQuery.data.data.phone ?? "",
      photoUrl: profileQuery.data.data.photoUrl ?? "",
    });
  }, [profileQuery.data]);

  const session = authSessionQuery.data?.data ?? null;
  const profile = profileQuery.data?.data;
  const orders = useMemo(() => ordersQuery.data?.data ?? [], [ordersQuery.data]);
  const isStaff = isStaffRole(session?.role);
  const pageTitle = isStaff ? "Configuracoes da conta" : "Minha conta";
  const pageSubtitle = isStaff
    ? "Atualize seus dados de acesso, foto e senha sem sair do painel administrativo."
    : "Atualize seus dados, altere a senha e acompanhe seus pedidos feitos pela loja.";

  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        data: {
          fullName: profileForm.fullName,
          email: profileForm.email,
          phone: profileForm.phone || null,
          photoUrl: profileForm.photoUrl || null,
        },
      });

      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram salvos com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Falha ao salvar perfil",
        description:
          error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast({
        title: "Senha incompleta",
        description: "Preencha a senha atual e a nova senha.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Confirmacao invalida",
        description: "A confirmacao da nova senha nao confere.",
        variant: "destructive",
      });
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        data: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Falha ao alterar senha",
        description:
          error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const content = profileQuery.isLoading ? (
    <div className="brand-shell flex min-h-[240px] items-center justify-center gap-3 p-8 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Carregando sua conta...</span>
    </div>
  ) : (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <Card className="brand-shell">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border border-border">
                <AvatarImage src={profileForm.photoUrl || undefined} />
                <AvatarFallback>
                  {(profile?.fullName?.slice(0, 2) ?? "DC").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-primary">
                  {isStaff ? "Conta interna" : "Conta"}
                </p>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  {profile?.fullName ?? "Cliente"}
                </h2>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                {profile?.role ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Perfil {profile.role}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
                <p className="text-sm text-muted-foreground">Pedidos</p>
                <p className="mt-1 font-display text-3xl font-bold text-foreground">
                  {profile?.orderCount ?? 0}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
                <p className="text-sm text-muted-foreground">Em aberto</p>
                <p className="mt-1 font-display text-3xl font-bold text-foreground">
                  {profile?.openOrderCount ?? 0}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
                <p className="text-sm text-muted-foreground">Total gasto</p>
                <p className="mt-1 font-semibold text-foreground">
                  {formatCurrency((profile?.totalSpentCents ?? 0) / 100)}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
                <p className="text-sm text-muted-foreground">Ultimo pedido</p>
                <p className="mt-1 font-semibold text-foreground">
                  {profile?.lastOrderDate ? formatDate(profile.lastOrderDate) : "Sem historico"}
                </p>
              </div>
            </div>

            {isStaff ? (
              <div className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                Seu acesso administrativo continua no painel. Esta area serve para
                atualizar seus dados pessoais sem entrar na tela de usuarios.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="brand-shell">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Perfil</h3>
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                className="rounded-2xl"
                value={profileForm.fullName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                className="rounded-2xl"
                type="email"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                className="rounded-2xl"
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Foto (URL)</Label>
              <Input
                className="rounded-2xl"
                value={profileForm.photoUrl}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    photoUrl: event.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
              className="brand-button w-full rounded-full"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar perfil
            </Button>
          </CardContent>
        </Card>

        <Card className="brand-shell">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Senha</h3>
            </div>
            <Input
              className="rounded-2xl"
              type="password"
              placeholder="Senha atual"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
            />
            <Input
              className="rounded-2xl"
              type="password"
              placeholder="Nova senha"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  newPassword: event.target.value,
                }))
              }
            />
            <Input
              className="rounded-2xl"
              type="password"
              placeholder="Confirmar nova senha"
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
            />
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              variant="outline"
              className="w-full rounded-full"
            >
              {changePasswordMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Alterar senha
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="brand-shell">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-primary">
                Historico de pedidos
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
                {isStaff ? "Pedidos vinculados a sua conta" : "Seus pedidos"}
              </h2>
            </div>
            {isStaff ? (
              <Link href="/clientes">
                <a className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  <ShoppingBag className="h-4 w-4" />
                  Clientes
                </a>
              </Link>
            ) : null}
          </div>

          {ordersQuery.isLoading ? (
            <div className="flex min-h-[180px] items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando pedidos...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-[1.6rem] border border-dashed border-border p-6 text-center text-muted-foreground">
              {isStaff
                ? "Nenhum pedido esta vinculado a esta conta interna."
                : "Nenhum pedido encontrado para esta conta."}
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{order.orderNumber}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.deliveryMode} em {formatDate(order.deliveryDate)}
                        {order.deliveryTime ? ` as ${order.deliveryTime}` : ""}
                      </p>
                      {order.deliveryMode === "Entrega" ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {order.deliveryAddress || "Endereco nao informado"}
                          {order.deliveryDistrict ? ` • ${order.deliveryDistrict}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(order.subtotalAmountCents / 100)}
                      </p>
                      <p className="text-sm text-muted-foreground">{order.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (isStaff) {
    return (
      <AppLayout title={pageTitle}>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.28em] text-primary">
              Painel interno
            </p>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {pageTitle}
            </h1>
            <p className="max-w-3xl text-muted-foreground">{pageSubtitle}</p>
          </div>
          {content}
        </div>
      </AppLayout>
    );
  }

  return (
    <PublicStoreLayout title={pageTitle} subtitle={pageSubtitle}>
      {content}
    </PublicStoreLayout>
  );
}
