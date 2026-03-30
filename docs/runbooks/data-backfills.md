# Runbook: Data Backfills

## Quando Usar
- Pedidos antigos sem `recipeId`
- Pedidos antigos com recheios apenas em observacoes
- Seed de receitas padrao

## Scripts
- `script/backfill-legacy-order-item-recipes.ts`
- `script/backfill-order-fillings-from-notes.ts`
- `script/sync-default-recipes.ts`
- `script/backfill-unit-purchase-totals.ts`

## Cuidados
- Rodar com banco apontando para o ambiente correto.
- Fazer backup logico ou ao menos confirmar alvo antes de executar.
- Validar resultado em consultas e telas logo depois.

## Pos-Execucao
1. Reabrir pedidos afetados.
2. Conferir se recheios e produtos foram inferidos corretamente.
3. Conferir guia de compra.
4. Conferir baixa automatica de estoque em pedidos prontos.
5. Se o backfill tocar compras de estoque, conferir tambem caixa e custo medio do item.
