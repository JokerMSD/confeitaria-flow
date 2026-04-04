# Public Store Domain

Estado atual: a loja publica foi aberta com home, catalogo publico, detalhe de produto, carrinho e checkout. O cliente final consegue montar pedido com adicionais estruturados, revisar carrinho, escolher entrega ou retirada, informar data/horario e concluir em Pix manual sem autenticar no painel interno. Quando existe conta com role `user`, a mesma frente publica passa a expor area de conta com perfil, troca de senha e historico de pedidos. O catalogo publico agora tambem consome galeria de imagens do backend: `ProdutoVenda` pode ter varias fotos e cada `Preparacao` pode ter uma foto opcional para aparecer na escolha de sabores ou recheios.

Escopo atual:
- vitrine publica de produtos vendaveis
- detalhe publico de produto com adicionais e galeria
- carrinho persistido no navegador
- checkout com nome, telefone, entrega/retirada, data, horario, endereco, bairro, referencia, taxa e Pix manual
- area `Minha conta` para usuario autenticado com historico e configuracoes basicas
- area administrativa pratica para gerenciar fotos sem abrir produto por produto

Invariantes importantes:
- abrir loja publica nao deve quebrar os fluxos internos existentes
- autenticacao interna atual nao deve ser deformada para atender cliente final
- contratos publicos devem nascer no backend com recortes claros, sem expor o dominio administrativo por acidente
- o significado de entrega/retirada deve ser o mesmo do fluxo interno
- conta `user` deve permanecer na frente publica; apenas `admin` e `operador` entram no painel interno
- fotos do catalogo devem ser servidas pelo backend e refletidas na loja publica sem depender de campo solto no frontend

Riscos ativos:
- o checkout ainda nao cobre recheios publicos nem pagamento automatizado
- misturar painel interno e loja publica no mesmo contrato continua sendo risco; por isso os endpoints publicos sao separados
- performance e UX mobile sao relevantes, mas nao devem abrir refactor prematuro do sistema inteiro
- a curadoria das galerias ainda depende de upload manual e ordenacao simples por posicao

Proximos passos naturais:
- endurecer confirmacao de pagamento Pix e comunicacao com o cliente
- avaliar recheios publicos e acompanhamento de pedido sem expor contratos administrativos
- amadurecer ordenacao e capa principal das galerias do catalogo
- manter o dominio publico separado do painel interno
