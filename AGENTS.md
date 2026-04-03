# AGENTS.md

- Preserve a estrutura principal em `client/`, `server/`, `shared/` e `migrations/`.
- Backend e banco sao a autoridade do dominio; UI nao deve carregar regra critica.
- Em modulos existentes, prefira trocar fonte de dados, contrato ou validacao antes de redesenhar interface.
- Mudancas devem ser incrementais, com escopo pequeno, impacto mapeado e compatibilidade preservada quando houver legado em uso.
- Se a tela precisar de leitura especifica, crie contrato backend apropriado em vez de distorcer o dominio para caber no frontend.
- Preserve adapters, shared types e validadores quando eles protegem compatibilidade entre API e UI.
- Regras comerciais e funcionais vivem em `docs/product-rules.md`; estado operacional atual vive em `docs/context/current-state.md`.
- Leia docs de dominio e runbooks apenas sob demanda, conforme o modulo ou operacao tocada.
- Evite misturar API real e `localStorage` para a mesma responsabilidade funcional.
- Evite endpoints genericos quando a tela pede leitura dedicada.
- Evite refactors estruturais amplos, redesign desnecessario e abstracoes prematuras.
- Nao introduza microservicos, mensageria ou arquitetura distribuida sem necessidade comprovada.
