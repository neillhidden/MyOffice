# MyOffice Home — guia de utilização

Estado corrente em 09/10/2026. Home organiza finanças e vida pessoal; Business mantém empresas e operações profissionais. A alternância fica no rodapé da barra lateral. No modo recolhido, o ícone representa o destino: empresa abre Business e casa abre Home.

## Onde os dados ficam

Nesta fase, **os dados ficam neste navegador**, na chave local `myoffice-home-v1`. Não há servidor, login, ligação bancária ou sincronização entre telefone e computador. O site no GitHub Pages e os commits guardam o programa, não os teus dados pessoais. Limpar o armazenamento do navegador pode apagá-los.

Exporta regularmente em **Definições → Dados e cópia de segurança → Exportar Home**. O JSON inclui carteiras, movimentos, revisões, tarefas, planos, extratos e comprovativos. Não o publiques num repositório. Importar valida a estrutura e pede RESTAURAR antes de substituir; descarrega primeiro a cópia atual. Limite 10 MB. Uma cópia que contradiga transferências Business existentes é recusada; Home e Business devem conservar vínculos compatíveis.

A escrita local acontece antes de atualizar a interface. Falha de espaço/permissão é apresentada sem aplicar alteração parcial. Dados corrompidos são preservados. Uma segunda aba desatualizada recusa sobrescrever alterações; recarrega para continuar.

A base futura está preparada em PostgreSQL, com espaços pessoais/empresariais e revisões. Ficheiros terão armazenamento privado separado e metadados na base. **Nada disso está ligado ao site**; fornecedor, autenticação, políticas de acesso e migração são a etapa posterior. Esquema offline e testes: [database/README.md](../database/README.md).

## Começar pelas finanças

1. Abre **Home → Finanças** e cria carteiras com moeda AOA ou USD e saldo inicial. A Carteira inicial começa em zero. Saldo inicial representa dinheiro já existente, não rendimento do mês.
2. Regista rendimentos e despesas realizados, com data, categoria e carteira. Datas futuras pertencem ao Planeamento. AOA e USD têm totais separados.
3. Para uma compra em USD, escolhe carteira USD sem taxa, ou informa explicitamente a taxa para contabilizar em AOA. O valor original fica guardado. O sistema não consulta cotações nem converte sozinho.
4. Transferências pessoais conservam património e não entram no consumo. Business → Home cria saída empresarial e rendimento numa carteira pessoal separada; o saldo não é partilhado. Usa o fluxo conjunto para estornar.
5. Corrige despesas/rendimentos pelo lápis, mantendo ID e versão anterior. Eliminar é lógico; o registo permanece no Histórico. Estornar conserva o original e a compensação. Saldo negativo, duplo estorno ou quebra de referências são recusados.

## As áreas do Home

| Área | O que podes fazer |
|---|---|
| Dashboard | Consultar saldo disponível/reservado, gráficos de rendimento/despesa, categorias, contas, metas, tarefas e linhas do extrato por conferir. |
| Finanças | Criar carteiras AOA/USD, registar movimentos, transferir, editar, eliminar logicamente e estornar. |
| Orçamento | Comparar despesas realizadas com limites por categoria/mês/moeda; reservas e amortizações não duplicam consumo. |
| Contas da casa | Programar despesas ou rendimentos pontuais/semanais/quinzenais/mensais/anuais/personalizados, com fim por data/quantidade. |
| Metas e sonhos | Planear objetivos com ou sem prazo, indicar origem, reservar dinheiro, retirar reserva e adquirir sem duplo débito. |
| Agenda | Calendário mensal/semanal com tarefas, contas, prazos de metas, prestações e garantias. |
| Compras | Categorias/subcategorias, quantidade/preço e pagamento vinculado à carteira. |
| Histórico | Ver alterações/eliminados e recuperar uma versão com validação de saldo/referências. |
| Dívidas pessoais | Obrigações a pagar/receber, prestações, pagamentos parciais e estornos. |
| Planeamento | Simular saldo futuro com contas pendentes, planos e prestações. |
| Relatórios | Consultar mês/ano/intervalo, comparar períodos e exportar CSV/PDF. |
| Extratos | Importar CSV para revisão, conferir movimentos existentes ou criar movimentos confirmados. |
| Documentos | Guardar comprovativos/faturas/garantias e associar a movimentos, compras, dívidas ou metas. |
| Definições | Nome da casa, categorias/subcategorias, aparência, preferências de metas/recorrências/Business e cópias. |

