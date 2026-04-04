import { randomUUID } from "crypto";
import { HttpError } from "../utils/http-error";

interface MercadoPagoApiErrorCause {
  code?: string;
  description?: string;
}

interface MercadoPagoApiErrorResponse {
  message?: string;
  cause?: MercadoPagoApiErrorCause[];
  error?: string;
}

export interface MercadoPagoCardOrderInput {
  amountCents: number;
  description: string;
  externalReference: string;
  token: string;
  paymentMethodId: string;
  issuerId?: string | null;
  installments: number;
  payer: {
    email: string;
    firstName: string;
    lastName: string;
    identificationType: "CPF" | "CNPJ";
    identificationNumber: string;
  };
  metadata?: Record<string, unknown>;
}

export interface MercadoPagoOrderStatus {
  orderId: string;
  paymentId: string | null;
  status: string | null;
  statusDetail: string | null;
}

function sanitizeDigits(value: string) {
  return value.replace(/\D+/g, "");
}

function resolveMercadoPagoConfig() {
  const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY?.trim() || null;
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() || null;
  const appOrigin = process.env.APP_ORIGIN?.trim() || null;
  const apiPublicOrigin =
    process.env.API_PUBLIC_ORIGIN?.trim() ||
    process.env.RENDER_EXTERNAL_URL?.trim() ||
    null;
  const enabled = Boolean(publicKey && accessToken);

  return {
    enabled,
    publicKey,
    accessToken,
    notificationUrl:
      enabled && (apiPublicOrigin || appOrigin)
        ? `${(apiPublicOrigin || appOrigin)?.replace(/\/$/, "")}/api/public/store/payments/mercado-pago/webhook`
        : null,
  };
}

function buildFriendlyMercadoPagoMessage(
  payload: MercadoPagoApiErrorResponse | null,
  fallback: string,
) {
  const causeDescription = payload?.cause
    ?.map((cause) => cause.description?.trim())
    .filter(Boolean)
    .join(" ");

  if (causeDescription) {
    return causeDescription;
  }

  if (payload?.message?.trim()) {
    return payload.message.trim();
  }

  if (payload?.error?.trim()) {
    return payload.error.trim();
  }

  return fallback;
}

function parseMercadoPagoOrderStatus(payload: Record<string, unknown> | null) {
  const transactions =
    payload &&
    typeof payload === "object" &&
    "transactions" in payload &&
    payload.transactions &&
    typeof payload.transactions === "object"
      ? (payload.transactions as { payments?: unknown }).payments
      : null;

  const firstPayment =
    Array.isArray(transactions) && transactions.length > 0
      ? (transactions[0] as Record<string, unknown>)
      : null;

  const paymentStatus =
    firstPayment && typeof firstPayment.status === "string"
      ? firstPayment.status
      : null;
  const paymentStatusDetail =
    firstPayment && typeof firstPayment.status_detail === "string"
      ? firstPayment.status_detail
      : firstPayment && typeof firstPayment.statusDetail === "string"
        ? firstPayment.statusDetail
        : null;

  const orderStatus =
    payload && typeof payload.status === "string" ? payload.status : null;
  const orderStatusDetail =
    payload && typeof payload.status_detail === "string"
      ? payload.status_detail
      : payload && typeof payload.statusDetail === "string"
        ? payload.statusDetail
        : null;

  return {
    paymentId:
      firstPayment && firstPayment.id != null ? String(firstPayment.id) : null,
    status: paymentStatus ?? orderStatus,
    statusDetail: paymentStatusDetail ?? orderStatusDetail,
  };
}

export class MercadoPagoService {
  getPublicConfig() {
    const config = resolveMercadoPagoConfig();

    return {
      enabled: config.enabled,
      publicKey: config.publicKey,
    };
  }

  assertConfigured() {
    const config = resolveMercadoPagoConfig();

    if (!config.enabled || !config.accessToken) {
      throw new HttpError(
        503,
        "Pagamento com cartao nao esta disponivel no momento.",
      );
    }

    return config;
  }

