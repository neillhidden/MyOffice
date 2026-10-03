import {
  Company,
  Bank,
  Warehouse,
  Product,
  StockConfig,
  Movement,
  BankMovement,
  Sale,
  Transport,
} from '../types/stock';

// ============================================================================
// 1. EMPRESA FICTÍCIA: "Loja Kianda Comércio & Retalho, Lda."
// ============================================================================

export const KIANDA_COMPANY: Company = {
  id: 'comp-kianda',
  name: 'Loja Kianda Comércio & Retalho, Lda.',
  nif: '5431890214',
  address: 'Avenida 4 de Fevereiro nº 118, Baixa de Luanda',
  contact: '+244 924 550 100 • contacto@lojakianda.ao',
  currency: 'Kz',
  principalBankId: 'bank-kianda',
  status: 'desativada',
  createdAt: '2026-06-01T08:00:00.000Z',
  updatedAt: '2026-09-16T12:00:00.000Z',
};

// ============================================================================
// 2. BANCO PRÓPRIO: "Banco BAI - Conta Loja Kianda"
// ============================================================================

export const KIANDA_BANK: Bank = {
  id: 'bank-kianda',
  name: 'Banco BAI - Conta Loja Kianda',
  type: 'banco_fisico',
  currency: 'Kz',
  accountNumber: 'AO06.0040.0000.7788.9900.1122.4',
  iban: 'AO06.0040.0000.7788.9900.1122.4',
  status: 'inativo',
  companyId: 'comp-kianda',
  createdAt: '2026-06-01T08:00:00.000Z',
  updatedAt: '2026-09-16T12:00:00.000Z',
  notes: 'Conta bancária corrente principal vinculada à Loja Kianda',
};

// ============================================================================
// 3. ARMAZÉM / LOJA PRÓPRIA: "Armazém & Loja Kianda - Luanda Marginal"
// ============================================================================

export const KIANDA_WAREHOUSE: Warehouse = {
  id: 'wh-kianda',
  companyId: 'comp-kianda',
  name: 'Armazém & Loja Kianda - Luanda Marginal',
  type: 'loja_fisica',
  address: 'Avenida 4 de Fevereiro nº 118, Baixa de Luanda',
  manager: 'Kiesse Domingos',
  contact: '+244 924 550 101',
  status: 'ativo',
};

// ============================================================================
// 4. PRODUTOS VARIADOS (8 PRODUTOS NAS 5 CATEGORIAS DO SISTEMA)
// ============================================================================

