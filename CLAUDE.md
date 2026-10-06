# CLAUDE.md — Instruções para o Claude Code

Este repositório utiliza uma documentação central multi-agente para garantir continuidade entre **Claude Code**, **Google AI Studio / Gemini**, **OpenAI Codex** e outros agentes.

## Leitura Obrigatória Antes de Qualquer Tarefa

1. Leia **[`AGENTS.md`](./AGENTS.md)** na raiz do projeto (contém todas as regras operacionais, princípios e invariantes críticas).
2. Verifique **[`docs/CURRENT_STATE.md`](./docs/CURRENT_STATE.md) (secção "0. Ponto de Continuação / Handoff Ativo")** e execute `git status` / `git log -n 5` para saber exatamente onde o agente anterior parou e se existe alguma tarefa em andamento para retomar.
3. Consulte a documentação técnica detalhada em **[`docs/README.md`](./docs/README.md)**:
   - [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Arquitetura atual, contextos React e persistência em `localStorage`.
   - [`docs/CURRENT_STATE.md`](./docs/CURRENT_STATE.md) — O que está implementado, o que é placeholder e o que está `A confirmar`.
   - [`docs/BUSINESS_RULES.md`](./docs/BUSINESS_RULES.md) — Regras de negócio e auditoria (estoque derivado de movimentos, proibição de `DELETE` físico em histórico, empresas `ativas`/`paradas`/`desativadas`, rastreabilidade de vendas `#VND-XXXX`, Simulador de Importação Multimoeda).
   - [`docs/MODULES.md`](./docs/MODULES.md) — Detalhe de cada módulo e submódulo.
   - [`docs/UI_GUIDELINES.md`](./docs/UI_GUIDELINES.md) — Layout global (`h-14`), tokens de tema escuro (`src/index.css`) e preservação de `id`s DOM.
   - [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) — Scripts (`npm run dev`, `npm run lint`, `npm run build`).
   - [`docs/CHANGELOG_AI.md`](./docs/CHANGELOG_AI.md) — Registo de alterações entre agentes (atualize este ficheiro ao concluir alterações relevantes).

## Comandos Rápidos de Verificação

- Verificar tipos (TypeScript): `npm run lint` (`tsc --noEmit`)
- Compilar para produção: `npm run build` (`vite build`)
- Iniciar servidor de desenvolvimento (porta 3000): `npm run dev`
