# AGENTS.md

## Regras Permanentes Do Projeto

### Memoria Persistente
- Antes de implementar mudancas novas, revisar os arquivos em `docs/` quando existirem.
- Tratar `docs/assistant-context.md` como memoria operacional persistente do projeto.
- Tratar `docs/product-rules.md` como fonte de verdade para regras de negocio e decisoes funcionais combinadas fora do codigo.
- Ao concluir blocos importantes de implementacao, atualizar a documentacao persistente relevante para reduzir perda de contexto em compactacoes futuras.

### Arquitetura
- Manter a estrutura principal em `client/`, `server/` e `shared/`.
- Preservar a organização modular já iniciada na Fase 1.
- Evitar reorganizações amplas sem necessidade clara de manutenção ou evolução.

### Estratégia De Backend
- Priorizar backend primeiro em qualquer novo módulo relevante.
- Manter regras de negócio no servidor, não nas páginas do frontend.
- Não propor microserviços para este projeto nesta fase de maturidade.
- Evoluir o backend de forma modular dentro do monólito atual.

### Estratégia De Frontend
- Não reescrever a UI sem necessidade real.
- Preservar layout, fluxo e experiência visual sempre que a mudança for principalmente de dados.
- Usar adapters no frontend para compatibilizar contratos da API com a UI existente.
- Não deformar o backend para imitar shapes legados de mock.

### Migração
- Fazer migração incremental por módulo.
- Não abrir vários módulos grandes ao mesmo tempo.
- Fechar o domínio atual de forma consistente antes de iniciar outro.
- Evitar misturar mock/localStorage e API real dentro da mesma responsabilidade de tela.

### Continuidade
- Preservar a Fase 1 como base estável do projeto.
- Tratar a base atual de Pedidos como referência para os próximos módulos.
- Manter compatibilidade com as partes híbridas até que sejam migradas conscientemente.

### Escopo E Risco
- Preferir recortes pequenos, seguros e verificáveis.
- Evitar abstrações genéricas prematuras.
- Não expandir escopo no meio da implementação sem decisão explícita.
- Antes de migrar uma tela, confirmar se já existe contrato backend adequado para ela.

## Como Tomar Decisões

- Se uma tela já existe e funciona visualmente, preferir trocar a fonte de dados antes de redesenhar a interface.
- Se um fluxo exige dados que o contrato atual não entrega bem, criar uma leitura específica no backend em vez de forçar reuse inadequado.
- Se houver dúvida entre conveniência local no frontend e consistência de domínio, priorizar consistência no backend.
- Se um módulo ainda está híbrido, deixar isso explícito no código e na comunicação técnica.
- Se uma mudança tocar mais de um domínio, reduzir o escopo e resolver primeiro o domínio mais diretamente afetado.
- Antes de abrir um módulo novo, revisar se ainda existem sobras importantes do módulo anterior.

## Anti-Padrões A Evitar

- Não mover regra de negócio crítica para páginas, componentes ou hooks de UI.
- Não fazer o backend imitar shapes legados apenas para evitar adapter no frontend.
- Não usar endpoints genéricos demais quando a tela precisa de uma leitura específica.
- Não misturar API real e `localStorage` para a mesma responsabilidade funcional.
- Não abrir migração simultânea de vários módulos grandes.
- Não introduzir microserviços, mensageria ou arquitetura distribuída sem necessidade comprovada.
- Não apagar legado ainda em uso por outras telas sem mapear impacto.
- Não transformar uma fase incremental em refactor amplo de estrutura ou design.
