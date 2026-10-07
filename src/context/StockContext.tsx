import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  Product,
  Supplier,
  Warehouse,
  Company,
  CompanyStatus,
  StockConfig,
  Movement,
  DefectiveRecord,
  PurchaseGroup,
  PurchaseList,
  PurchaseSource,
  normalizePurchaseListStatus,
  MovementType,
  DefectReason,
  DefectDecision,
  ProductDraft,
  StockConfigInput,
  Bank,
  BankMovement,
  BankMovementType,
  Sale,
  SaleItem,
  Transport,
  SalePaymentMethod,
  TransportStatus,
  Debt,
  DebtPayment,
  DebtIncrement,
  DebtStatus,
  DebtType,
  FinancialCategory,
} from '../types/stock';
import {
  Agenda,
  CalendarEvent,
  AgendaStatus,
  AgendaOrigin,
} from '../types/calendar';
import { Employee } from '../types/employee';
import { Client } from '../types/client';
import { NotificationItem } from '../types/notification';
import { createId } from '../utils/ids';
import { createReversal, migrateFinancialAudit } from '../utils/financialAudit';
import { validateSaleItem } from '../utils/saleValidation';
import { USD_TO_KZ_RATE } from '../utils/formatters';
import {
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_WAREHOUSES,
  INITIAL_COMPANIES,
  INITIAL_STOCK_CONFIGS,
  INITIAL_MOVEMENTS,
  INITIAL_DEFECTIVE_RECORDS,
  INITIAL_PURCHASE_GROUPS,
  INITIAL_PURCHASE_LISTS,
  INITIAL_PURCHASE_SOURCES,
  INITIAL_CATEGORIES,
  INITIAL_BANKS,
  INITIAL_BANK_MOVEMENTS,
  INITIAL_SALES,
  INITIAL_TRANSPORTS,
  INITIAL_DEBTS,
  INITIAL_DEBT_PAYMENTS,
} from '../data/seedData';
import {
  INITIAL_AGENDAS,
  INITIAL_MANUAL_EVENTS,
  INITIAL_EMPLOYEES,
  INITIAL_CLIENTS,
  INITIAL_NOTIFICATIONS,
} from '../data/calendarSeedData';
import {
  KIANDA_COMPANY,
  KIANDA_BANK,
  KIANDA_WAREHOUSE,
  KIANDA_PRODUCTS,
  KIANDA_STOCK_CONFIGS,
  KIANDA_INITIAL_MOVEMENTS,
  KIANDA_SALE_MOVEMENTS,
  KIANDA_BANK_MOVEMENTS,
  KIANDA_SALES,
  KIANDA_TRANSPORTS,
} from '../data/kiandaSeedData';
import { convertToKwanza } from '../utils/formatters';

export interface ProductStockInfo {
  currentStock: number;
  minLimit: number;
  maxLimit: number;
  status: 'zerado' | 'critico_baixo' | 'normal' | 'excesso';
}

