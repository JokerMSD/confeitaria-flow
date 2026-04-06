import assert from "node:assert/strict";
import test from "node:test";
import { EmailVerificationService } from "../../server/services/email-verification.service";
import { HttpError } from "../../server/utils/http-error";

test("email verification service returns friendly 503 when mail delivery fails", async () => {
  const service = new EmailVerificationService() as any;

  service.tokensRepository = {
    invalidateByUserId: async () => undefined,
    create: async () => undefined,
  };

  service.mailService = {
    sendEmailVerification: async () => {
      throw new Error(
        "SMTP_HOST, SMTP_USER, SMTP_PASS e SMTP_FROM precisam estar configurados para enviar e-mails.",
      );
    },
  };

  await assert.rejects(
    () =>
      service.createAndSendForUser({
        userId: "user-1",
        email: "cliente@example.com",
        fullName: "Cliente Teste",
      }),
    (error: unknown) => {
      assert.ok(error instanceof HttpError);
      assert.equal(error.status, 503);
      assert.equal(
        error.message,
        "Nao foi possivel enviar o e-mail de confirmacao agora. Tente novamente em alguns minutos.",
      );
      return true;
    },
  );
});
