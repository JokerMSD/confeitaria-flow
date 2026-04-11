# Bot WhatsApp via n8n

## Objetivo

Usar o `n8n` como orquestrador do atendimento via WhatsApp, com o backend do `confeitaria-flow` como autoridade para:

- vitrine de produtos
- sabores e adicionais
- disponibilidade de entrega e retirada
- status de pedido
- links de compra

O bot deve consultar e orientar. Acoes criticas continuam no backend.

## Endpoints do bot

Todos os endpoints usam:

- header `Authorization: Bearer <BOT_API_TOKEN>`

Rotas:

- `GET /api/bot/store-summary`
- `GET /api/bot/products/:id`
- `GET /api/bot/availability?deliveryMode=Entrega|Retirada&selectedDate=YYYY-MM-DD`
- `POST /api/bot/order-status`
- `POST /api/bot/checkout-link`
- `POST /api/tts/voice-note`

Documentacao dedicada do TTS:

- `docs/runbooks/tts-api.md`

## Variaveis do backend

No backend, configure:

```env
BOT_API_TOKEN=um-token-forte-para-o-n8n
APP_ORIGIN=https://confeitaria-flow.vercel.app
API_PUBLIC_ORIGIN=https://confeitaria-flow.onrender.com
```

## Variaveis sugeridas no n8n

```env
BACKEND_BASE_URL=https://confeitaria-flow.onrender.com
BOT_API_TOKEN=mesmo-token-do-backend
OPENAI_API_KEY=<sua-chave-openai>
WHATSAPP_PHONE_NUMBER_ID=<id-do-numero-whatsapp>
WHATSAPP_ACCESS_TOKEN=<token-da-cloud-api>
WHATSAPP_VERIFY_TOKEN=<token-do-webhook>
```

## Checklist de conexao com WhatsApp

1. Criar app no Meta Developers.
2. Ativar `WhatsApp Business Cloud API`.
3. Obter:
   - `Phone Number ID`
   - `Access Token`
   - webhook URL do n8n
4. Configurar o webhook do WhatsApp para apontar ao fluxo do n8n.
5. Validar recebimento de texto antes de ativar audio.

## Checklist de conexao com OpenAI

1. Criar credencial `OpenAI` no n8n.
2. Ligar o node de agente ou chat ao fluxo.
3. Para audio, adicionar node de `Generate Audio`.
4. Usar voz comercial curta e respostas objetivas.

## Workflow base

Arquivo importavel:

- `docs/runbooks/n8n-whatsapp-bot.workflow.json`

O workflow base faz:

1. recebe payload de exemplo
2. roteia por intencao
3. consulta o backend
4. entrega o payload para um placeholder de agente

## Proximo encaixe no n8n

Substituir:

- `Manual Trigger` por `WhatsApp Trigger` ou webhook oficial do seu fluxo
- `Placeholder Agente` por:
  - um agent/chat node com OpenAI
  - opcionalmente uma chamada ao `POST /api/tts/voice-note`
  - envio final via WhatsApp Cloud

## Intencoes recomendadas

- `catalogo`
- `produto`
- `disponibilidade`
- `status`
- `checkout`

## Regra de seguranca

O bot nao deve:

- confirmar pagamento sozinho
- alterar estoque
- mudar status de pedido
- inventar preco ou disponibilidade

Sempre consultar o backend antes de responder algo operacional.
