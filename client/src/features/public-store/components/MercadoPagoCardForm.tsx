import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string },
    ) => {
      cardForm: (config: Record<string, unknown>) => {
        getCardFormData: () => Record<string, unknown>;
      };
    };
  }
}

interface MercadoPagoCardFormProps {
  publicKey: string;
  amountCents: number;
  customerEmail: string;
  identificationType: "CPF" | "CNPJ";
  identificationNumber: string;
  onReadyChange?: (ready: boolean) => void;
}

export interface MercadoPagoCardFormHandle {
  requestPaymentData: () => Promise<{
    token: string;
    paymentMethodId: string;
    issuerId: string | null;
    installments: number;
    cardholderName: string | null;
    lastFourDigits: string | null;
  }>;
}

let mercadoPagoScriptPromise: Promise<void> | null = null;

function loadMercadoPagoScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Mercado Pago so pode ser carregado no navegador."));
  }

  if (window.MercadoPago) {
    return Promise.resolve();
  }

  if (mercadoPagoScriptPromise) {
    return mercadoPagoScriptPromise;
  }

  mercadoPagoScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://sdk.mercadopago.com/js/v2"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Nao foi possivel carregar o SDK do Mercado Pago.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Nao foi possivel carregar o SDK do Mercado Pago."));
    document.body.appendChild(script);
  });

  return mercadoPagoScriptPromise;
}

export const MercadoPagoCardForm = forwardRef<
  MercadoPagoCardFormHandle,
  MercadoPagoCardFormProps
