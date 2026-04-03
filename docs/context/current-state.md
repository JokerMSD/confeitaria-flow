# Current State

Confeitaria Flow e um monolito com `client/`, `server/`, `shared/` e PostgreSQL. O backend Express com Drizzle continua como autoridade de dominio; o frontend React consome contratos tipados e usa adapters onde a UI ainda precisa de compatibilidade.

Modulos operacionais fechados ou estaveis: pedidos com itens de catalogo e ate 3 recheios, entrega/retirada, fila operacional com agenda por data e horario, estoque com ledger real de movimentacoes, custo medio ponderado para ingredientes, caixa com automacoes ligadas a pedidos e compras, catalogo com produtos vendaveis e adicionais estruturados, e planejamento de compra baseado em pedidos ativos.

Modulos parcialmente evoluidos: clientes e usuarios ja possuem base de schema e rotas dedicadas; o fluxo de clientes agora absorve a listagem operacional que antes vivia em pedidos, mostra historico por cliente e pode iniciar novo pedido contextualizado; pedidos legados sem cliente passam por sincronizacao automatica por nome ao consultar clientes; previsao de producao ganhou leitura propria baseada em pedidos confirmados/em producao, receitas e adicionais; loja publica foi aberta com home, catalogo, detalhe, carrinho e checkout em Pix manual, mas a autenticacao interna ainda nao saiu de `AUTH_USERS_JSON`.

Riscos ativos: ainda existe compatibilidade hibrida em pontos de UI que dependem de adapters; pedidos legados podem exigir backfills para receitas e recheios inferidos por observacoes; mudancas em estoque, fila e pedidos tendem a atravessar mais de um dominio e pedem recorte cuidadoso; a loja publica ainda nao expõe selecao publica de ate 3 recheios e depende de Pix manual; o startup da API depende de schema consistente e aplica migrations SQL antes de validar o runtime.

Proximo ponto natural do sistema: consolidar o vinculo real entre clientes e pedidos tambem no cadastro/edicao de pedido com selecao explicita de cliente, endurecer o checkout publico com comprovacao/confirmacao de Pix e expandir previsao de producao so quando o contrato atual de pedidos permanecer coerente.
