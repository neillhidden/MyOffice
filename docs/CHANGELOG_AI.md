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

### [2026-10-07] — OpenAI Codex — Central de projetos
- **Pedido**: Escolher MyOffice ou BANCADA.az numa página e consultar commits/pré-visualizações.
- **Alterações**: Gerador `scripts/pages-projects.mjs`, integração no build Pages, navegação principal/catálogo e documentação. MyOffice mantém seus URLs; Bancada tem página sem versões porque o repositório está vazio, confirmado por clone, ls-remote e HTML público. Nenhuma alteração no repositório Bancada.
- **Impacto**: Somente páginas estáticas de navegação/publicação. Sem mudanças nas regras de negócio ou dados locais.
- **Validação**: 7 testes unitários, lint e build passaram; regressão de seleção, abertura de versão, estado vazio e retorno em desktop/mobile em `tests/projects-browser-regression.mjs`.
- **Pendente**: Código da BANCADA.az para configurar seu build e catálogo reais.

### [2026-10-07] — OpenAI Codex — Catálogo de versões
- **Pedido**: Escolher e testar versões anteriores sem substituir o site principal.
- **Escopo**: Catálogo em /versoes/, builds por commit, arquivo persistente de versões e isolamento do armazenamento de cada pré-visualização.
- **Validação**: 7 testes unitários, lint e build passaram. 14 snapshots históricos testados em Chromium sem erros JavaScript; armazenamento do principal preservado após limpar cada pré-visualização, pesquisa e layout móvel verificados. Primeiro commit sem aplicação indicado como indisponível.

### [2026-10-07] — OpenAI Codex — Publicação GitHub Pages
- **Pedido**: Configurar, enviar e verificar o site no GitHub Pages.
- **Alterações**: Workflow de testes/build/publicação; base do Vite configurável por ambiente para preservar desenvolvimento e Google AI Studio.
- **Validação**: Build com base `/MyOffice/` passou; teste local da versão compilada apresentou 6 produtos e tema funcional sem erros JavaScript. Push para main concluído. GitHub Actions confirmou deploy com sucesso para `b0aeecd` (run 37663969649) e apresentou URL https://neillhidden.github.io/MyOffice/. Acesso HTTP direto ao domínio público bloqueado pela política de rede deste ambiente.

### [2026-10-07] — OpenAI Codex — Integridade do front-end e esquema futuro
- **Pedido**: Resolver problemas 1–3, manter foco no front-end e guardar estrutura de base de dados para conexão futura.
- **Alterações**:
  - `src/utils/ids.ts`, `saleValidation.ts`, `financialAudit.ts`: IDs criptográficos, validação e compensação/migração idempotente de remoções antigas.
  - `src/context/StockContext.tsx` e `src/types/stock.ts`: novos IDs; validação prévia de vendas; estornos vinculados; proteção contra duplicação; cancelamento na conta original; pagamentos preservados; resets bloqueados quando há histórico.
  - Lançamentos, extratos bancários, extrato de dívida e cancelamento de venda: motivo obrigatório, histórico/estornos, erros explícitos e ausência de restauro financeiro. Definições desativam resets com histórico. IDs DOM existentes preservados.
  - `database/migrations/001_initial.sql`, `database/README.md`: esquema PostgreSQL 15+ offline com 36 tabelas, vistas de saldos, vínculos por espaço, Pessoal/Business e financeiro append-only. Sem serviço remoto ou SDK na aplicação.
  - `tests/`: 5 testes de regras, 8 regressões funcionais em Chromium isolado e 6 testes SQL em PostgreSQL embutido. `package.json` acrescenta somente o script `test`; dependências e `bun.lock` preservados.
  - Documentação de regras, arquitetura, dados, módulos, desenvolvimento e handoff atualizada. Direção de produto em `docs/PRODUCT_DIRECTION.md`.
- **Validação**: `npm test`, `npm run lint`, `npm run build` e os dois scripts de regressão passaram: 19 testes. Build apresenta apenas aviso de bundle grande.
- **Limites**: Persistência permanece no navegador. Conexão, backend, autenticação/políticas de acesso e migração efetiva estão adiados. Telas pessoais, botão de alternância e melhorias móveis não foram implementados nesta correção.

### [2026-10-06] — Google AI Studio (Gemini) — Ajustes Técnicos de Regras de Negócio (Vendas, Transporte, Banco Original, Estorno e Dívidas)
- **Objetivo**: Implementar as 5 melhorias de lógica de negócio identificadas no trabalho em paralelo:
  1. **Venda com entrega inclui custo de transporte**: `completeSale`, `seedData` e reconciliação somam `transportCost` ao total da venda (`sale.total`) e à receita financeira gerada (`BankMovement.amount`).
  2. **Venda guarda o Banco original usado (`sale.bankId`)**: Seletor de conta em `NewSaleModal` e validação em `completeSale` exigem conta ativa, da mesma Empresa e na mesma moeda da venda; `cancelSale` estorna sempre na conta original (`sale.bankId`).
  3. **Estorno/Cancelamento sem devolução dupla**: `cancelSale` cancela entregas de transporte ainda não concluídas (`status !== 'entregue' && status !== 'cancelado'`) e repõe em estoque apenas as saídas que ainda estão ativas (`!removido && !isRemoved`).
  4. **Carrinho da Venda acumula itens repetidos**: Adições repetidas do mesmo produto/variação somam a quantidade numa única linha no carrinho (`NewSaleModal`) e em `completeSale` (`StockContext`).
  5. **Dívidas rejeitam pagamento acima do saldo devedor**: `DebtPaymentModal` e `recordDebtPayment` impedem pagamentos superiores ao `remainingAmount` atual, exibem mensagem de erro clara e validam conta ativa da mesma empresa/moeda e saldo disponível.
- **Ficheiros Modificados**:
  - `src/types/stock.ts`, `src/data/seedData.ts`, `src/context/StockContext.tsx`, `src/components/caixa/NewSaleModal.tsx`, `src/components/caixa/SaleReceiptModal.tsx`, `src/components/caixa/VendaView.tsx`, `src/components/financeiro/DebtPaymentModal.tsx`, `docs/BUSINESS_RULES.md`, `docs/CURRENT_STATE.md`, `docs/CHANGELOG_AI.md`.
- **Impacto nas Regras de Negócio / Arquitetura**: Reforço de invariantes financeiras, logísticas e de estoque sem alterar a arquitetura de contextos.
- **Verificação**: Validado com `lint_applet` e `compile_applet`.

---

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
