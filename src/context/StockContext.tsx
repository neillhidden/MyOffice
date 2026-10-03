import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
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
  deleteDebtPayment: (paymentId: string) => void;
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
    if (saved) {
      try {
        const parsed: Movement[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const hasKianda = parsed.some((m) => m.id === 'mov-knd-in-1');
          return hasKianda ? parsed : [...parsed, ...KIANDA_INITIAL_MOVEMENTS, ...KIANDA_SALE_MOVEMENTS];
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
    if (saved) {
      try {
        const parsed: BankMovement[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const hasKianda = parsed.some((bm) => bm.bankId === 'bank-kianda');
          return hasKianda ? parsed : [...parsed, ...KIANDA_BANK_MOVEMENTS];
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_BANK_MOVEMENTS;
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
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const hasKianda = parsed.some((s) => s.warehouseId === 'wh-kianda');
          return hasKianda ? parsed : [...parsed, ...KIANDA_SALES];
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_SALES;
  });

  const [transports, setTransports] = useState<Transport[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}transports`);
    if (saved) {
      try {
        const parsed: Transport[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const hasKianda = parsed.some((t) => t.id === 'TRP-KND-01');
          return hasKianda ? parsed : [...parsed, ...KIANDA_TRANSPORTS];
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
    const newProductId = `prod-${Date.now()}`;
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
      id: `comp-${Date.now()}`,
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
      id: `wh-${Date.now()}`,
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
    const draftId = draftData.id || `draft-${Date.now()}`;
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
      id: `sup-${Date.now()}`,
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
      id: `mov-${Date.now()}`,
      date: movementData.date || new Date().toISOString(),
    };
    setMovements((prev) => [newMovement, ...prev]);

    // Ligação automática com o Financeiro: Compra de estoque gera saída financeira automática
    if (financialExit && financialExit.amount > 0 && financialExit.bankId) {
      const bankMov: BankMovement = {
        id: `bmov-stock-${Date.now()}`,
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
    const movementId = `mov-def-${Date.now()}`;

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
      reference: `Auto-DEF-${Date.now().toString().slice(-4)}`,
    };
    setMovements((prev) => [defectMovement, ...prev]);

    // 2. Defective Record
    const record: DefectiveRecord = {
      id: `def-${Date.now()}`,
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
      id: `grp-${Date.now()}`,
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
      id: `list-${Date.now()}`,
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
      id: `src-${Date.now()}`,
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
      id: `bank-${Date.now()}`,
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
    // 1. Direct match by principalBankId on Company
    const byPrincipal = companies.find((c) => c.principalBankId === bankId);
    if (byPrincipal) return byPrincipal;
    // 2. Direct match by companyId on Bank
    if (bank && bank.companyId) {
      const byCompanyId = companies.find((c) => c.id === bank.companyId);
      if (byCompanyId) return byCompanyId;
    }
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
      id: `bmov-${Date.now()}`,
      date: movementData.date || new Date().toISOString(),
    };
    setBankMovements((prev) => [newMovement, ...prev]);
    return newMovement;
  };

  // Regra de auditoria Financeira: Remoção com motivo e notificação ao Administrador
  const removeFinancialMovement = (
    movementId: string,
    reason: string,
    removedBy: string = 'Administrador'
  ) => {
    const mov = bankMovements.find((m) => m.id === movementId);
    if (!mov) return;

    setBankMovements((prev) =>
      prev.map((m) =>
        m.id === movementId
          ? {
              ...m,
              isRemoved: true,
              removedAt: new Date().toISOString(),
              removedReason: reason,
              removedBy,
            }
          : m
      )
    );

    const bank = banks.find((b) => b.id === mov.bankId);
    addNotification({
      type: 'outro',
      title: 'Lançamento Removido do Histórico',
      message: `O lançamento #${mov.id} (${mov.type.toUpperCase()}) no valor de ${mov.amount.toLocaleString()} ${bank?.currency || 'Kz'} foi removido do histórico por ${removedBy}. Motivo da auditoria: "${reason}"`,
      reference: {
        type: 'outro',
        id: mov.id,
      },
    });
  };

  // Regra de auditoria Financeira: Restaurar lançamento
  const restoreFinancialMovement = (movementId: string) => {
    const mov = bankMovements.find((m) => m.id === movementId);
    if (!mov) return;

    setBankMovements((prev) =>
      prev.map((m) =>
        m.id === movementId
          ? {
              ...m,
              isRemoved: false,
              removedAt: undefined,
              removedReason: undefined,
              removedBy: undefined,
            }
          : m
      )
    );

    const bank = banks.find((b) => b.id === mov.bankId);
    addNotification({
      type: 'outro',
      title: 'Lançamento Restaurado ao Histórico',
      message: `O lançamento #${mov.id} no valor de ${mov.amount.toLocaleString()} ${bank?.currency || 'Kz'} foi restaurado ao extrato ativo.`,
      reference: {
        type: 'outro',
        id: mov.id,
      },
    });
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
    const payments = debtPayments.filter((p) => p.debtId === debt.id);
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
      id: `deb-${Date.now()}`,
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
          'Esta dívida possui pagamentos registrados no histórico e não pode ser eliminada. Registre um estorno/ajuste ou remova os pagamentos primeiro.',
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
    if (!debt) throw new Error('Dívida não encontrada');

    const now = new Date().toISOString();
    const paymentId = `pay-${Date.now()}`;
    const movId = `bmov-debt-${Date.now()}`;

    // Sincronização com o Financeiro:
    // Se a dívida é a receber e estamos a receber pagamento -> entrada
    // Se a dívida é a pagar e estamos a pagar -> saída
    const movType: BankMovementType = debt.type === 'a_receber' ? 'entrada' : 'saida';
    const bankMov: BankMovement = {
      id: movId,
      bankId: paymentData.bankId,
      type: movType,
      category: 'Dívida',
      amount: paymentData.amount,
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
      amount: paymentData.amount,
      date: paymentData.date || now,
      bankId: paymentData.bankId,
      responsible: paymentData.responsible || 'Administrador',
      notes: paymentData.notes,
      createdAt: now,
      movementId: movId,
    };
    setDebtPayments((prev) => [newPayment, ...prev]);

    return newPayment;
  };

  const deleteDebtPayment = (paymentId: string) => {
    const payment = debtPayments.find((p) => p.id === paymentId);
    if (!payment) return;

    if (payment.movementId) {
      setBankMovements((prev) => prev.filter((m) => m.id !== payment.movementId));
    }
    setDebtPayments((prev) => prev.filter((p) => p.id !== paymentId));
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
      id: `dinc-${Date.now()}`,
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
    const targetComp = companies.find((c) => c.id === targetWh?.companyId);
    if (targetComp?.status === 'desativada') {
      throw new Error('Empresa desativada — operações não permitidas.');
    }
    if (targetComp?.status === 'parada') {
      throw new Error('Empresa parada — serviços indisponíveis. Vendas bloqueadas para esta empresa.');
    }

    const now = new Date().toISOString();
    const saleId = `VND-${Date.now().toString().slice(-4)}`;
    const seller = saleData.seller || 'Administrador';

    // 1. Calculate items with subtotals and total
    let totalSale = 0;
    const saleItems: SaleItem[] = saleData.items.map((item, idx) => {
      const subtotal = item.quantity * item.unitPrice;
      totalSale += subtotal;
      return {
        ...item,
        id: `si-${Date.now()}-${idx}`,
        subtotal,
      };
    });

    // 2. Generate stock Movement 'saida' for each sold item
    const newMovements: Movement[] = saleItems.map((item, idx) => ({
      id: `mov-sale-${Date.now()}-${idx}`,
      productId: item.productId,
      variationId: item.variationId,
      warehouseId: saleData.warehouseId,
      type: 'saida',
      quantity: item.quantity,
      date: now,
      responsible: seller,
      reason: `Venda ${saleId}: ${item.quantity}x ${item.productName}${
        item.variationDetails ? ` (${item.variationDetails})` : ''
      }`,
      reference: `Venda #${saleId}`,
    }));
    setMovements((prev) => [...newMovements, ...prev]);

    // 3. Find target Bank from Warehouse -> Company -> Principal Bank
    const warehouse = warehouses.find((w) => w.id === saleData.warehouseId);
    const company = companies.find((c) => c.id === warehouse?.companyId);
    let targetBankId = company?.principalBankId;
    if (!targetBankId || !banks.some((b) => b.id === targetBankId)) {
      targetBankId = banks[0]?.id;
    }

    // 4. Generate bank movement 'entrada'
    if (targetBankId) {
      const bankMov: BankMovement = {
        id: `bmov-sale-${Date.now()}`,
        bankId: targetBankId,
        type: 'entrada',
        category: 'Venda',
        amount: totalSale,
        date: now,
        responsible: seller,
        reason: `Receita da Venda #${saleId} (${saleItems.length} ${
          saleItems.length === 1 ? 'item' : 'itens'
        })`,
        reference: `Venda #${saleId}`,
      };
      setBankMovements((prev) => [bankMov, ...prev]);
    }

    // 5. Handle Transport if requested
    let newTransport: Transport | undefined;
    let transportId: string | undefined;

    if (saleData.requiresTransport) {
      transportId = `TRP-${Date.now().toString().slice(-4)}`;
      newTransport = {
        id: transportId,
        saleId,
        deliveryAddress: saleData.transportDetails?.deliveryAddress || 'Endereço a definir',
        responsible: seller,
        cost: saleData.transportDetails?.cost || 0,
        status: 'pendente',
        estimatedDeliveryDate: saleData.transportDetails?.estimatedDeliveryDate,
        notes: saleData.transportDetails?.notes,
        createdAt: now,
      };
      setTransports((prev) => [newTransport!, ...prev]);
    }

    // 6. Record Sale
    const newSale: Sale = {
      id: saleId,
      date: now,
      seller,
      clientId: saleData.clientId,
      clientName: saleData.clientName,
      warehouseId: saleData.warehouseId,
      items: saleItems,
      paymentMethod: saleData.paymentMethod,
      total: totalSale,
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
    if (sale.status === 'cancelada') return { success: false, message: 'Esta venda já está cancelada' };

    const warehouse = warehouses.find((w) => w.id === sale.warehouseId);
    const company = companies.find((c) => c.id === warehouse?.companyId);
    if (company?.status === 'parada') {
      return { success: false, message: 'Empresa parada — serviços indisponíveis. Estorno bloqueado.' };
    }
    if (company?.status === 'desativada') {
      return { success: false, message: 'Empresa desativada — operações não permitidas.' };
    }

    const now = new Date().toISOString();

    // 1. Revert stock: create 'entrada' movement for each item
    const reverseMovements: Movement[] = sale.items.map((item, idx) => ({
      id: `mov-cancel-${Date.now()}-${idx}`,
      productId: item.productId,
      variationId: item.variationId,
      warehouseId: sale.warehouseId,
      type: 'entrada',
      quantity: item.quantity,
      date: now,
      responsible: 'Administrador',
      reason: `Estorno de Venda ${saleId}${reason ? `: ${reason}` : ''}`,
      reference: `Estorno #${saleId}`,
    }));
    setMovements((prev) => [...reverseMovements, ...prev]);

    // 2. Revert bank: create 'saida' movement in the target bank
    const targetBankId = company?.principalBankId || banks[0]?.id;

    if (targetBankId) {
      const reverseBankMov: BankMovement = {
        id: `bmov-cancel-${Date.now()}`,
        bankId: targetBankId,
        type: 'saida',
        amount: sale.total,
        date: now,
        responsible: 'Administrador',
        reason: `Estorno da Venda #${saleId}${reason ? `: ${reason}` : ''}`,
        reference: `Estorno #${saleId}`,
      };
      setBankMovements((prev) => [reverseBankMov, ...prev]);
    }

    // 3. Mark sale as cancelada
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
      id: `TRP-${Date.now().toString().slice(-4)}`,
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
      id: `agenda-${Date.now()}`,
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
      id: `evt-man-${Date.now()}`,
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
      id: `emp-${Date.now()}`,
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
      id: `cli-${Date.now()}`,
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
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

  const resetToDefaults = () => {
    localStorage.clear();
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
    // Limpar todo o armazenamento local
    localStorage.clear();
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
