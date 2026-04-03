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
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

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
          : "Nao foi possivel autenticar.";
      setErrorMessage(message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(178,69,90,0.14),transparent_60%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="brand-shell brand-hero hidden flex-col justify-between p-10 lg:flex">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <BrandLogo className="items-start" imageClassName="h-20 w-20" />
                <ThemeToggle className="rounded-full border-border bg-card/80" />
              </div>
              <div className="space-y-3">
                <div className="brand-pill">acesso da confeitaria</div>
                <h1 className="max-w-xl font-display text-4xl font-bold text-foreground">
                  Painel e conta do cliente com a mesma identidade visual.
                </h1>
                <p className="max-w-lg text-lg text-muted-foreground">
                  Login simples para uso real, com sessao salva no navegador e acesso aos modulos corretos para cada perfil.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-muted-foreground">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                Pedidos
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                Caixa
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                Loja
              </div>
            </div>
          </div>

          <Card className="brand-shell overflow-hidden">
            <CardContent className="space-y-6 p-6 sm:p-8 lg:p-10">
              <div className="flex items-start justify-between gap-4 lg:hidden">
                <BrandLogo imageClassName="h-14 w-14" />
                <ThemeToggle compact className="rounded-full border-border bg-card/80 px-3" />
              </div>

              <div className="space-y-2">
                <div className="brand-pill">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  entrar no sistema
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
                      className="h-12 rounded-2xl pl-9"
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
                    className="h-12 rounded-2xl"
                    enterKeyHint="go"
                  />
                </div>

                {errorMessage ? (
                  <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {errorMessage}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="brand-button h-12 w-full gap-2 rounded-full text-base"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Entrar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
