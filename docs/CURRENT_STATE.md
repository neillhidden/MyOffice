# Estado Atual do Projeto — MyOffice

Este documento reflete o **estado real e auditado** do repositório **MyOffice**, distinguindo claramente onde o último agente parou, o que já está implementado e funcional, o que é placeholder intencional e o que está pendente de definição (`> A confirmar`).

---

## 0. Ponto de Continuação / Handoff Ativo (Passagem de Testemunho entre Agentes)

> **INSTRUÇÃO PARA O PRÓXIMO AGENTE (Claude Code / Gemini / Codex)**:
> Sempre que iniciares uma sessão neste repositório, lê este bloco primeiro e verifica `git status` e `git diff`. Se o agente anterior tiver sido interrompido a meio de uma tarefa (por limite de quota ou contexto), retoma a partir do ponto indicado abaixo. Ao trabalhares numa tarefa, mantém este bloco atualizado.

- **Último Agente Ativo**: Google AI Studio Build (Gemini) — `2026-10-22`
- **Estado de Validação**: 79 testes automatizados aprovados (`npm test`), Lint/TypeScript (`tsc --noEmit`) limpo e build Vite (`npm run build`) concluídos com 100% de sucesso.
- **Auditoria Funcional Concluída**:
  - **Ponto 1 — Venda a prazo (gravidade alta)**:
    - 1.1 Exige cliente identificado. "Consumidor final" bloqueia com mensagem dedicada junto ao campo Cliente (`#sale-client-error-msg`). Data de vencimento opcional (`#sale-due-date-input`).
    - 1.2 Ao finalizar venda a prazo, gera saída de estoque atómica (`saida`), mas NÃO gera crédito bancário nem movimentação financeira imediata. Gera Dívida a receber em Financeiro → Dívidas com o cliente, empresa e valor total (com transporte).
    - 1.3 Pagamentos parciais ou totais da dívida criam as entradas bancárias na conta escolhida. Estado dinâmico da venda: "A prazo" → "Parcialmente paga" → "Paga".
    - 1.4 Recibo de venda a prazo (`SaleReceiptModal`): exibe "Por receber", "Saldo em dívida" e link direto para a dívida (`#btn-receipt-link-debt`), omitindo menções a recebimento ou contas creditadas.
    - 1.5 Estorno de venda a prazo (`cancelSale`): repõe estoque das saídas ativas, marca a dívida vinculada como anulada (`isCancelled: true`, `status: 'anulada'`) e emite saídas bancárias de reversão para os pagamentos já liquidados. Cobre e cancela também entregas de transporte pendentes.
    - 1.6 Dashboard: faturamento conta na data da venda. O valor a prazo não é somado aos saldos bancários.
    - 1.7 Aviso no topo de Vendas (`#banner-warning-credit-sales-with-bank-credit`) identifica vendas a prazo anteriores com crédito bancário sem reescrever movimentos históricos.
  - **Ponto 2 — Preços negativos no cadastro (gravidade alta)**:
    - 2.1 Custo, preço de venda e acréscimo de variação não aceitam negativos, strings vazias inválidas, NaN nem infinito. Zero é explicitamente permitido. O aviso de venda abaixo do custo mantém-se.
    - 2.2 Valida em cada etapa do assistente (`ProductCreateModal`), tanto ao avançar normalmente como no clique direto em passos do stepper (Passos 2 e 3) e na gravação final (`handleFinalSubmit` e `handleSaveFromHeader`).
    - 2.3 Validação idêntica na edição de produto, na Lista de compras (`PurchaseListView` e `StockContext`: preço unitário, frete, outros custos >= 0; quantidade > 0) e no Simulador de Importação (`ImportSimulatorView`: preço unitário, frete/kg, frete fixo, orçamento, preço de venda >= 0; quantidade > 0).
    - 2.4 Mensagens de erro dedicadas junto aos campos com feedback visual imediato e contorno destacado.
    - 2.5 Detetor de produtos guardados com valores negativos no Estoque → Armazém (`#banner-warning-products-negative-prices` com alerta visual, detalhe por campo afetado e botão direto de correção sem alteração silenciosa).
  - **Ponto 3 — Telefone inválido em contactos (gravidade média)**:
    - 3.1 Normalização (`normalizePhone`) removendo espaços, hífens, pontos, parênteses, chavetas e barras. Validação (`isValidPhone` / `validatePhoneField`): "+" inicial opcional e 7 a 15 dígitos numéricos; aceita números nacionais de Angola e internacionais.
    - 3.2 Aplicado a Telefone principal e WhatsApp de Clientes (`ClientModal`), telefones de Funcionários (`EmployeeModal`) e Fornecedores (`SupplierModal` e criação rápida inline em `ProductCreateModal`), na criação e na edição.
    - 3.3 Mensagem de erro dedicada junto ao campo com foco automático no input inválido. Registos antigos inválidos: assinalados nas listas (`ClientesView`, `FuncionariosView`, `FornecedoresView`) com badge visual de alerta (`#invalid-phone-${id}` / `#invalid-contact-${id}`) e tooltip explicativa, sem exclusão destrutiva.
  - **Ponto 4 — Botão Voltar do navegador e Rotas Hash (gravidade média)**:
    - 4.1 Cada secção e alternância Home/Business cria uma entrada no histórico do navegador (`window.history.pushState`). Botão "Voltar" do navegador regressa à secção anterior; "Avançar" vai à seguinte.
    - 4.2 Atualizar a página (`F5`) mantém a secção. URL direto (ex.: `#/armazem`, `#/venda`, `#/home/orcamento`) abre a secção correta.
    - 4.3 Rotas com hash implementadas em `src/utils/navigationRouter.ts` prevenindo erros 404 em hospedagens estáticas (como GitHub Pages).
    - 4.4 Mantém todos os filtros que persistem em memória e `localStorage` (ex.: seleção multi-empresa e armazém no Armazém via `WarehouseFilterContext`).
  - **Ponto 5 — Estado da empresa centralizado e texto auxiliar nos Fornecedores (gravidade baixa)**:
    - 5.1 Centralização da regra de estado da empresa (`ativa`, `parada`, `desativada`) em `src/utils/companyState.ts` (`getCompanyStatus`, `isCompanyActive`, `isCompanyStopped`, `isCompanyDeactivated`, `getCompanyStatusLabel`, `getCompanyStatusTooltip`), utilizada em `StockContext`, `WarehouseFilterContext` e `FornecedoresView`.
    - 5.2 Correção do texto auxiliar e etiquetas dos três estados em Fornecedores: mostra todas as empresas vinculadas aos artigos, com indicação clara individual ("Empresa ativa: Nome", "Empresa parada (operações em pausa): Nome", "Empresa desativada (fora de serviço): Nome") e badges correspondentes.
  - **Ponto 6 — Pesquisa do cabeçalho contextual e esconder em secções sem lista (gravidade baixa)**:
    - 6.1 O campo de pesquisa do cabeçalho filtra a secção onde o utilizador se encontra (Armazém, Movimentação, Lista de compras, Defeituoso, Vendas, Transporte, Contas, Lançamentos, Dívidas, Documentos, Funcionários, Clientes, Fornecedores).
    - 6.2 Nas secções sem lista (Dashboard, Definições, Agentes, Afiliados, Simulador), o campo e o botão de pesquisa são completamente ocultados. Placeholder contextual por módulo e submissão com Enter.
  - **Ponto 7 — Lista de compras: explicação da regra de cálculo (gravidade baixa)**:
    - 7.1 Exibição de explicação curta da regra atual junto aos totais do item e no banner de regras: em "Em pesquisa", todas as cotações compõem o Total Pesquisado; o Total Selecionado considera as fontes com "Contabilizar" ativo quando a lista é marcada como "Concluído".
    - 7.2 Regra confirmada ao utilizador antes de qualquer alteração de cálculo.
  - **Ponto 8 — Dados de exemplo coerentes com os produtos (gravidade baixa)**:
    - 8.1 Correção dos dados de exemplo em `INITIAL_MOVEMENTS` e `INITIAL_DEFECTIVE_RECORDS` (`seedData.ts` e migração segura em `StockContext.tsx` sem tocar em registos criados pelo utilizador): Fritadeira Air Fryer com avaria e movimento de transporte correspondentes a danos estruturais/carcaça, PlayStation 5 sem referências a restaurantes, Comandos DualSense sem referências a cimento/fábricas de cimento, e Ração de cães sem referências a fábricas de detergente.
