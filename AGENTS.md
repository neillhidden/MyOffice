# AGENTS.md — Guia Principal para Agentes de IA (MyOffice)

> **PONTO DE ENTRADA OBRIGATÓRIO PARA QUALQUER AGENTE DE IA**
> (Google AI Studio / Gemini, Claude Code, OpenAI Codex, Cursor, Windsurf ou qualquer outro assistente de engenharia de software)

---

## 1. Projeto

- **Nome**: **MyOffice**
- **Objetivo**: Sistema ERP / Gestão Empresarial Multi-Empresa e Multi-Armazém orientado para a realidade operacional, comercial, cambial e logística de Angola (moeda-base **AOA / Kz**).
- **Descrição Resumida**: Aplicação web SPA em React 19 + TypeScript + Vite + Tailwind CSS v4 que consolida numa única interface:
  - **Dashboard** comparativo de vendas por período e empresa;
  - **Estoque** (*Armazém*, *Movimentação*, *Simulador de Importação e Rentabilidade Multimoeda*, *Lista de compras*, *Defeituoso*);
  - **Caixa** (*Venda / POS* e *Transporte / Entregas*);
  - **Financeiro** (*Contas / Bancos*, *Lançamentos* e *Dívidas*);
  - **Contactos** (*Funcionários*, *Clientes*, *Fornecedores* e *Afiliados*);
  - **Calendário** (agendas manuais e automáticas de aniversários e entregas);
  - **Definições** (gestão de empresas, armazéns e reposição controlada de dados).

---

## 2. Fonte de Verdade

> **Código + Git + Documentação atualizada em `docs/` = ÚNICA FONTE DE VERDADE.**

- **Nenhum agente específico é dono deste projeto.** Gemini, Claude Code, Codex ou qualquer outro agente são ferramentas que operam sobre a mesma base de código.
- Conversas anteriores mantidas em sessões de chat (no Google AI Studio, Claude, ChatGPT, etc.) **NÃO devem ser consideradas fonte de verdade** se não estiverem refletidas no código do repositório ou na pasta `docs/`.
- Quando alguma informação sobre integrações futuras, backend ou requisitos de negócio não puder ser determinada pelo código nem pela documentação, deve ser tratada e documentada como **`> A confirmar`** — nunca inventada.

---

## 3. Protocolo Obrigatório Antes de Modificar Código

Todo agente de IA **DEVE** cumprir estes 7 passos antes de editar ou criar qualquer ficheiro de código:

