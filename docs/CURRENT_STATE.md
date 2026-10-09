# Estado Atual do Projeto — MyOffice

Este documento reflete o **estado real e auditado** do repositório **MyOffice**, distinguindo claramente onde o último agente parou, o que já está implementado e funcional, o que é placeholder intencional e o que está pendente de definição (`> A confirmar`).

---

## 0. Ponto de Continuação / Handoff Ativo (Passagem de Testemunho entre Agentes)

> **INSTRUÇÃO PARA O PRÓXIMO AGENTE (Claude Code / Gemini / Codex)**:
> Sempre que iniciares uma sessão neste repositório, lê este bloco primeiro e verifica `git status` e `git diff`. Se o agente anterior tiver sido interrompido a meio de uma tarefa (por limite de quota ou contexto), retoma a partir do ponto indicado abaixo. Ao trabalhares numa tarefa, mantém este bloco atualizado.

- **Último Agente Ativo**: OpenAI Codex — `2026-10-09`
- **Estado de Validação**: 62 testes unitários passaram; lint/build Pages e instalação Bun com lock congelado passaram. Chromium na versão compilada: leitura real PDF com texto e digitalizado, CSV, Excel XLSX e OCR de fotografia; regras de sinais/saldo, revisão, duplicados, associação atómica, texto/manual, persistência e telefone. Regressões Home e oito ferramentas passaram. As 11 verificações SQL offline da entrega anterior mantêm-se; nenhum SQL alterado. Aviso conhecido de bundle grande permanece.
- **Tarefa em Andamento / Pendente de Retoma**: Leitor financeiro concluído e validado. Entrega destinada a main com publicação automática Pages; confirmar a execução mais recente antes de retomar e recolher feedback. Sem backend/API paga. Documentação em HOME.md inclui formatos, limites e passos.
- **O que foi concluído**:
  1. IDs novos com UUID aleatório criptográfico; IDs antigos preservados. Validação central de produtos/variações, quantidades, preços e transporte antes de gravar vendas.
  2. Estorno financeiro preserva original e cria compensação vinculada. Bloqueio de estornos duplicados/restauro, cancelamento de venda integrado e pagamentos de dívida preservados com motivo obrigatório.
  3. Migração idempotente das remoções financeiras antigas sem alterar saldo. Bloqueio central e visual de resets quando existe histórico operacional/financeiro.
  4. Esquema PostgreSQL offline (36 tabelas, 4 vistas), estrutura Pessoal/Business, instruções de migração e testes locais em `database/` e `tests/`. Sem conexão/backend/novas credenciais.
  5. Ideologia e requisitos aceites registados em `docs/PRODUCT_DIRECTION.md` para continuidade entre ferramentas.
  6. Home pessoal funcional e separado do Business, com documentação e backup JSON.
  7. Categorias/subcategorias e compras pessoais, aparência, datas dinâmicas e indicadores de dashboard. Migração offline 002 acrescenta quatro tabelas, totalizando 40. Migração 003 prepara financiamento/aquisição das metas.
  8. Contas AOA/USD, receita empresarial transferida para carteira separada, diário de recuperação e backup com vínculos; aquisição sem duplo débito; gráficos e categorias por tipo. Definições/ícones/scroll corrigidos.
  9. Todas as ferramentas de vida pessoal pedidas; migração 006 com 48 tabelas; recuperação/conferência auditadas e relatórios/documentos locais.
- **Próximos Passos**: Recolher feedback do Home implementado conforme `PRODUCT_DIRECTION.md` e `HOME.md`. Base de dados, autenticação e autorização serão uma fase posterior por pedido do utilizador; consultar `database/README.md` antes de qualquer conexão. Não declarar conformidade fiscal ou segurança de backend na versão local.

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
