# Inventory Domain

Estado atual: estoque opera como ledger real de movimentacoes. Entradas, saidas e ajustes geram historico; nao ha correcao silenciosa de saldo. Ingredientes podem atualizar custo medio ponderado e equivalencia de compra para unidade de receita. Compras com valor informado podem atualizar custo sem necessariamente virar saida no caixa; o financeiro so entra quando houver pagamento real declarado.

Contratos principais:
- cadastro e edicao de itens de estoque
- criacao de movimentacoes de estoque
- leitura de movimentacoes para auditoria operacional
- integracoes automaticas com pedidos prontos/entregues e compras
- confirmacao explicita de recalibracao manual ao editar saldo, custo ou equivalencia

Invariantes importantes:
- estoque nao deve ficar negativo por efeito colateral silencioso
- custo deve tender a media ponderada das entradas de compra com valor informado
- compras em `un` ou `caixa` podem registrar equivalencia para consumo em peso ou volume
- transicoes `Pronto` e `Entregue` devem consumir estoque de forma idempotente
- caixa nao deve receber saida automatica por custo estimado sem pagamento real

Dependencias de dominio:
- pedidos consomem ingredientes por receitas vinculadas
- caixa registra apenas compras reais declaradas
- planejamento de compra depende do saldo e custo medio

Riscos ativos:
- qualquer mudanca em movimentacoes pode impactar custo, caixa e planejamento ao mesmo tempo
- pedidos legados sem vinculo completo de receita ainda exigem cuidado
- pedidos legados ainda dependem de backfill para reduzir inferencia por nome em runtime
- mensagens de falta de estoque precisam continuar diagnosticas, nao genericas

Proximos passos naturais:
- manter custo e equivalencia coerentes ao evoluir compras
- rodar backfill de receitas legadas para reduzir heuristica por nome
- evitar novos atalhos de UI que contornem o ledger
- fechar qualquer ajuste de estoque sempre pelo backend
