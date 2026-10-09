# Home — a tua vida pessoal

Implementado em 8 de outubro de 2026. O nome **Home** foi escolhido pelo utilizador; **Business** mantém a gestão de empresas.

## Começar

1. Na parte inferior da barra lateral, escolhe **Home**. Na barra recolhida/telefone, o ícone de empresa abre Business; no Business, o ícone de casa abre Home. O modo escolhido é guardado; Business é o padrão para instalações existentes.
2. Em **Finanças**, adiciona as tuas contas pessoais com o saldo atual. A Carteira inicial começa em zero, sem dados fictícios. O saldo inicial é património já existente, não receita do mês.
3. Regista receitas e despesas, indicando conta, data e categoria. Cada conta tem moeda Kwanza (AOA) ou Dólar (USD), definida ao criar e preservada nos lançamentos. O seletor de moeda separa todos os totais; não há câmbio automático. Receitas/despesas futuras são planeadas nas contas ou agenda, não lançadas como realizadas.
4. Em **Orçamento**, define um limite por categoria e mês. As despesas efetivamente pagas atualizam o progresso.
5. Em **Contas da casa**, adiciona renda, energia, água ou mensalidades. As recorrências desta etapa são mensais. Seleciona o mês e regista o pagamento realizado na conta de origem. O dia 31 é ajustado ao último dia dos meses mais curtos.
6. Em **Metas e sonhos**, indica valor e prazo. Por padrão, o progresso é apenas planeado e não movimenta dinheiro. Em Definições → Metas e carteiras podes ativar reservas para novas metas. Reservar transfere dinheiro de uma carteira para a reserva da meta na mesma moeda. Ao atingir o alvo, **Marcar como adquirido** cria uma despesa da reserva, sem descontar novamente da carteira original. Em modo planeado, apenas marca a aquisição. Retirar reserva permite devolver o dinheiro; estornar a despesa de aquisição reabre a meta.
7. Em **Agenda**, regista compromissos e tarefas da casa; marca-os como concluídos ou volta a abri-los. Datas ultrapassadas ficam identificadas.
8. Consulta o **Dashboard**: saldo disponível, receitas/despesas do mês, valores reservados, distribuição das despesas, contas pendentes, metas e tarefas.

## Correções e operações

- Finanças mantém o histórico. Para desfazer um lançamento, usa **Estornar**, com motivo obrigatório; original e compensação permanecem registados.
- Não é possível estornar duas vezes, criar uma transferência para a mesma conta, gastar/reservar mais do que o saldo, ou estornar uma receita já utilizada se isso deixar uma conta negativa.
- Cada conta recorrente só pode ser paga uma vez por mês. Estornar o pagamento reabre essa referência mensal, permitindo corrigir o valor.
- Editar uma conta recorrente altera os próximos dados de planeamento, preservando os pagamentos antigos. Pausar suspende a cobrança na lista de pendentes; retomar volta a mostrá-la.
- Reservas das metas ficam fora das despesas e dos limites por categoria. O saldo disponível exclui as reservas; o total de património inclui ambos.
- Definir de novo um limite para a mesma categoria/mês/moeda atualiza o orçamento existente.
- Metas, contas recorrentes e tarefas podem ser editadas. Lançamentos realizados usam estorno em vez de eliminação.

## Guardar e recuperar

O Home guarda um documento JSON de versão 1 na chave **`myoffice-home-v1`**. A preferência de modo fica em **`myoffice-mode`**. Essas chaves usam hífen deliberadamente: a reposição Business, que trata chaves `myoffice_*`, não apaga os dados pessoais. As transferências Business → Home gravam uma saída empresarial e uma receita pessoal vinculadas, na mesma moeda. O saldo é transferido, não partilhado.

Os dados ficam no navegador, sem login, servidor, ligação bancária, base de dados remota ou sincronização automática entre dispositivos. Limpar o navegador pode apagá-los; o GitHub e o catálogo de commits guardam código, não estes dados.

Em **Home → Definições**, cada linha com ícone, descrição e seta abre uma página própria. Usa **Voltar às Definições** para escolher outra:

- Define o nome da casa, as categorias/subcategorias e a aparência Claro/Anoitecer/Sistema.
- **Exportar Home** descarrega uma cópia JSON dos dados pessoais.
- **Importar cópia** valida o ficheiro antes de permitir a restauração. Digita **RESTAURAR** para substituir os dados atuais. O sistema descarrega uma cópia dos dados atuais antes de restaurar. Os dados Business não são importados nem substituídos. Se houver transferências vinculadas, a cópia deve manter os vínculos, valores, moedas e estado de estorno compatíveis com o histórico Business deste navegador; uma cópia antiga sem esses vínculos é recusada.

