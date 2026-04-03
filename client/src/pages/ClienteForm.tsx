import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCustomer } from "@/features/customers/hooks/use-customer";
import { createCustomer, updateCustomer } from "@/api/customers-api";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
  isActive: boolean;
}

export default function ClienteForm() {
  const params = useParams<{ id?: string }>();
  const id = params?.id ?? "";
  const isEditing = Boolean(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const customerQuery = useCustomer(id);
  const { register, handleSubmit, reset, formState, watch } = useForm<FormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!customerQuery.data?.data) {
      return;
    }

    reset({
      firstName: customerQuery.data.data.firstName,
      lastName: customerQuery.data.data.lastName,
      email: customerQuery.data.data.email,
      phone: customerQuery.data.data.phone ?? "",
      notes: customerQuery.data.data.notes ?? "",
      isActive: customerQuery.data.data.isActive,
    });
  }, [customerQuery.data, reset]);

  const onSubmit = async (values: FormData) => {
    try {
      if (isEditing) {
        await updateCustomer(id, values);
        toast({ title: "Cliente atualizado" });
      } else {
        await createCustomer(values);
        toast({ title: "Cliente criado" });
      }
      setLocation("/clientes");
    } catch (error) {
      toast({
        title: "Falha ao salvar cliente",
        description:
          error instanceof Error ? error.message : "Não foi possível salvar o cliente.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title={isEditing ? "Editar Cliente" : "Novo Cliente"}>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/clientes">
          <a>
            <Button variant="secondary" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </a>
        </Link>
        <h2 className="text-2xl font-display font-bold">
          {isEditing ? "Editar Cliente" : "Novo Cliente"}
        </h2>
      </div>

      {isEditing && customerQuery.isLoading ? (
        <div className="p-10 text-center text-muted-foreground">
          <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
          Carregando...
        </div>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Nome</label>
                <Input {...register("firstName", { required: true })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Sobrenome</label>
                <Input {...register("lastName", { required: true })} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">E-mail</label>
                <Input type="email" {...register("email", { required: true })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Telefone</label>
                <Input {...register("phone")} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Observações</label>
              <textarea
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("notes")}
              />
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
              <input type="checkbox" {...register("isActive")} />
              <div>
                <p className="font-medium">Cadastro ativo</p>
                <p className="text-sm text-muted-foreground">
                  {watch("isActive")
                    ? "O cliente aparece normalmente nas leituras comerciais."
                    : "O cliente permanece no histórico, mas marcado como inativo."}
                </p>
              </div>
            </label>

            <div className="pt-2">
              <Button type="submit" disabled={formState.isSubmitting}>
                {isEditing ? "Salvar cliente" : "Criar cliente"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </AppLayout>
  );
}
