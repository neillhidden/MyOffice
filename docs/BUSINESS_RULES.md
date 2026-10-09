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

3. **Histórico completo**: Original e compensação participam do saldo; `isReversed` não exclui o original. Não existe restauro/apagamento de estornos; uma nova operação exige novo lançamento justificado.
4. **Uma compensação por original**: Estornos repetidos, incluindo cliques antes da renderização seguinte, são rejeitados. Lançamentos de estorno não podem ser estornados novamente.
5. **Vendas e dívidas**: Uma entrada de venda ativa só pode ser estornada pelo cancelamento da venda, preservando os vínculos com estoque/entrega. Estornar um pagamento mantém o pagamento no histórico e reabre o saldo devedor.
6. **Compatibilidade local**: Remoções financeiras antigas (`isRemoved`) são convertidas ao carregar em original + estorno, preservando o saldo anterior. A conversão é idempotente. Valores/datas/motivos originais não são reescritos para corrigir lançamentos.

---

## 5. Rastreabilidade Cruzada de Vendas (`#VND-XXXX`), Bancos, Estornos e Dívidas

Quando uma venda é concluída (`completeSale` em `StockContext.tsx`) ou carregada do histórico:

1. **Três Registos Vinculados Obrigatórios**:
   - **Estoque (`Movement`)**: Um movimento de `type: 'saida'` por cada item vendido, com `saleId: sale.id` e `reference: "Venda #VND-XXXX"`.
   - **Financeiro (`BankMovement`)**: Um lançamento de `type: 'entrada'` na conta bancária selecionada, com `saleId: sale.id` e `reference: "Venda #VND-XXXX"`.
   - **Transporte (`Transport`)**: Sempre que `sale.requiresTransport === true`, existe obrigatoriamente um registo em `transports` com `saleId: sale.id`.
2. **Venda com Entrega inclui o Custo de Transporte**:
   - Quando `requiresTransport === true`, tanto o **total da venda** (`sale.total = subtotalProdutos + transportCost`) quanto a **receita financeira gerada** (`BankMovement.amount`) incluem obrigatoriamente o custo do transporte (`transportCost`), e não apenas o valor dos produtos.
3. **Venda guarda o Banco Original (`sale.bankId`) e Valida a Conta**:
   - Ao escolher a conta/banco numa venda (`NewSaleModal.tsx` e `completeSale`), o sistema valida obrigatoriamente que a conta está **ativa**, pertence à **mesma Empresa** do armazém de saída e está na **mesma moeda** da venda (impedindo o uso ambíguo de conta de outra empresa).
   - O ID da conta bancária creditada fica guardado em `sale.bankId`.
   - Num **Estorno futuro (`cancelSale`)**, o lançamento financeiro de saída reverte **sempre na conta original** (`sale.bankId`) que recebeu o dinheiro no momento da venda, mesmo que a Conta Principal da Empresa tenha mudado depois.
4. **Estorno / Cancelamento de Venda (`cancelSale`) sem Devolução Dupla**:
   - Ao estornar uma venda, o sistema:
     - Cancela automaticamente as entregas de **Transporte** associadas que ainda não estejam concluídas (`status !== 'entregue' && status !== 'cancelado'` $\rightarrow$ `'cancelado'`).
     - Repõe em estoque (`type: 'entrada'`) **apenas as saídas de estoque dessa venda que ainda estão ativas** (`!m.removido && !m.isRemoved`). Se uma saída de estoque da venda já tinha sido "Removida do histórico" por outro motivo, não é reposta novamente (evitando duplicar a reposição).
5. **Carrinho da Venda Acumula Itens Repetidos**:
   - Se o mesmo produto/variação (`productId` + `variationId`) for adicionado mais de uma vez à mesma venda, o sistema **soma a quantidade numa única linha** (validando o limite de estoque disponível no armazém para o total acumulado), em vez de criar linhas duplicadas.
6. **Dívidas — Rejeição de Pagamento Acima do Saldo Devedor**:
   - Ao registar um pagamento numa Dívida (`DebtPaymentModal.tsx` e `recordDebtPayment`), o sistema impede qualquer valor superior ao **saldo devedor atual** (`remainingAmount`), exibindo mensagem de erro clara, e valida que a conta bancária selecionada está ativa, pertence à mesma empresa e opera na mesma moeda da dívida.
