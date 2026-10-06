# Catálogo de Módulos e Submódulos — MyOffice

Este documento detalha todos os módulos e submódulos existentes na aplicação **MyOffice**, os componentes responsáveis e as funcionalidades de cada um.

---

## 1. Visão Geral dos Módulos na Barra Lateral (`Sidebar.tsx`)

| Módulo Principal | Submódulos | Estado Atual | Componente(s) Principal(is) |
| :--- | :--- | :--- | :--- |
| **Dashboard** | *(Sem submódulos)* | Implementado (100%) | `src/components/dashboard/DashboardView.tsx` |
| **Estoque** | `Armazém`<br>`Movimentação`<br>`Simulador de Importação e Rentabilidade`<br>`Lista de compras`<br>`Defeituoso` | Implementado (100%) | `WarehouseStockView.tsx`<br>`MovementsView.tsx`<br>`ImportSimulatorView.tsx`<br>`PurchaseListView.tsx`<br>`DefectiveView.tsx` |
| **Caixa** | `Venda`<br>`Transporte` | Implementado (100%) | `VendaView.tsx`<br>`TransporteView.tsx` |
| **Contactos** | `Funcionários`<br>`Clientes`<br>`Fornecedores`<br>`Afiliados` | 3 implementados (100%)<br>`Afiliados`: Reservado (*Em Breve*) | `FuncionariosView.tsx`<br>`ClientesView.tsx`<br>`FornecedoresView.tsx`<br>`AfiliadosView.tsx` |
| **Calendário** | *(Sem submódulos na Sidebar; vistas internas)* | Implementado (100%) | `src/components/calendar/CalendarView.tsx` |
| **Financeiro** | `Contas`<br>`Lançamentos`<br>`Dívidas` | Implementado (100%) | `FinanceiroView.tsx` (`BankView.tsx`, `LancamentosView.tsx`, `DividasView.tsx`) |
| **Definições** | *(Abas internas: Empresas, Armazéns, Repor Dados)* | Implementado (100%) | `src/components/settings/SettingsView.tsx` |
| **Agentes** | *(Sem submódulos)* | Reservado (`OutOfServiceView`) | `src/components/layout/OutOfServiceView.tsx` |

---

## 2. Detalhe Funcional por Módulo

### 2.1. Módulo `Dashboard`
- **Ficheiros**: `DashboardView.tsx`, `DashboardMetricCard.tsx`, `DashboardChart.tsx`, `TopProductsList.tsx`, `dashboardUtils.ts`.
- **Funcionalidades**:
  - Seletor de **Empresa** (`Todas as empresas` ou uma empresa ativa específica; empresas `paradas` aparecem sinalizadas e desativadas para seleção; empresas `desativadas` são ocultadas).
  - Seletor de **Período** (`Semana`, `Mês`, `Ano`) com comparação automática face ao período homólogo anterior (`vs. semana anterior`, `vs. mês anterior`, `vs. ano anterior`).
  - Seletor de **Moeda** (quando aplicável às empresas visíveis).
  - **4 Cartões KPI**: Receita Total, Total de Vendas, Ticket Médio e Unidades Vendidas (com variação percentual).
  - **Gráfico Comparativo** (Recharts) e **Top Produtos Vendidos** no período.

---

### 2.2. Módulo `Estoque`

#### 2.2.1. Submódulo `Armazém` (`WarehouseStockView.tsx`)
- **KPIs no topo**: Total de Unidades em Estoque, Estoque Crítico (clicável para filtrar), Excesso de Estoque (clicável para filtrar) e Valor em Estoque (Custo em Kz).
- **Cápsula de Filtros Multi-Seleção (`FilterCheckboxDropdown`)**:
  - Filtra por **Empresa** (com opção extra para ocultar produtos com estoque zero), **Armazém**, **Categoria**, **Estado do produto** (`ativo`, `inativo`, `descontinuado`) e **Condição** (`novo`, `novo_usado`, `usado`, `troca`).
  - Os filtros persistem ao mudar de módulo graças ao `WarehouseFilterContext`.
- **Ações**:
  - Criar novo produto (`ProductCreateModal`), retomar rascunhos (`DraftsListModal`), ver detalhes (`ProductDetailModal`), editar produto ou eliminar produto.
  - Em `ProductDetailModal`, possui 4 abas: **Visão Geral**, **Estoque por Armazém** (com edição inline de limites mínimo/máximo e localização física), **Variações** e **Histórico de Auditoria**.

#### 2.2.2. Submódulo `Movimentação` (`MovementsView.tsx` & `MovementCreateModal.tsx`)
- **Abas no topo**:
  1. **Histórico**: Lista todas as movimentações ativas (`!removido && !isRemoved`), com filtros por tipo (`entrada`, `saida`, `transferencia`, `defeituoso`, `ajuste`), armazém e pesquisa textual (incluindo filtro externo automático ao clicar num recibo de venda `#VND-XXXX`).
  2. **Removidos**: Vista somente leitura de auditoria que lista os movimentos com `removido: true`, exibindo **Motivo da remoção**, **Removido por**, **Data da remoção** e botão **Restaurar**.
