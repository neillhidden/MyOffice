# Regras de Negócio e Auditoria — MyOffice

Este documento especifica as **regras de negócio, fórmulas de cálculo e invariantes de auditoria** implementadas no **MyOffice**.

> **ATENÇÃO PARA AGENTES DE IA**: As regras abaixo foram validadas em múltiplas auditorias funcionais. **Nenhuma alteração de código pode violar estas regras sem instrução explícita do utilizador.**

---

## 1. Estados Operacionais de Empresas (`CompanyStatus`)

Cada empresa (`Company`) possui um campo `status: 'ativa' | 'parada' | 'desativada'`:

| Estado | Visibilidade na UI | Comportamento Operacional | Exemplo no Seed |
| :--- | :--- | :--- | :--- |
| **`ativa`** | Totalmente visível em tabelas, filtros, seletores e gráficos. | Todas as operações permitidas (vendas, movimentações, edições, lançamentos). | *MyOffice Comercial Lda* (`comp-1`), *TechAngola Distribuidora* (`comp-2`), *Nova Era Logística* (`comp-3`) |
| **`parada`** | Visível nos seletores e listagens com etiqueta **`Parada`** e aviso `"Empresa parada — serviços indisponíveis"`. | **Ações operacionais bloqueadas (`disabled`)**: não pode ser selecionada para novas vendas ou novas movimentações; nos detalhes de produtos exclusivos de empresa parada, os botões *Editar*, *Movimentar*, *Configurar Limites* e *Movimentar Variação* ficam desativados. | Qualquer empresa colocada em estado `parada` em Definições |
| **`desativada`** | **Totalmente invisível/excluída** de todas as vistas operacionais (Dashboard, Armazém, Movimentação, Defeituoso, Caixa, Financeiro, Contactos, Calendário). | Visível **apenas** em **Definições → Empresas** (quando filtrado por `Todas` ou `Desativadas`) para permitir reativação futura. | *Kianda Comercial Lda* (`comp-kianda`) |

---

## 2. Cálculo de Estoque e Regra de Ouro de Inventário

### 2.1. O Estoque Nunca é um Campo Estático Editável
- O modelo `Product` **não possui** um campo `stock` estático.
- O saldo atual de um produto num armazém é **sempre calculado dinamicamente** pela função `getCurrentStock(productId, warehouseId)` em `src/context/StockContext.tsx`.

### 2.2. Fórmula de Cálculo (`getCurrentStock`)
Para cada movimento `mov` em `movements`:
1. **Ignorar movimentos removidos**: Se `mov.removido === true` ou `mov.isRemoved === true`, o movimento **é ignorado** (não soma nem subtrai).
2. **Ignorar armazéns de empresas desativadas**: Movimentos de armazéns pertencentes a empresas `desativada` são ignorados.
3. **Soma algébrica no armazém de origem (`mov.warehouseId === warehouseId`)**:
   - `type === 'entrada'` $\rightarrow$ `+ mov.quantity`
   - `type === 'saida'` $\rightarrow$ `- mov.quantity`
   - `type === 'defeituoso'` $\rightarrow$ `- mov.quantity`
   - `type === 'transferencia'` $\rightarrow$ `- mov.quantity` (sai da origem)
   - `type === 'ajuste'` $\rightarrow$ `+ mov.quantity` (pode ser positivo ou negativo conforme registado)
4. **Soma algébrica no armazém de destino (`mov.type === 'transferencia' && mov.destinationWarehouseId === warehouseId`)**:
   - `+ mov.quantity` (entra no destino)

### 2.3. Classificação de Nível de Estoque (`ProductStockInfo.status`)
Com base em `StockConfig` (`minLimit` e `maxLimit` por produto e armazém):
- `currentStock === 0` $\rightarrow$ `'zerado'`
- `minLimit > 0 && currentStock < minLimit` $\rightarrow$ `'critico_baixo'`
- `maxLimit > 0 && currentStock > maxLimit` $\rightarrow$ `'excesso'`
- Caso contrário $\rightarrow$ `'normal'`

---

## 3. Auditoria de Movimentações de Estoque ("Remover do Histórico")

Em **Estoque → Movimentação** (`src/components/movements/MovementsView.tsx` e `StockContext.tsx`):

1. **Proibição de `DELETE` Físico**: Nenhuma linha de `movements` pode ser eliminada do array/base de dados.
2. **Remoção com Justificativa (`removeStockMovement`)**:
   - Na aba **Histórico**, cada linha possui na coluna **Ações** o botão com ícone de arquivo (`Remover do histórico`).
   - Ao clicar, abre um modal onde o campo **Motivo** é obrigatório.
   - Ao confirmar (`Confirmar remoção`), o registo recebe:
     - `removido: true` e `isRemoved: true`
     - `motivo_remocao: reason` e `removalReason: reason`
     - `removido_por: 'Administrador'` e `removedBy: 'Administrador'`
     - `data_remocao: <ISO timestamp>` e `removedAt: <ISO timestamp>`
3. **Efeitos Imediatos da Remoção**:
   - O registo desaparece da aba **Histórico** e passa a figurar na aba **Removidos** (vista só de leitura).
   - O saldo de estoque do produto no armazém é **recalculado imediatamente** (revertendo o efeito daquele movimento).
   - É gerada uma **notificação** no sistema de alertas para o Administrador contendo o produto, a quantidade e o motivo da remoção.
4. **Restauro (`restoreStockMovement`)**:
   - Na aba **Removidos**, cada linha possui o botão **Restaurar**, que repõe `removido: false` / `isRemoved: false`, devolve o registo à aba **Histórico** e recalcula o estoque.

---

## 4. Imutabilidade Financeira e Estornos

