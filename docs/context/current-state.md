# Current State

Confeitaria Flow e um monolito com `client/`, `server/`, `shared/` e PostgreSQL. O backend Express com Drizzle continua como autoridade de dominio; o frontend React consome contratos tipados e usa adapters onde a UI ainda precisa de compatibilidade.

Modulos operacionais fechados ou estaveis: pedidos com itens de catalogo e ate 3 recheios, entrega/retirada, fila operacional com agenda por data e horario, estoque com ledger real de movimentacoes, custo medio ponderado para ingredientes, caixa com automacoes ligadas a pedidos e compras, catalogo com produtos vendaveis e adicionais estruturados, e planejamento de compra baseado em pedidos ativos.

Modulos parcialmente evoluidos: clientes e usuarios ja possuem base de schema e rotas dedicadas; o fluxo de clientes agora absorve a listagem operacional que antes vivia em pedidos, mostra historico por cliente e pode iniciar novo pedido contextualizado; pedidos legados sem cliente passam por sincronizacao automatica por nome ao consultar clientes, mas a autenticacao ainda nao saiu de `AUTH_USERS_JSON`; loja publica e fluxo de cliente final ainda nao foram abertos como produto real; previsao de producao por lote/turno segue pendente.

Riscos ativos: ainda existe compatibilidade hibrida em pontos de UI que dependem de adapters; pedidos legados podem exigir backfills para receitas e recheios inferidos por observacoes; mudancas em estoque, fila e pedidos tendem a atravessar mais de um dominio e pedem recorte cuidadoso; o startup da API depende de schema consistente e aplica migrations SQL antes de validar o runtime.

Proximo ponto natural do sistema: consolidar o vinculo real entre clientes e pedidos tambem no cadastro/edicao de pedido com selecao explicita de cliente, manter pedidos/estoque/fila como base estavel e abrir novos modulos apenas quando o contrato backend do dominio anterior estiver coerente.
