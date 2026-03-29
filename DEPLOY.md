# Deploy Simples

Arquitetura mantida:

- frontend separado
- API separada
- banco Neon separado
- mesma base `client / server / shared`

Stack de deploy recomendada:

- frontend: Vercel
- API: Render
- banco: Neon

Essa combinacao e a mais pratica hoje para este projeto:

- Vercel lida muito bem com frontend Vite estatico
- Render sobe a API Node sem exigir reestruturacao
- Neon ja esta pronto para PostgreSQL online

## Scripts Relevantes

- `npm run app`: frontend local em desenvolvimento
- `npm run api`: API local em desenvolvimento
- `npm run dev`: frontend + API juntos
- `npm run build:app`: build do frontend para deploy
- `npm run build:api`: build da API para deploy
- `npm run start:api`: sobe apenas a API em producao

## Variaveis De Ambiente

Frontend:

- `VITE_API_URL=https://sua-api.onrender.com`

Backend:

- `DATABASE_URL=postgresql://...`
- `PORT=10000`
- `NODE_ENV=production`
- `SERVE_CLIENT=false`
- `SESSION_SECRET=um-segredo-forte`
- `SESSION_COOKIE_SECURE=true`
- `CORS_ORIGINS=https://seu-frontend.vercel.app`
- `AUTH_USERS_JSON=[{"email":"...","password":"...","name":"..."}]`

## Backend No Render

Arquivos ja preparados:

- `render.yaml`
- `package.json` com `build:api` e `start:api`

Passo a passo:

1. Suba o repositorio no GitHub.
2. No Render, escolha `New +` -> `Blueprint`.
3. Conecte o repositorio.
4. O Render vai ler `render.yaml`.
5. Preencha as variaveis faltantes:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `CORS_ORIGINS`
   - `AUTH_USERS_JSON`
6. Faça o primeiro deploy.
7. Abra `https://sua-api.onrender.com/api/health`.

Comandos usados no Render:

- build: `npm install && npm run build:api`
- start: `npm run start:api`

Observacoes:

- a API usa `process.env.PORT` em producao
- `SERVE_CLIENT=false` evita acoplamento com build local do frontend
- `CORS_ORIGINS` precisa apontar para a URL final do Vercel

## Frontend Na Vercel

Arquivos ja preparados:

- `vercel.json`
- `package.json` com `build:app`

Passo a passo:

1. No Vercel, escolha `Add New...` -> `Project`.
2. Conecte o mesmo repositorio.
3. Configure a variavel:
   - `VITE_API_URL=https://sua-api.onrender.com`
4. Confirme o build.
5. Faça o deploy.

Configuracao esperada:

- build command: `npm run build:app`
- output directory: `dist/public`

## Neon

No Neon, use:

- `DATABASE_URL` pooled para a API online
- `sslmode=require`

Antes do deploy online, garanta:

1. banco criado no Neon
2. `DATABASE_URL` configurada no backend
3. schema aplicado com `npm run db:push`

## Ordem Recomendada De Subida

1. Aplicar schema no Neon.
2. Fazer deploy da API no Render.
3. Validar `/api/health`.
4. Fazer deploy do frontend na Vercel.
5. Ajustar `CORS_ORIGINS` no Render com a URL final da Vercel.
6. Testar login.
7. Testar pedidos, caixa, estoque e dashboard.

## URLs Esperadas

Exemplos:

- frontend: `https://confeitaria-flow.vercel.app`
- API: `https://confeitaria-flow-api.onrender.com`

## Limitacoes Do Free Tier

- Render pode entrar em sleep e sofrer cold start
- Neon free tem limite de recursos e conexoes
- Vercel free e suficiente para o frontend desse projeto

## Checklist Final

- frontend abre online
- login funciona
- API responde online
- sessao e mantida entre requests
- pedidos salvam no Neon
- caixa, estoque e dashboard respondem sem localhost
