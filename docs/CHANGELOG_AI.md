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

### [2026-10-21] — Google AI Studio Build (Gemini) — Auditoria Funcional: Pontos 3 (Telefone em Contactos) e 4 (Botão Voltar & Rotas Hash) Concluídos
- **Objetivo**: Concluir os Pontos 3 e 4 da Auditoria Funcional e restabelecer o servidor de desenvolvimento:
  - **3. Normalização e Validação de Telefone em Contactos**:
    - 3.1 Normalização (`normalizePhone`) removendo espaços, hífens, pontos, parênteses, chavetas e barras. Validação com regex `^\+?\d{7,15}$` (aceita "+" inicial opcional e 7 a 15 dígitos numéricos; compatível com telefones nacionais de Angola como `+244 923 111 222` / `923111222` e internacionais).
    - 3.2 Aplicado em `ClientModal` (Telefone e WhatsApp), `EmployeeModal` (Telefone) e `SupplierModal` / `ProductCreateModal` (Contacto de Fornecedor), na criação e na edição.
    - 3.3 Mensagem explicativa junto a cada campo com contorno vermelho e foco imediato no campo inválido. Registos legados inválidos assinalados na listagem de Clientes, Funcionários e Fornecedores com badge de alerta âmbar (`#invalid-phone-${id}` / `#invalid-contact-${id}`) e tooltip, preservando os dados sem remoção destrutiva.
  - **4. Botão Voltar do Navegador e Rotas com Hash**:
    - 4.1 Histórico de navegação sincronizado com `window.history.pushState` em todas as transições de módulo, submódulo e alternância Home/Business. Os botões "Voltar" e "Avançar" do navegador navegam perfeitamente entre secções sem sair da aplicação.
    - 4.2 Recarregamento da página (`F5`) e URLs diretos (ex.: `#/armazem`, `#/venda`, `#/home/financas`, `#/home/orcamento`, etc.) abrem diretamente o módulo correspondente.
    - 4.3 Rotas com hash implementadas em `src/utils/navigationRouter.ts` prevenindo erros 404 em servidores estáticos (como GitHub Pages).
    - 4.4 Filtros que persistem em memória e `localStorage` (como seleções de Empresa e Armazém em `WarehouseFilterContext`) são preservados integralmente ao navegar entre secções.
  - **Servidor de Desenvolvimento**:
    - Verificado e reinicializado com sucesso (`restart_dev_server`), leitor OCR/PDF local preparado.
- **Ficheiros Modificados / Criados**:
  - `src/utils/phoneValidation.ts`: Normalização expandida e regras estritas de 7 a 15 dígitos.
  - `src/utils/navigationRouter.ts`: Mapeamento bidirecional hash <-> NavigationState (`stateToHash` e `hashToState`).
  - `src/App.tsx`: Sincronização de navegação com pushState, listeners de `popstate` e `hashchange`.
  - `src/components/contacts/SupplierModal.tsx`: Validação e mensagens de erro no contacto do fornecedor.
  - `src/components/contacts/ClientesView.tsx`, `FuncionariosView.tsx`, `FornecedoresView.tsx`: Sinalização de números legados inválidos.
  - `tests/integrity.test.ts`: Testes unitários para validação de telefone e roteamento hash.
- **Verificação**: `npm test` (77/77 testes aprovados), `npm run lint` (`tsc --noEmit`) 0 erros, `npm run build` compilado com 100% de sucesso.

### [2026-10-20] — Google AI Studio Build (Gemini) — Auditoria Funcional: Ponto 2 (Preços Negativos no Cadastro) Concluído
- **Objetivo**: Implementar e auditar todas as regras do Ponto 2 da Auditoria Funcional ("Preços negativos no cadastro"):
  - **2.1 Validação de Preços e Variações**: Custo (`costPrice`), preço de venda (`salePrice`) e acréscimo de preço de variação (`additionalPrice`) rejeitam números negativos, vazios inválidos (`""`, `"   "`), `NaN` e infinito (`±Infinity`). O valor zero (`0`) é explicitamente permitido. O aviso existente de venda abaixo do custo mantém-se.
  - **2.2 Validação nos Passos do Assistente e Gravação Final**: Bloqueio de avanço no assistente de criação (`ProductCreateModal`), tanto ao clicar nos botões de avançar como nos passos do stepper (Passo 2 e Passo 3). Validação estrita na gravação final (`handleFinalSubmit`) e no botão de guardar do cabeçalho (`handleSaveFromHeader`).
  - **2.3 Validação Transversal**: Aplicada a mesma validação na edição de produto (`ProductCreateModal` via `productToEdit`, limites no `ProductDetailModal`), na Lista de compras (`PurchaseListView` e `StockContext` para preço unitário >= 0, frete >= 0, outros custos >= 0 e quantidade > 0) e no Simulador de Importação (`ImportSimulatorView` para preço unitário >= 0, frete >= 0, frete fixo >= 0, orçamento >= 0, preço de venda >= 0 e quantidade > 0).
  - **2.4 Mensagens de Erro Junto aos Campos**: Mensagens de erro dedicadas e acessíveis renderizadas diretamente abaixo/junto de cada campo com aviso visual (`AlertTriangle`) e contorno de destaque.
  - **2.5 Detetor de Produtos com Valores Negativos no Estoque**: Detetor e banner informativo em Estoque → Armazém (`#banner-warning-products-negative-prices`) que identifica produtos legados guardados com valores negativos, discriminando os campos afetados e fornecendo botão direto para correção ("Corrigir produto"), sem alterar registos em silêncio.
