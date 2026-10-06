# Registo de Decisões Arquiteturais (ADRs) — MyOffice

Este documento explica o **porquê** das decisões técnicas e de domínio já tomadas no projeto **MyOffice**, evitando que futuros agentes de IA revertam ou alterem padrões intencionais.

---

## ADR-001: Persistência em `localStorage` com Reconciliação Automática no Arranque
- **Contexto**: O protótipo funcional precisava de suportar operações transacionais complexas (vendas, estoque, bancos, dívidas, calendário, simulações de importação) sem depender de infraestrutura externa na fase inicial.
- **Decisão**: Centralizar o estado em `StockContext.tsx` com sincronização automática em `window.localStorage` (chaves `myoffice_*`) e incluir uma rotina de reconciliação no arranque que preenche movimentos de estoque, lançamentos financeiros ou transportes em falta para vendas concluídas.
- **Consequência**: Mesmo que um navegador tenha dados guardados de uma versão anterior do protótipo, a aplicação auto-corrige os vínculos de vendas (`#VND-XXXX`) ao iniciar, sem exigir que o utilizador limpe manualmente o `localStorage`.

---

## ADR-002: Saldo de Estoque Calculado Dinamicamente (Event Sourcing Simplificado)
- **Contexto**: Guardar um número fixo `product.stock` gera inconsistências sempre que movimentos são adicionados, transferidos entre armazéns, marcados como defeituosos ou removidos da auditoria.
- **Decisão**: O saldo de cada produto por armazém (`getCurrentStock(productId, warehouseId)`) é calculado em tempo real somando entradas/transferências recebidas e subtraindo saídas/defeituosos/transferências enviadas, filtrando apenas movimentos ativos (`!mov.removido && !mov.isRemoved`).
- **Consequência**: Remover um movimento para a aba **Removidos** ou restaurá-lo atualiza instantaneamente o estoque em todos os módulos sem risco de dessincronização.

---

## ADR-003: Proibição de `DELETE` Físico em Movimentações e Lançamentos Financeiros
- **Contexto**: Em sistemas de gestão empresarial, apagar linhas de histórico permite ocultar erros ou desvios de mercadoria e caixa sem rasto.
- **Decisão**:
  - Em **Estoque → Movimentação**, a remoção aplica *soft-delete* (`removido: true`, `motivo_remocao`, `removido_por`, `data_remocao`), move o item para a aba somente leitura **Removidos**, permite **Restaurar** e notifica o Administrador.
  - Em **Financeiro → Lançamentos**, correções são feitas exclusivamente via **Estorno** (`reverseBankMovement`), criando um lançamento de compensação inverso.
- **Consequência**: Rastreabilidade de auditoria 100% preservada.

---

## ADR-004: Modelo de 3 Estados para Empresas (`ativa`, `parada`, `desativada`)
- **Contexto**: Num grupo multi-empresa, uma empresa pode estar em operação normal (`ativa`), temporariamente suspensa para inventário/auditoria (`parada`), ou encerrada/fora de serviço (`desativada`, como a *Kianda Comercial Lda*).
- **Decisão**:
  - Empresas `desativadas` são filtradas na origem em todas as vistas operacionais (aparecendo apenas em **Definições → Empresas**).
  - Empresas `paradas` permanecem visíveis para consulta de saldos e histórico, mas todos os controlos de mutação ficam `disabled` com aviso explícito.

---

## ADR-005: Arquitetura Multimoeda com `MonetaryRecord` no Simulador de Importação
- **Contexto**: Nas importações para Angola, a mercadoria pode ser comprada em `USD` ou `CNY`, o frete internacional pago em `USD` ou `EUR`, e as taxas locais pagas em `AOA (Kz)`. Assumir que todos os inputs estão na mesma moeda causava erros graves de conversão.
- **Decisão**: Introduzir o tipo `MonetaryRecord` (`amount`, `currency`, `exchangeRate`, `baseAmount`) e permitir selecionar a moeda de origem em cada etapa (compra, frete internacional, taxas fixas), consolidando tudo na moeda-base (`AOA / Kz`). Além disso, separar o **Lucro das Unidades Vendidas** do **Fluxo de Caixa no Momento** nos cenários de venda parcial.

---

## ADR-006: Tokens Centralizados de Tema Escuro em `src/index.css`
- **Contexto**: Com dezenas de vistas e modais construídos ao longo de várias iterações, classes utilitárias isoladas podiam deixar cartões claros ou sombras pesadas no modo escuro.
- **Decisão**: Definir variáveis CSS centralizadas (`--dm-bg-page`, `--dm-bg-surface`, `--dm-border`, `--dm-text-primary`, `--dm-text-muted`) e regras globais `.dark` em `src/index.css`, e manter apenas um único botão de alternância de tema no `<Header>` superior (`#btn-toggle-theme`).

---

## ADR-007: Layout Global Sincronizado (`h-14` + `max-w-7xl mx-auto`)
- **Contexto**: A barra lateral e o cabeçalho principal apresentavam alturas ligeiramente diferentes (`56px` vs. `~61px`) e espaçamentos horizontais distintos face ao conteúdo principal.
- **Decisão**: Fixar a altura do cabeçalho da marca na `Sidebar` e do `<Header>` principal em `h-14 shrink-0` (`56px`) com a mesma borda inferior, alinhar o contentor interno do `<Header>` com `px-4 sm:px-6 lg:px-8` e `w-full max-w-7xl mx-auto`, e remover o botão de tema do rodapé da `Sidebar`.