interface StockContextType {
  products: Product[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  companies: Company[];
  stockConfigs: StockConfig[];
  movements: Movement[];
  defectiveRecords: DefectiveRecord[];
  categories: string[];
  productDrafts: ProductDraft[];
  purchaseGroups: PurchaseGroup[];
  purchaseLists: PurchaseList[];
  purchaseSources: PurchaseSource[];

  // Calculation helpers
  getCurrentStock: (productId: string, warehouseId?: string, variationId?: string) => number;
  getProductStockInfo: (productId: string, warehouseId?: string) => ProductStockInfo;
  getProductStockInfoForCompany: (productId: string, companyId: string) => ProductStockInfo;
  getProductMovements: (productId: string) => Movement[];
  getProductWarehouses: (productId: string, includeDisabled?: boolean) => Warehouse[];
  getProductCompanies: (productId: string, includeDisabled?: boolean) => Company[];
  isProductInCompany: (productId: string, companyId: string) => boolean;
  checkProductSkuExists: (sku: string, companyId: string, excludeProductId?: string) => Product | undefined;
  checkProductNameExists: (name: string, companyId: string, excludeProductId?: string) => Product | undefined;

  // Company Status & Operational Helpers
  isCompanyActive: (companyId: string) => boolean;
  isCompanyDisabled: (companyId: string) => boolean;
  isCompanyStopped: (companyId: string) => boolean;
  getCompanyStatus: (companyId: string) => CompanyStatus;
  isWarehouseOperational: (warehouseId: string) => boolean;
  isWarehouseStopped: (warehouseId: string) => boolean;
  isWarehouseDisabled: (warehouseId: string) => boolean;

  // Companies Management
  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Company;
  updateCompany: (id: string, updates: Partial<Omit<Company, 'id' | 'createdAt'>>) => void;
  deleteCompany: (id: string) => { success: boolean; message?: string };

  // Warehouses Management
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => Warehouse;
  updateWarehouse: (id: string, updates: Partial<Omit<Warehouse, 'id'>>) => void;
  deleteWarehouse: (id: string) => void;

  // Priority Actions
  addProduct: (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    stockConfig?: StockConfigInput | StockConfigInput[],
    draftIdToRemove?: string
  ) => Product;

  updateProduct: (
    productId: string,
    productData: Partial<Product>,
    stockConfig?: StockConfigInput | StockConfigInput[]
  ) => Product;

  deleteProduct: (productId: string) => void;

  saveProductDraft: (
    draft: Omit<ProductDraft, 'id' | 'savedAt'> & { id?: string }
  ) => ProductDraft;

  deleteProductDraft: (draftId: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Omit<Supplier, 'id' | 'createdAt'>>) => void;
  deleteSupplier: (id: string) => { success: boolean; message?: string };
  addCategory: (categoryName: string) => void;

  recordMovement: (
    movement: Omit<Movement, 'id' | 'date'> & { date?: string },
    financialExit?: { bankId: string; amount: number; notes?: string }
  ) => Movement;
  removeStockMovement: (movementId: string, reason: string, removedBy?: string) => void;
  restoreStockMovement: (movementId: string) => void;

  recordDefective: (
    data: {
      productId: string;
      variationId?: string;
      warehouseId: string;
      quantity: number;
      reason: DefectReason;
      responsible: string;
      decision: DefectDecision;
      notes?: string;
    }
  ) => DefectiveRecord;

  updateDefectiveResolution: (
    id: string,
    decision: DefectDecision,
    status: 'pendente' | 'resolvido',
    notes?: string
  ) => void;

  updateStockLimits: (
    productId: string,
    warehouseId: string,
    minLimit: number,
    maxLimit: number,
    physicalLocation?: string
  ) => void;

  // Purchase lists actions
  addPurchaseGroup: (name: string, description?: string) => PurchaseGroup;
  updatePurchaseGroup: (groupId: string, name: string, description?: string) => void;
  addPurchaseList: (
    list: Omit<PurchaseList, 'id' | 'createdAt' | 'updatedAt'>
  ) => PurchaseList;
  updatePurchaseList: (
    listId: string,
    updates: Partial<Omit<PurchaseList, 'id' | 'createdAt'>>
  ) => void;
  deletePurchaseList: (listId: string) => void;
  addPurchaseSource: (
    source: Omit<PurchaseSource, 'id' | 'totalPrice'>
  ) => PurchaseSource;
  updatePurchaseSource: (
    sourceId: string,
    updates: Partial<Omit<PurchaseSource, 'id' | 'listId'>>
  ) => void;
  toggleSourceAccounted: (sourceId: string) => void;
  deletePurchaseSource: (sourceId: string) => void;

  // Global search & reset
  canResetData: boolean;
  resetToDefaults: () => void;
  resetHistory: () => void;
  resetAll: () => void;

  // Financeiro (Contas, Movimentações e Auditoria)
  banks: Bank[];
  bankMovements: BankMovement[];
  getBankBalance: (bankId: string) => number;
  getBankMovements: (bankId: string) => BankMovement[];
  addBank: (bank: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'>) => Bank;
  updateBank: (id: string, updates: Partial<Omit<Bank, 'id' | 'createdAt'>>) => void;
  deleteBank: (id: string) => { success: boolean; message?: string };
  recordBankMovement: (
    movement: Omit<BankMovement, 'id' | 'date'> & { date?: string }
  ) => BankMovement;
  getCompanyForBank: (bankId: string) => Company | undefined;
  isBankOperationBlocked: (bankId: string) => { blocked: boolean; message?: string };
  reverseBankMovement: (movementId: string, reason: string, responsible?: string) => BankMovement;
  removeFinancialMovement: (movementId: string, reason: string, removedBy?: string) => void;
  restoreFinancialMovement: (movementId: string) => void;

  // Dívidas & Pagamentos
  debts: Debt[];
  debtPayments: DebtPayment[];
  getDebtCalculations: (debtOrId: Debt | string) => {
    paidAmount: number;
    remainingAmount: number;
    status: DebtStatus;
    isOverdue: boolean;
  };
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => Debt;
  updateDebt: (id: string, updates: Partial<Omit<Debt, 'id' | 'createdAt'>>) => void;
  deleteDebt: (id: string) => { success: boolean; message?: string };
  recordDebtPayment: (paymentData: {
    debtId: string;
    amount: number;
    bankId: string;
    date?: string;
    notes?: string;
    responsible?: string;
  }) => DebtPayment;
  deleteDebtPayment: (paymentId: string, reason: string) => void;
  addDebtIncrement: (incrementData: {
    debtId: string;
    amount: number;
    reason: string;
    reference?: string;
    responsible?: string;
    date?: string;
  }) => DebtIncrement;

  // Caixa / Sales & Transport
  sales: Sale[];
  transports: Transport[];
  completeSale: (saleData: {
    warehouseId: string;
    bankId?: string;
    seller?: string;
    clientId?: string;
    clientName?: string;
    items: {
      productId: string;
      productName: string;
      productSku?: string;
      variationId?: string;
      variationSku?: string;
      variationDetails?: string;
      quantity: number;
      unitPrice: number;
    }[];
    paymentMethod: SalePaymentMethod;
    notes?: string;
    requiresTransport: boolean;
    transportDetails?: {
      deliveryAddress: string;
      cost: number;
      estimatedDeliveryDate?: string;
      notes?: string;
    };
  }) => { sale: Sale; transport?: Transport };
  cancelSale: (saleId: string, reason?: string) => { success: boolean; message?: string };
  addTransport: (transport: Omit<Transport, 'id' | 'createdAt'>) => Transport;
  updateTransportStatus: (
    transportId: string,
    newStatus: TransportStatus,
    actualDeliveryDate?: string
  ) => void;
  updateTransport: (transportId: string, updates: Partial<Transport>) => void;

  // Contactos: Clientes
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Omit<Client, 'id' | 'createdAt'>>) => void;
  deleteClient: (id: string) => { success: boolean; message?: string };

  // Calendário & Agendas
  agendas: Agenda[];
  events: CalendarEvent[];
  manualEvents: CalendarEvent[];
  employees: Employee[];
  addAgenda: (agenda: Omit<Agenda, 'id' | 'createdAt' | 'status' | 'origin'> & { origin?: AgendaOrigin; status?: AgendaStatus }) => Agenda;
  updateAgenda: (id: string, updates: Partial<Agenda>) => void;
  toggleArchiveAgenda: (id: string) => void;
  deleteAgenda: (id: string) => { success: boolean; message?: string };
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  toggleEventStatus: (id: string) => void;
  deleteEvent: (id: string) => void;
  addEmployee: (emp: Omit<Employee, 'id' | 'createdAt'>) => Employee;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => { success: boolean; message?: string };

  // Notificações (Sistema Central Partilhado)
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (
    notif: Omit<NotificationItem, 'id' | 'date' | 'read'> & { date?: string; read?: boolean }
  ) => NotificationItem;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'myoffice_estoque_';

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const reversedMovementIds = useRef(new Set<string>());
  const cancelledSaleIds = useRef(new Set<string>());
  // 1. Initial State from localStorage or Seeds
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}products`);
    if (saved) {
      try {
        const parsed: Product[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const hasKianda = parsed.some((p) => p.id === 'prod-kianda-1');
          return hasKianda ? parsed : [...parsed, ...KIANDA_PRODUCTS];
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}suppliers`);
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}companies`);
    if (saved) {
      try {
        const parsed: Company[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((c) => {
            const rawStatus = (c.status as string) === 'inativa' ? 'desativada' : (c.status || 'ativa');
            // If Kianda is stored as ativa or inativa, align with requirement that Kianda is desativada
            const finalStatus = (c.id === 'comp-kianda' && rawStatus !== 'parada') ? 'desativada' : rawStatus;
            return {
              ...c,
              status: finalStatus as CompanyStatus,
            };
          });
          const hasKianda = normalized.some((c) => c.id === 'comp-kianda');
          return hasKianda ? normalized : [...normalized, KIANDA_COMPANY];
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_COMPANIES;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}warehouses`);
    if (saved) {
      try {
        const parsed: Warehouse[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const mapped = parsed.map((w, idx) => ({
            ...w,
            companyId: w.companyId || (idx === 2 ? 'comp-3' : 'comp-1'),
          }));
          const hasKianda = mapped.some((w) => w.id === 'wh-kianda');
          return hasKianda ? mapped : [...mapped, KIANDA_WAREHOUSE];
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_WAREHOUSES;
  });

  const [stockConfigs, setStockConfigs] = useState<StockConfig[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}stockConfigs`);
    if (saved) {
      try {
        const parsed: StockConfig[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const hasKianda = parsed.some((sc) => sc.warehouseId === 'wh-kianda');
          return hasKianda ? parsed : [...parsed, ...KIANDA_STOCK_CONFIGS];
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_STOCK_CONFIGS;
  });

  const [movements, setMovements] = useState<Movement[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}movements`);
    const isReset =
      localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}history_reset`) === 'true' ||
      localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}is_fresh_install`) === 'true';
    if (saved) {
      try {
        const parsed: Movement[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (isReset) return parsed;
          const existingIds = new Set(parsed.map((m) => m.id));
          const missingSeeds = INITIAL_MOVEMENTS.filter((m) => !existingIds.has(m.id));
          return missingSeeds.length > 0 ? [...parsed, ...missingSeeds] : parsed;
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_MOVEMENTS;
  });

  const [defectiveRecords, setDefectiveRecords] = useState<DefectiveRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}defective`);
    return saved ? JSON.parse(saved) : INITIAL_DEFECTIVE_RECORDS;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}categories`);
    if (saved) {
      const parsed: string[] = JSON.parse(saved);
      return Array.from(new Set([...INITIAL_CATEGORIES, ...parsed]));
    }
    return INITIAL_CATEGORIES;
  });

  const [productDrafts, setProductDrafts] = useState<ProductDraft[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}productDrafts`);
    return saved ? JSON.parse(saved) : [];
  });

  const [purchaseGroups, setPurchaseGroups] = useState<PurchaseGroup[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}purchaseGroups`);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_GROUPS;
  });

  const [purchaseLists, setPurchaseLists] = useState<PurchaseList[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}purchaseLists`);
    const parsed: PurchaseList[] = saved ? JSON.parse(saved) : INITIAL_PURCHASE_LISTS;
    // Check if any non-headphone list (like Cooler) inadvertently inherited the generic headphones unsplash image
    const headphoneImage = 'photo-1590658268037-6bf12165a8df';
    return parsed.map((item) => {
      const isHeadphone = item.name.toLowerCase().includes('fone') || item.name.toLowerCase().includes('headphone') || item.name.toLowerCase().includes('auricular');
      const normalizedStatus = normalizePurchaseListStatus(item.status);
      let cleanedItem: PurchaseList = {
        ...item,
        status: normalizedStatus,
      };
      if (!isHeadphone && item.mainImage && item.mainImage.includes(headphoneImage)) {
        cleanedItem = {
          ...cleanedItem,
          mainImage: undefined,
          gallery: (item.gallery || []).filter((img) => !img.includes(headphoneImage)),
        };
      }
      return cleanedItem;
    });
  });

  const [purchaseSources, setPurchaseSources] = useState<PurchaseSource[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}purchaseSources`);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_SOURCES;
  });

  const [banks, setBanks] = useState<Bank[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}banks`);
    if (saved) {
      try {
        const parsed: Bank[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((b) => {
            if (b.id === 'bank-kianda') {
              return { ...b, companyId: 'comp-kianda', status: 'inativo' as const };
            }
            return b;
          });
          const hasKianda = normalized.some((b) => b.id === 'bank-kianda');
          return hasKianda ? normalized : [...normalized, KIANDA_BANK];
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_BANKS;
  });

  const [bankMovements, setBankMovements] = useState<BankMovement[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}bankMovements`);
    const isReset =
      localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}history_reset`) === 'true' ||
      localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}is_fresh_install`) === 'true';
    if (saved) {
      try {
        const parsed: BankMovement[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (isReset) return migrateFinancialAudit(parsed);
          const reconciled = parsed; // Preserve booked values; corrections require a new entry.
          const existingIds = new Set(reconciled.map((bm) => bm.id));
          const missingSeeds = INITIAL_BANK_MOVEMENTS.filter((bm) => !existingIds.has(bm.id));
          return migrateFinancialAudit(missingSeeds.length > 0 ? [...reconciled, ...missingSeeds] : reconciled);
        }
      } catch {
        // fallback
      }
    }
    return migrateFinancialAudit(INITIAL_BANK_MOVEMENTS);
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}debts`);
    if (saved) {
      try {
        const parsed: Debt[] = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_DEBTS;
  });

  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}debtPayments`);
    if (saved) {
      try {
        const parsed: DebtPayment[] = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_DEBT_PAYMENTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}sales`);
    const isReset =
      localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}history_reset`) === 'true' ||
      localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}is_fresh_install`) === 'true';
    if (saved) {
      try {
        const parsed: Sale[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (isReset) return parsed;
          const normalized = parsed.map((s) => {
            let updatedSale =
              s.id === 'VND-1005' && !s.transportId ? { ...s, transportId: 'TRP-1005' } : { ...s };

            if (updatedSale.requiresTransport) {
              const itemsSubtotal = (updatedSale.items || []).reduce(
                (acc, it) => acc + (Number(it.subtotal) || Number(it.quantity) * Number(it.unitPrice) || 0),
                0
              );
              const linkedTrp = INITIAL_TRANSPORTS.find(
                (t) => t.saleId === updatedSale.id || t.id === updatedSale.transportId
              );
              const trpCost =
                updatedSale.transportCost !== undefined
                  ? updatedSale.transportCost
                  : linkedTrp?.cost || 0;
              if (trpCost > 0 && Math.abs(updatedSale.total - itemsSubtotal) < 0.01) {
                updatedSale = {
                  ...updatedSale,
                  transportCost: trpCost,
                  total: itemsSubtotal + trpCost,
                };
              }
            }
            return updatedSale;
          });
          const hasKianda = normalized.some((s) => s.warehouseId === 'wh-kianda');
          return hasKianda ? normalized : [...normalized, ...KIANDA_SALES];
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_SALES;
  });

  const [transports, setTransports] = useState<Transport[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}transports`);
    const isReset =
      localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}history_reset`) === 'true' ||
      localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}is_fresh_install`) === 'true';
    if (saved) {
      try {
        const parsed: Transport[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (isReset) return parsed;
          const existingIds = new Set(parsed.map((t) => t.id));
          const missingSeeds = INITIAL_TRANSPORTS.filter((t) => !existingIds.has(t.id));
          return missingSeeds.length > 0 ? [...parsed, ...missingSeeds] : parsed;
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_TRANSPORTS;
  });

  const [agendas, setAgendas] = useState<Agenda[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}agendas`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_AGENDAS;
  });

  const [manualEvents, setManualEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}manualEvents`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_MANUAL_EVENTS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}employees`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_EMPLOYEES;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}clients`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_CLIENTS;
  });

  const [autoEventStatusOverrides, setAutoEventStatusOverrides] = useState<Record<string, 'pendente' | 'concluido'>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}autoEventStatusOverrides`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {};
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}notifications`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}suppliers`, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}companies`, JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}warehouses`, JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}stockConfigs`, JSON.stringify(stockConfigs));
  }, [stockConfigs]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}movements`, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}defective`, JSON.stringify(defectiveRecords));
  }, [defectiveRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}productDrafts`, JSON.stringify(productDrafts));
  }, [productDrafts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}purchaseGroups`, JSON.stringify(purchaseGroups));
  }, [purchaseGroups]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}purchaseLists`, JSON.stringify(purchaseLists));
  }, [purchaseLists]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}purchaseSources`, JSON.stringify(purchaseSources));
  }, [purchaseSources]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}banks`, JSON.stringify(banks));
  }, [banks]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}bankMovements`, JSON.stringify(bankMovements));
  }, [bankMovements]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}debts`, JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}debtPayments`, JSON.stringify(debtPayments));
  }, [debtPayments]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}sales`, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}transports`, JSON.stringify(transports));
  }, [transports]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}agendas`, JSON.stringify(agendas));
  }, [agendas]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}manualEvents`, JSON.stringify(manualEvents));
  }, [manualEvents]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}employees`, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}clients`, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}autoEventStatusOverrides`, JSON.stringify(autoEventStatusOverrides));
  }, [autoEventStatusOverrides]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}notifications`, JSON.stringify(notifications));
  }, [notifications]);

  // CALCULATION: Stock Engine (Never directly edited, strictly sum of Movements)
  const getCurrentStock = (productId: string, warehouseId?: string, variationId?: string): number => {
    // Armazéns de empresas desativadas ficam totalmente fora da contabilidade operacional
    const disabledCompanyIds = new Set(
      companies.filter((c) => c.status === 'desativada').map((c) => c.id)
    );
    const disabledWhIds = new Set(
      warehouses.filter((w) => disabledCompanyIds.has(w.companyId)).map((w) => w.id)
    );

    if (warehouseId && disabledWhIds.has(warehouseId)) {
      return 0;
    }

    return movements.reduce((acc, mov) => {
      // Regra de auditoria: ignorar registos com removido: true na soma do estoque
      if (mov.removido || mov.isRemoved) return acc;
      // Must match product
      if (mov.productId !== productId) return acc;
      // If variation filter applied
      if (variationId && mov.variationId !== variationId) return acc;

      const affectsOrigin = !warehouseId || mov.warehouseId === warehouseId;
      const affectsDest = !warehouseId || mov.destinationWarehouseId === warehouseId;

      if (mov.type === 'entrada') {
        if (affectsOrigin && !disabledWhIds.has(mov.warehouseId)) return acc + mov.quantity;
      } else if (mov.type === 'saida') {
        if (affectsOrigin && !disabledWhIds.has(mov.warehouseId)) return acc - mov.quantity;
      } else if (mov.type === 'defeituoso') {
        if (affectsOrigin && !disabledWhIds.has(mov.warehouseId)) return acc - mov.quantity;
      } else if (mov.type === 'ajuste') {
        // ajuste pode ser positivo ou negativo (mov.quantity)
        if (affectsOrigin && !disabledWhIds.has(mov.warehouseId)) return acc + mov.quantity;
      } else if (mov.type === 'transferencia') {
        const originDisabled = disabledWhIds.has(mov.warehouseId);
        const destDisabled = mov.destinationWarehouseId ? disabledWhIds.has(mov.destinationWarehouseId) : false;

        if (affectsOrigin && !originDisabled && (!affectsDest || destDisabled)) return acc - mov.quantity;
        if (affectsDest && !destDisabled && (!affectsOrigin || originDisabled)) return acc + mov.quantity;
      }
      return acc;
    }, 0);
  };

  const getProductStockInfo = (productId: string, warehouseId?: string): ProductStockInfo => {
    const current = Math.max(0, getCurrentStock(productId, warehouseId));

    // Sum limits across matching configs (excluindo armazéns de empresas desativadas)
    const disabledCompanyIds = new Set(
      companies.filter((c) => c.status === 'desativada').map((c) => c.id)
    );
    const relevantConfigs = stockConfigs.filter((c) => {
      if (c.productId !== productId) return false;
      if (warehouseId && c.warehouseId !== warehouseId) return false;
      const wh = warehouses.find((w) => w.id === c.warehouseId);
      if (wh && disabledCompanyIds.has(wh.companyId)) return false;
      return true;
    });

    const minLimit = relevantConfigs.reduce((sum, c) => sum + c.minLimit, 0);
    const maxLimit = relevantConfigs.reduce((sum, c) => sum + c.maxLimit, 0);

    let status: ProductStockInfo['status'] = 'normal';
    if (current === 0) {
      status = 'zerado';
    } else if (minLimit > 0 && current < minLimit) {
      status = 'critico_baixo';
    } else if (maxLimit > 0 && current > maxLimit) {
      status = 'excesso';
    }

    return {
      currentStock: current,
      minLimit,
      maxLimit,
      status,
    };
  };

  const getProductStockInfoForCompany = (productId: string, companyId: string): ProductStockInfo => {
    const company = companies.find((c) => c.id === companyId);
    if (company?.status === 'desativada') {
      return {
        currentStock: 0,
        minLimit: 0,
        maxLimit: 0,
        status: 'zerado',
      };
    }

    const companyWarehouses = warehouses.filter((w) => w.companyId === companyId);
    const companyWhIds = new Set(companyWarehouses.map((w) => w.id));

    // Calculate current stock in warehouses of this company
    const current = movements.reduce((acc, mov) => {
      if (mov.removido || mov.isRemoved) return acc;
      if (mov.productId !== productId) return acc;
      const affectsOrigin = companyWhIds.has(mov.warehouseId);
      const affectsDest = mov.destinationWarehouseId ? companyWhIds.has(mov.destinationWarehouseId) : false;

      if (mov.type === 'entrada' && affectsOrigin) return acc + mov.quantity;
      if (mov.type === 'saida' && affectsOrigin) return acc - mov.quantity;
      if (mov.type === 'defeituoso' && affectsOrigin) return acc - mov.quantity;
      if (mov.type === 'ajuste' && affectsOrigin) return acc + mov.quantity;
      if (mov.type === 'transferencia') {
        if (affectsOrigin && !affectsDest) return acc - mov.quantity;
        if (affectsDest && !affectsOrigin) return acc + mov.quantity;
      }
      return acc;
    }, 0);

    const relevantConfigs = stockConfigs.filter(
      (c) => c.productId === productId && companyWhIds.has(c.warehouseId)
    );
    const minLimit = relevantConfigs.reduce((sum, c) => sum + c.minLimit, 0);
    const maxLimit = relevantConfigs.reduce((sum, c) => sum + c.maxLimit, 0);

    let status: ProductStockInfo['status'] = 'normal';
    if (current === 0) {
      status = 'zerado';
    } else if (minLimit > 0 && current < minLimit) {
      status = 'critico_baixo';
    } else if (maxLimit > 0 && current > maxLimit) {
      status = 'excesso';
    }

    return {
      currentStock: Math.max(0, current),
      minLimit,
      maxLimit,
      status,
    };
  };

  const getProductMovements = (productId: string): Movement[] => {
    const disabledCompanyIds = new Set(
      companies.filter((c) => c.status === 'desativada').map((c) => c.id)
    );
    const disabledWhIds = new Set(
      warehouses.filter((w) => disabledCompanyIds.has(w.companyId)).map((w) => w.id)
    );

    return movements
      .filter((m) => {
        if (m.removido || m.isRemoved) return false;
        if (m.productId !== productId) return false;
        if (disabledWhIds.has(m.warehouseId)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Obter armazéns associados ao produto via relação Estoque (Produto × Armazém via StockConfig) e/ou saldo físico positivo
  const getProductWarehouses = (productId: string, includeDisabled = false): Warehouse[] => {
    const whIds = new Set<string>();
    stockConfigs.forEach((sc) => {
      if (sc.productId === productId && sc.warehouseId) {
        whIds.add(sc.warehouseId);
      }
    });
    warehouses.forEach((w) => {
      if (getCurrentStock(productId, w.id) > 0) {
        whIds.add(w.id);
      }
    });
    return warehouses.filter((w) => {
      if (!whIds.has(w.id)) return false;
      if (!includeDisabled) {
        const comp = companies.find((c) => c.id === w.companyId);
        if (comp?.status === 'desativada') return false;
      }
      return true;
    });
  };

  // Obter empresas associadas ao produto através dos seus armazéns vinculados
  const getProductCompanies = (productId: string, includeDisabled = false): Company[] => {
    const prodWarehouses = getProductWarehouses(productId, includeDisabled);
    const compIds = new Set(prodWarehouses.map((w) => w.companyId));
    return companies.filter((c) => {
      if (!compIds.has(c.id)) return false;
      if (!includeDisabled && c.status === 'desativada') return false;
      return true;
    });
  };

  // Status & Operational Helpers para Empresas e Armazéns
  const isCompanyActive = (companyId: string): boolean => {
    const comp = companies.find((c) => c.id === companyId);
    return comp ? comp.status === 'ativa' : false;
  };

  const isCompanyDisabled = (companyId: string): boolean => {
    const comp = companies.find((c) => c.id === companyId);
    return comp ? comp.status === 'desativada' : false;
  };

  const isCompanyStopped = (companyId: string): boolean => {
    const comp = companies.find((c) => c.id === companyId);
    return comp ? comp.status === 'parada' : false;
  };

  const getCompanyStatus = (companyId: string): CompanyStatus => {
    const comp = companies.find((c) => c.id === companyId);
    return comp ? comp.status : 'ativa';
  };

  const isWarehouseOperational = (warehouseId: string): boolean => {
    const wh = warehouses.find((w) => w.id === warehouseId);
    if (!wh || wh.status !== 'ativo') return false;
    const comp = companies.find((c) => c.id === wh.companyId);
    return comp ? comp.status === 'ativa' : true;
  };

  const isWarehouseStopped = (warehouseId: string): boolean => {
    const wh = warehouses.find((w) => w.id === warehouseId);
    if (!wh) return false;
    const comp = companies.find((c) => c.id === wh.companyId);
    return comp ? comp.status === 'parada' : false;
  };

  const isWarehouseDisabled = (warehouseId: string): boolean => {
    const wh = warehouses.find((w) => w.id === warehouseId);
    if (!wh) return false;
    const comp = companies.find((c) => c.id === wh.companyId);
    return comp ? comp.status === 'desativada' : false;
  };

  // Verificar se um produto está associado a uma empresa específica
  const isProductInCompany = (productId: string, companyId: string): boolean => {
    const prodWarehouses = getProductWarehouses(productId);
    if (prodWarehouses.some((w) => w.companyId === companyId)) {
      return true;
    }
    const configs = stockConfigs.filter((sc) => sc.productId === productId);
    if (
      configs.some((sc) => {
        const wh = warehouses.find((w) => w.id === sc.warehouseId);
        return wh?.companyId === companyId;
      })
    ) {
      return true;
    }
    // Caso de borda: se não houver armazém associado ainda, associa à primeira empresa cadastrada
    if (prodWarehouses.length === 0 && configs.length === 0 && companies.length > 0) {
      return companyId === companies[0].id;
    }
    return false;
  };

  // Normalização de texto: minúsculas, sem acentos e sem espaços excessivos
  const normalizeProductName = (nameToTest: string): string => {
    return (nameToTest || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  };

  // Normalização de SKU
  const normalizeSku = (skuToTest: string): string => {
    return (skuToTest || '').trim().toUpperCase().replace(/\s+/g, '');
  };

  // Verificação de SKU duplicado (bloqueio obrigatório dentro da mesma empresa)
  const checkProductSkuExists = (
    skuToTest: string,
    companyId: string,
    excludeProductId?: string
  ): Product | undefined => {
    const cleanSku = normalizeSku(skuToTest);
    if (!cleanSku) return undefined;

    return products.find((p) => {
      if (excludeProductId && p.id === excludeProductId) return false;
      if (!isProductInCompany(p.id, companyId)) return false;

      // Verificar SKU principal do produto
      if (normalizeSku(p.sku) === cleanSku) return true;

      // Verificar SKUs das variações
      if (p.variations && p.variations.length > 0) {
        return p.variations.some((v) => normalizeSku(v.sku) === cleanSku);
      }

      return false;
    });
  };

  // Verificação de Nome duplicado (aviso com confirmação dentro da mesma empresa)
  const checkProductNameExists = (
    nameToTest: string,
    companyId: string,
    excludeProductId?: string
  ): Product | undefined => {
    const cleanName = normalizeProductName(nameToTest);
    if (!cleanName) return undefined;

    return products.find((p) => {
      if (excludeProductId && p.id === excludeProductId) return false;
      if (!isProductInCompany(p.id, companyId)) return false;

      return normalizeProductName(p.name) === cleanName;
    });
  };

  // PRIORITY ACTION: Add Product (Sets up catalog & stock limits, NO initial quantity movement)
  const addProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    stockConfig?: StockConfigInput | StockConfigInput[],
    draftIdToRemove?: string
  ): Product => {
    const now = new Date().toISOString();
    const newProductId = createId('prod');
    const newProduct: Product = {
      ...productData,
      id: newProductId,
      createdAt: now,
      updatedAt: now,
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Ensure category exists
    if (newProduct.category && !categories.includes(newProduct.category)) {
      setCategories((prev) => [...prev, newProduct.category]);
    }

    // Setup stock limits configuration if provided (NO direct stock quantity)
    if (Array.isArray(stockConfig)) {
      const newConfigs: StockConfig[] = stockConfig
        .filter((sc) => sc && sc.warehouseId)
        .map((sc) => ({
          productId: newProductId,
          warehouseId: sc.warehouseId,
          minLimit: Number(sc.minLimit) || 0,
          maxLimit: Number(sc.maxLimit) || 0,
          physicalLocation: sc.physicalLocation?.trim() || '',
        }));
      if (newConfigs.length > 0) {
        setStockConfigs((prev) => [...prev, ...newConfigs]);
      }
    } else if (stockConfig && stockConfig.warehouseId) {
      const newConfig: StockConfig = {
        productId: newProductId,
        warehouseId: stockConfig.warehouseId,
        minLimit: Number(stockConfig.minLimit) || 0,
        maxLimit: Number(stockConfig.maxLimit) || 0,
        physicalLocation: stockConfig.physicalLocation?.trim() || '',
      };
      setStockConfigs((prev) => [...prev, newConfig]);
    }

    // Clean up draft if one was converted
    if (draftIdToRemove) {
      setProductDrafts((prev) => prev.filter((d) => d.id !== draftIdToRemove));
    }

    return newProduct;
  };

  // Update existing product
  const updateProduct = (
    productId: string,
    productData: Partial<Product>,
    stockConfig?: StockConfigInput | StockConfigInput[]
  ): Product => {
    const now = new Date().toISOString();
    let updatedResult: Product | undefined;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          updatedResult = {
            ...p,
            ...productData,
            updatedAt: now,
          };
          return updatedResult;
        }
        return p;
      })
    );

    // Update or sync stock limits config
    if (Array.isArray(stockConfig)) {
      const incomingWhIds = new Set(
        stockConfig.filter((sc) => sc && sc.warehouseId).map((sc) => sc.warehouseId)
      );
      setStockConfigs((prev) => {
        // Outros produtos permanecem intactos
        const otherProductConfigs = prev.filter((c) => c.productId !== productId);

        // Se algum armazém previamente vinculado possuir estoque físico > 0, mantém o registro por segurança
        const retainedWithStock = prev.filter(
          (c) =>
            c.productId === productId &&
            !incomingWhIds.has(c.warehouseId) &&
            getCurrentStock(productId, c.warehouseId) > 0
        );

        const newConfigs: StockConfig[] = stockConfig
          .filter((sc) => sc && sc.warehouseId)
          .map((sc) => ({
            productId,
            warehouseId: sc.warehouseId,
            minLimit: Number(sc.minLimit) || 0,
            maxLimit: Number(sc.maxLimit) || 0,
            physicalLocation: sc.physicalLocation?.trim() || '',
          }));

        return [...otherProductConfigs, ...retainedWithStock, ...newConfigs];
      });
    } else if (stockConfig && stockConfig.warehouseId) {
      setStockConfigs((prev) => {
        const withoutOld = prev.filter(
          (c) => !(c.productId === productId && c.warehouseId === stockConfig.warehouseId)
        );
        return [
          ...withoutOld,
          {
            productId,
            warehouseId: stockConfig.warehouseId,
            minLimit: Number(stockConfig.minLimit) || 0,
            maxLimit: Number(stockConfig.maxLimit) || 0,
            physicalLocation: stockConfig.physicalLocation?.trim() || '',
          },
        ];
      });
    }

    if (productData.category && !categories.includes(productData.category)) {
      setCategories((prev) => [...prev, productData.category!]);
    }

    // If there was a draft associated with this product ID, remove it
    setProductDrafts((prev) => prev.filter((d) => d.id !== productId));

    return updatedResult!;
  };

  // Delete product
  const deleteProduct = (productId: string): void => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setStockConfigs((prev) => prev.filter((c) => c.productId !== productId));
    setProductDrafts((prev) => prev.filter((d) => d.id !== productId));
  };

  // Company Management
  const addCompany = (
    companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>
  ): Company => {
    const now = new Date().toISOString();
    const newCompany: Company = {
      ...companyData,
      id: createId('comp'),
      createdAt: now,
      updatedAt: now,
    };
    setCompanies((prev) => [newCompany, ...prev]);
    return newCompany;
  };

  const updateCompany = (
    id: string,
    updates: Partial<Omit<Company, 'id' | 'createdAt'>>
  ): void => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, ...updates, updatedAt: new Date().toISOString() }
          : c
      )
    );

    if (updates.status === 'desativada') {
      setBanks((prev) =>
        prev.map((b) => {
          if (b.companyId === id || (id === 'comp-kianda' && b.id === 'bank-kianda')) {
            return { ...b, status: 'inativo' as const };
          }
          return b;
        })
      );
    }
  };

  const deleteCompany = (id: string): { success: boolean; message?: string } => {
    // Regra: se a Empresa tiver algum Armazém vinculado a ela, não permitir eliminar
    const linkedWarehouses = warehouses.filter((w) => w.companyId === id);
    if (linkedWarehouses.length > 0) {
      return {
        success: false,
        message: 'Esta empresa não pode ser eliminada porque possui armazéns vinculados.',
      };
    }
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    return { success: true };
  };

  // Warehouse Management
  const addWarehouse = (whData: Omit<Warehouse, 'id'>): Warehouse => {
    const newWarehouse: Warehouse = {
      ...whData,
      id: createId('wh'),
    };
    setWarehouses((prev) => [...prev, newWarehouse]);
    return newWarehouse;
  };

  const updateWarehouse = (
    id: string,
    updates: Partial<Omit<Warehouse, 'id'>>
  ): void => {
    setWarehouses((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  };

  const deleteWarehouse = (id: string): void => {
    setWarehouses((prev) => prev.filter((w) => w.id !== id));
    setStockConfigs((prev) => prev.filter((c) => c.warehouseId !== id));
  };

  // Drafts Management
  const saveProductDraft = (
    draftData: Omit<ProductDraft, 'id' | 'savedAt'> & { id?: string }
  ): ProductDraft => {
    const now = new Date().toISOString();
    const draftId = draftData.id || createId('draft');
    const newDraft: ProductDraft = {
      ...draftData,
      id: draftId,
      name: draftData.name?.trim() || 'Produto sem nome',
      savedAt: now,
    };

    setProductDrafts((prev) => {
      const idx = prev.findIndex((d) => d.id === draftId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newDraft;
        return updated;
      }
      return [newDraft, ...prev];
    });

    return newDraft;
  };

  const deleteProductDraft = (draftId: string) => {
    setProductDrafts((prev) => prev.filter((d) => d.id !== draftId));
  };

  // Supplier Management
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: createId('sup'),
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    return newSupplier;
  };

  const updateSupplier = (
    id: string,
    updates: Partial<Omit<Supplier, 'id' | 'createdAt'>>
  ): void => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteSupplier = (id: string): { success: boolean; message?: string } => {
    const target = suppliers.find((s) => s.id === id);
    if (!target) return { success: false, message: 'Fornecedor não encontrado.' };

    const associatedProducts = products.filter((p) => p.supplierId === id);
    if (associatedProducts.length > 0) {
      return {
        success: false,
        message: `Não é possível eliminar o fornecedor "${target.name}" porque possui ${associatedProducts.length} produto(s) associado(s) no estoque.`,
      };
    }

    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    return { success: true };
  };

  // Add Category inline
  const addCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
    }
  };

  // Record a Movement (Audit Rule: Never edit directly, only append!)
  const recordMovement = (
    movementData: Omit<Movement, 'id' | 'date'> & { date?: string },
    financialExit?: { bankId: string; amount: number; notes?: string }
  ): Movement => {
    // Validação de estado da empresa do armazém de origem
    const originWh = warehouses.find((w) => w.id === movementData.warehouseId);
    const originComp = companies.find((c) => c.id === originWh?.companyId);
    if (originComp?.status === 'desativada') {
      throw new Error('Empresa desativada — operações não permitidas.');
    }
    if (originComp?.status === 'parada') {
      throw new Error('Empresa parada — serviços indisponíveis. Esta empresa está com as operações temporariamente bloqueadas.');
    }

    // Validação para transferência (destino)
    if (movementData.type === 'transferencia' && movementData.destinationWarehouseId) {
      const destWh = warehouses.find((w) => w.id === movementData.destinationWarehouseId);
      const destComp = companies.find((c) => c.id === destWh?.companyId);
      if (destComp?.status === 'desativada') {
        throw new Error('Armazém de destino pertence a uma empresa desativada — operação não permitida.');
      }
      if (destComp?.status === 'parada') {
        throw new Error('Empresa parada — serviços indisponíveis no armazém de destino.');
      }
    }

    const newMovement: Movement = {
      ...movementData,
      id: createId('mov'),
      date: movementData.date || new Date().toISOString(),
    };
    setMovements((prev) => [newMovement, ...prev]);

    // Ligação automática com o Financeiro: Compra de estoque gera saída financeira automática
    if (financialExit && financialExit.amount > 0 && financialExit.bankId) {
      const bankMov: BankMovement = {
        id: createId('bmov-stock'),
        bankId: financialExit.bankId,
        type: 'saida',
        category: 'Compra de estoque',
        amount: financialExit.amount,
        date: newMovement.date,
        responsible: newMovement.responsible || 'Administrador',
        reason: `Compra de estoque: ${newMovement.reason || 'Entrada de material'}${
          financialExit.notes ? ` - ${financialExit.notes}` : ''
        }`,
        reference: `Mov. Estoque #${newMovement.id}${newMovement.reference ? ` (${newMovement.reference})` : ''}`,
        stockMovementId: newMovement.id,
      };
      setBankMovements((prev) => [bankMov, ...prev]);
    }

    return newMovement;
  };

  // Regra de auditoria de Estoque: Remover movimentação do histórico com justificativa (nunca apaga a linha)
  const removeStockMovement = (
    movementId: string,
    reason: string,
    removedBy = 'Administrador'
  ) => {
    const mov = movements.find((m) => m.id === movementId);
    if (!mov) return;

    const now = new Date().toISOString();
    setMovements((prev) =>
      prev.map((m) =>
        m.id === movementId
          ? {
              ...m,
              removido: true,
              motivo_remocao: reason,
              removido_por: removedBy,
              data_remocao: now,
              isRemoved: true,
              removedReason: reason,
              removedBy,
              removedAt: now,
            }
          : m
      )
    );

    const product = products.find((p) => p.id === mov.productId);
    addNotification({
      type: 'outro',
      title: 'Movimentação Removida do Histórico',
      message: `A movimentação #${mov.id} (${mov.type.toUpperCase()} de ${mov.quantity} ${
        product?.unitOfMeasure || 'un'
      } • ${product?.name || mov.productId}) foi removida do histórico por ${removedBy}. Motivo: "${reason}"`,
      reference: {
        type: 'produto',
        id: mov.productId,
      },
    });
  };

  // Regra de auditoria de Estoque: Restaurar movimentação ao histórico ativo
  const restoreStockMovement = (movementId: string) => {
    const mov = movements.find((m) => m.id === movementId);
    if (!mov) return;

    setMovements((prev) =>
      prev.map((m) =>
        m.id === movementId
          ? {
              ...m,
              removido: false,
              motivo_remocao: undefined,
              removido_por: undefined,
              data_remocao: undefined,
              isRemoved: false,
              removedReason: undefined,
              removedBy: undefined,
              removedAt: undefined,
            }
          : m
      )
    );

    const product = products.find((p) => p.id === mov.productId);
    addNotification({
      type: 'outro',
      title: 'Movimentação Restaurada ao Histórico',
      message: `A movimentação #${mov.id} (${product?.name || mov.productId}) foi restaurada ao histórico ativo de movimentações.`,
      reference: {
        type: 'produto',
        id: mov.productId,
      },
    });
  };

  // Record Defective Item (Generates Movement type 'defeituoso' automatically!)
  const recordDefective = (data: {
    productId: string;
    variationId?: string;
    warehouseId: string;
    quantity: number;
    reason: DefectReason;
    responsible: string;
    decision: DefectDecision;
    notes?: string;
  }): DefectiveRecord => {
    const defWh = warehouses.find((w) => w.id === data.warehouseId);
    const defComp = companies.find((c) => c.id === defWh?.companyId);
    if (defComp?.status === 'desativada') {
      throw new Error('Empresa desativada — operações não permitidas.');
    }
    if (defComp?.status === 'parada') {
      throw new Error('Empresa parada — serviços indisponíveis.');
    }

    const now = new Date().toISOString();
    const movementId = createId('mov-def');

    // 1. Audit Movement deduction
    const defectMovement: Movement = {
      id: movementId,
      productId: data.productId,
      variationId: data.variationId,
      warehouseId: data.warehouseId,
      type: 'defeituoso',
      quantity: Number(data.quantity),
      date: now,
      responsible: data.responsible,
      reason: `Item defeituoso registrado: ${data.reason.replace('_', ' ')}${data.notes ? ` - ${data.notes}` : ''}`,
      reference: createId('Auto-DEF'),
    };
    setMovements((prev) => [defectMovement, ...prev]);

    // 2. Defective Record
    const record: DefectiveRecord = {
      id: createId('def'),
      productId: data.productId,
      variationId: data.variationId,
      warehouseId: data.warehouseId,
      quantity: Number(data.quantity),
      reason: data.reason,
      date: now,
      responsible: data.responsible,
      decision: data.decision,
      status: 'pendente',
      movementId,
      notes: data.notes,
    };
    setDefectiveRecords((prev) => [record, ...prev]);

    return record;
  };

  // Update Defective Resolution
  const updateDefectiveResolution = (
    id: string,
    decision: DefectDecision,
    status: 'pendente' | 'resolvido',
    notes?: string
  ) => {
    setDefectiveRecords((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              decision,
              status,
              notes: notes || rec.notes,
              resolvedAt: status === 'resolvido' ? new Date().toISOString() : undefined,
            }
          : rec
      )
    );
  };

  // Update Limits
  const updateStockLimits = (
    productId: string,
    warehouseId: string,
    minLimit: number,
    maxLimit: number,
    physicalLocation?: string
  ) => {
    setStockConfigs((prev) => {
      const existingIndex = prev.findIndex(
        (c) => c.productId === productId && c.warehouseId === warehouseId
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          minLimit,
          maxLimit,
          physicalLocation: physicalLocation ?? updated[existingIndex].physicalLocation,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId,
            warehouseId,
            minLimit,
            maxLimit,
            physicalLocation,
          },
        ];
      }
    });
  };

  // Purchase Lists Actions
  const addPurchaseGroup = (name: string, description?: string): PurchaseGroup => {
    const now = new Date().toISOString();
    const newGroup: PurchaseGroup = {
      id: createId('grp'),
      name,
      description,
      createdAt: now,
      updatedAt: now,
    };
    setPurchaseGroups((prev) => [newGroup, ...prev]);
    return newGroup;
  };

  const updatePurchaseGroup = (groupId: string, name: string, description?: string): void => {
    const now = new Date().toISOString();
    setPurchaseGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              name: name.trim(),
              description: description !== undefined ? description.trim() || undefined : g.description,
              updatedAt: now,
            }
          : g
      )
    );
  };

  const addPurchaseList = (
    listData: Omit<PurchaseList, 'id' | 'createdAt' | 'updatedAt'>
  ): PurchaseList => {
    const now = new Date().toISOString();
    const newList: PurchaseList = {
      ...listData,
      status: normalizePurchaseListStatus(listData.status || 'em_pesquisa'),
      id: createId('list'),
      createdAt: now,
      updatedAt: now,
    };
    setPurchaseLists((prev) => [newList, ...prev]);
    return newList;
  };

  const updatePurchaseList = (
    listId: string,
    updates: Partial<Omit<PurchaseList, 'id' | 'createdAt'>>
  ): void => {
    const now = new Date().toISOString();
    setPurchaseLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              ...updates,
              status: updates.status ? normalizePurchaseListStatus(updates.status) : l.status,
              updatedAt: now,
            }
          : l
      )
    );
  };

  const deletePurchaseList = (listId: string): void => {
    setPurchaseLists((prev) => prev.filter((l) => l.id !== listId));
    setPurchaseSources((prev) => prev.filter((s) => s.listId !== listId));
  };

  const addPurchaseSource = (
    sourceData: Omit<PurchaseSource, 'id' | 'totalPrice'>
  ): PurchaseSource => {
    const calculatedTotal =
      Number(sourceData.unitPrice) * Number(sourceData.quantity) +
      Number(sourceData.shippingCost) +
      Number(sourceData.otherCosts);

    const newSource: PurchaseSource = {
      ...sourceData,
      id: createId('src'),
      totalPrice: calculatedTotal,
    };
    setPurchaseSources((prev) => [newSource, ...prev]);
    return newSource;
  };

  const updatePurchaseSource = (
    sourceId: string,
    updates: Partial<Omit<PurchaseSource, 'id' | 'listId'>>
  ): void => {
    setPurchaseSources((prev) =>
      prev.map((s) => {
        if (s.id !== sourceId) return s;

        const merged = { ...s, ...updates };

        const unit = Number(merged.unitPrice) || 0;
        const qty = Number(merged.quantity) || 0;
        const ship = Number(merged.shippingCost) || 0;
        const other = Number(merged.otherCosts) || 0;
        const totalPrice = unit * qty + ship + other;

        let rate = merged.approxKzRate;
        if (updates.originalCurrency && updates.originalCurrency !== s.originalCurrency) {
          if (updates.originalCurrency === 'USD') rate = USD_TO_KZ_RATE;
          else if (updates.originalCurrency === 'EUR') rate = 1010;
          else if (updates.originalCurrency === 'CNY') rate = 128;
          else rate = 1;
        }

        return {
          ...merged,
          approxKzRate: rate,
          totalPrice,
        };
      })
    );
  };

  const toggleSourceAccounted = (sourceId: string) => {
    setPurchaseSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, isAccounted: !s.isAccounted } : s))
    );
  };

  const deletePurchaseSource = (sourceId: string) => {
    setPurchaseSources((prev) => prev.filter((s) => s.id !== sourceId));
  };

  // Banks Management & Calculation
  const getBankBalance = (bankId: string): number => {
    return bankMovements
      .filter((m) => m.bankId === bankId && !m.isRemoved)
      .reduce((acc, mov) => {
        if (mov.type === 'entrada') return acc + mov.amount;
        if (mov.type === 'saida') return acc - mov.amount;
        if (mov.type === 'ajuste') return acc + mov.amount;
        if (mov.type === 'transferencia') return acc + mov.amount;
        return acc;
      }, 0);
  };

  const getBankMovements = (bankId: string): BankMovement[] => {
    return bankMovements
      .filter((m) => m.bankId === bankId && !m.isRemoved)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const addBank = (
    bankData: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'>
  ): Bank => {
    const now = new Date().toISOString();
    const newBank: Bank = {
      ...bankData,
      id: createId('bank'),
      createdAt: now,
      updatedAt: now,
    };
    setBanks((prev) => [...prev, newBank]);
    return newBank;
  };

  const updateBank = (
    id: string,
    updates: Partial<Omit<Bank, 'id' | 'createdAt'>>
  ): void => {
    setBanks((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, ...updates, updatedAt: new Date().toISOString() }
          : b
      )
    );
  };

  const deleteBank = (id: string): { success: boolean; message?: string } => {
    // 1. Regra de auditoria: se houver movimentações financeiras, não permitir exclusão
    const hasMovements = bankMovements.some((m) => m.bankId === id);
    if (hasMovements) {
      return {
        success: false,
        message:
          'Este banco possui movimentações financeiras registradas no histórico e não pode ser excluído por conformidade de auditoria.',
      };
    }

    // 2. Regra de integridade: se estiver vinculado como Banco Principal a uma Empresa ativa
    const linkedCompany = companies.find((c) => c.principalBankId === id && c.status === 'ativa');
    if (linkedCompany) {
      return {
        success: false,
        message: `Este banco está vinculado como Banco Principal da empresa "${linkedCompany.name}" e não pode ser excluído. Altere o banco principal da empresa antes.`,
      };
    }

    setBanks((prev) => prev.filter((b) => b.id !== id));
    return { success: true };
  };

  const getCompanyForBank = (bankId: string): Company | undefined => {
    if (!bankId) return undefined;
    const bank = banks.find((b) => b.id === bankId);
    // 1. Direct match by companyId on Bank (explicit ownership)
    if (bank && bank.companyId) {
      const byCompanyId = companies.find((c) => c.id === bank.companyId);
      if (byCompanyId) return byCompanyId;
    }
    // 2. Direct match by principalBankId on Company
    const byPrincipal = companies.find((c) => c.principalBankId === bankId);
    if (byPrincipal) return byPrincipal;
    // 3. Match by name
    if (bank) {
      const trimmedBankName = bank.name.trim().toLowerCase();
      const byName = companies.find((c) => c.name.trim().toLowerCase() === trimmedBankName);
      if (byName) return byName;
    }
    return undefined;
  };

  const isBankOperationBlocked = (bankId: string): { blocked: boolean; message?: string } => {
    if (!bankId) return { blocked: false };
    const comp = getCompanyForBank(bankId);
    if (comp?.status === 'parada') {
      return {
        blocked: true,
        message: 'Empresa parada — serviços indisponíveis.',
      };
    }
    if (comp?.status === 'desativada') {
      return {
        blocked: true,
        message: 'Empresa desativada — serviços indisponíveis.',
      };
    }
    return { blocked: false };
  };

  const recordBankMovement = (
    movementData: Omit<BankMovement, 'id' | 'date'> & { date?: string }
  ): BankMovement => {
    const originCheck = isBankOperationBlocked(movementData.bankId);
    if (originCheck.blocked) {
      throw new Error(originCheck.message || 'Empresa parada — serviços indisponíveis.');
    }

    if (movementData.destinationBankId) {
      const destCheck = isBankOperationBlocked(movementData.destinationBankId);
      if (destCheck.blocked) {
        throw new Error(destCheck.message || 'Empresa parada — serviços indisponíveis.');
      }
    }

    const newMovement: BankMovement = {
      ...movementData,
      id: createId('bmov'),
      date: movementData.date || new Date().toISOString(),
    };
    setBankMovements((prev) => [newMovement, ...prev]);
    return newMovement;
  };

  const reverseBankMovement = (
    movementId: string,
    reason: string,
    responsible = 'Administrador',
  ): BankMovement => {
    const original = bankMovements.find((m) => m.id === movementId);
    if (!original) throw new Error('Lançamento não encontrado.');
    if (original.saleId) {
      const sale = sales.find((sale) => sale.id === original.saleId);
      if (sale && sale.status !== 'cancelada' && !cancelledSaleIds.current.has(sale.id)) {
        throw new Error('Use o cancelamento da venda para estornar financeiro, estoque e entrega em conjunto.');
      }
    }
    if (original.isReversed || original.reversalOfId || reversedMovementIds.current.has(original.id) ||
        bankMovements.some((m) => m.reversalOfId === original.id)) {
      throw new Error('Este lançamento já foi estornado ou é um lançamento de estorno.');
    }
    const originCheck = isBankOperationBlocked(original.bankId);
    const destinationCheck = original.destinationBankId ? isBankOperationBlocked(original.destinationBankId) : { blocked: false };
    if (originCheck.blocked || destinationCheck.blocked) {
      throw new Error(originCheck.message || destinationCheck.message || 'Operação bloqueada.');
    }
    const reversal = createReversal(original, reason, responsible);
    reversedMovementIds.current.add(original.id);
    setBankMovements((prev) => [reversal, ...prev.map((m) => m.id === original.id ? {
      ...m, isReversed: true, reversedAt: reversal.date,
      reversalReason: reason.trim(), reversedBy: responsible,
    } : m)]);
    addNotification({
      type: 'outro', title: 'Lançamento Estornado',
      message: `O lançamento #${original.id} foi compensado pelo estorno #${reversal.id}. Motivo: ${reason.trim()}`,
      reference: { type: 'outro', id: original.id },
    });
    return reversal;
  };

  // Compatibility for existing integrations: removal now means a compensating entry.
  const removeFinancialMovement = (id: string, reason: string, responsible = 'Administrador') => {
    reverseBankMovement(id, reason, responsible);
  };
  const restoreFinancialMovement = (_id: string) => {
    throw new Error('Estornos não podem ser apagados ou restaurados. Registe um novo lançamento justificado.');
  };

  // ==========================================
  // DÍVIDAS & PAGAMENTOS LOGIC
  // ==========================================
  const getDebtCalculations = (debtOrId: Debt | string): {
    paidAmount: number;
    remainingAmount: number;
    status: DebtStatus;
    isOverdue: boolean;
  } => {
    const debt = typeof debtOrId === 'string' ? debts.find((d) => d.id === debtOrId) : debtOrId;
    if (!debt) {
      return { paidAmount: 0, remainingAmount: 0, status: 'pendente', isOverdue: false };
    }
    const payments = debtPayments.filter((p) => {
      if (p.debtId !== debt.id) return false;
      if (p.movementId) {
        const linkedMov = bankMovements.find((m) => m.id === p.movementId);
        if (linkedMov?.isRemoved || linkedMov?.isReversed) return false;
      }
      return true;
    });
    const paidAmount = payments.reduce((acc, p) => acc + p.amount, 0);
    const remainingAmount = Math.max(0, debt.totalAmount - paidAmount);

    let status: DebtStatus = 'pendente';
    if (paidAmount >= debt.totalAmount && debt.totalAmount > 0) {
      status = 'quitada';
    } else if (paidAmount > 0) {
      status = 'parcialmente_paga';
    }

    let isOverdue = false;
    if (debt.dueDate && status !== 'quitada') {
      const due = new Date(debt.dueDate);
      due.setHours(23, 59, 59, 999);
      isOverdue = due.getTime() < Date.now();
    }

    return {
      paidAmount,
      remainingAmount,
      status,
      isOverdue,
    };
  };

  const addDebt = (debtData: Omit<Debt, 'id' | 'createdAt'>): Debt => {
    const now = new Date().toISOString();
    const newDebt: Debt = {
      ...debtData,
      id: createId('deb'),
      createdAt: now,
    };
    setDebts((prev) => [newDebt, ...prev]);
    return newDebt;
  };

  const updateDebt = (
    id: string,
    updates: Partial<Omit<Debt, 'id' | 'createdAt'>>
  ): void => {
    setDebts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const deleteDebt = (id: string): { success: boolean; message?: string } => {
    const hasPayments = debtPayments.some((p) => p.debtId === id);
    if (hasPayments) {
      return {
        success: false,
        message:
          'Esta dívida possui pagamentos registrados no histórico e não pode ser eliminada. O histórico de pagamentos, incluindo estornos, deve ser preservado.',
      };
    }
    setDebts((prev) => prev.filter((d) => d.id !== id));
    return { success: true };
  };

  const recordDebtPayment = (paymentData: {
    debtId: string;
    amount: number;
    bankId: string;
    date?: string;
    notes?: string;
    responsible?: string;
  }): DebtPayment => {
    const debt = debts.find((d) => d.id === paymentData.debtId);
    if (!debt) throw new Error('Dívida não encontrada.');

    const debtComp = companies.find((c) => c.id === debt.companyId);
    if (debtComp?.status === 'desativada') {
      throw new Error('Operação bloqueada: A empresa associada a esta dívida está desativada.');
    }
    if (debtComp?.status === 'parada') {
      throw new Error('Operação bloqueada: A empresa associada a esta dívida está com status Parada.');
    }

    const calcs = getDebtCalculations(debt);
    const debtCurrency = debt.currency || debtComp?.currency || 'Kz';
    const numAmount = Number(paymentData.amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Insira um valor de pagamento válido e superior a zero.');
    }

    if (calcs.remainingAmount <= 0) {
      throw new Error('Esta dívida já se encontra integralmente quitada.');
    }

    // Regra 5: Rejeitar pagamento acima do saldo devedor atual
    if (numAmount > calcs.remainingAmount + 0.005) {
      throw new Error(
        `O valor do pagamento (${numAmount.toLocaleString('pt-AO')} ${debtCurrency}) não pode exceder o saldo devedor atual (${calcs.remainingAmount.toLocaleString('pt-AO')} ${debtCurrency}).`
      );
    }

    // Validação do banco
    const targetBank = banks.find((b) => b.id === paymentData.bankId);
    if (!targetBank) {
      throw new Error('Selecione uma conta bancária válida para registar o pagamento.');
    }
    const isBankActive = targetBank.status === 'ativo' || targetBank.status === 'ativa';
    if (!isBankActive) {
      throw new Error(`A conta "${targetBank.name}" está inativa e não pode ser utilizada.`);
    }
    const bankCompany = getCompanyForBank(targetBank.id);
    if (bankCompany && debt.companyId && bankCompany.id !== debt.companyId) {
      throw new Error(
        `A conta "${targetBank.name}" pertence à empresa "${bankCompany.name}" e não à empresa desta dívida.`
      );
    }
    if (targetBank.currency && targetBank.currency !== debtCurrency) {
      throw new Error(
        `A moeda da conta "${targetBank.name}" (${targetBank.currency}) não coincide com a moeda da dívida (${debtCurrency}).`
      );
    }

    if (debt.type === 'a_pagar') {
      const availableBalance = getBankBalance(targetBank.id);
      if (numAmount > availableBalance + 0.005) {
        throw new Error(
          `Saldo insuficiente na conta "${targetBank.name}". Disponível: ${availableBalance.toLocaleString('pt-AO')} ${targetBank.currency}.`
        );
      }
    }

    const now = new Date().toISOString();
    const paymentId = createId('pay');
    const movId = createId('bmov-debt');

    // Sincronização com o Financeiro:
    // Se a dívida é a receber e estamos a receber pagamento -> entrada
    // Se a dívida é a pagar e estamos a pagar -> saída
    const movType: BankMovementType = debt.type === 'a_receber' ? 'entrada' : 'saida';
    const bankMov: BankMovement = {
      id: movId,
      bankId: targetBank.id,
      type: movType,
      category: 'Dívida',
      amount: numAmount,
      date: paymentData.date || now,
      responsible: paymentData.responsible || 'Administrador',
      reason: `Pagamento de dívida (${debt.type === 'a_pagar' ? 'A pagar' : 'A receber'}): ${debt.counterpartyName}${
        paymentData.notes ? ` - ${paymentData.notes}` : ''
      }`,
      reference: `Dívida #${debt.id}`,
      debtId: debt.id,
      debtPaymentId: paymentId,
    };
    setBankMovements((prev) => [bankMov, ...prev]);

    const newPayment: DebtPayment = {
      id: paymentId,
      debtId: paymentData.debtId,
      amount: numAmount,
      date: paymentData.date || now,
      bankId: targetBank.id,
      responsible: paymentData.responsible || 'Administrador',
      notes: paymentData.notes,
      createdAt: now,
      movementId: movId,
    };
    setDebtPayments((prev) => [newPayment, ...prev]);

    return newPayment;
  };

  const deleteDebtPayment = (paymentId: string, reason: string) => {
    const payment = debtPayments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Pagamento não encontrado.');
    if (!payment.movementId) throw new Error('Pagamento antigo sem lançamento vinculado: necessita de reconciliação antes do estorno.');
    reverseBankMovement(payment.movementId, reason, 'Administrador');
    // Preserve payment in its history; debt calculations ignore its reversed entry.
  };

  const addDebtIncrement = (incrementData: {
    debtId: string;
    amount: number;
    reason: string;
    reference?: string;
    responsible?: string;
    date?: string;
  }): DebtIncrement => {
    const debt = debts.find((d) => d.id === incrementData.debtId);
    if (!debt) throw new Error('Dívida não encontrada');

    const now = new Date().toISOString();
    const newIncrement: DebtIncrement = {
      id: createId('dinc'),
      debtId: incrementData.debtId,
      amount: incrementData.amount,
      reason: incrementData.reason.trim(),
      reference: incrementData.reference?.trim() || undefined,
      responsible: incrementData.responsible?.trim() || 'Administrador',
      date: incrementData.date || now,
      createdAt: now,
    };

    setDebts((prev) =>
      prev.map((d) => {
        if (d.id === incrementData.debtId) {
          const initial = d.initialAmount !== undefined ? d.initialAmount : d.totalAmount;
          return {
            ...d,
            initialAmount: initial,
            totalAmount: d.totalAmount + incrementData.amount,
            increments: [newIncrement, ...(d.increments || [])],
          };
        }
        return d;
      })
    );

    addNotification({
      type: 'outro',
      title: 'Acréscimo Rastreável de Dívida',
      message: `Foi acrescentado o montante de ${incrementData.amount.toLocaleString()} Kz à dívida de ${debt.counterpartyName} (${debt.type === 'a_pagar' ? 'A Pagar' : 'A Receber'}). Motivo: "${incrementData.reason.trim()}".`,
      reference: {
        type: 'outro',
        id: debt.id,
      },
    });

    return newIncrement;
  };

  // Caixa / Sales & Transport
  const completeSale = (saleData: {
    warehouseId: string;
    bankId?: string;
    seller?: string;
    clientId?: string;
    clientName?: string;
    items: {
      productId: string;
      productName: string;
      productSku?: string;
      variationId?: string;
      variationSku?: string;
      variationDetails?: string;
      quantity: number;
      unitPrice: number;
    }[];
    paymentMethod: SalePaymentMethod;
    notes?: string;
    requiresTransport: boolean;
    transportDetails?: {
      deliveryAddress: string;
      cost: number;
      estimatedDeliveryDate?: string;
      notes?: string;
    };
  }): { sale: Sale; transport?: Transport } => {
    const targetWh = warehouses.find((w) => w.id === saleData.warehouseId);
    if (!targetWh || targetWh.status !== 'ativo') {
      throw new Error('Armazém de saída inválido, inativo ou não encontrado.');
    }
    const targetComp = companies.find((c) => c.id === targetWh.companyId);
    if (!targetComp) {
      throw new Error('Empresa associada ao armazém não encontrada.');
    }
    if (targetComp.status === 'desativada') {
      throw new Error('Empresa desativada — operações não permitidas.');
    }
    if (targetComp.status === 'parada') {
      throw new Error('Empresa parada — serviços indisponíveis. Vendas bloqueadas para esta empresa.');
    }

    // Regra 2: Resolver e validar o Banco da Venda (ativo, mesma empresa, mesma moeda)
    const saleCurrency = targetComp.currency || 'Kz';
    const candidateBankId = saleData.bankId || targetComp.principalBankId;
    const targetBank = candidateBankId ? banks.find((b) => b.id === candidateBankId) : undefined;

    if (!targetBank) {
      throw new Error('Selecione uma conta bancária válida para liquidar a venda.');
    }

    const isBankActive = targetBank.status === 'ativo' || targetBank.status === 'ativa';
    if (!isBankActive) {
      throw new Error(`A conta bancária "${targetBank.name}" está inativa e não pode receber vendas.`);
    }

    const bankCompany = getCompanyForBank(targetBank.id);
    if (!bankCompany || bankCompany.id !== targetComp.id) {
      throw new Error(
        `A conta bancária "${targetBank.name}" não pertence à empresa "${targetComp.name}". Selecione uma conta ativa da mesma empresa.`
      );
    }

    if ((targetBank.currency || 'Kz') !== saleCurrency) {
      throw new Error(
        `A moeda da conta bancária "${targetBank.name}" (${targetBank.currency}) não coincide com a moeda da venda (${saleCurrency}).`
      );
    }

    // Regra 4: Acumular itens repetidos (mesmo produto e variação) numa única linha
    const consolidatedMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        productSku?: string;
        variationId?: string;
        variationSku?: string;
        variationDetails?: string;
        quantity: number;
        unitPrice: number;
      }
    >();

    if (!Array.isArray(saleData.items)) throw new Error('A venda deve conter uma lista de itens válida.');
    for (const rawItem of saleData.items) {
      validateSaleItem(rawItem, products);
      const key = `${rawItem.productId}::${rawItem.variationId || ''}`;
      const existing = consolidatedMap.get(key);
      if (existing) {
        existing.quantity += Number(rawItem.quantity) || 0;
        if (existing.unitPrice !== rawItem.unitPrice) {
          throw new Error('Itens repetidos devem ter o mesmo preço unitário.');
        }
      } else {
        consolidatedMap.set(key, {
          ...rawItem,
          variationId: rawItem.variationId || undefined,
          quantity: Number(rawItem.quantity) || 0,
          unitPrice: Number(rawItem.unitPrice),
        });
      }
    }

    const consolidatedInputItems = Array.from(consolidatedMap.values());
    if (consolidatedInputItems.length === 0) {
      throw new Error('A venda deve conter pelo menos um item válido.');
    }

    // Validar disponibilidade de estoque para cada item consolidado
    for (const item of consolidatedInputItems) {
      validateSaleItem(item, products);
      const available = getCurrentStock(item.productId, saleData.warehouseId, item.variationId);
      if (item.quantity > available) {
        throw new Error(
          `Estoque insuficiente para "${item.productName}"${
            item.variationDetails ? ` (${item.variationDetails})` : ''
          }. Disponível: ${available} un., solicitado: ${item.quantity} un.`
        );
      }
    }

    const transportCost = saleData.requiresTransport ? saleData.transportDetails?.cost ?? 0 : 0;
    if (!Number.isFinite(transportCost) || transportCost < 0) {
      throw new Error('O custo de transporte deve ser um número válido igual ou superior a zero.');
    }
    const totalSale = consolidatedInputItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, transportCost);
    if (!Number.isFinite(totalSale)) throw new Error('O total da venda excede o limite permitido.');
    const now = new Date().toISOString();
    const saleId = createId('VND');
    const seller = saleData.seller || 'Administrador';

    // 1. Calculate items subtotals and total (Regra 1: incluir custo de transporte no total e na receita)
    let subtotalProducts = 0;
    const saleItems: SaleItem[] = consolidatedInputItems.map((item, idx) => {
      const subtotal = item.quantity * item.unitPrice;
      subtotalProducts += subtotal;
      return {
        ...item,
        id: createId('si'),
        subtotal,
      };
    });


    // 2. Generate stock Movement 'saida' for each sold item
    const newMovements: Movement[] = saleItems.map((item, idx) => ({
      id: createId('mov-sale'),
      productId: item.productId,
      variationId: item.variationId,
      warehouseId: saleData.warehouseId,
      type: 'saida',
      quantity: item.quantity,
      date: now,
      responsible: seller,
      reason: `Venda #${saleId}: ${item.quantity}x ${item.productName}${
        item.variationDetails ? ` (${item.variationDetails})` : ''
      }`,
      reference: `Venda #${saleId}`,
      saleId,
    }));
    setMovements((prev) => [...newMovements, ...prev]);

    // 3. Generate bank movement 'entrada' in the chosen & validated bank (including transport cost)
    const bankMov: BankMovement = {
      id: createId('bmov-sale'),
      bankId: targetBank.id,
      type: 'entrada',
      category: 'Venda',
      amount: totalSale,
      date: now,
      responsible: seller,
      reason: `Receita da Venda #${saleId} (${saleItems.length} ${
        saleItems.length === 1 ? 'item' : 'itens'
      }${saleData.requiresTransport && transportCost > 0 ? ' + transporte' : ''})`,
      reference: `Venda #${saleId}`,
      saleId,
    };
    setBankMovements((prev) => [bankMov, ...prev]);

    // 4. Handle Transport if requested
    let newTransport: Transport | undefined;
    let transportId: string | undefined;

    if (saleData.requiresTransport) {
      transportId = createId('TRP');
      newTransport = {
        id: transportId,
        saleId,
        deliveryAddress: saleData.transportDetails?.deliveryAddress || 'Endereço a definir',
        responsible: seller,
        cost: transportCost,
        status: 'pendente',
        estimatedDeliveryDate: saleData.transportDetails?.estimatedDeliveryDate,
        notes: saleData.transportDetails?.notes,
        createdAt: now,
      };
      setTransports((prev) => [newTransport!, ...prev]);
    }

    // 5. Record Sale with original bankId and transportCost
    const newSale: Sale = {
      id: saleId,
      date: now,
      seller,
      clientId: saleData.clientId,
      clientName: saleData.clientName,
      warehouseId: saleData.warehouseId,
      bankId: targetBank.id,
      items: saleItems,
      paymentMethod: saleData.paymentMethod,
      total: totalSale,
      transportCost: saleData.requiresTransport ? transportCost : undefined,
      status: 'concluida',
      notes: saleData.notes,
      requiresTransport: saleData.requiresTransport,
      transportId,
    };

    setSales((prev) => [newSale, ...prev]);

    return { sale: newSale, transport: newTransport };
  };

  const cancelSale = (
    saleId: string,
    reason?: string
  ): { success: boolean; message?: string } => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return { success: false, message: 'Venda não encontrada' };
    if (sale.status === 'cancelada' || cancelledSaleIds.current.has(saleId)) return { success: false, message: 'Esta venda já está cancelada' };

    const warehouse = warehouses.find((w) => w.id === sale.warehouseId);
    const company = companies.find((c) => c.id === warehouse?.companyId);
    if (company?.status === 'parada') {
      return { success: false, message: 'Empresa parada — serviços indisponíveis. Estorno bloqueado.' };
    }
    if (company?.status === 'desativada') {
      return { success: false, message: 'Empresa desativada — operações não permitidas.' };
    }

    if (!reason?.trim()) return { success: false, message: 'O motivo do cancelamento é obrigatório.' };
    const originalSaleBankMov = bankMovements.find((bm) =>
      bm.type === 'entrada' && !bm.reversalOfId &&
      (bm.saleId === saleId || bm.reference === `Venda #${saleId}`)
    );
    if (!originalSaleBankMov) return { success: false, message: 'Venda sem lançamento financeiro original. Reconcilie o histórico antes de cancelar.' };
    if (!banks.some((bank) => bank.id === originalSaleBankMov.bankId)) {
      return { success: false, message: 'A conta bancária original não foi encontrada.' };
    }
    const bankCheck = isBankOperationBlocked(originalSaleBankMov.bankId);
    if (bankCheck.blocked) return { success: false, message: bankCheck.message };
    cancelledSaleIds.current.add(saleId);
    if (!originalSaleBankMov.isReversed && !bankMovements.some((m) => m.reversalOfId === originalSaleBankMov.id)) {
      try { reverseBankMovement(originalSaleBankMov.id, reason.trim()); }
      catch (error) {
        cancelledSaleIds.current.delete(saleId);
        return { success: false, message: error instanceof Error ? error.message : 'Não foi possível estornar a venda.' };
      }
    }
    const now = new Date().toISOString();

    // 1. Regra 3: Repor em estoque SÓ as saídas que ainda estão ativas (evitar devolução dupla)
    const saleOutMovements = movements.filter(
      (m) =>
        m.type === 'saida' &&
        (m.saleId === saleId ||
          m.reference === `Venda #${saleId}` ||
          m.reason?.includes(`Venda #${saleId}`) ||
          m.reason?.includes(`Venda ${saleId}`))
    );

    let reverseMovements: Movement[] = [];
    if (saleOutMovements.length > 0) {
      // Apenas saídas que NÃO foram removidas do histórico
      const activeOutMovements = saleOutMovements.filter((m) => !m.removido && !m.isRemoved);
      reverseMovements = activeOutMovements.map((outMov, idx) => {
        const matchedItem = sale.items.find(
          (it) =>
            it.productId === outMov.productId &&
            (it.variationId || '') === (outMov.variationId || '')
        );
        const prod = products.find((p) => p.id === outMov.productId);
        const itemName = matchedItem?.productName || prod?.name || outMov.productId;
        return {
          id: createId('mov-cancel'),
          productId: outMov.productId,
          variationId: outMov.variationId,
          warehouseId: outMov.warehouseId || sale.warehouseId,
          type: 'entrada',
          quantity: outMov.quantity,
          date: now,
          responsible: 'Administrador',
          reason: `Estorno de Venda #${saleId} (${outMov.quantity}x ${itemName})${
            reason ? `: ${reason}` : ''
          }`,
          reference: `Estorno #${saleId}`,
          saleId,
        };
      });
    } else {
      // Fallback para vendas antigas sem movimentos de saída individualizados
      reverseMovements = sale.items.map((item, idx) => ({
        id: createId('mov-cancel'),
        productId: item.productId,
        variationId: item.variationId,
        warehouseId: sale.warehouseId,
        type: 'entrada',
        quantity: item.quantity,
        date: now,
        responsible: 'Administrador',
        reason: `Estorno de Venda #${saleId}${reason ? `: ${reason}` : ''}`,
        reference: `Estorno #${saleId}`,
        saleId,
      }));
    }

    if (reverseMovements.length > 0) {
      setMovements((prev) => [...reverseMovements, ...prev]);
    }

    // 3. Regra 3: Cancelar entregas de Transporte ainda não concluídas (pendente / em_transito -> cancelado)
    setTransports((prev) =>
      prev.map((t) => {
        const isLinkedToSale =
          t.saleId === saleId || (sale.transportId && t.id === sale.transportId);
        if (isLinkedToSale && t.status !== 'entregue' && t.status !== 'cancelado') {
          return {
            ...t,
            status: 'cancelado',
          };
        }
        return t;
      })
    );

    // 4. Mark sale as cancelada
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, status: 'cancelada' } : s))
    );

    return { success: true };
  };

  const addTransport = (
    transportData: Omit<Transport, 'id' | 'createdAt'>
  ): Transport => {
    const now = new Date().toISOString();
    const newTransport: Transport = {
      ...transportData,
      id: createId('TRP'),
      createdAt: now,
    };
    setTransports((prev) => [newTransport, ...prev]);
    return newTransport;
  };

  const updateTransportStatus = (
    transportId: string,
    newStatus: TransportStatus,
    actualDeliveryDate?: string
  ): void => {
    const now = new Date().toISOString();
    setTransports((prev) =>
      prev.map((t) => {
        if (t.id === transportId) {
          return {
            ...t,
            status: newStatus,
            actualDeliveryDate:
              newStatus === 'entregue'
                ? actualDeliveryDate || now.split('T')[0]
                : t.actualDeliveryDate,
          };
        }
        return t;
      })
    );
  };

  const updateTransport = (
    transportId: string,
    updates: Partial<Transport>
  ): void => {
    setTransports((prev) =>
      prev.map((t) => (t.id === transportId ? { ...t, ...updates } : t))
    );
  };

  // ==========================================
  // CALENDÁRIO & AGENDAS IMPLEMENTATION
  // ==========================================

  // Unified dynamic events list (manual + birthdays + deliveries)
  const events = useMemo<CalendarEvent[]>(() => {
    const list: CalendarEvent[] = [...manualEvents];

    // 1. Aniversários (Automática de Empregados)
    const anivAgenda = agendas.find(
      (a) => a.id === 'agenda-aniversarios' || a.automaticSource === 'aniversarios'
    );
    if (anivAgenda && anivAgenda.status === 'ativa') {
      employees.forEach((emp) => {
        if (emp.birthDate && emp.status === 'ativo') {
          const monthDay = emp.birthDate.slice(5); // "MM-DD"
          const eventId = `evt-aniv-${emp.id}`;
          const isOverridden = autoEventStatusOverrides[eventId];
          list.push({
            id: eventId,
            agendaId: anivAgenda.id,
            title: `Aniversário: ${emp.name}`,
            date: `2026-${monthDay}`,
            time: '09:00',
            description: `${emp.role}${emp.department ? ` • ${emp.department}` : ''}`,
            status: isOverridden || 'pendente',
            originRef: {
              type: 'empregado',
              id: emp.id,
              label: emp.name,
            },
            createdAt: emp.createdAt,
          });
        }
      });
    }

    // 2. Entregas (Automática de Transportes)
    const entregaAgenda = agendas.find(
      (a) => a.id === 'agenda-entregas' || a.automaticSource === 'entregas'
    );
    if (entregaAgenda && entregaAgenda.status === 'ativa') {
      transports.forEach((trp) => {
        // Excluir qualquer entrega vinculada a empresas desativadas (como Kianda)
        const sale = sales.find((s) => s.id === trp.saleId);
        const wh = warehouses.find((w) => w.id === sale?.warehouseId);
        const comp = companies.find((c) => c.id === wh?.companyId);
        if (comp && comp.status === 'desativada') return;
        if (sale?.warehouseId && isWarehouseDisabled(sale.warehouseId)) return;
        if (
          trp.id.includes('KND') ||
          trp.saleId?.includes('KND') ||
          trp.driver?.toLowerCase().includes('kianda') ||
          trp.vehicle?.toLowerCase().includes('kianda')
        ) {
          const kiandaComp = companies.find((c) => c.id === 'comp-kianda');
          if (kiandaComp ? kiandaComp.status === 'desativada' : true) return;
        }

        const eventDate =
          trp.estimatedDeliveryDate ||
          (trp.actualDeliveryDate ? trp.actualDeliveryDate.slice(0, 10) : trp.createdAt.slice(0, 10));
        if (eventDate) {
          const eventId = `evt-trp-${trp.id}`;
          const isOverridden = autoEventStatusOverrides[eventId];
          list.push({
            id: eventId,
            agendaId: entregaAgenda.id,
            title: `Entrega: ${trp.saleId ? `Venda #${trp.saleId}` : trp.id}`,
            date: eventDate,
            time: '11:00',
            description: `${trp.deliveryAddress}${trp.notes ? ` • ${trp.notes}` : ''}`,
            status: isOverridden || (trp.status === 'entregue' ? 'concluido' : 'pendente'),
            originRef: {
              type: 'transporte',
              id: trp.id,
              label: trp.id,
            },
            createdAt: trp.createdAt,
          });
        }
      });
    }

    return list;
  }, [manualEvents, agendas, employees, transports, sales, warehouses, companies, autoEventStatusOverrides]);

  const addAgenda = (
    agendaData: Omit<Agenda, 'id' | 'createdAt' | 'status' | 'origin'> & {
      origin?: AgendaOrigin;
      status?: AgendaStatus;
    }
  ): Agenda => {
    const newAgenda: Agenda = {
      ...agendaData,
      id: createId('agenda'),
      origin: agendaData.origin || 'manual',
      status: agendaData.status || 'ativa',
      createdAt: new Date().toISOString(),
    };
    setAgendas((prev) => [...prev, newAgenda]);
    return newAgenda;
  };

  const updateAgenda = (id: string, updates: Partial<Agenda>): void => {
    setAgendas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const toggleArchiveAgenda = (id: string): void => {
    setAgendas((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === 'ativa' ? 'arquivada' : 'ativa' }
          : a
      )
    );
  };

  const deleteAgenda = (id: string): { success: boolean; message?: string } => {
    const target = agendas.find((a) => a.id === id);
    if (!target) return { success: false, message: 'Agenda não encontrada' };
    if (target.origin === 'automatica') {
      return {
        success: false,
        message: 'Agendas automáticas do sistema não podem ser eliminadas.',
      };
    }
    setManualEvents((prev) => prev.filter((e) => e.agendaId !== id));
    setAgendas((prev) => prev.filter((a) => a.id !== id));
    return { success: true };
  };

  const addEvent = (
    eventData: Omit<CalendarEvent, 'id' | 'createdAt'>
  ): CalendarEvent => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: createId('evt-man'),
      createdAt: new Date().toISOString(),
    };
    setManualEvents((prev) => [newEvent, ...prev]);

    // Check if event is scheduled within 7 days and push notification
    try {
      const eventTime = new Date(newEvent.date).getTime();
      const nowTime = new Date('2026-09-13').getTime();
      const diffDays = (eventTime - nowTime) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 7) {
        addNotification({
          type: 'evento_proximo',
          title: 'Novo Compromisso Agendado',
          message: `${newEvent.title} em ${newEvent.date}${newEvent.time ? ` às ${newEvent.time}` : ''}.`,
          reference: { type: 'evento', id: newEvent.id },
        });
      }
    } catch {
      // ignore
    }

    return newEvent;
  };

  const updateEvent = (id: string, updates: Partial<CalendarEvent>): void => {
    if (id.startsWith('evt-trp-')) {
      const trpId = id.replace('evt-trp-', '');
      if (updates.status) {
        updateTransportStatus(
          trpId,
          updates.status === 'concluido' ? 'entregue' : 'em_transito'
        );
      }
      setAutoEventStatusOverrides((prev) => ({
        ...prev,
        [id]: updates.status || (prev[id] === 'concluido' ? 'pendente' : 'concluido'),
      }));
      return;
    }

    if (id.startsWith('evt-aniv-')) {
      if (updates.status) {
        setAutoEventStatusOverrides((prev) => ({
          ...prev,
          [id]: updates.status!,
        }));
      }
      return;
    }

    setManualEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, ...updates, updatedAt: new Date().toISOString() }
          : e
      )
    );
  };

  const toggleEventStatus = (id: string): void => {
    if (id.startsWith('evt-trp-')) {
      const trpId = id.replace('evt-trp-', '');
      const current =
        autoEventStatusOverrides[id] ||
        (transports.find((t) => t.id === trpId)?.status === 'entregue'
          ? 'concluido'
          : 'pendente');
      const next = current === 'concluido' ? 'pendente' : 'concluido';
      setAutoEventStatusOverrides((prev) => ({ ...prev, [id]: next }));
      updateTransportStatus(trpId, next === 'concluido' ? 'entregue' : 'em_transito');
      return;
    }

    if (id.startsWith('evt-aniv-')) {
      const current = autoEventStatusOverrides[id] || 'pendente';
      const next = current === 'concluido' ? 'pendente' : 'concluido';
      setAutoEventStatusOverrides((prev) => ({ ...prev, [id]: next }));
      return;
    }

    setManualEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: e.status === 'concluido' ? 'pendente' : 'concluido',
              updatedAt: new Date().toISOString(),
            }
          : e
      )
    );
  };

  const deleteEvent = (id: string): void => {
    setManualEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const addEmployee = (
    empData: Omit<Employee, 'id' | 'createdAt'>
  ): Employee => {
    const newEmp: Employee = {
      ...empData,
      id: createId('emp'),
      createdAt: new Date().toISOString(),
    };
    setEmployees((prev) => [...prev, newEmp]);
    return newEmp;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>): void => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteEmployee = (id: string): { success: boolean; message?: string } => {
    const target = employees.find((e) => e.id === id);
    if (!target) return { success: false, message: 'Funcionário não encontrado.' };

    const hasMovements = movements.some(
      (m) => m.responsible === target.name || m.responsible === target.id
    );
    const hasSales = sales.some(
      (s) => s.seller === target.name || s.seller === target.id
    );
    const hasTransports = transports.some(
      (t) => t.responsible === target.name || (t as any).driver === target.name
    );
    const hasBankMovements = bankMovements.some(
      (bm) => bm.responsible === target.name
    );

    if (hasMovements || hasSales || hasTransports || hasBankMovements) {
      return {
        success: false,
        message: `Não é possível eliminar o funcionário "${target.name}" porque possui histórico associado em movimentações, vendas, finanças ou entregas.`,
      };
    }

    setEmployees((prev) => prev.filter((e) => e.id !== id));
    return { success: true };
  };

  // ==========================================
  // CLIENTES (CONTACTOS)
  // ==========================================

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: createId('cli'),
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (
    id: string,
    updates: Partial<Omit<Client, 'id' | 'createdAt'>>
  ): void => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteClient = (id: string): { success: boolean; message?: string } => {
    const target = clients.find((c) => c.id === id);
    if (!target) return { success: false, message: 'Cliente não encontrado.' };

    const hasSales = sales.some((s) => s.clientId === id || s.clientName === target.name);
    if (hasSales) {
      const saleCount = sales.filter((s) => s.clientId === id || s.clientName === target.name).length;
      return {
        success: false,
        message: `Não é possível eliminar o cliente "${target.name}" porque possui ${saleCount} venda(s) associada(s) no sistema.`,
      };
    }

    setClients((prev) => prev.filter((c) => c.id !== id));
    return { success: true };
  };

  // ==========================================
  // NOTIFICAÇÕES (SISTEMA CENTRAL PARTILHADO)
  // ==========================================

  const addNotification = (
    notifData: Omit<NotificationItem, 'id' | 'date' | 'read'> & {
      date?: string;
      read?: boolean;
    }
  ): NotificationItem => {
    const newNotif: NotificationItem = {
      ...notifData,
      id: createId('notif'),
      date: notifData.date || new Date().toISOString(),
      read: notifData.read ?? false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    return newNotif;
  };

  const markNotificationAsRead = (id: string): void => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = (): void => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string): void => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const canResetData = movements.length === 0 && bankMovements.length === 0 && sales.length === 0 &&
    transports.length === 0 && debtPayments.length === 0 && debts.length === 0 && defectiveRecords.length === 0 &&
    !purchaseLists.some((list) => normalizePurchaseListStatus(list.status) === 'concluido');
  const assertResetAllowed = () => {
    if (!canResetData) throw new Error('Reposição bloqueada: existem registos operacionais ou financeiros. O histórico deve ser preservado.');
  };

  const resetToDefaults = () => {
    assertResetAllowed();
    Object.keys(localStorage).filter((key) => key.startsWith('myoffice_')).forEach((key) => localStorage.removeItem(key));
    setProducts(INITIAL_PRODUCTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setCompanies(INITIAL_COMPANIES);
    setWarehouses(INITIAL_WAREHOUSES);
    setStockConfigs(INITIAL_STOCK_CONFIGS);
    setMovements(INITIAL_MOVEMENTS);
    setDefectiveRecords(INITIAL_DEFECTIVE_RECORDS);
    setCategories(INITIAL_CATEGORIES);
    setProductDrafts([]);
    setPurchaseGroups(INITIAL_PURCHASE_GROUPS);
    setPurchaseLists(INITIAL_PURCHASE_LISTS);
    setPurchaseSources(INITIAL_PURCHASE_SOURCES);
    setBanks(INITIAL_BANKS);
    setBankMovements(INITIAL_BANK_MOVEMENTS);
    setSales(INITIAL_SALES);
    setTransports(INITIAL_TRANSPORTS);
    setAgendas(INITIAL_AGENDAS);
    setManualEvents(INITIAL_MANUAL_EVENTS);
    setEmployees(INITIAL_EMPLOYEES);
    setClients(INITIAL_CLIENTS);
    setDebts(INITIAL_DEBTS);
    setDebtPayments(INITIAL_DEBT_PAYMENTS);
    setAutoEventStatusOverrides({});
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  /**
   * Opção A — "Zerar histórico"
   * Apaga todo o histórico transacional do sistema, mantendo o catálogo/configuração intacto.
   *
   * O que é apagado:
   * - Todas as Movimentações de Estoque (incluindo defeituosos / lixeira)
   * - Todas as Movimentações Bancárias
   * - Todas as Vendas e Transportes
   * - Todas as Notificações
   * - Todos os eventos do Calendário (eventos manuais e overrides)
   *
   * O que NÃO é apagado (permanece intacto):
   * - Produtos, Variações cadastradas e Rascunhos
   * - Empresas, Armazéns e Bancos (com saldos/quantidades recalculados para zero já que não há movimentações)
   * - Contactos (Funcionários, Clientes, Fornecedores, Afiliados)
   * - Agendas (estruturas de calendário) e Grupos/Listas de Compras
   *
   * NOTA FUTURA DE PERMISSÕES:
   * Quando o sistema de permissões do Empregado existir no futuro, esta ação deve
   * ficar restrita ao papel de Administrador.
   */
  const resetHistory = () => {
    assertResetAllowed();
    // Salvar arrays vazios no localStorage para persistir o reset de histórico entre recarregamentos
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}history_reset`, 'true');
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}movements`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}defective`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}bankMovements`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}sales`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}transports`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}debtPayments`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}manualEvents`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}autoEventStatusOverrides`, JSON.stringify({}));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}notifications`, JSON.stringify([]));

    // Reset de estado dos dados transacionais
    setMovements([]);
    setDefectiveRecords([]);
    setBankMovements([]);
    setSales([]);
    setTransports([]);
    setDebtPayments([]);
    setManualEvents([]);
    setAutoEventStatusOverrides({});
    setNotifications([]);
  };

  /**
   * Opção B — "Zerar tudo"
   * Apaga absolutamente tudo, incluindo o catálogo e a configuração — deixa o sistema
   * como se tivesse acabado de ser instalado, sem nenhum dado.
   *
   * NOTA PARA DESENVOLVIMENTO:
   * Esta opção existe nesta fase por ser útil para testes durante o desenvolvimento.
   * Pode ser mantida ou removida mais adiante, quando o sistema estiver em uso real.
   *
   * NOTA FUTURA DE PERMISSÕES:
   * Quando o sistema de permissões do Empregado existir no futuro, esta ação deve
   * ficar restrita ao papel de Administrador.
   */
  const resetAll = () => {
    assertResetAllowed();
    // Limpar todo o armazenamento local
    Object.keys(localStorage).filter((key) => key.startsWith('myoffice_')).forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}is_fresh_install`, 'true');
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}products`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}companies`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}warehouses`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}banks`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}stockConfigs`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}movements`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}defective`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}bankMovements`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}debts`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}debtPayments`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}sales`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}transports`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}manualEvents`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}autoEventStatusOverrides`, JSON.stringify({}));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}notifications`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}employees`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}clients`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}suppliers`, JSON.stringify([]));

    // Resetar todos os estados para vazio absoluto (instalação do zero)
    setMovements([]);
    setDefectiveRecords([]);
    setBankMovements([]);
    setDebts([]);
    setDebtPayments([]);
    setSales([]);
    setTransports([]);
    setManualEvents([]);
    setAutoEventStatusOverrides({});
    setNotifications([]);

    setProducts([]);
    setStockConfigs([]);
    setProductDrafts([]);
    setCompanies([]);
    setWarehouses([]);
    setBanks([]);
    setEmployees([]);
    setClients([]);
    setSuppliers([]);
    setPurchaseGroups([]);
    setPurchaseLists([]);
    setPurchaseSources([]);
    setAgendas([]);
  };

  const value = useMemo(
    () => ({
      products,
      suppliers,
      warehouses,
      companies,
      stockConfigs,
      movements,
      defectiveRecords,
      categories,
      productDrafts,
      purchaseGroups,
      purchaseLists,
      purchaseSources,
      getCurrentStock,
      getProductStockInfo,
      getProductStockInfoForCompany,
      getProductMovements,
      getProductWarehouses,
      getProductCompanies,
      isProductInCompany,
      checkProductSkuExists,
      checkProductNameExists,
      isCompanyActive,
      isCompanyDisabled,
      isCompanyStopped,
      getCompanyStatus,
      isWarehouseOperational,
      isWarehouseStopped,
      isWarehouseDisabled,
      addCompany,
      updateCompany,
      deleteCompany,
      addWarehouse,
      updateWarehouse,
      deleteWarehouse,
      addProduct,
      updateProduct,
      deleteProduct,
      saveProductDraft,
      deleteProductDraft,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addCategory,
      recordMovement,
      removeStockMovement,
      restoreStockMovement,
      recordDefective,
      updateDefectiveResolution,
      updateStockLimits,
      addPurchaseGroup,
      updatePurchaseGroup,
      addPurchaseList,
      updatePurchaseList,
      deletePurchaseList,
      addPurchaseSource,
      updatePurchaseSource,
      toggleSourceAccounted,
      deletePurchaseSource,
      canResetData,
      resetToDefaults,
      resetHistory,
      resetAll,

      // Financeiro (Contas & Movimentações)
      banks,
      bankMovements,
      getBankBalance,
      getBankMovements,
      addBank,
      updateBank,
      deleteBank,
      recordBankMovement,
      getCompanyForBank,
      isBankOperationBlocked,
      reverseBankMovement,
      removeFinancialMovement,
      restoreFinancialMovement,

      // Dívidas & Pagamentos
      debts,
      debtPayments,
      getDebtCalculations,
      addDebt,
      updateDebt,
      deleteDebt,
      recordDebtPayment,
      deleteDebtPayment,
      addDebtIncrement,

      // Caixa
      sales,
      transports,
      completeSale,
      cancelSale,
      addTransport,
      updateTransportStatus,
      updateTransport,

      // Contactos (Clientes)
      clients,
      addClient,
      updateClient,
      deleteClient,

      // Calendário & Agendas & Funcionários
      agendas,
      events,
      manualEvents,
      employees,
      addAgenda,
      updateAgenda,
      toggleArchiveAgenda,
      deleteAgenda,
      addEvent,
      updateEvent,
      toggleEventStatus,
      deleteEvent,
      addEmployee,
      updateEmployee,
      deleteEmployee,

      // Notificações
      notifications,
      unreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      addNotification,
    }),
    [
      products,
      suppliers,
      warehouses,
      companies,
      stockConfigs,
      movements,
      defectiveRecords,
      categories,
      productDrafts,
      purchaseGroups,
      purchaseLists,
      purchaseSources,
      banks,
      bankMovements,
      debts,
      debtPayments,
      sales,
      transports,
      clients,
      agendas,
      events,
      manualEvents,
      employees,
      notifications,
      unreadNotificationsCount,
    ]
  );

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
};

export const useStock = (): StockContextType => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};
