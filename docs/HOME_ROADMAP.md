# Pedido Home em seis blocos — 09/10/2026

O pedido inicial previa confirmação por bloco. Em 09/10/2026, o utilizador autorizou concluir tudo com “Faz todos os Blocos.” **Blocos 1–2 publicados; blocos 3–6 concluídos e validados.** Relatório item a item em [HOME_BLOCKS_3_6.md](HOME_BLOCKS_3_6.md). Não pedir nova confirmação entre os blocos restantes.

O bloco 1 mantém Compras/Despesas na taxonomia partilhada existente e Rendimentos separados. Categorias em uso são protegidas; mover reclassifica com histórico, preserva valores/saldos/IDs. Se houver dois limites no mesmo destino/mês/moeda, bloquear a operação inteira e explicar o conflito. Não combinar limites nem remover IDs automaticamente.

Os novos pedidos de editar/eliminar lançamentos pessoais, câmbio e metas com desconto padrão ligado prevalecem sobre preferências antigas **quando os blocos correspondentes forem implementados**. Regras Business não mudam. Antes de corrigir o problema da primeira despesa, reproduzir/relatar a causa (2.1); diagnóstico reproduzido no bloco 2: não existia edição individual em Orçamento e o lápis do limite não passava editId, duplicando o limite ao mudar categoria.

## Pedido integral

