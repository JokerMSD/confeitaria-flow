# Public Store Domain

Estado atual: a loja publica foi aberta com home, catalogo publico, detalhe de produto, carrinho e checkout. O cliente final consegue montar pedido com adicionais estruturados, revisar carrinho, escolher entrega ou retirada, informar data/horario e concluir em Pix manual ou cartao com checkout transparente do Mercado Pago sem autenticar no painel interno. Quando existe conta com role `user`, a mesma frente publica passa a expor area de conta com perfil, troca de senha e historico de pedidos. O catalogo publico agora tambem consome galeria de imagens do backend: `ProdutoVenda` pode ter varias fotos e cada variacao/sabor pode ter foto opcional dentro do produto.

Escopo atual:
- vitrine publica de produtos vendaveis
- detalhe publico de produto com adicionais e galeria
- carrinho persistido no navegador
- checkout com nome, telefone, entrega/retirada, data, horario, endereco, bairro, referencia, taxa e Pix manual
- checkout com cartao via Mercado Pago usando tokenizacao no frontend e criacao do pagamento no backend
- checkout com cupom de desconto validado pelo backend antes de criar o pedido
- area `Minha conta` para usuario autenticado com historico e configuracoes basicas
- area administrativa pratica para gerenciar fotos sem abrir produto por produto

Invariantes importantes:
- abrir loja publica nao deve quebrar os fluxos internos existentes
- autenticacao interna atual nao deve ser deformada para atender cliente final
- contratos publicos devem nascer no backend com recortes claros, sem expor o dominio administrativo por acidente
- o significado de entrega/retirada deve ser o mesmo do fluxo interno
- cupom publico deve ser validado e recalculado no backend; a UI apenas antecipa a leitura
- o cartao do Mercado Pago deve ser tokenizado no frontend; dados sensiveis nao podem ser persistidos no backend
- conta `user` deve permanecer na frente publica; apenas `admin` e `operador` entram no painel interno
- fotos do catalogo devem ser servidas pelo backend e refletidas na loja publica sem depender de campo solto no frontend

Riscos ativos:
- o checkout com cartao depende de configuracao de ambiente e webhook do Mercado Pago
- misturar painel interno e loja publica no mesmo contrato continua sendo risco; por isso os endpoints publicos sao separados
- performance e UX mobile sao relevantes, mas nao devem abrir refactor prematuro do sistema inteiro
- a curadoria das galerias ainda depende de upload manual e ordenacao simples por posicao

Proximos passos naturais:
- amadurecer conciliacao assíncrona do Mercado Pago e mensagens comerciais do checkout
- avaliar recheios publicos e acompanhamento de pedido sem expor contratos administrativos
- amadurecer ordenacao e capa principal das galerias do catalogo
- manter o dominio publico separado do painel interno
