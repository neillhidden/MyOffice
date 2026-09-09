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

export interface ProductVariation {
  id: string;
  color?: string;
  size?: string;
  sku: string;
  image?: string;
  additionalPrice: number; // in Kz
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
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
}

export interface Supplier {
  id: string;
  name: string;
  contact: string; // phone/WhatsApp/email
  address: string;
  notes?: string;
  createdAt: string;
}

export type WarehouseType = 'armazem' | 'loja_fisica';
export type WarehouseStatus = 'ativo' | 'inativo';

export interface Warehouse {
  id: string;
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
