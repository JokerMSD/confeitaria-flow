import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { MercadoPagoService } from "../../server/services/mercado-pago.service";

test("mercado pago service uses sandbox payer email override when configured", async () => {
  const originalPublicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;
  const originalAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const originalTestPayerEmail = process.env.MERCADO_PAGO_TEST_PAYER_EMAIL;

  process.env.MERCADO_PAGO_PUBLIC_KEY = "APP_USR-test-public";
  process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-test-access";
  process.env.MERCADO_PAGO_TEST_PAYER_EMAIL = "buyer@testuser.com";

  const fetchMock = mock.method(global, "fetch", async (_input, init) => {
    const payload = JSON.parse(String(init?.body ?? "{}"));

    assert.equal(payload.payer.email, "buyer@testuser.com");

    return {
      ok: true,
      json: async () => ({
        id: "ORD_TEST_123",
        status: "processed",
        status_detail: "accredited",
        transactions: {
          payments: [
            {
              id: "PAY_TEST_123",
              status: "processed",
              status_detail: "accredited",
            },
          ],
        },
      }),
    } as Response;
  });

  try {
    const service = new MercadoPagoService();
    const result = await service.createCardOrder({
      amountCents: 2790,
      description: "Pedido teste",
      externalReference: "order-123",
      token: "tok_123",
      paymentMethodId: "master",
      installments: 1,
      payer: {
        email: "cliente@real.com",
        firstName: "Cliente",
        lastName: "Teste",
        identificationType: "CPF",
        identificationNumber: "12345678909",
      },
    });

    assert.equal(result.orderId, "ORD_TEST_123");
    assert.equal(result.status, "processed");
    assert.equal(result.statusDetail, "accredited");
  } finally {
    fetchMock.mock.restore();
    process.env.MERCADO_PAGO_PUBLIC_KEY = originalPublicKey;
    process.env.MERCADO_PAGO_ACCESS_TOKEN = originalAccessToken;
    process.env.MERCADO_PAGO_TEST_PAYER_EMAIL = originalTestPayerEmail;
  }
});
