import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation } from "wouter";
import { Loader2, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/http-client";
import { useLogin } from "@/features/auth/hooks/use-login";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Informe seu email e senha.");
      return;
    }

    try {
      const response = await loginMutation.mutateAsync({
        data: {
          email: email.trim(),
          password,
        },
      });

      toast({
        title: "Login realizado",
        description: "Voce foi autenticado com sucesso.",
      });
      setLocation(
        response.data.role === "admin" || response.data.role === "operador"
          ? "/"
          : "/conta",
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Não foi possível autenticar.";
      setErrorMessage(message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center p-4">
      <div className="pointer-events-none absolute -top-24 left-[-6rem] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-5rem] right-[-4rem] h-80 w-80 rounded-full bg-warning/10 blur-3xl" />
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 items-stretch">
        <div className="hidden lg:flex flex-col justify-between rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur-xl p-10 shadow-2xl shadow-primary/5">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Acesso restrito
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-display font-bold text-foreground">
                Doce Gestao
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                Login simples para uso real com poucas pessoas, com sessao salva
                no navegador e acesso aos modulos reais do sistema.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              Pedidos
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              Caixa
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              Estoque
            </div>
          </div>
        </div>

        <Card className="glass-card border-border/60 shadow-2xl shadow-primary/5">
          <CardContent className="p-6 sm:p-8 lg:p-10 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <LockKeyhole className="h-3.5 w-3.5" />
                Entrar no sistema
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground">
                Login
              </h2>
              <p className="text-muted-foreground">
                Use seu email e senha para acessar o sistema.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    className="pl-9 h-12"
                    enterKeyHint="next"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  className="h-12"
                  enterKeyHint="go"
                />
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base gap-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