7. **Navegação Direta a partir do Recibo de Venda (`SaleReceiptModal.tsx`)**:
   - O rodapé do recibo apresenta a secção **"Registos gerados por esta venda:"**:
     - `→ Ver saída no Estoque (Movimentação)`: Fecha o modal, navega para **Estoque → Movimentação** e filtra pelo código `sale.id`.
     - `→ Ver entrada no Financeiro (Lançamentos)`: Fecha o modal, navega para **Financeiro → Lançamentos** e filtra pelo código `sale.id`.
     - `→ Ver registo de Transporte` (se `requiresTransport: true`): Fecha o modal, navega para **Caixa → Transporte** e filtra pelo código `sale.id`.
   - Na tabela de **Caixa → Venda**, clicar no emblema `Sim` da coluna **Transporte** também navega diretamente para **Caixa → Transporte** filtrado por `sale.id`.

8. **Identificadores novos**: `VND-<UUID>` e `TRP-<UUID>` usam aleatoriedade criptográfica; não dependem dos últimos dígitos do relógio. Os demais registos criados pelo contexto seguem o mesmo padrão. IDs históricos são preservados.
9. **Validação central antes de gravar**: Armazém ativo, produto ativo existente, variação válida quando o produto tem variações, quantidade finita superior a zero, preço finito não negativo e subtotal/total finitos. Custos de entrega devem ser finitos e não negativos. Quantidades fracionárias continuam permitidas. Preço zero admite oferta; não admite quantidade zero. Itens repetidos com preços diferentes são rejeitados, sem alterar silenciosamente preços anteriores.
10. **Cancelamento justificado**: Motivo obrigatório; a compensação usa o lançamento bancário original. Se esse lançamento já foi compensado por migração antiga, não é compensado duas vezes. Venda sem lançamento/conta original exige reconciliação antes de cancelar, sem escolher arbitrariamente outra conta.

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


## 7. Proteção da Reposição de Dados

`resetHistory`, `resetAll` e `resetToDefaults` recusam operações quando existem movimentos de estoque, lançamentos bancários, vendas, transportes, pagamentos, dívidas, defeituosos ou listas de compras concluídas. O bloqueio está nas funções centrais e nos controlos da interface. Reposição só pode ocorrer sem histórico operacional/financeiro; não é um mecanismo para apagar registos auditáveis. A limpeza autorizada de uma instalação vazia afeta apenas chaves `myoffice_*`.

Esta proteção é de integridade do front-end. Sem backend/autenticação, não representa proteção contra manipulação direta do armazenamento do navegador.

## Home pessoal

Regras Business acima preservadas. Home tem ledger próprio, não chama funções financeiras empresariais. Transferências/reservas conservam património e não são despesas. Legado mensal tem um pagamento por mês; programação nova tem ocorrência única por conta/data, sem regenerar ocorrências aceites/ignoradas após correção. Estornos mantêm original e motivo; saldos negativos/estornos repetidos são recusados. Importações são validadas antes da escrita. Ver HOME.md para a distinção entre saldo inicial, receita do mês e reserva.

## Compras pessoais e classificação (2026-10-08)

Itens de compras são planeamento; não alteram saldos ao serem criados ou arquivados. Pagamento cria despesa e vínculo numa gravação atómica, exige saldo suficiente e data até hoje e não aceita repetição. Estorno preserva o lançamento original e permite repagar; itens com histórico de pagamento não podem mudar quantidade/preço/classificação. Orçamento agrega a categoria principal. Categorias/subcategorias não apagam nem reclassificam automaticamente o histórico. Taxonomia inicial contém apenas nomes, nunca produtos ou transações fictícias.

## Finanças Home e transferência empresarial (2026-10-08)

Contas Home AOA/USD; moeda imutável nos lançamentos e totais separados. Transferências, pagamentos e reservas exigem mesma moeda. Nas instalações novas, reserva está ativada desde os blocos 3–6; preferências antigas explícitas são preservadas e a reserva pode ser desligada nas Definições. Aquisição reservada debita a reserva, nunca duas vezes a carteira de origem. Aquisição planeada não movimenta dinheiro. Estorno reabre aquisição e mantém histórico.

Business → Home grava saída/receita vinculadas, com moeda/conta/valor/data compatíveis. Exige conta ativa, empresa associada ativa (conta geral permitida) e saldo suficiente. Estorno das duas pernas apenas no Home; estorno empresarial isolado bloqueado. Recuperação local protege gravação interrompida e importação Home não pode quebrar vínculos existentes. Consulte HOME.md para fluxos e limites.

