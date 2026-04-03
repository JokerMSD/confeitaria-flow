# Cash Domain

Estado atual: caixa combina lancamentos manuais com automacoes vindas de pedidos pagos e compras de estoque. O backend concentra a regra para evitar divergencia entre operacao financeira e eventos do sistema.

Contratos principais:
- lancamentos manuais de entrada e saida
- reconciliacao de recebimentos ligados a pedidos
- registro de despesas ligadas a compras de estoque
- leitura de resumo e historico de caixa

Invariantes importantes:
- movimentos automaticos precisam ser identificaveis e rastreaveis
- pedido pago deve refletir no caixa sem exigir dupla digitacao
- compra de estoque com pagamento informado pode gerar saida automatica
- a regra financeira nao deve ser reimplementada na UI

Dependencias de dominio:
- pedidos alimentam recebimentos
- estoque pode originar despesas de compra
- formas de pagamento precisam manter consistencia entre pedido e caixa

Riscos ativos:
- alterar o momento de reconhecimento financeiro pode criar duplicidade ou omissao
- compras sem informacao completa de pagamento pedem cuidado para nao simular movimento indevido
- mudancas em pedidos e estoque podem quebrar conciliacao se nao forem tratadas juntas

Proximos passos naturais:
- manter reconciliacao automatica sob teste
- evoluir relatorios sem deslocar regra para o frontend
- evitar abrir novas automatizacoes financeiras antes de fechar os fluxos atuais
