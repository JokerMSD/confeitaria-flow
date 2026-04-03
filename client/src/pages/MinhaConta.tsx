import { useEffect, useMemo, useState } from "react";
import { Loader2, LockKeyhole, Save, UserCircle2 } from "lucide-react";
import { PublicStoreLayout } from "@/components/public/PublicStoreLayout";
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
import { formatCurrency, formatDate } from "@/lib/utils";

export default function MinhaConta() {
  const { toast } = useToast();
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

  const profile = profileQuery.data?.data;
  const orders = useMemo(() => ordersQuery.data?.data ?? [], [ordersQuery.data]);

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

  return (
    <PublicStoreLayout
      title="Minha conta"
      subtitle="Atualize seus dados, altere a senha e acompanhe seus pedidos feitos pela loja."
    >
      {profileQuery.isLoading ? (
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
                      Conta
                    </p>
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      {profile?.fullName ?? "Cliente"}
                    </h2>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
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
                      {profile?.lastOrderDate
                        ? formatDate(profile.lastOrderDate)
                        : "Sem historico"}
                    </p>
                  </div>
                </div>
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
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-primary">
                  Historico de pedidos
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
                  Seus pedidos
                </h2>
              </div>

              {ordersQuery.isLoading ? (
                <div className="flex min-h-[180px] items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Carregando pedidos...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-border p-6 text-center text-muted-foreground">
                  Nenhum pedido encontrado para esta conta.
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
                          <p className="font-semibold text-foreground">
                            {order.orderNumber}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {order.deliveryMode} em {formatDate(order.deliveryDate)}
                            {order.deliveryTime ? ` as ${order.deliveryTime}` : ""}
                          </p>
                          {order.deliveryMode === "Entrega" ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {order.deliveryAddress || "Endereco nao informado"}
                              {order.deliveryDistrict
                                ? ` • ${order.deliveryDistrict}`
                                : ""}
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
      )}
    </PublicStoreLayout>
  );
}