>(function MercadoPagoCardForm(
  {
    publicKey,
    amountCents,
    customerEmail,
    identificationType,
    identificationNumber,
    onReadyChange,
  },
  ref,
) {
  const reactId = useId();
  const fieldIdPrefix = useMemo(
    () => reactId.replace(/[^a-zA-Z0-9_-]/g, ""),
    [reactId],
  );
  const formId = `${fieldIdPrefix}-mercado-pago-form`;
  const cardFormRef = useRef<{ getCardFormData: () => Record<string, unknown> } | null>(
    null,
  );
  const resolverRef = useRef<{
    resolve: (value: {
      token: string;
      paymentMethodId: string;
      issuerId: string | null;
      installments: number;
      cardholderName: string | null;
      lastFourDigits: string | null;
    }) => void;
    reject: (error: Error) => void;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useImperativeHandle(ref, () => ({
    requestPaymentData: () =>
      new Promise((resolve, reject) => {
        if (!isReady) {
          reject(
            new Error(
              "O formulario do cartao ainda esta carregando. Aguarde alguns segundos.",
            ),
          );
          return;
        }

        resolverRef.current = { resolve, reject };
        const formElement = document.getElementById(formId) as HTMLFormElement | null;
        formElement?.requestSubmit();
      }),
  }));

  useEffect(() => {
    onReadyChange?.(isReady);
  }, [isReady, onReadyChange]);

  useEffect(() => {
    let cancelled = false;
    setIsReady(false);
    setErrorMessage(null);
    cardFormRef.current = null;

    void loadMercadoPagoScript()
      .then(() => {
        if (cancelled || !window.MercadoPago) {
          return;
        }

        const mercadoPago = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        const initializedCardForm = mercadoPago.cardForm({
          amount: (amountCents / 100).toFixed(2),
          iframe: true,
          form: {
            id: formId,
            cardholderName: {
              id: `${fieldIdPrefix}-cardholder-name`,
              placeholder: "Nome impresso no cartao",
            },
            cardNumber: {
              id: `${fieldIdPrefix}-card-number`,
              placeholder: "Numero do cartao",
            },
            expirationDate: {
              id: `${fieldIdPrefix}-expiration-date`,
              placeholder: "MM/AA",
            },
            securityCode: {
              id: `${fieldIdPrefix}-security-code`,
              placeholder: "CVV",
            },
            installments: {
              id: `${fieldIdPrefix}-installments`,
              placeholder: "Parcelas",
            },
            issuer: {
              id: `${fieldIdPrefix}-issuer`,
              placeholder: "Banco emissor",
            },
            identificationType: {
              id: `${fieldIdPrefix}-identification-type`,
            },
            identificationNumber: {
              id: `${fieldIdPrefix}-identification-number`,
              placeholder: "Documento",
            },
            cardholderEmail: {
              id: `${fieldIdPrefix}-cardholder-email`,
              placeholder: "E-mail",
            },
          },
          callbacks: {
            onFormMounted: (error: Error | null) => {
              if (cancelled) {
                return;
              }

              if (error) {
                setErrorMessage(
                  "Nao foi possivel carregar o formulario do cartao. Atualize a pagina e tente novamente.",
                );
                setIsReady(false);
                return;
              }

              setIsReady(true);
            },
            onSubmit: (event: Event) => {
              event.preventDefault();

              const resolver = resolverRef.current;
              resolverRef.current = null;

              if (!resolver) {
                return;
              }

              const paymentData = initializedCardForm.getCardFormData();
              const token =
                typeof paymentData.token === "string" ? paymentData.token : "";
              const paymentMethodId =
                typeof paymentData.paymentMethodId === "string"
                  ? paymentData.paymentMethodId
                  : "";
              const installments = Number(paymentData.installments ?? 0);

              if (!token || !paymentMethodId || !Number.isFinite(installments) || installments <= 0) {
                resolver.reject(
                  new Error(
                    "Revise os dados do cartao e escolha uma opcao de parcelas valida.",
                  ),
                );
                return;
              }

              resolver.resolve({
                token,
                paymentMethodId,
                issuerId:
                  typeof paymentData.issuerId === "string"
                    ? paymentData.issuerId
                    : null,
                installments,
                cardholderName:
                  typeof paymentData.cardholderName === "string"
                    ? paymentData.cardholderName
                    : null,
                lastFourDigits:
                  typeof paymentData.lastFourDigits === "string"
                    ? paymentData.lastFourDigits
                    : null,
              });
            },
            onError: (error: { message?: string } | Error) => {
              const resolver = resolverRef.current;
              resolverRef.current = null;
              resolver?.reject(
                new Error(
                  error instanceof Error
                    ? error.message
                    : error?.message || "Falha ao validar o cartao.",
                ),
              );
            },
          },
        });

        cardFormRef.current = initializedCardForm;
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Falha ao carregar o cartao.");
        setIsReady(false);
      });

    return () => {
      cancelled = true;
      resolverRef.current = null;
      cardFormRef.current = null;
    };
  }, [amountCents, fieldIdPrefix, formId, publicKey]);

  return (
    <div className="space-y-4 rounded-[1.8rem] border border-border/70 bg-background/60 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Pague com cartao</p>
        <p className="text-sm text-muted-foreground">
          Os dados sao enviados com o formulario transparente do Mercado Pago.
        </p>
      </div>

      <form id={formId} className="grid gap-4 md:grid-cols-2">
        <input
          id={`${fieldIdPrefix}-cardholder-email`}
          value={customerEmail}
          readOnly
          className="hidden"
        />
        <input
          id={`${fieldIdPrefix}-identification-type`}
          value={identificationType}
          readOnly
          className="hidden"
        />
        <input
          id={`${fieldIdPrefix}-identification-number`}
          value={identificationNumber}
          readOnly
          className="hidden"
        />

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor={`${fieldIdPrefix}-cardholder-name`}
            className="text-sm font-medium text-foreground"
          >
            Nome impresso no cartao
          </label>
          <input
            id={`${fieldIdPrefix}-cardholder-name`}
            className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none"
            placeholder="Nome impresso no cartao"
          />
        </div>

        {[
          {
            id: `${fieldIdPrefix}-card-number`,
            label: "Numero do cartao",
            column: "md:col-span-2",
          },
          {
            id: `${fieldIdPrefix}-expiration-date`,
            label: "Validade",
            column: "",
          },
          {
            id: `${fieldIdPrefix}-security-code`,
            label: "CVV",
            column: "",
          },
          {
            id: `${fieldIdPrefix}-issuer`,
            label: "Banco emissor",
            column: "",
          },
          {
            id: `${fieldIdPrefix}-installments`,
            label: "Parcelas",
            column: "",
          },
        ].map((field) => (
          <div key={field.id} className={`space-y-2 ${field.column}`.trim()}>
            <label className="text-sm font-medium text-foreground">{field.label}</label>
            <div
              id={field.id}
              className="flex h-12 items-center rounded-2xl border border-border bg-card px-4 text-sm text-foreground"
            />
          </div>
        ))}
      </form>

      {errorMessage ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
});