- **Próximos Passos**: Base de código estável, testada e pronta. Aguardar feedback do utilizador.


---

## 1. Funcionalidades Totalmente Implementadas e Funcionais (Frontend + Persistência Local)

### 1.1. Layout Global, Navegação e Tema
- [x] Barra lateral (`Sidebar.tsx`) colapsável (`w-60` / `w-16`), com acordeão no modo expandido e *flyouts* via `createPortal` no modo recolhido.
- [x] Alinhamento exato (`h-14` / `56px`) entre o topo da barra lateral e o `<Header>` principal, e alinhamento horizontal (`px-4 sm:px-6 lg:px-8` + `max-w-7xl mx-auto`) entre o `<Header>` e a área `<main>`.
- [x] Controlo de tema Claro/Escuro unificado no `<Header>` (`#btn-toggle-theme`) — removido do rodapé da barra lateral.
- [x] Sistema de notificações no cabeçalho com contador de não lidas, filtro (`Todas` / `Não lidas`) e navegação para o item de origem.

### 1.2. Módulo `Dashboard`
- [x] Comparação de desempenho de vendas por período (`Semana`, `Mês`, `Ano`) face ao período anterior.
- [x] Filtro por empresa (respeitando empresas `ativas`, `paradas` e `desativadas`) e moeda.
- [x] Cartões KPI, gráfico comparativo (Recharts) e lista de produtos mais vendidos.

