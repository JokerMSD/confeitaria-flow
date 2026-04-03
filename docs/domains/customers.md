# Customers Domain

Estado atual: o projeto possui entidade `customers`, schema dedicado e ligacao real com pedidos. A experiencia de clientes absorve a listagem operacional que antes ficava em pedidos; o detalhe exibe resumo comercial, historico, pedidos em aberto, total gasto e atalho para abrir novo pedido contextualizado. Pedidos legados sem `customerId` sao sincronizados automaticamente por nome ao consultar o modulo e a listagem aceita busca por nome e telefone. Contas com role `user` podem se vincular a `customers` para reaproveitar historico e dados comerciais.

Contratos principais:
- entidade de cliente vinculavel a pedidos
- leitura de historico comercial do cliente e navegacao para pedidos
- busca comercial por nome e telefone
- rotas dedicadas no backend para evolucao incremental do modulo
- sincronizacao automatica e backfill manual para vincular pedidos legados a clientes criados por nome

Invariantes importantes:
- cliente deve ser modelado no backend, nao inferido pela UI
- pedidos precisam poder apontar para cliente real sem deformar contratos legados
- migracao deve conviver com o estado atual de pedidos e com clientes importados de dados antigos

Riscos ativos:
- tentar resolver CRM, auth e loja publica de uma vez aumenta risco
- migracoes do dominio exigem cuidado com dados existentes
- pedidos antigos sem `customerId` podem exigir importacao e revisao manual de nomes duplicados

Proximos passos naturais:
- remover dependencias restantes da tela antiga de pedidos e tratar clientes como hub comercial principal
- expandir leituras comerciais especificas sem deformar o dominio de pedidos
- manter o escopo restrito a cliente interno do negocio antes de qualquer frente publica
