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

### [2026-10-09] — OpenAI Codex — Comprovativos sem duplicação e orçamentos nos dois modos
- **Pedidos**: detetar repetição de PDFs/transações, selecionar ou criar orçamento durante revisão, aplicar funções correspondentes também no Business; novas preferências globais de ativar/desativar exigem perguntar primeiro.
- **Home**: identidade SHA-256/referência opcional no lançamento, reutilização de originais mesmo renomeados, bloqueio no arquivo manual; escolha/criação de limite por categoria/mês/moeda sem débito adicional. Comprovativos bancários em Extratos usam revisão de movimento individual.
- **Business**: Financeiro → Extratos e documentos; leitor partilhado PDF/CSV/XLSX/foto/texto, revisão e aplicação em lote, associação sem alterar lançamentos antigos, arquivo/descarregamento e orçamento por empresa/categoria/mês/moeda. Estado Business separado no StockContext; gravação ledger/metadados com diário e recuperação, proteção de quota/conflitos. Sem novas preferências globais.
- **Estrutura futura**: migração offline 007 acrescenta três tabelas (51 totais) com RLS, vínculos e índices de identidade. Sem conexão/backend. Documentação e orientação AGENTS atualizadas.
- **Verificação**: 68 testes unitários, lint/build; Chromium compilado no Home/Business com PDF real do utilizador (não guardado no Git), Excel, CSV e fotografia OCR; repetição/renomeação, orçamento existente/novo, integridade, persistência e telefone. Regressões Home, ferramentas e finanças/Business passaram. Dois testes SQL de documentos/tabelas passaram.


### [2026-10-09] — OpenAI Codex — Corrigir leitura de comprovativo bancário
- **Problema**: comprovativo de compra com data e montante em linhas separadas não era identificado em Extratos, cujo leitor procurava movimentos tabulares na mesma linha.
- **Correção**: homeDocumentImport reconhece comprovativos bancários também em Extratos, lê campos separados/inline, prefere data da operação, usa comerciante e preserva referência. Transferências ambíguas continuam sem sentido automático. Leitura não movimenta dinheiro.
- **Verificação**: 63 testes unitários, lint/build e Chromium compilado com o PDF real enviado pelo utilizador em Extratos/Documentos; regressão integral dos formatos e fluxo de revisão passou. Testes permanentes usam dados sintéticos; ficheiro privado não incluído no repositório.


### [2026-10-09] — OpenAI Codex — Leitura de extratos e comprovativos
- **Pedido**: PDF prioritário, CSV, Excel e fotografias, com texto/manual e distinção de entrada/saída/saldo.
- **Implementação**: HomeFileImport em Extratos/Documentos; financialFileReader com PDF.js, ExcelJS e OCR Tesseract português local; financialTables partilha CSV; homeDocumentImport valida/revê/aplica e liga comprovativo atomicamente; homeExtensions protege duplicados já conferidos. Dependências fixadas no bun.lock; script de preparação gera recursos estáticos ignorados pelo Git. Sem nova API, armazenamento ou migração.
- **Regras**: leitura não altera saldo; revisão explícita, moeda da carteira, saldo bancário separado; associação existente não duplica débito. Arquivo mantém limites anteriores. Excel suportado: XLSX; XLS deve ser convertido.
- **Verificação**: 62 testes unitários; lint, build Pages e Bun frozen-lockfile; Chromium com PDF real/texto/digitalizado, Excel múltiplas folhas, CSV e foto OCR, confirmação, persistência e telefone. Regressões Home completo e oito ferramentas passaram. Documentação de arquitetura, regras, módulos, desenvolvimento e guia Home atualizada.


### [2026-10-09] — OpenAI Codex — Ferramentas completas da vida pessoal no Home
- **Pedido**: implementar as oito melhorias propostas, mantendo frontend/armazenamento local e preparando a futura base; autorizado por “Ok... pode continuar.”.
- **Interface**: calendário mensal/semanal integrado, tarefas com hora/prioridade/responsável/repetição e conclusão por ocorrência; Histórico com versões/recuperação; dívidas a pagar/receber/prestações; previsões; relatórios mês/ano/intervalo CSV/PDF; extratos com pré-visualização/conferência; documentos associados; atalhos/contadores no Dashboard. IDs antigos e estilo/tema preservados.
- **Regras e dados**: amortizações alteram carteira sem duplicar consumo; snapshots/referências e saldo protegido; correções reabrem conferências; planos não movimentam dinheiro; cópia JSON contém documentos PDF/PNG/JPEG limitados. Metadados auditados não duplicam binários. Migração 006 offline prepara sete tabelas adicionais (48 no total), sem backend/conexão.
- **Documentação**: HOME.md consolidado com comportamento corrente, fluxos e armazenamento; arquitetura/regras/modelos/API/direção/estrutura/guias atualizados, distinguindo decisões antigas substituídas.
- **Verificação**: 55 testes unitários; 11 verificações SQL offline; sete suites Chromium em desenvolvimento e ferramentas/blocos 3–6 também na compilação Pages. lint/build passaram. PDF descarregado validado com pdftotext; persistência, duplicados, recuperação, telefone e tema escuro verificados. Aviso pré-existente de bundle grande permanece. Detalhes de continuação em CURRENT_STATE.md.

