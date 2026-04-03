# Customers Domain

Estado atual: o projeto ja possui entidade `customers`, schema dedicado e base para relacao com pedidos. A tela de detalhe do cliente agora exibe resumo comercial, historico de pedidos e atalho para abrir novo pedido ja contextualizado no cliente. O dominio ainda permanece em consolidacao.

Contratos principais:
- entidade de cliente vinculavel a pedidos
- leitura de historico comercial do cliente e navegacao para pedidos
- rotas dedicadas no backend para evolucao incremental do modulo
- backfill disponivel para vincular pedidos legados a clientes criados por nome

Invariantes importantes:
- cliente deve ser modelado no backend, nao inferido pela UI
- pedidos precisam poder apontar para cliente real sem deformar contratos legados
- migracao deve conviver com o estado atual de pedidos enquanto a tela nao e consolidada

Dependencias de dominio:
- pedidos sao a principal fonte de historico
- usuarios internos e autenticacao nao devem ser confundidos com clientes
- futuras leituras comerciais dependem de vinculo limpo entre pedido e cliente

Riscos ativos:
- manter cadastro de cliente sem fechar a selecao/vinculo no formulario de pedido ainda gera area hibrida
- tentar resolver CRM, auth e loja publica de uma vez aumenta risco
- migracoes do dominio exigem cuidado com dados existentes
- pedidos antigos sem `customerId` podem exigir importacao e revisao manual de nomes duplicados

Proximos passos naturais:
- consolidar o uso de `customerId` tambem no fluxo principal de criacao e edicao de pedido
- expandir leituras comerciais especificas sem deformar o dominio de pedidos
- manter o escopo restrito a cliente interno do negocio antes de qualquer frente publica
