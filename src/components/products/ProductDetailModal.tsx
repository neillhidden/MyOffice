import React, { useState, useMemo } from 'react';
import {
  X,
  Package,
  Layers,
  Building,
  ArrowLeftRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Plus,
  Edit3,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { useWarehouseFilters } from '../../context/WarehouseFilterContext';
import { formatKwanza, formatDate, formatDateTime } from '../../utils/formatters';
import { Product } from '../../types/stock';

interface ProductDetailModalProps {
  productId: string | null;
  onClose: () => void;
  onOpenMovementModalForProduct?: (
    productId: string,
    warehouseId?: string,
    variationId?: string
  ) => void;
  onEditProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId,
  onClose,
  onOpenMovementModalForProduct,
  onEditProduct,
}) => {
  const {
    products,
    suppliers,
    warehouses,
    companies,
    stockConfigs,
    getCurrentStock,
    getProductStockInfo,
    getProductMovements,
    getProductWarehouses,
    getProductCompanies,
    updateStockLimits,
  } = useStock();

  const { selectedWarehouseIds } = useWarehouseFilters();

  const [activeTab, setActiveTab] = useState<'geral' | 'armazens' | 'historico' | 'variacoes'>('geral');
  const [editingLimitWarehouseId, setEditingLimitWarehouseId] = useState<string | null>(null);
  const [newMinLimit, setNewMinLimit] = useState<number>(0);
  const [newMaxLimit, setNewMaxLimit] = useState<number>(0);
  const [newLocation, setNewLocation] = useState<string>('');

  const product = products.find((p) => p.id === productId);

  const prodWarehouses = useMemo(() => {
    return product ? getProductWarehouses(product.id) : [];
  }, [product, getProductWarehouses]);

  const productCompanies = useMemo(() => {
    return product ? getProductCompanies(product.id) : [];
  }, [product, getProductCompanies]);

  const isStoppedCompany = useMemo(() => {
    if (productCompanies.length > 0) {
      return productCompanies.every((c) => c.status === 'parada');
    }
    return false;
  }, [productCompanies]);

  // Contextual warehouse:
  // 1. If currently filtering a single warehouse in the warehouse view and product is associated with it
  // 2. Or the first warehouse where this product is registered
  // 3. Or the first warehouse in the system
  const contextWarehouseId = useMemo(() => {
    if (
      selectedWarehouseIds &&
      selectedWarehouseIds.length === 1 &&
      prodWarehouses.some((w) => w.id === selectedWarehouseIds[0])
    ) {
      return selectedWarehouseIds[0];
    }
    if (prodWarehouses.length > 0) {
      return prodWarehouses[0].id;
    }
    return warehouses[0]?.id ?? '';
  }, [selectedWarehouseIds, prodWarehouses, warehouses]);

  if (!productId || !product) return null;

  const supplier = suppliers.find((s) => s.id === product.supplierId);
  const generalStock = getProductStockInfo(product.id);
  const productMovements = getProductMovements(product.id);

  const profitValue = product.salePrice - product.costPrice;
  const profitMarginPercent = product.salePrice > 0 ? (profitValue / product.salePrice) * 100 : 0;

  const handleStartEditLimits = (warehouseId: string) => {
    const config = stockConfigs.find(
      (c) => c.productId === product.id && c.warehouseId === warehouseId
    );
    setEditingLimitWarehouseId(warehouseId);
    setNewMinLimit(config?.minLimit || 0);
    setNewMaxLimit(config?.maxLimit || 0);
    setNewLocation(config?.physicalLocation || '');
  };

  const handleSaveLimits = (warehouseId: string) => {
    updateStockLimits(product.id, warehouseId, newMinLimit, newMaxLimit, newLocation);
    setEditingLimitWarehouseId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden my-6 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Stopped Company Warning Banner */}
        {isStoppedCompany && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Empresa parada — serviços indisponíveis:</strong> Esta empresa está temporariamente com as suas operações, movimentações e edição bloqueadas.
            </span>
          </div>
        )}

        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shrink-0 shadow-xs">
              <img
                src={product.mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {product.category}{product.subcategory ? ` / ${product.subcategory}` : ''}
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  SKU: {product.sku}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {product.condition === 'novo'
                    ? 'Novo'
                    : product.condition === 'novo_usado'
                    ? 'Novo e usado'
                    : product.condition === 'usado'
                    ? 'Usado'
                    : product.condition === 'troca'
                    ? 'Troca'
                    : 'Novo'}
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    product.status === 'ativo'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {product.status.toUpperCase()}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {product.name}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Marca: <strong className="text-slate-600 dark:text-slate-300">{product.brand}</strong> • Registado em {formatDate(product.createdAt)} por {product.createdBy}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditProduct && (
              <button
                type="button"
                id="btn-product-detail-edit"
                disabled={isStoppedCompany}
                onClick={() => {
                  if (!isStoppedCompany) {
                    onClose();
                    onEditProduct(product);
                  }
                }}
                className={`p-1.5 border rounded-lg transition-colors shadow-2xs inline-flex items-center justify-center cursor-pointer ${
                  isStoppedCompany
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
                title={isStoppedCompany ? 'Empresa parada — serviços indisponíveis' : 'Editar produto'}
                aria-label="Editar produto"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              id="btn-product-detail-move"
              disabled={isStoppedCompany}
              onClick={() => {
                if (!isStoppedCompany) {
                  onClose();
                  onOpenMovementModalForProduct?.(product.id, contextWarehouseId);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-xs ${
                isStoppedCompany
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 cursor-pointer'
              }`}
              title={isStoppedCompany ? 'Empresa parada — serviços indisponíveis' : 'Registar Movimentação'}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Movimentar</span>
            </button>
            <button
              type="button"
              id="btn-close-product-detail-modal"
              onClick={onClose}
              aria-label="Fechar"
              title="Fechar"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="p-4 border-r border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
              Estoque Atual Total
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {generalStock.currentStock}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{product.unitOfMeasure}</span>
            </div>
            <div className="mt-1">
              {generalStock.status === 'critico_baixo' && (
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                  Abaixo do limite mínimo ({generalStock.minLimit})
                </span>
              )}
              {generalStock.status === 'normal' && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                  Normal (Mín: {generalStock.minLimit})
                </span>
              )}
              {generalStock.status === 'excesso' && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                  Excesso de estoque
                </span>
              )}
              {generalStock.status === 'zerado' && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  Sem estoque
                </span>
              )}
            </div>
          </div>

          <div className="p-4 border-r border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
              Preço de Custo
            </span>
            <div className="text-base font-semibold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
              {formatKwanza(product.costPrice)}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
              Valor unitário de compra
            </span>
          </div>

          <div className="p-4 border-r border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
              Preço de Venda
            </span>
            <div className="text-base font-semibold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
              {formatKwanza(product.salePrice)}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
              Valor de venda ao cliente
            </span>
          </div>

          <div className="p-4">
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
              Margem Bruta
            </span>
            <div className="text-base font-semibold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {profitMarginPercent.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
              Lucro: {formatKwanza(profitValue)}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-6 text-xs font-medium bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'geral'
                ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Visão Geral
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('armazens')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'armazens'
                ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Estoque por Armazém</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
              {prodWarehouses.length}
            </span>
          </button>

          {product.variations.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('variacoes')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'variacoes'
                  ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Variações</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                {product.variations.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'historico'
                ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Histórico de Auditoria</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
              {productMovements.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto bg-white dark:bg-slate-900">
          {/* TAB 1: GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Descrição</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {product.description || 'Sem descrição registada.'}
                </p>
              </div>

              {/* Fornecedor */}
              <div className="p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Fornecedor Vinculado
                </span>
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      {supplier?.name || 'Fornecedor não identificado'}
                    </h5>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {supplier?.contact} • {supplier?.address}
                    </p>
                    {supplier?.notes && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-1">
                        Obs: {supplier.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Galeria de Fotos */}
              {product.gallery.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Galeria de Imagens</h4>
                  <div className="flex gap-2">
                    {product.gallery.map((img, idx) => (
                      <div
                        key={idx}
                        className="w-16 h-16 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0"
                      >
                        <img
                          src={img}
                          alt={`${product.name} ${idx}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ESTOQUE POR ARMAZÉM */}
          {activeTab === 'armazens' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Apresenta apenas os armazéns vinculados a este produto. O saldo é apurado pelo histórico de movimentações.
              </div>

              {prodWarehouses.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-3">
                  <Building className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nenhum armazém vinculado a este produto
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Este produto não possui vínculo de estoque configurado em nenhum armazém. Edite o produto para selecionar os armazéns onde ele deve estar disponível.
                  </p>
                  {onEditProduct && (
                    <button
                      type="button"
                      disabled={isStoppedCompany}
                      onClick={() => {
                        if (!isStoppedCompany) {
                          onClose();
                          onEditProduct(product);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isStoppedCompany
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                          : 'bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 cursor-pointer'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Armazéns Vinculados</span>
                    </button>
                  )}
                </div>
              ) : (
                prodWarehouses.map((w) => {
                  const comp = companies.find((c) => c.id === w.companyId);
                  const isWhStopped = comp?.status === 'parada';
                  const whStock = getCurrentStock(product.id, w.id);
                  const config = stockConfigs.find(
                    (c) => c.productId === product.id && c.warehouseId === w.id
                  );
                  const isEditing = editingLimitWarehouseId === w.id;
                  const min = config?.minLimit ?? 0;
                  const max = config?.maxLimit ?? 0;

                  const isBelowMin = min > 0 && whStock < min;
                  const isAboveMax = max > 0 && whStock > max;

                  return (
                    <div
                      key={w.id}
                      className={`p-3.5 border rounded-xl shadow-xs space-y-2 ${
                        isWhStopped
                          ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{w.name}</h5>
                              {comp && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium border border-blue-100 dark:border-blue-900/60">
                                  {comp.name}
                                </span>
                              )}
                              {isWhStopped && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  Parada
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              {w.type === 'loja_fisica' ? 'Loja Física' : 'Armazém'} • {w.address}
                            </span>
                          </div>
                        </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 dark:text-slate-500 block">Saldo Atual:</span>
                        <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                          {whStock} {product.unitOfMeasure}
                        </span>
                      </div>
                    </div>

                    {/* Alert tags */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                      {isBelowMin && (
                        <span className="text-[10px] font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Abaixo do limite mínimo ({min})
                        </span>
                      )}
                      {isAboveMax && (
                        <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                          Excesso de estoque ({max})
                        </span>
                      )}
                      {!isBelowMin && !isAboveMax && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Limites: Mín {min} | Máx {max}
                        </span>
                      )}

                      {config?.physicalLocation && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono ml-auto">
                          📍 {config.physicalLocation}
                        </span>
                      )}

                      {!isEditing ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            disabled={isWhStopped}
                            onClick={() => {
                              if (!isWhStopped) {
                                onClose();
                                onOpenMovementModalForProduct?.(product.id, w.id);
                              }
                            }}
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                              isWhStopped
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer'
                            }`}
                            title={isWhStopped ? 'Empresa parada — serviços indisponíveis' : `Movimentar em ${w.name}`}
                          >
                            <ArrowLeftRight className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            <span>Movimentar</span>
                          </button>
                          <button
                            type="button"
                            disabled={isWhStopped}
                            onClick={() => {
                              if (!isWhStopped) handleStartEditLimits(w.id);
                            }}
                            className={`text-[11px] font-medium ${
                              isWhStopped
                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline cursor-pointer'
                            }`}
                            title={isWhStopped ? 'Empresa parada — serviços indisponíveis' : undefined}
                          >
                            Configurar Limites
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {/* Inline edit limits */}
                    {isEditing && (
                      <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                            Mínimo
                          </label>
                          <input
                            type="number"
                            value={newMinLimit}
                            onChange={(e) => setNewMinLimit(Number(e.target.value))}
                            className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-mono text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                            Máximo
                          </label>
                          <input
                            type="number"
                            value={newMaxLimit}
                            onChange={(e) => setNewMaxLimit(Number(e.target.value))}
                            className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-mono text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                            Localização Física
                          </label>
                          <input
                            type="text"
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            placeholder="Ex: Corredor A"
                            className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveLimits(w.id)}
                            className="px-3 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded font-medium hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer"
                          >
                            Guardar alterações
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLimitWarehouseId(null)}
                            className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
          )}

          {/* TAB 3: VARIAÇÕES */}
          {activeTab === 'variacoes' && (
            <div className="space-y-2">
              {product.variations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Este produto não possui variações registadas.
                </div>
              ) : (
                product.variations.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {v.colorHex ? (
                        <div
                          className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shadow-2xs shrink-0"
                          style={{ backgroundColor: v.colorHex }}
                          title={v.color}
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>{v.color || 'Cor padrão'}</span>
                          {v.size && <span className="text-slate-500 dark:text-slate-400 font-normal">• {v.size}</span>}
                          {typeof v.quantity === 'number' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-medium">
                              Qtd: {v.quantity}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                          SKU: {v.sku}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      <div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Preço Final:</span>
                        <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                          {formatKwanza(product.salePrice + v.additionalPrice)}
                        </span>
                        {v.additionalPrice > 0 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                            (+{formatKwanza(v.additionalPrice)})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={isStoppedCompany}
                        onClick={() => {
                          if (!isStoppedCompany) {
                            onClose();
                            onOpenMovementModalForProduct?.(product.id, contextWarehouseId, v.id);
                          }
                        }}
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                          isStoppedCompany
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer'
                        }`}
                        title={isStoppedCompany ? 'Empresa parada — serviços indisponíveis' : 'Movimentar variação'}
                      >
                        <ArrowLeftRight className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        <span>Movimentar Variação</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: HISTÓRICO DE AUDITORIA */}
          {activeTab === 'historico' && (
            <div className="space-y-2.5">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-500 dark:text-slate-400">
                Registos imutáveis de entradas, saídas, transferências e ajustes para este item.
              </div>

              {productMovements.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                  Nenhuma movimentação registada para este produto.
                </p>
              ) : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {productMovements.map((m) => {
                    const wh = warehouses.find((w) => w.id === m.warehouseId);
                    const destWh = m.destinationWarehouseId
                      ? warehouses.find((w) => w.id === m.destinationWarehouseId)
                      : null;

                    return (
                      <div key={m.id} className="p-3 bg-white dark:bg-slate-800/80 hover:bg-slate-50/70 dark:hover:bg-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                                m.type === 'entrada'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                  : m.type === 'saida'
                                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                                  : m.type === 'transferencia'
                                  ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
                                  : m.type === 'defeituoso'
                                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {m.type}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                              {m.type === 'saida' || m.type === 'defeituoso' ? '-' : '+'}
                              {m.quantity} {product.unitOfMeasure}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            {formatDateTime(m.date)}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>
                            Armazém: <strong className="text-slate-700 dark:text-slate-300">{wh?.name || 'Geral'}</strong>
                            {destWh && ` → Destino: ${destWh.name}`}
                          </span>
                          <span>•</span>
                          <span>Responsável: {m.responsible}</span>
                          {m.reference && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-600 dark:text-slate-400">Ref: {m.reference}</span>
                            </>
                          )}
                        </div>

                        {m.reason && (
                          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 italic">
                            Motivo: "{m.reason}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
