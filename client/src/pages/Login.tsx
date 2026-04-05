import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  Loader2,
  LockKeyhole,
  Mail,
  Sparkles,
  UserPlus2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/http-client";
import { useLogin } from "@/features/auth/hooks/use-login";
import { useRegister } from "@/features/auth/hooks/use-register";
import { useResendVerificationEmail } from "@/features/auth/hooks/use-resend-verification-email";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type AuthMode = "login" | "register";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const resendMutation = useResendVerificationEmail();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationHintEmail, setVerificationHintEmail] = useState("");

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!loginEmail.trim() || !password.trim()) {
      setErrorMessage("Informe seu email e senha.");
      return;
    }

    try {
      const response = await loginMutation.mutateAsync({
        data: {
          email: loginEmail.trim(),
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

      if (message.toLowerCase().includes("confirme seu e-mail")) {
        setVerificationHintEmail(loginEmail.trim());
      }

      setErrorMessage(message);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (
      !registerForm.fullName.trim() ||
      !registerForm.email.trim() ||
      !registerForm.password
    ) {
      setErrorMessage("Preencha nome, e-mail e senha para criar a conta.");
      return;
    }

    if (registerForm.password.length < 8) {
      setErrorMessage("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setErrorMessage("A confirmacao da senha nao confere.");
      return;
    }

    try {
      const response = await registerMutation.mutateAsync({
        data: {
          fullName: registerForm.fullName.trim(),
          email: registerForm.email.trim(),
          password: registerForm.password,
        },
      });

      setVerificationHintEmail(response.data.email);
      setMode("login");
      setLoginEmail(response.data.email);
      setPassword("");
      setRegisterForm({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      toast({
        title: "Cadastro criado",
        description: response.data.message,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Nao foi possivel criar a conta.",
      );
    }
  };

  const handleResend = async () => {
    if (!verificationHintEmail.trim()) {
      setErrorMessage("Informe o e-mail da conta para reenviar a verificacao.");
      return;
    }

    try {
      await resendMutation.mutateAsync({
        data: { email: verificationHintEmail.trim() },
      });
      toast({
        title: "Link reenviado",
        description: "Confira o seu e-mail para concluir a ativacao da conta.",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Nao foi possivel reenviar o link.",
      );
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
                  Entre na sua conta ou ative seu cadastro pelo e-mail.
                </h1>
                <p className="max-w-lg text-lg text-muted-foreground">
                  Clientes acompanham a propria conta depois da verificacao. Admin e operador continuam entrando pelo mesmo login.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-muted-foreground">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                Pedidos
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                Conta
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

              <div className="space-y-3">
                <div className="inline-flex rounded-full border border-border/70 bg-background/60 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMessage("");
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      mode === "login"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setErrorMessage("");
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      mode === "register"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    Criar conta
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="brand-pill">
                    {mode === "login" ? (
                      <LockKeyhole className="h-3.5 w-3.5" />
                    ) : (
                      <UserPlus2 className="h-3.5 w-3.5" />
                    )}
                    {mode === "login" ? "entrar no sistema" : "cadastro com verificacao"}
                  </div>
                  <h2 className="text-3xl font-display font-bold text-foreground">
                    {mode === "login" ? "Login" : "Criar conta"}
                  </h2>
                  <p className="text-muted-foreground">
                    {mode === "login"
                      ? "Use seu email e senha para acessar a conta."
                      : "Depois do cadastro, voce recebe um link por e-mail para ativar a conta."}
                  </p>
                </div>
              </div>

              {mode === "login" ? (
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={loginEmail}
                        onChange={(event) => setLoginEmail(event.target.value)}
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

                  {verificationHintEmail ? (
                    <div className="rounded-[1.2rem] border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-muted-foreground">
                      <p>
                        Se a conta ainda nao foi ativada, reenvie o link para{" "}
                        <strong className="text-foreground">{verificationHintEmail}</strong>.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-3 rounded-full"
                        onClick={handleResend}
                        disabled={resendMutation.isPending}
                      >
                        {resendMutation.isPending ? "Reenviando..." : "Reenviar verificacao"}
                      </Button>
                    </div>
                  ) : null}

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
              ) : (
                <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="register-full-name">Nome completo</Label>
                    <Input
                      id="register-full-name"
                      value={registerForm.fullName}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          fullName: event.target.value,
                        }))
                      }
                      className="h-12 rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      className="h-12 rounded-2xl"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerForm.password}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        className="h-12 rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">Confirmar senha</Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        value={registerForm.confirmPassword}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                        className="h-12 rounded-2xl"
                      />
                    </div>
                  </div>

                  {errorMessage ? (
                    <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {errorMessage}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    className="brand-button h-12 w-full gap-2 rounded-full text-base"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus2 className="h-4 w-4" />
                    )}
                    Criar conta
                  </Button>
                </form>
              )}

              <div className="rounded-[1.2rem] border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                Ja recebeu o link? Abra a pagina de verificacao pelo seu e-mail ou{" "}
                <Link href="/verificar-email">
                  <a className="font-medium text-primary underline-offset-4 hover:underline">
                    valide o token aqui
                  </a>
                </Link>
                .
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
