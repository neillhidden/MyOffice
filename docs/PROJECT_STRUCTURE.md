# Estrutura do Projeto — MyOffice

Este documento descreve a árvore completa de diretórios e ficheiros do repositório **MyOffice**, indicando a responsabilidade exata de cada ficheiro.

---

## 1. Árvore Completa de Ficheiros

```text
/
├── .env.example                                  # Exemplo de variáveis de ambiente (GEMINI_API_KEY, APP_URL)
├── .gitignore                                    # Ficheiros ignorados pelo Git
├── AGENTS.md                                     # Guia principal e protocolo obrigatório para agentes de IA
├── CLAUDE.md                                     # Ponto de entrada rápido para o Claude Code (aponta para AGENTS.md)
├── bun.lock                                      # Lockfile de pacotes
├── index.html                                    # HTML raiz (idioma pt, fonte Plus Jakarta Sans, metadados SEO/OG)
├── metadata.json                                 # Metadados da aplicação no Google AI Studio
├── package.json                                  # Scripts e dependências NPM
├── tsconfig.json                                 # Configuração do compilador TypeScript
├── vite.config.ts                                # Configuração do bundler Vite + plugin React + Tailwind v4
├── docs/                                         # Documentação técnica central multi-agente
│   ├── README.md                                 # Índice geral da documentação
│   ├── ARCHITECTURE.md                           # Arquitetura, contextos, fluxo de dados e diagramas
│   ├── PROJECT_STRUCTURE.md                      # Este documento (mapa de pastas e ficheiros)
│   ├── MODULES.md                                # Especificação funcional de todos os módulos
│   ├── BUSINESS_RULES.md                         # Regras de negócio, cálculos e auditoria
│   ├── DATABASE.md                               # Modelos de dados, chaves localStorage e seeds
│   ├── API.md                                    # Estado de APIs/backend e plano de integração
│   ├── UI_GUIDELINES.md                          # Regras de layout, tema escuro, grelhas e IDs DOM
│   ├── DEVELOPMENT.md                            # Comandos, setup e verificação de build
│   ├── DECISIONS.md                              # Decisões arquiteturais (ADRs)
│   ├── CURRENT_STATE.md                          # Estado atual de implementação e pendências
│   └── CHANGELOG_AI.md                           # Registo cronológico de alterações por agentes de IA
├── public/
│   └── assets/                                   # Ativos estáticos públicos
└── src/
    ├── main.tsx                                  # Entrada React (monta <App /> em #root)
    ├── App.tsx                                   # Shell global, roteamento por estado, Sidebar, Header e modais globais
    ├── index.css                                 # Importação Tailwind v4 + tokens e regras globais do Modo Escuro (.dark)
    ├── context/
    │   ├── StockContext.tsx                      # Estado global de negócio, CRUDs, auditoria, vendas e localStorage
    │   ├── ThemeContext.tsx                      # Gestão do tema Claro / Escuro / Sistema
    │   └── WarehouseFilterContext.tsx            # Persistência em memória dos filtros de Estoque -> Armazém
    ├── data/
    │   ├── seedData.ts                           # Dados iniciais (empresas, armazéns, produtos, movimentos, vendas, bancos, etc.)
    │   ├── calendarSeedData.ts                   # Dados iniciais de agendas e eventos do Calendário
    │   └── kiandaSeedData.ts                     # Dados da empresa desativada "Kianda" (para validação de isolamento)
    ├── types/
    │   ├── stock.ts                              # Interfaces centrais (Company, Warehouse, Product, Movement, Sale, Bank, Debt, Transport, etc.)
    │   ├── importSimulator.ts                    # Tipos, moedas, estrutura MonetaryRecord e motor de cálculo do Simulador de Importação
    │   ├── calendar.ts                           # Interfaces de Agenda e CalendarEvent
    │   ├── client.ts                             # Interface Client (Clientes)
    │   ├── employee.ts                           # Interface Employee (Funcionários)
    │   └── notification.ts                       # Interface NotificationItem e tipos de alerta
    ├── utils/
    │   └── formatters.ts                         # Formatação de moeda (Kz, USD, EUR, CNY), datas (pt-AO) e gerador de SKU
    └── components/
        ├── common/
        │   └── PositiveBadge.tsx                 # Distintivo reutilizável para indicadores positivos
        ├── layout/
        │   ├── Sidebar.tsx                       # Barra lateral colapsável (w-60 / w-16), submenus acordeão e flyouts com portal
        │   ├── Header.tsx                        # Cabeçalho fixo (h-14) com Breadcrumb, câmbio, pesquisa, botão de tema e notificações
        │   └── OutOfServiceView.tsx              # Vista placeholder para módulos ainda não implementados (ex.: Agentes)
        ├── dashboard/
        │   ├── DashboardView.tsx                 # Vista principal do Dashboard comparativo
        │   ├── DashboardMetricCard.tsx           # Cartão individual de métrica com variação percentual
        │   ├── DashboardChart.tsx                # Gráfico comparativo de vendas (período atual vs. anterior)
        │   ├── TopProductsList.tsx               # Ranking dos produtos mais vendidos no período
        │   └── dashboardUtils.ts                 # Cálculos agregados de vendas, períodos e variação percentual
        ├── stock/
        │   ├── WarehouseStockView.tsx            # Submódulo Estoque -> Armazém (KPIs, cápsula de filtros e tabela de produtos)
        │   └── FilterCheckboxDropdown.tsx        # Componente dropdown multi-seleção com pesquisa e contadores
        ├── products/
        │   ├── ProductCreateModal.tsx            # Modal de criação/edição de produto e gravação de rascunhos
        │   ├── ProductDetailModal.tsx            # Modal de detalhe do produto (Visão Geral, Estoque por Armazém, Variações, Histórico)
        │   ├── DraftsListModal.tsx               # Modal de gestão e retoma de rascunhos de produtos
        │   └── ColorPickerInput.tsx              # Seletor de cor para variações de produto
        ├── movements/
        │   ├── MovementsView.tsx                 # Submódulo Estoque -> Movimentação (abas Histórico e Removidos + modal de remoção)
        │   └── MovementCreateModal.tsx           # Modal para registar Entrada, Saída ou Transferência entre armazéns
        ├── analytics/
        │   ├── ImportSimulatorView.tsx           # Submódulo Simulador de Importação e Rentabilidade (Multimoeda)
        │   ├── ImportComparatorPanel.tsx         # Painel comparador lado a lado de simulações guardadas
        │   ├── SimulatorHelpTooltip.tsx          # Componente acessível de dica explicativa (ⓘ) por rato, toque e teclado
        │   ├── simulatorHelpTexts.ts             # Dicionário de textos educativos em português simples para o simulador
        │   └── ProductAnalyticsView.tsx          # Vista legada de análise de produtos (substituída pelo ImportSimulatorView)
        ├── purchases/
        │   └── PurchaseListView.tsx              # Submódulo Estoque -> Lista de compras (grupos, listas, itens, fontes e conclusão)
        ├── defective/
        │   └── DefectiveView.tsx                 # Submódulo Estoque -> Defeituoso (registo e resolução de avarias)
        ├── caixa/
        │   ├── VendaView.tsx                     # Submódulo Caixa -> Venda (histórico de vendas, KPIs e filtros)
        │   ├── NewSaleModal.tsx                  # Modal POS de Nova Venda (carrinho, validação de stock, pagamento e transporte)
        │   ├── SaleReceiptModal.tsx              # Modal de Recibo de Venda com links diretos para Estoque, Financeiro e Transporte
        │   ├── TransporteView.tsx                # Submódulo Caixa -> Transporte (gestão de entregas e estados logísticos)
        │   └── TransportModal.tsx                # Modal de criação/edição de entrega e atualização de estado
        ├── banks/
        │   ├── BankView.tsx                      # Submódulo Financeiro -> Contas (cartões de contas bancárias/caixa e saldos)
        │   ├── BankModal.tsx                     # Modal de criação/edição de conta bancária ou cofre
        │   ├── BankMovementModal.tsx             # Modal de depósito, levantamento ou transferência bancária
        │   └── BankLedgerModal.tsx               # Extrato detalhado de uma conta bancária específica
        ├── financeiro/
        │   ├── FinanceiroView.tsx                # Contentor de navegação do módulo Financeiro (Contas, Lançamentos, Dívidas)
        │   ├── LancamentosView.tsx               # Submódulo Financeiro -> Lançamentos (livro-razão imutável e estornos)
        │   ├── LancamentoModal.tsx               # Modal para novo lançamento financeiro ou transferência
        │   ├── DividasView.tsx                   # Submódulo Financeiro -> Dívidas (contas a receber e a pagar)
        │   ├── DebtModal.tsx                     # Modal de registo de nova dívida
        │   ├── DebtPaymentModal.tsx              # Modal de amortização parcial/total de dívida
        │   ├── DebtIncrementModal.tsx            # Modal para adicionar novo valor a uma dívida existente
        │   └── DebtLedgerModal.tsx               # Histórico de amortizações e incrementos de uma dívida
        ├── contacts/
        │   ├── index.ts                          # Barrel export das vistas de Contactos
        │   ├── FuncionariosView.tsx              # Submódulo Contactos -> Funcionários
        │   ├── EmployeeModal.tsx                 # Modal de criação/edição de funcionário
        │   ├── ClientesView.tsx                  # Submódulo Contactos -> Clientes (inclui histórico de compras do cliente)
        │   ├── ClientModal.tsx                   # Modal de criação/edição de cliente
        │   ├── FornecedoresView.tsx              # Submódulo Contactos -> Fornecedores
        │   ├── SupplierModal.tsx                 # Modal de criação/edição de fornecedor
        │   └── AfiliadosView.tsx                 # Submódulo Contactos -> Afiliados (placeholder estruturado "Em Breve")
        ├── calendar/
        │   ├── CalendarView.tsx                  # Módulo Calendário (coordena agendas, vistas e modais)
        │   ├── CalendarHeader.tsx                # Barra de controlo do calendário (Hoje, navegação, Semana/Mês/Ano, Grade/Lista)
        │   ├── CalendarSidebarAgendas.tsx        # Painel lateral de filtro de agendas (manuais e automáticas)
        │   ├── CalendarMonthGrid.tsx             # Vista em grelha mensal
        │   ├── CalendarWeekGrid.tsx              # Vista em grelha semanal
        │   ├── CalendarYearGrid.tsx              # Vista anual compacta
        │   ├── CalendarListView.tsx              # Vista em lista cronológica de eventos
        │   ├── AgendaModal.tsx                   # Modal de criação/edição de agenda manual
        │   ├── EventModal.tsx                    # Modal de criação/edição de evento
        │   └── EventDetailModal.tsx              # Modal de detalhes do evento com link para a origem (funcionário/transporte/venda)
        └── settings/
            ├── SettingsView.tsx                  # Módulo Definições (abas Empresas, Armazéns e Repor Dados)
            ├── CompanyModal.tsx                  # Modal de criação/edição de empresa e alteração de estado
            ├── DeleteCompanyModal.tsx            # Modal de confirmação para eliminar empresa sem vínculos
            ├── WarehouseModal.tsx                # Modal de criação/edição de armazém ou loja física
            └── ResetSettingsModal.tsx            # Modal de confirmação com palavra-passe/confirmação para limpeza de dados
```

