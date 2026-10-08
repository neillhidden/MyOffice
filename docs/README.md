# Documentação Técnica Central — MyOffice

Bem-vindo à documentação técnica oficial do **MyOffice**.

Esta documentação foi desenhada para servir como **fonte de verdade partilhada** entre programadores humanos e diferentes agentes de inteligência artificial (**Google AI Studio / Gemini**, **Claude Code**, **OpenAI Codex**, entre outros).

---

## 1. O que é o MyOffice?

O **MyOffice** é uma aplicação web de Gestão Empresarial (**ERP Multi-Empresa e Multi-Armazém**) concebida para o contexto comercial, logístico e financeiro de **Angola**.

A aplicação permite gerir múltiplas empresas do mesmo grupo económico (com estados operacionais distintos: `ativa`, `parada` e `desativada`), controlar múltiplos armazéns e lojas físicas, auditar movimentações de estoque sem perda de histórico, simular importações internacionais multimoeda com cálculo de *Landed Cost* e rentabilidade em Kwanzas (**AOA / Kz**), operar frente de caixa (POS) integrada com logística de entregas, gerir contas bancárias/tesouraria, lançamentos financeiros e dívidas, além de centralizar contactos e calendário operacional.

---

## 2. Mapa da Documentação

| Documento | Finalidade | Quando consultar |
| :--- | :--- | :--- |
| **[`../AGENTS.md`](../AGENTS.md)** | Porta de entrada e protocolo obrigatório para agentes de IA | **Sempre**, no início de qualquer sessão |
| **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** | Arquitetura real do sistema, camadas, estado global (`Context API`), persistência (`localStorage`) e diagramas | Antes de alterar fluxos de dados, estado ou estrutura |
| **[`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)** | Árvore completa de pastas e descrição de todos os ficheiros do repositório | Para localizar componentes, modais, tipos e dados |
| **[`MODULES.md`](./MODULES.md)** | Especificação funcional de todos os módulos e submódulos existentes | Antes de modificar qualquer ecrã ou funcionalidade |
| **[`BUSINESS_RULES.md`](./BUSINESS_RULES.md)** | Regras de negócio, fórmulas matemáticas, regras de auditoria e invariantes | Antes de tocar em cálculos, estoque, vendas, financeiro ou simulador |
| **[`PRODUCT_DIRECTION.md`](./PRODUCT_DIRECTION.md)** | Requisitos aceites de Pessoal/Business, telefone e custos | Antes de ampliar o produto |
| **[`../database/README.md`](../database/README.md)** | Esquema PostgreSQL offline para a futura ligação, Pessoal e Business | Ao preparar a fase de backend |
| **[`DATABASE.md`](./DATABASE.md)** | Entidades de dados (`TypeScript interfaces`), chaves de `localStorage`, *seed data* e reconciliação | Ao alterar modelos de dados ou preparar futura base de dados |
| **[`API.md`](./API.md)** | Estado atual de comunicação (client-side), dependências instaladas e notas sobre futuro backend | Ao planear endpoints, integrações externas ou persistência remota |
| **[`UI_GUIDELINES.md`](./UI_GUIDELINES.md)** | Alinhamento do layout global, sistema de tema Claro/Escuro, tipografia, grelhas e `id`s de teste | Antes de qualquer alteração visual ou de CSS/Tailwind |
| **[`DEVELOPMENT.md`](./DEVELOPMENT.md)** | Configuração do ambiente, scripts NPM, variáveis de ambiente e validação de build | Para executar, compilar e validar o projeto |
| **[`DECISIONS.md`](./DECISIONS.md)** | Registo de decisões arquiteturais e técnicas já tomadas (ADRs) | Para perceber o "porquê" de escolhas existentes no código |
| **[`CURRENT_STATE.md`](./CURRENT_STATE.md)** | Fotografia real do que está pronto, parcial, reservado (`Em Breve`) ou `A confirmar` | Para saber o ponto exato de maturidade de cada área |
| **[`CHANGELOG_AI.md`](./CHANGELOG_AI.md)** | Histórico de alterações realizadas por agentes de IA | No início e no fim de cada sessão de trabalho |

---

## 3. Regra de Manutenção da Documentação

Sempre que um agente de IA ou programador:
1. criar ou alterar um módulo/submódulo;
2. adicionar ou modificar uma regra de negócio;
3. alterar o modelo de dados ou a estratégia de persistência;
4. introduzir backend, base de dados ou integrações externas;

**deve atualizar o documento correspondente nesta pasta `docs/` e adicionar uma entrada em [`CHANGELOG_AI.md`](./CHANGELOG_AI.md).**

### Home — gestão pessoal

[HOME.md](HOME.md) explica como começar, usar finanças, contas da casa, orçamentos, metas, agenda e cópias de segurança, além da separação Home/Business.

- [Categorias, subcategorias, compras e aparência](CATEGORIES.md) — utilização nos dois modos.
