import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Store,
  UserPlus,
  Layers,
  Building,
  Save,
  Clock,
  Palette,
  Gamepad2,
  UtensilsCrossed,
  Shirt,
  Smartphone,
  PawPrint,
  FileEdit,
  Info,
  Copy,
  ArrowLeftRight,
  StickyNote,
  Eye,
  Check,
  Warehouse,
  MapPin,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { useWarehouseFilters } from '../../context/WarehouseFilterContext';
import {
  Product,
  ProductVariation,
  UnitOfMeasure,
  ProductCondition,
  ProductDraft,
} from '../../types/stock';
import { generateSKU, formatKwanza } from '../../utils/formatters';
import { ColorPickerInput } from './ColorPickerInput';

interface ProductCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  draftToResume?: ProductDraft | null;
  onViewProduct?: (productId: string) => void;
  onCreateMovement?: (productId: string, warehouseId?: string) => void;
}

// Curated image presets by category for quick professional selection
const CATEGORY_IMAGE_PRESETS: Record<
  string,
  Array<{ label: string; url: string }>
> = {
  Games: [
    {
      label: 'Consola & Setup Gaming',
      url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Comando / Joystick Pro',
      url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Jogo Físico / Estojo',
      url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    },
  ],
  'Casa & Cozinha': [
    {
      label: 'Fritadeira / Eletrodoméstico',
      url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Panelas & Utensílios',
      url: 'https://images.unsplash.com/photo-1584990347449-39908cf44147?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Cafeteira Moderna',
      url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&q=80',
    },
  ],
  Moda: [
    {
      label: 'T-Shirt Casual / Algodão',
      url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Calçado / Tênis Running',
      url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Casaco & Moda Urbana',
      url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
    },
  ],
  Eletrónicos: [
    {
      label: 'Smartphone 5G Dual SIM',
      url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Auscultadores Bluetooth ANC',
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Computador Portátil / Laptop',
      url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
    },
  ],
  Animais: [
    {
      label: 'Ração Premium para Cães/Gatos',
      url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Brinquedos & Acessórios Pet',
      url: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Higiene & Cuidados Animais',
      url: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=600&q=80',
    },
  ],
};

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80';