1. **Ler `AGENTS.md`** (este ficheiro) na íntegra.
2. **Consultar [`docs/CURRENT_STATE.md`](./docs/CURRENT_STATE.md) (secção "Ponto de Continuação / Handoff Ativo")** e verificar `git status` / `git diff` / `git log -n 5` para identificar imediatamente **onde o agente anterior parou** e se existe alguma tarefa a meio que precisa de ser retomada e concluída.
3. **Consultar [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** para compreender o modelo de estado (`StockContext`, `ThemeContext`, `WarehouseFilterContext`), persistência em `localStorage` e fluxo de dados.
4. **Consultar a documentação específica** do domínio que será alterado:
   - [`docs/MODULES.md`](./docs/MODULES.md) — detalhe funcional de cada módulo/submódulo;
   - [`docs/BUSINESS_RULES.md`](./docs/BUSINESS_RULES.md) — invariantes de negócio e auditoria que **nunca** podem ser violadas;
   - [`docs/UI_GUIDELINES.md`](./docs/UI_GUIDELINES.md) — layout global (`h-14`), tokens de tema escuro (`src/index.css`) e IDs de elementos DOM;
   - [`docs/DATABASE.md`](./docs/DATABASE.md) e [`docs/API.md`](./docs/API.md) — estrutura atual de dados (`localStorage` + seed) e estado de backend/API.
5. **Analisar o código-fonte relacionado** antes de editar qualquer ficheiro.
6. **Verificar alterações recentes** em [`docs/CHANGELOG_AI.md`](./docs/CHANGELOG_AI.md) e no histórico Git (`git log` / `git status`).
7. **Manter o Handoff atualizado**: Ao iniciar ou concluir etapas de uma tarefa, atualizar a secção **"Ponto de Continuação / Handoff Ativo"** em [`docs/CURRENT_STATE.md`](./docs/CURRENT_STATE.md) e registar no [`docs/CHANGELOG_AI.md`](./docs/CHANGELOG_AI.md) para que, mesmo que a sessão seja interrompida por limite de quota/contexto e o utilizador faça commit para continuar noutro agente, o próximo agente saiba exatamente onde retomar.

---

## 4. Princípios de Engenharia para Múltiplos Agentes

1. **Preservar o comportamento existente**: Não quebrar fluxos já validados em auditorias anteriores.
2. **Não fazer grandes refatorações sem necessidade**: Alterar apenas os ficheiros estritamente necessários para a tarefa pedida.
3. **Não mudar a arquitetura sem autorização explícita**: Não substituir Context API, não alterar a estrutura de pastas nem introduzir bibliotecas de estado ou UI sem pedido explícito do utilizador.
4. **Não remover funcionalidades existentes sem autorização**: Mesmo funcionalidades secundárias (rascunhos de produto, filtros multi-empresa, tooltips de ajuda, restauro de movimentos removidos) fazem parte do contrato da aplicação.
5. **Não inventar requisitos nem regras fiscais**: Especialmente no Simulador de Importação, nunca inventar taxas oficiais nem assumir valores desconhecidos como reais (`"Não informado"` vs. `"Estimativa"` vs. `"Informado"`).
6. **Não duplicar componentes, tipos ou utilitários**: Verificar sempre `src/types/`, `src/utils/formatters.ts` e `src/components/common/` antes de criar funções ou componentes novos.
7. **Reutilizar padrões existentes**: Seguir o sistema de modais, badges, filtros e tokens de tema escuro (`dark:bg-dm-surface`, `dark:border-dm-border`, etc.) já estabelecidos.
8. **Manter compatibilidade com IDs de DOM**: Preservar atributos `id="..."` existentes nos botões, inputs, abas e tabelas (usados em verificações automatizadas e auditorias).
9. **Fazer alterações pequenas, atómicas e rastreáveis**: Validar sempre com `npm run lint` (`tsc --noEmit`) e `npm run build` (`vite build`).
10. **Documentar decisões e alterações**: Sempre que uma tarefa alterar regras de negócio, modelos de dados, módulos ou decisões arquiteturais, atualizar o ficheiro correspondente em `docs/` e registar um resumo em [`docs/CHANGELOG_AI.md`](./docs/CHANGELOG_AI.md).

---

## 5. Resumo das Invariantes Críticas (Não Violar)

Consulte [`docs/BUSINESS_RULES.md`](./docs/BUSINESS_RULES.md) para o detalhe completo. Em resumo:

- **Estoque nunca é editado diretamente**: O saldo de um produto num armazém é sempre calculado a partir das movimentações (`getCurrentStock`), ignorando movimentos com `removido: true` / `isRemoved: true`.
- **Proibição de `DELETE` físico em Movimentações e Lançamentos**:
  - Em **Estoque → Movimentação**, a remoção marca `removido: true` (com motivo obrigatório, autor e data), move o registo para a aba **Removidos**, gera notificação para o Administrador e permite **Restaurar**.
  - Em **Financeiro → Lançamentos**, lançamentos são imutáveis; correções fazem-se por lançamento inverso/estorno.
- **Três estados de Empresa (`ativa` | `parada` | `desativada`)**:
  - `desativada` (ex.: *Kianda*): invisível/excluída de todas as vistas operacionais, seletores e gráficos.
  - `parada`: visível com etiqueta `Parada` e banner de aviso, mas com todas as ações operacionais (criar/editar produto, movimentar estoque, vender, alterar limites) bloqueadas (`disabled`).
  - `ativa`: totalmente operacional.
- **Rastreabilidade de Venda (`#VND-XXXX`)**:
  - Toda venda concluída tem obrigatoriamente saída de estoque vinculada (`saleId` / `reference`), entrada financeira vinculada (`saleId` / `reference`) e, quando `requiresTransport: true`, registo em **Caixa → Transporte**.
  - O recibo de venda (`SaleReceiptModal`) inclui links diretos que abrem e filtram cada um desses 3 destinos.
- **Layout Global Sincronizado**:
  - O topo da `Sidebar` e o `<Header>` principal partilham a altura fixa `h-14` (`56px`) e a mesma linha divisória inferior (`border-b`).
  - O controlo de alternância de tema (Claro/Escuro) mantém o atalho no `<Header>` superior (`#btn-toggle-theme`) e, por pedido do utilizador de 2026-10-08, opções Claro/Anoitecer/Sistema nas Definições. Nunca colocar tema no rodapé; esse local contém o seletor Home/Business.

---

## 6. Índice da Documentação Central (`docs/`)

| Ficheiro | Conteúdo |
| :--- | :--- |
| [`docs/README.md`](./docs/README.md) | Visão geral do projeto e índice navegável de toda a documentação |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Arquitetura real (SPA React, Contexts, `localStorage`, reconciliação, diagramas Mermaid) |
| [`docs/PROJECT_STRUCTURE.md`](./docs/PROJECT_STRUCTURE.md) | Árvore completa de pastas e responsabilidade de cada ficheiro |
| [`docs/MODULES.md`](./docs/MODULES.md) | Catálogo detalhado de todos os módulos, submódulos, vistas e modais |
| [`docs/BUSINESS_RULES.md`](./docs/BUSINESS_RULES.md) | Regras de negócio, fórmulas de cálculo, auditoria e invariantes |
| [`docs/DATABASE.md`](./docs/DATABASE.md) | Modelo de dados atual (`src/types/`), chaves de `localStorage` e dados de *seed* |
| [`docs/API.md`](./docs/API.md) | Estado atual de APIs/backend (100% client-side atualmente) e diretrizes para futura API |
| [`docs/UI_GUIDELINES.md`](./docs/UI_GUIDELINES.md) | Regras de layout global, grelhas, paleta Dark Mode (`src/index.css`), tipografia e acessibilidade |
| [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) | Comandos (`dev`, `build`, `lint`), variáveis de ambiente e fluxo de trabalho |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md) | Registo de decisões arquiteturais (ADRs) tomadas no projeto |
| [`docs/CURRENT_STATE.md`](./docs/CURRENT_STATE.md) | Estado real de implementação por módulo, lacunas conhecidas e pontos `A confirmar` |
| [`docs/CHANGELOG_AI.md`](./docs/CHANGELOG_AI.md) | Histórico cronológico de intervenções de agentes de IA e modelo para novos registos |