export const KIANDA_PRODUCTS: Product[] = [
  // 1. Games (Item Único - Sem variação, Estado: Novo)
  {
    id: 'prod-kianda-1',
    name: 'Jogo EA Sports FC 25 PS5',
    description: 'Edição Standard com passe de época e tecnologia HyperMotionV para PlayStation 5.',
    category: 'Games',
    condition: 'novo',
    sku: 'KND-GAM-FC25',
    barcode: '5030938124951',
    brand: 'EA Sports',
    supplierId: 'sup-3', // TechLuanda
    createdBy: 'Kiesse Domingos',
    createdAt: '2026-06-02T09:00:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
    mainImage: 'https://images.unsplash.com/photo-1612287233207-6b4df9d1cf37?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1612287233207-6b4df9d1cf37?auto=format&fit=crop&w=600&q=80',
    ],
    unitOfMeasure: 'unidade',
    costPrice: 45000,
    salePrice: 64000,
    status: 'ativo',
    variations: [],
  },

  // 2. Games (Com 3 variações de cor, Estado: Novo)
  {
    id: 'prod-kianda-2',
    name: 'Comando Sem Fios Pro Wireless Gamepad',
    description: 'Controle sem fios multiplataforma (PS5/PC/Switch) com vibração háptica e gatilhos magnéticos Hall Effect.',
    category: 'Games',
    condition: 'novo',
    sku: 'KND-GAM-PAD',
    barcode: '7117195489123',
    brand: 'NextGen Gaming',
    supplierId: 'sup-3',
    createdBy: 'Kiesse Domingos',
    createdAt: '2026-06-03T10:30:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
    mainImage: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=600&q=80',
    ],
    unitOfMeasure: 'unidade',
    costPrice: 28000,
    salePrice: 42000,
    status: 'ativo',
    variations: [
      {
        id: 'var-knd-2-1',
        color: 'Preto Midnight',
        colorHex: '#111827',
        sku: 'KND-GAM-PAD-BLK',
        additionalPrice: 0,
      },
      {
        id: 'var-knd-2-2',
        color: 'Branco Lunar',
        colorHex: '#F3F4F6',
        sku: 'KND-GAM-PAD-WHT',
        additionalPrice: 0,
      },
      {
        id: 'var-knd-2-3',
        color: 'Vermelho Cosmic',
        colorHex: '#DC2626',
        sku: 'KND-GAM-PAD-RED',
        additionalPrice: 3000,
      },
    ],
  },

  // 3. Moda (Com variações de Cor e Tamanho, Estado: Novo)
  {
    id: 'prod-kianda-3',
    name: 'Camisa Polo Masculina Piquet Classic',
    description: 'Confeccionada em 100% algodão piquet penteado, corte regular com acabamento reforçado na gola.',
    category: 'Moda',
    condition: 'novo',
    sku: 'KND-MOD-POLO',
    barcode: '5601239847120',
    brand: 'Kianda Wear',
    supplierId: 'sup-2', // Importadora Atlântico Sul
    createdBy: 'Kiesse Domingos',
    createdAt: '2026-06-05T11:00:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
    mainImage: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=600&q=80',
    ],
    unitOfMeasure: 'unidade',
    costPrice: 11500,
    salePrice: 18500,
    status: 'ativo',
    variations: [
      {
        id: 'var-knd-3-1',
        color: 'Azul Marinho',
        colorHex: '#1E3A8A',
        size: 'M',
        sku: 'KND-MOD-POLO-NAVY-M',
        additionalPrice: 0,
      },
      {
        id: 'var-knd-3-2',
        color: 'Azul Marinho',
        colorHex: '#1E3A8A',
        size: 'L',
        sku: 'KND-MOD-POLO-NAVY-L',
        additionalPrice: 0,
      },
      {
        id: 'var-knd-3-3',
        color: 'Branco Neve',
        colorHex: '#FFFFFF',
        size: 'M',
        sku: 'KND-MOD-POLO-WHT-M',
        additionalPrice: 0,
      },
      {
        id: 'var-knd-3-4',
        color: 'Preto Ónix',
        colorHex: '#000000',
        size: 'XL',
        sku: 'KND-MOD-POLO-BLK-XL',
        additionalPrice: 1500,
      },
    ],
  },

  // 4. Moda / Acessório (Com variações de cor, Estado: Novo)
  {
    id: 'prod-kianda-4',
    name: 'Mochila Executiva Antifurto Impermeável',
    description: 'Mochila para laptop até 15.6 polegadas, tecido Oxford impermeável com porta de carregamento USB externo e fechos ocultos.',
    category: 'Moda',
    condition: 'novo',
    sku: 'KND-MOD-BAG',
    barcode: '6972049182049',
    brand: 'UrbanShield',
    supplierId: 'sup-2',
    createdBy: 'Kiesse Domingos',
    createdAt: '2026-06-06T14:00:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
    mainImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    ],
    unitOfMeasure: 'unidade',
    costPrice: 19000,
    salePrice: 32000,
    status: 'ativo',
    variations: [
      {
        id: 'var-knd-4-1',
        color: 'Cinza Espacial',
        colorHex: '#4B5563',
        sku: 'KND-MOD-BAG-GRY',
        additionalPrice: 0,
      },
      {
        id: 'var-knd-4-2',
        color: 'Preto Carbono',
        colorHex: '#111827',
        sku: 'KND-MOD-BAG-BLK',
        additionalPrice: 2000,
      },
    ],
  },

  // 5. Eletrónicos (Item Único - Seminovo / Como Novo para testar condition: 'novo_usado')
  {
    id: 'prod-kianda-5',
    name: 'Smartwatch Amazfit GTR 4 AMOLED (Excelente Estado)',
    description: 'Relógio inteligente com tela HD AMOLED de 1.43", GPS dual-band preciso, monitoramento cardíaco contínuo e bateria para 14 dias. Equipamento de vitrine sem marcas de uso.',
    category: 'Eletrónicos',
    condition: 'novo_usado',
    sku: 'KND-ELE-GTR4-EX',
    barcode: '6972596105423',
    brand: 'Amazfit',
    supplierId: 'sup-3',
    createdBy: 'Kiesse Domingos',
    createdAt: '2026-06-08T09:30:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
    mainImage: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80',
    ],
    unitOfMeasure: 'unidade',
    costPrice: 75000,
    salePrice: 115000,
    status: 'ativo',
    variations: [],
  },

  // 6. Eletrónicos (Item Único - Usado para testar condition: 'usado')
  {
    id: 'prod-kianda-6',
    name: 'Auscultadores Bluetooth ANC Sony WH-1000XM4 (Revisto)',
    description: 'Fones de ouvido com cancelamento ativo de ruído líder de mercado, áudio de alta resolução LDAC. Equipamento usado totalmente testado e higienizado com garantia de 3 meses.',
    category: 'Eletrónicos',
    condition: 'usado',
    sku: 'KND-ELE-XM4-USD',
    barcode: '4548736112117',
    brand: 'Sony',
    supplierId: 'sup-3',
    createdBy: 'Kiesse Domingos',
    createdAt: '2026-06-09T10:00:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
    mainImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    ],
    unitOfMeasure: 'unidade',
    costPrice: 120000,
    salePrice: 175000,
    status: 'ativo',
    variations: [],
  },

  // 7. Casa & Cozinha (Item Único - Sem variação, Estado: Novo)
  {
    id: 'prod-kianda-7',
    name: 'Conjunto de Panelas Antiaderentes Cerâmica 5 Peças',
    description: 'Jogo de panelas em alumínio fundido com revestimento cerâmico ecológico livre de PTFE/PFOA, cabos soft-touch e tampas de vidro temperado.',
    category: 'Casa & Cozinha',
    condition: 'novo',
    sku: 'KND-CAS-PAN5',
    barcode: '7891116123456',
    brand: 'MasterChef Cook',
    supplierId: 'sup-1', // Distribuidora Angola Lda
    createdBy: 'Kiesse Domingos',
    createdAt: '2026-06-10T11:20:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
    mainImage: 'https://images.unsplash.com/photo-1584990347449-397a0665ec1a?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584990347449-397a0665ec1a?auto=format&fit=crop&w=600&q=80',
    ],
    unitOfMeasure: 'unidade',
    costPrice: 42000,
    salePrice: 68000,
    status: 'ativo',
    variations: [],
  },

  // 8. Animais (Item Único - Saco 15kg, Estado: Novo)
  {
    id: 'prod-kianda-8',
    name: 'Ração Premium Cães Adultos Frango & Arroz 15kg',
    description: 'Alimento completo e balanceado rico em ómega 3 e 6 para cães adultos de médio e grande porte, sem corantes artificiais.',
    category: 'Animais',
    condition: 'novo',
    sku: 'KND-PET-DOG15',
    barcode: '7896005234112',
    brand: 'Royal Canin / Nutripet',
    supplierId: 'sup-4', // Mundo Pet & Agro Angola
    createdBy: 'Kiesse Domingos',
    createdAt: '2026-06-11T14:40:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
    mainImage: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80',
    ],
    unitOfMeasure: 'saco',
    costPrice: 34000,
    salePrice: 49000,
    status: 'ativo',
    variations: [],
  },
];

// ============================================================================
// 5. CONFIGURAÇÕES DE ESTOQUE (LIMITES E LOCALIZAÇÕES FÍSICAS NO ARMAZÉM KIANDA)
// ============================================================================

