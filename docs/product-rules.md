# Product Rules

## Regras De Pedido
- Itens de pedido devem vir do catalogo, nao por digitacao livre.
- Cada item pode ter ate 3 recheios.
- O nome do item deve ser montado automaticamente com produto + recheios.
- Observacoes continuam existindo para detalhes do pedido, mas nao devem ser a fonte primaria da estrutura do item novo.
- Produto pode expor grupos de adicionais estruturados no pedido.
- O subtotal do item deve considerar `preco base + adicionais selecionados`, multiplicado pela quantidade.
- Minimo, maximo e escolha unica/multipla de adicionais devem ser respeitados ja no frontend, com o backend mantendo a validacao final.

## Regras De Estoque
- Baixa automatica de ingredientes deve usar as receitas vinculadas ao pedido.
- A baixa ocorre quando o pedido muda para `Pronto` ou `Entregue`.
- Se o pedido voltar de status ou for cancelado, o consumo automatico deve ser recalculado/revertido.
- Receita pode ser cadastrada mesmo com ingrediente zerado em estoque.

## Conversao De Unidade
- Um item comprado em `un` ou `caixa` pode ser consumido em outra unidade de receita.
- Exemplo: manteiga comprada em `1 un = 500 g`.
- Exemplo: maracuja comprado em `2 un` e rendimento real `0,705 kg`.
- O sistema deve usar equivalencia media acumulada para custo e consumo quando houver historico de compras reais.

## Custo E Compra
- Compras de ingredientes podem informar valor pago real.
- O custo do item deve convergir para media ponderada das compras.
- O guia de compra deve comparar pedidos pendentes x estoque atual x custo medio.
- Quando fizer sentido, o gasto estimado deve usar esse custo medio.

## Receitas E Catalogo
- `Preparacao` deve ficar em `Receitas`.
- `ProdutoVenda` deve ficar em `Catalogo`.
- Produtos vendaveis podem ter preco praticado.
- O backend calcula preco ideal, mas o preco praticado pode prevalecer no pedido.
- Produtos vendaveis podem configurar grupos de adicionais com opcoes precificadas.

## Precos Comerciais Ja Discutidos
- Ovo de colher 500g: `49,90`
- Ovo de colher 350g: `39,90`
- Ovo trufado 350g: `32,90`
- Ovo trufado 500g: `39,30`
- Barra recheada 350g: `27,90`
- Trufa unidade: `3,00`
- Caixa com 10 trufas: `24,90`

## Regras Comerciais Comentadas Para Tamanhos Maiores
- Ovo de colher 1kg sem Ninho: `92,00`
- Ovo de colher 1kg com Ninho: `99,90`
- Se houver Ninho entre os recheios premium, tende a aplicar faixa maior.
- Faixa sugerida para 750g discutida como referencia:
  - sem Ninho: `74,90`
  - com Ninho: `79,90`

## Sabores Legados Em Observacoes
- Pedidos antigos podem ter sabores nas observacoes.
- Heuristicas ja foram aplicadas para inferir quando o caso era:
  - meio a meio no mesmo ovo
  - itens separados de sabores diferentes
- Casos ambiguos devem ser tratados com cautela; nao inventar interpretacao sem sinal suficiente.

## UX De Numerais
- Campos monetarios devem mascarar automaticamente em pt-BR.
- Campos de quantidade devem ter incremento contextual:
  - `un` / `caixa`: passo inteiro
  - `g` / `ml`: passo maior e atalhos
  - `kg` / `l`: passo decimal moderado
- Evitar exigir muitos cliques para chegar em 10g, 50g, 100g ou 5/10 unidades.
