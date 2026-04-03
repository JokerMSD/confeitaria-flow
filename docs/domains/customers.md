# Customers Domain

Estado atual: o projeto ja possui entidade `customers`, schema dedicado e base para relacao com pedidos. O dominio ainda nao virou centro da experiencia do produto e permanece em consolidacao.

Contratos principais:
- entidade de cliente vinculavel a pedidos
- leitura futura de historico, frequencia e ticket medio
- rotas dedicadas no backend para evolucao incremental do modulo

Invariantes importantes:
- cliente deve ser modelado no backend, nao inferido pela UI
- pedidos precisam poder apontar para cliente real sem deformar contratos legados
- migracao deve conviver com o estado atual de pedidos enquanto a tela nao e consolidada

Dependencias de dominio:
- pedidos sao a principal fonte de historico
- usuarios internos e autenticacao nao devem ser confundidos com clientes
- futuras leituras comerciais dependem de vinculo limpo entre pedido e cliente

Riscos ativos:
- abrir uma tela de clientes antes de consolidar a relacao com pedidos gera retrabalho
- tentar resolver CRM, auth e loja publica de uma vez aumenta risco
- migracoes do dominio exigem cuidado com dados existentes

Proximos passos naturais:
- fechar o vinculo `orders -> customers`
- abrir leitura operacional e comercial especifica para a futura tela de clientes
- manter o escopo restrito a cliente interno do negocio antes de qualquer frente publica