export const KIANDA_STOCK_CONFIGS: StockConfig[] = [
  {
    productId: 'prod-kianda-1',
    warehouseId: 'wh-kianda',
    minLimit: 10,
    maxLimit: 80,
    physicalLocation: 'Gôndola Games, Prateleira 2',
  },
  {
    productId: 'prod-kianda-2',
    warehouseId: 'wh-kianda',
    minLimit: 15,
    maxLimit: 90,
    physicalLocation: 'Vitrine Acessórios Gamer, Nível 1',
  },
  {
    productId: 'prod-kianda-3',
    warehouseId: 'wh-kianda',
    minLimit: 20,
    maxLimit: 120,
    physicalLocation: 'Arara Central Moda Masculina',
  },
  {
    productId: 'prod-kianda-4',
    warehouseId: 'wh-kianda',
    minLimit: 10,
    maxLimit: 60,
    physicalLocation: 'Módulo Acessórios & Malas 03',
  },
  {
    productId: 'prod-kianda-5',
    warehouseId: 'wh-kianda',
    minLimit: 5,
    maxLimit: 30,
    physicalLocation: 'Cofre Vitrine Smartwatches',
  },
  {
    productId: 'prod-kianda-6',
    warehouseId: 'wh-kianda',
    minLimit: 4,
    maxLimit: 25,
    physicalLocation: 'Vitrine Áudio Premium',
  },
  {
    productId: 'prod-kianda-7',
    warehouseId: 'wh-kianda',
    minLimit: 8,
    maxLimit: 40,
    physicalLocation: 'Prateleira Casa & Cozinha B-04',
  },
  {
    productId: 'prod-kianda-8',
    warehouseId: 'wh-kianda',
    minLimit: 15,
    maxLimit: 80,
    physicalLocation: 'Palete Pet Care, Corredor F',
  },
];

// ============================================================================
// 6. ESTOQUE INICIAL VIA MOVIMENTAÇÕES DE ENTRADA
// REGRA: Nunca inserir quantidade diretamente; estoque é sempre resultado das movimentações.
// ============================================================================

export const KIANDA_INITIAL_MOVEMENTS: Movement[] = [
  // 1. EA Sports FC 25
  {
    id: 'mov-knd-in-1',
    productId: 'prod-kianda-1',
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 50,
    date: '2026-06-12T08:30:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial / Recepção de mercadoria TechLuanda',
    reference: 'DOC-KND-ENT-001',
  },

  // 2. Comando Wireless (Variações)
  {
    id: 'mov-knd-in-2-1',
    productId: 'prod-kianda-2',
    variationId: 'var-knd-2-1', // Preto
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 35,
    date: '2026-06-12T08:45:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial - Comando Wireless (Preto Midnight)',
    reference: 'DOC-KND-ENT-002',
  },
  {
    id: 'mov-knd-in-2-2',
    productId: 'prod-kianda-2',
    variationId: 'var-knd-2-2', // Branco
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 30,
    date: '2026-06-12T08:46:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial - Comando Wireless (Branco Lunar)',
    reference: 'DOC-KND-ENT-002',
  },
  {
    id: 'mov-knd-in-2-3',
    productId: 'prod-kianda-2',
    variationId: 'var-knd-2-3', // Vermelho
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 25,
    date: '2026-06-12T08:47:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial - Comando Wireless (Vermelho Cosmic)',
    reference: 'DOC-KND-ENT-002',
  },

  // 3. Camisa Polo Masculina (Variações de Cor e Tamanho)
  {
    id: 'mov-knd-in-3-1',
    productId: 'prod-kianda-3',
    variationId: 'var-knd-3-1', // Azul M
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 40,
    date: '2026-06-14T09:00:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial - Camisa Polo (Azul Marinho M)',
    reference: 'DOC-KND-ENT-003',
  },
  {
    id: 'mov-knd-in-3-2',
    productId: 'prod-kianda-3',
    variationId: 'var-knd-3-2', // Azul L
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 35,
    date: '2026-06-14T09:01:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial - Camisa Polo (Azul Marinho L)',
    reference: 'DOC-KND-ENT-003',
  },
  {
    id: 'mov-knd-in-3-3',
    productId: 'prod-kianda-3',
    variationId: 'var-knd-3-3', // Branco M
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 35,
    date: '2026-06-14T09:02:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial - Camisa Polo (Branco Neve M)',
    reference: 'DOC-KND-ENT-003',
  },
  {
    id: 'mov-knd-in-3-4',
    productId: 'prod-kianda-3',
    variationId: 'var-knd-3-4', // Preto XL
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 30,
    date: '2026-06-14T09:03:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial - Camisa Polo (Preto Ónix XL)',
    reference: 'DOC-KND-ENT-003',
  },

  // 4. Mochila Executiva (Variações)
  {
    id: 'mov-knd-in-4-1',
    productId: 'prod-kianda-4',
    variationId: 'var-knd-4-1', // Cinza
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 30,
    date: '2026-06-15T10:15:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial - Mochila Antifurto (Cinza Espacial)',
    reference: 'DOC-KND-ENT-004',
  },
  {
    id: 'mov-knd-in-4-2',
    productId: 'prod-kianda-4',
    variationId: 'var-knd-4-2', // Preto
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 35,
    date: '2026-06-15T10:16:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial - Mochila Antifurto (Preto Carbono)',
    reference: 'DOC-KND-ENT-004',
  },

  // 5. Smartwatch Amazfit GTR 4 (Seminovo)
  {
    id: 'mov-knd-in-5',
    productId: 'prod-kianda-5',
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 18,
    date: '2026-06-16T11:00:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial - Lote Vitrine Amazfit GTR 4',
    reference: 'DOC-KND-ENT-005',
  },

  // 6. Auscultadores Bluetooth Sony WH-1000XM4 (Usado)
  {
    id: 'mov-knd-in-6',
    productId: 'prod-kianda-6',
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 14,
    date: '2026-06-16T11:30:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial - Lote Testado Sony WH-1000XM4',
    reference: 'DOC-KND-ENT-006',
  },

  // 7. Conjunto de Panelas Cerâmica
  {
    id: 'mov-knd-in-7',
    productId: 'prod-kianda-7',
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 30,
    date: '2026-06-18T14:00:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial - Conjunto de Panelas Cerâmica 5 Pçs',
    reference: 'DOC-KND-ENT-007',
  },

  // 8. Ração Premium Cães 15kg
  {
    id: 'mov-knd-in-8',
    productId: 'prod-kianda-8',
    warehouseId: 'wh-kianda',
    type: 'entrada',
    quantity: 60,
    date: '2026-06-20T15:30:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Entrada de estoque inicial - Ração Cães Adultos 15kg Mundo Pet',
    reference: 'DOC-KND-ENT-008',
  },
];

