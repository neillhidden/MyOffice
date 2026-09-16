export type UnitOfMeasure = 
  | 'unidade' 
  | 'kg' 
  | 'litro' 
  | 'caixa' 
  | 'metro' 
  | 'pacote' 
  | 'saco' 
  | 'par';

export type ProductStatus = 'ativo' | 'inativo' | 'descontinuado';

export type ProductCondition = 'novo' | 'novo_usado' | 'usado' | 'troca';

export interface CategoryDefinition {
  name: string;
  icon: string;
  subcategories?: string[];
}

export interface ProductVariation {
  id: string;
  color?: string;
  colorHex?: string;
  size?: string;
  sku: string;
  image?: string;
  additionalPrice: number; // in Kz
  quantity?: number; // Quantidade específica da variação
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  condition: ProductCondition;
  sku: string;
  barcode?: string;
  brand: string;
  supplierId: string;
  createdBy: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  mainImage: string;
  gallery: string[];
  unitOfMeasure: UnitOfMeasure;
  costPrice: number; // Kwanza
  salePrice: number; // Kwanza
  status: ProductStatus;
  variations: ProductVariation[];
  isDraft?: boolean;
}

export interface ProductDraft {
  id: string;
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  condition?: ProductCondition;
  brand?: string;
  unitOfMeasure?: UnitOfMeasure;
  sku?: string;
  barcode?: string;
  costPrice?: number | '';
  salePrice?: number | '';
  supplierId?: string;
  mainImage?: string;
  gallery?: string[];
  variations?: ProductVariation[];
  initialWarehouseId?: string;
  minLimit?: number;
  maxLimit?: number;
  physicalLocation?: string;
  stockConfig?: {
    warehouseId: string;
    minLimit: number;
    maxLimit: number;
    physicalLocation?: string;
  };
  currentStep: 1 | 2 | 3;
  savedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string; // phone/WhatsApp
  email?: string;
  address: string;
  platform?: string; // Plataforma/Loja de origem (1688, Taobao, Alibaba, AliExpress, Fornecedor Local, etc.)
  status?: 'ativo' | 'inativo';
  categories?: string[];
  notes?: string;
  createdAt: string;
}

export type WarehouseType = 'armazem' | 'loja_fisica';
export type WarehouseStatus = 'ativo' | 'inativo';

export type CompanyCurrency = 'Kz' | 'USD';
export type CompanyStatus = 'ativa' | 'inativa';

export interface Company {
  id: string;
  name: string; // Nome da empresa
  nif: string; // Número de identificação fiscal
  address: string; // Endereço
  contact: string; // Telefone / email
  logo?: string; // Logótipo (opcional)
  currency: CompanyCurrency; // Moeda padrão (Kz / USD)
  principalBankId?: string; // Banco principal vinculado à empresa
  status: CompanyStatus; // Status: ativa / inativa
  createdAt: string; // Data de criação
  updatedAt: string; // Última atualização
}

export interface Warehouse {
  id: string;
  companyId: string; // Empresa proprietária obrigatória
  name: string;
  type: WarehouseType;
  address: string;
  manager: string;
  contact: string;
  status: WarehouseStatus;
}

export interface StockConfig {
  productId: string;
  variationId?: string;
  warehouseId: string;
  minLimit: number;
  maxLimit: number;
  physicalLocation?: string; // e.g. "Corredor 3, Prateleira B"
}

export type MovementType = 
  | 'entrada' 
  | 'saida' 
  | 'transferencia' 
  | 'ajuste' 
  | 'defeituoso';

export interface Movement {
  id: string;
  productId: string;
  variationId?: string;
  warehouseId: string; // origin or affected warehouse
  destinationWarehouseId?: string; // in case of transfer
  type: MovementType;
  quantity: number;
  date: string; // ISO
  responsible: string;
  reason: string;
  reference?: string; // e.g. "Ordem de Compra #44", "Venda #1032"
}

export type DefectReason = 
  | 'dano_transporte' 
  | 'defeito_fabrica' 
  | 'vencido' 
  | 'outro';

export type DefectDecision = 
  | 'descartar' 
  | 'devolver_fornecedor' 
  | 'reparar' 
  | 'vender_com_desconto';

export type DefectStatus = 'pendente' | 'resolvido';