- **Ficheiros Modificados**:
  - `src/utils/productValidation.ts`: Rejeição estrita de strings vazias/espaços e valores não-finitos ou negativos em `validateProductPrices`.
  - `src/components/products/ProductCreateModal.tsx`: Validação em cada etapa e no clique direto de passos no stepper; mensagens de erro junto aos campos de custo, venda e variações.
  - `src/components/products/ProductDetailModal.tsx`: Limites de estoque mínimos e máximos não negativos.
  - `src/components/analytics/ImportSimulatorView.tsx`: Validação não-negativa para preço unitário, frete por kg, frete fixo, orçamento e preço de venda; quantidade estritamente maior que zero; mensagens de erro dedicadas junto aos campos; bloqueio de gravação de simulações com valores inválidos.
  - `src/context/StockContext.tsx`: Validação em `addPurchaseSource` e `updatePurchaseSource` para custos não-negativos e quantidade > 0.
  - `src/components/stock/WarehouseStockView.tsx`: Banner com alerta `AlertTriangle` e listagem de produtos com valores negativos com botão de edição direta.
  - `tests/integrity.test.ts`: Testes unitários para rejeição de negativos, infinitos, NaN e vazios inválidos em `validateProductPrices`.
- **Verificação**: `npm test` (75/75 testes aprovados), `npm run lint` (`tsc --noEmit`) 0 erros, `npm run build` compilado com 100% de sucesso.

### [2026-10-19] — Google AI Studio Build (Gemini) — Auditoria Funcional: Ponto 1 (Venda a Prazo) Concluído
- **Objetivo**: Implementar e auditar todas as regras do Ponto 1 da Auditoria Funcional ("Venda a prazo"):
  - **1.1 Identificação do Cliente & Data de Vencimento**: Bloqueio de venda a prazo com "Consumidor final" ou sem cliente identificado, exibindo mensagem de erro dedicada diretamente junto ao campo Cliente (`#sale-client-error-msg`). Adicionada data de vencimento opcional (`#sale-due-date-input`).
  - **1.2 Saída de Estoque sem Crédito Bancário Imediato & Dívida a Receber**: Saída de estoque gerada atomicamente com tipo `saida`. Não é criada nenhuma entrada financeira nem creditada qualquer conta bancária no momento da venda. Cria uma dívida a receber em Financeiro → Dívidas vinculada à venda (`saleId`, contraparte = cliente, empresa da venda, valor total com transporte incluído).
  - **1.3 Ciclo de Vida da Venda e Pagamento de Dívida**: Pagamentos registados na dívida debitam/creditam a conta bancária escolhida e o estado da venda evolui dinamicamente: "A prazo" → "Parcialmente paga" → "Paga".
  - **1.4 Recibo de Venda a Prazo**: No recibo (`SaleReceiptModal`), o rótulo passa de "Total Pago" para "Por receber", exibe o "Saldo em dívida" atualizado e inclui link direto para a dívida no Financeiro (`#btn-receipt-link-debt`), omitindo menções a créditos em contas bancárias.
  - **1.5 Estorno de Venda a Prazo**: Ao estornar a venda, o estoque é reposto, a dívida é anulada (`status: 'anulada'`, `isCancelled: true`), e se já tiverem ocorrido pagamentos parciais ou totais da dívida, são emitidos movimentos financeiros de saída de reversão (`isReversal: true`, `reversalOfId`) nas contas bancárias que receberam os pagamentos. Entregas pendentes de transporte são canceladas.
  - **1.6 Dashboard e Saldo Bancário**: A receita conta na data da venda no Dashboard para faturamento, mas o valor da venda a prazo não surge no saldo bancário.
  - **1.7 Aviso de Vendas Antigas**: Preservação estrita dos movimentos históricos; banner informativo no Caixa (`#banner-warning-credit-sales-with-bank-credit`) identifica vendas legadas a prazo com crédito bancário direto sem alterar o banco de dados em silêncio.
