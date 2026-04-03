# Public Store Domain

Estado atual: a loja publica foi aberta com home, catalogo publico, detalhe de produto, carrinho e checkout. O cliente final consegue montar pedido com adicionais estruturados, revisar carrinho, escolher entrega ou retirada, informar data/horario e concluir em Pix manual sem autenticar no painel interno.

Escopo atual:
- vitrine publica de produtos vendaveis
- detalhe publico de produto com adicionais
- carrinho persistido no navegador
- checkout com nome, telefone, entrega/retirada, data, horario, endereco, bairro, referencia, taxa e Pix manual

Invariantes importantes:
- abrir loja publica nao deve quebrar os fluxos internos existentes
- autenticacao interna atual nao deve ser deformada para atender cliente final
- contratos publicos devem nascer no backend com recortes claros, sem expor o dominio administrativo por acidente
- o significado de entrega/retirada deve ser o mesmo do fluxo interno

Riscos ativos:
- o checkout ainda nao cobre recheios publicos nem pagamento automatizado
- misturar painel interno e loja publica no mesmo contrato continua sendo risco; por isso os endpoints publicos sao separados
- performance e UX mobile sao relevantes, mas nao devem abrir refactor prematuro do sistema inteiro

Proximos passos naturais:
- endurecer confirmacao de pagamento Pix e comunicacao com o cliente
- avaliar recheios publicos e acompanhamento de pedido sem expor contratos administrativos
- manter o dominio publico separado do painel interno