// ============================================================================
// 7. HISTÓRICO DE VENDAS FICTÍCIAS (30 VENDAS REALISTAS EM 3 MESES)
// Distribuídas ao longo de Julho, Agosto e Setembro de 2026.
// Semana passada (07/09 a 13/09) e semana atual (14/09 a 16/09) com dados precisos
// para gerar variação nítida e duas linhas no Dashboard!
// ============================================================================

export const KIANDA_SALES: Sale[] = [
  // ----------------------------------------------------
  // JULHO 2026 (6 VENDAS - Início da operação)
  // ----------------------------------------------------
  {
    id: 'VND-KND-01',
    date: '2026-07-04T10:15:00.000Z',
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-01-1',
        productId: 'prod-kianda-1',
        productName: 'Jogo EA Sports FC 25 PS5',
        productSku: 'KND-GAM-FC25',
        quantity: 1,
        unitPrice: 64000,
        subtotal: 64000,
      },
      {
        id: 'si-knd-01-2',
        productId: 'prod-kianda-2',
        productName: 'Comando Sem Fios Pro Wireless Gamepad',
        productSku: 'KND-GAM-PAD',
        variationId: 'var-knd-2-1',
        variationSku: 'KND-GAM-PAD-BLK',
        variationDetails: 'Preto Midnight',
        quantity: 1,
        unitPrice: 42000,
        subtotal: 42000,
      },
    ],
    paymentMethod: 'multicaixa',
    total: 106000,
    status: 'concluida',
    requiresTransport: false,
    notes: 'Venda balcão de abertura',
  },
  {
    id: 'VND-KND-02',
    date: '2026-07-11T14:30:00.000Z',
    seller: 'Kiesse Domingos',
    clientId: 'cli-1',
    clientName: 'Manuel Gonçalves de Carvalho',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-02-1',
        productId: 'prod-kianda-3',
        productName: 'Camisa Polo Masculina Piquet Classic',
        productSku: 'KND-MOD-POLO',
        variationId: 'var-knd-3-1',
        variationSku: 'KND-MOD-POLO-NAVY-M',
        variationDetails: 'Azul Marinho / M',
        quantity: 2,
        unitPrice: 18500,
        subtotal: 37000,
      },
      {
        id: 'si-knd-02-2',
        productId: 'prod-kianda-4',
        productName: 'Mochila Executiva Antifurto Impermeável',
        productSku: 'KND-MOD-BAG',
        variationId: 'var-knd-4-2',
        variationSku: 'KND-MOD-BAG-BLK',
        variationDetails: 'Preto Carbono',
        quantity: 1,
        unitPrice: 34000,
        subtotal: 34000,
      },
    ],
    paymentMethod: 'transferencia',
    total: 71000,
    status: 'concluida',
    requiresTransport: true,
    transportId: 'TRP-KND-01',
    notes: 'Entrega domiciliar em Talatona',
  },
  {
    id: 'VND-KND-03',
    date: '2026-07-18T16:00:00.000Z',
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-03-1',
        productId: 'prod-kianda-7',
        productName: 'Conjunto de Panelas Antiaderentes Cerâmica 5 Peças',
        productSku: 'KND-CAS-PAN5',
        quantity: 1,
        unitPrice: 68000,
        subtotal: 68000,
      },
    ],
    paymentMethod: 'dinheiro',
    total: 68000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-04',
    date: '2026-07-22T11:20:00.000Z',
    seller: 'Kiesse Domingos',
    clientId: 'cli-4',
    clientName: 'António Pedro Silva',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-04-1',
        productId: 'prod-kianda-1',
        productName: 'Jogo EA Sports FC 25 PS5',
        productSku: 'KND-GAM-FC25',
        quantity: 1,
        unitPrice: 64000,
        subtotal: 64000,
      },
    ],
    paymentMethod: 'multicaixa',
    total: 64000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-05',
    date: '2026-07-26T15:45:00.000Z',
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-05-1',
        productId: 'prod-kianda-8',
        productName: 'Ração Premium Cães Adultos Frango & Arroz 15kg',
        productSku: 'KND-PET-DOG15',
        quantity: 2,
        unitPrice: 49000,
        subtotal: 98000,
      },
    ],
    paymentMethod: 'tpa',
    total: 98000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-06',
    date: '2026-07-30T17:10:00.000Z',
    seller: 'Kiesse Domingos',
    clientId: 'cli-3',
    clientName: 'Dra. Teresa Van-Dúnem',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-06-1',
        productId: 'prod-kianda-5',
        productName: 'Smartwatch Amazfit GTR 4 AMOLED (Excelente Estado)',
        productSku: 'KND-ELE-GTR4-EX',
        quantity: 1,
        unitPrice: 115000,
        subtotal: 115000,
      },
    ],
    paymentMethod: 'transferencia',
    total: 115000,
    status: 'concluida',
    requiresTransport: false,
  },

  // ----------------------------------------------------
  // AGOSTO 2026 (9 VENDAS - Mês Passado)
  // ----------------------------------------------------
  {
    id: 'VND-KND-07',
    date: '2026-08-03T10:00:00.000Z',
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-07-1',
        productId: 'prod-kianda-3',
        productName: 'Camisa Polo Masculina Piquet Classic',
        productSku: 'KND-MOD-POLO',
        variationId: 'var-knd-3-3',
        variationSku: 'KND-MOD-POLO-WHT-M',
        variationDetails: 'Branco Neve / M',
        quantity: 2,
        unitPrice: 18500,
        subtotal: 37000,
      },
      {
        id: 'si-knd-07-2',
        productId: 'prod-kianda-3',
        productName: 'Camisa Polo Masculina Piquet Classic',
        productSku: 'KND-MOD-POLO',
        variationId: 'var-knd-3-4',
        variationSku: 'KND-MOD-POLO-BLK-XL',
        variationDetails: 'Preto Ónix / XL',
        quantity: 1,
        unitPrice: 20000,
        subtotal: 20000,
      },
    ],
    paymentMethod: 'multicaixa',
    total: 57000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-08',
    date: '2026-08-08T14:15:00.000Z',
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-08-1',
        productId: 'prod-kianda-6',
        productName: 'Auscultadores Bluetooth ANC Sony WH-1000XM4 (Revisto)',
        productSku: 'KND-ELE-XM4-USD',
        quantity: 1,
        unitPrice: 175000,
        subtotal: 175000,
      },
    ],
    paymentMethod: 'transferencia',
    total: 175000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-09',
    date: '2026-08-14T11:40:00.000Z',
    seller: 'Kiesse Domingos',
    clientId: 'cli-2',
    clientName: 'Nova Horizonte Consultoria, Lda.',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-09-1',
        productId: 'prod-kianda-4',
        productName: 'Mochila Executiva Antifurto Impermeável',
        productSku: 'KND-MOD-BAG',
        variationId: 'var-knd-4-1',
        variationSku: 'KND-MOD-BAG-GRY',
        variationDetails: 'Cinza Espacial',
        quantity: 3,
        unitPrice: 32000,
        subtotal: 96000,
      },
    ],
    paymentMethod: 'transferencia',
    total: 96000,
    status: 'concluida',
    requiresTransport: true,
    transportId: 'TRP-KND-02',
    notes: 'Faturação corporativa',
  },
  {
    id: 'VND-KND-10',
    date: '2026-08-19T16:20:00.000Z',
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-10-1',
        productId: 'prod-kianda-2',
        productName: 'Comando Sem Fios Pro Wireless Gamepad',
        productSku: 'KND-GAM-PAD',
        variationId: 'var-knd-2-3',
        variationSku: 'KND-GAM-PAD-RED',
        variationDetails: 'Vermelho Cosmic',
        quantity: 1,
        unitPrice: 45000,
        subtotal: 45000,
      },
      {
        id: 'si-knd-10-2',
        productId: 'prod-kianda-1',
        productName: 'Jogo EA Sports FC 25 PS5',
        productSku: 'KND-GAM-FC25',
        quantity: 1,
        unitPrice: 64000,
        subtotal: 64000,
      },
    ],
    paymentMethod: 'multicaixa',
    total: 109000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-11',
    date: '2026-08-24T12:00:00.000Z',
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-11-1',
        productId: 'prod-kianda-8',
        productName: 'Ração Premium Cães Adultos Frango & Arroz 15kg',
        productSku: 'KND-PET-DOG15',
        quantity: 1,
        unitPrice: 49000,
        subtotal: 49000,
      },
    ],
    paymentMethod: 'dinheiro',
    total: 49000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-12',
    date: '2026-08-27T15:10:00.000Z',
    seller: 'Kiesse Domingos',
    clientId: 'cli-1',
    clientName: 'Manuel Gonçalves de Carvalho',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-12-1',
        productId: 'prod-kianda-7',
        productName: 'Conjunto de Panelas Antiaderentes Cerâmica 5 Peças',
        productSku: 'KND-CAS-PAN5',
        quantity: 1,
        unitPrice: 68000,
        subtotal: 68000,
      },
    ],
    paymentMethod: 'tpa',
    total: 68000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-13',
    date: '2026-08-29T10:30:00.000Z',
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-13-1',
        productId: 'prod-kianda-5',
        productName: 'Smartwatch Amazfit GTR 4 AMOLED (Excelente Estado)',
        productSku: 'KND-ELE-GTR4-EX',
        quantity: 1,
        unitPrice: 115000,
        subtotal: 115000,
      },
      {
        id: 'si-knd-13-2',
        productId: 'prod-kianda-2',
        productName: 'Comando Sem Fios Pro Wireless Gamepad',
        productSku: 'KND-GAM-PAD',
        variationId: 'var-knd-2-2',
        variationSku: 'KND-GAM-PAD-WHT',
        variationDetails: 'Branco Lunar',
        quantity: 1,
        unitPrice: 42000,
        subtotal: 42000,
      },
    ],
    paymentMethod: 'multicaixa',
    total: 157000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-14',
    date: '2026-08-30T17:00:00.000Z',
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-14-1',
        productId: 'prod-kianda-3',
        productName: 'Camisa Polo Masculina Piquet Classic',
        productSku: 'KND-MOD-POLO',
        variationId: 'var-knd-3-2',
        variationSku: 'KND-MOD-POLO-NAVY-L',
        variationDetails: 'Azul Marinho / L',
        quantity: 3,
        unitPrice: 18500,
        subtotal: 55500,
      },
    ],
    paymentMethod: 'dinheiro',
    total: 55500,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-15',
    date: '2026-08-31T18:30:00.000Z',
    seller: 'Kiesse Domingos',
    clientId: 'cli-4',
    clientName: 'António Pedro Silva',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-15-1',
        productId: 'prod-kianda-6',
        productName: 'Auscultadores Bluetooth ANC Sony WH-1000XM4 (Revisto)',
        productSku: 'KND-ELE-XM4-USD',
        quantity: 1,
        unitPrice: 175000,
        subtotal: 175000,
      },
    ],
    paymentMethod: 'transferencia',
    total: 175000,
    status: 'concluida',
    requiresTransport: false,
  },

  // ----------------------------------------------------
  // SEMANA PASSADA (07/09/2026 a 13/09/2026 - 7 VENDAS)
  // ----------------------------------------------------
  {
    id: 'VND-KND-16',
    date: '2026-09-07T11:00:00.000Z', // Segunda
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-16-1',
        productId: 'prod-kianda-1',
        productName: 'Jogo EA Sports FC 25 PS5',
        productSku: 'KND-GAM-FC25',
        quantity: 2,
        unitPrice: 64000,
        subtotal: 128000,
      },
    ],
    paymentMethod: 'multicaixa',
    total: 128000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-17',
    date: '2026-09-08T14:20:00.000Z', // Terça
    seller: 'Kiesse Domingos',
    clientId: 'cli-3',
    clientName: 'Dra. Teresa Van-Dúnem',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-17-1',
        productId: 'prod-kianda-4',
        productName: 'Mochila Executiva Antifurto Impermeável',
        productSku: 'KND-MOD-BAG',
        variationId: 'var-knd-4-2',
        variationSku: 'KND-MOD-BAG-BLK',
        variationDetails: 'Preto Carbono',
        quantity: 1,
        unitPrice: 34000,
        subtotal: 34000,
      },
      {
        id: 'si-knd-17-2',
        productId: 'prod-kianda-3',
        productName: 'Camisa Polo Masculina Piquet Classic',
        productSku: 'KND-MOD-POLO',
        variationId: 'var-knd-3-1',
        variationSku: 'KND-MOD-POLO-NAVY-M',
        variationDetails: 'Azul Marinho / M',
        quantity: 1,
        unitPrice: 18500,
        subtotal: 18500,
      },
    ],
    paymentMethod: 'tpa',
    total: 52500,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-18',
    date: '2026-09-09T16:45:00.000Z', // Quarta
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-18-1',
        productId: 'prod-kianda-8',
        productName: 'Ração Premium Cães Adultos Frango & Arroz 15kg',
        productSku: 'KND-PET-DOG15',
        quantity: 3,
        unitPrice: 49000,
        subtotal: 147000,
      },
    ],
    paymentMethod: 'multicaixa',
    total: 147000,
    status: 'concluida',
    requiresTransport: true,
    transportId: 'TRP-KND-03',
    notes: 'Entrega de ração pesada',
  },
  {
    id: 'VND-KND-19',
    date: '2026-09-10T10:15:00.000Z', // Quinta
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-19-1',
        productId: 'prod-kianda-2',
        productName: 'Comando Sem Fios Pro Wireless Gamepad',
        productSku: 'KND-GAM-PAD',
        variationId: 'var-knd-2-1',
        variationSku: 'KND-GAM-PAD-BLK',
        variationDetails: 'Preto Midnight',
        quantity: 2,
        unitPrice: 42000,
        subtotal: 84000,
      },
    ],
    paymentMethod: 'dinheiro',
    total: 84000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-20',
    date: '2026-09-11T15:30:00.000Z', // Sexta
    seller: 'Kiesse Domingos',
    clientId: 'cli-1',
    clientName: 'Manuel Gonçalves de Carvalho',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-20-1',
        productId: 'prod-kianda-5',
        productName: 'Smartwatch Amazfit GTR 4 AMOLED (Excelente Estado)',
        productSku: 'KND-ELE-GTR4-EX',
        quantity: 1,
        unitPrice: 115000,
        subtotal: 115000,
      },
    ],
    paymentMethod: 'transferencia',
    total: 115000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-21',
    date: '2026-09-12T11:45:00.000Z', // Sábado
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-21-1',
        productId: 'prod-kianda-7',
        productName: 'Conjunto de Panelas Antiaderentes Cerâmica 5 Peças',
        productSku: 'KND-CAS-PAN5',
        quantity: 2,
        unitPrice: 68000,
        subtotal: 136000,
      },
    ],
    paymentMethod: 'multicaixa',
    total: 136000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-22',
    date: '2026-09-13T16:00:00.000Z', // Domingo
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-22-1',
        productId: 'prod-kianda-3',
        productName: 'Camisa Polo Masculina Piquet Classic',
        productSku: 'KND-MOD-POLO',
        variationId: 'var-knd-3-3',
        variationSku: 'KND-MOD-POLO-WHT-M',
        variationDetails: 'Branco Neve / M',
        quantity: 2,
        unitPrice: 18500,
        subtotal: 37000,
      },
      {
        id: 'si-knd-22-2',
        productId: 'prod-kianda-1',
        productName: 'Jogo EA Sports FC 25 PS5',
        productSku: 'KND-GAM-FC25',
        quantity: 1,
        unitPrice: 64000,
        subtotal: 64000,
      },
    ],
    paymentMethod: 'multicaixa',
    total: 101000,
    status: 'concluida',
    requiresTransport: false,
  },

  // ----------------------------------------------------
  // SEMANA ATUAL (14/09/2026 a 16/09/2026 - 8 VENDAS)
  // Mostra excelente desempenho e comparativo dinâmico
  // ----------------------------------------------------
  {
    id: 'VND-KND-23',
    date: '2026-09-14T09:30:00.000Z', // Segunda
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-23-1',
        productId: 'prod-kianda-1',
        productName: 'Jogo EA Sports FC 25 PS5',
        productSku: 'KND-GAM-FC25',
        quantity: 3,
        unitPrice: 64000,
        subtotal: 192000,
      },
    ],
    paymentMethod: 'multicaixa',
    total: 192000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-24',
    date: '2026-09-14T14:40:00.000Z', // Segunda
    seller: 'Kiesse Domingos',
    clientId: 'cli-2',
    clientName: 'Nova Horizonte Consultoria, Lda.',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-24-1',
        productId: 'prod-kianda-4',
        productName: 'Mochila Executiva Antifurto Impermeável',
        productSku: 'KND-MOD-BAG',
        variationId: 'var-knd-4-2',
        variationSku: 'KND-MOD-BAG-BLK',
        variationDetails: 'Preto Carbono',
        quantity: 2,
        unitPrice: 34000,
        subtotal: 68000,
      },
      {
        id: 'si-knd-24-2',
        productId: 'prod-kianda-3',
        productName: 'Camisa Polo Masculina Piquet Classic',
        productSku: 'KND-MOD-POLO',
        variationId: 'var-knd-3-2',
        variationSku: 'KND-MOD-POLO-NAVY-L',
        variationDetails: 'Azul Marinho / L',
        quantity: 2,
        unitPrice: 18500,
        subtotal: 37000,
      },
    ],
    paymentMethod: 'transferencia',
    total: 105000,
    status: 'concluida',
    requiresTransport: true,
    transportId: 'TRP-KND-04',
    notes: 'Entrega na sede da consultoria',
  },
  {
    id: 'VND-KND-25',
    date: '2026-09-15T10:15:00.000Z', // Terça
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-25-1',
        productId: 'prod-kianda-6',
        productName: 'Auscultadores Bluetooth ANC Sony WH-1000XM4 (Revisto)',
        productSku: 'KND-ELE-XM4-USD',
        quantity: 1,
        unitPrice: 175000,
        subtotal: 175000,
      },
      {
        id: 'si-knd-25-2',
        productId: 'prod-kianda-2',
        productName: 'Comando Sem Fios Pro Wireless Gamepad',
        productSku: 'KND-GAM-PAD',
        variationId: 'var-knd-2-3',
        variationSku: 'KND-GAM-PAD-RED',
        variationDetails: 'Vermelho Cosmic',
        quantity: 1,
        unitPrice: 45000,
        subtotal: 45000,
      },
    ],
    paymentMethod: 'transferencia',
    total: 220000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-26',
    date: '2026-09-15T15:00:00.000Z', // Terça
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-26-1',
        productId: 'prod-kianda-8',
        productName: 'Ração Premium Cães Adultos Frango & Arroz 15kg',
        productSku: 'KND-PET-DOG15',
        quantity: 2,
        unitPrice: 49000,
        subtotal: 98000,
      },
    ],
    paymentMethod: 'tpa',
    total: 98000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-27',
    date: '2026-09-15T17:30:00.000Z', // Terça
    seller: 'Kiesse Domingos',
    clientId: 'cli-4',
    clientName: 'António Pedro Silva',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-27-1',
        productId: 'prod-kianda-3',
        productName: 'Camisa Polo Masculina Piquet Classic',
        productSku: 'KND-MOD-POLO',
        variationId: 'var-knd-3-4',
        variationSku: 'KND-MOD-POLO-BLK-XL',
        variationDetails: 'Preto Ónix / XL',
        quantity: 2,
        unitPrice: 20000,
        subtotal: 40000,
      },
      {
        id: 'si-knd-27-2',
        productId: 'prod-kianda-1',
        productName: 'Jogo EA Sports FC 25 PS5',
        productSku: 'KND-GAM-FC25',
        quantity: 1,
        unitPrice: 64000,
        subtotal: 64000,
      },
    ],
    paymentMethod: 'multicaixa',
    total: 104000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-28',
    date: '2026-09-16T11:00:00.000Z', // Quarta (Hoje)
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-28-1',
        productId: 'prod-kianda-7',
        productName: 'Conjunto de Panelas Antiaderentes Cerâmica 5 Peças',
        productSku: 'KND-CAS-PAN5',
        quantity: 2,
        unitPrice: 68000,
        subtotal: 136000,
      },
    ],
    paymentMethod: 'multicaixa',
    total: 136000,
    status: 'concluida',
    requiresTransport: false,
  },
  {
    id: 'VND-KND-29',
    date: '2026-09-16T14:20:00.000Z', // Quarta (Hoje)
    seller: 'Kiesse Domingos',
    clientId: 'cli-3',
    clientName: 'Dra. Teresa Van-Dúnem',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-29-1',
        productId: 'prod-kianda-5',
        productName: 'Smartwatch Amazfit GTR 4 AMOLED (Excelente Estado)',
        productSku: 'KND-ELE-GTR4-EX',
        quantity: 1,
        unitPrice: 115000,
        subtotal: 115000,
      },
      {
        id: 'si-knd-29-2',
        productId: 'prod-kianda-4',
        productName: 'Mochila Executiva Antifurto Impermeável',
        productSku: 'KND-MOD-BAG',
        variationId: 'var-knd-4-1',
        variationSku: 'KND-MOD-BAG-GRY',
        variationDetails: 'Cinza Espacial',
        quantity: 1,
        unitPrice: 32000,
        subtotal: 32000,
      },
    ],
    paymentMethod: 'transferencia',
    total: 147000,
    status: 'concluida',
    requiresTransport: true,
    transportId: 'TRP-KND-05',
    notes: 'Entrega na clínica',
  },
  {
    id: 'VND-KND-30',
    date: '2026-09-16T18:00:00.000Z', // Quarta (Hoje)
    seller: 'Kiesse Domingos',
    warehouseId: 'wh-kianda',
    items: [
      {
        id: 'si-knd-30-1',
        productId: 'prod-kianda-2',
        productName: 'Comando Sem Fios Pro Wireless Gamepad',
        productSku: 'KND-GAM-PAD',
        variationId: 'var-knd-2-1',
        variationSku: 'KND-GAM-PAD-BLK',
        variationDetails: 'Preto Midnight',
        quantity: 2,
        unitPrice: 42000,
        subtotal: 84000,
      },
      {
        id: 'si-knd-30-2',
        productId: 'prod-kianda-3',
        productName: 'Camisa Polo Masculina Piquet Classic',
        productSku: 'KND-MOD-POLO',
        variationId: 'var-knd-3-1',
        variationSku: 'KND-MOD-POLO-NAVY-M',
        variationDetails: 'Azul Marinho / M',
        quantity: 1,
        unitPrice: 18500,
        subtotal: 18500,
      },
    ],
    paymentMethod: 'dinheiro',
    total: 102500,
    status: 'concluida',
    requiresTransport: false,
    notes: 'Fecho do expediente',
  },
];