## Categorias pessoais — bloco 1 (09/10/2026)

Renomear não altera IDs/chaves financeiras. Categorias/subcategorias em uso (incluindo lançamentos estornados) não podem desaparecer sem reclassificação explícita, mantendo dados e classificação anterior. Destino do mesmo tipo; pagamento/item reclassificados em conjunto. Conflito de limites bloqueia toda a operação, sem somar/apagar orçamentos. Duplicados confirmados têm identidade própria. Os pedidos posteriores de editar/eliminar lançamentos pessoais ainda aguardam bloco 2; regras do Business mantêm-se.

## Home — autorização de CRUD pessoal (09/10/2026)

Por pedido explícito do utilizador, despesas/rendimentos Home admitem edição com mesmo ID e eliminação lógica. Edições preservam snapshot/data; eliminação mantém registo com deletedAt. Saldos derivam apenas de originais ativos, sem deletedAt/estorno. Preservar referências e recusar saldo negativo. Pagamento pessoal editado reclassifica compra e guarda valor efetivo sem reescrever quantidade/preço planeados. Aquisição editada ajusta valor da meta vinculada sem duplicar débito. Regras de histórico Business não mudam; transferência empresarial só altera descrição/categoria no Home e é eliminada por compensação conjunta. Ver HOME.md.

### Home — blocos 3–6

Ocorrências aceites/ignoradas nunca são regeneradas, incluindo após eliminação/estorno. Contabilização automática sem saldo fica pendente; não admite saldo negativo. Edições futuras conservam snapshots. USD sem taxa usa carteira USD; com taxa explícita usa AOA e guarda valor original. Reservas são transferências, aquisição debita reserva uma vez. Interruptor global afeta contribuições futuras; progresso planeado não cria saldo. Regras Business permanecem imutáveis e sem FX implícito. Ver HOME_BLOCKS_3_6.md.

### Home — calendário, recuperação e ferramentas pessoais

- Recuperação aplica o mesmo ID e guarda nova revisão, validando saldo/referências/unicidade. Não desfaz estornos nem transfere valores Business isoladamente; contas recuperadas ficam inativas para evitar cobranças retroativas.
- Criar uma dívida declara obrigação existente, sem movimento monetário. Amortizações parciais exigem carteira da mesma moeda/saldo suficiente e não excedem o restante. Prestações repartem centavos exatamente e mantêm âncora mensal; pagamentos cobrem por ordem. Estornos reabrem o restante. Dívida com histórico de pagamentos não é eliminada.
- Previsão usa saldo disponível atual, contas ainda pendentes e planos. Reservas planeadas não movimentam dinheiro. Carteira explicitamente escolhida recebe as dívidas da mesma moeda só na simulação; sem carteira ficam indicadas fora do cálculo. Não duplicar planos manuais com contas/prestações existentes.
- Relatórios separam AOA/USD e contas; consumo/rendimentos excluem transferências e amortizações. PDF/CSV listam movimentos efetivos. CSV protege fórmulas de folhas de cálculo.
- Extrato CSV exige revisão antes de guardar linhas e confirmação antes de criar lançamentos. Correspondência exige mesma carteira/data/valor e é única por carteira/lançamento. Fingerprint/ordinal bloqueia reimportação exata sem apagar linhas legítimas iguais. Editar/eliminar/estornar devolve conferência a pendente. Saldo de banco opcional compara com saldo atual, não reconstrói saldo histórico.
- Tarefa recorrente conclui por ocorrência; hora/prioridade/responsável não têm efeitos monetários. Documentos aceitam apenas PDF/PNG/JPEG com assinatura compatível. Cópia JSON inclui conteúdo; eliminação lógica preserva ficheiro e ocupa espaço.


## Importação Home: sinais e comprovativos

Saldo bancário não é receita/despesa. Débito é saída e crédito é entrada; sinal desconhecido exige confirmação. Valores revistos são absolutos e positivos, com sentido separado; moeda deve coincidir com a carteira, sem câmbio implícito. Ler/preparar/importar para conferência não movimenta dinheiro. Aplicar comprovativo valida carteira, categoria, saldo e documento antes de gravar tudo junto. Correspondência existente associa sem novo lançamento; lançamentos já conferidos também impedem débito duplicado. Referências bancárias são preservadas.