- **Coluna de Ações (na aba Histórico)**:
  - Botão de arquivo (**Remover do histórico**) que abre um modal exigindo o campo obrigatório **Motivo**. Ao confirmar, marca o registo como removido sem o apagar da base de dados, recalcula o estoque e envia notificação para o Administrador.
- **Registo de Nova Movimentação (`MovementCreateModal`)**:
  - Permite registar **Entrada** (com opção de registar saída financeira automática de uma conta bancária), **Saída** (validando saldo disponível) ou **Transferência entre armazéns**.

#### 2.2.3. Submódulo `Simulador de Importação e Rentabilidade` (`ImportSimulatorView.tsx`)
- Substituiu a antiga vista de "Análise de produtos".
- **Arquitetura Multimoeda**:
  - Distingue **Moeda de Compra** (`USD`, `EUR`, `CNY`, `ZAR`, `GBP`, `BRL`, `AOA`), **Moeda do Frete** e **Moeda de cada Taxa Fixa** face à **Moeda-Base** (padrão `AOA / Kz`).
  - Guarda cada valor monetário através da estrutura `MonetaryRecord` (`amount`, `currency`, `exchangeRate`, `baseAmount`).
- **Rigor de Dados (`DataProvenance`)**:
  - Cada custo é classificado como `"informado"` ou `"estimativa"`. Campos vazios aparecem como `"Não informado"` (nunca assumidos como zero real sem indicação).
- **Secções e Cálculos**:
  1. Identificação do produto, fornecedor, MOQ, quantidade desejada, peso bruto e dimensões da embalagem;
  2. Configuração de moedas e taxas de câmbio (com tabela resumo opcional de todas as conversões);
  3. Transporte internacional (`aereo_kg`, `maritimo`, `custo_fixo`, `personalizado`) e cálculo de Peso Real vs. Peso Volumétrico vs. Peso Taxável;
  4. Base tributável configurável (Mercadoria, Frete, Seguro, Outros) e tabela de Impostos/Taxas (AGT/IVA, Direitos Aduaneiros, Desalfandegamento, Transportadora, Seguro, taxas personalizadas);
  5. Despesas comerciais separadas do *Landed Cost* (publicidade, embalagem, entrega, comissões);
  6. Orçamento disponível, quantidade máxima que cabe no orçamento e capital restante;
  7. Precificação por Preço de Venda, Margem Desejada ou Markup Desejado + modo de arredondamento;
  8. **Cenários de Venda Parcial** (distinguindo claramente **Lucro das Unidades Vendidas**, **Fluxo de Caixa no Momento** e **Custo do Stock Restante**) e **Análise de Sensibilidade** (variação de câmbio e frete na moeda original do frete);
  9. **Comparador de Simulações** (`ImportComparatorPanel.tsx`) e **Dicas de Ajuda Acessíveis** (`SimulatorHelpTooltip.tsx` + `simulatorHelpTexts.ts`).

#### 2.2.4. Submódulo `Lista de compras` (`PurchaseListView.tsx`)
- Organiza compras em **Grupos** (`PurchaseGroup`) e **Listas de Compras** (`PurchaseList`) com estados `em_pesquisa`, `concluido` e `cancelado`.
- Cada item da lista suporta múltiplas **Fontes de Compra** (`PurchaseSource`: fornecedor/loja, link, preço, moeda, MOQ, disponibilidade), permitindo selecionar a fonte vencedora e converter valores para Kz.
- Ao concluir uma lista de compras, permite dar entrada de estoque num armazém e debitar o valor de uma conta bancária.

#### 2.2.5. Submódulo `Defeituoso` (`DefectiveView.tsx`)
- Regista produtos avariados ou com defeito (`defeito_fabrica`, `dano_transporte`, `dano_armazem`, `devolucao_cliente`, `validade_vencida`, `outro`).
- Ao registar um item defeituoso, gera automaticamente uma movimentação de estoque do tipo `'defeituoso'`, abatendo a quantidade do estoque disponível do armazém.
- Permite atualizar a decisão/resolução (`descartar`, `reparar`, `devolver_fornecedor`, `vender_desconto`, `resolvido`).

---

### 2.3. Módulo `Caixa`

#### 2.3.1. Submódulo `Venda` (`VendaView.tsx`, `NewSaleModal.tsx`, `SaleReceiptModal.tsx`)
- **Histórico de Vendas**: Lista vendas com filtros por empresa, armazém, método de pagamento e pesquisa textual.
- **Nova Venda / POS (`NewSaleModal`)**:
  - Seleção de armazém/loja (apenas de empresas `ativas`), vendedor (funcionários da empresa) e cliente;
  - Adição de múltiplos itens ao carrinho com validação de estoque disponível em tempo real;
  - Aplicação de desconto, seleção de método de pagamento (`multicaixa`, `transferencia`, `dinheiro`, `pagamento_entrega`, `misto`) e conta bancária de destino;
  - Opção **"Requer Transporte / Entrega"** (com endereço, data prevista, custo e prioridade).