// ============================================================================
// 8. MOVIMENTAÇÕES DE SAÍDA GERADAS PELAS VENDAS
// REGRA DO SISTEMA: Cada venda gera automaticamente a saída do estoque correspondente
// ============================================================================

export const KIANDA_SALE_MOVEMENTS: Movement[] = KIANDA_SALES.flatMap((sale) =>
  sale.items.map((item, idx) => ({
    id: `mov-knd-sale-${sale.id}-${idx}`,
    productId: item.productId,
    variationId: item.variationId,
    warehouseId: sale.warehouseId,
    type: 'saida' as const,
    quantity: item.quantity,
    date: sale.date,
    responsible: sale.seller,
    reason: `Venda ${sale.id}: ${item.quantity}x ${item.productName}${
      item.variationDetails ? ` (${item.variationDetails})` : ''
    }`,
    reference: `Venda #${sale.id}`,
  }))
);

// ============================================================================
// 9. MOVIMENTAÇÕES BANCÁRIAS NO BANCO KIANDA
// REGRA DO SISTEMA: Entrada de capital + Cada venda gera receita de entrada no banco
// ============================================================================

export const KIANDA_BANK_MOVEMENTS: BankMovement[] = [
  // Aporte Inicial de Capital da Loja Kianda
  {
    id: 'bmov-knd-cap-01',
    bankId: 'bank-kianda',
    type: 'entrada',
    amount: 2500000,
    date: '2026-06-01T09:00:00.000Z',
    responsible: 'Kiesse Domingos',
    reason: 'Aporte de Capital Inicial / Abertura de Conta Loja Kianda',
    reference: 'DEP-KND-001',
  },
  // Receita de cada uma das 30 vendas
  ...KIANDA_SALES.map((sale) => ({
    id: `bmov-knd-sale-${sale.id}`,
    bankId: 'bank-kianda',
    type: 'entrada' as const,
    category: 'Venda' as const,
    amount: sale.total,
    date: sale.date,
    responsible: sale.seller,
    reason: `Receita da Venda #${sale.id} (${sale.items.length} ${
      sale.items.length === 1 ? 'item' : 'itens'
    } - ${sale.paymentMethod})`,
    reference: `Venda #${sale.id}`,
  })),
];

