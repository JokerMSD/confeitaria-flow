# Product Rules

## Pedidos
- Itens de pedido devem vir do catalogo, nao por digitacao livre.
- Cada item pode ter ate 3 recheios.
- O nome do item deve ser montado automaticamente com produto e recheios.
- Observacoes continuam permitidas, mas nao devem ser a fonte primaria da estrutura de item novo.
- Produto pode expor grupos de adicionais estruturados.
- O subtotal do item deve considerar preco base mais adicionais selecionados, multiplicado pela quantidade.
- Minimo, maximo e selecao unica ou multipla de adicionais devem ser respeitados no frontend, com validacao final no backend.
- `deliveryMode` distingue `Entrega` e `Retirada`; ao escolher `Retirada`, endereco, bairro, referencia e taxa nao devem persistir.

## Estoque E Producao
- Baixa automatica de ingredientes deve usar as receitas vinculadas ao pedido.
- A baixa ocorre quando o pedido muda para `Pronto` ou `Entregue`.
- Se o pedido voltar de status ou for cancelado, o consumo automatico deve ser recalculado ou revertido.
- Receita pode ser cadastrada mesmo com ingrediente zerado em estoque.
- Ao faltar estoque em transicao operacional, o sistema deve devolver diagnostico util em vez de erro generico.

## Conversao E Custo
- Um item comprado em `un` ou `caixa` pode ser consumido em outra unidade de receita.
- O sistema deve usar equivalencia media acumulada quando houver historico de compras reais.
- Compras de ingredientes podem informar valor pago real.
- O custo do item deve convergir para media ponderada das compras.
- O guia de compra deve comparar pedidos pendentes, estoque atual e custo medio.

## Catalogo E Receitas
- `Preparacao` deve ficar em `Receitas`.
- `ProdutoVenda` deve ficar em `Catalogo`.
- O backend calcula preco ideal, mas o preco praticado pode prevalecer no pedido.
- Produtos vendaveis podem configurar grupos de adicionais com opcoes precificadas.

## Legado E UX Funcional
- Pedidos antigos podem ter sabores apenas em observacoes.
- Heuristicas de inferencia devem ser conservadoras; casos ambiguos nao devem ser inventados.
- Campos monetarios devem usar formato amigavel em pt-BR.
- Campos de quantidade devem respeitar o contexto da unidade e evitar passos universais inadequados.
