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
        title: "Confirmação inválida",
        description: "A confirmação da nova senha não confere.",
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
      subtitle="Atualize seus dados e acompanhe seus pedidos feitos pela loja."
    >
      {profileQuery.isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center gap-3 rounded-3xl border border-rose-100 bg-white/90 p-8 text-rose-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando sua conta...</span>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card className="border-rose-100 bg-white/90">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border border-rose-100">
                    <AvatarImage src={profileForm.photoUrl || undefined} />
                    <AvatarFallback>
                      {(profile?.fullName?.slice(0, 2) ?? "DC").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm uppercase tracking-wide text-rose-700">
                      Conta
                    </p>
                    <h2 className="font-display text-2xl font-bold text-rose-950">
                      {profile?.fullName ?? "Cliente"}
                    </h2>
                    <p className="text-sm text-rose-700">{profile?.email}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                    <p className="text-sm text-rose-700">Pedidos</p>
                    <p className="mt-1 font-display text-3xl font-bold text-rose-950">
                      {profile?.orderCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                    <p className="text-sm text-rose-700">Em aberto</p>
                    <p className="mt-1 font-display text-3xl font-bold text-rose-950">
                      {profile?.openOrderCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                    <p className="text-sm text-rose-700">Total gasto</p>
                    <p className="mt-1 font-semibold text-rose-950">
                      {formatCurrency((profile?.totalSpentCents ?? 0) / 100)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                    <p className="text-sm text-rose-700">Último pedido</p>
                    <p className="mt-1 font-semibold text-rose-950">
                      {profile?.lastOrderDate
                        ? formatDate(profile.lastOrderDate)
                        : "Sem histórico"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-rose-100 bg-white/90">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2">
                  <UserCircle2 className="h-5 w-5 text-rose-500" />
                  <h3 className="font-semibold text-rose-950">Perfil</h3>
                </div>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
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
                  className="w-full bg-rose-500 hover:bg-rose-600"
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

            <Card className="border-rose-100 bg-white/90">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-5 w-5 text-rose-500" />
                  <h3 className="font-semibold text-rose-950">Senha</h3>
                </div>
                <Input
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
                  className="w-full"
                >
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Alterar senha
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-rose-100 bg-white/90">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-rose-700">
                  Histórico de pedidos
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-rose-950">
                  Seus pedidos
                </h2>
              </div>

              {ordersQuery.isLoading ? (
                <div className="flex min-h-[180px] items-center justify-center gap-3 text-rose-700">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Carregando pedidos...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-center text-rose-700">
                  Nenhum pedido encontrado para esta conta.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-rose-950">
                            {order.orderNumber}
                          </p>
                          <p className="mt-1 text-sm text-rose-700">
                            {order.deliveryMode} em {formatDate(order.deliveryDate)}
                            {order.deliveryTime ? ` às ${order.deliveryTime}` : ""}
                          </p>
                          {order.deliveryMode === "Entrega" ? (
                            <p className="mt-1 text-sm text-rose-700">
                              {order.deliveryAddress || "Endereço não informado"}
                              {order.deliveryDistrict
                                ? ` • ${order.deliveryDistrict}`
                                : ""}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-rose-950">
                            {formatCurrency(order.subtotalAmountCents / 100)}
                          </p>
                          <p className="text-sm text-rose-700">{order.status}</p>
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