## Contas, metas e categorias

Em Contas da casa, **Perguntar** cria pendências no sino para aceitar ou ignorar; **Automático** contabiliza quando o navegador abre e há saldo/carteira válidos. Não executa com o site fechado. Pendências preservam os valores da ocorrência; editar a conta altera o futuro. Aceites/ignoradas não são geradas de novo. Contas pausadas não cobram datas da pausa. Para datas como dia 31, usa o último dia dos meses mais curtos.

Nas instalações novas, a preferência de reserva está **ativada**, conforme o pedido posterior dos blocos 3–6. Preferências explicitamente guardadas antes são preservadas. Consulta **Definições → Metas e carteiras** para desligar se quiseres apenas progresso planeado. Reservar transfere da carteira de origem para a reserva da meta; adquirir desconta da reserva uma vez. Planeamento não cria saldo e aquisição planeada não movimenta dinheiro. Estorno da compra reservada reabre a meta. Reservas ficam fora das despesas/orçamento, mas dentro do património total.

Categorias de despesa e rendimento são separadas. Alimentação, Internet, Transporte e outras são categorias; Games pode ter Jogos/Consoles. Renomear/alterar ícone conserva IDs/chaves. Uma categoria utilizada exige mover os registos antes de eliminar, preservando histórico. Planos também contam como utilização. Nas Definições, linhas com ícone/descrição/seta abrem páginas próprias; usa Voltar às Definições para escolher outra. Aparência: Claro, Anoitecer ou Sistema.

## Agenda e tarefas da casa

Adiciona uma tarefa com descrição, data e categoria. Em **Detalhes**, escolhe hora, prioridade, responsável e repetição semanal/quinzenal/mensal/anual ou personalizada (dias/semanas/meses), com fim opcional por data ou número de ocorrências. Todos os campos opcionais começam vazios.

O calendário abre no período atual; Hoje volta à data atual, setas mudam mês/semana. Cada ocorrência tem conclusão independente: concluir a tarefa desta semana não conclui a próxima. As tarefas ficam na lista para editar/eliminar; o painel Organização das tarefas dá acesso aos detalhes mesmo fora do mês visível. Contas/metas/prestações/garantias levam à área correspondente. No telefone, a grelha tem rolagem horizontal interna.

## Histórico e recuperação

Escolhe o tipo de registo e pesquisa. Abre uma versão para ver os valores anteriores; **Recuperar esta versão** aplica-a com o mesmo ID e acrescenta uma revisão. **Recuperar eliminado** reativa o registo, se as referências e os saldos permitirem.

Não recupera estornos nem altera isoladamente transferências Business. Se a recuperação de uma despesa ultrapassar o saldo disponível, é recusada. Recupera primeiro a carteira associada, quando necessário. Contas da casa recuperadas ficam inativas para evitar cobranças retroativas; reativa-as conscientemente. A recuperação de documentos conserva o ficheiro original. Histórico de código/commits continua separado deste histórico de dados.

## Dívidas e prestações

**Nova dívida pessoal** declara uma obrigação já existente, a pagar ou receber. Criar não acrescenta nem retira dinheiro da carteira. Indica total, moeda, pessoa/entidade e data; para várias prestações, a primeira data é obrigatória. Os centavos são repartidos exatamente e as datas mensais mantêm a âncora original.

**Pagar/Receber** pede valor, data e carteira da mesma moeda. Não pode exceder o restante; pagamentos a sair precisam de saldo. Pagamentos cobrem as prestações por ordem. A amortização altera a carteira, mas não conta outra vez como consumo/rendimento. Regista a despesa original na sua categoria quando aplicável; amortizar apenas liquida a dívida.

