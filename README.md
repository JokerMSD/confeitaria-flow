# Confeitaria Flow

Monolito para operacao de confeitaria com frontend React + Vite, backend Express e PostgreSQL. O sistema cobre operacao interna, frente publica da loja e integracoes de dominio entre pedidos, clientes, estoque, producao e caixa.

## Visao geral

- painel interno para `admin` e `operador`
- frente publica para visitantes e usuarios com role `user`
- pedidos com entrega ou retirada, ate 3 recheios e adicionais estruturados
- clientes com historico comercial e sincronizacao com pedidos
- estoque com ledger de movimentacoes, custo medio e consumo por receita
- fila operacional por data e horario
- previsao de producao por pedidos confirmados e receitas
- caixa com recebimentos de pedidos e compras reais declaradas
- loja publica com catalogo, carrinho, checkout em Pix manual ou cartao com Mercado Pago e area de conta

## Stack

- `client/`: React 19 + Vite + TanStack Query
- `server/`: Express 5 + TypeScript
- `shared/`: tipos, schema e validadores compartilhados
- `migrations/`: migrations SQL aplicadas no runtime e no banco
- PostgreSQL + Drizzle ORM

## Arquitetura

- backend e banco sao a autoridade do dominio
- frontend consome contratos tipados e usa adapters para compatibilidade de UI
- regras comerciais e funcionais vivem em [docs/product-rules.md](./docs/product-rules.md)
- estado operacional atual vive em [docs/context/current-state.md](./docs/context/current-state.md)
- docs de dominio e runbooks devem ser lidos sob demanda

## Modulos atuais

- pedidos, fila e checkout com `deliveryMode` coerente de ponta a ponta
- clientes com total gasto, ultimo pedido, pedidos em aberto e busca
- usuarios persistidos com roles `admin`, `operador` e `user`
- estoque com movimentacoes auditaveis e aviso de concorrencia por `updatedAt`
- fila e edicao de pedidos com protecao otimista contra sobrescrita entre sessoes
- previsao de producao com filtros por periodo
- loja publica branded com modo claro e escuro

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL

## Variaveis de ambiente

- `DATABASE_URL`: obrigatoria para a API
- `SESSION_SECRET`: obrigatoria em producao
- `APP_ORIGIN`: origem principal da aplicacao
- `CORS_ORIGINS`: lista de origins permitidas
- `VITE_API_URL`: opcional no frontend; em dev usa `http://localhost:3001`
- `SESSION_COOKIE_SECURE=true`: para deploy HTTPS
- `AUTH_USERS_JSON`: fallback de auth simples apenas quando ainda nao existem usuarios ativos persistidos no banco
- `MERCADO_PAGO_PUBLIC_KEY`: chave publica do checkout transparente
- `MERCADO_PAGO_ACCESS_TOKEN`: token privado para criar e consultar pagamentos

## Desenvolvimento

Executa frontend e backend juntos:

```bash
npm run dev
```

Endpoints locais:

- app: `http://localhost:3000`
- api: `http://localhost:3001`

Executar separado:

```bash
npm run app
npm run api
```

## Build e verificacao

```bash
npm run check
npm run build
npm run test
```

Rodar a aplicacao compilada:

```bash
npm start
```

Rodar so a API compilada:

```bash
npm run start:api
```

## Scripts uteis

```bash
npm run db:push
npm run backfill:order-customers
npm run backfill:legacy-order-recipes
```

## Documentacao

- estado atual: [docs/context/current-state.md](./docs/context/current-state.md)
- regras de negocio: [docs/product-rules.md](./docs/product-rules.md)
- dominio de pedidos: [docs/domains/orders.md](./docs/domains/orders.md)
- dominio de clientes: [docs/domains/customers.md](./docs/domains/customers.md)
- dominio de estoque: [docs/domains/inventory.md](./docs/domains/inventory.md)
- dominio da loja publica: [docs/domains/public-store.md](./docs/domains/public-store.md)
- dominio de producao: [docs/domains/production.md](./docs/domains/production.md)
- deploy: [docs/runbooks/deploy.md](./docs/runbooks/deploy.md)

## Observacoes operacionais

- o startup da API valida schema e pode aplicar migrations SQL antes de subir
- pedidos legados ainda podem exigir backfills de clientes e receitas
- o checkout publico pode usar Pix manual ou cartao via Mercado Pago; o webhook precisa apontar para `/api/public/store/payments/mercado-pago/webhook`
- a protecao de concorrencia atual e otimista: registros desatualizados retornam `409` para evitar sobrescrita silenciosa