---

## 2. Convenções de Organização

1. **Tipos Separados por Domínio (`src/types/`)**:
   - `stock.ts` concentra as entidades transacionais core (Empresas, Armazéns, Produtos, Movimentos, Vendas, Transportes, Bancos, Dívidas).
   - `importSimulator.ts` encapsula tanto as interfaces como as funções puras de cálculo (`computeSimulationMetrics`, `createMonetaryRecord`, `normalizeSimulation`) do Simulador de Importação.
2. **Componentes Agrupados por Módulo (`src/components/<modulo>/`)**:
   - Cada pasta de módulo contém a sua `*View.tsx` principal e os seus `*Modal.tsx` específicos.
   - Modais que podem ser invocados a partir de múltiplos módulos ou do cabeçalho global (`ProductCreateModal`, `ProductDetailModal`, `MovementCreateModal`, `DraftsListModal`) são montados no final de `src/App.tsx`.

## Ferramentas pessoais Home — 09/10/2026

- `src/components/home/HomeTools.tsx`: calendário/detalhes de tarefas, histórico, dívidas, previsões, relatórios, extratos e documentos; usa componentes/persistência existentes.
- `src/utils/homeExtensions.ts`: operações e validação das entidades adicionais.
- `src/utils/homeAnalysis.ts`: calendário/previsões/relatórios e interpretação CSV.
- `database/migrations/006_home_life_tools.sql`: preparação offline, sem conexão.
- `tests/home-extensions.test.ts`, `tests/home-tools-browser.mjs`, `tests/home-tools-database-regression.mjs`: regras, interface e schema offline.
