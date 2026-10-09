# Direção de Produto — MyOffice

Requisitos expressos pelo utilizador em 2026-10-07. Este documento serve também de continuidade entre Codex e Google AI Studio; ferramentas não substituem Git/código/documentação como fonte de verdade.

## Dois espaços do mesmo produto

- **MyOffice Home**: finanças da pessoa/família, despesas da casa, mensalidades, orçamento, férias, reserva e sonhos/objetivos com valor, prazo e progresso.
- **MyOffice Business**: gestão de várias empresas, armazéns, vendas, estoque, compras, tesouraria, dívidas, contactos e logística.
- **Alternância**: botão visível Home ⇄ Business no computador, com acesso fácil também no telefone. Cada modo mostra os seus menus, indicadores e dados. Business deve indicar a empresa selecionada.
- **Separação financeira**: contas/saldos pessoais e empresariais não se misturam. Transferências entre os espaços precisarão de operações correspondentes e classificação própria.
- **Telefone**: permitir quase todas as tarefas; adaptar a interface ao toque e ao ecrã pequeno. O computador favorece tarefas extensas e relatórios. Não limitar a versão móvel apenas à consulta.
- **Custos**: o funcionamento do sistema não depende de APIs de IA pagas. Avaliar opções gratuitas para desenvolvimento/alojamento, com limites e exportação/portabilidade; não prometer gratuidade permanente de terceiros.

## Estrutura atual e preparada

Hoje, `src/components/` contém as telas Business; `StockContext` coordena as operações e `localStorage` conserva os dados. Os utilitários em `src/utils/` reforçam IDs, validação de vendas e estornos sem substituir React/Context API.

A estrutura futura de dados está em `database/`: espaços, membros, empresas e finanças partilhadas; estruturas pessoais para categorias, orçamentos, contas recorrentes e objetivos. Essa preparação não acrescenta conexão nem backend.

O seletor Home/Business e as oito áreas pessoais foram implementados em 2026-10-08; consultar `HOME.md`. Quando forem implementados, devem selecionar explicitamente um espaço e apresentar uma identidade clara de modo/empresa. O acesso persistente e a autorização entre espaços serão assegurados pelo backend na etapa posterior, não apenas por filtros visuais.

## Etapa concluída nesta intervenção

Correção dos três problemas de integridade identificados: IDs dependentes do relógio, validação central insuficiente de vendas e remoções/resets que comprometiam auditoria financeira. Esquema PostgreSQL offline guardado com testes.

A conexão da base de dados, autenticação e permissões continuam adiadas por pedido do utilizador. O front-end Home já inclui finanças, orçamento, recorrências programáveis, metas e agenda, com cópia local exportável. Novas funcionalidades pessoais deverão preservar essa separação.

## Decisões de 2026-10-08

Nome confirmado: **Home | Business**. Seletor no rodapé da barra lateral; compacto com escolha de modo no telefone/barra recolhida. O Home deve organizar a vida pessoal, metas e dashboard. Implementação documentada em `HOME.md`; integração remota continua adiada.

Pedido adicional de 2026-10-08: seletor na parte inferior, calendário baseado na data real, categorias e subcategorias nos dois modos (Games → Jogos/Consoles), produtos por classificação, modo Anoitecer nas Definições e melhorias dos dashboards. Implementação e uso em [CATEGORIES.md](CATEGORIES.md).

## Preferências confirmadas em 2026-10-08

Contas pessoais em AOA/USD e totais separados. Decisão inicial: metas planeadas por padrão; substituída em 09/10/2026 por reserva ativada nas instalações novas, preservando escolhas explícitas. Reserva financeira configurável, aquisição sem desconto duplicado. Business transfere para carteira pessoal separada, sem saldo partilhado; opção de ocultar formulário. Categorias principais de despesa incluem Alimentação/Internet/etc.; rendimentos têm taxonomia própria. ATT significa atenção. Dashboard com gráficos de receitas/despesas e pizza de categorias, orçamento com gastos reais. Definições preservam estilo em linhas/páginas próprias; scroll interno com topo/sidebar fixos. Barra recolhida mostra ícone do destino na alternância Home/Business.

## Home completo — 09/10/2026

Autorizado pelo utilizador implementar as oito melhorias propostas: calendário, histórico/recuperação, dívidas/prestações, previsões, relatórios CSV/PDF, tarefas detalhadas/recorrentes, extratos e documentos. Implementado com persistência local, backup JSON inclusive comprovativos e SQL offline 006 (48 tabelas). PostgreSQL e armazenamento privado de ficheiros constituem a preparação futura; nenhuma ligação/backend/login foi ativada. Guia corrente consolidado em HOME.md.


## Pedido aceite: extratos e recibos

Utilizador pediu PDF (prioritário), CSV, Excel e fotografias, permitindo também texto/manual. A interface distingue entrada positiva, saída negativa e saldo do banco. Leitura prepara propostas; só confirmação aplica dinheiro. Solução gratuita no navegador, integrada nas carteiras e conferência Home.


## Orientações do utilizador — melhorias relacionadas

Aplicar melhorias no Home e no Business quando houver tarefa/funcionalidade correspondente, conservando separação de dados e regras. Proteger comprovativos repetidos e permitir orçamento existente/novo durante revisão. Antes de acrescentar novas preferências globais de ativar/desativar nas Definições, explicar e perguntar ao utilizador; não tratar ações de revisão de um documento como novas preferências globais.