Em Prestações e pagamentos, estorna com motivo para corrigir. O restante é recalculado. Dívidas com histórico de pagamentos não são eliminadas; tipo/moeda ficam protegidos, mesmo após estorno.

## Planeamento e relatórios

A previsão parte do **saldo disponível de hoje** e mostra a evolução até à data escolhida. Inclui contas pendentes, planos futuros e reservas planeadas; não escreve movimentos. Contas sem carteira são indicadas fora do cálculo. Para simular prestações, escolhe uma carteira: todas as dívidas dessa moeda são assumidas nessa carteira apenas na simulação. Sem escolha, o sistema informa quantas dívidas ficaram fora.

Não registes um plano manual que repita uma conta ou prestação já incluída. A reserva planeada não transfere dinheiro; usa Metas para a transferência real. Contas vencidas ainda pendentes aparecem no início da previsão como em atraso. Valores negativos previstos sinalizam insuficiência futura, sem permitir saldo real negativo.

Relatórios filtram moeda/carteira e mês/ano/intervalo. Comparam rendimentos/despesas/resultado com o período anterior e mostram evolução mensal e despesas por categoria. Amortizações aparecem separadas. CSV/PDF são descarregados diretamente. CSV utiliza ponto e vírgula e protege textos que poderiam executar fórmulas numa folha de cálculo.

## Conferir extratos CSV

1. Escolhe a carteira e seleciona um CSV até 2 MB, com 1 a 1000 linhas.
2. Colunas: **Data;Descrição;Valor;Referência** (Referência opcional). Data AAAA-MM-DD ou DD/MM/AAAA; saídas negativas e entradas positivas. Valores como `-1.234,50` são aceites. Datas futuras/valores zero ou inválidos são recusados.
3. Revê a pré-visualização. Reimportação exata identifica linhas repetidas; linhas iguais legítimas conservam ordinal para não desaparecerem.
4. **Importar para conferência** guarda apenas linhas do extrato, sem mexer no saldo.
5. **Conferir** associa a um lançamento existente com mesma data/carteira/valor. **Criar lançamento** exige escolher categoria e confirmação, alterando o saldo. Quando há correspondência disponível, confere-a antes de criar outro.
6. **Ignorar** conserva a linha sem efeito financeiro. **Voltar a pendente** desfaz a conferência, mantendo o lançamento.

Editar, eliminar ou estornar um lançamento conferido devolve a linha a pendente. Cada lançamento só pode ser conferido uma vez por carteira; transferências também podem ser conferidas no destino. O saldo final do banco é uma comparação opcional com o saldo atual do Home, não uma reconstrução histórica nem uma ligação ao banco.

## Comprovativos e garantias

Aceita **PDF, PNG e JPEG**, até **1 MiB por ficheiro** e **2 MiB no total**, com verificação de assinatura/formato. Indica título, tipo e opcionalmente validade/associação. O ficheiro fica base64 no JSON local e vai junto na cópia de segurança; o espaço disponível real também depende do navegador e das restantes informações.

Podes pesquisar, descarregar, editar metadados e eliminar logicamente. Eliminar conserva o ficheiro no Histórico, para recuperação, e continua a ocupar espaço. Snapshots não duplicam os binários. Garantias com validade aparecem no calendário. Esta fase tem estes limites locais; ficheiros futuros terão armazenamento privado separado quando o backend for implementado.

## Para desenvolvimento

Modelos: `src/types/home.ts`. Persistência: `HomeContext.tsx`. Regras: `home.ts`, `homeEditing.ts`, `homeExtensions.ts`, `homeRecurrence.ts`, `homeCategories.ts`. Calendário/previsões/CSV/PDF: `homeAnalysis.ts`. Interfaces: `HomeView.tsx`, `HomeTools.tsx`, `HomeModal.tsx`.

Validação: `npm test`, `npm run lint`, `npm run build`. Testes funcionais e SQL offline constam de DEVELOPMENT.md. Regras Business permanecem; esta versão local não declara conformidade fiscal nem segurança de um backend inexistente. Documentos HOME_BLOCKS_3_6.md/HOME_ROADMAP.md conservam os pedidos históricos; este guia descreve o comportamento corrente.
