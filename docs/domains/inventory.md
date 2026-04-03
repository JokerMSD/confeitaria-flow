# Inventory Domain

Estado atual: estoque opera como ledger real de movimentacoes. Entradas, saidas e ajustes geram historico; nao ha correcao silenciosa de saldo. Ingredientes podem atualizar custo medio ponderado e equivalencia de compra para unidade de receita.

Contratos principais:
- cadastro e edicao de itens de estoque
- criacao de movimentacoes de estoque
- leitura de movimentacoes para auditoria operacional
- integracoes automaticas com pedidos prontos/entregues e compras

Invariantes importantes:
- estoque nao deve ficar negativo por efeito colateral silencioso
- custo deve tender a media ponderada de compras reais
- compras em `un` ou `caixa` podem registrar equivalencia para consumo em peso ou volume
- transicoes `Pronto` e `Entregue` devem consumir estoque de forma idempotente

Dependencias de dominio:
- pedidos consomem ingredientes por receitas vinculadas
- caixa pode registrar saida automatica em compras
- planejamento de compra depende do saldo e custo medio

Riscos ativos:
- qualquer mudanca em movimentacoes pode impactar custo, caixa e planejamento ao mesmo tempo
- pedidos legados sem vinculo completo de receita ainda exigem cuidado
- mensagens de falta de estoque precisam continuar diagnosticas, nao genericas

Proximos passos naturais:
- manter custo e equivalencia coerentes ao evoluir compras
- evitar novos atalhos de UI que contornem o ledger
- fechar qualquer ajuste de estoque sempre pelo backend
