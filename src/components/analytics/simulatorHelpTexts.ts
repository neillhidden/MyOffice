export interface SimulatorHelpEntry {
  title: string;
  whatIs: string;
  purpose: string;
  howToUse: string;
  example?: string;
}

/**
 * Dicionário centralizado de dicas explicativas do Simulador de Importação e Rentabilidade.
 * Fácil de editar e reutilizar em qualquer secção do simulador.
 */
export const SIMULATOR_HELP_TEXTS: Record<string, SimulatorHelpEntry> = {
  // =========================================================================
  // BARRA DE TOPO E CONFIGURAÇÕES GERAIS
  // =========================================================================
  simulacao_ativa: {
    title: 'Simulação Ativa',
    whatIs: 'É o produto ou estudo de importação que estás a ver e a editar neste momento.',
    purpose: 'Permite alternar rapidamente entre vários produtos guardados sem perder os dados.',
    howToUse: 'Escolhe um produto na lista ou clica em "Nova em Branco" para começar outro do zero.',
  },
  natureza_dados: {
    title: 'Natureza dos Dados (Informado vs. Estimativa)',
    whatIs: 'Indica se os valores desta secção já foram confirmados oficialmente ou se ainda são números aproximados.',
    purpose: 'Ajuda a distinguir cotações reais (confirmadas com fornecedor ou transportadora) de simples estimativas.',
    howToUse: 'Clica no botão para alternar entre "Informado" (valor confirmado) e "Estimativa" (valor aproximado).',
    example: 'Se ainda não tens a fatura final do frete e colocaste um valor provisório, marca como "Estimativa".',
  },
  arredondamento: {
    title: 'Regra de Arredondamento',
    whatIs: 'Define como os valores finais na moeda-base (Kz) são arredondados no ecrã.',
    purpose: 'Facilita a leitura de preços comerciais, evitando casas decimais desnecessárias ou criando valores redondos.',
    howToUse: 'Escolhe entre valor inteiro (1 Kz), 2 casas decimais ou múltiplos de 50 Kz / 100 Kz.',
    example: 'Um valor calculado de 14.982 Kz é exibido como 15.000 Kz se escolheres "Múltiplos de 100 Kz".',
  },

  // =========================================================================
  // RESUMO DE TOPO (4 CARTÕES PRINCIPAIS)
  // =========================================================================
  card_custo_posto: {
    title: 'Custo Posto em Armazém (Landed Cost)',
    whatIs: 'É quanto custa trazer a mercadoria até entrar no teu armazém.',
    purpose: 'Soma Mercadoria + Frete Internacional + Impostos + Taxas aduaneiras. Mostra o total do lote e o custo por unidade.',
    howToUse: 'Usa este valor para saber quanto o stock realmente custou antes das despesas de venda.',
    example: 'Se gastaste 200.000 Kz no produto e 100.000 Kz em frete e taxas para 10 unidades, o custo posto é 300.000 Kz (30.000 Kz/un.).',
  },
  card_investimento_completo: {
    title: 'Investimento Completo (Lote)',
    whatIs: 'É a soma de todos os gastos da operação: trazer o produto (Custo Posto) mais as despesas para o vender (Despesas Comerciais).',
    purpose: 'Mostra o dinheiro total necessário para comprar, importar, divulgar e entregar o lote.',
    howToUse: 'Compara este valor com o teu orçamento disponível para garantir que tens capital suficiente.',
    example: '300.000 Kz de importação + 50.000 Kz de anúncios e embalagens = 350.000 Kz de investimento completo.',
  },
  card_lucro_liquido: {
    title: 'Lucro Líquido Estimado',
    whatIs: 'É o dinheiro que sobra para ti depois de venderes o lote e pagares todos os custos.',
    purpose: 'Calcula Receita Total menos Custos Totais, mostrando o lucro por unidade, o lucro total, a margem e o ROI.',
    howToUse: 'Se estiver positivo (verde), a operação dá lucro; se estiver negativo (vermelho), dá prejuízo com os dados atuais.',
    example: 'Vendas totais de 500.000 Kz menos 350.000 Kz de custos = 150.000 Kz de lucro líquido.',
  },
  card_saldo_orcamento: {
    title: 'Saldo de Orçamento',
    whatIs: 'Mostra quanto dinheiro ainda sobra (ou falta) do teu capital disponível para esta compra.',
    purpose: 'Subtrai o custo da operação ao orçamento que informaste e avisa se ultrapassares o limite.',
    howToUse: 'Mantém este valor positivo para não comprometeres mais dinheiro do que planeaste.',
    example: 'Com orçamento de 200.000 Kz e custo total de 175.000 Kz, o teu saldo restante é 25.000 Kz.',
  },

  // =========================================================================
  // 1. CONFIGURAÇÃO DE MOEDAS E TAXAS DE CÂMBIO
  // =========================================================================
  sec_moedas: {
    title: 'Configuração de Moedas e Taxas de Câmbio',
    whatIs: 'Área onde defines em que moeda compras no exterior e em que moeda queres consolidar todos os cálculos.',
    purpose: 'Converte automaticamente custos em USD, EUR, CNY ou ZAR para a moeda-base (Kz).',
    howToUse: 'Seleciona a moeda do fornecedor, confirma a moeda-base (Kz) e digita o câmbio real que vais pagar.',
  },
  moeda_compra: {
    title: 'Moeda da Compra (Fornecedor)',
    whatIs: 'É a moeda em que o fornecedor cobra o preço do produto (ex.: USD, EUR, CNY ou Kz).',
    purpose: 'Indica ao simulador qual taxa de câmbio usar para converter o preço da mercadoria.',
    howToUse: 'Escolhe a moeda que consta na cotação ou fatura do fornecedor.',
    example: 'Se compras em dólares, escolhe "USD". Se compras diretamente na China em yuan, escolhe "CNY".',
  },
  moeda_base: {
    title: 'Moeda-Base (Consolidação)',
    whatIs: 'É a moeda usada para juntar e comparar os custos da simulação. Neste caso, os valores são consolidados em Kz.',
    purpose: 'Converte todos os custos de diferentes moedas para uma única moeda final para apurar o custo e o lucro reais.',
    howToUse: 'Mantém AOA / Kz para veres todos os resumos, impostos, orçamento e lucros em Kwanzas.',
    example: 'Mesmo que pagues o produto em USD e o frete em EUR, a moeda-base apresenta tudo somado em Kz.',
  },
  taxa_cambio: {
    title: 'Taxa de Câmbio',
    whatIs: 'É quanto custa 1 unidade da moeda estrangeira na moeda-base (Kz).',
    purpose: 'Multiplica os valores em moeda estrangeira para calcular quanto vais desembolsar em Kz.',
    howToUse: 'Preenche com a taxa real praticada pelo teu banco, cartão ou operador cambial.',
    example: 'Se 1 USD = 1.200 Kz, um custo de 10 USD passa a 12.000 Kz.',
  },

  // =========================================================================
  // DADOS DO PRODUTO E MERCADORIA
  // =========================================================================
  sec_dados_produto: {
    title: 'Dados do Produto e Mercadoria',
    whatIs: 'Informações sobre o artigo que vais importar: preço de fábrica, quantidade, peso e medidas.',
    purpose: 'Calcula o valor total da mercadoria e o peso/volume que servirá de base para o transporte.',
    howToUse: 'Confirma estes dados na ficha técnica ou cotação enviada pelo fornecedor.',
  },
  nome_produto: {
    title: 'Nome do Produto',
    whatIs: 'Nome comercial do artigo que estás a simular.',
    purpose: 'Identifica o produto nos quadros de resultado e na tabela comparativa.',
    howToUse: 'Escreve um nome simples e claro (ex.: "Mini Seladora", "Kit Skincare").',
  },
  fornecedor: {
    title: 'Fornecedor',
    whatIs: 'Empresa, fábrica ou plataforma onde vais encomendar o produto.',
    purpose: 'Ajuda a identificar de quem é a cotação quando comparas diferentes fornecedores.',
    howToUse: 'Escreve o nome do fornecedor ou escolhe um da lista.',
  },
  preco_unitario_origem: {
    title: 'Preço Unitário do Produto (Moeda de Origem)',
    whatIs: 'Quanto o fornecedor cobra por 1 unidade do produto (sem transporte nem taxas).',
    purpose: 'Multiplicado pela quantidade desejada e pelo câmbio, define o custo total da mercadoria.',
    howToUse: 'Digita o preço de 1 unidade e seleciona a moeda ao lado. Abaixo vês logo o equivalente em Kz.',
    example: 'Se 1 unidade custa 4,86 USD e o câmbio é 1.000 Kz, o equivalente unitário é 4.860 Kz.',
  },
  moq: {
    title: 'MOQ (Quantidade Mínima)',
    whatIs: 'É o número mínimo de unidades que o fornecedor aceita vender.',
    purpose: 'Mostra um aviso caso a quantidade que desejas comprar seja menor do que o mínimo exigido pelo fornecedor.',
    howToUse: 'Preenche com o mínimo exigido pelo fornecedor (ou 1 se vender à unidade).',
    example: 'Se o MOQ for 10, não podes encomendar apenas 5 unidades.',
  },
  quantidade_desejada: {
    title: 'Quantidade Desejada (Unidades)',
    whatIs: 'Quantas unidades pretendes importar neste lote.',
    purpose: 'Multiplica o preço unitário e o peso, e dilui os custos fixos (como taxas fixas ou frete fixo) por cada unidade.',
    howToUse: 'Insere a quantidade que planeias comprar. Altera o número para ver como o custo por unidade desce em lotes maiores.',
    example: 'Uma taxa fixa de 15.000 Kz dividida por 15 unidades custa 1.000 Kz/un.; dividida por 50 unidades custa apenas 300 Kz/un.',
  },
  peso_bruto_unitario: {
    title: 'Peso Bruto por Unidade (kg)',
    whatIs: 'Peso real na balança de 1 unidade do produto já com a sua embalagem individual.',
    purpose: 'Multiplicado pela quantidade desejada, calcula o Peso Real Total da remessa.',
    howToUse: 'Preenche em quilogramas (kg). Para gramas, usa casas decimais.',
    example: 'Um artigo de 300 gramas deve ser preenchido como 0,30 kg.',
  },
  dimensoes_embalagem: {
    title: 'Dimensões da Embalagem (Comprimento × Largura × Altura)',
    whatIs: 'Medidas exteriores (em centímetros) da embalagem de 1 unidade.',
    purpose: 'Usadas para calcular o Peso Volumétrico (o espaço físico que o produto ocupa no transporte).',
    howToUse: 'Preenche Comprimento, Largura e Altura em cm. Se o envio não depender de volume, podes deixar vazio.',
    example: 'Caixa de 20 cm × 15 cm × 10 cm = 3.000 cm³ por unidade.',
  },
  mercadoria_original_convertida: {
    title: 'Mercadoria Original e Mercadoria Convertida',
    whatIs: 'O custo total dos produtos na moeda do fornecedor e o seu valor convertido para Kz.',
    purpose: 'Mostra quanto vais pagar apenas pelos artigos antes de adicionar transporte e alfândega.',
    howToUse: 'Calculado automaticamente: Preço Unitário × Quantidade Desejada × Câmbio.',
    example: '30 unidades a 5 USD = 150 USD. Com câmbio de 1.200 Kz, a mercadoria convertida é 180.000 Kz.',
  },

  // =========================================================================
  // 2. TRANSPORTE INTERNACIONAL & PESO TAXÁVEL
  // =========================================================================
  sec_transporte: {
    title: 'Transporte Internacional e Peso Taxável',
    whatIs: 'Secção que calcula quanto custa trazer a carga do país do fornecedor até ao destino.',
    purpose: 'Converte o frete para Kz e determina se a cobrança será feita por quilo ou por valor fixo.',
    howToUse: 'Escolhe a modalidade, insere o preço e a moeda informados pela transportadora e confirma a regra de peso.',
  },
  modalidade_aereo_kg: {
    title: 'Modalidade: Aéreo por kg',
    whatIs: 'Envio de avião em que a transportadora cobra um valor por cada quilograma (kg) transportado.',
    purpose: 'Calcula o frete multiplicando o Peso Cobrado pelo Preço por kg.',
    howToUse: 'Seleciona esta opção quando o teu agente de carga cobra uma tarifa por quilo (ex.: 15 USD/kg ou 12.000 Kz/kg).',
  },
  modalidade_maritimo: {
    title: 'Modalidade: Marítimo',
    whatIs: 'Envio por navio (contentor partilhado/CBM ou completo), geralmente cobrado por um valor total para o lote.',
    purpose: 'Soma o valor total do frete marítimo ao custo da importação.',
    howToUse: 'Insere a cotação total recebida para o envio marítimo e a respetiva moeda.',
  },
  modalidade_custo_fixo: {
    title: 'Modalidade: Custo Fixo',
    whatIs: 'Envio com um valor único fechado para toda a encomenda, independentemente do peso exato.',
    purpose: 'Adiciona um valor fixo de transporte ao lote inteiro.',
    howToUse: 'Usa quando o fornecedor ou estafeta informa um valor único de entrega para todo o pedido.',
  },
  modalidade_personalizado: {
    title: 'Modalidade: Personalizado',
    whatIs: 'Opção livre para inserires um custo total de transporte negociado à parte.',
    purpose: 'Soma o valor total informado ao custo da importação e converte para Kz.',
    howToUse: 'Insere o valor combinado com o transportador e escolhe a moeda.',
  },
  preco_frete_kg: {
    title: 'Preço do Transporte por kg',
    whatIs: 'Tarifa cobrada pela transportadora por cada 1 kg de carga enviada.',
    purpose: 'Multiplicada pelo Peso Cobrado, determina o custo total do frete aéreo.',
    howToUse: 'Insere o valor por kg e escolhe a moeda ao lado (ex.: USD, EUR ou Kz).',
    example: 'A 10 USD/kg para 3,20 kg cobrados, o frete é 32 USD. Com câmbio de 1.200 Kz, equivale a 38.400 Kz.',
  },
  custo_fixo_frete: {
    title: 'Custo Total do Frete',
    whatIs: 'Valor total cobrado pela transportadora para enviar o lote completo.',
    purpose: 'Soma ao custo de importação e é dividido entre todas as unidades do lote.',
    howToUse: 'Preenche o valor total da cotação de transporte e seleciona a moeda em que foi cobrado.',
    example: '100 USD de frete com câmbio de 1.200 Kz = 120.000 Kz no total.',
  },
  moeda_frete: {
    title: 'Moeda do Frete',
    whatIs: 'Moeda em que o custo de transporte foi cotado (ex.: USD, EUR, CNY ou Kz).',
    purpose: 'Se for diferente de Kz, aplica a taxa de câmbio para converter o frete para a moeda-base.',
    howToUse: 'Escolhe a moeda exata pedida pela transportadora.',
  },
  divisor_volumetrico: {
    title: 'Divisor de Peso Volumétrico',
    whatIs: 'Fator usado pelas transportadoras para converter o tamanho da caixa (cm³) em peso volumétrico (kg).',
    purpose: 'Fórmula: (Comprimento × Largura × Altura) ÷ Divisor. Quanto menor o divisor, maior será o peso volumétrico calculado.',
    howToUse: 'O padrão internacional mais comum é 5000 (ou 6000). Confirma sempre qual divisor a tua transportadora utiliza.',
    example: 'Caixa de 40×30×25 cm = 30.000 cm³. Dividido por 5000 = 6,00 kg de peso volumétrico.',
  },
  criterio_peso: {
    title: 'Critério de Cobrança (Real, Volumétrico ou Maior)',
    whatIs: 'Define qual peso a transportadora usa para emitir a fatura.',
    purpose: '"Real" usa o peso da balança; "Volumétrico" usa o espaço da caixa; "Maior" cobra o que for mais alto entre os dois.',
    howToUse: 'No transporte aéreo comercial, a regra quase universal é "Maior". Confirma com a tua transportadora.',
    example: 'Se o lote pesa 2 kg (Real) mas ocupa 5 kg de volume (Volumétrico), na regra "Maior" pagas por 5 kg.',
  },
  peso_real_total: {
    title: 'Peso Real Total',
    whatIs: 'Soma do peso físico na balança de todas as unidades do lote.',
    purpose: 'Fórmula: Peso Bruto por Unidade × Quantidade Desejada.',
    howToUse: 'Serve de base quando a transportadora cobra pelo peso físico.',
  },
  peso_volumetrico_total: {
    title: 'Peso Volumétrico Total',
    whatIs: 'Estima o espaço que a embalagem ocupa no transporte.',
    purpose: 'A transportadora pode cobrar pelo peso real ou pelo volumétrico, conforme a regra escolhida.',
    howToUse: 'Calculado automaticamente quando preenches Comprimento, Largura e Altura.',
  },
  peso_cobrado: {
    title: 'Peso Cobrado (Taxável)',
    whatIs: 'O peso final que será efetivamente faturado pela transportadora.',
    purpose: 'É este número de quilos que multiplica o "Preço por kg" na modalidade Aéreo por kg.',
    howToUse: 'Resulta da regra escolhida acima (Real, Volumétrico ou o Maior dos dois).',
  },
  frete_moeda_base: {
    title: 'Frete em Moeda-Base',
    whatIs: 'Valor total do transporte já convertido para a moeda-base (Kz).',
    purpose: 'Entra diretamente na soma do Custo Posto em Armazém (Landed Cost).',
    howToUse: 'Confere aqui quanto o transporte representa em Kwanzas.',
  },

  // =========================================================================
  // CONVERSÃO CENTRALIZADA DE CUSTOS
  // =========================================================================
  sec_conversao_centralizada: {
    title: 'Conversão Centralizada de Custos',
    whatIs: 'Quadro onde todos os custos da operação aparecem com a sua moeda original, o câmbio usado e o valor convertido.',
    purpose: 'Permite conferir de forma transparente como cada custo internacional passa para a moeda-base (Kz).',
    howToUse: 'Verifica as colunas "Valor Original", "Câmbio" e "Convertido (Kz)" para validar se todas as conversões estão corretas.',
    example: 'Produto: US$ 100 × 1.200 = 120.000 Kz | Taxa fornecedor: ¥ 50 CNY × 168 = 8.400 Kz.',
  },

  // =========================================================================
  // 3. IMPOSTOS, TAXAS ADUANEIRAS & BASE TRIBUTÁVEL
  // =========================================================================
  sec_impostos_taxas: {
    title: 'Impostos, Taxas Aduaneiras e Base Tributável',
    whatIs: 'Custos alfandegários, fiscais e taxas logísticas locais aplicados na chegada da mercadoria.',
    purpose: 'Somam-se à mercadoria e ao frete para formar o Custo Posto em Armazém.',
    howToUse: 'Não assumas taxas fixas sem confirmar: verifica sempre com o teu despachante, transportadora ou autoridade competente quais taxas se aplicam ao teu produto.',
  },
  base_tributavel: {
    title: 'Base Tributável (Incidência dos Impostos Percentuais)',
    whatIs: 'É o montante em Kz sobre o qual as percentagens de impostos (ex.: AGT e Direitos Aduaneiros) são calculadas.',
    purpose: 'Permite escolher se a percentagem de imposto incide apenas sobre a Mercadoria ou também sobre Frete, Seguro e Outros custos.',
    howToUse: 'Marca as caixas que fazem parte do valor aduaneiro da tua importação (muitas vezes Mercadoria + Frete + Seguro). Confirma a regra aplicável com o teu despachante.',
    example: 'Se Mercadoria = 70.000 Kz e Frete = 120.000 Kz, marcando ambos o Valor Tributável é 190.000 Kz.',
  },
  incidencia_mercadoria: {
    title: 'Incidência sobre Mercadoria',
    whatIs: 'Inclui o valor convertido dos produtos na base de cálculo dos impostos percentuais.',
    purpose: 'Quando ativo, as percentagens de impostos incidem sobre o valor da mercadoria.',
    howToUse: 'Normalmente permanece ativo em quase todas as importações tributadas.',
  },
  incidencia_frete: {
    title: 'Incidência sobre Frete',
    whatIs: 'Inclui o custo do transporte internacional na base de cálculo dos impostos percentuais.',
    purpose: 'Em regras aduaneiras baseadas no valor CIF (Custo + Seguro + Frete), o imposto também incide sobre o frete.',
    howToUse: 'Marca esta opção se o cálculo aduaneiro da tua remessa incluir o valor do frete.',
  },
  incidencia_seguro: {
    title: 'Incidência sobre Seguro',
    whatIs: 'Inclui o valor do seguro de transporte na base tributável dos impostos percentuais.',
    purpose: 'Soma o seguro ao valor tributável antes de aplicar as percentagens de imposto.',
    howToUse: 'Ativa se houver seguro contratado e se ele compuser o valor aduaneiro.',
  },
  incidencia_outros: {
    title: 'Incidência sobre Outros Custos',
    whatIs: 'Inclui outras taxas fixas (como taxas na origem) na base de cálculo dos impostos percentuais.',
    purpose: 'Aumenta o valor tributável caso outras despesas façam parte da fatura tributada.',
    howToUse: 'Marca apenas se essas taxas também sofrerem incidência de impostos.',
  },
  tax_agt: {
    title: 'Imposto / AGT',
    whatIs: 'Imposto fiscal aplicável na importação (como IVA ou imposto cobrado pela Administração Geral Tributária).',
    purpose: 'Se estiver em "% Percentual", multiplica a percentagem pelo Valor Tributável; se for "Valor Fixo", soma o montante indicado.',
    howToUse: 'Ativa se a tua importação pagar este imposto e confirma a percentagem aplicável ao teu regime e produto junto do despachante ou autoridade competente.',
  },
  tax_direitos: {
    title: 'Direitos Aduaneiros',
    whatIs: 'Taxa alfandegária de entrada que varia conforme o tipo de mercadoria (pauta aduaneira).',
    purpose: 'Calcula o encargo de direitos de importação sobre o Valor Tributável (ou como valor fixo).',
    howToUse: 'Confirma a taxa da pauta aduaneira para a categoria do teu produto antes de preencher.',
  },
  tax_desalfandegamento: {
    title: 'Taxa de Desalfandegamento',
    whatIs: 'Custo cobrado pelo despachante oficial ou serviço de desembaraço para libertar a carga na alfândega.',
    purpose: 'Soma ao Custo Posto em Armazém e divide-se pelas unidades do lote.',
    howToUse: 'Podes preencher em valor fixo (em Kz ou outra moeda) ou em percentagem.',
    example: 'Se o despachante cobra 25.000 Kz pelo processo, escolhe "Valor Fixo", digita 25000 e seleciona Kz.',
  },
  tax_transportadora: {
    title: 'Taxa da Transportadora / Fornecedor',
    whatIs: 'Taxas administrativas de entrega, manuseamento no terminal ou comissão de envio cobrada pelo fornecedor/agente.',
    purpose: 'Converte para Kz (se estiver em USD, CNY, etc.) e soma ao custo de importação.',
    howToUse: 'Preenche caso exista alguma taxa extra além do frete principal.',
    example: 'Uma taxa de manuseamento de 30 CNY com câmbio de 168 Kz adiciona 5.040 Kz ao custo.',
  },
  tax_seguro: {
    title: 'Seguro de Transporte',
    whatIs: 'Valor pago para proteger a mercadoria contra extravio ou danos durante a viagem.',
    purpose: 'Soma ao custo de importação (e pode integrar a Base Tributável se a opção "Seguro" estiver marcada).',
    howToUse: 'Informa em valor fixo (ex.: 15 USD) ou em percentagem sobre Mercadoria + Frete.',
  },
  tax_outras: {
    title: 'Outras Taxas Aduaneiras / Locais',
    whatIs: 'Qualquer outro encargo de chegada (armazenagem portuária, selos, inspeção ou taxas locais).',
    purpose: 'Garante que nenhum custo de entrada fica de fora do Custo Posto em Armazém.',
    howToUse: 'Ativa e preenche se tiveres custos adicionais na receção da mercadoria.',
  },
  consolidacao_landed_cost: {
    title: 'Consolidação Aduaneira e Custo Posto em Armazém',
    whatIs: 'Demonstrativo que soma Mercadoria Convertida + Frete Convertido + Impostos + Taxas.',
    purpose: 'Mostra exatamente como se formou o Custo Total Posto em Armazém (Landed Cost) em Kz.',
    howToUse: 'Revisa cada linha para perceber qual rubrica está a pesar mais na tua importação.',
  },

  // =========================================================================
  // 4. DESPESAS COMERCIAIS (SEPARADAS DO STOCK)
  // =========================================================================
  sec_despesas_comerciais: {
    title: 'Despesas Comerciais (Separadas do Custo do Stock)',
    whatIs: 'Custos necessários para vender o produto aos clientes: publicidade, embalagens de envio, entregas e comissões.',
    purpose: 'Não alteram o Custo Posto em Armazém (valor do stock), mas somam-se para formar o Custo Completo e calcular o lucro real.',
    howToUse: 'Ativa cada despesa prevista e escolhe ao lado se o valor é "Total (Lote)", "Por Unidade" ou "% sobre Venda".',
    example: 'Isto evita confundires quanto o produto custou a importar com quanto gastas para o divulgar e vender.',
  },
  exp_publicidade: {
    title: 'Publicidade / Tráfego Pago',
    whatIs: 'Orçamento gasto em anúncios (Facebook Ads, Instagram, influenciadores, panfletos) para vender este lote.',
    purpose: 'Dilui o gasto de marketing pelas unidades do lote para saberes o custo completo de cada venda.',
    howToUse: 'Normalmente preenche-se como "Total (Lote)" (ex.: 15.000 Kz para divulgar o lote inteiro).',
  },
  exp_embalagem: {
    title: 'Embalagem Comercial',
    whatIs: 'Sacos personalizados, caixas de entrega, autocolantes ou fitas usados ao enviar o pedido ao cliente.',
    purpose: 'Adiciona o custo de apresentação ao Custo Completo de cada unidade.',
    howToUse: 'Podes preencher "Por Unidade" (ex.: 300 Kz por saco/caixa) ou "Total (Lote)".',
  },
  exp_entrega: {
    title: 'Entrega ao Cliente (Última Milha)',
    whatIs: 'Custo de estafeta ou transporte local quando ofereces entrega gratuita ou subsidiada ao cliente.',
    purpose: 'Se tu pagas a entrega ao cliente, esse valor precisa ser descontado para não comer o teu lucro.',
    howToUse: 'Se o cliente paga a entrega à parte, deixa desativado. Se tu suportas o custo, ativa e preenche.',
  },
  exp_comissao_vendedor: {
    title: 'Comissão de Vendedor / Afiliado',
    whatIs: 'Valor ou percentagem pago a vendedores ou parceiros por cada venda realizada.',
    purpose: 'Desconta a comissão para mostrar a tua margem líquida real.',
    howToUse: 'Escolhe "% sobre Venda" (ex.: 5%) ou um valor fixo "Por Unidade".',
  },
  exp_comissao_pagamento: {
    title: 'Comissão de Pagamento / TPA',
    whatIs: 'Taxa cobrada pelo banco, terminal multicaixa (TPA) ou plataforma de pagamentos online.',
    purpose: 'Calcula o desconto bancário sobre cada venda realizada.',
    howToUse: 'Geralmente usa-se no modo "% sobre Venda" (ex.: 1,5% ou 2%).',
  },
  exp_outras: {
    title: 'Outras Despesas Comerciais',
    whatIs: 'Qualquer outro gasto operacional ligado à venda do produto (brindes, brindes promocionais, suporte).',
    purpose: 'Soma ao Custo Completo para manter o cálculo de lucro 100% realista.',
    howToUse: 'Ativa e preenche se tiveres despesas comerciais extras.',
  },
  resumo_importacao_vs_comercial: {
    title: 'Custo de Importação (Stock) vs. Despesas Comerciais (Venda)',
    whatIs: 'Painel que separa quanto gastas para ter o produto em armazém de quanto gastas para o comercializar.',
    purpose: 'O primeiro valor é o custo de aquisição do stock; a soma dos dois dá o teu Investimento Completo.',
    howToUse: 'Compara os dois valores para controlar se as despesas de venda estão equilibradas.',
  },

  // =========================================================================
  // 6. ORÇAMENTO & CAPITAL DISPONÍVEL
  // =========================================================================
  sec_orcamento: {
    title: 'Orçamento e Capital Disponível',
    whatIs: 'O dinheiro máximo que tens separado para financiar esta importação.',
    purpose: 'Compara o teu capital com o investimento necessário e calcula quantas unidades cabem no teu orçamento.',
    howToUse: 'Digita o teu orçamento em Kz (ex.: 200.000 Kz) para veres o capital restante e a quantidade recomendada.',
  },
  capital_disponivel: {
    title: 'Capital Disponível para a Operação',
    whatIs: 'Valor total em Kz que podes investir sem comprometer outras obrigações da empresa.',
    purpose: 'Serve de teto financeiro para validar se o lote desejado é viável.',
    howToUse: 'Insere o valor em Kz. Se deixares em branco, aparecerá como "Não informado".',
    example: 'Se tens 200.000 Kz disponíveis e o lote custa 180.000 Kz, a operação cabe no orçamento.',
  },
  capital_utilizado: {
    title: 'Capital Utilizado',
    whatIs: 'Total de dinheiro que esta operação vai consumir (considerando o custo base selecionado).',
    purpose: 'Mostra o desembolso total exigido pela quantidade desejada.',
    howToUse: 'Compara com o Capital Disponível para ver quanto do teu orçamento será ocupado.',
  },
  capital_restante: {
    title: 'Capital Restante',
    whatIs: 'Dinheiro que sobra do teu orçamento após pagar a operação (Orçamento menos Capital Utilizado).',
    purpose: 'Se for positivo (verde), ainda tens folga financeira; se for negativo (vermelho), falta capital.',
    howToUse: 'Quando negativo, vê na caixa abaixo quantas unidades o simulador recomenda comprar para caber no orçamento.',
  },

  // =========================================================================
  // 7. CUSTO UNITÁRIO CONSOLIDADO (POSTO VS COMPLETO)
  // =========================================================================
  sec_custo_unitario_duplo: {
    title: 'Custo Unitário Consolidado (Posto vs. Completo)',
    whatIs: 'Mostra quanto custa 1 única peça em duas visões: apenas posta no armazém vs. com todas as despesas de venda incluídas.',
    purpose: 'Evita que vendas o produto por um preço que cubra a importação mas dê prejuízo depois de pagar anúncios e entregas.',
    howToUse: 'Olha sempre para o "Custo Completo Unitário" antes de escolher o teu preço de venda.',
    example: 'Custo Posto = 9.000 Kz/un. + Despesas Comerciais = 1.500 Kz/un. → Custo Completo = 10.500 Kz/un.',
  },
  custo_posto_unitario: {
    title: 'Custo Posto Unitário',
    whatIs: 'Custo de importação de 1 unidade (Mercadoria + Frete + Impostos + Taxas dividido pela quantidade).',
    purpose: 'Representa o valor contabilístico de entrada de cada peça no teu stock.',
    howToUse: 'Serve para avaliar se conseguiste uma boa compra e um bom frete.',
  },
  custo_completo_unitario: {
    title: 'Custo Completo Unitário',
    whatIs: 'Soma do Custo Posto Unitário com as Despesas Comerciais por unidade.',
    purpose: 'Representa o custo real total de cada peça até chegar às mãos do cliente.',
    howToUse: 'Todo o dinheiro acima deste valor no preço de venda será o teu lucro líquido por unidade.',
  },

  // =========================================================================
  // 8. PRECIFICAÇÃO INTELIGENTE (MARGEM VS MARKUP)
  // =========================================================================
  sec_precificacao: {
    title: 'Precificação Inteligente na Moeda-Base',
    whatIs: 'Calculadora que define o preço de venda ideal e mostra o lucro, a margem e o markup.',
    purpose: 'Permite simular o preço de 3 formas: digitando o preço em Kz, definindo a Margem desejada (%) ou o Markup desejado (%).',
    howToUse: 'Escolhe o modo A, B ou C e observa os 4 cartões abaixo com o lucro e as percentagens reais.',
  },
  base_custo_precificacao: {
    title: 'Sobre Custo Completo vs. Sobre Custo Posto',
    whatIs: 'Seletor que define qual dos dois custos unitários será usado nas contas de lucro e preço.',
    purpose: '"Sobre Custo Completo" inclui as despesas comerciais; "Sobre Custo Posto" usa apenas o custo de importação.',
    howToUse: 'Recomendamos usar "Sobre Custo Completo" para não esqueceres os gastos de marketing e venda.',
  },
  preco_venda_input: {
    title: 'Preço de Venda por Unidade',
    whatIs: 'Valor pelo qual pretendes vender 1 unidade do produto ao teu cliente.',
    purpose: 'Determina a Receita Total, o Lucro por Unidade, a Margem, o ROI e o Ponto de Equilíbrio.',
    howToUse: 'Digita um valor em Kz ou clica em "Preço Recomendado (Aplicar)" para usar uma sugestão com ~30% de margem.',
  },
  preco_minimo_empate: {
    title: 'Preço Mínimo (Empate)',
    whatIs: 'O preço exato onde o lucro é zero (nem ganhas, nem perdes).',
    purpose: 'Mostra o limite mínimo absoluto para liquidações ou descontos.',
    howToUse: 'Nunca vendas abaixo deste valor se não quiseres ter prejuízo por unidade.',
  },
  lucro_por_unidade: {
    title: 'Lucro por Unidade',
    whatIs: 'Ganho líquido em Kz obtido em cada unidade vendida.',
    purpose: 'Fórmula: Preço de Venda menos Custo Unitário considerado.',
    howToUse: 'Quanto maior este valor, mais rápido recuperas o capital investido.',
    example: 'Preço de venda de 20.000 Kz menos custo completo de 14.000 Kz = 6.000 Kz de lucro por unidade.',
  },
  margem_lucro: {
    title: 'Margem (Lucro ÷ Venda)',
    whatIs: 'Mostra que percentagem do preço de venda fica como lucro. Não é o mesmo que markup.',
    purpose: 'Fórmula: (Lucro ÷ Preço de Venda) × 100. Mede a rentabilidade real sobre o dinheiro que entra no caixa.',
    howToUse: 'Se vendes por 10.000 Kz e lucras 3.000 Kz, a tua margem é 30%.',
    example: 'Numa venda de 20.000 Kz com margem de 25%, ficam 5.000 Kz de lucro líquido.',
  },
  markup_lucro: {
    title: 'Markup (Lucro ÷ Custo)',
    whatIs: 'Percentagem adicionada sobre o custo unitário para formar o preço de venda.',
    purpose: 'Fórmula: (Lucro ÷ Custo) × 100. É sempre um número percentual maior do que a margem.',
    howToUse: 'Usa se costumas definir preços somando uma percentagem fixa em cima do que gastaste.',
    example: 'Custo de 10.000 Kz com Markup de 100% (dobro do custo) dá um preço de 20.000 Kz (o que equivale a 50% de Margem).',
  },

  // =========================================================================
  // 9. CENÁRIOS DE PREÇO
  // =========================================================================
  sec_cenarios_preco: {
    title: 'Cenários de Preço (Conservador, Moderado, Recomendado e Agressivo)',
    whatIs: 'Tabela comparativa com 4 faixas de preço para avaliares diferentes estratégias de venda.',
    purpose: 'Mostra como o lucro por unidade, o lucro total e a margem mudam em cada faixa de preço.',
    howToUse: 'Podes alterar qualquer preço diretamente na tabela ou clicar em "Usar preço" para testá-lo na simulação principal.',
    example: 'Usa o cenário "Conservador" se houver muita concorrência, ou "Recomendado / Agressivo" para produtos exclusivos.',
  },

  // =========================================================================
  // 10. PONTO DE EQUILÍBRIO (BREAK-EVEN)
  // =========================================================================
  sec_ponto_equilibrio: {
    title: 'Ponto de Equilíbrio (Break-Even)',
    whatIs: 'Quantidade mínima de unidades que precisas vender para recuperar 100% do dinheiro investido no lote.',
    purpose: 'Divide o Investimento Total pelo Preço de Venda unitário para mostrar quando deixas de estar no prejuízo.',
    howToUse: 'Quanto menor for este número em relação à quantidade total do lote, menor é o risco de ficares com dinheiro preso.',
    example: 'Num lote de 30 unidades que custou 300.000 Kz no total, se vendes a 20.000 Kz/un., basta venderes 15 unidades para recuperar os 300.000 Kz.',
  },

  // =========================================================================
  // 11. RENTABILIDADE POR TAXA DE ESCOAMENTO DO STOCK
  // =========================================================================
  sec_escoamento_stock: {
    title: 'Rentabilidade por Taxa de Escoamento do Stock (25% • 50% • 75% • 100%)',
    whatIs: 'Simulação do que acontece quando vendes 25%, 50%, 75% ou 100% das unidades do lote, separando o lucro das vendas realizadas da posição de caixa do lote.',
    purpose: 'Distingue claramente o "Lucro das unidades vendidas" (ganho nas peças já vendidas) do "Saldo de caixa após as vendas" (receita recebida menos desembolso do lote, mantendo o stock restante por vender).',
    howToUse: 'Compara em cada cartão quanto já lucraste nas unidades vendidas, quanto falta recuperar em caixa do lote e quanto valor continua guardado em stock.',
  },
  escoamento_receita: {
    title: 'Receita das Unidades Vendidas',
    whatIs: 'Total de dinheiro recebido pelas unidades vendidas nesse cenário.',
    purpose: 'Fórmula: Preço de Venda × Unidades Vendidas.',
    howToUse: 'Serve de base tanto para apurar o lucro das unidades vendidas como para abater o investimento do lote.',
    example: 'Vender 3 unidades a 25.000 Kz gera 75.000 Kz de receita.',
  },
  escoamento_custo_vendidas: {
    title: 'Custo Atribuível às Unidades Vendidas',
    whatIs: 'Soma do custo de importação dessas unidades vendidas mais as despesas comerciais aplicáveis a essas vendas.',
    purpose: 'Isola apenas o custo das peças que saíram do stock, sem misturar com as peças que continuam guardadas.',
    howToUse: 'Subtraído da receita das unidades vendidas, revela o lucro real obtido nas vendas já feitas.',
    example: '3 unidades com custo unitário de 14.250 Kz têm um custo atribuível de 42.750 Kz.',
  },
  escoamento_lucro_vendidas: {
    title: 'Lucro das Unidades Vendidas',
    whatIs: 'Ganho real obtido nas unidades que já foram vendidas.',
    purpose: 'Fórmula: Receita das Unidades Vendidas menos o Custo Atribuível a essas unidades e despesas comerciais aplicáveis.',
    howToUse: 'Não classifica o stock não vendido como prejuízo: mostra exatamente quanto ganhaste nas peças comercializadas.',
    example: 'Em 3 unidades vendidas por 75.000 Kz com custo atribuível de 42.750 Kz, o lucro das unidades vendidas é +32.250 Kz.',
  },
  escoamento_saldo_caixa: {
    title: 'Saldo de Caixa após as Vendas',
    whatIs: 'Posição de caixa do lote até ao momento: Receitas Recebidas menos o Investimento Desembolsado para o lote.',
    purpose: 'Mostra se o dinheiro que já entrou no caixa já pagou o lote inteiro ou quanto ainda falta recuperar com a venda do stock restante.',
    howToUse: 'Quando negativo, indica apenas quanto do desembolso inicial ainda está empatado nas unidades que continuam em stock por vender.',
    example: 'Receita de 75.000 Kz menos 142.500 Kz desembolsados no lote = -67.500 Kz em caixa (com 7 unidades ainda em stock avaliadas em 99.750 Kz).',
  },
  escoamento_stock_restante: {
    title: 'Stock Restante por Vender',
    whatIs: 'Unidades do lote que continuam disponíveis no armazém e o respetivo valor a preço de custo.',
    purpose: 'Lembra que o dinheiro do lote não foi perdido: está aplicado em mercadoria pronta para ser vendida.',
    howToUse: 'À medida que estas unidades forem vendidas, o Saldo de Caixa sobe até igualar o Lucro Total aos 100% de escoamento.',
  },
  escoamento_margem: {
    title: 'Margem das Unidades Vendidas',
    whatIs: 'Percentagem da receita das unidades vendidas que corresponde a lucro.',
    purpose: 'Fórmula: (Lucro das Unidades Vendidas ÷ Receita das Unidades Vendidas) × 100.',
    howToUse: 'Mostra a rentabilidade percentual sobre o faturamento já realizado.',
  },
  roi_indicador: {
    title: 'ROI (Retorno sobre o Investimento)',
    whatIs: 'Compara o lucro com o custo investido e mostra o retorno percentual da operação.',
    purpose: 'Fórmula: (Lucro ÷ Custo Investido) × 100. Nos cenários parciais, usa como base o custo atribuível às unidades vendidas.',
    howToUse: 'Um ROI de 75,4% significa que cada 100 Kz de custo nas unidades vendidas gerou 75,4 Kz de lucro.',
    example: 'Custo de 142.500 Kz com lucro de 107.500 Kz gera um ROI de 75,4%.',
  },

  // =========================================================================
  // 12. ANÁLISE DE SENSIBILIDADE
  // =========================================================================
  sec_sensibilidade: {
    title: 'Análise de Sensibilidade (Teste de Stress)',
    whatIs: 'Simulador automático que mostra o que acontece se um custo variar para mais ou para menos.',
    purpose: 'Permite testar alterações no Frete/kg, Taxa de Câmbio, Preço do Fornecedor, Impostos ou Preço de Venda.',
    howToUse: 'Escolhe a variável nos botões à direita para veres na tabela até que limite de aumento a tua operação aguenta sem dar prejuízo.',
    example: 'Testa o que acontece à tua margem e ao teu orçamento se o câmbio do dólar subir 5% ou 15%.',
  },

  // =========================================================================
  // 13. RESULTADO FINAL E CLASSIFICAÇÃO FINANCEIRA
  // =========================================================================
  sec_resultado_final: {
    title: 'Resultado Final Consolidado e Classificação Financeira',
    whatIs: 'Resumo executivo com todos os indicadores principais e uma classificação automática ("Boa oportunidade", "Margem apertada" ou "Alto risco").',
    purpose: 'Avalia se a margem, o ROI, o orçamento e o ponto de equilíbrio cumprem as metas definidas.',
    howToUse: 'Atenção: esta classificação avalia apenas a viabilidade matemática dos números inseridos e não garante que haverá procura comercial ou facilidade de venda.',
    example: 'Clica em "Critérios de Classificação" se quiseres definir as tuas próprias metas mínimas de Margem (%) e ROI (%).',
  },
  classificacao_financeira: {
    title: 'Classificação Financeira da Simulação',
    whatIs: 'Diagnóstico automático baseado nas tuas metas de Margem, ROI, Orçamento e Ponto de Equilíbrio.',
    purpose: 'Sinaliza rapidamente se os números inseridos mostram folga ("Boa oportunidade"), atenção ("Margem apertada") ou perigo ("Alto risco").',
    howToUse: 'Lê os motivos listados na base do cartão para entenderes exatamente o porquê da classificação atribuída.',
  },

  // =========================================================================
  // 14. COMPARADOR DE PRODUTOS
  // =========================================================================
  sec_comparador: {
    title: 'Comparador de Produtos e Simulações Guardadas',
    whatIs: 'Tabela que reúne todas as tuas simulações guardadas para comparação direta.',
    purpose: 'Permite ordenar os produtos por Maior Margem, Maior ROI, Menor Investimento, Menor Custo Unitário ou Menor Risco.',
    howToUse: 'Clica em qualquer linha para abrir a simulação, ou usa o botão de Duplicar para criar uma cópia e testar apenas uma alteração.',
  },
};
