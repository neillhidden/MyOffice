# Categorias, subcategorias e compras

Atualizado em 2026-10-08. Home e Business têm catálogos independentes. A estrutura tem dois níveis: **categoria → subcategoria**, por exemplo **Games → Jogos / Consoles**. Nenhum produto ou pagamento fictício é acrescentado.

## Business

Abre **Definições → Categorias e produtos**. Escolhe a categoria e a subcategoria para consultar os produtos. **Adicionar produto nesta categoria** abre o cadastro habitual já com a classificação escolhida; continuam válidas as proteções das empresas, preços, variações e movimentações.

Podes criar categorias e subcategorias nesta página. Os nomes iniciais são:

| Categoria | Subcategorias |
| --- | --- |
| Games | Jogos, Consoles, Comandos e acessórios |
| Casa & Cozinha | Utensílios, Eletrodomésticos, Decoração, Limpeza |
| Moda | Roupa, Calçado, Acessórios |
| Eletrónicos | Telemóveis, Computadores, Áudio, Cabos e carregadores |
| Animais | Alimentação, Higiene, Brinquedos e acessórios |

Produtos antigos sem subcategoria continuam válidos. Classifica-os ao editar; o sistema não adivinha a classificação. Rascunhos guardam a subcategoria. A listagem e os detalhes mostram os dois níveis; a pesquisa do Armazém também encontra os nomes da categoria/subcategoria. O filtro por subcategoria está na página do catálogo.

## Home

Em **Definições**, adiciona categorias e subcategorias pessoais. As iniciais cobrem habitação, alimentação, transporte, saúde, educação, serviços, lazer, outros e Games. Por exemplo, Alimentação inclui Mercearia, Frutas e legumes e Refeições.

Em **Compras**:

1. Adiciona o item, categoria/subcategoria, quantidade e preço unitário previsto em Kz. Quantidades fracionadas são permitidas; preço zero significa item ainda sem preço e não pode ser pago.
2. Edita o item para confirmar o preço antes de pagar.
3. Escolhe conta e data real; clica **Registar pagamento**. A operação debita o saldo uma vez e cria uma despesa da categoria principal, incluída no orçamento e dashboard. Saldo insuficiente bloqueia a operação inteira.
4. Usa **Finanças → Estornar** para corrigir um pagamento. O original fica no histórico; o item indica pagamento estornado e permite novo pagamento. Um item que já teve pagamento preserva quantidade/preço/classificação: para alterar esses dados, estorna e arquiva o item, criando o correto.
5. Arquiva/restaura itens para organizar a lista, sem apagar pagamentos. Filtra por categoria e subcategoria.

A previsão da lista soma itens pendentes não arquivados. Não é uma despesa até registares o pagamento. Backups Home incluem a classificação e a lista; cópias antigas de versão 1 recebem os campos novos automaticamente, preservando contas e histórico.

## Dashboard e aparência

Home mostra contas por pagar, saldo atual previsto após essas contas, despesas face ao mês anterior completo, alertas a partir de 80% do limite e atalhos para finanças/compras/tarefas. O saldo é atual mesmo ao consultar outro mês; a previsão declara essa base.

Business mostra estoque abaixo do mínimo por produto/armazém, entregas de vendas concluídas ainda pendentes/em trânsito e empresas no âmbito selecionado. Esses indicadores representam a situação atual; os gráficos de vendas continuam a respeitar período e moeda.

**Definições → Aparência** no Business, ou **Definições** no Home, oferece **Claro**, **Anoitecer** e **Seguir o dispositivo**. A preferência é partilhada entre modos, guardada localmente; o atalho do cabeçalho continua disponível.

O calendário abre na data local do dispositivo, “Hoje” volta à data real e a navegação mensal não salta meses de menos dias. Ao regressar a uma aba suspensa ou passar a meia-noite, o destaque de hoje é atualizado. A vista acompanha a nova data se estava em hoje; períodos históricos escolhidos são preservados.

## Tipos pessoais (2026-10-08)

Home → Definições → Categorias e subcategorias tem Despesas/Rendimentos. Alimentação, Eletrodomésticos, Transporte, Saúde, Animais de estimação, Família, Roupa, Lixo, Internet e Tecnologia são categorias principais de despesas. Rendimentos inclui Salário, Rendimentos do Business, Bónus, Investimentos e Outras receitas; não há ATT. Subcategorias continuam opcionais dentro de cada categoria (ex.: Games → Jogos/Consoles). Compras usa despesas, receitas usa rendimentos.

## Bloco 1 — gestão pessoal (09/10/2026)

Home → Definições → Categorias e subcategorias abre uma barra de filtros no estilo Movimentação: Tipo (Despesas/Rendimentos/Compras), pesquisa e Adicionar. Compras partilha a taxonomia de Despesas existente; o filtro explicita isso. Linhas com ícone, nome e contagem; lápis/lixo só com ícone. Categoria abre breadcrumb e linhas de subcategorias. Vista Todas as subcategorias mostra o respetivo pai.

Criar abre nome/ícone vazios; editar preenche o mesmo diálogo. Guardar/Cancelar e erros vermelhos junto ao nome, sem validação nativa em popup. Biblioteca linear pesquisável, 12 temas, ícone neutro opcional; subcategoria herda o pai ou usa um próprio. Edições mostram data DD/MM/AAAA.

Nomes repetidos no mesmo nível ignoram maiúsculas/espaços: Ver existente ou Continuar mesmo assim. A segunda opção conserva IDs/chaves distintos; seletores distinguem repetições com (2), (3). Internet principal e Serviços → Internet permanecem separados, com aviso e atalho. Nenhuma fusão automática.

Eliminar sem uso pede confirmação (pai e filhos sem uso). Uso em lançamentos, limites, mensalidades, metas, compras ou tarefas bloqueia e oferece Mover para outra categoria. Mover e eliminar grava classificação anterior/data, mantém IDs/valores/saldos e vínculos dos pagamentos. Destino de mesma natureza; mover pai para filho proibido. Classificação secundária é retirada se o destino escolhido não for subcategoria. Conflito de limites no mesmo mês/moeda recusa a operação inteira, pedindo ajustar limites primeiro.

Catálogo estável `HomeData.categoryCatalog` (id/key/name/kind/parentId/icon/editedAt) normaliza dados antigos e alimenta os arrays compatíveis. Uma chave existente não muda ao renomear. Categorias eliminadas não regressam com defaults ao recarregar; dados financeiros importados continuam classificados. Nomes/ícones atualizados aparecem nos seletores, listas e gráficos existentes. Testes novos: home-categories.test.ts, home-categories-browser.mjs e home-category-database-regression.mjs.
