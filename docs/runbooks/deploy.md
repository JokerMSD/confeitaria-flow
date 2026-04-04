# Runbook: Deploy

## Backend No Render
1. Confirmar codigo no GitHub.
2. Garantir que `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGINS` e `AUTH_USERS_JSON` estao definidos.
3. Se o checkout com cartao estiver ativo, definir tambem:
   - `APP_ORIGIN`
   - `API_PUBLIC_ORIGIN`
   - `MERCADO_PAGO_PUBLIC_KEY`
   - `MERCADO_PAGO_ACCESS_TOKEN`
4. A API aplica migrations `.sql` pendentes automaticamente no startup por padrao.
5. Se o historico `app_runtime_migrations` ficar inconsistente com o schema real, o bootstrap tenta reaplicar seletivamente as migrations sugeridas pela guarda.
6. Se precisar desligar isso explicitamente, definir:
   - `AUTO_APPLY_MIGRATIONS=false`
7. Build command:
   - `npm install --include=dev && npm run build:api`
8. Start command:
   - `npm run start:api`
9. Validar:
   - `/api/health`
   - `/api/public/store/payment-config`

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
6. Testar checkout publico com Pix e cartao.

## Problemas Comuns
- API falha ao subir com erro de schema:
  - o backend agora tenta aplicar migrations pendentes e depois falha cedo quando faltam tabelas/colunas criticas
  - aplicar as migrations pendentes no Neon antes do redeploy
  - casos recentes comuns:
    - `0014_phase14_order_delivery_mode.sql`
    - `0015_phase15_product_additionals.sql`
- CORS:
  - corrigir `CORS_ORIGINS`
  - redeployar API
- Session/cookie:
  - conferir `SESSION_COOKIE_SECURE=true` em producao
- Mercado Pago:
  - conferir `APP_ORIGIN`
  - conferir `API_PUBLIC_ORIGIN`
  - conferir `MERCADO_PAGO_PUBLIC_KEY` e `MERCADO_PAGO_ACCESS_TOKEN`
  - conferir webhook publico em `/api/public/store/payments/mercado-pago/webhook`
- API sobe mas build falha:
  - garantir `npm install --include=dev`
