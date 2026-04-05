import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Loader2, MailCheck, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useVerifyEmail } from "@/features/auth/hooks/use-verify-email";
import { useResendVerificationEmail } from "@/features/auth/hooks/use-resend-verification-email";
import { ApiError } from "@/api/http-client";

function readTokenFromUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
}

export default function VerificarEmail() {
  const [token, setToken] = useState(readTokenFromUrl());
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerificationEmail();

  const verificationState = useMemo(() => {
    if (verifyMutation.isSuccess) return "success";
    if (verifyMutation.isPending) return "pending";
    if (verifyMutation.isError) return "error";
    return "idle";
  }, [verifyMutation.isError, verifyMutation.isPending, verifyMutation.isSuccess]);

  useEffect(() => {
    if (!token || verifyMutation.isPending || verifyMutation.isSuccess) {
      return;
    }

    verifyMutation.mutate(
      { data: { token } },
      {
        onSuccess: (response) => {
          setStatusMessage(
            `E-mail confirmado com sucesso para ${response.data.email}. Agora voce ja pode entrar na sua conta.`,
          );
          setEmail(response.data.email);
        },
        onError: (error) => {
          setStatusMessage(
            error instanceof ApiError
              ? error.message
              : "Nao foi possivel validar o token informado.",
          );
        },
      },
    );
  }, [token, verifyMutation]);

  const handleManualVerify = async () => {
    if (!token.trim()) {
      setStatusMessage("Cole o token enviado por e-mail para confirmar a conta.");
      return;
    }

    try {
      const response = await verifyMutation.mutateAsync({
        data: { token: token.trim() },
      });
      setStatusMessage(
        `E-mail confirmado com sucesso para ${response.data.email}. Agora voce ja pode entrar na sua conta.`,
      );
      setEmail(response.data.email);
    } catch (error) {
      setStatusMessage(
        error instanceof ApiError
          ? error.message
          : "Nao foi possivel validar o token informado.",
      );
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setStatusMessage("Informe o e-mail da conta para reenviar a verificacao.");
      return;
    }

    try {
      await resendMutation.mutateAsync({ data: { email: email.trim() } });
      setStatusMessage("Enviamos um novo link de verificacao para o e-mail informado.");
    } catch (error) {
      setStatusMessage(
        error instanceof ApiError
          ? error.message
          : "Nao foi possivel reenviar o e-mail de verificacao.",
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(178,69,90,0.14),transparent_60%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center">
        <Card className="brand-shell w-full overflow-hidden">
          <CardContent className="space-y-6 p-6 sm:p-8 lg:p-10">
            <div className="flex items-start justify-between gap-4">
              <BrandLogo imageClassName="h-14 w-14" />
              <ThemeToggle compact className="rounded-full border-border bg-card/80 px-3" />
            </div>

            <div className="space-y-2">
              <div className="brand-pill">
                <MailCheck className="h-3.5 w-3.5" />
                verificacao de e-mail
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Ative sua conta
              </h1>
              <p className="text-muted-foreground">
                Validamos o link recebido por e-mail antes do primeiro login.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="Cole aqui o token recebido"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="h-12 rounded-2xl"
              />
              <Button
                onClick={handleManualVerify}
                className="brand-button h-12 w-full rounded-full"
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Confirmar e-mail"
                )}
              </Button>
            </div>

            <div
              className={`rounded-[1.3rem] border px-4 py-4 text-sm ${
                verificationState === "success"
                  ? "border-primary/25 bg-primary/10 text-muted-foreground"
                  : verificationState === "error"
                    ? "border-destructive/25 bg-destructive/10 text-destructive"
                    : "border-border/70 bg-background/60 text-muted-foreground"
              }`}
            >
              {verificationState === "success" ? (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <p>{statusMessage}</p>
                </div>
              ) : (
                <p>{statusMessage || "Cole o token ou abra esta pagina pelo link enviado."}</p>
              )}
            </div>

            <div className="rounded-[1.4rem] border border-border/70 bg-background/60 p-4">
              <p className="mb-3 text-sm font-medium text-foreground">
                Precisa de um novo link?
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 rounded-2xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-full px-6"
                  onClick={handleResend}
                  disabled={resendMutation.isPending}
                >
                  {resendMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reenviar
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/login">
                <a>
                  <Button className="brand-button rounded-full px-6">
                    Ir para o login
                  </Button>
                </a>
              </Link>
              <Link href="/loja">
                <a>
                  <Button variant="outline" className="rounded-full px-6">
                    Voltar para a loja
                  </Button>
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