A cópia pode conter informação pessoal: não a envies para um repositório público. Limite de importação: 10 MB; formato deve ter versão compatível, identificadores únicos, referências válidas e saldos coerentes. Importação não é uma migração SQL automática.

Falhas ao guardar são mostradas; o estado só é atualizado após a escrita bem-sucedida. Dados corrompidos não são substituídos silenciosamente. Se outra aba alterar o mesmo documento, a aba antiga recusa sobrescrevê-lo e pede para recarregar. O isolamento é de organização/localStorage, não autorização de segurança.

## Estrutura técnica

- `src/types/home.ts`: modo, secções e entidades pessoais.
- `src/context/HomeContext.tsx`: documento pessoal e persistência atómica local.
- `src/utils/home.ts`: validação, valores em centavos, saldos, transferências, estornos e referências mensais.
- `src/components/home/ModeSwitcher.tsx`: seletor no rodapé da barra lateral.
- `HomeHeader.tsx`: cabeçalho sem pesquisas/notificações empresariais; tema continua no cabeçalho.
- `HomeView.tsx`: oito áreas e formulários, com diálogo acessível e navegação por teclado.
- `App.tsx` e `Sidebar.tsx`: alternância entre menus; navegação Business e IDs existentes preservados. A barra começa recolhida em ecrãs pequenos.

A estrutura PostgreSQL offline continua em `database/`. Futuro mapeamento: contas pessoais para contas de workspace `personal`, lançamentos/estornos para o ledger, limites para `personal_budgets`, mensalidades para `recurring_bills`, metas/reservas para `personal_goals` e contribuições/movimentos, tarefas para a agenda do workspace pessoal; categorias/subcategorias e compras pessoais para as tabelas da migração offline 002. Categorias locais hoje são nomes; a migração deverá atribuir IDs. Saldos iniciais precisarão de lançamento de abertura rastreável. Esse mapeamento não ativa conexão e deverá ser validado na fase de backend.

## Verificação

```sh
npm test
npm run lint
npm run build
```

Regressão de navegador (Playwright fornecido à parte, sem acrescentar dependência à aplicação):

```sh
HOME_TEST_URL=http://127.0.0.1:4191/ PLAYWRIGHT_MODULE=/caminho/playwright/index.mjs CHROMIUM_PATH=/caminho/chromium node tests/home-browser-regression.mjs
```

O teste usa dados fictícios num contexto isolado: receitas/despesas, orçamento, mensalidade, reserva, tarefa, alternância, exportação/importação, persistência, telefone, tema escuro, falta de espaço, conflito entre abas e preservação de dados corrompidos. `tests/home.test.ts` verifica invariantes financeiras e validação de cópias.

## Categorias e compras

A oitava área, **Compras**, organiza itens e regista os pagamentos no ledger pessoal. Instruções completas em [CATEGORIES.md](CATEGORIES.md). Campos `categories`, `subcategories` e `shopping` são normalizados na leitura de cópias antigas de versão 1; a chave permanece `myoffice-home-v1`.

## Rendimentos do Business e controlo mensal

Em Finanças, escolhe uma conta Business ativa, uma carteira Home da mesma moeda, valor, data até hoje e descrição. Contas empresariais gerais também são aceites; contas associadas a empresas paradas/desativadas são bloqueadas. Saldo insuficiente impede a transferência. A entrada pessoal usa **Rendimentos do Business**. Para corrigir, estorna em **Home → Finanças**: os dois históricos recebem compensações. O Business bloqueia o estorno isolado desta saída.

Definições → Rendimentos do Business permite ocultar o formulário sem apagar transferências anteriores. Não há rendimento automático periódico nesta etapa.

Categorias de **Despesas** e **Rendimentos** têm listas e subcategorias próprias. Alimentação, Internet, Saúde, Transporte e os restantes nomes pedidos são categorias principais. **ATT** não é categoria. O dashboard mostra gráficos diários separados de receitas/despesas e um gráfico de pizza por categoria no mês/moeda escolhidos. Orçamento mostra todos os gastos efetivos por categoria, mesmo sem limite definido. Saldo inicial e reservas não contam como rendimento/despesa mensal.

O documento Home e o ledger Business são coordenados por `homeBusinessStorage.ts`, com diário de recuperação `myoffice-home-business-transaction`. Falha ao escrever desfaz ambas as alterações; interrupção é recuperada ao abrir a aplicação. Abas desatualizadas recusam sobrescrita. Esta coordenação local não substitui transações/autorização de um backend.

