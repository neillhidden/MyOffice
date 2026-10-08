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

O seletor Home/Business e as sete áreas pessoais foram implementados em 2026-10-08; consultar `HOME.md`. Quando forem implementados, devem selecionar explicitamente um espaço e apresentar uma identidade clara de modo/empresa. O acesso persistente e a autorização entre espaços serão assegurados pelo backend na etapa posterior, não apenas por filtros visuais.

## Etapa concluída nesta intervenção

Correção dos três problemas de integridade identificados: IDs dependentes do relógio, validação central insuficiente de vendas e remoções/resets que comprometiam auditoria financeira. Esquema PostgreSQL offline guardado com testes.

A conexão da base de dados, autenticação e permissões continuam adiadas por pedido do utilizador. O front-end Home já inclui finanças, orçamento, recorrências mensais, metas e agenda, com cópia local exportável. Novas funcionalidades pessoais deverão preservar essa separação.

## Decisões de 2026-10-08

Nome confirmado: **Home | Business**. Seletor abaixo do logótipo, antes do menu; compacto com escolha de modo no telefone/barra recolhida. O Home deve organizar a vida pessoal, metas e dashboard. Implementação documentada em `HOME.md`; integração remota continua adiada.