- **Ficheiros Modificados / Criados**:
  - `src/types/stock.ts`: Adicionado estado `anulada` a `DebtStatus`, propriedades de anulação/cancelamento a `Debt`, campos de estorno a `DebtPayment`, e `dueDate` opcional a `Sale`.
  - `src/utils/saleValidation.ts`: Validação estrita em `validateCreditSaleClient` impedindo consumidor final e clientes vazios em vendas a prazo.
  - `src/context/StockContext.tsx`: Criação de dívida a receber em `completeSale` para vendas a prazo sem entrada bancária imediata; fluxo completo de estorno em `cancelSale` com anulação da dívida e saídas de compensação de pagamentos recebidos; `getDebtCalculations` suportando dívidas anuladas.
  - `src/components/caixa/NewSaleModal.tsx`: Validação com foco no campo, mensagem junto ao seletor de cliente e campo de data de vencimento opcional.
  - `src/components/caixa/SaleReceiptModal.tsx`: Rótulo "Por receber", "Saldo em dívida" e botão de ligação direta à dívida em Dívidas.
  - `src/components/caixa/VendaView.tsx`: Estados dinâmicos "A prazo", "Parcialmente paga", "Paga", "Estornada" e banner de aviso de vendas a prazo anteriores com crédito direto.
  - `tests/integrity.test.ts`: Testes unitários para validação de cliente em venda a prazo e reversão de dívida/pagamentos.
- **Impacto nas Regras de Negócio / Arquitetura**: Em total conformidade com as regras de imutabilidade e integridade financeira do ERP (saldos sempre calculados por movimentos, sem eliminação física).
- **Verificação**: `npm test` (75/75 testes aprovados), `npm run lint` (`tsc --noEmit`) 0 erros, `npm run build` compilado com 100% de sucesso.

### [2026-10-18] — Google AI Studio Build (Gemini) — Auditoria de Design: Blocos 7 e 8 Concluídos
- **Objetivo**: Concluir integralmente as especificações da Auditoria de Design nos Blocos 7 e 8:
  - **Bloco 7 (Calendário e páginas "Em breve")**:
    - **7.1 Calendário Business**: Eventos nos calendários mensal e semanal com tipografia a 14 px (`text-sm`), altura visual mínima de 32 px (`min-h-[32px]`), alvo de interação de 44 px (`min-h-[44px]`) e até duas linhas de título (`line-clamp-2 leading-snug`).
    - **7.2 Afiliados e Agentes**: Unificados com o componente reutilizável `ComingSoonView` (`src/components/common/ComingSoonView.tsx`), textos coerentes e informativos sobre as funcionalidades previstas, destaques com ícones temáticos e ação contextual de regresso ("Voltar para o Dashboard" / "Voltar para Contactos"). A etiqueta "Em breve" foi adicionada à barra lateral (`Sidebar.tsx`) no item principal "Agentes" e no subitem "Afiliados" de Contactos (assim como no modo colapsado e flyouts). Removida menção obsoleta a "Análise de produtos" de `OutOfServiceView`.
  - **Bloco 8 (Aparência e números)**:
    - **8.1 Definições → Aparência**: Pré-visualizações visuais em miniatura (~160 × 96 px) para as três opções (Claro, Anoitecer, Seguir o dispositivo), ilustrando o cabeçalho, barra lateral e cartões analíticos no estilo de cada tema (incluindo split com indicador automático no tema do sistema), com indicador ativo contrastante em índigo e ícone de seleção `Check`.
    - **8.2 Valores monetários**: Alinhamento à direita (`text-right`) e números de largura uniforme com `tabular-nums` em toda a informação financeira (Caixa, Vendas, Estoque, Movimentações, Defeituoso, Dívidas, Contas e Orçamento), removendo `font-mono` de quantias monetárias e reservando-o exclusivamente para códigos (SKUs, referências `#VND-`, IBANs, NIFs e IDs).
