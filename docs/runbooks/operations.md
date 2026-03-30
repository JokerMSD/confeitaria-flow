# Runbook: Operations

## Validacao Rapida Do Sistema
1. Login
2. Home
3. Pedidos
4. Estoque
5. Caixa
6. Guia de compra

## Quando Alterar Env No Render
- salvar env
- redeployar API
- testar `/api/health`
- testar rota autenticada

## Quando Alterar Rotas Ou SPA
- testar refresh em:
  - `/pedidos`
  - `/estoque`
  - `/receitas`
  - `/catalogo`

## Quando Alterar Numerais
- testar campos de dinheiro
- testar campos de quantidade por `un`, `g`, `kg`, `ml`
- testar atalhos `+` do estoque

## Quando Alterar Fluxo De Pedido
- criar pedido
- editar pedido
- trocar recheios
- mudar status para `Pronto`
- conferir baixa de estoque
- conferir reflexo no caixa se houver pagamento
