# Catalog Domain

Estado atual: catalogo representa produtos vendaveis; receitas representam preparacoes e componentes. O sistema ja suporta preco praticado, custo ideal calculado e adicionais estruturados por produto para uso em pedidos.

Contratos principais:
- cadastro e edicao de receitas
- cadastro e edicao de produtos vendaveis
- configuracao de grupos e opcoes de adicionais
- leitura detalhada para composicao de pedido

Invariantes importantes:
- `Preparacao` continua em receitas; `ProdutoVenda` continua em catalogo
- produtos do catalogo devem orientar o item do pedido
- adicionais respeitam minimo, maximo e modo de selecao
- preco do item no pedido considera base mais adicionais

Dependencias de dominio:
- pedidos consomem produtos e adicionais
- estoque e custo dependem das receitas
- planejamento de compra depende da explosao correta de componentes

Riscos ativos:
- mudancas de shape no catalogo podem quebrar reidratacao do pedido
- qualquer evolucao de variacoes comerciais precisa preservar o que ja funciona para produtos atuais
- separar demais produto e receita no frontend tende a aumentar acoplamento improdutivo

Proximos passos naturais:
- evoluir variacoes comerciais so quando houver necessidade real
- manter a leitura detalhada de produto adequada para pedido e composicao
- evitar reabrir arquitetura de catalogo sem motivacao de negocio clara