- **Ficheiros Modificados / Criados**:
  - `src/components/common/ComingSoonView.tsx`: Componente padronizado para módulos em breve.
  - `src/components/contacts/AfiliadosView.tsx`: Atualizado para utilizar `ComingSoonView` com ação de regresso.
  - `src/components/layout/OutOfServiceView.tsx`: Substituição de referência a "Análise de produtos" por "Simulador de importação e rentabilidade".
  - `src/components/layout/Sidebar.tsx`: Badge "Em breve" em Agentes e Afiliados (expandido, colapsado e flyout).
  - `src/components/calendar/CalendarMonthGrid.tsx`: Eventos com texto 14 px, altura visual >= 32 px, touch target 44 px e line-clamp-2.
  - `src/components/calendar/CalendarWeekGrid.tsx`: Eventos com texto 14 px, altura visual >= 32 px, touch target 44 px e line-clamp-2.
  - `src/components/settings/AppearanceSettings.tsx`: Cartões de pré-visualização (160 × 96 px) com indicação nítida de seleção.
  - `src/components/caixa/VendaView.tsx`: Coluna de total monetário com `tabular-nums text-right` e `font-mono` preservado nas referências.
  - `src/components/movements/MovementsView.tsx`: Coluna de quantidade com `tabular-nums text-right`.
  - `src/components/defective/DefectiveView.tsx`: Total de perdas e quantidades com `tabular-nums text-right`.
  - `src/components/financeiro/DividasView.tsx`: Valores total, pago e restante com `tabular-nums text-right`.
  - `src/components/stock/WarehouseStockView.tsx`: Preço de venda com `tabular-nums text-right`.
  - `src/components/products/ProductDetailModal.tsx`: Preços de custo e venda com `tabular-nums text-right`.
  - `src/components/home/HomeView.tsx` e `src/components/home/HomeTools.tsx`: Valores monetários de cartões, orçamentos e relatórios com `tabular-nums text-right`.
  - `docs/CURRENT_STATE.md`: Atualização do handoff ativo com conclusão dos Blocos 7 e 8.
  - `docs/CHANGELOG_AI.md`: Registo detalhado da intervenção.
- **Impacto nas Regras de Negócio / Arquitetura**: 100% preservadas as invariantes de negócio, cálculo de saldos e imutabilidade financeira.
- **Verificação**: `npm test` (74/74 testes aprovados), `npm run lint` (`tsc --noEmit`) limpo com 0 erros, `npm run build` (`vite build`) concluído com sucesso e dev server respondendo com HTTP 200.

### [2026-10-17] — Google AI Studio Build (Gemini) — Auditoria de Design: Bloco 6 (Estados Vazios e Painéis sem Dados) Concluído
- **Objetivo**: Concluir integralmente as especificações da Auditoria de Design no Bloco 6:
  - **6.1 Componente Único de Estado Vazio (`src/components/common/EmptyState.tsx`)**: Componente centralizado reutilizável com título, explicação curta, ação contextual, suporte a ícone e padding padronizado de 24–32 px (`p-6 sm:p-8`), utilizado tanto no Home como no Business. Remoção de secções vazias não orientadoras: em Orçamento e em Relatórios exibe "Sem despesas neste período" em vez de tabelas vazias.
  - **6.2 Dashboard Business sem Vendas**: Bloco compacto de 160–200 px (`min-h-[160px] max-h-[200px]`) com "Sem vendas neste período" e ação contextual "Alterar período" via `EmptyState` em substituição ao gráfico com escala vazia 0–4; acompanhamento operacional de pendências (produtos abaixo do mínimo, entregas por concluir) sobreposto antes dos indicadores vazios.
  - **6.3 Dashboard Home sem Dados**: Resumo compacto de saldos seguido de três passos guiados claros (1. Adicionar conta, 2. Registar movimento, 3. Definir orçamento); gráficos completos exibidos somente quando existem movimentos registados.
  - **6.4 Home → Finanças**: Reordenação para "As tuas contas" e o saldo virem em primeiro lugar, e o histórico de movimentos em segundo; "Transferir rendimento do Business" ajustado para botão secundário no cabeçalho das contas (`#home-btn-toggle-business-transfer`), abrindo o formulário sob demanda.
  - **6.5 Home → Calendário**: No desktop mantém o mês em grelha acompanhado de uma agenda compacta lateral de compromissos; em telemóvel, exibe lista cronológica vertical dos próximos dias com eventos em vez da grelha de 7 colunas.
  - **6.6 Home → Relatórios**: Bloco comparativo de períodos (anterior, atual e variação) estruturado em três colunas com valores monetários alinhados à direita; "Despesas por categoria" com indicação clara quando não há despesas no período.
  - **6.7 Home → Histórico e Dívidas Pessoais**: Adoção do componente unificado `EmptyState`, garantindo ação contextual principal sempre na mesma posição padronizada.
  - **6.8 Orçamento, Contas da Casa e Metas**: Estados vazios com ação contextual logo junto ao texto orientador através de `EmptyState`.
