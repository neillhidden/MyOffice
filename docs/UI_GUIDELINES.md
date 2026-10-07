# Diretrizes de Interface (UI/UX), Layout e Tema — MyOffice

Este documento define as regras visuais, de layout global, tema escuro e identificação de elementos DOM que devem ser rigorosamente respeitadas por qualquer agente de IA ao editar ou criar componentes no **MyOffice**.

---

## 1. Estrutura do Layout Global (`App.tsx`, `Sidebar.tsx`, `Header.tsx`)

O layout global está construído sobre um contentor de ecrã inteiro (`#app-root-shell` com `flex h-screen overflow-hidden`) dividido em duas colunas principais:

### 1.1. Alinhamento Vertical Obrigatório (`h-14` / `56px`)
- **Topo da Barra Lateral (`Sidebar.tsx`)**: A faixa superior com o logótipo `M` e o título `MyOffice Angola` tem altura fixa `h-14 shrink-0` (`56px`) e borda inferior `border-b border-slate-200/80 dark:border-dm-border`.
- **Cabeçalho Principal (`Header.tsx`)**: O elemento `<header>` tem exatamente a mesma altura fixa `h-14 shrink-0` (`56px`) e a mesma borda inferior `border-b border-slate-200/80 dark:border-dm-border`.
- **Resultado**: As duas barras formam uma linha horizontal contínua de ponta a ponta aos `56px`. A lista de navegação (`<nav>`) da barra lateral e a área de conteúdo (`<main>`) começam exatamente na mesma altura vertical.

### 1.2. Alinhamento Horizontal entre `<Header>` e `<main>`
- Tanto `<Header>` como `<main>` utilizam o mesmo espaçamento horizontal responsivo (`px-4 sm:px-6 lg:px-8`) e o mesmo contentor interno (`w-full max-w-7xl mx-auto`).
- Isto garante que o **Breadcrumb** à esquerda e os **Controlos do cabeçalho** à direita ficam alinhados ao pixel com os cartões e tabelas do módulo ativo abaixo.

### 1.3. Controlos do Cabeçalho e Rodapé da Barra Lateral
- Todos os itens à direita no `<Header>` (indicador `AOA (Kz) • USD ref: 925 Kz`, pesquisa, alternância de tema e sino de notificações) possuem altura uniforme `h-8` (`32px`) e alinhamento central (`inline-flex items-center justify-center`).
- **Regra Explícita**: O botão de alternância de tema (`Modo Claro / Escuro`) reside **apenas** no `<Header>` (`#btn-toggle-theme`). **Não colocar controlo de tema no rodapé da barra lateral** (o rodapé da barra lateral exibe apenas a informação discreta `AO` / `MyOffice v1.0`).

### 1.4. Comportamento da Barra Lateral (`Sidebar.tsx`)
- Largura fixa expandida: `w-60` (`240px`); largura recolhida: `w-16` (`64px`).
- Quando expandida, os submódulos abrem em **acordeão** (no máximo 1 submenu aberto de cada vez).
- Quando recolhida (`isCollapsed: true`), passar o rato sobre um módulo com submódulos abre um **painel flutuante (`createPortal`)** posicionado à direita do ícone, com fecho imediato ao mudar para itens sem submenu e tolerância de `120ms` na saída diagonal para o popup.

---

## 2. Sistema de Tema Claro e Escuro (`src/index.css`)

O projeto utiliza **Tailwind CSS v4** (`@import "tailwindcss";`) com variante personalizada `@custom-variant dark (&:where(.dark, .dark *));` e tokens CSS centralizados em `src/index.css`:

| Token CSS | Classe Tailwind (`@theme`) | Valor Hexadecimal | Aplicação no Modo Escuro (`.dark`) |
| :--- | :--- | :--- | :--- |
| `--dm-bg-page` | `bg-dm-page` | `#0D0D0F` | Fundo global da página (`#app-root-shell`, `body`) |
| `--dm-bg-surface` | `bg-dm-surface` | `#18181B` | Superfícies: cartões, barra lateral, cabeçalho, tabelas, modais, inputs |
| `--dm-bg-elevated` | `bg-dm-elevated` | `#202024` | Estados *hover* em linhas de tabela, botões secundários e sub-elementos |
| `--dm-border` | `border-dm-border` | `#2A2A2E` | Todas as bordas e divisórias de 1px (sem sombras pesadas) |
| `--dm-text-primary` | `text-dm-text` | `#F5F5F5` | Títulos, valores monetários principais e texto de destaque |
| `--dm-text-muted` | `text-dm-muted` | `#8B8B93` | Rótulos secundários, cabeçalhos de tabela e metadados |
| `--dm-btn-primary-bg` | `.dm-btn-primary` | `#F5F5F5` (texto `#0D0D0F`) | Botões de ação primária (inversão de contraste no modo escuro) |

