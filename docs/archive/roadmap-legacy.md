# Roadmap Mestre

## Objetivo
Este arquivo consolida a ordem oficial de evolucao do produto para evitar dispersao de escopo em sessoes longas.

## Ordem Mestra

### Fase 1. Polimento operacional imediato
1. Corrigir bug da data na Fila.
2. Mudar o estado padrao da Fila para lista operacional completa com calendario como filtro opcional.
3. Adicionar `deliveryMode` em pedidos com suporte a `Entrega` e `Retirada`.

### Fase 2. Fundacao comercial e catalogo inteligente
4. Adicionais estruturados:
   - `product_additional_groups`
   - `product_additional_options`
   - `order_item_additionals`
5. Evoluir dominio real de produtos e variacoes:
   - `products`
   - `product_variants`
   - `recipes`
   - `recipe_ingredients`

### Fase 3. Visao centrada em cliente
6. Tela de clientes com historico, frequencia e ticket medio.
7. Entidade `customers` real e relacao com pedidos.

### Fase 4. Usuarios internos
8. Tela de usuarios e papeis.
9. Login simples com email/senha, sessao HTTP e `bcrypt`.

### Fase 5. Inteligencia de producao
10. Tela de previsao de producao baseada em pedidos ativos e receitas.
11. Planejamento por lote e por turno.

### Fase 6. Loja do cliente final
12. Tela publica da loja.
13. Checkout completo.
14. Area do cliente.

### Fase 7. Maestria mobile
15. PWA premium.
16. Melhorias de UX e performance.

### Fase 8. Maestria analitica
17. Dashboard executivo.
18. Inteligencia de demanda.

## Regra De Execucao
- Sempre concluir o bloco atual antes de abrir o proximo dominio grande.
- Priorizar backend e contrato antes de redesenhar interface.
- Validar cada bloco com `npm run test`, `npm run check` e `npm run build`.
