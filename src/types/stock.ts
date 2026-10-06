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
  stockConfig?: StockConfigInput;
  stockConfigs?: StockConfigInput[];
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
export type CompanyStatus = 'ativa' | 'desativada' | 'parada';

export interface Company {
  id: string;
  name: string; // Nome da empresa
  nif: string; // Número de identificação fiscal
  address: string; // Endereço
  contact: string; // Telefone / email
  logo?: string; // Logótipo (opcional)
  currency: CompanyCurrency; // Moeda padrão (Kz / USD)
  principalBankId?: string; // Banco principal vinculado à empresa
  status: CompanyStatus; // Status: ativa / desativada / parada
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

export interface StockConfigInput {
  warehouseId: string;
  minLimit: number;
  maxLimit: number;
  physicalLocation?: string;
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
  saleId?: string; // Referência direta opcional ao ID da Venda
  // Auditoria de remoção do histórico (nunca apaga a linha da base de dados)
  removido?: boolean;
  motivo_remocao?: string;
  removido_por?: string;
  data_remocao?: string;
  isRemoved?: boolean;
  removedReason?: string;
  removedBy?: string;
  removedAt?: string;
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

export type PurchaseListStatus = 'em_pesquisa' | 'concluido' | 'cancelado';

export function normalizePurchaseListStatus(status?: string | null): PurchaseListStatus {
  if (!status) return 'em_pesquisa';
  const s = status.toLowerCase().trim();
  if (s === 'concluido' || s === 'concluído' || s === 'comprado' || s === 'aprovado') {
    return 'concluido';
  }
  if (s === 'cancelado') {
    return 'cancelado';
  }
  return 'em_pesquisa';
}

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

export type BankType = 'banco_padrao' | 'banco_fisico' | 'carteira_digital' | 'corrente' | 'poupanca' | 'caixa_fisico' | 'outro';
export type BankStatus = 'ativo' | 'inativo' | 'ativa' | 'inativa';

export interface Bank {
  id: string;
  name: string; // ex: "BAI Kwanza", "Wallet USD", "Banco BFA"
  type: BankType;
  currency: string; // ex: "Kz", "USD", "EUR"
  accountNumber?: string;
  iban?: string;
  status: BankStatus;
  companyId?: string; // Empresa vinculada
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  // Saldo é sempre calculado a partir das movimentações bancárias (nunca editável diretamente)
}

export type BankMovementType = 'entrada' | 'saida' | 'transferencia' | 'ajuste';

export type FinancialCategory =
  | 'Salário'
  | 'Bónus'
  | 'Compra de estoque'
  | 'Dívida'
  | 'Venda'
  | 'Ajuste'
  | 'Transferência'
  | 'Serviços'
  | 'Aluguer'
  | 'Impostos'
  | 'Transporte'
  | 'Alimentação'
  | 'Marketing'
  | 'Outro';

export interface BankMovement {
  id: string;
  bankId: string;
  destinationBankId?: string;
  type: BankMovementType;
  category?: FinancialCategory | string;
  amount: number;
  date: string; // ISO
  responsible: string; // relação com Empregado ("Administrador")
  employeeId?: string; // relação opcional com Funcionário
  reason: string; // Motivo/justificativa
  reference?: string; // ex: "Venda #VND-001", "Aporte de Capital"
  stockMovementId?: string; // Referência à Movimentação de Estoque de origem
  debtId?: string; // Referência à Dívida
  debtPaymentId?: string; // Referência ao Pagamento da Dívida
  isRemoved?: boolean; // Auditoria: se foi removido do histórico
  removedAt?: string;
  removedReason?: string;
  removedBy?: string;
}

export type FinancialMovement = BankMovement;

// ==========================================
// MÓDULO FINANCEIRO: DÍVIDAS
// ==========================================

export type DebtType = 'a_pagar' | 'a_receber';
export type DebtStatus = 'pendente' | 'parcialmente_paga' | 'quitada';
export type CounterpartyType = 'cliente' | 'fornecedor' | 'funcionario' | 'outro';

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string; // ISO
  bankId: string; // Conta financeira envolvida no pagamento
  responsible?: string;
  notes?: string;
  createdAt: string; // ISO
  movementId?: string; // ID da movimentação financeira gerada
}

export interface DebtIncrement {
  id: string;
  debtId: string;
  amount: number;
  date: string; // ISO
  reason: string; // Motivo/justificativa do acréscimo rastreável
  reference?: string; // e.g. "Fatura Proforma #502", "Nova Encomenda"
  responsible?: string;
  createdAt: string; // ISO
}

export interface Debt {
  id: string;
  type: DebtType;
  counterpartyType: CounterpartyType;
  counterpartyId?: string;
  counterpartyName: string;
  companyId: string; // Relação com Empresa
  totalAmount: number;
  initialAmount?: number; // Montante original antes de acréscimos
  currency?: string; // Padrão 'Kz'
  createdAt: string; // ISO
  dueDate?: string; // Data de vencimento opcional
  notes?: string;
  increments?: DebtIncrement[]; // Histórico rastreável de incrementos/acréscimos
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
