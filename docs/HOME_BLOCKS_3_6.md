# Home — entrega dos blocos 3–6 (09/10/2026)

O utilizador autorizou concluir os blocos restantes em conjunto: “Faz todos os Blocos.” Blocos 1 e 2 já estavam publicados. O estilo e a separação Home/Business continuam preservados.

## Bloco 3 — contas e notificações

| Item | Implementação |
|---|---|
| 3.1 | Criar/editar contas a pagar (despesa) e a receber (rendimento), descrição, categoria do tipo certo, valor, moeda, carteira e primeiro vencimento. |
| 3.2 | Não repete/manual, semanal, quinzenal, mensal, anual ou personalizada a cada N dias/semanas/meses. |
| 3.3 | Fim nunca, por data ou número de ocorrências; primeiro vencimento ancora o início. Mensalidade conserva o dia original quando fevereiro tem menos dias. |
| 3.4 | Perguntar/automático por conta; padrão configurável em Definições → Metas e carteiras. Nenhum movimento é lançado ao criar uma confirmação. |
| 3.5 | Sino do Home no cabeçalho, junto ao tema, contador de confirmações pendentes e Aceitar/Ignorar. Contabilização sem saldo fica pendente com erro e possibilidade de nova tentativa. |
| 3.6 | ID de ocorrência é conta + data. Aceitar/Ignorar persiste e não se repete ao recarregar, mesmo após eliminar/estornar o lançamento. Pausar impede novas ocorrências; retomar não recupera os vencimentos pausados. Edição afeta apenas a geração futura, conservando snapshots pendentes e lançamentos já contabilizados. |
| 3.7 | “Registar pagamento” e “Registar recebimento”. A ação manual permanece nas contas; fica desativada quando a ocorrência foi tratada ou não há vencimento nesse período. Contas antigas sem programação conservam os pagamentos mensais manuais. |

**Limite da versão frontend:** não há processo no servidor ou notificações do telefone com o site fechado. A aplicação processa os vencimentos ao abrir, à meia-noite enquanto aberta, e ao regressar à aba. Recupera os períodos vencidos enquanto esteve fechada. O sino Home usa as mesmas convenções visuais do Business, com dados separados; não interfere nas notificações empresariais.

## Bloco 4 — valor original e câmbio

| Item | Implementação |
|---|---|
| 4.1 | Kwanza/Dólar em lançamentos pessoais, contas e metas; USD mostra o câmbio opcional em Kz por 1 USD. |
| 4.2 | Com câmbio, guardar originalAmount/originalCurrency/exchangeRate e contabilizar apenas amount convertido na carteira AOA. Arredondamento a cêntimos. |
| 4.3 | Sem câmbio, escolher carteira USD e manter AOA intacto. Nunca usar uma taxa de referência automaticamente. |
| 4.4 | Apresentar o original em formato português e conversão auxiliar nos lançamentos, contas, metas e notificações. Gráficos/limites/saldos usam a moeda efetivamente contabilizada. |
| 4.5 | Sem carteira USD, mensagem junto ao câmbio e ação “Criar carteira USD”. Também é possível indicar câmbio e escolher carteira Kz. |

As ocorrências guardam o câmbio do vencimento; editar a taxa futura da conta não altera confirmações anteriores. A carteira de reserva de uma meta em USD com câmbio é AOA; o alvo original continua USD. Aquisição preserva original e câmbio e debita a reserva, sem novo desconto da origem. O fluxo Business/Home mantém transferências na mesma moeda e não recebe conversões implícitas.

## Bloco 5 — metas

| Item | Implementação |
|---|---|
| 5.1 | Prazo opcional; sem data mostra “Sonho sem prazo”. |
| 5.2 | Carteira de origem escolhida na criação e guardada; pode ser revista na edição e aparece nas contribuições. |
| 5.3 | Com desconto ligado, a contribuição transfere da origem para a reserva; Dashboard mostra a reserva real. Adquirir usa a reserva, sem descontar novamente a carteira de origem. |
| 5.4 | Interruptor “Descontar automaticamente ao registar para metas”, ligado por padrão. Preferências explicitamente guardadas anteriormente são respeitadas. Desligado: cada contribuição soma progresso planeado sem criar movimentos. Alterar o interruptor afeta contribuições futuras e conserva as reservas/progresso anteriores. |

Reserva real e progresso planeado são apresentados separadamente. Progresso planeado não dá saldo à carteira, nem pode pagar uma aquisição real. Uma meta de planeamento passa a reserva ao receber uma contribuição com desconto ligado; o progresso antigo fica preservado. Eliminar carteira com saldo/movimentos ou meta com reserva continua bloqueado.

## Bloco 6 — formulários e vocabulário

| Item | Implementação |
|---|---|
| 6.1 | Botões de criação sem “+”, incluindo Adicionar conta e Definir limite. |
| 6.2 | Cartão Dashboard “Rendimentos do mês”, alinhado com os gráficos. Valores USD usam vírgula decimal e código USD. |
| 6.3 | Definir orçamento abre moeda, categoria, valor e mês vazios na criação; edição preenchida e mesmo ID. |

Formulários de criação Home vazios, incluindo carteiras, lançamentos, contas, metas, tarefas, compras e transferência Business. Erros de obrigatórios junto ao campo, sem popup nativo. Valores derivados (modo padrão das contas/desconto das metas) são aplicados ao guardar, sem preencher outros campos. Ações sobre um registo existente — pagar conta, contribuir para uma meta ou retirar reserva — recebem os dados do registo selecionado; edição abre preenchida.

## Verificação e continuidade

- `npm test`: recorrência por frequência/fim, datas de janeiro/fevereiro e ano bissexto, aceitação/ignorar, recarga idempotente, saldo insuficiente, pausa, snapshots, cópias inválidas, USD com/sem câmbio, edição/estorno convertido, origem/sonho sem prazo, aquisição sem duplo débito e interruptor.
- `tests/home-remaining-browser.mjs`: criação vazia/erros por campo, recorrente perguntar/automático/ignorar, manual, alteração futura, recarga, câmbio, metas, interruptor, dashboard e largura móvel.
- Regressões de edição pessoal, Home completo (backup/quota/concorrência/corrupção), finanças e calendário/compras; resultados finais no CURRENT_STATE.md.
- Migração SQL offline `005_home_recurrence_and_exchange.sql`, testada com PGlite: ocorrências únicas, FK de carteira na moeda contabilizada, original/conversão e sonho sem prazo. RLS ativada, sem conectar base, criar utilizadores ou ativar backend. Edição Home futura exige versões auditadas; ledger Business continua imutável.