### [2026-10-09] — OpenAI Codex — Concluir blocos 3–6 do Home
- **Pedido**: “Faz todos os Blocos.” substitui a confirmação entre blocos.
- **Alterações**: programação de contas a pagar/receber, snapshots/idempotência/pausa e sino; USD original e conversão explícita; metas sem prazo, origem e preferência de desconto; formulários vazios/validação por campo/vocabulário; migração SQL 005 offline.
- **Limites**: scheduler só no navegador; servidor/notificações push/importador SQL continuam ausentes. Regras Business preservadas. Relatório item a item em HOME_BLOCKS_3_6.md.
- **Validação**: resultados finais em CURRENT_STATE.md; unitários financeiros/recorrência, testes funcionais Chromium e schema offline.

### [2026-10-09] — OpenAI Codex — Bloco 2: edição e eliminação no Home
- **Diagnóstico antes da correção**: Orçamento não tinha despesas individuais/editáveis; o lápis do limite não passava editId e duplicava ao mudar categoria. Reproduzido com dados isolados; nenhuma mensagem de campo em falta reproduzida.
- **Alterações**: CRUD pessoal com IDs preservados, snapshots, datas de edição, eliminação lógica/confirmada e recálculo. Ações em Orçamento/Finanças/carteiras/contas/metas/tarefas; categorias existentes mantidas. Pagamentos/compra reclassificados juntos, valor efetivo separado do preço planeado; aquisição mantém a reserva e ajusta a meta. Eliminação de rendimento Business compensa os dois ledgers; valores empresariais não editados.
- **Auditoria/limites**: Carteiras com saldo/movimentos ativos e metas reservadas bloqueiam eliminação. Pagamentos/referências e backups preservados. Auditoria por entidade em HOME.md. Blocos 3–6 não iniciados.
- **Verificação**: Resultados finais em CURRENT_STATE.md; testes de edição, cancelamento, IDs, recálculo, conflitos, pagamentos/Business e persistência.

### [2026-10-09] — OpenAI Codex — Bloco 1: categorias pessoais em linhas
- **Pedido**: Executar/confirmar seis blocos individualmente; esta entrega implementa apenas 1.1–1.7.
- **Implementação**: Filtros/cápsula, linhas e breadcrumb, vista de subcategorias, modais criar/editar, biblioteca com 12 temas, herança de ícones, duplicados confirmáveis e eliminação/movimentação protegidas. Catálogo estável migra legado sem alterar dinheiro; reclassificação preserva vínculos/IDs/classificação anterior. Conflito de limites bloqueia movimento completo. Compras partilha despesas existente. HomeModal extraído/reutilizado.
- **Validação**: 25 testes unitários; percurso novo de categorias, Home completo, finanças e calendário/compras/Business no navegador passaram. Migração SQL offline 004 testada (metadados/duplicados/FKs/RLS). Lint/build passaram; percursos de categorias e finanças também na versão compilada. Aviso conhecido de bundle grande.
- **Continuação**: Blocos 2–6 não iniciados; pedido integral em HOME_ROADMAP.md. Aguardar confirmação do bloco 1 antes do diagnóstico de edição (2.1).

### [2026-10-08] — OpenAI Codex — Finanças pessoais, metas, gráficos e navegação
- **Pedido**: Contas AOA/USD, categorias de despesas/rendimentos, metas planeadas por padrão e reservas configuráveis, aquisição, transferência Business → Home, gráficos e correção de rolagem/ícones.
- **Alterações**: Moedas separadas; despesas reais no orçamento; gráficos por dia e pizza por categoria; aquisição debita reserva sem débito duplicado. Ponte com saída/receita e estorno conjuntos, diário de recuperação, proteção de importação e abas antigas. Definições Home em linhas/páginas próprias; shell fixo; ícones centrados e botão recolhido mostra destino.
- **Base futura**: Migração offline 003 prepara financiamento/aquisição; nenhuma conexão ativada. HOME.md e documentação central atualizados.
- **Validação**: 19 testes unitários, 8 regressões Business, Home completo, percurso financeiro e calendário/compras/tema/ícones passaram; 8 testes SQL offline, lint/build passaram. Versão compilada verificada em Chromium. Aviso conhecido de bundle grande. Dados fictícios apenas em contextos isolados de teste.