O Home é a edição de finanças pessoais do MyOffice (despesas e rendimentos). Já existem: Dashboard ("A tua vida, com mais clareza"), Contas da casa, Orçamento, e Definições com as secções Aparência, Categorias e subcategorias, Metas e carteiras, Rendimentos do Business, O teu espaço Home e Cópia de segurança.
Não refaças o que já existe. Altera só o que está descrito abaixo, mantendo o estilo visual atual (tema claro/escuro existente, botões escuros, ícones de linha, cabeçalho "HOME · MINHA CASA").
Regras que se mantêm em todo o Home:
- Saldos e totais são sempre calculados a partir dos registos; nunca se editam diretamente
- Botões de criação só com texto, sem "+"; ações em linha (editar, eliminar) só com ícone
- Modais de criação abrem sempre vazios, sem nada pré-selecionado; em edição abrem preenchidos
- Campo obrigatório em falta: mensagem vermelha junto ao campo, nunca um popup
- Formatação portuguesa: vírgula decimal ("2,50 USD"), datas DD/MM/AAAA
- Vocabulário: "Registar", "Guardar", "Eliminar", "Rendimentos" (nunca "Receitas")
- Neste módulo, despesas e rendimentos podem ser editados e eliminados (uso pessoal)
Implementa um bloco de cada vez (1 a 6) e confirma cada um antes de passar ao seguinte.
Substitui a página atual (formulário com listas suspensas e lista em texto corrido).
1.1 Barra de filtros no topo: uma barra horizontal arredondada, com os controlos separados por divisórias finas, igual em estilo à barra de filtros de Estoque → Movimentação do MyOffice Business. Conteúdo: filtro "Tipo" (Despesas, Rendimentos, Compras — os tipos que já existem), campo de pesquisa por nome, e o botão "Adicionar" à direita.
1.2 Lista de categorias principais por baixo, em formato de linhas (não cartões). Cada linha mostra: ícone, nome, e o número de subcategorias (ex: "4 subcategorias"). Ações à direita só com ícone: editar e eliminar. Clicar na linha entra na categoria.
1.3 Dentro de uma categoria: breadcrumb "Categorias › Nome", lista das subcategorias em linhas (ícone, nome, editar, eliminar). Aqui, "Adicionar" cria uma subcategoria dessa categoria. Na lista principal, "Adicionar" cria uma categoria principal.
1.4 Alternador de vista (controlo segmentado, uma cápsula com dois botões) no topo da lista: "Categorias" | "Todas as subcategorias". A segunda vista mostra todas as subcategorias numa lista única, com a categoria principal indicada em cada linha.
1.5 Criar e editar categoria: campo nome, e escolha de ícone numa biblioteca de ícones — grelha pesquisável, agrupada por temas (Casa, Alimentação, Transporte, Saúde, Educação, Lazer, Trabalho, Finanças, Tecnologia, Animais, Família, Outros), todos no mesmo estilo de linha. O ícone é opcional; sem escolha, usa um ícone neutro. A subcategoria herda o ícone da principal, mas pode ter o seu.
1.6 Eliminar: se a categoria ou subcategoria já tem despesas, rendimentos, orçamentos ou contas associadas, bloqueia com mensagem clara e oferece "Mover para outra categoria". Sem uso: pede confirmação. Nunca apagar histórico em silêncio.
1.7 Duplicados: ao criar uma categoria ou subcategoria com nome já existente no mesmo nível (ignorar maiúsculas e espaços extra), mostra aviso com "Ver existente" e "Continuar mesmo assim". Verifica a lista atual: "Internet" existe como categoria principal e também como subcategoria de "Serviços".
2.1 Diagnóstico primeiro: ao tentar editar a primeira despesa registada em Orçamento, a edição ficou bloqueada porque "faltava uma coisa". Reproduz o problema e diz-me a causa exata (campo em falta? validação? ação inexistente?) antes de corrigir.
2.2 Auditoria: percorre todas as entidades do Home — despesas, rendimentos, orçamentos (limites), contas da casa, metas, carteiras, categorias e subcategorias — e garante que cada uma tem editar (ícone de lápis) e eliminar (ícone de lixo) onde faz sentido. Lista o que faltava.
2.3 Comportamento ao editar: abre o mesmo formulário de criação, preenchido. "Guardar alterações" atualiza o registo existente (mesmo identificador, sem duplicar) e recalcula saldos, totais e orçamentos. "Cancelar" não altera nada. Mostra, discretamente, "editado em [data]" nos registos alterados.
3.1 Criar/editar conta: tipo (A pagar = despesa | A receber = rendimento, ex: salário), nome, categoria, valor, moeda, data do primeiro vencimento.
3.2 Repetição: Não repete (pagamento manual — já existe, mantém) | Semanal | Quinzenal | Mensal | Anual | Personalizada (a cada N dias, semanas ou meses).
3.3 Fim da repetição: Nunca (infinita) | Até uma data | Após N ocorrências. Início: data a partir da qual começa (ex: salário a partir de um mês).
3.4 Modo de contabilização (escolha por conta, com valor padrão em Definições):
- "Perguntar antes de contabilizar": no vencimento, aparece uma notificação com Aceitar e Ignorar; só ao aceitar é criado o lançamento
- "Contabilizar automaticamente": cria o lançamento no vencimento, sem perguntar
3.5 Notificações no Home (ainda não existem): sino no cabeçalho, junto a "Finanças pessoais · Kz / USD" e ao botão de tema, com indicador de não lidas. Lista as confirmações pendentes (ex: "Salário de outubro vence hoje — Aceitar / Ignorar"). Reutiliza o sistema de notificações do MyOffice, se for partilhado.
3.6 Segurança:
- Cada ocorrência é gerada uma única vez por período — nunca duplicar ao reabrir a aplicação ou recarregar a página
- Ocorrências por confirmar continuam visíveis até serem aceites ou ignoradas
- "Pausar" suspende a geração de novas ocorrências
- Editar uma conta recorrente aplica-se só às ocorrências futuras; as já contabilizadas não mudam
3.7 Renomeia "Registrar pagamento" para "Registar pagamento". O botão manual continua a existir em todas as contas.
Aplica-se a despesas, rendimentos, contas da casa e metas.
4.1 Campo Moeda: Kwanza (Kz) | Dólar (USD). Ao escolher USD, aparece o campo opcional "Câmbio utilizado (Kz por 1 USD)".
4.2 Com câmbio preenchido: guarda o valor original em USD e o câmbio usado; contabiliza também o valor convertido na carteira em Kz. O valor original nunca é substituído.
4.3 Sem câmbio: contabiliza só na carteira em USD; não mexe no saldo em Kz.
4.4 Mostra sempre o valor original e, se existir câmbio, a conversão como informação auxiliar (ex: "25,00 USD · ≈ 23.125,00 Kz a 925").
4.5 Se não existir carteira em USD, mostra mensagem junto ao campo e permite escolher ou criar uma.
5.1 Data opcional: uma meta pode existir sem data (um "sonho"). A data de prazo é opcional.
5.2 Carteira de origem: ao criar a meta, escolhe-se a carteira/conta de onde sai o dinheiro.
5.3 Ao registar uma contribuição na meta, desconta automaticamente da carteira escolhida, seguindo a lógica já existente de "Reservado para metas" no Dashboard.
5.4 Em Definições → Metas e carteiras, adiciona um interruptor "Descontar automaticamente ao registar para metas" (ligado por padrão). Desligado: o registo só atualiza o progresso da meta, sem mexer no saldo da carteira.
6.1 Remove o "+" dos botões "Adicionar conta" (Contas da casa) e "Definir limite" (Orçamento): só texto.
6.2 No Dashboard, "Receitas do mês" passa a "Rendimentos do mês", igual ao gráfico ao lado.
6.3 No modal "Definir orçamento": em criação, os campos abrem vazios (sem moeda, categoria nem mês pré-escolhidos); em edição, preenchidos.
Para cada bloco (1 a 6), indica item a item o que foi feito, nomeando-o, e o que não conseguiste fazer. Não confirmes de forma geral. Testa com dados de teste e diz o que testaste.
