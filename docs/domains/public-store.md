# Public Store Domain

Estado atual: a loja publica ainda nao foi aberta como modulo real do produto. O sistema continua orientado para operacao interna, com autenticacao simples e fluxos administrativos.

Escopo esperado quando este dominio for iniciado:
- vitrine publica de produtos
- checkout do cliente final
- area do cliente e acompanhamento de pedido
- integracao controlada com estoque, pedidos, pagamentos e clientes

Invariantes importantes:
- abrir loja publica nao deve quebrar os fluxos internos existentes
- autenticacao interna atual nao deve ser deformada para atender cliente final
- contratos publicos devem nascer no backend com recortes claros, sem expor o dominio administrativo por acidente

Dependencias de dominio:
- catalogo precisa estar consistente
- clientes precisam existir como entidade confiavel
- pedidos e pagamentos precisam suportar um fluxo externo sem atalhos manuais

Riscos ativos:
- antecipar checkout sem fechar clientes e usuarios internos aumenta retrabalho
- misturar painel interno e loja publica no mesmo contrato costuma degradar ambos
- performance e UX mobile serao relevantes, mas nao devem abrir refactor prematuro do sistema inteiro

Proximos passos naturais:
- tratar este dominio como futuro
- so iniciar quando clientes, pedidos e catalogo estiverem coerentes para consumo publico
- manter qualquer preparacao atual apenas como referencia estrategica, nao como contexto automatico
