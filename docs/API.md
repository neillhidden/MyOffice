# Camada de API, Integrações e Backend — MyOffice

Este documento descreve o estado real de APIs, backend e integrações externas no projeto **MyOffice**.

---

## 1. Estado Atual: 100% Client-Side

Após auditoria completa ao repositório:

- **Servidor Backend (`server.ts` / Express)**: **Não existe atualmente.**
  - O ficheiro `package.json` inclui as dependências `"express": "^4.21.2"`, `"dotenv": "^17.2.3"` e `"@google/genai": "^2.4.0"` provenientes do template padrão do Google AI Studio, mas **nenhum ficheiro de servidor ou endpoint HTTP (`/api/*`) foi criado ou é invocado pelo frontend**.
  - O script `"dev"` em `package.json` executa diretamente `"vite --port=3000 --host=0.0.0.0"`.
- **Chamadas de Rede (`fetch` / `axios` / `WebSocket`)**: **Nenhuma chamada de rede a APIs de negócio ou LLMs é realizada pelo código atual.**
- **Integrações Externas**:
  - Google Fonts (`Plus Jakarta Sans` carregada em `index.html`).
  - Imagens de produtos nos dados de *seed* utilizam URLs estáticos do Unsplash (`images.unsplash.com`).
  - Taxas de câmbio (`USD`, `EUR`, `CNY`, `ZAR`, etc.) são configuradas manualmente pelo utilizador no Simulador de Importação ou utilizam constantes de referência (`USD_TO_KZ_RATE = 925` em `src/utils/formatters.ts`).

---

## 2. Contrato Interno de Operações (`useStock` Hook)

Embora ainda não exista uma API REST/GraphQL, toda a lógica de leitura e escrita dos componentes UI já está desacoplada através do hook **`useStock()`** (`src/context/StockContext.tsx`).

Quando no futuro for implementado um backend ou base de dados (**A confirmar**), as funções abaixo expostas pelo `StockContextType` representam os casos de uso que deverão ser mapeados para endpoints de API:

### 2.1. Empresas e Armazéns
- `addCompany(company)` / `updateCompany(id, data)` / `deleteCompany(id)`
- `addWarehouse(warehouse)` / `updateWarehouse(id, data)` / `deleteWarehouse(id)`
- `updateStockLimits(productId, warehouseId, minLimit, maxLimit, physicalLocation?)`

### 2.2. Produtos, Movimentações e Defeituosos
- `addProduct(product, initialStocks?, warehouseLimits?)`
- `updateProduct(id, product, warehouseLimits?)`
- `deleteProduct(id)`
- `saveDraft(draft)` / `deleteDraft(id)`
- `recordMovement(movement, financialExit?)`
- `removeStockMovement(movementId, reason, removedBy?)`
- `restoreStockMovement(movementId)`
- `recordDefective(record)` / `updateDefectiveResolution(id, decision, notes?)`

### 2.3. Listas de Compras
- `addPurchaseGroup(name, description?)` / `updatePurchaseGroup(id, name, description?)` / `deletePurchaseGroup(id)`
- `createPurchaseList(list)` / `updatePurchaseList(id, data)` / `deletePurchaseList(id)`
- `completePurchaseList(listId, warehouseId, bankId?, responsible?)`

### 2.4. Caixa (Vendas e Transporte)
- `completeSale(saleData, transportData?)`
- `addTransport(transport)` / `updateTransport(id, data)` / `updateTransportStatus(id, status)`

### 2.5. Financeiro (Bancos, Lançamentos e Dívidas)
- `addBank(bank)` / `updateBank(id, data)` / `deleteBank(id)`
- `recordBankMovement(movement)`
- `reverseBankMovement(movementId, reason, responsible?)`: acrescenta compensação e preserva o original.
- `addDebt(debt)` / `updateDebt(id, data)` / `deleteDebt(id)`
- `recordDebtPayment(paymentData)` / `deleteDebtPayment(paymentId, reason)`: pagamento e estorno, preservando o histórico.
- `incrementDebtAmount(debtId, amount, reason, date?, bankId?)`

### 2.6. Contactos, Calendário e Notificações
- `addSupplier(supplier)` / `updateSupplier(id, data)` / `deleteSupplier(id)`
- `addEmployee(employee)` / `updateEmployee(id, data)` / `deleteEmployee(id)`
- `addClient(client)` / `updateClient(id, data)` / `deleteClient(id)`
- `addAgenda(agenda)` / `updateAgenda(id, data)` / `toggleArchiveAgenda(id)` / `deleteAgenda(id)`
- `addEvent(event)` / `updateEvent(id, data)` / `toggleEventStatus(id)` / `deleteEvent(id)`
- `markNotificationAsRead(id)` / `markAllNotificationsAsRead()` / `deleteNotification(id)`

---

## 3. Pontos em Aberto (`A confirmar`)

- **Backend & Base de Dados**: Se o projeto migrar de `localStorage` para uma API REST (Express/Node, Next.js, Supabase ou Firebase), a estratégia de sincronização e autenticação está **A confirmar**.
- **Módulo `Agentes`**: Existe na barra lateral o item `Agentes` (atualmente exibindo `OutOfServiceView`). A utilização futura de `@google/genai` para agentes de IA dentro do MyOffice está **A confirmar**.
- **Cotações de Câmbio Automáticas**: Integração com API externa de taxas de câmbio (BNA / mercados internacionais) está **A confirmar**.


## Estrutura offline para a fase de backend

O esquema SQL em `database/migrations/001_initial.sql` está guardado e testado localmente. `database/README.md` descreve relações, importação e trabalho necessário antes da ligação. Não existem endpoints novos, autenticação ativa, SDK de base de dados ou credenciais no frontend. A versão atual continua a operar exclusivamente no navegador.

## Contrato futuro Home/Business (2026-10-08)

Nenhuma API conectada. A futura operação Business → Home exige autorização nos dois espaços, contas ativas, moeda igual, saldo suficiente e duas pernas com transfer_group_id na mesma transação SQL. Estorno também conjunto; referências pessoais atuais em import_details devem ser preservadas pelo importador. Metas planeadas não geram ledger; aquisição reservada gera saída da reserva com vínculo à meta. A migração 003 prepara esses campos, mas a API ainda deverá validar valor, moeda, conta e aquisição única sob concorrência.

### Futuro scheduler Home

A versão atual processa contas no navegador. Um scheduler futuro deve bloquear a ocorrência conta/data e gravar movimento + estado aceito numa transação, validar moeda/taxa/permissão e assegurar idempotência no servidor. Notificações com aplicação fechada e sincronização entre dispositivos dependem dessa fase; não existem endpoints novos nesta entrega.

### Futuras ferramentas Home — migração 006

Sem endpoints atuais. A futura API deverá transacionar dívida/pagamento/ledger e validar limite de amortização/saldo/moeda; conservar revisions/overlays para correções pessoais e não alterar ledger Business. Extratos precisam de idempotência por fingerprint SHA-256, correspondência de data/valor/carteira e invalidação após correção. Upload privado deve validar assinatura/tamanho/entidade/workspace, guardar objeto e metadados e fornecer downloads autorizados. Tarefas concluem por data; previsões/relatórios são projeções, sem efeitos no ledger. Tudo continua local nesta fase, com JSON exportável.
