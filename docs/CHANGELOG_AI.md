# Histórico de Alterações por Agentes de IA (`CHANGELOG_AI.md`)

Este ficheiro regista cronologicamente as intervenções realizadas por diferentes agentes de IA (**Google AI Studio / Gemini**, **Claude Code**, **OpenAI Codex**, etc.) no repositório **MyOffice**, garantindo passagem de testemunho clara entre sessões.

---

## Modelo para Registo de Novas Alterações

Sempre que um agente concluir uma tarefa relevante, deve adicionar uma entrada no topo da secção **Histórico de Intervenções** seguindo este formato:

```markdown
### [AAAA-MM-DD] — <Nome do Agente / Ferramenta> — <Título Curto da Tarefa>
- **Objetivo**: Breve descrição do pedido do utilizador.
- **Ficheiros Modificados / Criados**:
  - `caminho/do/ficheiro.tsx`: Resumo da alteração.
- **Impacto nas Regras de Negócio / Arquitetura**: Indicar se alguma regra mudou ou se apenas ajustou UI/bugfix.
- **Verificação**: Resultado de `npm run lint` e `npm run build`.
```

---

## Histórico de Intervenções

### [2026-10-05] — Google AI Studio (Gemini) — Criação da Documentação Central Multi-Agente
- **Objetivo**: Auditar todo o repositório MyOffice e criar a estrutura documental completa (`AGENTS.md`, `CLAUDE.md` e `docs/*`) para desenvolvimento partilhado entre Google AI Studio / Gemini, Claude Code e OpenAI Codex, sem refatorar código da aplicação.
- **Ficheiros Criados**:
  - `AGENTS.md` e `CLAUDE.md` (na raiz do repositório)
  - `docs/README.md`, `docs/ARCHITECTURE.md`, `docs/PROJECT_STRUCTURE.md`, `docs/MODULES.md`, `docs/BUSINESS_RULES.md`, `docs/DATABASE.md`, `docs/API.md`, `docs/UI_GUIDELINES.md`, `docs/DEVELOPMENT.md`, `docs/DECISIONS.md`, `docs/CURRENT_STATE.md`, `docs/CHANGELOG_AI.md`
- **Impacto nas Regras de Negócio / Arquitetura**: Nenhuma alteração ao código-fonte ou comportamento da aplicação. Documentação integral do estado real do projeto.
- **Verificação**: Compilação validada (`compile_applet` / `vite build`).

---

### [2026-10-05] — Google AI Studio (Gemini) — Alinhamento do Layout Global e Remoção do Tema no Rodapé da Sidebar
- **Objetivo**: Alinhar a altura do topo da barra lateral e do cabeçalho principal (`h-14`), alinhar horizontalmente o cabeçalho com o contentor principal (`max-w-7xl mx-auto` e `px-4 sm:px-6 lg:px-8`), centrar verticalmente os controlos do cabeçalho (`h-8`) e remover o botão `"Modo Claro / DARK"` do rodapé da barra lateral.
- **Ficheiros Modificados**:
  - `src/components/layout/Sidebar.tsx`: Topo fixado em `h-14 shrink-0`, `<nav>` com `flex-1 overflow-y-auto`, remoção do botão de tema no rodapé.
  - `src/components/layout/Header.tsx`: Altura fixa `h-14 shrink-0`, alinhamento horizontal com `max-w-7xl mx-auto` e botões/indicadores padronizados em `h-8`.
  - `src/App.tsx`: Ajuste do contentor principal `<main>` para alinhar perfeitamente abaixo do `<Header>`.
  - `src/components/products/ProductDetailModal.tsx`: Garantia de desativação (`disabled`) de todos os botões de ação quando a empresa está no estado `parada`.
- **Verificação**: Build validado com sucesso.

---

### [2026-10-05] — Google AI Studio (Gemini) — Auditoria de Movimentações, Rastreabilidade de Vendas e Reconciliação de Transporte
- **Objetivo**: Implementar os 4 pontos de reforço de auditoria e rastreabilidade:
  1. Funcionalidade **"Remover do histórico"** em **Estoque → Movimentação** com motivo obrigatório, aba **Removidos**, botão **Restaurar**, recálculo imediato de estoque e notificação ao Administrador (sem apagar linhas da base de dados).
  2. Secção **"Registos gerados por esta venda:"** no recibo de venda (`SaleReceiptModal`) com links diretos e filtrados para Estoque, Financeiro e Transporte.
  3. Garantia de registo de transporte (`TRP-1005` para `VND-1005` e reconciliação automática) para todas as vendas com `requiresTransport: true`.
  4. Bloqueio de ações para empresas com estado `parada`.
- **Ficheiros Modificados**:
  - `src/types/stock.ts`, `src/data/seedData.ts`, `src/context/StockContext.tsx`, `src/components/movements/MovementsView.tsx`, `src/components/caixa/SaleReceiptModal.tsx`, `src/components/caixa/VendaView.tsx`, `src/components/caixa/TransporteView.tsx`, `src/components/financeiro/FinanceiroView.tsx`, `src/components/financeiro/LancamentosView.tsx`, `src/App.tsx`.

---

### [Iterações Anteriores] — Google AI Studio (Gemini) — Implementação e Evolução do Simulador de Importação e Rentabilidade (Multimoeda)
- **Objetivo**:
  - Substituir a antiga vista "Análise de produtos" pelo **Simulador de Importação e Rentabilidade**.
  - Implementar arquitetura **Multimoeda** (`MonetaryRecord` com separação entre moeda de origem de cada custo e moeda-base `AOA / Kz`).
  - Adicionar dicas de ajuda acessíveis (`SimulatorHelpTooltip` e `simulatorHelpTexts.ts`) em linguagem simples com exemplos em Kwanzas.
  - Distinguir nos cenários de venda parcial o **Lucro das Unidades Vendidas**, o **Fluxo de Caixa no Momento** e o **Valor do Stock Restante**.
  - Organizar o layout do simulador numa grelha regular de 12 colunas (`lg:col-span-8` para etapas 1–8 à esquerda e `lg:col-span-4` para o painel de resultados à direita).
- **Ficheiros Principais**:
  - `src/types/importSimulator.ts`, `src/components/analytics/ImportSimulatorView.tsx`, `src/components/analytics/ImportComparatorPanel.tsx`, `src/components/analytics/SimulatorHelpTooltip.tsx`, `src/components/analytics/simulatorHelpTexts.ts`.
