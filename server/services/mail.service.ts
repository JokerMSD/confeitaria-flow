import nodemailer from "nodemailer";

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function getAppOrigin() {
  return (
    getRequiredEnv("APP_ORIGIN") ??
    getRequiredEnv("VITE_APP_ORIGIN") ??
    "http://localhost:3000"
  );
}

function getMailTimeoutMs() {
  const configured = Number(getRequiredEnv("SMTP_TIMEOUT_MS") ?? "12000");
  return Number.isFinite(configured) && configured > 0 ? configured : 12000;
}

export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const host = getRequiredEnv("SMTP_HOST");
    const port = Number(getRequiredEnv("SMTP_PORT") ?? "587");
    const secure = (getRequiredEnv("SMTP_SECURE") ?? "false") === "true";
    const user = getRequiredEnv("SMTP_USER");
    const pass = getRequiredEnv("SMTP_PASS");

    if (!host || !user || !pass) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      connectionTimeout: getMailTimeoutMs(),
      greetingTimeout: getMailTimeoutMs(),
      socketTimeout: getMailTimeoutMs(),
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  async sendEmailVerification(input: {
    to: string;
    fullName: string;
    verificationUrl: string;
  }) {
    const transporter = this.getTransporter();
    const from = getRequiredEnv("SMTP_FROM");
    const appOrigin = getAppOrigin();

    if (!transporter || !from) {
      const message = `[mail] Email verification for ${input.to}: ${input.verificationUrl}`;

      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "SMTP_HOST, SMTP_USER, SMTP_PASS e SMTP_FROM precisam estar configurados para enviar e-mails.",
        );
      }

      console.info(message);
      return;
    }

    await Promise.race([
      transporter.sendMail({
        from,
        to: input.to,
        subject: "Confirme seu e-mail - Universo Doce",
        text: [
          `Oi, ${input.fullName}.`,
          "",
          "Clique no link abaixo para confirmar seu e-mail e ativar sua conta:",
          input.verificationUrl,
          "",
          `Se preferir, voce tambem pode abrir ${appOrigin}/login e pedir um novo envio.`,
        ].join("\n"),
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #2d1b1f;">
            <h2>Confirme seu e-mail</h2>
            <p>Oi, <strong>${input.fullName}</strong>.</p>
            <p>Seu cadastro na Universo Doce esta quase pronto. Clique no botao abaixo para confirmar seu e-mail:</p>
            <p>
              <a href="${input.verificationUrl}" style="display:inline-block;padding:12px 20px;background:#d9799f;color:#fff;text-decoration:none;border-radius:999px;">
                Confirmar e-mail
              </a>
            </p>
            <p>Se o botao nao abrir, use este link:</p>
            <p><a href="${input.verificationUrl}">${input.verificationUrl}</a></p>
          </div>
        `,
      }),
      new Promise<never>((_, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Email delivery timeout."));
        }, getMailTimeoutMs());

        timeout.unref?.();
      }),
    ]);
  }
}
