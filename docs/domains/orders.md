# Orders Domain

Estado atual: pedidos sao o nucleo operacional do sistema. Cada item deve vir do catalogo, pode carregar ate 3 recheios e pode receber adicionais estruturados. O backend monta e valida a estrutura; o frontend adapta payloads para manter a UI existente estavel.

Contratos principais:
- leitura e escrita de pedidos completos
- leitura operacional da fila em `/api/orders/queue`
- transicao rapida de status em `/api/orders/:id/status`
- vinculo opcional com `customerId` para conectar pedido ao cadastro de cliente
- selecao explicita de cliente no formulario principal sem perder compatibilidade com nome/telefone legados

Invariantes importantes:
- itens novos nao devem voltar para texto livre
- `deliveryMode` distingue `Entrega` e `Retirada`
- ao marcar `Retirada`, endereco, bairro, referencia e taxa nao devem persistir
- labels e adaptacoes de status/pagamento no frontend precisam continuar legiveis em pt-BR
- fila, detalhe do cliente, checkout publico e formulario interno devem exibir o mesmo significado de entrega/retirada

Riscos ativos:
- pedidos legados ainda podem depender de observacoes e backfills
- mudancas em status podem afetar simultaneamente fila, estoque e caixa
- qualquer alteracao de contrato deve preservar a edicao de pedido e a reidratacao de adicionais

Proximos passos naturais:
- manter a selecao de cliente e a sincronizacao legada coerentes no mesmo fluxo
- manter os contratos de fila e detalhe consistentes
- evitar abrir novas variacoes comerciais sem primeiro fechar o dominio atual de pedidos
