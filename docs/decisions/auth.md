# Decision: Auth

## Decisao Atual
- Manter autenticacao simples por sessao no backend.
- Usuarios definidos por `AUTH_USERS_JSON`.

## Motivo
- Projeto pequeno
- Baixo atrito operacional
- Poucos usuarios
- Menor risco que abrir cadastro publico agora

## Nao Fazer Agora
- OAuth
- cadastro publico
- recuperacao de senha complexa
- autorizacao granular

## Evolucao Futura Possivel
- tabela `users`
- seed inicial privado
- login por email/senha sem cadastro aberto