- **Ficheiros Modificados / Auditados**:
  - `src/components/common/EmptyState.tsx`: Componente padronizado de estado vazio.
  - `src/components/dashboard/DashboardView.tsx`: Bloco de 160–200 px sem vendas e subida de pendências operacionais.
  - `src/components/home/HomeView.tsx`: Três passos guiados no Dashboard vazio, "As tuas contas" em primeiro lugar em Finanças, botão secundário de transferência do Business e estados vazios em Orçamento, Contas da casa e Metas.
  - `src/components/home/HomeTools.tsx`: Calendário com agenda compacta no desktop e lista vertical no telemóvel, Relatórios com 3 colunas e valores alinhados à direita, e `EmptyState` em Histórico e Dívidas.
  - `docs/CURRENT_STATE.md`: Atualização do estado do handoff ativo.
  - `docs/CHANGELOG_AI.md`: Registo detalhado da intervenção.
- **Impacto nas Regras de Negócio / Arquitetura**: Preservação total das invariantes de negócio, imutabilidade financeira no Business e auditoria.
- **Verificação**: `npm test` (74/74 testes passando), `npm run lint` (`tsc --noEmit`) limpo com 0 erros, `npm run build` (`vite build`) concluído com sucesso.

### [2026-10-17] — Google AI Studio Build (Gemini) — Auditoria de Design: Blocos 3, 4 e 5 Concluídos
- **Objetivo**: Concluir integralmente as especificações da Auditoria de Design nos Blocos 3, 4 e 5:
  - **Bloco 3 (Cores de estado e avisos)**: Tokens semânticos centrais de estado em `src/index.css` (`--sem-info`, `--sem-success`, `--sem-warning`, `--sem-error`) com contraste >= 4,5:1; azul semântico `#7DD3FC` no indicador "Em Rota" em modo escuro; superfícies semânticas e aviso em Definições com botão "Zerar histórico" protegido exibindo etiqueta "Indisponível" e visual desativado; cor acompanhada de texto/ícone; botões primários com `dm-btn-primary`.
  - **Bloco 4 (Ações duplicadas e rótulos)**: Uma única ação primária de criação por ecrã (44–48 px de altura, sem "+"); remoção de botões duplicados em Movimentação, Venda, Dívidas e Definições; rótulos específicos no Calendário ("Nova agenda" e "Novo compromisso"); Lista de compras com ação explícita "Abrir grupo" (alvo 44 px).
  - **Bloco 5 (Formulários)**: Novo Produto em grelha estável de duas colunas com 16–24 px de intervalo e Unidade de Medida harmonizada; erros de validação logo abaixo do campo (8 px) com contorno visual e foco/scroll automático; Nova Venda com seletor de armazém em linha secundária sem truncar, inputs a 16 px, rótulos a 14 px e divisórias espaçadas (24 px); Simulador de importação com quatro grupos nítidos (32 px) e ações alinhadas à direita; Home → Compras em grelha hierárquica; Home → Planeamento com filtros alinhados pela base e estado vazio explícito; separação nítida em Home → Documentos; área única de importação de extratos (3 passos guiados: Conta, Documento, Revisão) em Home e Business, com correção de fecho de tags JSX em `BusinessDocumentsView.tsx`.
- **Ficheiros Modificados**:
  - `src/index.css`: Definição de tokens de estado semânticos e classes utilitárias.
  - `src/components/caixa/TransporteView.tsx`: Indicador de rota com contraste acessível em modo escuro.
  - `src/components/settings/SettingsView.tsx`: Superfícies de aviso/perigo com tokens dark mode e botão "Zerar histórico" com estado "Indisponível".
  - `src/components/movements/MovementsView.tsx`: Remoção de ação secundária duplicada na barra de filtros.
  - `src/components/caixa/VendaView.tsx`: Remoção do botão de venda duplicado na cápsula de filtros.
  - `src/components/caixa/NewSaleModal.tsx`: Visual limpo com divisórias, inputs 16 px e seletor não truncado.
  - `src/components/financeiro/DividasView.tsx`: Altura 44 px padronizada na ação principal.
  - `src/components/products/ProductCreateModal.tsx`: Grelha de 2 colunas, seções claras, scroll/foco no primeiro campo com erro.
  - `src/components/analytics/ImportSimulatorView.tsx`: 4 grupos espaçados (32 px), tooltips precisas e ações alinhadas à direita.
  - `src/components/home/HomeShopping.tsx`: Formulário estruturado com produto amplo e colunas pareadas.
  - `src/components/home/HomeTools.tsx`: Filtros de planeamento com rótulo superior, altura 44 px, estados vazios explícitos e documentos divididos.
  - `src/components/financeiro/BusinessDocumentsView.tsx`: Estruturação da área de importação em 3 passos e correção de fechamento de tags JSX.
  - `docs/CURRENT_STATE.md`: Atualizado handoff ativo.
  - `docs/CHANGELOG_AI.md`: Registada intervenção completa.