export interface DefectiveRecord {
  id: string;
  productId: string;
  variationId?: string;
  warehouseId: string;
  quantity: number;
  reason: DefectReason;
  date: string;
  responsible: string;
  decision: DefectDecision;
  status: DefectStatus;
  movementId: string;
  notes?: string;
  resolvedAt?: string;
}

// Purchase List 3-level Hierarchy
export interface PurchaseGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseListStatus = 'cotando' | 'aprovado' | 'comprado' | 'cancelado';

export interface PurchaseList {
  id: string;
  groupId?: string | null; // null for "Sem grupo"
  name: string;
  category: string;
  status: PurchaseListStatus;
  mainImage?: string;
  gallery: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SourceAvailability = 'em_estoque' | 'sob_encomenda' | 'esgotado';

export interface PurchaseSource {
  id: string;
  listId: string;
  storeName: string; // Amazon, Alibaba, AliExpress, Temu, 1688, eBay, Fornecedor Local, etc.
  link?: string;
  unitPrice: number;
  originalCurrency: 'USD' | 'EUR' | 'CNY' | 'KZ';
  approxKzRate: number; // e.g. 920 for USD
  quantity: number;
  shippingCost: number; // in original currency
  otherCosts: number; // in original currency
  totalPrice: number; // calculated: (unitPrice * qty + shippingCost + otherCosts) in original currency
  supplierName?: string;
  salesCount?: number;
  availability: SourceAvailability;
  notes?: string;
  isAccounted: boolean; // "contabilizar" checkbox
}

// ==========================================
// MÓDULO BANCO (Contas Financeiras e Auditoria)
// ==========================================

export type BankType = 'banco_fisico' | 'carteira_digital' | 'corrente' | 'poupanca' | 'caixa_fisico' | 'outro';
export type BankStatus = 'ativo' | 'inativo' | 'ativa' | 'inativa';

export interface Bank {
  id: string;
  name: string; // ex: "BAI Kwanza", "Wallet USD", "Banco BFA"
  type: BankType;
  currency: string; // ex: "Kz", "USD", "EUR"
  accountNumber?: string;
  iban?: string;
  status: BankStatus;
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  // Saldo é sempre calculado a partir das movimentações bancárias (nunca editável diretamente)
}

export type BankMovementType = 'entrada' | 'saida' | 'transferencia' | 'ajuste';

export interface BankMovement {
  id: string;
  bankId: string;
  destinationBankId?: string;
  type: BankMovementType;
  amount: number;
  date: string; // ISO
  responsible: string; // relação com Empregado ("Administrador")
  reason: string; // Motivo/justificativa
  reference?: string; // ex: "Venda #VND-001", "Aporte de Capital"
}

// ==========================================
// MÓDULO CAIXA (Vendas e Transporte)
// ==========================================

export type SalePaymentMethod = 'dinheiro' | 'transferencia' | 'multicaixa' | 'tpa' | 'a_prazo' | 'outro';
export type SaleStatus = 'concluida' | 'cancelada';

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  variationId?: string;
  variationSku?: string;
  variationDetails?: string;
  quantity: number;
  unitPrice: number; // Preço unitário no momento da venda (em Kz)
  subtotal: number;
}

export interface Sale {
  id: string;
  date: string; // ISO
  seller: string; // Relação com Empregado (fixo "Administrador" nesta fase)
  clientId?: string; // Relação com Cliente (opcional)
  clientName?: string; // Nome do Cliente
  warehouseId: string; // Armazém de onde os produtos saem
  items: SaleItem[];
  paymentMethod: SalePaymentMethod;
  total: number; // Total da venda
  status: SaleStatus;
  notes?: string;
  requiresTransport: boolean;
  transportId?: string;
}

export type TransportStatus = 'pendente' | 'em_transito' | 'entregue' | 'cancelado';

export interface Transport {
  id: string;
  saleId?: string; // Relação com a Venda que originou o transporte
  deliveryAddress: string;
  responsible: string; // Relação com Empregado ("Administrador")
  driver?: string;
  vehicle?: string;
  trackingCode?: string;
  cost: number;
  status: TransportStatus;
  estimatedDeliveryDate?: string; // ISO ou YYYY-MM-DD
  actualDeliveryDate?: string; // ISO ou YYYY-MM-DD
  deliveredAt?: string; // ISO
  notes?: string;
  createdAt: string;
}