### 1.3. Módulo `Estoque`
- [x] **Armazém (`WarehouseStockView.tsx`)**: KPIs de estoque, cápsula de filtros multi-seleção persistente em memória (`WarehouseFilterContext`), pesquisa, criação/edição de produtos, rascunhos (`DraftsListModal`) e modal detalhado (`ProductDetailModal`) com abas Geral, Estoque por Armazém, Variações e Histórico.
- [x] **Movimentação (`MovementsView.tsx`)**: Registo de entradas, saídas e transferências; abas **Histórico** e **Removidos**; botão **Remover do histórico** com modal de motivo obrigatório, recálculo imediato de estoque, notificação ao Administrador e botão **Restaurar**.
- [x] **Simulador de Importação e Rentabilidade (`ImportSimulatorView.tsx`)**: Sistema multimoeda completo (`MonetaryRecord`), distinção `"Informado"` vs. `"Estimativa"` vs. `"Não informado"`, cálculo de peso real/volumétrico/taxável, impostos e base tributável, despesas comerciais, orçamento, precificação, cenários de venda parcial (separando Lucro das Unidades Vendidas, Fluxo de Caixa no Momento e Valor do Stock Restante), análise de sensibilidade, comparador de simulações e dicas de ajuda acessíveis (`SimulatorHelpTooltip`).
- [x] **Lista de compras (`PurchaseListView.tsx`)**: Gestão de grupos e listas de compras, múltiplas fontes de fornecedores por item, conversão cambial e conclusão de compra com entrada automática em estoque e saída bancária.
- [x] **Defeituoso (`DefectiveView.tsx`)**: Registo de avarias com baixa automática no estoque e atualização de estado de resolução.

### 1.4. Módulo `Caixa`
- [x] **Venda (`VendaView.tsx`, `NewSaleModal.tsx`, `SaleReceiptModal.tsx`)**: Ponto de venda (POS) com validação de estoque, escolha de banco e opção de entrega; recibo de venda com secção **"Registos gerados por esta venda:"** e links diretos que abrem e filtram **Estoque → Movimentação**, **Financeiro → Lançamentos** e **Caixa → Transporte**.
- [x] **Transporte (`TransporteView.tsx`, `TransportModal.tsx`)**: Gestão de entregas, estados logísticos, prioridades, filtro externo por código de venda e reconciliação automática de vendas com `requiresTransport: true`.

### 1.5. Módulo `Financeiro`
- [x] **Contas (`BankView.tsx`)**: Gestão de contas bancárias e cofres por empresa e moeda, com extrato individual.
- [x] **Lançamentos (`LancamentosView.tsx`)**: Livro-razão imutável de entradas, saídas e transferências, com mecanismo de **Estorno** auditado e filtro externo por venda.
- [x] **Dívidas (`DividasView.tsx`)**: Controlo de contas a receber e a pagar, amortizações parciais/totais integradas com bancos e aditivos de dívida.

### 1.6. Módulo `Contactos`, `Calendário` e `Definições`
- [x] **Contactos**: CRUD completo de **Funcionários**, **Clientes** (com histórico de compras) e **Fornecedores**.
- [x] **Calendário**: Vistas Semana/Mês/Ano e Grade/Lista; agendas manuais e agendas automáticas sincronizadas com aniversários de funcionários e entregas de transporte.
- [x] **Definições**: Gestão de Empresas (`ativa`, `parada`, `desativada`), Armazéns e ferramentas de reposição de dados (apenas histórico ou padrão de fábrica).

---

## 2. Módulos Reservados / Em Desenvolvimento (Placeholders Intencionais)

1. **Contactos → Afiliados (`src/components/contacts/AfiliadosView.tsx`)**:
   - Atualmente apresenta um ecrã informativo com etiqueta **`Em Breve`** ("Programa de Afiliados & Promotores — Links Únicos, Comissões, Desempenho").
   - *Regras detalhadas de comissionamento e estrutura de dados de afiliados*: **A confirmar**.
2. **Módulo `Agentes` (`src/components/layout/OutOfServiceView.tsx`)**:
   - Item presente na barra lateral que renderiza a vista padrão `OutOfServiceView` indicando que a área está reservada para expansões futuras.
   - *Escopo funcional do módulo Agentes*: **A confirmar**.
3. **Ficheiro Legado `src/components/analytics/ProductAnalyticsView.tsx`**:
   - Ficheiro mantido na árvore de componentes, mas substituído na navegação pelo `ImportSimulatorView.tsx` (tanto `'Simulador de Importação e Rentabilidade'` como `'Análise de produtos'` em `App.tsx` renderizam `<ImportSimulatorView />`).

---

## 3. O que NÃO está implementado (Pontos `> A confirmar`)

- **Backend / API Server**: Não existe servidor Node/Express ativo nem endpoints HTTP (`> A confirmar`).
- **Base de Dados Remota**: Todos os dados residem em `window.localStorage` (`> A confirmar` futura migração para PostgreSQL / Cloud SQL / Firebase / Supabase).
- **Autenticação e Permissões por Utilizador (`Employee.accessPermissions`)**: O campo `accessPermissions?: string[]` existe na interface `Employee`, mas ainda não há sistema de login ou controlo de acesso por sessão (`> A confirmar`).
- **Testes Automatizados no Repositório**: Existem testes unitários executados por `npm test`, percursos de navegador e testes SQL offline em `tests/`. TypeScript é verificado por `npm run lint`; a compilação por `npm run build`.