export const ProductCreateModal: React.FC<ProductCreateModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  draftToResume,
  onViewProduct,
  onCreateMovement,
}) => {
  const {
    suppliers,
    categories,
    warehouses,
    companies,
    stockConfigs,
    products,
    getCurrentStock,
    addProduct,
    updateProduct,
    saveProductDraft,
    addSupplier,
    addCategory,
    checkProductSkuExists,
    checkProductNameExists,
  } = useStock();
  const { selectedCompanyIds } = useWarehouseFilters();

  // Wizard Step: 1 = Dados, 2 = Variações, 3 = Configuração Estoque, 4 = Concluído
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 State: Produto
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Eletrónicos');
  const [condition, setCondition] = useState<ProductCondition>('novo');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>('unidade');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [supplierId, setSupplierId] = useState('');
  const [mainImage, setMainImage] = useState(DEFAULT_IMAGE);
  const [gallery, setGallery] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Step 2 State: Variações
  const [variations, setVariations] = useState<
    Array<{
      id: string;
      color: string;
      colorHex?: string;
      size: string;
      sku: string;
      additionalPrice: number;
      quantity?: number;
    }>
  >([]);

  // Step 3 State: Configuração de Limites de Estoque por Armazém (SEM quantidade inicial)
  const [warehouseConfigs, setWarehouseConfigs] = useState<
    Record<
      string,
      {
        warehouseId: string;
        minLimit: number | '';
        maxLimit: number | '';
        physicalLocation: string;
      }
    >
  >({});
  const [warehouseBlockError, setWarehouseBlockError] = useState<string | null>(null);

  // Inline Modals & Alert Confirmations
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [newSupplierNotes, setNewSupplierNotes] = useState('');

  const [showMarginWarningModal, setShowMarginWarningModal] = useState(false);
  const [priceWarningDetails, setPriceWarningDetails] = useState<{
    title: string;
    message: string;
    targetStep: number;
  } | null>(null);

  // Validação de Duplicidade (SKU e Nome)
  const [duplicateNameWarningProduct, setDuplicateNameWarningProduct] = useState<Product | null>(null);
  const [allowDuplicateNameConfirmed, setAllowDuplicateNameConfirmed] = useState<boolean>(false);
  const [skuError, setSkuError] = useState<string | null>(null);

  const [createdProductResult, setCreatedProductResult] = useState<Product | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveDraftFeedback, setSaveDraftFeedback] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>(draftToResume?.id);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Snapshot ref for strict dirty checking
  const initialSnapshotRef = useRef<string>('');

  // Identificação das Empresas vinculadas aos armazéns selecionados
  const selectedWarehouseIds = Object.keys(warehouseConfigs);
  const selectedCompanyIdsSet = useMemo(() => {
    const compIds = new Set<string>();
    selectedWarehouseIds.forEach((whId) => {
      const wh = warehouses.find((w) => w.id === whId);
      if (wh?.companyId) compIds.add(wh.companyId);
    });
    if (compIds.size === 0) {
      if (selectedCompanyIds && selectedCompanyIds.length > 0) {
        selectedCompanyIds.forEach((id) => compIds.add(id));
      } else if (companies[0]?.id) {
        compIds.add(companies[0].id);
      }
    }
    return compIds;
  }, [selectedWarehouseIds, warehouses, selectedCompanyIds, companies]);

  // Agrupamento de armazéns por Empresa
  const warehousesByCompany = useMemo(() => {
    const groups: Array<{
      company: { id: string; name: string };
      warehouses: typeof warehouses;
    }> = [];

    companies.forEach((comp) => {
      const compWhs = warehouses.filter((w) => w.companyId === comp.id);
      if (compWhs.length > 0) {
        groups.push({ company: comp, warehouses: compWhs });
      }
    });

    const orphanWhs = warehouses.filter(
      (w) => !companies.some((c) => c.id === w.companyId)
    );
    if (orphanWhs.length > 0) {
      groups.push({
        company: { id: 'other', name: 'Outros Armazéns' },
        warehouses: orphanWhs,
      });
    }

    return groups;
  }, [companies, warehouses]);

  // Empresa primária (para fallback e exibição contextual)
  const currentCompanyId: string =
    (Array.from(selectedCompanyIdsSet)[0] as string | undefined) ||
    companies[0]?.id ||
    '';
  const currentCompany = companies.find((c) => c.id === currentCompanyId);

  // Verificação em tempo real no Step 1
  const nameDuplicateCandidate = useMemo(() => {
    if (!name.trim() || name.trim().length < 2) return undefined;
    for (const cId of selectedCompanyIdsSet) {
      const dup = checkProductNameExists(name, cId, productToEdit?.id);
      if (dup) return dup;
    }
    return undefined;
  }, [name, selectedCompanyIdsSet, productToEdit, checkProductNameExists]);

  const skuDuplicateCandidate = useMemo(() => {
    if (!sku.trim()) return undefined;
    for (const cId of selectedCompanyIdsSet) {
      const dup = checkProductSkuExists(sku, cId, productToEdit?.id);
      if (dup) return dup;
    }
    return undefined;
  }, [sku, selectedCompanyIdsSet, productToEdit, checkProductSkuExists]);

  const handleNameChange = (val: string) => {
    setName(val);
    setAllowDuplicateNameConfirmed(false);
    if (validationError?.includes('nome') || validationError?.includes('Nome')) {
      setValidationError(null);
    }
  };

  const handleSkuChange = (val: string) => {
    setSku(val.toUpperCase());
    setSkuError(null);
    if (validationError === 'Já existe um produto cadastrado com este SKU.') {
      setValidationError(null);
    }
  };

  const computeSnapshot = (data: {
    name: string;
    category: string;
    condition: string;
    description: string;
    brand: string;
    unitOfMeasure: string;
    sku: string;
    barcode: string;
    costPrice: number | '';
    salePrice: number | '';
    supplierId: string;
    mainImage: string;
    gallery: string[];
    variations: Array<{
      color?: string;
      colorHex?: string;
      size?: string;
      sku?: string;
      additionalPrice?: number;
      quantity?: number;
    }>;
    warehouseConfigs: Record<
      string,
      {
        warehouseId: string;
        minLimit: number | '';
        maxLimit: number | '';
        physicalLocation: string;
      }
    >;
  }) => {
    return JSON.stringify({
      name: data.name.trim(),
      category: data.category,
      condition: data.condition,
      description: data.description.trim(),
      brand: data.brand.trim(),
      unitOfMeasure: data.unitOfMeasure,
      sku: data.sku.trim(),
      barcode: data.barcode.trim(),
      costPrice: data.costPrice === '' ? '' : Number(data.costPrice),
      salePrice: data.salePrice === '' ? '' : Number(data.salePrice),
      supplierId: data.supplierId,
      mainImage: data.mainImage,
      gallery: data.gallery,
      variations: data.variations.map((v) => ({
        color: v.color?.trim() || '',
        colorHex: v.colorHex?.trim() || '',
        size: v.size?.trim() || '',
        sku: v.sku?.trim() || '',
        additionalPrice: Number(v.additionalPrice) || 0,
        quantity: Number(v.quantity) || 0,
      })),
      warehouseConfigs: Object.keys(data.warehouseConfigs)
        .sort()
        .map((k) => ({
          whId: k,
          min:
            data.warehouseConfigs[k].minLimit === ''
              ? ''
              : Number(data.warehouseConfigs[k].minLimit),
          max:
            data.warehouseConfigs[k].maxLimit === ''
              ? ''
              : Number(data.warehouseConfigs[k].maxLimit),
          loc: data.warehouseConfigs[k].physicalLocation.trim(),
        })),
    });
  };

  // Condition change handler with automatic min/max limit defaults
  const handleConditionChange = (newCondition: ProductCondition) => {
    setCondition(newCondition);
    setWarehouseConfigs((prev) => {
      const next: Record<
        string,
        {
          warehouseId: string;
          minLimit: number | '';
          maxLimit: number | '';
          physicalLocation: string;
        }
      > = {};
      Object.keys(prev).forEach((whId) => {
        const item = prev[whId];
        let nextMin = item.minLimit;
        let nextMax = item.maxLimit;
        if (newCondition === 'novo') {
          if (nextMin === 0 && nextMax === 0) {
            nextMin = 10;
            nextMax = 100;
          }
        } else if (
          newCondition === 'novo_usado' ||
          newCondition === 'usado' ||
          newCondition === 'troca'
        ) {
          if (nextMin === 10 && nextMax === 100) {
            nextMin = 0;
            nextMax = 0;
          }
        }
        next[whId] = {
          ...item,
          minLimit: nextMin,
          maxLimit: nextMax,
        };
      });
      return next;
    });
  };

  // Initialize or populate form when opening
  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      setActiveDraftId(undefined);
      // Pre-fill from existing product
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setCondition(productToEdit.condition || 'novo');
      setDescription(productToEdit.description || '');
      setBrand(productToEdit.brand);
      setUnitOfMeasure(productToEdit.unitOfMeasure);
      setSku(productToEdit.sku);
      setBarcode(productToEdit.barcode || '');
      setCostPrice(productToEdit.costPrice);
      setSalePrice(productToEdit.salePrice);
      setSupplierId(productToEdit.supplierId || suppliers[0]?.id || '');
      setMainImage(productToEdit.mainImage || DEFAULT_IMAGE);
      setGallery(productToEdit.gallery || []);

      const initialVars = (productToEdit.variations || []).map((v) => ({
        id: v.id,
        color: v.color || '',
        colorHex: v.colorHex || '',
        size: v.size || '',
        sku: v.sku,
        additionalPrice: v.additionalPrice || 0,
        quantity: v.quantity ?? 0,
      }));
      setVariations(initialVars);

      // Find all stock configs for this product
      const existingConfigs = stockConfigs.filter((c) => c.productId === productToEdit.id);
      const initialConfigs: Record<
        string,
        {
          warehouseId: string;
          minLimit: number | '';
          maxLimit: number | '';
          physicalLocation: string;
        }
      > = {};

      existingConfigs.forEach((c) => {
        initialConfigs[c.warehouseId] = {
          warehouseId: c.warehouseId,
          minLimit: c.minLimit,
          maxLimit: c.maxLimit,
          physicalLocation: c.physicalLocation || '',
        };
      });

      // Also ensure warehouses with positive stock are included
      warehouses.forEach((w) => {
        if (getCurrentStock(productToEdit.id, w.id) > 0 && !initialConfigs[w.id]) {
          initialConfigs[w.id] = {
            warehouseId: w.id,
            minLimit: 10,
            maxLimit: 100,
            physicalLocation: '',
          };
        }
      });

      // If no config found at all, fall back to first warehouse
      if (Object.keys(initialConfigs).length === 0 && warehouses[0]?.id) {
        initialConfigs[warehouses[0].id] = {
          warehouseId: warehouses[0].id,
          minLimit: 10,
          maxLimit: 100,
          physicalLocation: '',
        };
      }

      setWarehouseConfigs(initialConfigs);
      setWarehouseBlockError(null);
      setCurrentStep(1);

      initialSnapshotRef.current = computeSnapshot({
        name: productToEdit.name,
        category: productToEdit.category,
        condition: productToEdit.condition || 'novo',
        description: productToEdit.description || '',
        brand: productToEdit.brand,
        unitOfMeasure: productToEdit.unitOfMeasure,
        sku: productToEdit.sku,
        barcode: productToEdit.barcode || '',
        costPrice: productToEdit.costPrice,
        salePrice: productToEdit.salePrice,
        supplierId: productToEdit.supplierId || suppliers[0]?.id || '',
        mainImage: productToEdit.mainImage || DEFAULT_IMAGE,
        gallery: productToEdit.gallery || [],
        variations: initialVars,
        warehouseConfigs: initialConfigs,
      });
    } else if (draftToResume) {
      setActiveDraftId(draftToResume.id);
      // Pre-fill from saved draft
      const draftCond = draftToResume.condition || 'novo';
      const defaultMin = draftCond === 'novo' ? 10 : 0;
      const defaultMax = draftCond === 'novo' ? 100 : 0;
      const draftVars = (draftToResume.variations || []).map((v) => ({
        id: v.id,
        color: v.color || '',
        colorHex: v.colorHex || '',
        size: v.size || '',
        sku: v.sku,
        additionalPrice: v.additionalPrice || 0,
        quantity: v.quantity ?? 0,
      }));

      const initialConfigs: Record<
        string,
        {
          warehouseId: string;
          minLimit: number | '';
          maxLimit: number | '';
          physicalLocation: string;
        }
      > = {};

      if (draftToResume.stockConfigs && draftToResume.stockConfigs.length > 0) {
        draftToResume.stockConfigs.forEach((sc) => {
          initialConfigs[sc.warehouseId] = {
            warehouseId: sc.warehouseId,
            minLimit: typeof sc.minLimit === 'number' ? sc.minLimit : defaultMin,
            maxLimit: typeof sc.maxLimit === 'number' ? sc.maxLimit : defaultMax,
            physicalLocation: sc.physicalLocation || '',
          };
        });
      } else if (draftToResume.initialWarehouseId) {
        initialConfigs[draftToResume.initialWarehouseId] = {
          warehouseId: draftToResume.initialWarehouseId,
          minLimit:
            typeof draftToResume.minLimit === 'number' ? draftToResume.minLimit : defaultMin,
          maxLimit:
            typeof draftToResume.maxLimit === 'number' ? draftToResume.maxLimit : defaultMax,
          physicalLocation: draftToResume.physicalLocation || '',
        };
      } else if (warehouses[0]?.id) {
        initialConfigs[warehouses[0].id] = {
          warehouseId: warehouses[0].id,
          minLimit: defaultMin,
          maxLimit: defaultMax,
          physicalLocation: '',
        };
      }

      setName(draftToResume.name || '');
      setCategory(draftToResume.category || 'Eletrónicos');
      setCondition(draftCond);
      setDescription(draftToResume.description || '');
      setBrand(draftToResume.brand || '');
      setUnitOfMeasure(draftToResume.unitOfMeasure || 'unidade');
      setSku(draftToResume.sku || '');
      setBarcode(draftToResume.barcode || '');
      setCostPrice(typeof draftToResume.costPrice === 'number' ? draftToResume.costPrice : '');
      setSalePrice(typeof draftToResume.salePrice === 'number' ? draftToResume.salePrice : '');
      setSupplierId(draftToResume.supplierId || suppliers[0]?.id || '');
      setMainImage(draftToResume.mainImage || DEFAULT_IMAGE);
      setGallery(draftToResume.gallery || []);
      setVariations(draftVars);
      setWarehouseConfigs(initialConfigs);
      setWarehouseBlockError(null);
      setCurrentStep(draftToResume.currentStep || 1);

      initialSnapshotRef.current = computeSnapshot({
        name: draftToResume.name || '',
        category: draftToResume.category || 'Eletrónicos',
        condition: draftCond,
        description: draftToResume.description || '',
        brand: draftToResume.brand || '',
        unitOfMeasure: draftToResume.unitOfMeasure || 'unidade',
        sku: draftToResume.sku || '',
        barcode: draftToResume.barcode || '',
        costPrice: typeof draftToResume.costPrice === 'number' ? draftToResume.costPrice : '',
        salePrice: typeof draftToResume.salePrice === 'number' ? draftToResume.salePrice : '',
        supplierId: draftToResume.supplierId || suppliers[0]?.id || '',
        mainImage: draftToResume.mainImage || DEFAULT_IMAGE,
        gallery: draftToResume.gallery || [],
        variations: draftVars,
        warehouseConfigs: initialConfigs,
      });
    } else {
      // New clean product
      setActiveDraftId(undefined);
      const defaultCat = categories[0] || 'Eletrónicos';
      const defaultCond: ProductCondition = 'novo';
      const matchedCompanyWh =
        selectedCompanyIds && selectedCompanyIds.length === 1
          ? warehouses.find((w) => w.companyId === selectedCompanyIds[0])?.id
          : null;
      const defaultWh = matchedCompanyWh || warehouses[0]?.id || '';
      const defaultSupp = suppliers[0]?.id || '';

      const initialConfigs: Record<
        string,
        {
          warehouseId: string;
          minLimit: number | '';
          maxLimit: number | '';
          physicalLocation: string;
        }
      > = {};

      if (defaultWh) {
        initialConfigs[defaultWh] = {
          warehouseId: defaultWh,
          minLimit: 10,
          maxLimit: 100,
          physicalLocation: '',
        };
      }

      setName('');
      setCategory(defaultCat);
      setCondition(defaultCond);
      setDescription('');
      setBrand('');
      setUnitOfMeasure('unidade');
      setSku('');
      setBarcode('');
      setCostPrice('');
      setSalePrice('');
      setSupplierId(defaultSupp);
      setMainImage(DEFAULT_IMAGE);
      setGallery([]);
      setVariations([]);
      setWarehouseConfigs(initialConfigs);
      setWarehouseBlockError(null);
      setCurrentStep(1);
      setDuplicateNameWarningProduct(null);
      setAllowDuplicateNameConfirmed(false);
      setSkuError(null);

      initialSnapshotRef.current = computeSnapshot({
        name: '',
        category: defaultCat,
        condition: defaultCond,
        description: '',
        brand: '',
        unitOfMeasure: 'unidade',
        sku: '',
        barcode: '',
        costPrice: '',
        salePrice: '',
        supplierId: defaultSupp,
        mainImage: DEFAULT_IMAGE,
        gallery: [],
        variations: [],
        warehouseConfigs: initialConfigs,
      });
    }

    setCreatedProductResult(null);
    setValidationError(null);
    setShowCloseConfirmation(false);
  }, [isOpen, productToEdit, draftToResume]);

  if (!isOpen) return null;

  // Strict dirty state: true only if actual data changed compared to initial snapshot
  const isFormDirty = Boolean(
    initialSnapshotRef.current &&
      computeSnapshot({
        name,
        category,
        condition,
        description,
        brand,
        unitOfMeasure,
        sku,
        barcode,
        costPrice,
        salePrice,
        supplierId,
        mainImage,
        gallery,
        variations,
        warehouseConfigs,
      }) !== initialSnapshotRef.current
  );

  // Close attempt: prompts confirmation only if real changes were made
  const handleAttemptClose = () => {
    if (currentStep === 4) {
      onClose();
      return;
    }
    if (isFormDirty) {
      setShowCloseConfirmation(true);
    } else {
      onClose();
    }
  };

  // Header Save Action (icon only in header)
  const handleSaveFromHeader = () => {
    const selectedConfigsArray = Object.keys(warehouseConfigs).map(
      (id) => warehouseConfigs[id]
    );
    const stockConfigsPayload = selectedConfigsArray.map((c) => ({
      warehouseId: c.warehouseId,
      minLimit: Number(c.minLimit) || 0,
      maxLimit: Number(c.maxLimit) || 0,
      physicalLocation: c.physicalLocation.trim() || undefined,
    }));

    if (productToEdit) {
      const formattedVariations: ProductVariation[] = variations.map((v) => ({
        id: v.id,
        color: v.color.trim() || undefined,
        colorHex: v.colorHex?.trim() || undefined,
        size: v.size.trim() || undefined,
        sku: v.sku.trim(),
        additionalPrice: Number(v.additionalPrice) || 0,
        quantity: Number(v.quantity) || 0,
      }));

      const productPayload: Partial<Product> = {
        name: name.trim() || productToEdit.name,
        category: category.trim() || productToEdit.category,
        condition,
        description: description.trim(),
        brand: brand.trim(),
        unitOfMeasure,
        sku: sku.trim() || productToEdit.sku,
        barcode: barcode.trim() || undefined,
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice) || 0,
        supplierId: supplierId || productToEdit.supplierId,
        mainImage: mainImage || productToEdit.mainImage,
        gallery: gallery.length > 0 ? gallery : productToEdit.gallery,
        variations: formattedVariations,
      };

      updateProduct(productToEdit.id, productPayload, stockConfigsPayload);
      initialSnapshotRef.current = computeSnapshot({
        name,
        category,
        condition,
        description,
        brand,
        unitOfMeasure,
        sku,
        barcode,
        costPrice,
        salePrice,
        supplierId,
        mainImage,
        gallery,
        variations,
        warehouseConfigs,
      });
      setSaveDraftFeedback(true);
      setTimeout(() => setSaveDraftFeedback(false), 1500);
    } else {
      setIsSavingDraft(true);
      const targetDraftId = activeDraftId || draftToResume?.id;
      const savedDraft = saveProductDraft({
        id: targetDraftId,
        name: name.trim() || 'Produto sem título',
        category,
        condition,
        brand,
        unitOfMeasure,
        sku,
        barcode,
        costPrice: typeof costPrice === 'number' ? costPrice : undefined,
        salePrice: typeof salePrice === 'number' ? salePrice : undefined,
        supplierId,
        description,
        mainImage,
        gallery,
        variations: variations.map((v) => ({
          id: v.id,
          color: v.color || undefined,
          colorHex: v.colorHex || undefined,
          size: v.size || undefined,
          sku: v.sku,
          additionalPrice: v.additionalPrice,
          quantity: v.quantity,
        })),
        currentStep,
        stockConfigs: stockConfigsPayload,
      });

      if (savedDraft?.id) {
        setActiveDraftId(savedDraft.id);
      }

      initialSnapshotRef.current = computeSnapshot({
        name,
        category,
        condition,
        description,
        brand,
        unitOfMeasure,
        sku,
        barcode,
        costPrice,
        salePrice,
        supplierId,
        mainImage,
        gallery,
        variations,
        warehouseConfigs,
      });
      setSaveDraftFeedback(true);
      setTimeout(() => {
        setSaveDraftFeedback(false);
        setIsSavingDraft(false);
      }, 1500);
    }
  };

  // Armazéns: Alternar seleção com validação de segurança
  const handleToggleWarehouse = (whId: string) => {
    setWarehouseBlockError(null);
    setValidationError(null);

    const isCurrentlySelected = Boolean(warehouseConfigs[whId]);

    if (isCurrentlySelected) {
      // Bloqueio de segurança se houver estoque > 0
      if (productToEdit) {
        const currentStock = getCurrentStock(productToEdit.id, whId);
        if (currentStock > 0) {
          setWarehouseBlockError(
            `Não é possível remover este armazém porque o produto ainda possui ${currentStock} unidades nele. Retire o estoque primeiro através de uma Movimentação de saída.`
          );
          return;
        }
      }

      setWarehouseConfigs((prev) => {
        const copy = { ...prev };
        delete copy[whId];
        return copy;
      });
    } else {
      const defaultMin = condition === 'novo' ? 10 : 0;
      const defaultMax = condition === 'novo' ? 100 : 0;
      setWarehouseConfigs((prev) => ({
        ...prev,
        [whId]: {
          warehouseId: whId,
          minLimit: defaultMin,
          maxLimit: defaultMax,
          physicalLocation: '',
        },
      }));
    }
  };

  const handleUpdateWarehouseConfig = (
    whId: string,
    field: 'minLimit' | 'maxLimit' | 'physicalLocation',
    value: number | '' | string
  ) => {
    setWarehouseConfigs((prev) => {
      const current = prev[whId];
      if (!current) return prev;
      return {
        ...prev,
        [whId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSelectAllInCompany = (companyId: string) => {
    setWarehouseBlockError(null);
    const companyWhs = warehouses.filter((w) => w.companyId === companyId);
    const defaultMin = condition === 'novo' ? 10 : 0;
    const defaultMax = condition === 'novo' ? 100 : 0;

    setWarehouseConfigs((prev) => {
      const copy = { ...prev };
      companyWhs.forEach((wh) => {
        if (!copy[wh.id]) {
          copy[wh.id] = {
            warehouseId: wh.id,
            minLimit: defaultMin,
            maxLimit: defaultMax,
            physicalLocation: '',
          };
        }
      });
      return copy;
    });
  };

  const handleDeselectAllInCompany = (companyId: string) => {
    setWarehouseBlockError(null);
    const companyWhs = warehouses.filter((w) => w.companyId === companyId);
    let blockedWhName: string | null = null;
    let blockedWhStock = 0;

    setWarehouseConfigs((prev) => {
      const copy = { ...prev };
      companyWhs.forEach((wh) => {
        if (copy[wh.id]) {
          if (productToEdit) {
            const stock = getCurrentStock(productToEdit.id, wh.id);
            if (stock > 0) {
              blockedWhName = wh.name;
              blockedWhStock = stock;
              return; // Do not delete this one
            }
          }
          delete copy[wh.id];
        }
      });
      return copy;
    });

    if (blockedWhName) {
      setWarehouseBlockError(
        `Não é possível remover este armazém porque o produto ainda possui ${blockedWhStock} unidades nele. Retire o estoque primeiro através de uma Movimentação de saída.`
      );
    }
  };

  // Save and Close from Confirmation Dialog
  const handleSaveAndCloseFromDialog = () => {
    handleSaveFromHeader();
    setShowCloseConfirmation(false);
    onClose();
  };

  // Discard and Close
  const handleDiscardAndClose = () => {
    setShowCloseConfirmation(false);
    onClose();
  };

  // Auto-generate SKU helper (garantido único dentro da empresa)
  const handleAutoGenerateSku = () => {
    if (!name && !category) {
      setValidationError('Insira ao menos o nome ou categoria para gerar o SKU.');
      return;
    }
    let generated = generateSKU(name || 'ITEM', category || 'GERAL');
    let attempts = 0;
    while (checkProductSkuExists(generated, currentCompanyId, productToEdit?.id) && attempts < 25) {
      generated = generateSKU(name || 'ITEM', category || 'GERAL');
      attempts++;
    }
    setSku(generated);
    setSkuError(null);
    if (validationError === 'Já existe um produto cadastrado com este SKU.') {
      setValidationError(null);
    }
  };

  // Price validation rules per condition:
  // - Novo: alert if salePrice < costPrice
  // - Novo-Usado: value can be lower or higher than cost without alert
  // - Usado: alert if salePrice > costPrice (inverse)
  const checkPriceValidation = (targetStep: number): boolean => {
    const cost = Number(costPrice) || 0;
    const sale = Number(salePrice) || 0;

    if (condition === 'novo' && cost > 0 && sale > 0 && sale < cost) {
      setPriceWarningDetails({
        title: 'Preço de Venda Inferior ao Custo (Artigo Novo)',
        message: `Para artigos novos, o preço de venda (${formatKwanza(sale)}) é inferior ao preço de custo (${formatKwanza(cost)}). Isto gerará prejuízo por unidade vendida. Deseja prosseguir mesmo assim?`,
        targetStep,
      });
      setShowMarginWarningModal(true);
      return false;
    }

    if (condition === 'usado' && cost > 0 && sale > 0 && sale > cost) {
      setPriceWarningDetails({
        title: 'Preço de Venda Superior ao Custo (Artigo Usado)',
        message: `Para artigos usados, o preço de venda (${formatKwanza(sale)}) é superior ao preço de custo (${formatKwanza(cost)}). Deseja prosseguir com este valor ou ajustar os preços?`,
        targetStep,
      });
      setShowMarginWarningModal(true);
      return false;
    }

    return true;
  };

  // Step 1 Validation & Next
  const handleProceedFromStep1 = () => {
    setValidationError(null);
    if (!name.trim()) {
      setValidationError('O nome do produto é obrigatório.');
      return;
    }
    if (!category.trim()) {
      setValidationError('A categoria é obrigatória.');
      return;
    }
    if (!condition) {
      setValidationError('O estado do artigo é obrigatório.');
      return;
    }

    // Validação de SKU duplicado na empresa (Bloqueio Obrigatório)
    if (sku.trim()) {
      const existingSku = checkProductSkuExists(sku, currentCompanyId, productToEdit?.id);
      if (existingSku) {
        setValidationError('Já existe um produto cadastrado com este SKU.');
        setSkuError('Já existe um produto cadastrado com este SKU.');
        return;
      }
    } else {
      // Auto-generate SKU garantido único se vazio
      let generated = generateSKU(name, category);
      let attempts = 0;
      while (checkProductSkuExists(generated, currentCompanyId, productToEdit?.id) && attempts < 25) {
        generated = generateSKU(name, category);
        attempts++;
      }
      setSku(generated);
    }

    if (!checkPriceValidation(2)) {
      return;
    }

    setCurrentStep(2);
  };

  // Step 2: Add Variation Line (mantém o mesmo tamanho da variação anterior se existir)
  const handleAddVariation = () => {
    const varSku = sku
      ? `${sku}-V${variations.length + 1}`
      : `VAR-${Date.now().toString().slice(-4)}`;
    const lastVar = variations.length > 0 ? variations[variations.length - 1] : null;
    setVariations((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        color: '',
        colorHex: '',
        size: lastVar?.size || '',
        sku: varSku,
        additionalPrice: lastVar?.additionalPrice ?? 0,
        quantity: 0,
      },
    ]);
  };

  // Duplicar variação mantendo o mesmo tamanho e configurações
  const handleDuplicateVariation = (index: number) => {
    const source = variations[index];
    if (!source) return;
    const varSku = sku
      ? `${sku}-V${variations.length + 1}`
      : `VAR-${Date.now().toString().slice(-4)}`;
    setVariations((prev) => [
      ...prev,
      {
        ...source,
        id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sku: varSku,
      },
    ]);
  };

  const handleUpdateVariation = (
    index: number,
    field: 'color' | 'colorHex' | 'size' | 'sku' | 'additionalPrice' | 'quantity',
    value: string | number
  ) => {
    setVariations((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveVariation = (index: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  // Step 2 Validation & Next
  const handleProceedFromStep2 = () => {
    setValidationError(null);
    for (let i = 0; i < variations.length; i++) {
      const v = variations[i];
      if (!v.color.trim() && !v.size.trim()) {
        setValidationError(
          `Na variação #${i + 1}, selecione pelo menos a cor ou informe o tamanho/especificação.`
        );
        return;
      }
    }
    setCurrentStep(3);
  };

  // Step 3: Final Save / Submit (Creates or Updates, strictly no initial quantity input)
  const handleFinalSubmit = (bypassDuplicateNameCheck: boolean = false) => {
    setValidationError(null);
    setWarehouseBlockError(null);

    // Validação de armazéns selecionados
    const selectedConfigsArray = Object.keys(warehouseConfigs).map(
      (id) => warehouseConfigs[id]
    );
    if (selectedConfigsArray.length === 0) {
      setValidationError('Selecione pelo menos um armazém para vincular este produto.');
      setCurrentStep(3);
      return;
    }

    // Bloqueio de segurança na edição: não permitir desvincular armazém com saldo positivo
    if (productToEdit) {
      for (const wh of warehouses) {
        if (!warehouseConfigs[wh.id]) {
          const currentStock = getCurrentStock(productToEdit.id, wh.id);
          if (currentStock > 0) {
            setWarehouseBlockError(
              `Não é possível remover este armazém porque o produto ainda possui ${currentStock} unidades nele. Retire o estoque primeiro através de uma Movimentação de saída.`
            );
            setCurrentStep(3);
            return;
          }
        }
      }
    }

    // 1. SKU Duplicado — Bloqueio Obrigatório na Empresa
    const finalSku = (sku.trim() || generateSKU(name, category)).toUpperCase();
    for (const cId of selectedCompanyIdsSet) {
      const existingProductWithSku = checkProductSkuExists(finalSku, cId, productToEdit?.id);
      if (existingProductWithSku) {
        setValidationError('Já existe um produto cadastrado com este SKU nesta empresa.');
        setSkuError('Já existe um produto cadastrado com este SKU nesta empresa.');
        setCurrentStep(1);
        return;
      }
    }

    // Verificar também SKUs das variações
    for (let i = 0; i < variations.length; i++) {
      const vSku = variations[i].sku.trim().toUpperCase();
      if (vSku) {
        for (const cId of selectedCompanyIdsSet) {
          const existingVarWithSku = checkProductSkuExists(vSku, cId, productToEdit?.id);
          if (existingVarWithSku) {
            setValidationError('Já existe um produto cadastrado com este SKU nesta empresa.');
            setCurrentStep(2);
            return;
          }
        }
      }
    }

    // 2. Nome Duplicado — Aviso com confirmação, não bloqueio automático
    if (!bypassDuplicateNameCheck && !allowDuplicateNameConfirmed) {
      for (const cId of selectedCompanyIdsSet) {
        const existingProductWithName = checkProductNameExists(name, cId, productToEdit?.id);
        if (existingProductWithName) {
          setDuplicateNameWarningProduct(existingProductWithName);
          return; // Abre modal de aviso com as opções "Ver produto existente" e "Continuar mesmo assim"
        }
      }
    }

    const formattedVariations: ProductVariation[] = variations.map((v) => ({
      id: v.id,
      color: v.color.trim() || undefined,
      colorHex: v.colorHex?.trim() || undefined,
      size: v.size.trim() || undefined,
      sku: v.sku.trim(),
      additionalPrice: Number(v.additionalPrice) || 0,
      quantity: Number(v.quantity) || 0,
    }));

    const productPayload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      category: category.trim(),
      condition,
      description: description.trim(),
      brand: brand.trim() || 'Genérica',
      unitOfMeasure,
      sku: sku.trim() || generateSKU(name, category),
      barcode: barcode.trim() || undefined,
      costPrice: Number(costPrice) || 0,
      salePrice: Number(salePrice) || 0,
      status: 'ativo',
      supplierId: supplierId || suppliers[0]?.id || '',
      createdBy: 'Administrador MyOffice',
      mainImage: mainImage || DEFAULT_IMAGE,
      gallery: gallery.length > 0 ? gallery : [mainImage || DEFAULT_IMAGE],
      variations: formattedVariations,
    };

    const stockConfigsPayload = selectedConfigsArray.map((c) => ({
      warehouseId: c.warehouseId,
      minLimit: Number(c.minLimit) || 0,
      maxLimit: Number(c.maxLimit) || 0,
      physicalLocation: c.physicalLocation.trim() || undefined,
    }));

    let savedResult: Product;
    if (productToEdit) {
      savedResult = updateProduct(productToEdit.id, productPayload, stockConfigsPayload);
    } else {
      savedResult = addProduct(
        productPayload,
        stockConfigsPayload,
        activeDraftId || draftToResume?.id
      );
    }

    setCreatedProductResult(savedResult);
    setCurrentStep(4);
  };

  // Ações do Modal de Confirmação de Nome Duplicado
  const handleViewExistingProduct = () => {
    if (!duplicateNameWarningProduct) return;
    const targetId = duplicateNameWarningProduct.id;
    setDuplicateNameWarningProduct(null);
    onClose();
    onViewProduct?.(targetId);
  };

  const handleContinueWithDuplicateName = () => {
    setAllowDuplicateNameConfirmed(true);
    setDuplicateNameWarningProduct(null);
    handleFinalSubmit(true);
  };

  const handleCancelDuplicateNameWarning = () => {
    setDuplicateNameWarningProduct(null);
    setCurrentStep(1);
  };

  // Salvar direto quando em modo edição de artigo existente (disponível nas etapas 1 e 2 ao lado do Avançar)
  const handleQuickSaveWhenEditing = () => {
    setValidationError(null);
    if (!name.trim()) {
      setValidationError('O nome do produto é obrigatório.');
      return;
    }
    if (!category.trim()) {
      setValidationError('A categoria é obrigatória.');
      return;
    }
    if (!condition) {
      setValidationError('O estado do artigo é obrigatório.');
      return;
    }

    if (currentStep === 1) {
      if (!checkPriceValidation(currentStep)) {
        return;
      }
    }

    if (currentStep === 2) {
      for (let i = 0; i < variations.length; i++) {
        const v = variations[i];
        if (!v.color.trim() && !v.size.trim()) {
          setValidationError(
            `Na variação #${i + 1}, selecione pelo menos a cor ou informe o tamanho/especificação.`
          );
          return;
        }
      }
    }

    handleFinalSubmit();
  };

  // Reset Form for "Cadastrar outro produto"
  const handleResetForAnother = () => {
    setName('');
    setCategory(categories[0] || 'Eletrónicos');
    setCondition('novo');
    setDescription('');
    setBrand('');
    setUnitOfMeasure('unidade');
    setSku('');
    setBarcode('');
    setCostPrice('');
    setSalePrice('');
    setSupplierId(suppliers[0]?.id || '');
    setMainImage(DEFAULT_IMAGE);
    setGallery([]);
    setVariations([]);
    const initialConfigs: Record<
      string,
      {
        warehouseId: string;
        minLimit: number | '';
        maxLimit: number | '';
        physicalLocation: string;
      }
    > = {};
    if (warehouses[0]?.id) {
      initialConfigs[warehouses[0].id] = {
        warehouseId: warehouses[0].id,
        minLimit: 10,
        maxLimit: 100,
        physicalLocation: '',
      };
    }
    setWarehouseConfigs(initialConfigs);
    setWarehouseBlockError(null);
    setCreatedProductResult(null);
    setValidationError(null);
    setActiveDraftId(undefined);
    setCurrentStep(1);
  };

  // Add inline Category
  const handleCreateNewCategory = () => {
    if (newCategoryInput.trim()) {
      addCategory(newCategoryInput.trim());
      setCategory(newCategoryInput.trim());
      setNewCategoryInput('');
      setShowNewCategoryModal(false);
    }
  };

  // Add inline Supplier
  const handleCreateNewSupplier = () => {
    if (newSupplierName.trim()) {
      const created = addSupplier({
        name: newSupplierName.trim(),
        contact: newSupplierContact.trim(),
        address: newSupplierAddress.trim(),
        notes: newSupplierNotes.trim(),
      });
      setSupplierId(created.id);
      setNewSupplierName('');
      setNewSupplierContact('');
      setNewSupplierAddress('');
      setNewSupplierNotes('');
      setShowNewSupplierModal(false);
    }
  };

  // Add image to gallery
  const handleAddGalleryImage = () => {
    if (newGalleryUrl.trim()) {
      setGallery((prev) => [...prev, newGalleryUrl.trim()]);
      setNewGalleryUrl('');
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  // Category Icon helper
  const renderCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Games':
        return <Gamepad2 className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Casa & Cozinha':
        return <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />;
      case 'Moda':
        return <Shirt className="w-3.5 h-3.5 text-pink-600" />;
      case 'Eletrónicos':
        return <Smartphone className="w-3.5 h-3.5 text-blue-600" />;
      case 'Animais':
        return <PawPrint className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Variations total quantity calculation
  const totalVariationsQuantity = variations.reduce(
    (sum, v) => sum + (Number(v.quantity) || 0),
    0
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[700px] max-h-[90vh] flex flex-col overflow-hidden my-auto transition-all"
          role="dialog"
          aria-modal="true"
        >
          {/* Modal Top Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shadow-xs">
                {productToEdit ? 'ED' : 'CD'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {productToEdit
                      ? `Editar Produto: ${productToEdit.name}`
                      : draftToResume
                      ? 'Retomar Rascunho de Produto'
                      : 'Novo Produto no Catálogo'}
                  </h2>
                  {productToEdit && (
                    <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-medium rounded border border-blue-200 dark:border-blue-800">
                      Edição
                    </span>
                  )}
                  {draftToResume && (
                    <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-medium rounded border border-amber-200 dark:border-amber-800">
                      Rascunho
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {currentStep === 1 && 'Passo 1 de 3: Identificação, Estado, Preços e Categoria'}
                  {currentStep === 2 && 'Passo 2 de 3: Variações (Cores, Tamanhos e Quantidades)'}
                  {currentStep === 3 && 'Passo 3 de 3: Configuração de Limites no Armazém'}
                  {currentStep === 4 && 'Registo Concluído com Sucesso'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Single Save / Draft Action (Icon only) */}
              {currentStep !== 4 && (
                <button
                  type="button"
                  id="btn-save-draft"
                  onClick={handleSaveFromHeader}
                  title={
                    productToEdit
                      ? 'Guardar alterações'
                      : activeDraftId
                      ? 'Atualizar apontamento / rascunho de artigo não terminado'
                      : 'Guardar apontamento / rascunho de artigo não terminado'
                  }
                  aria-label={productToEdit ? 'Guardar alterações' : 'Guardar rascunho de artigo não terminado'}
                  disabled={isSavingDraft}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative disabled:opacity-60 cursor-pointer"
                >
                  {productToEdit ? (
                    <Save className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  ) : (
                    <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )}
                  {saveDraftFeedback && (
                    <span className="absolute -bottom-7 right-0 text-[10px] bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-10 font-medium">
                      {productToEdit
                        ? 'Alterações guardadas!'
                        : activeDraftId
                        ? 'Rascunho atualizado!'
                        : 'Rascunho guardado!'}
                    </span>
                  )}
                </button>
              )}

              {/* Close Button with Confirmation trigger */}
              <button
                type="button"
                id="btn-close-product-modal"
                onClick={handleAttemptClose}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          {currentStep !== 4 && (
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-3 shrink-0">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {/* Step 1 */}
                <div
                  className={`flex items-center gap-2 text-xs font-medium cursor-pointer ${
                    currentStep === 1
                      ? 'text-slate-900 dark:text-slate-100 font-semibold'
                      : currentStep > 1
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                  onClick={() => setCurrentStep(1)}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      currentStep === 1
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : currentStep > 1
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    1
                  </span>
                  <span>Dados Básicos</span>
                </div>

                <div
                  className={`flex-1 h-0.5 mx-3 ${
                    currentStep > 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />

                {/* Step 2 */}
                <div
                  className={`flex items-center gap-2 text-xs font-medium cursor-pointer ${
                    currentStep === 2
                      ? 'text-slate-900 dark:text-slate-100 font-semibold'
                      : currentStep > 2
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                  onClick={() => {
                    if (name.trim() && category.trim()) {
                      if (currentStep === 1) {
                        if (checkPriceValidation(2)) setCurrentStep(2);
                      } else {
                        setCurrentStep(2);
                      }
                    } else {
                      setValidationError('Preencha o nome e a categoria do produto antes de prosseguir.');
                    }
                  }}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      currentStep === 2
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : currentStep > 2
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    2
                  </span>
                  <span>Variações</span>
                </div>

                <div
                  className={`flex-1 h-0.5 mx-3 ${
                    currentStep > 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />

                {/* Step 3: Configuração de Armazém (Clicável) */}
                <div
                  className={`flex items-center gap-2 text-xs font-medium cursor-pointer ${
                    currentStep === 3
                      ? 'text-slate-900 dark:text-slate-100 font-semibold'
                      : currentStep > 3
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  onClick={() => {
                    if (name.trim() && category.trim()) {
                      if (currentStep === 1) {
                        if (checkPriceValidation(3)) setCurrentStep(3);
                      } else {
                        setCurrentStep(3);
                      }
                    } else {
                      setValidationError('Preencha o nome e a categoria do produto antes de prosseguir.');
                    }
                  }}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      currentStep === 3
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : currentStep > 3
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    3
                  </span>
                  <span>Configuração de Armazém</span>
                </div>
              </div>
            </div>
          )}

          {/* Validation Error Banner */}
          {validationError && (
            <div className="px-6 pt-4 shrink-0">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{validationError}</span>
              </div>
            </div>
          )}

          {/* Modal Scrollable Body */}
          <div className="p-6 flex-1 overflow-y-auto min-h-0">
            {/* ========================================================================= */}
            {/* STEP 1: DADOS BÁSICOS, ESTADO, PREÇOS E CATEGORIA                         */}
            {/* ========================================================================= */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Nome do Produto & Estado */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="input-product-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Nome do Produto <span className="text-rose-500">*</span>
                      </label>
                      {currentCompany && (
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          Empresa: {currentCompany.name}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      id="input-product-name"
                      aria-label="Nome do Produto"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ex: Comando Sem Fios DualSense PS5 / Fritadeira Air Fryer 4.5L"
                      className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-400 dark:focus:border-slate-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    {nameDuplicateCandidate && (
                      <div className="mt-1.5 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/90 rounded-lg flex items-center justify-between gap-2 animate-in fade-in duration-150">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="text-[11px] text-amber-800 dark:text-amber-300 truncate">
                            Já existe um produto chamado <strong className="font-semibold text-slate-900 dark:text-slate-100">'{nameDuplicateCandidate.name}'</strong> nesta empresa.
                          </span>
                        </div>
                        {onViewProduct && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onViewProduct(nameDuplicateCandidate.id);
                            }}
                            className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-200 underline shrink-0 cursor-pointer"
                          >
                            Ver produto existente
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* NOVO CAMPO OBRIGATÓRIO: Estado do Artigo */}
                  <div>
                    <label htmlFor="select-product-condition" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Estado do Artigo <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-product-condition"
                      aria-label="Estado do Artigo"
                      value={condition}
                      onChange={(e) => handleConditionChange(e.target.value as ProductCondition)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-400 dark:focus:border-slate-500 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                    >
                      <option value="novo">Novo (de fábrica / lacrado)</option>
                      <option value="novo_usado">Novo-Usado (caixa aberta / demo)</option>
                      <option value="usado">Usado (em bom estado)</option>
                      <option value="troca">Troca (recebido para retoma)</option>
                    </select>
                  </div>
                </div>

                {/* Categoria & Marca */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Categoria com as 5 principais */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="select-product-category" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Categoria <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryModal(true)}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium cursor-pointer"
                      >
                        + Nova
                      </button>
                    </div>
                    <div className="relative">
                      <select
                        id="select-product-category"
                        aria-label="Categoria do Produto"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-400 dark:focus:border-slate-500 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      {renderCategoryIcon(category)}
                      <span>Taxonomia do catálogo</span>
                    </div>
                  </div>

                  {/* Marca */}
                  <div>
                    <label htmlFor="input-product-brand" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Marca
                    </label>
                    <input
                      type="text"
                      id="input-product-brand"
                      aria-label="Marca"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Ex: Sony, Philips, Apple, Nike, Purina"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-400 dark:focus:border-slate-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Unidade de Medida */}
                  <div>
                    <label htmlFor="select-unit-of-measure" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Unidade de Medida
                    </label>
                    <select
                      id="select-unit-of-measure"
                      aria-label="Unidade de Medida"
                      value={unitOfMeasure}
                      onChange={(e) => setUnitOfMeasure(e.target.value as UnitOfMeasure)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-400 dark:focus:border-slate-500 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                    >
                      <option value="unidade">Unidade (un)</option>
                      <option value="caixa">Caixa (cx)</option>
                      <option value="par">Par</option>
                      <option value="pacote">Pacote (pct)</option>
                      <option value="kg">Quilograma (kg)</option>
                      <option value="litro">Litro (L)</option>
                      <option value="metro">Metro (m)</option>
                    </select>
                  </div>
                </div>

                {/* SKU e Código de Barras */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="input-product-sku" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Código SKU <span className="text-slate-400 dark:text-slate-500 font-normal">(Identificador Único)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoGenerateSku}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" /> Gerar automático
                      </button>
                    </div>
                    <input
                      type="text"
                      id="input-product-sku"
                      aria-label="Código SKU"
                      value={sku}
                      onChange={(e) => handleSkuChange(e.target.value)}
                      placeholder="Ex: GAME-PS5-001"
                      className={`w-full px-3 py-2 text-xs font-mono uppercase bg-white dark:bg-slate-800 border rounded-lg focus:outline-hidden focus:ring-2 text-slate-800 dark:text-slate-100 ${
                        skuDuplicateCandidate || skuError
                          ? 'border-rose-400 ring-2 ring-rose-500/15 bg-rose-50/20 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-slate-900/10 dark:focus:ring-slate-100/10'
                      }`}
                    />
                    {(skuDuplicateCandidate || skuError) && (
                      <div className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium animate-in fade-in duration-150">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                        <span>Já existe um produto registado com este SKU.</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="input-product-barcode" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Código de Barras EAN-13 <span className="text-slate-400 dark:text-slate-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      id="input-product-barcode"
                      aria-label="Código de Barras EAN-13"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Ex: 5601234567890"
                      className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Preços e Fornecedor */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Preço de Custo */}
                    <div>
                      <label htmlFor="input-cost-price" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Preço de Custo (Kz)
                      </label>
                      <input
                        type="number"
                        id="input-cost-price"
                        aria-label="Preço de Custo em Kwanzas"
                        min="0"
                        step="100"
                        value={costPrice}
                        onChange={(e) =>
                          setCostPrice(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    {/* Preço de Venda */}
                    <div>
                      <label htmlFor="input-sale-price" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Preço de Venda (Kz)
                      </label>
                      <input
                        type="number"
                        id="input-sale-price"
                        aria-label="Preço de Venda em Kwanzas"
                        min="0"
                        step="100"
                        value={salePrice}
                        onChange={(e) =>
                          setSalePrice(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-xs font-mono font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Fornecedor */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="select-supplier" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Fornecedor
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowNewSupplierModal(true)}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium cursor-pointer"
                        >
                          + Novo
                        </button>
                      </div>
                      <select
                        id="select-supplier"
                        aria-label="Fornecedor do Produto"
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Margem Calculada & Alertas por Estado */}
                  {Number(costPrice) > 0 && Number(salePrice) > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Margem Bruta Estimada:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                            {formatKwanza(Number(salePrice) - Number(costPrice))}
                          </span>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                              Number(salePrice) >= Number(costPrice)
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {Math.round(
                              ((Number(salePrice) - Number(costPrice)) / Number(costPrice)) * 100
                            )}
                            %
                          </span>
                        </div>
                      </div>

                      {condition === 'novo' && Number(salePrice) < Number(costPrice) && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                          <span>Alerta (Novo): O preço de venda é inferior ao preço de custo.</span>
                        </div>
                      )}

                      {condition === 'usado' && Number(salePrice) > Number(costPrice) && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>Aviso (Usado): O preço de venda é superior ao preço de custo.</span>
                        </div>
                      )}

                      {condition === 'novo_usado' && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-[11px]">
                          <Info className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                          <span>Novo-Usado: Preço livre (pode ser inferior ou superior ao custo).</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Imagens (Principal e Galeria com Presets das 5 Categorias) */}
                <div className="space-y-3">
                  <label htmlFor="input-main-image-url" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Imagem do Produto
                  </label>

                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 shrink-0 shadow-2xs">
                      <img
                        src={mainImage}
                        alt="Pré-visualização"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        type="url"
                        id="input-main-image-url"
                        aria-label="URL da imagem principal"
                        value={mainImage}
                        onChange={(e) => setMainImage(e.target.value)}
                        placeholder="URL da imagem (https://...)"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />

                      {/* Presets adaptados para a categoria selecionada */}
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                          Fotos sugeridas para {category}:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(CATEGORY_IMAGE_PRESETS[category] || CATEGORY_IMAGE_PRESETS['Eletrónicos']).map(
                            (preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setMainImage(preset.url)}
                                className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                                  mainImage === preset.url
                                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 font-medium'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                              >
                                {preset.label}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label htmlFor="textarea-description" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição Detalhada & Especificações
                  </label>
                  <textarea
                    id="textarea-description"
                    aria-label="Descrição Detalhada e Especificações"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalhes técnicos, garantia, dimensões, voltagem, especificações..."
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: VARIAÇÕES (COR COM COLOR PICKER, TAMANHO E QUANTIDADE)            */}
            {/* ========================================================================= */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      Grade de Variações do Produto
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Configure combinações como Cor, Tamanho, Capacidade e Quantidade por variação.
                    </p>
                  </div>

                  <button
                    type="button"
                    id="btn-add-variation-row"
                    onClick={handleAddVariation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Variação</span>
                  </button>
                </div>

                {variations.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto mb-2">
                      <Palette className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300">Sem variações configuradas</h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-sm mx-auto">
                      Se o produto não tiver tamanhos ou cores diferentes, pode avançar diretamente para o próximo passo.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddVariation}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Primeira Variação</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {variations.map((v, index) => (
                      <div
                        key={v.id}
                        className="p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                              {index + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                              Variação #{index + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDuplicateVariation(index)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors cursor-pointer"
                              title="Duplicar variação mantendo o mesmo tamanho"
                              aria-label={`Duplicar variação ${index + 1}`}
                            >
                              <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                              <span>Manter tamanho</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveVariation(index)}
                              className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Remover variação"
                              aria-label={`Remover variação ${index + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                          {/* Campo Cor com Seletor Visual ColorPickerInput */}
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Cor (Seletor)
                            </label>
                            <ColorPickerInput
                              value={v.color}
                              hex={v.colorHex}
                              onChange={(colorName, colorHex) => {
                                handleUpdateVariation(index, 'color', colorName);
                                handleUpdateVariation(index, 'colorHex', colorHex);
                              }}
                              placeholder="Escolher cor"
                            />
                          </div>

                          {/* Tamanho / Especificação */}
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Tamanho / Versão
                            </label>
                            <input
                              type="text"
                              aria-label={`Tamanho ou versão da variação ${index + 1}`}
                              value={v.size}
                              onChange={(e) =>
                                handleUpdateVariation(index, 'size', e.target.value)
                              }
                              placeholder="Ex: M / 42 / 1TB"
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                          </div>

                          {/* SKU Específico */}
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                              SKU da Variação
                            </label>
                            <input
                              type="text"
                              aria-label={`SKU da variação ${index + 1}`}
                              value={v.sku}
                              onChange={(e) =>
                                handleUpdateVariation(index, 'sku', e.target.value.toUpperCase())
                              }
                              className="w-full px-3 py-2 text-xs font-mono uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          {/* Acréscimo Preço (Kz) */}
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                              + Preço (Kz)
                            </label>
                            <input
                              type="number"
                              aria-label={`Acréscimo de preço da variação ${index + 1}`}
                              min="0"
                              step="500"
                              value={v.additionalPrice || ''}
                              onChange={(e) =>
                                handleUpdateVariation(
                                  index,
                                  'additionalPrice',
                                  Number(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          {/* NOVO CAMPO: Quantidade por Variação */}
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Qtd. Esperada
                            </label>
                            <input
                              type="number"
                              aria-label={`Quantidade esperada da variação ${index + 1}`}
                              min="0"
                              step="1"
                              value={v.quantity ?? ''}
                              onChange={(e) =>
                                handleUpdateVariation(
                                  index,
                                  'quantity',
                                  e.target.value === '' ? 0 : Number(e.target.value)
                                )
                              }
                              placeholder="0"
                              className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Resumo visual das variações */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>
                          Total de variações registadas: <strong>{variations.length}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 dark:text-slate-500">•</span>
                        <span>
                          Soma das variações: <strong>{totalVariationsQuantity}</strong> unidades
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: CONFIGURAÇÃO DE ARMAZÉM (SELEÇÃO MÚLTIPLA POR EMPRESA & LIMITES)  */}
            {/* ========================================================================= */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Audit & Compliance Banner */}
                <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 rounded-xl text-xs text-blue-900 dark:text-blue-300 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-semibold text-blue-950 dark:text-blue-100">
                        Vínculo de Armazéns e Regra de Integridade MyOffice
                      </h4>
                      <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                        Selecione os armazéns onde este artigo estará disponível e configure os limites de reposição e localização física individualmente.
                        Para manter a integridade contabilística e fiscal, a quantidade física em stock é inserida exclusivamente através de <strong>Movimentações de Entrada</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-100/80 dark:bg-blue-900/60 text-blue-950 dark:text-blue-200 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-700 self-start sm:self-auto">
                    <Warehouse className="w-3.5 h-3.5 text-blue-700 dark:text-blue-300" />
                    <span>
                      {selectedWarehouseIds.length} {selectedWarehouseIds.length === 1 ? 'armazém vinculado' : 'armazéns vinculados'}
                    </span>
                  </div>
                </div>

                {/* Mensagem de Bloqueio de Desvinculação com Estoque > 0 */}
                {warehouseBlockError && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-900 dark:text-rose-300 flex items-start gap-3 shadow-xs animate-in fade-in">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-rose-950 dark:text-rose-100">
                        Não é possível desvincular este armazém
                      </h4>
                      <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
                        {warehouseBlockError}
                      </p>
                    </div>
                  </div>
                )}

                {/* Mensagem de Erro de Validação (Ex: nenhum armazém selecionado) */}
                {validationError && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Lista de Armazéns Agrupados por Empresa */}
                <div className="space-y-5">
                  {warehousesByCompany.map(({ company, warehouses: compWarehouses }) => {
                    const compSelectedCount = compWarehouses.filter((w) => Boolean(warehouseConfigs[w.id])).length;
                    const allCompSelected = compSelectedCount === compWarehouses.length && compWarehouses.length > 0;

                    return (
                      <div
                        key={company.id}
                        className="bg-white dark:bg-slate-805 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4"
                      >
                        {/* Header da Empresa */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                              <Building className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {company.name}
                                </h4>
                                <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-medium">
                                  {compSelectedCount} de {compWarehouses.length} {compWarehouses.length === 1 ? 'armazém vinculado' : 'armazéns vinculados'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                Marque os armazéns desta empresa onde o artigo estará disponível
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {!allCompSelected ? (
                              <button
                                type="button"
                                onClick={() => handleSelectAllInCompany(company.id)}
                                className="px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                              >
                                Marcar todos
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeselectAllInCompany(company.id)}
                                className="px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                              >
                                Desmarcar todos
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Cards de Armazéns da Empresa */}
                        <div className="space-y-3">
                          {compWarehouses.map((wh) => {
                            const isSelected = Boolean(warehouseConfigs[wh.id]);
                            const cfg = warehouseConfigs[wh.id] || {
                              minLimit: 10,
                              maxLimit: 100,
                              physicalLocation: '',
                            };
                            const currentStock = productToEdit
                              ? getCurrentStock(productToEdit.id, wh.id)
                              : 0;

                            return (
                              <div
                                key={wh.id}
                                className={`rounded-xl border transition-all ${
                                  isSelected
                                    ? 'bg-slate-50/60 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 shadow-2xs'
                                    : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                              >
                                {/* Linha do Armazém com Checkbox */}
                                <div
                                  onClick={() => handleToggleWarehouse(wh.id)}
                                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div
                                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                        isSelected
                                          ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900'
                                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400'
                                      }`}
                                    >
                                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </div>

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                          {wh.name}
                                        </span>
                                        {wh.code && (
                                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono rounded">
                                            {wh.code}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                        <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                                        <span>{wh.address}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {productToEdit && currentStock > 0 && (
                                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold rounded-md">
                                        Stock: {currentStock} un
                                      </span>
                                    )}
                                    <span
                                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                        isSelected
                                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      {isSelected ? 'Vinculado' : 'Não vinculado'}
                                    </span>
                                  </div>
                                </div>

                                {/* Configuração de Limites quando o armazém está selecionado */}
                                {isSelected && (
                                  <div className="px-4 pb-4 pt-1 border-t border-slate-200/70 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 rounded-b-xl">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                          Limite Mínimo (Alerta)
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          aria-label={`Limite Mínimo para ${wh.name}`}
                                          value={cfg.minLimit}
                                          onChange={(e) =>
                                            handleUpdateWarehouseConfig(
                                              wh.id,
                                              'minLimit',
                                              e.target.value === '' ? '' : Number(e.target.value)
                                            )
                                          }
                                          placeholder="10"
                                          className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                                        />
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                          Alerta de reposição
                                        </span>
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                          Limite Máximo
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          aria-label={`Limite Máximo para ${wh.name}`}
                                          value={cfg.maxLimit}
                                          onChange={(e) =>
                                            handleUpdateWarehouseConfig(
                                              wh.id,
                                              'maxLimit',
                                              e.target.value === '' ? '' : Number(e.target.value)
                                            )
                                          }
                                          placeholder="100"
                                          className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                                        />
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                          Capacidade recomendada
                                        </span>
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                          Localização Física
                                        </label>
                                        <input
                                          type="text"
                                          aria-label={`Localização Física em ${wh.name}`}
                                          value={cfg.physicalLocation}
                                          onChange={(e) =>
                                            handleUpdateWarehouseConfig(
                                              wh.id,
                                              'physicalLocation',
                                              e.target.value
                                            )
                                          }
                                          placeholder="Ex: Corredor A • Prateleira 3"
                                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        />
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                          Prateleira / gaveta / estante
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: SUCESSO & RESUMO DO PRODUTO REGISTADO / EDITADO                  */}
            {/* ========================================================================= */}
            {currentStep === 4 && createdProductResult && (
              <div className="py-6 text-center space-y-6 flex flex-col items-center justify-center h-full min-h-[440px]">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {productToEdit
                      ? 'Produto Atualizado com Sucesso!'
                      : 'Produto Registado com Sucesso!'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {productToEdit
                      ? 'As informações do catálogo e regras de limites foram guardadas.'
                      : 'O artigo está ativo no catálogo. Para adicionar quantidade ao stock físico, registe uma movimentação de entrada.'}
                  </p>
                </div>

                {/* Card Resumo do Produto */}
                <div className="max-w-md mx-auto p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-left flex items-start gap-4">
                  <img
                    src={createdProductResult.mainImage}
                    alt={createdProductResult.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {createdProductResult.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      SKU: <span className="font-mono">{createdProductResult.sku}</span> •{' '}
                      {createdProductResult.category}
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {formatKwanza(createdProductResult.salePrice)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                        {createdProductResult.condition || 'Novo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações de Sucesso */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {onViewProduct && (
                    <button
                      type="button"
                      id="btn-view-product-details-after-create"
                      onClick={() => {
                        onViewProduct(createdProductResult.id);
                        onClose();
                      }}
                      className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
                    >
                      Ver Detalhes do Produto
                    </button>
                  )}

                  {onCreateMovement && (
                    <button
                      type="button"
                      id="btn-create-movement-after-create"
                      onClick={() => {
                        onCreateMovement(
                          createdProductResult.id,
                          selectedWarehouseIds[0] || warehouses[0]?.id || ''
                        );
                        onClose();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      Criar Movimento
                    </button>
                  )}

                  {!productToEdit && (
                    <button
                      type="button"
                      id="btn-create-another-product"
                      onClick={handleResetForAnother}
                      className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Registar Outro Produto
                    </button>
                  )}

                  <button
                    type="button"
                    id="btn-finish-modal"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    Concluir e Fechar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Bottom Footer (Navigation & Actions) */}
          {currentStep !== 4 && (
            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
              {/* Left action: Cancel only (no duplicate save button) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-cancel-modal"
                  onClick={handleAttemptClose}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              {/* Right actions: Voltar / Avançar / Guardar */}
              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <button
                    type="button"
                    id="btn-wizard-prev"
                    onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Voltar</span>
                  </button>
                )}

                {/* Botão de Guardar Imediato (Exclusivo para EDIÇÃO de artigo já criado) */}
                {Boolean(productToEdit) && currentStep < 3 && (
                  <button
                    type="button"
                    id={`btn-quick-save-step${currentStep}`}
                    onClick={handleQuickSaveWhenEditing}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                    title="Guardar alterações feitas no artigo logo nesta guia sem precisar avançar até o fim"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Guardar Alterações</span>
                  </button>
                )}

                {currentStep === 1 && (
                  <button
                    type="button"
                    id="btn-wizard-next-step1"
                    onClick={handleProceedFromStep1}
                    className="inline-flex items-center gap-1 px-4 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Avançar para Variações</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {currentStep === 2 && (
                  <button
                    type="button"
                    id="btn-wizard-next-step2"
                    onClick={handleProceedFromStep2}
                    className="inline-flex items-center gap-1 px-4 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Avançar para Armazém</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {currentStep === 3 && (
                  <button
                    type="button"
                    id="btn-wizard-finish"
                    onClick={handleFinalSubmit}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{productToEdit ? 'Guardar Alterações' : 'Finalizar Registo'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONFIRMATION DIALOG WHEN CLOSING UNFINISHED MODAL                         */}
      {/* ========================================================================= */}
      {showCloseConfirmation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FileEdit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Deseja guardar o registo como rascunho?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Existem informações alteradas no formulário. Pode continuar a editar, guardar o
                  rascunho para retomar mais tarde ou sair sem guardar.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                id="btn-dialog-continue-editing"
                onClick={() => setShowCloseConfirmation(false)}
                className="w-full sm:w-auto px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer"
              >
                Continuar
              </button>

              <button
                type="button"
                id="btn-dialog-save-draft"
                onClick={handleSaveFromHeader}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                {productToEdit ? (
                  <Save className="w-3.5 h-3.5" />
                ) : (
                  <StickyNote className="w-3.5 h-3.5" />
                )}
                <span>{productToEdit ? 'Guardar' : 'Guardar Rascunho'}</span>
              </button>

              <button
                type="button"
                id="btn-dialog-discard"
                onClick={handleDiscardAndClose}
                className="w-full sm:w-auto px-3.5 py-1.5 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MARGIN WARNING MODAL                                                      */}
      {/* ========================================================================= */}
      {showMarginWarningModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {priceWarningDetails.title || 'Aviso de Preço'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {priceWarningDetails.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                id="btn-correct-prices"
                onClick={() => setShowMarginWarningModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer"
              >
                Corrigir Preços
              </button>
              <button
                type="button"
                id="btn-ignore-margin-warning"
                onClick={() => {
                  setShowMarginWarningModal(false);
                  setCurrentStep((priceWarningDetails.targetStep as 1 | 2 | 3) || 2);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Ignorar e Avançar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO: NOME DUPLICADO (AVISO COM DECISÃO)                  */}
      {/* ========================================================================= */}
      {duplicateNameWarningProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Aviso de Produto Duplicado
                  </h3>
                  {currentCompany && (
                    <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                      {currentCompany.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed font-normal">
                  Já existe um produto chamado <strong className="text-slate-900 dark:text-slate-100 font-semibold">'{duplicateNameWarningProduct.name}'</strong> registado. Tem a certeza de que deseja criar um novo produto, ou adicionar uma variação ao produto já existente?
                </p>
              </div>
            </div>

            {/* Preview do Produto Existente */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl flex items-center gap-3">
              <img
                src={duplicateNameWarningProduct.mainImage}
                alt={duplicateNameWarningProduct.name}
                className="w-12 h-12 rounded-lg object-cover bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {duplicateNameWarningProduct.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>SKU: <strong className="font-mono text-slate-700 dark:text-slate-300">{duplicateNameWarningProduct.sku}</strong></span>
                  <span>•</span>
                  <span>{duplicateNameWarningProduct.category}</span>
                  {duplicateNameWarningProduct.variations && duplicateNameWarningProduct.variations.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">{duplicateNameWarningProduct.variations.length} variações</span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Preço: <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{formatKwanza(duplicateNameWarningProduct.salePrice)}</span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                id="btn-cancel-duplicate-warning"
                onClick={handleCancelDuplicateNameWarning}
                className="w-full sm:w-auto px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer"
              >
                Voltar e alterar nome
              </button>

              <button
                type="button"
                id="btn-view-existing-product"
                onClick={handleViewExistingProduct}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver produto existente</span>
              </button>

              <button
                type="button"
                id="btn-continue-duplicate-name"
                onClick={handleContinueWithDuplicateName}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Continuar mesmo assim</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INLINE: CRIAR NOVA CATEGORIA                                        */}
      {/* ========================================================================= */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Adicionar Nova Categoria</h4>
            <input
              type="text"
              aria-label="Nome da Nova Categoria"
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              placeholder="Ex: Livros, Ferramentas, Bebidas..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewCategoryModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateNewCategory}
                className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-medium cursor-pointer"
              >
                Adicionar Categoria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INLINE: CRIAR NOVO FORNECEDOR                                       */}
      {/* ========================================================================= */}
      {showNewSupplierModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Registar Fornecedor</h4>
            <div className="space-y-2">
              <input
                type="text"
                aria-label="Nome da Empresa ou Fornecedor"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Nome da Empresa / Fornecedor *"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                autoFocus
              />
              <input
                type="text"
                aria-label="Contacto do Fornecedor"
                value={newSupplierContact}
                onChange={(e) => setNewSupplierContact(e.target.value)}
                placeholder="Contacto (Telefone / Email)"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <input
                type="text"
                aria-label="Localização ou Província do Fornecedor"
                value={newSupplierAddress}
                onChange={(e) => setNewSupplierAddress(e.target.value)}
                placeholder="Localização / Província (ex: Luanda - Viana)"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewSupplierModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateNewSupplier}
                className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-medium cursor-pointer"
              >
                Guardar Fornecedor
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
