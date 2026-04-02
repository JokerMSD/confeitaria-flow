# Current State

## Objetivo
Este arquivo resume o estado atual do sistema para retomada rapida em sessoes longas.

## Stack E Estrutura
- Frontend: React + TypeScript + React Query.
- Backend: Node.js + Express + TypeScript.
- Banco: PostgreSQL + Drizzle ORM.
- Estrutura principal preservada:
  - `client/`
  - `server/`
  - `shared/`

## Modulos Em Uso Real
- Home/Dashboard
- Pedidos
- Fila
- Caixa
- Estoque
- Movimentacoes de estoque
- Receitas
- Catalogo

## Estado Funcional Atual

### Pedidos
- Cadastro e edicao online funcionando.
- Itens novos usam produto do catalogo.
- Itens suportam ate 3 recheios.
- Produto manual foi removido do composer atual.
- Pedido invalida views relacionadas apos salvar.
- Existe endpoint rapido de transicao de status para uso operacional em fila.
- Pedido agora suporta `Entrega` e `Retirada`, com endereco e taxa condicionais no formulario.

### Receitas E Catalogo
- Preparacoes ficam em `Receitas`.
- Produtos vendaveis ficam em `Catalogo`.
- Receitas suportam ingrediente e receita-base como componentes.
- Produto vendavel suporta preco praticado.
- A Fase 1 foi verificada e esta coerente no codigo.
- A Fase 2 iniciou pelo backend com adicionais estruturados por produto e por item do pedido.

### Estoque
- Estoque usa ledger de movimentacoes.
- Entrada pode registrar compra e atualizar custo medio.
- Conversao entre unidade de compra e unidade de receita suportada.
- Ajuste rapido com `+/-` e quantidade customizada ativo.
- Campo numerico contextual melhorado.

### Caixa
- Entradas e saidas manuais funcionam.
- Pedido pago gera movimento automatico.
- Compra de estoque pode gerar saida automatica.
- Resumo de caixa considera pedidos e compras.

### Planejamento De Compra
- Painel de compra baseado em pedidos pendentes ativo.
- Usa custo medio e estoque atual.
- Ja possui fallback para pedidos antigos sem vinculo completo.

### Fila
- Tela de fila agora opera com calendario mensal, agenda por horario e resumo diario.
- Cards exibem valor, recebido, saldo pendente, telefone, observacoes e itens do pedido.
- Acoes rapidas de status ficam disponiveis diretamente nos cards.
- Estado inicial da fila mostra todos os pedidos ativos; o calendario funciona como filtro opcional.
- A data operacional foi corrigida para respeitar exatamente o dia cadastrado no pedido.

## Pendencias Intencionais
- Login continua simples via `AUTH_USERS_JSON`.
- Casos ambiguos em observacoes de pedidos antigos nao devem ser inferidos agressivamente.
- Algumas receitas/sabores podem depender de cadastro complementar manual.

## Operacao Online
- Frontend: Vercel.
- API: Render.
- Banco: Neon.
- CORS depende de `CORS_ORIGINS` e redeploy da API ao trocar env.

## Validacoes Minimas Antes De Encerrar Mudancas
- `npm run test`
- `npm run check`
- `npm run build`
- Commit do bloco implementado
