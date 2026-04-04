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

export interface MercadoPagoCardPaymentInput {
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

export interface MercadoPagoPayment {
  id: string;
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

  async createCardPayment(input: MercadoPagoCardPaymentInput) {
    const config = this.assertConfigured();
    const amount = Number((input.amountCents / 100).toFixed(2));

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: amount,
        token: input.token,
        description: input.description,
        installments: input.installments,
        payment_method_id: input.paymentMethodId,
        issuer_id: input.issuerId?.trim() || undefined,
        external_reference: input.externalReference,
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
        metadata: input.metadata ?? undefined,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | MercadoPagoApiErrorResponse
      | (Record<string, unknown> & {
          id?: string | number;
          status?: string;
          status_detail?: string;
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

    const paymentId =
      payload && typeof payload === "object" && "id" in payload
        ? String(payload.id)
        : "";

    if (!paymentId) {
      throw new HttpError(
        502,
        "Mercado Pago nao devolveu um identificador de pagamento valido.",
      );
    }

    return {
      id: paymentId,
      status:
        payload && typeof payload === "object" && "status" in payload
          ? String(payload.status ?? "")
          : null,
      statusDetail:
        payload && typeof payload === "object" && "status_detail" in payload
          ? String(payload.status_detail ?? "")
          : null,
    } satisfies MercadoPagoPayment;
  }

  async getPaymentById(paymentId: string): Promise<MercadoPagoPayment> {
    const config = this.assertConfigured();
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
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
          status?: string;
          status_detail?: string;
        })
      | null;

    if (!response.ok) {
      throw new HttpError(
        400,
        buildFriendlyMercadoPagoMessage(
          payload as MercadoPagoApiErrorResponse | null,
          "Nao foi possivel consultar o pagamento no Mercado Pago.",
        ),
      );
    }

    return {
      id:
        payload && typeof payload === "object" && "id" in payload
          ? String(payload.id)
          : paymentId,
      status:
        payload && typeof payload === "object" && "status" in payload
          ? String(payload.status ?? "")
          : null,
      statusDetail:
        payload && typeof payload === "object" && "status_detail" in payload
          ? String(payload.status_detail ?? "")
          : null,
    };
  }

  extractPaymentIdFromWebhook(input: {
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
      const paymentId = resource.split("/").filter(Boolean).at(-1);
      if (paymentId) {
        return paymentId;
      }
    }

    return null;
  }
}
