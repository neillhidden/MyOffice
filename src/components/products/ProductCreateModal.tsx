import React, { useState } from 'react';
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
  DollarSign,
  PackageCheck,
  Building,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Product, ProductVariation, UnitOfMeasure } from '../../types/stock';
import { generateSKU, formatKwanza } from '../../utils/formatters';

interface ProductCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewProduct?: (productId: string) => void;
}

const SAMPLE_IMAGE_PRESETS = [
  { label: 'Alimento / Grãos', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Óleo / Bebidas', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Eletrónico / Smartphone', url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Construção / Materiais', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Vestuário / Moda', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
  { label: 'Limpeza / Produtos', url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80' },
];

export const ProductCreateModal: React.FC<ProductCreateModalProps> = ({
  isOpen,
  onClose,
  onViewProduct,
}) => {
  const {
    suppliers,
    categories,
    warehouses,
    addProduct,
    addSupplier,
    addCategory,
  } = useStock();

  // Current Wizard Step: 1 = Dados, 2 = Variações, 3 = Estoque inicial, 4 = Concluído
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 State: Produto
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>('unidade');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [supplierId, setSupplierId] = useState('');
  const [mainImage, setMainImage] = useState(SAMPLE_IMAGE_PRESETS[0].url);
  const [gallery, setGallery] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Step 2 State: Variações
  const [variations, setVariations] = useState<
    Array<{
      id: string;
      color: string;
      size: string;
      sku: string;
      additionalPrice: number;
    }>
  >([]);

  // Step 3 State: Estoque inicial (opcional)
  const [initialWarehouseId, setInitialWarehouseId] = useState(warehouses[0]?.id || '');
  const [initialQuantity, setInitialQuantity] = useState<number | ''>('');
  const [minLimit, setMinLimit] = useState<number | ''>(10);
  const [maxLimit, setMaxLimit] = useState<number | ''>(100);
  const [physicalLocation, setPhysicalLocation] = useState('');

  // Inline Modals & Alert confirmations
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [newSupplierNotes, setNewSupplierNotes] = useState('');

  const [showMarginWarningModal, setShowMarginWarningModal] = useState(false);
  const [createdProductResult, setCreatedProductResult] = useState<Product | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-generate SKU helper
  const handleAutoGenerateSku = () => {
    if (!name && !category) {
      setValidationError('Insira ao menos o nome ou categoria para gerar o SKU.');
      return;
    }
    const generated = generateSKU(name || 'ITEM', category || 'GERAL');
    setSku(generated);
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

    // Check margin warning (sale price < cost price)
    const cost = Number(costPrice) || 0;
    const sale = Number(salePrice) || 0;
    if (cost > 0 && sale > 0 && sale < cost) {
      setShowMarginWarningModal(true);
      return;
    }

    // Auto-generate SKU if empty
    if (!sku.trim()) {
      setSku(generateSKU(name, category));
    }

    setCurrentStep(2);
  };

  // Step 2: Add Variation Line
  const handleAddVariation = () => {
    const varSku = sku ? `${sku}-V${variations.length + 1}` : `VAR-${Date.now().toString().slice(-4)}`;
    setVariations((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        color: '',
        size: '',
        sku: varSku,
        additionalPrice: 0,
      },
    ]);
  };

  const handleUpdateVariation = (
    index: number,
    field: 'color' | 'size' | 'sku' | 'additionalPrice',
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
    // Validation: if variation rows added, at least color or size must be filled
    for (let i = 0; i < variations.length; i++) {
      const v = variations[i];
      if (!v.color.trim() && !v.size.trim()) {
        setValidationError(
          `Na variação #${i + 1}, preencha pelo menos a cor ou o tamanho.`
        );
        return;
      }
    }
    setCurrentStep(3);
  };

  // Step 3: Final Save
  const handleFinalSubmit = () => {
    setValidationError(null);

    const formattedVariations: ProductVariation[] = variations.map((v) => ({
      id: v.id,
      color: v.color.trim() || undefined,
      size: v.size.trim() || undefined,
      sku: v.sku.trim(),
      additionalPrice: Number(v.additionalPrice) || 0,
    }));

    const productPayload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      category: category.trim(),
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
      mainImage: mainImage || SAMPLE_IMAGE_PRESETS[0].url,
      gallery: gallery.length > 0 ? gallery : [mainImage || SAMPLE_IMAGE_PRESETS[0].url],
      variations: formattedVariations,
    };

    // Initial stock (optional): generates automatic audited entrada Movement
    const initialStockPayload =
      initialWarehouseId && initialQuantity !== '' && Number(initialQuantity) >= 0
        ? {
            warehouseId: initialWarehouseId,
            quantity: Number(initialQuantity),
            minLimit: Number(minLimit) || 0,
            maxLimit: Number(maxLimit) || 0,
            physicalLocation: physicalLocation.trim() || undefined,
          }
        : initialWarehouseId && (minLimit !== '' || maxLimit !== '')
        ? {
            warehouseId: initialWarehouseId,
            quantity: 0,
            minLimit: Number(minLimit) || 0,
            maxLimit: Number(maxLimit) || 0,
            physicalLocation: physicalLocation.trim() || undefined,
          }
        : undefined;

    const created = addProduct(productPayload, initialStockPayload);
    setCreatedProductResult(created);
    setCurrentStep(4);
  };

  // Reset Form for "Cadastrar outro produto"
  const handleResetForAnother = () => {
    setName('');
    setCategory('');
    setDescription('');
    setBrand('');
    setUnitOfMeasure('unidade');
    setSku('');
    setBarcode('');
    setCostPrice('');
    setSalePrice('');
    setSupplierId('');
    setMainImage(SAMPLE_IMAGE_PRESETS[0].url);
    setGallery([]);
    setVariations([]);
    setInitialQuantity('');
    setMinLimit(10);
    setMaxLimit(100);
    setPhysicalLocation('');
    setCreatedProductResult(null);
    setValidationError(null);
    setCurrentStep(1);
  };

  // Save new category inline
  const handleSaveInlineCategory = () => {
    if (newCategoryInput.trim()) {
      addCategory(newCategoryInput.trim());
      setCategory(newCategoryInput.trim());
      setNewCategoryInput('');
      setShowNewCategoryModal(false);
    }
  };

  // Save new supplier inline
  const handleSaveInlineSupplier = () => {
    if (newSupplierName.trim()) {
      const created = addSupplier({
        name: newSupplierName.trim(),
        contact: newSupplierContact.trim() || 'Não informado',
        address: newSupplierAddress.trim() || 'Luanda, Angola',
        notes: newSupplierNotes.trim() || undefined,
      });
      setSupplierId(created.id);
      setNewSupplierName('');
      setNewSupplierContact('');
      setNewSupplierAddress('');
      setNewSupplierNotes('');
      setShowNewSupplierModal(false);
    }
  };

  // Add URL to gallery
  const handleAddGalleryUrl = () => {
    if (newGalleryUrl.trim() && !gallery.includes(newGalleryUrl.trim())) {
      setGallery([...gallery, newGalleryUrl.trim()]);
      setNewGalleryUrl('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-6 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              +
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {currentStep === 4 ? 'Produto Cadastrado com Sucesso' : 'Novo Produto'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentStep === 1 && 'Passo 1 de 3 — Informações do catálogo'}
                {currentStep === 2 && 'Passo 2 de 3 — Variações (opcional)'}
                {currentStep === 3 && 'Passo 3 de 3 — Estoque inicial & limites (opcional)'}
                {currentStep === 4 && 'Registro concluído e auditado'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-product-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator (only for steps 1-3) */}
        {currentStep < 4 && (
          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div
                className={`flex items-center gap-1.5 text-xs ${
                  currentStep === 1
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    currentStep === 1
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  1
                </span>
                <span>Dados Gerais</span>
              </div>

              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

              <div
                className={`flex items-center gap-1.5 text-xs ${
                  currentStep === 2
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    currentStep === 2
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  2
                </span>
                <span>Variações</span>
              </div>

              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

              <div
                className={`flex items-center gap-1.5 text-xs ${
                  currentStep === 3
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    currentStep === 3
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  3
                </span>
                <span>Estoque Inicial</span>
              </div>
            </div>

            {validationError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {/* PASSO 1: DADOS DO PRODUTO */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Nome e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nome do Produto <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-product-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Arroz Agulha Tipo 1 (25kg)"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Categoria <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryModal(true)}
                      className="text-[11px] text-slate-600 hover:text-slate-900 font-medium flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Nova Categoria
                    </button>
                  </div>
                  <select
                    id="select-product-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                  >
                    <option value="">Selecione uma categoria...</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Descrição Detalhada
                </label>
                <textarea
                  rows={2}
                  id="input-product-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Informações adicionais, especificações técnicas, embalagem..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                />
              </div>

              {/* Marca, Unidade de Medida, SKU e Código de Barras */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    id="input-product-brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Tio Lucas"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    id="select-unit-of-measure"
                    value={unitOfMeasure}
                    onChange={(e) => setUnitOfMeasure(e.target.value as UnitOfMeasure)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                  >
                    <option value="unidade">Unidade (un)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="litro">Litro (L)</option>
                    <option value="caixa">Caixa (cx)</option>
                    <option value="saco">Saco (sc)</option>
                    <option value="pacote">Pacote (pct)</option>
                    <option value="metro">Metro (m)</option>
                    <option value="par">Par</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      SKU
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateSku}
                      className="text-[10px] text-slate-500 hover:text-slate-900"
                      title="Gerar SKU automático"
                    >
                      Gerar
                    </button>
                  </div>
                  <input
                    type="text"
                    id="input-product-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ex: ALI-ARR-1025"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Código de Barras (EAN)
                  </label>
                  <input
                    type="text"
                    id="input-product-barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Ex: 5601234567890"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Preços (Kwanza) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Preço de Custo (Kz)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="input-cost-price"
                      min="0"
                      step="any"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0,00"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white font-mono pl-10"
                    />
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">
                      Kz
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Custo de aquisição junto ao fornecedor
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Preço de Venda (Kz)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="input-sale-price"
                      min="0"
                      step="any"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0,00"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white font-mono pl-10"
                    />
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">
                      Kz
                    </span>
                  </div>
                  {costPrice && salePrice ? (
                    <span className="text-[10px] text-slate-600 mt-1 block">
                      Margem bruta: {formatKwanza(Number(salePrice) - Number(costPrice))} (
                      {(((Number(salePrice) - Number(costPrice)) / Number(salePrice)) * 100).toFixed(1)}%)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Preço ao consumidor / revenda
                    </span>
                  )}
                </div>
              </div>

              {/* Fornecedor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Fornecedor Principal
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewSupplierModal(true)}
                    className="text-[11px] text-slate-600 hover:text-slate-900 font-medium flex items-center gap-0.5"
                  >
                    <UserPlus className="w-3 h-3" /> Criar Novo Fornecedor
                  </button>
                </div>
                <select
                  id="select-supplier"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                >
                  <option value="">Selecione o fornecedor do produto...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contact.split('•')[0].trim()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Imagens (Principal + Galeria) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-medium text-slate-700">
                  Imagem Principal & Galeria
                </label>

                {/* Preset Fast Picker */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-[11px] text-slate-400 self-center mr-1">Predefinições:</span>
                  {SAMPLE_IMAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMainImage(preset.url)}
                      className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                        mainImage === preset.url
                          ? 'border-slate-800 bg-slate-800 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-50">
                    <img
                      src={mainImage}
                      alt="Preview principal"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      id="input-main-image-url"
                      value={mainImage}
                      onChange={(e) => setMainImage(e.target.value)}
                      placeholder="URL da imagem principal..."
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newGalleryUrl}
                        onChange={(e) => setNewGalleryUrl(e.target.value)}
                        placeholder="Adicionar URL à galeria..."
                        className="flex-1 text-xs px-3 py-1 border border-slate-300 rounded-lg focus:outline-none bg-white text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={handleAddGalleryUrl}
                        className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                      >
                        + Foto
                      </button>
                    </div>
                  </div>
                </div>

                {gallery.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400">Galeria ({gallery.length}):</span>
                    {gallery.map((img, i) => (
                      <div key={i} className="relative group w-8 h-8 rounded border border-slate-200 overflow-hidden">
                        <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setGallery(gallery.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASSO 2: VARIAÇÕES (OPCIONAL) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                <Layers className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Variações são opcionais.</strong> Se o produto tiver cores, tamanhos ou especificações distintas, adicione-as aqui. Caso contrário, o próprio produto já é o item vendável.
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">
                  Grade de Variações ({variations.length})
                </span>
                <button
                  type="button"
                  id="btn-add-variation-row"
                  onClick={handleAddVariation}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Variação
                </button>
              </div>

              {variations.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-400 mb-2">Nenhuma variação adicionada.</p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Você pode avançar diretamente se este item for vendido em formato único.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddVariation}
                    className="text-xs text-slate-800 underline font-medium hover:text-slate-950"
                  >
                    + Criar primeira variação agora
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {variations.map((v, index) => (
                    <div
                      key={v.id}
                      className="p-3 border border-slate-200 rounded-xl bg-white shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-700">
                          Variação #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariation(index)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                          title="Remover linha"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">
                            Cor
                          </label>
                          <input
                            type="text"
                            value={v.color}
                            onChange={(e) => handleUpdateVariation(index, 'color', e.target.value)}
                            placeholder="Ex: Azul Escuro"
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">
                            Tamanho / Medida
                          </label>
                          <input
                            type="text"
                            value={v.size}
                            onChange={(e) => handleUpdateVariation(index, 'size', e.target.value)}
                            placeholder="Ex: 256GB / XL"
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">
                            SKU Próprio
                          </label>
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => handleUpdateVariation(index, 'sku', e.target.value)}
                            placeholder="Ex: PROD-BLU-256"
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">
                            Preço Adicional (Kz)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={v.additionalPrice || ''}
                            onChange={(e) => handleUpdateVariation(index, 'additionalPrice', Number(e.target.value))}
                            placeholder="0 Kz"
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PASSO 3: ESTOQUE INICIAL (OPCIONAL & AUDITADO) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Regra de Auditoria de Estoque
                </div>
                <p className="text-[11px] text-amber-800">
                  O saldo de estoque nunca é gravado estaticamente. Ao definir a quantidade inicial aqui, o sistema gerará automaticamente uma <strong>Movimentação de Entrada</strong> com a data de hoje e o seu utilizador como responsável, preservando a trilha de auditoria completa.
                </p>
                <p className="text-[11px] text-amber-800">
                  Você pode pular esta etapa se preferir deixar o produto com saldo zero até a primeira entrada física no armazém.
                </p>
              </div>

              <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Armazém ou Loja de Entrada
                  </label>
                  <select
                    id="select-initial-warehouse"
                    value={initialWarehouseId}
                    onChange={(e) => setInitialWarehouseId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.type === 'loja_fisica' ? 'Loja Física' : 'Armazém'}) - {w.address.split(',')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Quantidade Inicial
                    </label>
                    <input
                      type="number"
                      id="input-initial-quantity"
                      min="0"
                      value={initialQuantity}
                      onChange={(e) => setInitialQuantity(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0 (opcional)"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Gera movimento de entrada
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Limite Mínimo (Alerta)
                    </label>
                    <input
                      type="number"
                      id="input-min-limit"
                      min="0"
                      value={minLimit}
                      onChange={(e) => setMinLimit(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ex: 10"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Dispara alerta de reposição
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Limite Máximo
                    </label>
                    <input
                      type="number"
                      id="input-max-limit"
                      min="0"
                      value={maxLimit}
                      onChange={(e) => setMaxLimit(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ex: 100"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Evita excesso de capital
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Localização Física no Armazém (Opcional)
                  </label>
                  <input
                    type="text"
                    id="input-physical-location"
                    value={physicalLocation}
                    onChange={(e) => setPhysicalLocation(e.target.value)}
                    placeholder="Ex: Corredor B, Prateleira 4, Posição 2"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASSO 4: SUCESSO & OPÇÕES DE CONCLUSÃO */}
          {currentStep === 4 && createdProductResult && (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-semibold text-slate-900">
                  {createdProductResult.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  SKU: {createdProductResult.sku} • {createdProductResult.category}
                </p>
                <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto">
                  O produto foi inserido no catálogo com sucesso. Todas as configurações e movimentações associadas foram registradas no log de auditoria.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-add-another-product"
                  onClick={handleResetForAnother}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                >
                  + Cadastrar Outro Produto
                </button>

                <button
                  type="button"
                  id="btn-view-created-product"
                  onClick={() => {
                    onClose();
                    onViewProduct?.(createdProductResult.id);
                  }}
                  className="w-full sm:w-auto px-5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Ver Produto Cadastrado
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (for steps 1-3) */}
        {currentStep < 4 && (
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setCurrentStep((prev) => (prev - 1) as any);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Voltar
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
            )}

            <div className="flex items-center gap-2">
              {currentStep === 1 && (
                <button
                  type="button"
                  id="btn-step1-next"
                  onClick={handleProceedFromStep1}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                >
                  <span>Avançar para Variações</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentStep === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setValidationError(null);
                      setCurrentStep(3);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Pular Variações
                  </button>
                  <button
                    type="button"
                    id="btn-step2-next"
                    onClick={handleProceedFromStep2}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                  >
                    <span>Avançar para Estoque</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {currentStep === 3 && (
                <button
                  type="button"
                  id="btn-save-product-final"
                  onClick={handleFinalSubmit}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Salvar Produto</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* INLINE MODAL: Criar Nova Categoria */}
        {showNewCategoryModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xl max-w-sm w-full space-y-3">
              <h4 className="text-xs font-semibold text-slate-800">Nova Categoria</h4>
              <input
                type="text"
                autoFocus
                id="input-inline-category"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="Ex: Bebidas Alcoólicas, Ferramentas..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-save-inline-category"
                  onClick={handleSaveInlineCategory}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Salvar Categoria
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INLINE MODAL: Criar Novo Fornecedor */}
        {showNewSupplierModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xl max-w-md w-full space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-semibold text-slate-800">Cadastrar Novo Fornecedor</h4>
                <button
                  type="button"
                  onClick={() => setShowNewSupplierModal(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Nome da Empresa / Fornecedor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  id="input-inline-supplier-name"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Ex: Luanda Imports Lda"
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Contacto (Telefone / WhatsApp / Email)
                </label>
                <input
                  type="text"
                  id="input-inline-supplier-contact"
                  value={newSupplierContact}
                  onChange={(e) => setNewSupplierContact(e.target.value)}
                  placeholder="Ex: +244 923 000 111 • geral@fornecedor.ao"
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  id="input-inline-supplier-address"
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  placeholder="Ex: Viana Km 18, Luanda"
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  value={newSupplierNotes}
                  onChange={(e) => setNewSupplierNotes(e.target.value)}
                  placeholder="Prazo de pagamento, condições de frete..."
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewSupplierModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-save-inline-supplier"
                  onClick={handleSaveInlineSupplier}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ALERTA: Margem Negativa (Preço de Venda < Custo) */}
        {showMarginWarningModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="bg-white border border-amber-300 rounded-xl p-5 shadow-xl max-w-sm w-full space-y-3">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                Alerta de Margem Negativa
              </div>

              <p className="text-xs text-slate-600 leading-normal">
                O preço de venda (<strong>{formatKwanza(Number(salePrice))}</strong>) é menor do que o preço de custo (<strong>{formatKwanza(Number(costPrice))}</strong>).
              </p>
              <p className="text-xs text-slate-500 leading-normal">
                Isto resultará em margem negativa. Deseja prosseguir mesmo assim?
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMarginWarningModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Revisar Preços
                </button>
                <button
                  type="button"
                  id="btn-confirm-negative-margin"
                  onClick={() => {
                    setShowMarginWarningModal(false);
                    if (!sku.trim()) setSku(generateSKU(name, category));
                    setCurrentStep(2);
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
                >
                  Confirmar e Continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
