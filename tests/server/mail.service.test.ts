import assert from "node:assert/strict";
import test from "node:test";
import { MailService } from "../../server/services/mail.service";

test("mail service times out when transporter hangs", async () => {
  const originalSmtpFrom = process.env.SMTP_FROM;
  const originalTimeout = process.env.SMTP_TIMEOUT_MS;

  process.env.SMTP_FROM = "Universo Doce <no-reply@example.com>";
  process.env.SMTP_TIMEOUT_MS = "5";

  const service = new MailService() as any;
  service.transporter = {
    sendMail: async () => await new Promise(() => undefined),
  };

  try {
    await assert.rejects(
      () =>
        service.sendEmailVerification({
          to: "cliente@example.com",
          fullName: "Cliente Teste",
          verificationUrl: "https://example.com/verificar-email?token=abc",
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "Email delivery timeout.");
        return true;
      },
    );
  } finally {
    process.env.SMTP_FROM = originalSmtpFrom;
    process.env.SMTP_TIMEOUT_MS = originalTimeout;
  }
});
