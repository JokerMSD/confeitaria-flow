import assert from "node:assert/strict";
import test from "node:test";
import { resolveMercadoPagoPaymentStatus } from "../../server/domain/orders/mercado-pago-order-domain";

test("mercado pago processed accredited is treated as paid", () => {
  assert.deepEqual(
    resolveMercadoPagoPaymentStatus({
      status: "processed",
      statusDetail: "accredited",
    }),
    {
      isPaid: true,
      isRejected: false,
      isPending: false,
    },
  );
});

test("mercado pago failed is treated as rejected", () => {
  assert.deepEqual(
    resolveMercadoPagoPaymentStatus({
      status: "failed",
      statusDetail: "processing_error",
    }),
    {
      isPaid: false,
      isRejected: true,
      isPending: false,
    },
  );
});

test("mercado pago processing in_process is treated as pending", () => {
  assert.deepEqual(
    resolveMercadoPagoPaymentStatus({
      status: "processing",
      statusDetail: "in_process",
    }),
    {
      isPaid: false,
      isRejected: false,
      isPending: true,
    },
  );
});

test("mercado pago status detail accredited still counts as paid when status is missing", () => {
  assert.deepEqual(
    resolveMercadoPagoPaymentStatus({
      status: null,
      statusDetail: "accredited",
    }),
    {
      isPaid: true,
      isRejected: false,
      isPending: false,
    },
  );
});