// ============================================================================
// 10. TRANSPORTES GERADOS PELAS VENDAS COM ENTREGA
// ============================================================================

export const KIANDA_TRANSPORTS: Transport[] = [
  {
    id: 'TRP-KND-01',
    saleId: 'VND-KND-02',
    deliveryAddress: 'Condomínio Vila Flor, Casa 14B, Talatona, Luanda',
    responsible: 'Kiesse Domingos',
    driver: 'Domingos António (Estafeta Kianda)',
    vehicle: 'Moto Yamaha YBR 125 (LD-44-12-FK)',
    trackingCode: 'TRK-KND-8812',
    cost: 3500,
    status: 'entregue',
    estimatedDeliveryDate: '2026-07-12',
    actualDeliveryDate: '2026-07-12',
    deliveredAt: '2026-07-12T11:00:00.000Z',
    notes: 'Entregue em mãos ao Sr. Manuel',
    createdAt: '2026-07-11T14:30:00.000Z',
  },
  {
    id: 'TRP-KND-02',
    saleId: 'VND-KND-09',
    deliveryAddress: 'Edifício Kilamba, 4º Andar, Escritório 402, Marginal de Luanda',
    responsible: 'Kiesse Domingos',
    driver: 'Domingos António',
    vehicle: 'Viatura Kianda Express (LD-90-88-GG)',
    trackingCode: 'TRK-KND-8845',
    cost: 5000,
    status: 'entregue',
    estimatedDeliveryDate: '2026-08-15',
    actualDeliveryDate: '2026-08-15',
    deliveredAt: '2026-08-15T10:30:00.000Z',
    notes: 'Entregue na receção da Nova Horizonte',
    createdAt: '2026-08-14T11:40:00.000Z',
  },
  {
    id: 'TRP-KND-03',
    saleId: 'VND-KND-18',
    deliveryAddress: 'Rua Rainha Ginga, Vivenda 12, Luanda',
    responsible: 'Kiesse Domingos',
    driver: 'Mateus Gaspar',
    vehicle: 'Carrinha Isuzu Pick-up (LD-31-00-HP)',
    trackingCode: 'TRK-KND-8902',
    cost: 6000,
    status: 'entregue',
    estimatedDeliveryDate: '2026-09-10',
    actualDeliveryDate: '2026-09-10',
    deliveredAt: '2026-09-10T14:00:00.000Z',
    notes: 'Carga pesada de 3 sacos de 15kg descarregada no quintal',
    createdAt: '2026-09-09T16:45:00.000Z',
  },
  {
    id: 'TRP-KND-04',
    saleId: 'VND-KND-24',
    deliveryAddress: 'Edifício Kilamba, 4º Andar, Escritório 402, Marginal de Luanda',
    responsible: 'Kiesse Domingos',
    driver: 'Domingos António',
    vehicle: 'Moto Yamaha YBR 125',
    trackingCode: 'TRK-KND-8944',
    cost: 3500,
    status: 'entregue',
    estimatedDeliveryDate: '2026-09-15',
    actualDeliveryDate: '2026-09-15',
    deliveredAt: '2026-09-15T11:15:00.000Z',
    notes: 'Mochilas e polos entregues',
    createdAt: '2026-09-14T14:40:00.000Z',
  },
  {
    id: 'TRP-KND-05',
    saleId: 'VND-KND-29',
    deliveryAddress: 'Rua Comandante Gika nº 45, Alvalade, Luanda',
    responsible: 'Kiesse Domingos',
    driver: 'Domingos António',
    vehicle: 'Moto Yamaha YBR 125',
    trackingCode: 'TRK-KND-8970',
    cost: 4000,
    status: 'em_transito',
    estimatedDeliveryDate: '2026-09-17',
    notes: 'Ligar 15 minutos antes da chegada à clínica',
    createdAt: '2026-09-16T14:20:00.000Z',
  },
];
