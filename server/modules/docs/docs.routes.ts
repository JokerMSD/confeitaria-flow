import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

type Parameter = {
  name: string;
  in: "query" | "path";
  required?: boolean;
  description?: string;
  schema: Record<string, unknown>;
};

type Operation = {
  tags: string[];
  summary: string;
  description?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: Parameter[];
  requestBody?: {
    required?: boolean;
    content: Record<string, unknown>;
  };
  responses?: Record<string, unknown>;
};

function jsonBody(schemaRef: string, example?: unknown) {
  return {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: schemaRef },
        ...(example ? { example } : {}),
      },
    },
  };
}

function jsonResponse(description: string, schemaRef?: string) {
  return {
    description,
    content: {
      "application/json": schemaRef
        ? {
            schema: { $ref: schemaRef },
          }
        : {
            schema: {
              type: "object",
              additionalProperties: true,
            },
          },
    },
  };
}

function authResponses() {
  return {
    "401": jsonResponse("Autenticacao obrigatoria.", "#/components/schemas/ErrorResponse"),
  };
}

function staffResponses() {
  return {
    ...authResponses(),
    "403": jsonResponse("Acesso restrito para equipe.", "#/components/schemas/ErrorResponse"),
  };
}

function buildOpenApiDocument() {
  const sessionAuth = [{ SessionCookieAuth: [] }];
  const botAuth = [{ BotBearerAuth: [] }];

  const paths: Record<string, Record<string, Operation>> = {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Verifica se a API esta online",
        responses: {
          "200": jsonResponse("API online", "#/components/schemas/HealthResponse"),
        },
      },
    },
    "/api/docs.json": {
      get: {
        tags: ["Docs"],
        summary: "OpenAPI JSON da API",
        responses: {
          "200": jsonResponse("Documento OpenAPI"),
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Cria conta com verificacao por e-mail",
        requestBody: jsonBody("#/components/schemas/AuthRegisterRequest"),
        responses: {
          "200": jsonResponse("Conta criada ou solicitacao aceita"),
          "400": jsonResponse("Payload invalido", "#/components/schemas/ErrorResponse"),
          "503": jsonResponse("Servico de envio de e-mail indisponivel", "#/components/schemas/ErrorResponse"),
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Efetua login",
        requestBody: jsonBody("#/components/schemas/AuthLoginRequest"),
        responses: {
          "200": jsonResponse("Sessao iniciada"),
          "400": jsonResponse("Payload invalido", "#/components/schemas/ErrorResponse"),
          "401": jsonResponse("Credenciais invalidas", "#/components/schemas/ErrorResponse"),
        },
      },
    },
    "/api/auth/verify-email": {
      post: {
        tags: ["Auth"],
        summary: "Confirma o e-mail da conta",
        requestBody: jsonBody("#/components/schemas/AuthVerifyEmailRequest"),
        responses: {
          "200": jsonResponse("Conta verificada"),
          "400": jsonResponse("Token invalido", "#/components/schemas/ErrorResponse"),
        },
      },
    },
    "/api/auth/resend-verification-email": {
      post: {
        tags: ["Auth"],
        summary: "Reenvia o e-mail de verificacao",
        requestBody: jsonBody("#/components/schemas/AuthResendVerificationRequest"),
        responses: {
          "200": jsonResponse("Reenvio solicitado"),
          "400": jsonResponse("Payload invalido", "#/components/schemas/ErrorResponse"),
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Retorna a sessao atual",
        security: sessionAuth,
        responses: {
          "200": jsonResponse("Usuario atual"),
          ...authResponses(),
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Encerra a sessao atual",
        security: sessionAuth,
        responses: {
          "200": jsonResponse("Sessao encerrada"),
        },
      },
    },
    "/webhooks/whatsapp": {
      get: {
        tags: ["WhatsApp Webhook"],
        summary: "Handshake de verificacao da Meta",
        parameters: [
          { name: "hub.mode", in: "query", schema: { type: "string", example: "subscribe" } },
          { name: "hub.verify_token", in: "query", schema: { type: "string", example: "seu-token" } },
          { name: "hub.challenge", in: "query", schema: { type: "string", example: "123456789" } },
        ],
        responses: {
          "200": {
            description: "Token valido; challenge retornado em texto puro",
            content: {
              "text/plain": {
                schema: { type: "string", example: "123456789" },
              },
            },
          },
          "403": jsonResponse("Falha na verificacao", "#/components/schemas/ErrorResponse"),
        },
      },
      post: {
        tags: ["WhatsApp Webhook"],
        summary: "Recebe eventos do WhatsApp e encaminha so mensagens reais ao n8n",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/WhatsAppMessagePayload" },
                  { $ref: "#/components/schemas/WhatsAppStatusPayload" },
                ],
              },
            },
          },
        },
        responses: {
          "200": jsonResponse("Evento recebido"),
        },
      },
    },
    "/api/public/store": {
      get: {
        tags: ["Public Store"],
        summary: "Home e resumo comercial da loja publica",
        responses: { "200": jsonResponse("Resumo publico da loja") },
      },
    },
    "/api/public/store/payment-config": {
      get: {
        tags: ["Public Store"],
        summary: "Config de pagamento da loja publica",
        responses: { "200": jsonResponse("Configuracao publica de pagamento") },
      },
    },
    "/api/public/store/availability": {
      get: {
        tags: ["Public Store"],
        summary: "Datas e horarios disponiveis para entrega ou retirada",
        parameters: [
          {
            name: "deliveryMode",
            in: "query",
            required: true,
            schema: { type: "string", enum: ["Entrega", "Retirada"] },
          },
          { name: "selectedDate", in: "query", schema: { type: "string", example: "2026-04-10" } },
        ],
        responses: { "200": jsonResponse("Disponibilidade publica") },
      },
    },
    "/api/public/store/products": {
      get: {
        tags: ["Public Store"],
        summary: "Lista produtos do catalogo publico",
        responses: { "200": jsonResponse("Produtos publicos") },
      },
    },
    "/api/public/store/products/{id}": {
      get: {
        tags: ["Public Store"],
        summary: "Detalhe de produto publico",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": jsonResponse("Detalhe do produto"),
          "404": jsonResponse("Produto nao encontrado", "#/components/schemas/ErrorResponse"),
        },
      },
    },
    "/api/public/store/checkout/preview": {
      post: {
        tags: ["Public Store"],
        summary: "Simula preco final do checkout publico",
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Preview do checkout"), "400": jsonResponse("Payload invalido", "#/components/schemas/ErrorResponse") },
      },
    },
    "/api/public/store/checkout": {
      post: {
        tags: ["Public Store"],
        summary: "Cria pedido pelo checkout publico",
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Pedido criado"), "400": jsonResponse("Payload invalido", "#/components/schemas/ErrorResponse") },
      },
    },
    "/api/public/store/payments/mercado-pago/webhook": {
      get: { tags: ["Payments"], summary: "Webhook Mercado Pago via GET", responses: { "200": jsonResponse("Webhook recebido") } },
      post: { tags: ["Payments"], summary: "Webhook Mercado Pago via POST", responses: { "200": jsonResponse("Webhook recebido") } },
    },
    "/api/bot/store-summary": {
      get: {
        tags: ["Bot"],
        summary: "Resumo da loja para o bot",
        security: botAuth,
        responses: { "200": jsonResponse("Resumo da loja"), "401": jsonResponse("Token do bot invalido", "#/components/schemas/ErrorResponse") },
      },
    },
    "/api/bot/products/{id}": {
      get: {
        tags: ["Bot"],
        summary: "Detalhe de produto para o bot",
        security: botAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Detalhe do produto"), "401": jsonResponse("Token do bot invalido", "#/components/schemas/ErrorResponse") },
      },
    },
    "/api/bot/availability": {
      get: {
        tags: ["Bot"],
        summary: "Disponibilidade de entrega ou retirada para o bot",
        security: botAuth,
        parameters: [
          { name: "deliveryMode", in: "query", required: true, schema: { type: "string", enum: ["Entrega", "Retirada"] } },
          { name: "selectedDate", in: "query", schema: { type: "string", example: "2026-04-10" } },
        ],
        responses: { "200": jsonResponse("Disponibilidade do bot") },
      },
    },
    "/api/bot/order-status": {
      post: {
        tags: ["Bot"],
        summary: "Consulta status de pedidos por telefone",
        security: botAuth,
        requestBody: jsonBody("#/components/schemas/BotOrderStatusRequest"),
        responses: { "200": jsonResponse("Pedidos encontrados") },
      },
    },
    "/api/bot/checkout-link": {
      post: {
        tags: ["Bot"],
        summary: "Retorna link de checkout ou produto",
        security: botAuth,
        requestBody: jsonBody("#/components/schemas/BotCheckoutLinkRequest"),
        responses: { "200": jsonResponse("Link retornado") },
      },
    },
    "/api/tts/voice-note": {
      post: {
        tags: ["TTS"],
        summary: "Gera voice note ogg/opus para WhatsApp",
        security: botAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TtsVoiceNoteRequest" },
              examples: {
                jsonValido: {
                  summary: "JSON valido",
                  value: {
                    text: "Ola! Seja bem-vindo a Universo Doce! Como posso ajudar hoje?",
                  },
                },
                jsonComQuebraEscapada: {
                  summary: "JSON com quebra de linha escapada",
                  value: {
                    text: "Ola! Seja bem-vindo a Universo Doce!\\n\\nComo posso ajudar hoje?",
                  },
                },
              },
            },
            "text/plain": {
              schema: {
                type: "string",
                example: "Ola! Seja bem-vindo a Universo Doce!\n\nComo posso ajudar hoje?",
              },
            },
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                    example: "Ola! Seja bem-vindo a Universo Doce! Como posso ajudar hoje?",
                  },
                },
                required: ["text"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Audio gerado", content: { "audio/ogg": { schema: { type: "string", format: "binary" } } } },
          "400": jsonResponse("Texto invalido", "#/components/schemas/ErrorResponse"),
          "401": jsonResponse("Token do bot invalido", "#/components/schemas/ErrorResponse"),
          "502": jsonResponse("Falha na geracao do audio", "#/components/schemas/ErrorResponse"),
        },
      },
    },
    "/api/account": {
      get: {
        tags: ["Account"],
        summary: "Perfil da conta logada",
        security: sessionAuth,
        responses: { "200": jsonResponse("Perfil da conta"), ...authResponses() },
      },
    },
    "/api/account/orders": {
      get: {
        tags: ["Account"],
        summary: "Pedidos da conta logada",
        security: sessionAuth,
        responses: { "200": jsonResponse("Pedidos da conta"), ...authResponses() },
      },
    },
    "/api/account/profile": {
      put: {
        tags: ["Account"],
        summary: "Atualiza nome e dados basicos da conta",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Perfil atualizado"), ...authResponses() },
      },
    },
    "/api/account/password": {
      put: {
        tags: ["Account"],
        summary: "Altera a senha da conta logada",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Senha alterada"), ...authResponses() },
      },
    },
    "/api/account/photo": {
      post: {
        tags: ["Account"],
        summary: "Atualiza foto da conta logada",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Foto atualizada"), ...authResponses() },
      },
    },
    "/api/orders": {
      get: {
        tags: ["Orders"],
        summary: "Lista pedidos internos",
        security: sessionAuth,
        responses: { "200": jsonResponse("Lista de pedidos"), ...staffResponses() },
      },
      post: {
        tags: ["Orders"],
        summary: "Cria pedido interno",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Pedido criado"), ...staffResponses() },
      },
    },
    "/api/orders/lookup": {
      get: {
        tags: ["Orders"],
        summary: "Busca rapida de pedidos",
        security: sessionAuth,
        responses: { "200": jsonResponse("Resultado da busca"), ...staffResponses() },
      },
    },
    "/api/orders/queue": {
      get: {
        tags: ["Orders"],
        summary: "Fila operacional de pedidos",
        security: sessionAuth,
        responses: { "200": jsonResponse("Fila operacional"), ...staffResponses() },
      },
    },
    "/api/orders/dashboard-summary": {
      get: {
        tags: ["Orders"],
        summary: "Resumo das metricas do dashboard",
        security: sessionAuth,
        responses: { "200": jsonResponse("Resumo do dashboard"), ...staffResponses() },
      },
    },
    "/api/orders/dashboard-drilldown": {
      get: {
        tags: ["Orders"],
        summary: "Detalhamento dos cards do dashboard",
        security: sessionAuth,
        parameters: [
          { name: "kind", in: "query", required: true, schema: { type: "string", example: "today" } },
          { name: "dateFrom", in: "query", required: true, schema: { type: "string", example: "2026-04-01" } },
          { name: "dateTo", in: "query", required: true, schema: { type: "string", example: "2026-04-07" } },
        ],
        responses: { "200": jsonResponse("Pedidos do card"), ...staffResponses() },
      },
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Detalhe de pedido",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Detalhe do pedido"), ...staffResponses() },
      },
      put: {
        tags: ["Orders"],
        summary: "Atualiza pedido",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Pedido atualizado"), ...staffResponses() },
      },
      delete: {
        tags: ["Orders"],
        summary: "Remove pedido",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Pedido removido"), ...staffResponses() },
      },
    },
    "/api/orders/{id}/confirm": {
      post: {
        tags: ["Orders"],
        summary: "Confirma pedido",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Pedido confirmado"), ...staffResponses() },
      },
    },
    "/api/orders/{id}/status": {
      post: {
        tags: ["Orders"],
        summary: "Atualiza status do pedido",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Status atualizado"), ...staffResponses() },
      },
    },
    "/api/customers": {
      get: {
        tags: ["Customers"],
        summary: "Lista clientes",
        security: sessionAuth,
        responses: { "200": jsonResponse("Clientes"), ...staffResponses() },
      },
      post: {
        tags: ["Customers"],
        summary: "Cria cliente",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Cliente criado"), ...staffResponses() },
      },
    },
    "/api/customers/{id}": {
      get: {
        tags: ["Customers"],
        summary: "Detalhe de cliente",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Detalhe do cliente"), ...staffResponses() },
      },
      put: {
        tags: ["Customers"],
        summary: "Atualiza cliente",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Cliente atualizado"), ...staffResponses() },
      },
      delete: {
        tags: ["Customers"],
        summary: "Exclui cliente",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Cliente removido"), ...staffResponses() },
      },
    },
    "/api/customers/{id}/deactivate": {
      post: {
        tags: ["Customers"],
        summary: "Desativa cliente",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Cliente desativado"), ...staffResponses() },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Lista usuarios internos",
        security: sessionAuth,
        responses: { "200": jsonResponse("Usuarios"), ...staffResponses() },
      },
      post: {
        tags: ["Users"],
        summary: "Cria usuario interno",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Usuario criado"), ...staffResponses() },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Detalhe de usuario",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Detalhe do usuario"), ...staffResponses() },
      },
      put: {
        tags: ["Users"],
        summary: "Atualiza usuario",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Usuario atualizado"), ...staffResponses() },
      },
      delete: {
        tags: ["Users"],
        summary: "Exclui usuario",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Usuario removido"), ...staffResponses() },
      },
    },
    "/api/users/{id}/activate": {
      post: {
        tags: ["Users"],
        summary: "Ativa usuario",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Usuario ativado"), ...staffResponses() },
      },
    },
    "/api/users/{id}/deactivate": {
      post: {
        tags: ["Users"],
        summary: "Desativa usuario",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Usuario desativado"), ...staffResponses() },
      },
    },
    "/api/recipes": {
      get: {
        tags: ["Recipes"],
        summary: "Lista receitas",
        security: sessionAuth,
        responses: { "200": jsonResponse("Receitas"), ...staffResponses() },
      },
      post: {
        tags: ["Recipes"],
        summary: "Cria receita",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Receita criada"), ...staffResponses() },
      },
    },
    "/api/recipes/catalog-media": {
      get: {
        tags: ["Recipes"],
        summary: "Lista midias administrativas do catalogo",
        security: sessionAuth,
        responses: { "200": jsonResponse("Midias do catalogo"), ...staffResponses() },
      },
      post: {
        tags: ["Recipes"],
        summary: "Cadastra midia de produto ou variacao",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Midia cadastrada"), ...staffResponses() },
      },
    },
    "/api/recipes/lookup": {
      get: {
        tags: ["Recipes"],
        summary: "Lookup rapido de receitas por tipo",
        security: sessionAuth,
        parameters: [{ name: "kind", in: "query", schema: { type: "string", example: "product" } }],
        responses: { "200": jsonResponse("Lookup de receitas"), ...staffResponses() },
      },
    },
    "/api/recipes/{id}": {
      get: {
        tags: ["Recipes"],
        summary: "Detalhe de receita",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Detalhe da receita"), ...staffResponses() },
      },
      put: {
        tags: ["Recipes"],
        summary: "Atualiza receita",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Receita atualizada"), ...staffResponses() },
      },
      delete: {
        tags: ["Recipes"],
        summary: "Exclui receita",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Receita removida"), ...staffResponses() },
      },
    },
    "/api/recipes/catalog-media/{mediaId}": {
      delete: {
        tags: ["Recipes"],
        summary: "Remove midia do catalogo",
        security: sessionAuth,
        parameters: [{ name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Midia removida"), ...staffResponses() },
      },
    },
    "/api/product-additionals": {
      get: {
        tags: ["Product Additionals"],
        summary: "Lista grupos de adicionais",
        security: sessionAuth,
        responses: { "200": jsonResponse("Grupos de adicionais"), ...staffResponses() },
      },
      post: {
        tags: ["Product Additionals"],
        summary: "Cria grupo de adicionais",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Grupo criado"), ...staffResponses() },
      },
    },
    "/api/product-additionals/{id}": {
      get: {
        tags: ["Product Additionals"],
        summary: "Detalhe de grupo de adicionais",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Detalhe do grupo"), ...staffResponses() },
      },
      put: {
        tags: ["Product Additionals"],
        summary: "Atualiza grupo de adicionais",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Grupo atualizado"), ...staffResponses() },
      },
      delete: {
        tags: ["Product Additionals"],
        summary: "Remove grupo de adicionais",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Grupo removido"), ...staffResponses() },
      },
    },
    "/api/discount-coupons": {
      get: {
        tags: ["Discount Coupons"],
        summary: "Lista cupons de desconto",
        security: sessionAuth,
        responses: { "200": jsonResponse("Cupons"), ...staffResponses() },
      },
      post: {
        tags: ["Discount Coupons"],
        summary: "Cria cupom de desconto",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Cupom criado"), ...staffResponses() },
      },
    },
    "/api/discount-coupons/{id}": {
      get: {
        tags: ["Discount Coupons"],
        summary: "Detalhe de cupom",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Detalhe do cupom"), ...staffResponses() },
      },
      put: {
        tags: ["Discount Coupons"],
        summary: "Atualiza cupom",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Cupom atualizado"), ...staffResponses() },
      },
    },
    "/api/inventory-items": {
      get: {
        tags: ["Inventory"],
        summary: "Lista itens de estoque",
        security: sessionAuth,
        responses: { "200": jsonResponse("Itens de estoque"), ...staffResponses() },
      },
      post: {
        tags: ["Inventory"],
        summary: "Cria item de estoque",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Item criado"), ...staffResponses() },
      },
    },
    "/api/inventory-items/purchase-plan": {
      get: {
        tags: ["Inventory"],
        summary: "Plano de compra sugerido",
        security: sessionAuth,
        responses: { "200": jsonResponse("Plano de compra"), ...staffResponses() },
      },
    },
    "/api/inventory-items/{id}": {
      get: {
        tags: ["Inventory"],
        summary: "Detalhe de item de estoque",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Detalhe do item"), ...staffResponses() },
      },
      put: {
        tags: ["Inventory"],
        summary: "Atualiza item de estoque",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Item atualizado"), ...staffResponses() },
      },
      delete: {
        tags: ["Inventory"],
        summary: "Exclui item de estoque",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Item removido"), ...staffResponses() },
      },
    },
    "/api/inventory-items/receipt-import/analyze": {
      post: {
        tags: ["Inventory"],
        summary: "Analisa imagem da nota e sugere entradas de estoque",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Analise concluida"), ...staffResponses() },
      },
    },
    "/api/inventory-items/receipt-import/confirm": {
      post: {
        tags: ["Inventory"],
        summary: "Confirma a importacao da nota para estoque",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Importacao confirmada"), ...staffResponses() },
      },
    },
    "/api/inventory-movements": {
      get: {
        tags: ["Inventory"],
        summary: "Lista movimentacoes de estoque",
        security: sessionAuth,
        responses: { "200": jsonResponse("Movimentacoes"), ...staffResponses() },
      },
      post: {
        tags: ["Inventory"],
        summary: "Cria movimentacao manual de estoque",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Movimentacao criada"), ...staffResponses() },
      },
    },
    "/api/inventory-movements/{id}": {
      get: {
        tags: ["Inventory"],
        summary: "Detalhe de movimentacao",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Detalhe da movimentacao"), ...staffResponses() },
      },
    },
    "/api/production/forecast": {
      get: {
        tags: ["Production"],
        summary: "Forecast operacional de producao",
        security: sessionAuth,
        parameters: [
          { name: "dateFrom", in: "query", schema: { type: "string", example: "2026-04-01" } },
          { name: "dateTo", in: "query", schema: { type: "string", example: "2026-04-07" } },
        ],
        responses: { "200": jsonResponse("Forecast de producao"), ...staffResponses() },
      },
    },
    "/api/cash-summary": {
      get: {
        tags: ["Cash"],
        summary: "Resumo do caixa",
        security: sessionAuth,
        responses: { "200": jsonResponse("Resumo do caixa"), ...staffResponses() },
      },
    },
    "/api/cash-transactions": {
      get: {
        tags: ["Cash"],
        summary: "Lista transacoes do caixa",
        security: sessionAuth,
        responses: { "200": jsonResponse("Transacoes do caixa"), ...staffResponses() },
      },
      post: {
        tags: ["Cash"],
        summary: "Cria transacao manual no caixa",
        security: sessionAuth,
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Transacao criada"), ...staffResponses() },
      },
    },
    "/api/cash-transactions/{id}": {
      get: {
        tags: ["Cash"],
        summary: "Detalhe de transacao do caixa",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Detalhe da transacao"), ...staffResponses() },
      },
      put: {
        tags: ["Cash"],
        summary: "Atualiza transacao do caixa",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: jsonBody("#/components/schemas/GenericDataRequest"),
        responses: { "200": jsonResponse("Transacao atualizada"), ...staffResponses() },
      },
      delete: {
        tags: ["Cash"],
        summary: "Remove transacao do caixa",
        security: sessionAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Transacao removida"), ...staffResponses() },
      },
    },
  };

  return {
    openapi: "3.0.3",
    info: {
      title: "Confeitaria Flow API",
      version: "1.0.0",
      description:
        "Documentacao navegavel para teste e inspecao manual das rotas principais do backend.",
    },
    servers: [{ url: "/", description: "Servidor atual" }],
    tags: [
      { name: "Docs" }, { name: "Health" }, { name: "Auth" }, { name: "WhatsApp Webhook" },
      { name: "Public Store" }, { name: "Payments" }, { name: "Bot" }, { name: "TTS" },
      { name: "Account" }, { name: "Orders" }, { name: "Customers" }, { name: "Users" },
      { name: "Recipes" }, { name: "Product Additionals" }, { name: "Discount Coupons" },
      { name: "Inventory" }, { name: "Production" }, { name: "Cash" },
    ],
    components: {
      securitySchemes: {
        BotBearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "Token",
          description: "Use o mesmo BOT_API_TOKEN configurado no backend.",
        },
        SessionCookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
          description: "Sessao autenticada do painel interno.",
        },
      },
      schemas: {
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Authentication required." },
          },
        },
        GenericDataRequest: {
          type: "object",
          properties: { data: { type: "object", additionalProperties: true } },
          required: ["data"],
        },
        AuthLoginRequest: {
          type: "object",
          properties: { data: { type: "object", properties: {
            email: { type: "string", example: "admin@exemplo.com" },
            password: { type: "string", example: "admin123" },
          }, required: ["email", "password"] } },
          required: ["data"],
        },
        AuthRegisterRequest: {
          type: "object",
          properties: { data: { type: "object", properties: {
            name: { type: "string", example: "Igor Silva" },
            email: { type: "string", example: "igor@email.com" },
            password: { type: "string", example: "senha12345" },
            confirmPassword: { type: "string", example: "senha12345" },
          }, required: ["name", "email", "password", "confirmPassword"] } },
          required: ["data"],
        },
        AuthVerifyEmailRequest: {
          type: "object",
          properties: { data: { type: "object", properties: { token: { type: "string", example: "token-de-verificacao" } }, required: ["token"] } },
          required: ["data"],
        },
        AuthResendVerificationRequest: {
          type: "object",
          properties: { data: { type: "object", properties: { email: { type: "string", example: "igor@email.com" } }, required: ["email"] } },
          required: ["data"],
        },
        WhatsAppStatusPayload: {
          type: "object",
          example: { object: "whatsapp_business_account", entry: [{ changes: [{ value: { statuses: [{ status: "delivered" }] } }] }] },
        },
        WhatsAppMessagePayload: {
          type: "object",
          example: { object: "whatsapp_business_account", entry: [{ changes: [{ value: { messages: [{ from: "5531999990000", type: "text", text: { body: "oi, quero encomendar" } }] } }] }] },
        },
        BotOrderStatusRequest: {
          type: "object",
          properties: { data: { type: "object", properties: {
            customerPhone: { type: "string", example: "31999990000" },
            orderNumber: { type: "string", nullable: true, example: "PED-000123" },
            limit: { type: "integer", minimum: 1, maximum: 10, example: 3 },
          }, required: ["customerPhone"] } },
          required: ["data"],
        },
        BotCheckoutLinkRequest: {
          type: "object",
          properties: { data: { type: "object", properties: {
            productId: { type: "string", format: "uuid", nullable: true, example: "11111111-1111-1111-1111-111111111111" },
          } } },
          required: ["data"],
        },
        TtsVoiceNoteRequest: {
          type: "object",
          properties: { text: { type: "string", example: "Ola! Como posso ajudar com seu pedido hoje?", maxLength: 1200 } },
          required: ["text"],
        },
      },
    },
    paths,
  };
}

export function registerDocsRoutes(app: Express) {
  const document = buildOpenApiDocument();

  app.get("/api/docs.json", (_req, res) => {
    res.json(document);
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: "Confeitaria Flow API Docs",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
      customCss: `
        .topbar { display: none; }
        .swagger-ui .info { margin-bottom: 24px; }
      `,
    }),
  );
}