- **Impacto nas Regras de Negócio / Arquitetura**: 100% de preservação das invariantes de negócio, imutabilidade financeira e auditoria.
- **Verificação**: `npm test` (74/74 testes passando), `npm run lint` (`tsc --noEmit`) limpo com 0 erros, `npm run build` (`vite build`) concluído com sucesso.

### [2026-10-15] — Google AI Studio Build (Gemini) — Auditoria de Design: Bloco 2 (Tabelas)
- **Objetivo**: Concluir todas as especificações do Bloco 2 da auditoria visual: tabelas sem rolagem horizontal em 1280px, coluna de ações fixa à direita com ícones de 44x44px, miniaturas padronizadas de 48x48px com fallback neutro por categoria, referências curtas com cópia e compatibilidade total de busca, resumos de duas linhas e detalhes expansíveis.
- **Ficheiros Modificados / Criados**:
  - `src/utils/references.ts`: Criado módulo de referências com `formatShortRef`, `matchRefOrFull`, `abbreviateIban` e `abbreviateAccountNumber`.
  - `src/components/common/ProductThumbnail.tsx`: Componente padronizado de miniaturas 48x48px com ícones neutros SVG de categoria como fallback consistente.
  - `src/components/stock/WarehouseStockView.tsx`: Título "Armazém" a 24px, descrição curta, botão "Adicionar", coluna Produto (280-320px) com SKU e cópia rápida, Empresa como linha secundária, Preço e ações fixas 44x44px sempre visíveis.
  - `src/components/defective/DefectiveView.tsx`: Produto com >= 240px, nota em 2 linhas, decisão em seletor único estilizado de 44px, modal de detalhe completo e botão "Registar Defeituoso".
  - `src/components/caixa/VendaView.tsx`: Ref. de venda curta (120-160px) com cópia, busca combinada (ref curta e ID completo), Total, Estado e Ações sempre visíveis à direita com ícones 44x44px.
  - `src/components/caixa/TransporteView.tsx`: Endereço de destino (240-320px, até 3 linhas), venda vinculada com ref curta e cópia, ações logísticas ("Expedir" / "Confirmar Entrega") preservadas com botões 44x44px.
  - `src/components/contacts/FuncionariosView.tsx`: Priorização de Nome, Cargo, Contacto, Estado e Ações; Empresa como linha secundária; botões de ação 44x44px sticky right.
  - `src/components/contacts/FornecedoresView.tsx`: Telefone e email em duas linhas, localização resumida, artigos vinculados e ações visíveis à direita.
  - `src/components/financeiro/DividasView.tsx`: Restante com barra de progresso, Vencimento e Ações sempre visíveis com ícones de 44x44px sticky right; corrigida tag `<thead>`.
  - `src/components/movements/MovementsView.tsx`: Ref. Movimento curta com cópia de ID completo, texto 14px (`text-sm`), espaçamento vertical de 14px (12-16px), miniatura 48x48px, busca sem colisões com `matchRefOrFull` e ações sticky right 44x44px.
  - `src/components/contacts/ClientesView.tsx`: Ações de linha padronizadas no estilo secundário com botões 44x44px (botão preenchido exclusivo para "Adicionar") e coluna fixa à direita.
  - `src/components/financeiro/LancamentosView.tsx`: Resumo de duas linhas por registo (descrição 14px, referência 12-13px), detalhe expansível para motivos completos, referências e avisos de estorno, ações sticky right 44x44px.
  - `src/components/banks/BankView.tsx`: IBAN e número de conta abreviados com botão de cópia rápida, navegação interna discreta e secundária, espaçamento de 24px entre grupos.
  - `src/data/mockData.ts`: Ajustados dados de seed de produtos (removida foto de rosto na T-shirt para espaço neutro com ícone de vestuário).
  - `docs/CURRENT_STATE.md`: Atualizada secção de Handoff ativo com Bloco 2 concluído.
