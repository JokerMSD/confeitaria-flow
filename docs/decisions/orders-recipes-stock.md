# Decision: Orders, Recipes And Stock

## Decisao Atual
- Pedidos devem referenciar produtos do catalogo.
- Produtos de catalogo referenciam receitas.
- Recheios sao receitas de preparacao.
- Baixa de estoque acontece quando pedido entra em `Pronto` ou `Entregue`.

## Motivo
- Evita texto livre quebrando custo e consumo.
- Mantem consistencia de dominio no backend.
- Permite custo, precificacao e compra orientados por dados reais.

## Regras Chave
- Ate 3 recheios por item.
- Itens legados podem exigir backfill por observacoes.
- Casos ambiguos nao devem ser inferidos agressivamente.
