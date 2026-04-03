# Production Domain

Estado atual: a operacao de producao continua vivendo principalmente na fila e no planejamento de compra, mas agora tambem possui uma tela dedicada de previsao. A previsao le pedidos em `Confirmado` ou `EmProducao`, explode receitas e adicionais e resume totais por receita, ingrediente e adicionais, com filtros por periodo.

Contratos principais:
- leitura de fila em `/api/orders/queue`
- transicoes de status de pedido
- leitura de `purchase-plan`
- leitura de previsao em `/api/production/forecast`
- filtros por data unica ou intervalo operacional

Invariantes importantes:
- `deliveryDate` deve ser tratada como data operacional local
- sem filtro de data, a agenda deve agrupar por `data -> horario`
- pedidos ativos devem permanecer visiveis de forma operacional
- mudancas de status nao podem gerar consumo duplicado de estoque
- adicionais precisam entrar na leitura de demanda sem transformar o modulo em MRP complexo

Riscos ativos:
- fila, pedidos e estoque formam um acoplamento operacional alto
- qualquer ajuste de agrupamento ou status pode afetar experiencia diaria da confeitaria
- a previsao ainda nao separa lotes, turnos ou capacidade produtiva
- destaques como chocolate, leite condensado e creme de leite dependem de nomes consistentes nos itens de estoque

Proximos passos naturais:
- manter fila e compra estaveis
- consolidar a previsao atual antes de abrir lote, turno ou capacidade
- abrir previsao mais sofisticada por lote ou turno como modulo novo, nao como remendo da fila atual
