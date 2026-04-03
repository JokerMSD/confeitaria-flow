# Production Domain

Estado atual: a operacao de producao vive principalmente na fila e no planejamento de compra. A fila ja funciona como centro operacional com agrupamento por data e horario, e o planejamento calcula necessidades a partir de pedidos ativos e receitas.

Contratos principais:
- leitura de fila em `/api/orders/queue`
- transicoes de status de pedido
- leitura de `purchase-plan`

Invariantes importantes:
- `deliveryDate` deve ser tratada como data operacional local
- sem filtro de data, a agenda deve agrupar por `data -> horario`
- pedidos ativos devem permanecer visiveis de forma operacional
- mudancas de status nao podem gerar consumo duplicado de estoque

Dependencias de dominio:
- pedidos fornecem agenda e contexto comercial
- receitas e estoque sustentam producao e compra
- caixa pode refletir eventos ligados a pedidos e compras

Riscos ativos:
- fila, pedidos e estoque formam um acoplamento operacional alto
- qualquer ajuste de agrupamento ou status pode afetar experiencia diaria da confeitaria
- previsao por lote e turno ainda nao existe como modulo proprio

Proximos passos naturais:
- manter fila e compra estaveis
- evoluir visao de producao somente depois de consolidar clientes e usuarios
- abrir previsao mais sofisticada por lote ou turno como modulo novo, nao como remendo da fila atual
