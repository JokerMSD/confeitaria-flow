# Customers Domain

Estado atual: o projeto ja possui entidade `customers`, schema dedicado e base para relacao com pedidos. A experiencia de clientes passou a absorver a listagem operacional que antes ficava em pedidos; o detalhe do cliente exibe resumo comercial, historico de pedidos e atalho para abrir novo pedido contextualizado. Pedidos legados sem `customerId` sao sincronizados automaticamente por nome ao consultar o modulo.

Contratos principais:
- entidade de cliente vinculavel a pedidos
- leitura de historico comercial do cliente e navegacao para pedidos
- rotas dedicadas no backend para evolucao incremental do modulo
- sincronizacao automatica e backfill manual para vincular pedidos legados a clientes criados por nome

Invariantes importantes:
- cliente deve ser modelado no backend, nao inferido pela UI
- pedidos precisam poder apontar para cliente real sem deformar contratos legados
- migracao deve conviver com o estado atual de pedidos enquanto o formulario principal ainda nao oferece selecao explicita de cliente

Dependencias de dominio:
- pedidos sao a principal fonte de historico
- usuarios internos e autenticacao nao devem ser confundidos com clientes
- futuras leituras comerciais dependem de vinculo limpo entre pedido e cliente

Riscos ativos:
- a ausencia de selecao explicita de cliente no formulario principal de pedido ainda gera area hibrida
- tentar resolver CRM, auth e loja publica de uma vez aumenta risco
- migracoes do dominio exigem cuidado com dados existentes
- pedidos antigos sem `customerId` podem exigir importacao e revisao manual de nomes duplicados

Proximos passos naturais:
- consolidar o uso de `customerId` tambem no fluxo principal de criacao e edicao de pedido
- remover dependencias restantes da tela antiga de pedidos e tratar clientes como hub comercial principal
- expandir leituras comerciais especificas sem deformar o dominio de pedidos
- manter o escopo restrito a cliente interno do negocio antes de qualquer frente publica
