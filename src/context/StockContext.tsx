import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Product,
  Supplier,
  Warehouse,
  StockConfig,
  Movement,
  DefectiveRecord,
  PurchaseGroup,
  PurchaseList,
  PurchaseSource,
  MovementType,
  DefectReason,
  DefectDecision,
} from '../types/stock';
import {
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_WAREHOUSES,
  INITIAL_STOCK_CONFIGS,
  INITIAL_MOVEMENTS,
  INITIAL_DEFECTIVE_RECORDS,
  INITIAL_PURCHASE_GROUPS,
  INITIAL_PURCHASE_LISTS,
  INITIAL_PURCHASE_SOURCES,
  INITIAL_CATEGORIES,
} from '../data/seedData';
import { convertToKwanza } from '../utils/formatters';

interface ProductStockInfo {
  currentStock: number;
  minLimit: number;
  maxLimit: number;
  status: 'zerado' | 'critico_baixo' | 'normal' | 'excesso';
}

interface StockContextType {
  products: Product[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  stockConfigs: StockConfig[];
  movements: Movement[];
  defectiveRecords: DefectiveRecord[];
  categories: string[];
  purchaseGroups: PurchaseGroup[];
  purchaseLists: PurchaseList[];
  purchaseSources: PurchaseSource[];

  // Calculation helpers
  getCurrentStock: (productId: string, warehouseId?: string, variationId?: string) => number;
  getProductStockInfo: (productId: string, warehouseId?: string) => ProductStockInfo;
  getProductMovements: (productId: string) => Movement[];

  // Priority Actions
  addProduct: (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    initialStock?: {
      warehouseId: string;
      quantity: number;
      minLimit: number;
      maxLimit: number;
      physicalLocation?: string;
    }
  ) => Product;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
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

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}warehouses`);
    return saved ? JSON.parse(saved) : INITIAL_WAREHOUSES;
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
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
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

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}suppliers`, JSON.stringify(suppliers));
  }, [suppliers]);

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
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}purchaseGroups`, JSON.stringify(purchaseGroups));
  }, [purchaseGroups]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}purchaseLists`, JSON.stringify(purchaseLists));
  }, [purchaseLists]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}purchaseSources`, JSON.stringify(purchaseSources));
  }, [purchaseSources]);

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

  const getProductMovements = (productId: string): Movement[] => {
    return movements
      .filter((m) => m.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // PRIORITY ACTION: Add Product + Optional Initial Stock (Generates Movement)
  const addProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    initialStock?: {
      warehouseId: string;
      quantity: number;
      minLimit: number;
      maxLimit: number;
      physicalLocation?: string;
    }
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

    // If initial stock provided: DO NOT mutate stock directly, generate "entrada" Movement!
    if (initialStock && initialStock.warehouseId) {
      // 1. Setup config
      const newConfig: StockConfig = {
        productId: newProductId,
        warehouseId: initialStock.warehouseId,
        minLimit: initialStock.minLimit || 0,
        maxLimit: initialStock.maxLimit || 0,
        physicalLocation: initialStock.physicalLocation || '',
      };
      setStockConfigs((prev) => [...prev, newConfig]);

      // 2. Generate automatic 'entrada' movement if quantity > 0
      if (initialStock.quantity > 0) {
        const initialMovement: Movement = {
          id: `mov-${Date.now()}`,
          productId: newProductId,
          warehouseId: initialStock.warehouseId,
          type: 'entrada',
          quantity: Number(initialStock.quantity),
          date: now,
          responsible: newProduct.createdBy || 'Administrador MyOffice',
          reason: 'Entrada de estoque inicial registrada no cadastro do produto',
          reference: 'Cadastro inicial',
        };
        setMovements((prev) => [initialMovement, ...prev]);
      }
    }

    return newProduct;
  };

  // Add Supplier inline
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    return newSupplier;
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

  const resetToDefaults = () => {
    localStorage.clear();
    setProducts(INITIAL_PRODUCTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setWarehouses(INITIAL_WAREHOUSES);
    setStockConfigs(INITIAL_STOCK_CONFIGS);
    setMovements(INITIAL_MOVEMENTS);
    setDefectiveRecords(INITIAL_DEFECTIVE_RECORDS);
    setCategories(INITIAL_CATEGORIES);
    setPurchaseGroups(INITIAL_PURCHASE_GROUPS);
    setPurchaseLists(INITIAL_PURCHASE_LISTS);
    setPurchaseSources(INITIAL_PURCHASE_SOURCES);
  };

  const value = useMemo(
    () => ({
      products,
      suppliers,
      warehouses,
      stockConfigs,
      movements,
      defectiveRecords,
      categories,
      purchaseGroups,
      purchaseLists,
      purchaseSources,
      getCurrentStock,
      getProductStockInfo,
      getProductMovements,
      addProduct,
      addSupplier,
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
    }),
    [
      products,
      suppliers,
      warehouses,
      stockConfigs,
      movements,
      defectiveRecords,
      categories,
      purchaseGroups,
      purchaseLists,
      purchaseSources,
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