A migração offline **003_home_goal_funding.sql** prepara modo/progresso planeado e aquisição das metas. Os vínculos Home/Business usam `transfer_group_id` e metadados no futuro ledger; a futura API deve criar/estornar ambas as pernas numa transação e verificar permissões nos dois espaços. Não há conexão de base de dados ativa.

Testes adicionais: `tests/home-finance.test.ts`, `tests/home-finance-browser.mjs` e `tests/home-finance-database-regression.mjs` cobrem moedas, aquisição, dupla gravação/recuperação, transferência/estorno, gráficos e rolagem fixa. Usam dados isolados de teste.

## Gestão de categorias — bloco 1 (09/10/2026)

A página de categorias foi substituída por filtros e linhas navegáveis, pesquisa, vistas Categorias/Todas as subcategorias e modais com biblioteca de ícones. Editar/eliminar/mover têm proteções de uso e histórico. Consulte CATEGORIES.md. Os restantes pedidos em seis blocos estão registados em HOME_ROADMAP.md; ainda não foram aplicados nesta etapa.

## Bloco 2 — edição e eliminação pessoal (09/10/2026)

Despesas em Orçamento agora aparecem individualmente, com lápis/lixo; também nas Finanças, junto aos rendimentos. Editar abre o formulário preenchido; Guardar alterações mantém o ID e recalcula todos os derivados. Cancelar não grava. Os campos em falta recebem erro vermelho junto ao campo, sem popup nativo. Carteiras, limites, contas da casa, metas e tarefas têm edição/eliminação onde aplicável. Categorias/subcategorias mantêm as ações do bloco 1. Carteiras preservam moeda e saldo de abertura; o saldo atual é calculado. Metas adquiridas permitem editar descrição/prazo/categoria, mantendo campos financeiros de aquisição; o valor pago pode ser corrigido no lançamento da aquisição se existir saldo na reserva.

Editar conserva o valor anterior em edits e mostra editado em DD/MM/AAAA. Eliminar pede confirmação e grava deletedAt, retirando a entidade das listas/cálculos aplicáveis sem apagar o histórico/backups. Não há botão de restauro nesta etapa; uma cópia validada preserva estes metadados. Limites eliminados podem ser recriados sem colisão com o ID antigo; mudar categoria na edição atualiza o limite original e recusa conflito com outro limite.

Eliminar despesa/rendimento recalcula saldos; saldo negativo é recusado. Carteira com saldo ou movimentos ativos não pode ser eliminada; meta com reserva exige retirar primeiro. Eliminar conta recorrente mantém pagamentos passados e suspende os pendentes. Eliminar aquisição de meta devolve dinheiro à reserva e reabre o progresso. Compras mantêm quantidade/preço planeados em paymentSnapshot; correção do lançamento guarda paymentAmount efetivamente pago, preservando o ID e mostrando divergência face ao planeado. A classificação da compra acompanha o pagamento editado.

Business continua imutável: em rendimento transferido, descrição/categoria pessoais podem mudar com o mesmo ID; valor/data/conta só por estorno conjunto e nova transferência. Eliminar esse rendimento compensa ambos os históricos na operação coordenada existente. Transferências/reservas e estornos continuam corrigidos por estorno, não pelo CRUD de despesas/rendimentos.

### Diagnóstico 2.1

Com Carteira 1000 Kz, primeira despesa de Alimentação 10 Kz e limite de 100 Kz: Orçamento não mostrava despesa individual nem ação para editar; o lápis editava o limite. Mudar o limite para Saúde criava um segundo registo porque a ação não passava editId. Foram corrigidos ambos. Não foi reproduzida uma mensagem de campo em falta. Diagnóstico anterior à correção em dados isolados, sem modificar dados do utilizador.

### Auditoria 2.2

| Entidade | O que faltava | Estado |
| --- | --- | --- |
| Despesas/rendimentos | Editar e eliminar; despesas individuais em Orçamento | Acrescentados |
| Limites | Eliminar e editId/currency na edição | Corrigidos |
| Contas da casa | Eliminar; moeda explícita ao abrir edição | Acrescentados |
| Metas | Eliminar; preservar metadados ao editar; editar descrição após aquisição | Corrigidos |
| Carteiras | Editar e eliminar | Acrescentados com proteções de saldo/referências |
| Categorias/subcategorias | Já tinham editar/eliminar no bloco 1 | Mantidos |
| Tarefas | Eliminar e indicação de edição | Acrescentados |

Blocos 3–6 ainda não implementados. Os formulários de criação e alterações de repetição/câmbio/default de metas continuam a ser tratados nas etapas seguintes; esta entrega não declara essas etapas concluídas.