- **Recibo de Venda (`SaleReceiptModal`)**:
  - Exibe todos os detalhes da venda e inclui a secção **"Registos gerados por esta venda:"** com botões clicáveis:
    - `→ Ver saída no Estoque (Movimentação)`
    - `→ Ver entrada no Financeiro (Lançamentos)`
    - `→ Ver entrega em Transporte` (quando `requiresTransport: true`)

#### 2.3.2. Submódulo `Transporte` (`TransporteView.tsx`, `TransportModal.tsx`)
- Lista todas as entregas logísticas associadas a vendas ou criadas avulsamente.
- Filtra por estado (`pendente`, `em_transito`, `entregue`, `atrasado`, `cancelado`), prioridade e pesquisa textual (código `TRP-XXXX`, código da venda `VND-XXXX`, cliente ou destino).
- Reconcilia automaticamente qualquer venda com `requiresTransport: true` para garantir que nenhuma venda com entrega fica sem registo de transporte.

---

### 2.4. Módulo `Financeiro` (`FinanceiroView.tsx`)

#### 2.4.1. Submódulo `Contas` (`BankView.tsx`, `BankModal.tsx`, `BankMovementModal.tsx`, `BankLedgerModal.tsx`)
- Gere contas bancárias (ex.: BAI, BFA, BIC, Atlântico) e cofres físicos em múltiplas moedas (`Kz`, `USD`, `EUR`), vinculadas a uma empresa.
- Calcula receitas, despesas e saldo atual de cada conta e permite ver o extrato individual (`BankLedgerModal`).

#### 2.4.2. Submódulo `Lançamentos` (`LancamentosView.tsx`, `LancamentoModal.tsx`)
- Livro-razão consolidado de todas as entradas, saídas e transferências financeiras.
- **Imutabilidade**: Não existe botão de editar ou apagar lançamento. Correções são efetuadas através da ação **Estornar**, que cria um lançamento inverso vinculado ao original (`reversalOfId`) e marca o original com `isReversed: true`.
- Aceita filtro externo (`externalSearchQuery`) vindo do recibo de venda.

#### 2.4.3. Submódulo `Dívidas` (`DividasView.tsx`, `DebtModal.tsx`, `DebtPaymentModal.tsx`, `DebtIncrementModal.tsx`, `DebtLedgerModal.tsx`)
- Gere **Dívidas a Receber** (de clientes/terceiros) e **Dívidas a Pagar** (a fornecedores/credores).
- Suporta amortizações parciais ou totais (`registerDebtPayment` com crédito/débito automático na conta bancária escolhida), aditivos de valor (`incrementDebtAmount`) e consulta de histórico completo (`DebtLedgerModal`).

---

### 2.5. Módulo `Contactos`
- **`Funcionários` (`FuncionariosView.tsx`, `EmployeeModal.tsx`)**: Cadastro de colaboradores vinculados obrigatoriamente a uma empresa (`companyId`), com cargo, telefone, data de nascimento (que alimenta automaticamente a agenda de aniversários no Calendário) e estado.
- **`Clientes` (`ClientesView.tsx`, `ClientModal.tsx`)**: Cadastro de clientes individuais ou empresariais (telefone, WhatsApp separado, endereço de entrega, NIF/BI) e visualização do histórico de compras do cliente.
- **`Fornecedores` (`FornecedoresView.tsx`, `SupplierModal.tsx`)**: Cadastro de fornecedores nacionais e internacionais vinculados aos produtos e listas de compra.
- **`Afiliados` (`AfiliadosView.tsx`)**: Ecrã informativo estruturado (`Em Breve`) reservado para futura implementação do programa de afiliados e comissões.

---

### 2.6. Módulo `Calendário` (`CalendarView.tsx` e subcomponentes)
- **Agendas Manuais e Automáticas**:
  - Agendas automáticas de **Aniversários** (sincronizadas com `employees`) e **Entregas** (sincronizadas com `transports`).
  - Agendas manuais criadas pelo utilizador com cores personalizadas e opção de arquivar.
- **Vistas**: Alternância entre **Semana**, **Mês** e **Ano**, e modo de visualização em **Grade** ou **Lista**.
- Data de referência inicial do protótipo: `13 de Setembro de 2026` (`new Date(2026, 8, 13)`).

---

### 2.7. Módulo `Definições` (`SettingsView.tsx`)
- **Aba `Empresas`**: Criação, edição, alteração de estado operacional (`ativa`, `parada`, `desativada`) e eliminação protegida de empresas (`DeleteCompanyModal` impede apagar empresas que possuam armazéns vinculados).
- **Aba `Armazéns`**: Criação, edição e remoção de armazéns e lojas físicas associados a uma empresa.
- **Aba `Repor Dados` (`ResetSettingsModal.tsx`)**:
  - **Limpar Apenas Histórico**: Apaga vendas, movimentações, transportes e lançamentos financeiros, mantendo empresas, armazéns, produtos, bancos e contactos.
  - **Restaurar Padrão de Fábrica**: Repõe todos os dados para os valores originais de `seedData.ts`.