### [2026-10-08] — OpenAI Codex — Calendário real, categorias e compras nos dois modos
- **Pedido**: Seletor Home/Business em baixo; calendário sem setembro fixo; categorias/subcategorias (Games → Jogos/Consoles), produtos em cada categoria, Anoitecer nas configurações e dashboards úteis.
- **Alterações**: Seletor no rodapé, datas locais atuais e atualização à meia-noite/foco, navegação mensal sem overflow de dia 31. Catálogo Business nas Definições, criação de produtos pré-classificados e subcategoria em cadastro/edição/rascunhos/detalhes. Home inclui taxonomia e compras com quantidade/preço, filtros, edição pré-pagamento, arquivo/restauro e despesa ligada ao pagamento. Aparência Claro/Anoitecer/Dispositivo partilhada. Dashboard Home inclui previsão/alertas/atalhos; Business inclui mínimos de estoque/entregas pendentes/data atual.
- **Integridade**: Backups Home v1 antigos normalizados sem perda; pagamentos únicos e reversíveis, débito e vínculo atómicos; histórico preservado. Nenhum dado financeiro fictício acrescentado. Temas nas Definições por pedido explícito do utilizador, mantendo atalho do cabeçalho.
- **Base futura**: Migração offline 002 prepara categorias/subcategorias e compras (40 tabelas após ambas as migrações). Sem conexão ou novos serviços.
- **Validação**: 14 testes unitários, 8 regressões Business, Home completo e regressão adicional Chromium (datas de outubro, viragem de dia, janeiro/fevereiro, rodapé, pagamento/persistência, rascunho com subcategoria, aparência e mobile), 7 testes SQL, lint/build passaram. Aviso conhecido de bundle grande. Guia CATEGORIES.md.


### [2026-10-08] — OpenAI Codex — Home e Business com gestão pessoal
- **Pedido**: Seletor abaixo do logótipo e Home pessoal com dashboard, metas e funções relacionadas.
- **Alterações**: HomeProvider/documento pessoal e validadores; seletor expandido/compacto; menu e cabeçalho próprios; sete áreas com dados reais inicialmente vazios, contas, receitas/despesas/transferências/estornos, orçamento mensal, contas recorrentes, metas/reservas, tarefas e backup JSON. Barra recolhida por padrão no telefone. Link flutuante do Pages ajustado para não cobrir diálogos, com espaço inferior no Home. IDs e fluxos Business preservados.
- **Regras**: Saldo disponível e reservas separados, transferências sem despesa, estornos rastreáveis, pagamentos únicos por mensalidade/mês, validação de cópia, escrita antes de atualizar estado e proteção contra conflito de abas. Nenhuma conexão/backend introduzida.
- **Validação**: 12 testes unitários passaram; fluxo Home completo no navegador passou, incluindo isolamento Business, persistência, backup/restauro, mobile/escuro, quota, conflito e corrupção. 8 regressões Business passaram. Lint e build passaram, com aviso conhecido de bundle grande. Documentação em HOME.md.

### [2026-10-07] — OpenAI Codex — Telas próprias para as categorias das Definições
- **Pedido**: Ao selecionar uma opção, abrir uma tela própria em vez de detalhes abaixo da lista.
- **Alterações**: Categorias ocultadas quando uma secção está aberta, título específico e botão Voltar às Definições. Mantida navegação interna do módulo; nenhuma aba de navegador adicional. IDs e operações preservados.
- **Validação**: Lint/build e navegação de empresas, armazéns, regresso à lista e bloqueio dos resets verificados no navegador; temas e telefone preservados.

### [2026-10-07] — OpenAI Codex — Definições em linhas com ícones
- **Pedido**: Aplicar às Definições o estilo da imagem de referência enviada pelo utilizador.
- **Alterações**: `SettingsView.tsx` passa a abrir numa lista de categorias em linhas: ícone, título, descrição, estado e seta. Cada linha abre/fecha os detalhes, com botão de fecho. Contagens e proteção de histórico à direita no desktop e abaixo da descrição no telefone. Temas claro/escuro e foco de teclado. IDs existentes e formulários preservados.
- **Regras**: Nenhuma mudança em operações, armazenamento ou proteções de reposição; não foram adicionadas opções fictícias de rede ou switches sem função.
- **Validação**: 7 testes unitários, lint/build e Chromium passaram. Verificados formulário de empresa, lista de armazéns, bloqueio das duas reposições com histórico, temas e layout de telefone 390px com sidebar recolhida. Build mantém aviso conhecido de bundle grande.

### [2026-10-07] — OpenAI Codex — Central em repositório independente
- **Pedido**: Mover a central para um repositório próprio.
- **Resultado**: `neillhidden/MeusProjetos` recebeu páginas estáticas e workflow. Publicação confirmada pelo GitHub Actions (run 37686973187). MyOffice mantém catálogos/snapshots e somente links/redirecionamentos para a central. Bancada permanece sem código, conforme confirmação do utilizador.
- **Alterações**: Links em `pages-catalog.mjs`, redirecionamentos em `pages-projects.mjs`, regressão de navegador e documentação. Nenhuma regra de negócio alterada.
- **Validação**: Testes/lint/build e navegação da central independente verificados. Acesso HTTP direto ao domínio público bloqueado pelo proxy; publicação confirmada por Actions.

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