**Regras de Estilo no Modo Escuro**:
- Todas as sombras (`shadow-xs`, `shadow-md`, `shadow-xl`, etc.) são anuladas automaticamente em `.dark` (`box-shadow: none !important`) em favor de bordas finas de `1px` (`#2A2A2E`).
- Tabelas em modo escuro têm fundo `#18181B`, cabeçalhos `#8B8B93` e *hover* `#202024` (sem *zebra striping*).

---

## 3. Tipografia, Formatação e Grelhas

- **Fonte Principal**: `Plus Jakarta Sans` (carregada via Google Fonts em `index.html`).
- **Valores Numéricos e Monetários**: Utilizar sempre `font-mono` (ou `tabular-nums`) para valores em Kwanzas (`Kz`), percentagens, SKUs, códigos (`VND-XXXX`, `TRP-XXXX`) e quantidades de estoque.
- **Formatação Regional**: Utilizar as funções de `src/utils/formatters.ts` (`formatKwanza`, `formatForeignCurrency`, `formatDate`, `formatDateTime`).
- **Grelha do Simulador de Importação**:
  - Os campos de formulário devem manter altura uniforme de controlo (`h-10`), rótulos alinhados na mesma linha e cartões emparelhados com alturas coerentes (`h-full flex flex-col justify-between`).
  - Manter sempre o componente `SimulatorHelpTooltip` (`ⓘ`) junto aos rótulos técnicos e financeiros para acessibilidade por rato, toque e teclado.

---

## 4. Atributos `id` de DOM Importantes (Não Renomear nem Remover)

Vários fluxos e verificações automatizadas dependem de `id`s específicos nos elementos HTML:

- **Layout e Navegação**:
  - `#app-root-shell`, `#app-sidebar`, `#sidebar-brand-toggle`
  - `#nav-item-dashboard`, `#nav-item-estoque`, `#nav-item-caixa`, `#nav-item-contactos`, `#nav-item-calendário`, `#nav-item-financeiro`, `#nav-item-definições`, `#nav-item-agentes`
  - `#subnav-armazém`, `#subnav-movimentação`, `#subnav-simulador-de-importação-e-rentabilidade`, `#subnav-lista-de-compras`, `#subnav-defeituoso`
  - `#subnav-caixa-venda`, `#subnav-caixa-transporte`
  - `#subnav-financeiro-contas`, `#subnav-financeiro-lançamentos`, `#subnav-financeiro-dívidas`
  - `#subnav-contactos-funcionários`, `#subnav-contactos-clientes`, `#subnav-contactos-fornecedores`, `#subnav-contactos-afiliados`
  - `#btn-open-search`, `#header-search-input`, `#btn-close-search`, `#btn-toggle-theme`, `#btn-notifications`, `#notifications-badge`, `#notifications-popover`
- **Movimentação e Auditoria**:
  - `#tab-movements-historico`, `#tab-movements-removidos`
  - `#btn-remove-movement-<id>`, `#input-remove-movement-reason`, `#btn-cancel-remove-movement`, `#btn-confirm-remove-movement`, `#btn-restore-movement-<id>`
- **Caixa e Recibo de Venda**:
  - `#sale-generated-records-section`, `#link-sale-stock-movement`, `#link-sale-financial-entry`, `#link-sale-transport`, `#btn-go-to-transport`
- **Detalhe do Produto**:
  - `#btn-product-detail-edit`, `#btn-product-detail-move`, `#btn-close-product-detail-modal`

## Definições — categorias em linhas

A entrada de Definições usa linhas de largura completa com ícone linear, título, descrição e seta. O estado/contagem aparece à direita no desktop e abaixo da descrição em telas pequenas. Linhas têm área de toque mínima de 76px, foco visível e `aria-expanded`. Usar superfícies/bordas/textos dos tokens escuros existentes. Uma categoria abre os detalhes existentes; não adicionar controlos sem configuração real associada. O controlo de tema continua exclusivamente no cabeçalho.