- **Impacto nas Regras de Negócio / Arquitetura**: Layout, tipografia, tokens de acessibilidade e padronização visual das tabelas. Invariantes de auditoria, imutabilidade financeira e cálculo de saldos estritamente preservadas.
- **Verificação**: `npm run lint` (`tsc --noEmit`) limpo com 0 erros, `npm run build` (`vite build`) concluído com sucesso.

### [2026-10-14] — Google AI Studio Build (Gemini) — Auditoria de Design: Bloco 1 (Navegação móvel e versão fixa)
- **Objetivo**: Implementar o Bloco 1 da auditoria visual: navegação móvel com painel sobreposto fechado por defeito, remoção de coluna fixa em telemóvel, alvos de toque 44px, rótulo "Simulador de importação", aviso de versão em rodapé reservando espaço e preservação integral da navegação desktop.
- **Ficheiros Modificados**:
  - `src/components/layout/Sidebar.tsx`: Painel sobreposto em telemóvel (`< 768px`) com fundo escurecido sem fecho por clique; botão "X" (`#btn-close-mobile-sidebar`, 44x44px); fecho por Esc e seleção de item; itens com 14px (`text-sm`) e linhas de 44px (`min-h-[44px]`); rótulo "Simulador de importação"; link de versão no rodapé.
  - `src/components/layout/Header.tsx`: Botão de menu hambúrguer (`#btn-mobile-menu`, 44x44px, `md:hidden`) junto ao breadcrumb.
  - `src/components/home/HomeHeader.tsx`: Botão de menu hambúrguer (`#btn-mobile-menu`, 44x44px, `md:hidden`) no cabeçalho Home.
  - `src/components/home/ModeSwitcher.tsx`: Linhas de 44px (`min-h-[44px]`) e texto 14px (`text-sm font-semibold`).
  - `src/App.tsx`: Estado `isMobileMenuOpen` com fecho automático na navegação e integração com Sidebar e Headers.
  - `scripts/pages-catalog.mjs`: Aviso de versão de pré-visualização reposicionado para rodapé da página com espaço real no layout (`position:relative`), sem sobrepor botões e conteúdos.
- **Impacto nas Regras de Negócio / Arquitetura**: Apenas layout, acessibilidade e CSS; zero impacto em lógica de negócio, dados, moedas ou permissões.
- **Verificação**: `npm test` (74 testes passaram), `tsc --noEmit` sem erros, `vite build` executado com sucesso.

### [2026-10-13] — Google AI Studio Build (Gemini) — Correção de Preços Negativos e Vendas a Prazo
- **Objetivo**: Corrigir duas falhas de alta prioridade: (1) bloqueio estrito de preços negativos no cadastro de produtos e variações para proteger a valorização do estoque; (2) vendas a prazo agora exigem obrigatoriamente identificação de cliente, não geram entrada bancária imediata, criam dívida a receber vinculada em Financeiro → Dívidas e exibem recibo com "Total a Receber (A Prazo)" e atalho para Dívidas.
- **Ficheiros Modificados / Criados**:
  - `src/utils/productValidation.ts`: Criada função central `validateProductPrices` validando preços finitos não negativos para custo, venda e variações.
  - `src/utils/saleValidation.ts`: Criada função `validateCreditSaleClient` garantindo cliente identificado em vendas a prazo.
  - `src/components/products/ProductCreateModal.tsx`: Validação de passos 1, 2 e 3 e bloqueio de valores negativos nos inputs numéricos de preço.
  - `src/context/StockContext.tsx`: Validação central em `addProduct` e `updateProduct`; `completeSale` cria dívida a receber e omite entrada bancária imediata para vendas a prazo; `cancelSale` estorna/remove a dívida a prazo pendente sem pagamentos.
  - `src/components/caixa/NewSaleModal.tsx`: Bloqueio de submissão a prazo sem cliente, alerta explicativo e indicador visual no seletor de clientes.
  - `src/components/caixa/SaleReceiptModal.tsx`: Rótulo "Total a Receber (A Prazo)" para vendas a prazo e link direto para Financeiro → Dívidas (`#btn-receipt-link-debt`).
  - `src/components/stock/WarehouseStockView.tsx`: Cálculo defensivo do valor do estoque impedindo contaminação por valores negativos.
  - `src/components/analytics/ProductAnalyticsView.tsx` e `src/components/defective/DefectiveView.tsx`: Cálculos de capital imobilizado e perdas protegidos.
  - `tests/integrity.test.ts`: Adicionados testes para `validateProductPrices` e `validateCreditSaleClient`.
  - `docs/BUSINESS_RULES.md`, `docs/CURRENT_STATE.md`, `docs/CHANGELOG_AI.md`: Atualizados com as regras e handoff.
