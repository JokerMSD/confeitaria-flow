# Runbook: Deploy

## Backend No Render
1. Confirmar codigo no GitHub.
2. Garantir que `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGINS` e `AUTH_USERS_JSON` estao definidos.
3. Build command:
   - `npm install --include=dev && npm run build:api`
4. Start command:
   - `npm run start:api`
5. Validar:
   - `/api/health`

## Frontend Na Vercel
1. Configurar `VITE_API_URL` com a URL da API.
2. Build:
   - `npm run build:app`
3. Output:
   - `dist/public`
4. Validar rotas SPA com refresh.

## Depois Do Deploy
1. Testar login.
2. Testar pedidos.
3. Testar estoque.
4. Testar caixa.
5. Testar guia de compra.

## Problemas Comuns
- API falha ao subir com erro de schema:
  - o backend agora falha cedo quando faltam tabelas/colunas criticas
  - aplicar as migrations pendentes no Neon antes do redeploy
  - casos recentes comuns:
    - `0014_phase14_order_delivery_mode.sql`
    - `0015_phase15_product_additionals.sql`
- CORS:
  - corrigir `CORS_ORIGINS`
  - redeployar API
- Session/cookie:
  - conferir `SESSION_COOKIE_SECURE=true` em producao
- API sobe mas build falha:
  - garantir `npm install --include=dev`
