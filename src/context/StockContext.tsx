import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Product,
  Supplier,
  Warehouse,
  Company,
  StockConfig,
  Movement,
  DefectiveRecord,
  PurchaseGroup,
  PurchaseList,
  PurchaseSource,
  MovementType,
  DefectReason,
  DefectDecision,
  ProductDraft,
  Bank,
  BankMovement,
  Sale,
  SaleItem,
  Transport,
  SalePaymentMethod,
  TransportStatus,
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
} from '../data/seedData';
import {
  INITIAL_AGENDAS,
  INITIAL_MANUAL_EVENTS,
  INITIAL_EMPLOYEES,
  INITIAL_CLIENTS,
  INITIAL_NOTIFICATIONS,
} from '../data/calendarSeedData';
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
  getProductWarehouses: (productId: string) => Warehouse[];
  getProductCompanies: (productId: string) => Company[];

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
    stockConfig?: {
      warehouseId: string;
      minLimit: number;
      maxLimit: number;
      physicalLocation?: string;
    },
    draftIdToRemove?: string
  ) => Product;

  updateProduct: (
    productId: string,
    productData: Partial<Product>,
    stockConfig?: {
      warehouseId: string;
      minLimit: number;
      maxLimit: number;
      physicalLocation?: string;
    }
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
    movement: Omit<Movement, 'id' | 'date'> & { date?: string }
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
  addPurchaseList: (
    list: Omit<PurchaseList, 'id' | 'createdAt' | 'updatedAt'>
  ) => PurchaseList;
  addPurchaseSource: (
    source: Omit<PurchaseSource, 'id' | 'totalPrice'>
  ) => PurchaseSource;
  toggleSourceAccounted: (sourceId: string) => void;
  deletePurchaseSource: (sourceId: string) => void;

  // Global search & reset
  resetToDefaults: () => void;

  // Banks Management & Calculation
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
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}suppliers`);
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}companies`);
    return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}warehouses`);
    if (saved) {
      const parsed: Warehouse[] = JSON.parse(saved);
      return parsed.map((w, idx) => ({
        ...w,
        companyId: w.companyId || (idx === 2 ? 'comp-3' : 'comp-1'),
      }));
    }
    return INITIAL_WAREHOUSES;
  });

  const [stockConfigs, setStockConfigs] = useState<StockConfig[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}stockConfigs`);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_CONFIGS;
  });

  const [movements, setMovements] = useState<Movement[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}movements`);
    return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
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
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_LISTS;
  });

  const [purchaseSources, setPurchaseSources] = useState<PurchaseSource[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}purchaseSources`);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_SOURCES;
  });

  const [banks, setBanks] = useState<Bank[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}banks`);
    return saved ? JSON.parse(saved) : INITIAL_BANKS;
  });

  const [bankMovements, setBankMovements] = useState<BankMovement[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}bankMovements`);
    return saved ? JSON.parse(saved) : INITIAL_BANK_MOVEMENTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}sales`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_SALES.length) {
          return parsed;
        }
      } catch {
        // fallback to INITIAL_SALES
      }
    }
    return INITIAL_SALES;
  });

  const [transports, setTransports] = useState<Transport[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}transports`);
    return saved ? JSON.parse(saved) : INITIAL_TRANSPORTS;
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
    return movements.reduce((acc, mov) => {
      // Must match product
      if (mov.productId !== productId) return acc;
      // If variation filter applied
      if (variationId && mov.variationId !== variationId) return acc;

      const affectsOrigin = !warehouseId || mov.warehouseId === warehouseId;
      const affectsDest = !warehouseId || mov.destinationWarehouseId === warehouseId;

      if (mov.type === 'entrada') {
        if (affectsOrigin) return acc + mov.quantity;
      } else if (mov.type === 'saida') {
        if (affectsOrigin) return acc - mov.quantity;
      } else if (mov.type === 'defeituoso') {
        if (affectsOrigin) return acc - mov.quantity;
      } else if (mov.type === 'ajuste') {
        // ajuste pode ser positivo ou negativo (mov.quantity)
        if (affectsOrigin) return acc + mov.quantity;
      } else if (mov.type === 'transferencia') {
        // Sai da origem, entra no destino
        if (affectsOrigin && !affectsDest) return acc - mov.quantity;
        if (affectsDest && !affectsOrigin) return acc + mov.quantity;
        // Se ambos são afetados (ex: visualizando geral), saldo líquido da transferência é 0
      }
      return acc;
    }, 0);
  };

  const getProductStockInfo = (productId: string, warehouseId?: string): ProductStockInfo => {
    const current = Math.max(0, getCurrentStock(productId, warehouseId));

    // Sum limits across matching configs
    const relevantConfigs = stockConfigs.filter(
      (c) => c.productId === productId && (!warehouseId || c.warehouseId === warehouseId)
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
      currentStock: current,
      minLimit,
      maxLimit,
      status,
    };
  };

  const getProductStockInfoForCompany = (productId: string, companyId: string): ProductStockInfo => {
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
    return movements
      .filter((m) => m.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Obter armazéns associados ao produto via relação Estoque (Produto × Armazém via StockConfig) e/ou Movimentação
  const getProductWarehouses = (productId: string): Warehouse[] => {
    const whIds = new Set<string>();
    stockConfigs.forEach((sc) => {
      if (sc.productId === productId && sc.warehouseId) {
        whIds.add(sc.warehouseId);
      }
    });
    movements.forEach((m) => {
      if (m.productId === productId) {
        if (m.warehouseId) whIds.add(m.warehouseId);
        if (m.destinationWarehouseId) whIds.add(m.destinationWarehouseId);
      }
    });
    return warehouses.filter((w) => whIds.has(w.id));
  };

  // Obter empresas associadas ao produto através dos seus armazéns vinculados
  const getProductCompanies = (productId: string): Company[] => {
    const prodWarehouses = getProductWarehouses(productId);
    const compIds = new Set(prodWarehouses.map((w) => w.companyId));
    return companies.filter((c) => compIds.has(c.id));
  };

  // PRIORITY ACTION: Add Product (Sets up catalog & stock limits, NO initial quantity movement)
  const addProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    stockConfig?: {
      warehouseId: string;
      minLimit: number;
      maxLimit: number;
      physicalLocation?: string;
    },
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
    if (stockConfig && stockConfig.warehouseId) {
      const newConfig: StockConfig = {
        productId: newProductId,
        warehouseId: stockConfig.warehouseId,
        minLimit: stockConfig.minLimit || 0,
        maxLimit: stockConfig.maxLimit || 0,
        physicalLocation: stockConfig.physicalLocation || '',
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
    stockConfig?: {
      warehouseId: string;
      minLimit: number;
      maxLimit: number;
      physicalLocation?: string;
    }
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

    // Update or insert stock limits config
    if (stockConfig && stockConfig.warehouseId) {
      setStockConfigs((prev) => {
        const withoutOld = prev.filter(
          (c) => !(c.productId === productId && c.warehouseId === stockConfig.warehouseId)
        );
        return [
          ...withoutOld,
          {
            productId,
            warehouseId: stockConfig.warehouseId,
            minLimit: stockConfig.minLimit || 0,
            maxLimit: stockConfig.maxLimit || 0,
            physicalLocation: stockConfig.physicalLocation || '',
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
    movementData: Omit<Movement, 'id' | 'date'> & { date?: string }
  ): Movement => {
    const newMovement: Movement = {
      ...movementData,
      id: `mov-${Date.now()}`,
      date: movementData.date || new Date().toISOString(),
    };
    setMovements((prev) => [newMovement, ...prev]);
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

  const addPurchaseList = (
    listData: Omit<PurchaseList, 'id' | 'createdAt' | 'updatedAt'>
  ): PurchaseList => {
    const now = new Date().toISOString();
    const newList: PurchaseList = {
      ...listData,
      id: `list-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setPurchaseLists((prev) => [newList, ...prev]);
    return newList;
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
      .filter((m) => m.bankId === bankId)
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
      .filter((m) => m.bankId === bankId)
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

  const recordBankMovement = (
    movementData: Omit<BankMovement, 'id' | 'date'> & { date?: string }
  ): BankMovement => {
    const newMovement: BankMovement = {
      ...movementData,
      id: `bmov-${Date.now()}`,
      date: movementData.date || new Date().toISOString(),
    };
    setBankMovements((prev) => [newMovement, ...prev]);
    return newMovement;
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
    const warehouse = warehouses.find((w) => w.id === sale.warehouseId);
    const company = companies.find((c) => c.id === warehouse?.companyId);
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
  }, [manualEvents, agendas, employees, transports, autoEventStatusOverrides]);

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
    setAutoEventStatusOverrides({});
    setNotifications(INITIAL_NOTIFICATIONS);
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
      addPurchaseList,
      addPurchaseSource,
      toggleSourceAccounted,
      deletePurchaseSource,
      resetToDefaults,

      // Banks
      banks,
      bankMovements,
      getBankBalance,
      getBankMovements,
      addBank,
      updateBank,
      deleteBank,
      recordBankMovement,

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