- **Impacto nas Regras de Negócio / Arquitetura**: Regras de negócio alinhadas rigorosamente com a contabilidade: crédito gera conta a receber (Dívidas), não saldo de caixa imediato; estoques protegidos contra custos negativos.
- **Verificação**: `npm test` (74 testes passaram), `npm run lint` (`tsc --noEmit` limpo) e `npm run build` (`vite build` bem-sucedido).

### [2026-10-13] — Google AI Studio Build (Gemini) — Migração e normalização de importação GitHub
- **Objetivo**: Executar a migração de importação do repositório GitHub para o ambiente do Google AI Studio de acordo com a skill `github-import-migration`.
- **Ficheiros Modificados / Criados**:
  - `bun.lock`: Removido para manter a normalização estrita de runtime npm (Phase 1.1).
  - `package.json`: Nome atualizado para `myoffice`.
  - `vite.config.ts`: Adicionadas opções explícitas `host: '0.0.0.0'` e `port: 3000` nas configurações de servidor dev.
  - `.env.example`: Criado template com variáveis de ambiente do projeto (`MYOFFICE_BASE_PATH`, `DISABLE_HMR`).
  - `docs/CURRENT_STATE.md`: Atualizado handoff ativo com o estado validado.
  - `docs/CHANGELOG_AI.md`: Registada intervenção.
- **Impacto nas Regras de Negócio / Arquitetura**: Nenhuma regra de negócio alterada; 100% de compatibilidade e invariantes preservadas.
- **Verificação**: `npm test` (72 testes passaram), `npm run lint` (`tsc --noEmit` sem erros) e `npm run build` (`vite build` bem-sucedido). Servidor dev ativo na porta 3000 (0.0.0.0).

### [2026-10-12] — OpenAI Codex — Correções prioritárias do relatório MyOffice
- **Pedido**: Prosseguir com a ordem proposta após analisar o relatório e imagens; corrigir funcionamento antes de ampliar funcionalidades.
- **Produto**: Ecrã branco reproduzido em Chromium: evento React passado como `initialCategory` pelo botão Adicionar causava JSON circular em `computeSnapshot`. Ligação corrigida sem mudar o cadastro/saldos.
- **Home**: Data local por padrão, carteira de maior saldo positivo na moeda da reserva, fallback sem saldo, erros de campo limpos quando corrigidos. Reserva desligada em instalações novas/migrações sem preferência; escolhas explícitas mantidas. Testes financeiros que requerem reserva agora ativam-na explicitamente.
- **UI**: Definições fixa acima de Home/Business; Calendário como nome visível, chaves/IDs preservados. Detalhes por linha/Enter/Espaço em stock, vendas, transporte, dívidas Business e contactos, com ações internas independentes e aparência consistente entre temas. Navegação reinicia rolagem do workspace.
- **Dashboard**: Previsão de 7/30 dias reutiliza `homeForecast`, com referência do saldo atual, sem novos movimentos. Dívidas sem carteira são explicitamente excluídas da simulação. Formatação monetária com milhares separados em Kz/USD/EUR.
- **Extratos**: Identificação exata e única por cabeçalhos Conta:/IBAN: nos dois modos; recusa correspondências ausentes/ambíguas antes de confirmar. Home acrescenta identificadores opcionais editáveis e validados nos backups. Sem identificação, mantém revisão manual; comprovativos não usam cabeçalhos para inferir propriedade de contas de terceiros. Dados futuros cabem em bank_accounts.details já existente.
- **Validação**: 72 unidades; TypeScript/build; oito regressões financeiras Business; scripts Home financeiro, Home completo, blocos 3–6, leitura de ficheiros Home e Business; nova regressão de UI/produtos/reserva/metadados/PDF com contextos fictícios isolados. Aviso conhecido de chunks grandes permanece. Commit solicitado pelo utilizador após validação. Sem push/publicação e sem alterar dependências/lockfile ou conectar SQL.
- **Limites**: Não implementa partilha de saldos Home/Business, vigilância de pastas do telefone nem verificação criptográfica de assinaturas; mantém as decisões de revisão e transferência separada. O restante redesign de simulador, POS, contactos/dívidas pessoais e biblioteca de documentos não faz parte desta entrega prioritária.


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