Em **Financeiro → Lançamentos** (`LancamentosView.tsx` e `StockContext.tsx`):

1. **Lançamentos Imutáveis**: Movimentos bancários (`BankMovement`) não podem ser editados nem eliminados.
2. **Estorno (`reverseBankMovement`)**:
   - Um lançamento ativo pode ser estornado mediante motivo obrigatório.
   - O sistema marca o lançamento original com `isReversed: true`, `reversalReason` e `reversedAt`.
   - Cria simultaneamente um **novo lançamento de sentido inverso** (`entrada` $\leftrightarrow$ `saida`) com o mesmo valor, vinculado por `reversalOfId`, ajustando automaticamente o saldo da conta bancária (`Bank.balance`).

---

## 5. Rastreabilidade Cruzada de Vendas (`#VND-XXXX`)

Quando uma venda é concluída (`completeSale` em `StockContext.tsx`) ou carregada do histórico:

1. **Três Registos Vinculados Obrigatórios**:
   - **Estoque (`Movement`)**: Um movimento de `type: 'saida'` por cada item vendido, com `saleId: sale.id` e `reference: sale.id`.
   - **Financeiro (`BankMovement`)**: Um lançamento de `type: 'entrada'` na conta bancária selecionada, com `saleId: sale.id` e `reference: sale.id`.
   - **Transporte (`Transport`)**: Sempre que `sale.requiresTransport === true`, existe obrigatoriamente um registo em `transports` com `saleId: sale.id`.
2. **Navegação Direta a partir do Recibo de Venda (`SaleReceiptModal.tsx`)**:
   - O rodapé do recibo apresenta a secção **"Registos gerados por esta venda:"**:
     - `→ Ver saída no Estoque (Movimentação)`: Fecha o modal, navega para **Estoque → Movimentação** e filtra pelo código `sale.id`.
     - `→ Ver entrada no Financeiro (Lançamentos)`: Fecha o modal, navega para **Financeiro → Lançamentos** e filtra pelo código `sale.id`.
     - `→ Ver entrega em Transporte` (se `requiresTransport: true`): Fecha o modal, navega para **Caixa → Transporte** e filtra pelo código `sale.id`.
   - Na tabela de **Caixa → Venda**, clicar no emblema `Sim` da coluna **Transporte** também navega diretamente para **Caixa → Transporte** filtrado por `sale.id`.

---

## 6. Regras do Simulador de Importação e Rentabilidade (Multimoeda)

Implementadas em `src/types/importSimulator.ts` e `src/components/analytics/ImportSimulatorView.tsx`:

1. **Separação Moeda de Origem vs. Moeda-Base**:
   - Cada grupo de custo mantém a sua moeda de origem (`purchaseCurrency` para mercadoria, `freightCurrency` para transporte internacional, `tax.currency` para taxas fixas) e é convertido para a `baseCurrency` (padrão `AOA / Kz`) usando a taxa configurada em `exchangeRates[currency]`.
2. **Proveniência dos Dados (`informado` vs. `estimativa` vs. `Não informado`)**:
   - Valores `null` nunca são tratados silenciosamente como custo zero confirmado; são exibidos como `"Não informado"`.
   - Se qualquer insumo ativo da simulação estiver marcado como `'estimativa'`, a simulação exibe o aviso de que contém estimativas.
3. **Peso Taxável (`ChargeableWeightRule`)**:
   - $\text{Peso Bruto Total (kg)} = \text{Peso Bruto Unitário} \times \text{Quantidade}$
   - $\text{Peso Volumétrico Unitário (kg)} = \frac{\text{Comprimento (cm)} \times \text{Largura (cm)} \times \text{Altura (cm)}}{\text{Divisor Volumétrico (padrão 5000)}}$
   - Se a regra for `'maior'`, utiliza $\max(\text{Peso Bruto Total}, \text{Peso Volumétrico Total})$.
4. **Custo Posto no Armazém (*Landed Cost*) vs. Investimento Total**:
   - $\text{Landed Cost Total} = \text{Mercadoria (Kz)} + \text{Frete Internacional (Kz)} + \text{Impostos e Taxas de Importação (Kz)}$
   - $\text{Custo Real por Unidade (Posto)} = \frac{\text{Landed Cost Total}}{\text{Quantidade}}$
   - $\text{Investimento Total do Lote} = \text{Landed Cost Total} + \text{Despesas Comerciais Fixas do Lote}$
5. **Cenários de Venda Parcial (Distinção Contabilística vs. Caixa)**:
   - Para uma venda parcial de $Q_{\text{vendida}}$ unidades (onde $Q_{\text{vendida}} \le Q_{\text{total}}$):
     - **Receita das Unidades Vendidas**: $Q_{\text{vendida}} \times \text{Preço de Venda Unitário}$
     - **Lucro das Unidades Vendidas** (competência): $\text{Receita das Unidades Vendidas} - (Q_{\text{vendida}} \times \text{Custo Completo Unitário das Unidades Vendidas})$
     - **Fluxo de Caixa no Momento** (caixa): $\text{Receita das Unidades Vendidas} - \text{Investimento Total do Lote Inteiro} - \text{Despesas Variáveis das Unidades Vendidas}$
     - **Valor do Stock Restante** (em armazém): $(Q_{\text{total}} - Q_{\text{vendida}}) \times \text{Custo Unitário Posto no Armazém}$
   - Esta distinção evita confundir o saldo de caixa antes de escoar o lote com o lucro económico de cada unidade vendida.
6. **Análise de Sensibilidade**:
   - A tabela de sensibilidade de frete utiliza sempre a **moeda original do frete** (`freightCurrency`, ex.: `USD/kg` ou `Kz/kg`) e converte cada escalão para a moeda-base (`Kz`).