  async createCardOrder(input: MercadoPagoCardOrderInput) {
    const config = this.assertConfigured();
    const amount = Number((input.amountCents / 100).toFixed(2));

    const response = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({
        type: "online",
        processing_mode: "automatic",
        external_reference: input.externalReference,
        total_amount: amount.toFixed(2),
        description: input.description,
        notification_url: config.notificationUrl ?? undefined,
        payer: {
          email: input.payer.email.trim(),
          first_name: input.payer.firstName.trim(),
          last_name: input.payer.lastName.trim(),
          identification: {
            type: input.payer.identificationType,
            number: sanitizeDigits(input.payer.identificationNumber),
          },
        },
        transactions: {
          payments: [
            {
              amount: amount.toFixed(2),
              payment_method: {
                id: input.paymentMethodId,
                type: "credit_card",
                token: input.token,
                installments: input.installments,
                issuer_id: input.issuerId?.trim() || undefined,
              },
            },
          ],
        },
        metadata: input.metadata ?? undefined,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | MercadoPagoApiErrorResponse
      | (Record<string, unknown> & {
          id?: string | number;
        })
      | null;

    if (!response.ok) {
      throw new HttpError(
        400,
        buildFriendlyMercadoPagoMessage(
          payload as MercadoPagoApiErrorResponse | null,
          "Nao foi possivel processar o pagamento com cartao.",
        ),
      );
    }

    const orderId =
      payload && typeof payload === "object" && "id" in payload
        ? String(payload.id ?? "")
        : "";

    if (!orderId) {
      throw new HttpError(
        502,
        "Mercado Pago nao devolveu um identificador de order valido.",
      );
    }

    const status = parseMercadoPagoOrderStatus(
      payload as Record<string, unknown> | null,
    );

    return {
      orderId,
      paymentId: status.paymentId,
      status: status.status,
      statusDetail: status.statusDetail,
    } satisfies MercadoPagoOrderStatus;
  }

  async getOrderById(orderId: string): Promise<MercadoPagoOrderStatus> {
    const config = this.assertConfigured();
    const response = await fetch(
      `https://api.mercadopago.com/v1/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
        },
      },
    );

    const payload = (await response.json().catch(() => null)) as
      | MercadoPagoApiErrorResponse
      | (Record<string, unknown> & {
          id?: string | number;
        })
      | null;

    if (!response.ok) {
      throw new HttpError(
        400,
        buildFriendlyMercadoPagoMessage(
          payload as MercadoPagoApiErrorResponse | null,
          "Nao foi possivel consultar a order no Mercado Pago.",
        ),
      );
    }

    const normalizedOrderId =
      payload && typeof payload === "object" && "id" in payload
        ? String(payload.id ?? orderId)
        : orderId;

    const status = parseMercadoPagoOrderStatus(
      payload as Record<string, unknown> | null,
    );

    return {
      orderId: normalizedOrderId,
      paymentId: status.paymentId,
      status: status.status,
      statusDetail: status.statusDetail,
    };
  }

  extractOrderIdFromWebhook(input: {
    query?: Record<string, unknown>;
    body?: Record<string, unknown> | null;
  }) {
    const fromQuery =
      typeof input.query?.["data.id"] === "string"
        ? input.query["data.id"]
        : typeof input.query?.id === "string"
          ? input.query.id
          : null;

    if (fromQuery) {
      return fromQuery;
    }

    const body = input.body ?? {};
    const dataId =
      body &&
      typeof body === "object" &&
      "data" in body &&
      body.data &&
      typeof body.data === "object" &&
      "id" in body.data
        ? String((body.data as { id?: string | number }).id ?? "")
        : "";

    if (dataId) {
      return dataId;
    }

    const resource =
      body && typeof body === "object" && "resource" in body
        ? String(body.resource ?? "")
        : "";

    if (resource) {
      const orderId = resource.split("/").filter(Boolean).at(-1);
      if (orderId) {
        return orderId;
      }
    }

    return null;
  }
}
