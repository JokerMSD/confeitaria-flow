# Confeitaria Flow

Sistema de gestao para confeitaria com frontend React + Vite, backend Express e PostgreSQL.

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL

## Variaveis de ambiente

- `DATABASE_URL` obrigatoria para a API
- `SESSION_SECRET` obrigatoria em producao
- `AUTH_USERS_JSON` com os usuarios permitidos
- `APP_ORIGIN` origin do frontend
- `CORS_ORIGINS` lista de origins permitidas
- `VITE_API_URL` opcional para o app, padrao `http://localhost:3001` no modo de desenvolvimento
- `SESSION_COOKIE_SECURE=true` em deploy HTTPS

## Desenvolvimento

```bash
npm run dev
```

O `dev` sobe:

- app em `http://localhost:3000`
- API em `http://localhost:3001`

Para rodar separado:

```bash
npm run app
npm run api
```

## Build e producao local

```bash
npm run check
npm run build
npm start
```

## Deploy simples

Veja [DEPLOY.md](./DEPLOY.md).
