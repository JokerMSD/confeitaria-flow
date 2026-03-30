# Assistant Context

## Objetivo
Este arquivo reduz a dependencia do historico do chat. Antes de mexer em fluxos centrais, revisar este arquivo e `docs/product-rules.md`.

## Arquitetura Atual
- Monolito com `client/`, `server/` e `shared/`.
- Frontend: React + TypeScript + React Query.
- Backend: Node.js + Express + TypeScript.
- Banco: PostgreSQL com Drizzle ORM.
- Backend continua sendo autoridade de dominio.
- Frontend usa adapters para shape de UI.

## Deploy
- Frontend preparado para Vercel.
- Backend preparado para Render.
- Banco em Neon via `DATABASE_URL`.
- Frontend usa `VITE_API_URL`.
- Backend usa `CORS_ORIGINS`, `SESSION_SECRET`, `AUTH_USERS_JSON`, `SERVE_CLIENT=false`.

## Autenticacao
- Login simples por sessao HTTP no backend.
- Nao existe cadastro publico.
- Usuarios continuam vindos de `AUTH_USERS_JSON`.
- Para publicar rapido e com baixo risco, manter esse modelo por enquanto.

## Dominios Ja Evoluidos

### Pedidos
- Pedido usa itens vinculados a produto de catalogo.
- Itens podem ter ate 3 recheios.
- Campo manual de produto foi removido do composer de itens.
- Pedidos antigos foram parcialmente corrigidos por scripts de backfill com base nas observacoes.

### Receitas e Catalogo
- `Preparacao` fica em `Receitas`.
- `ProdutoVenda` fica em `Catalogo`.
- Receitas suportam componentes por ingrediente ou por outra receita.
- Catalogo suporta preco praticado e preco ideal calculado.

### Estoque
- Movimentacoes sao ledger real, sem ajuste silencioso de saldo.
- Entrada de ingrediente pode atualizar custo medio ponderado.
- Itens comprados em `un` ou `caixa` podem ter equivalencia para consumo em `g`, `kg`, `ml` ou `l`.
- Ajustes rapidos em estoque usam movimentacoes reais e agora aceitam quantidade customizada.

### Caixa
- Caixa tem movimentos automaticos ligados a pedidos e compras de estoque.
- Pedido pago gera entrada automatica.
- Compra de estoque pode gerar saida automatica.

### Planejamento de Compra
- Existe endpoint e painel de `purchase-plan`.
- Considera pedidos em aberto que ainda precisam de producao.
- Usa receitas vinculadas ao pedido para explodir ingredientes.
- Existe fallback e backfill para pedidos legados sem `recipeId`.

## Regras Importantes Ja Combinadas
- Baixa automatica de estoque acontece quando pedido entra em `Pronto` ou `Entregue`.
- Salvar receita nao depende de saldo atual do estoque.
- Preco de ingrediente deve tender para custo medio de compras, nao custo fixo isolado.
- Numerais e dinheiro devem usar formato amigavel em pt-BR nos formularios.
- Quantidade deve respeitar contexto da unidade; evitar `step=0.001` universal.

## Scripts E Backfills Relevantes
- `script/backfill-legacy-order-item-recipes.ts`
- `script/backfill-order-fillings-from-notes.ts`
- `script/sync-default-recipes.ts`

## Validacao Esperada Depois De Mudancas Grandes
- Rodar `npm run check`
- Rodar `npm run build`
- Commits pequenos e frequentes

## Regra Operacional
- Sempre commitar ao fechar cada bloco de implementacao.
- Se houver mudanca relevante de negocio, atualizar este arquivo ou `docs/product-rules.md`.
