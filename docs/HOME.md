# Home — a tua vida pessoal

Implementado em 8 de outubro de 2026. O nome **Home** foi escolhido pelo utilizador; **Business** mantém a gestão de empresas.

## Começar

1. Na parte inferior da barra lateral, escolhe **Home**. Na barra recolhida/telefone, usa o seletor compacto. O modo escolhido é guardado; Business é o padrão para instalações existentes.
2. Em **Finanças**, adiciona as tuas contas pessoais com o saldo atual. A Carteira inicial começa em zero, sem dados fictícios. O saldo inicial é património já existente, não receita do mês.
3. Regista receitas e despesas, indicando conta, data e categoria. Os valores são em Kwanza; receitas/despesas futuras são planeadas nas contas ou agenda, não lançadas como realizadas.
4. Em **Orçamento**, define um limite por categoria e mês. As despesas efetivamente pagas atualizam o progresso.
5. Em **Contas da casa**, adiciona renda, energia, água ou mensalidades. As recorrências desta etapa são mensais. Seleciona o mês e regista o pagamento realizado na conta de origem. O dia 31 é ajustado ao último dia dos meses mais curtos.
6. Em **Metas e sonhos**, indica valor e prazo. Reservar transfere dinheiro de uma conta pessoal para uma conta de reserva da meta; não cria dinheiro nem uma despesa. Retirar reserva permite transferi-lo de volta.
7. Em **Agenda**, regista compromissos e tarefas da casa; marca-os como concluídos ou volta a abri-los. Datas ultrapassadas ficam identificadas.
8. Consulta o **Dashboard**: saldo disponível, receitas/despesas do mês, valores reservados, distribuição das despesas, contas pendentes, metas e tarefas.

## Correções e operações

- Finanças mantém o histórico. Para desfazer um lançamento, usa **Estornar**, com motivo obrigatório; original e compensação permanecem registados.
- Não é possível estornar duas vezes, criar uma transferência para a mesma conta, gastar/reservar mais do que o saldo, ou estornar uma receita já utilizada se isso deixar uma conta negativa.
- Cada conta recorrente só pode ser paga uma vez por mês. Estornar o pagamento reabre essa referência mensal, permitindo corrigir o valor.
- Editar uma conta recorrente altera os próximos dados de planeamento, preservando os pagamentos antigos. Pausar suspende a cobrança na lista de pendentes; retomar volta a mostrá-la.
- Reservas das metas ficam fora das despesas e dos limites por categoria. O saldo disponível exclui as reservas; o total de património inclui ambos.
- Definir de novo um limite para a mesma categoria/mês atualiza o orçamento existente.
- Metas, contas recorrentes e tarefas podem ser editadas. Lançamentos realizados usam estorno em vez de eliminação.

## Guardar e recuperar

O Home guarda um documento JSON de versão 1 na chave **`myoffice-home-v1`**. A preferência de modo fica em **`myoffice-mode`**. Essas chaves usam hífen deliberadamente: a reposição Business, que trata chaves `myoffice_*`, não apaga os dados pessoais. Não existe transferência entre Home e Business nesta etapa.

Os dados ficam no navegador, sem login, servidor, ligação bancária, base de dados remota ou sincronização automática entre dispositivos. Limpar o navegador pode apagá-los; o GitHub e o catálogo de commits guardam código, não estes dados.

Em **Home → Definições**:

- Define o nome da casa, as categorias/subcategorias e a aparência Claro/Anoitecer/Sistema.
- **Exportar Home** descarrega uma cópia JSON dos dados pessoais.
- **Importar cópia** valida o ficheiro antes de permitir a restauração. Digita **RESTAURAR** para substituir os dados atuais. O sistema descarrega uma cópia dos dados atuais antes de restaurar. Os dados Business não são importados nem substituídos.

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
