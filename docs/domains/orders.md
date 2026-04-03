# Orders Domain

Estado atual: pedidos sao o nucleo operacional do sistema. Cada item deve vir do catalogo, pode carregar ate 3 recheios e pode receber adicionais estruturados. O backend monta e valida a estrutura; o frontend adapta payloads para manter a UI existente estavel.

Contratos principais:
- leitura e escrita de pedidos completos
- leitura operacional da fila em `/api/orders/queue`
- transicao rapida de status em `/api/orders/:id/status`

Invariantes importantes:
- itens novos nao devem voltar para texto livre
- `deliveryMode` distingue `Entrega` e `Retirada`
- ao marcar `Retirada`, endereco, bairro, referencia e taxa nao devem persistir
- labels e adaptacoes de status/pagamento no frontend precisam continuar legiveis em pt-BR

Dependencias de dominio:
- catalogo e receitas definem produto, composicao e custo
- estoque e caixa reagem a transicoes de status e pagamentos
- clientes devem se conectar a pedidos sem forcar redesign da tela atual

Riscos ativos:
- pedidos legados ainda podem depender de observacoes e backfills
- mudancas em status podem afetar simultaneamente fila, estoque e caixa
- qualquer alteracao de contrato deve preservar a edicao de pedido e a reidratacao de adicionais

Proximos passos naturais:
- consolidar relacao real com `customers`
- manter os contratos de fila e detalhe consistentes
- evitar abrir novas variacoes comerciais sem primeiro fechar o dominio atual de pedidos
