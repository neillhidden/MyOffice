import React, { useState } from 'react';
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
import { formatKwanza, formatDate, formatDateTime } from '../../utils/formatters';
import { Product } from '../../types/stock';

interface ProductDetailModalProps {
  productId: string | null;
  onClose: () => void;
  onOpenMovementModalForProduct?: (productId: string) => void;
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
    stockConfigs,
    getCurrentStock,
    getProductStockInfo,
    getProductMovements,
    updateStockLimits,
  } = useStock();

  const [activeTab, setActiveTab] = useState<'geral' | 'armazens' | 'historico' | 'variacoes'>('geral');
  const [editingLimitWarehouseId, setEditingLimitWarehouseId] = useState<string | null>(null);
  const [newMinLimit, setNewMinLimit] = useState<number>(0);
  const [newMaxLimit, setNewMaxLimit] = useState<number>(0);
  const [newLocation, setNewLocation] = useState<string>('');

  if (!productId) return null;
  const product = products.find((p) => p.id === productId);
  if (!product) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden my-6 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 shadow-xs">
              <img
                src={product.mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {product.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  SKU: {product.sku}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
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
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {product.status.toUpperCase()}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-1">
                {product.name}
              </h3>
              <p className="text-xs text-slate-400">
                Marca: <strong className="text-slate-600">{product.brand}</strong> • Cadastrado em {formatDate(product.createdAt)} por {product.createdBy}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditProduct && (
              <button
                type="button"
                id="btn-product-detail-edit"
                onClick={() => {
                  onClose();
                  onEditProduct(product);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Editar</span>
              </button>
            )}

            <button
              type="button"
              id="btn-product-detail-move"
              onClick={() => {
                onClose();
                onOpenMovementModalForProduct?.(product.id);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Movimentar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100 bg-white">
          <div className="p-4 border-r border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Estoque Atual Total
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 font-mono">
                {generalStock.currentStock}
              </span>
              <span className="text-xs text-slate-500">{product.unitOfMeasure}</span>
            </div>
            <div className="mt-1">
              {generalStock.status === 'critico_baixo' && (
                <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                  Abaixo do Mínimo ({generalStock.minLimit})
                </span>
              )}
              {generalStock.status === 'normal' && (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Normal (Mín: {generalStock.minLimit})
                </span>
              )}
              {generalStock.status === 'excesso' && (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  Excesso de Estoque
                </span>
              )}
              {generalStock.status === 'zerado' && (
                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  Estoque Zerado
                </span>
              )}
            </div>
          </div>

          <div className="p-4 border-r border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Preço de Custo
            </span>
            <div className="text-base font-semibold text-slate-800 font-mono mt-0.5">
              {formatKwanza(product.costPrice)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Valor unitário de compra
            </span>
          </div>

          <div className="p-4 border-r border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Preço de Venda
            </span>
            <div className="text-base font-semibold text-slate-800 font-mono mt-0.5">
              {formatKwanza(product.salePrice)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Valor de venda ao cliente
            </span>
          </div>

          <div className="p-4">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Margem Bruta
            </span>
            <div className="text-base font-semibold text-emerald-600 font-mono mt-0.5">
              {profitMarginPercent.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Lucro: {formatKwanza(profitValue)}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-100 flex items-center gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'geral'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Visão Geral
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('armazens')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'armazens'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Estoque por Armazém</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
              {warehouses.length}
            </span>
          </button>

          {product.variations.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('variacoes')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'variacoes'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Variações</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                {product.variations.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'historico'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Histórico de Auditoria</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
              {productMovements.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {/* TAB 1: GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Descrição</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {product.description || 'Sem descrição cadastrada.'}
                </p>
              </div>

              {/* Fornecedor */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Fornecedor Vinculado
                </span>
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-semibold text-slate-800 text-xs">
                      {supplier?.name || 'Fornecedor não identificado'}
                    </h5>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {supplier?.contact} • {supplier?.address}
                    </p>
                    {supplier?.notes && (
                      <p className="text-[10px] text-slate-400 italic mt-1">
                        Obs: {supplier.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Galeria de Fotos */}
              {product.gallery.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Galeria de Imagens</h4>
                  <div className="flex gap-2">
                    {product.gallery.map((img, idx) => (
                      <div
                        key={idx}
                        className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden shrink-0"
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
              <div className="text-xs text-slate-500 mb-2">
                A quantidade em cada armazém é rigorosamente apurada pela soma de suas movimentações.
              </div>

              {warehouses.map((w) => {
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
                    className="p-3.5 border border-slate-200 rounded-xl bg-white shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" />
                        <div>
                          <h5 className="text-xs font-semibold text-slate-800">{w.name}</h5>
                          <span className="text-[11px] text-slate-400">
                            {w.type === 'loja_fisica' ? 'Loja Física' : 'Armazém'} • {w.address}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Saldo Atual:</span>
                        <span className="text-base font-bold font-mono text-slate-900">
                          {whStock} {product.unitOfMeasure}
                        </span>
                      </div>
                    </div>

                    {/* Alert tags */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                      {isBelowMin && (
                        <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Abaixo do limite mínimo ({min})
                        </span>
                      )}
                      {isAboveMax && (
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          Acima do limite máximo ({max})
                        </span>
                      )}
                      {!isBelowMin && !isAboveMax && (
                        <span className="text-[10px] text-slate-500">
                          Limites: Mín {min} | Máx {max}
                        </span>
                      )}

                      {config?.physicalLocation && (
                        <span className="text-[10px] text-slate-400 font-mono ml-auto">
                          📍 {config.physicalLocation}
                        </span>
                      )}

                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleStartEditLimits(w.id)}
                          className="text-[11px] text-slate-600 hover:text-slate-900 font-medium ml-2 underline"
                        >
                          Configurar Limites
                        </button>
                      ) : null}
                    </div>

                    {/* Inline edit limits */}
                    {isEditing && (
                      <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">
                            Mínimo
                          </label>
                          <input
                            type="number"
                            value={newMinLimit}
                            onChange={(e) => setNewMinLimit(Number(e.target.value))}
                            className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">
                            Máximo
                          </label>
                          <input
                            type="number"
                            value={newMaxLimit}
                            onChange={(e) => setNewMaxLimit(Number(e.target.value))}
                            className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">
                            Localização Física
                          </label>
                          <input
                            type="text"
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            placeholder="Ex: Corredor A"
                            className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveLimits(w.id)}
                            className="px-3 py-1 bg-slate-900 text-white text-xs rounded font-medium"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLimitWarehouseId(null)}
                            className="px-2 py-1 text-xs text-slate-600"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: VARIAÇÕES */}
          {activeTab === 'variacoes' && (
            <div className="space-y-2">
              {product.variations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Este produto não possui variações registradas.
                </div>
              ) : (
                product.variations.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 border border-slate-200 rounded-xl bg-white flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {v.colorHex ? (
                        <div
                          className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                          style={{ backgroundColor: v.colorHex }}
                          title={v.color}
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          <span>{v.color || 'Cor padrão'}</span>
                          {v.size && <span className="text-slate-500 font-normal">• {v.size}</span>}
                          {typeof v.quantity === 'number' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-medium">
                              Qtd: {v.quantity}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          SKU: {v.sku}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Preço Final:</span>
                      <span className="font-semibold font-mono text-slate-800">
                        {formatKwanza(product.salePrice + v.additionalPrice)}
                      </span>
                      {v.additionalPrice > 0 && (
                        <span className="text-[10px] text-emerald-600 block">
                          (+{formatKwanza(v.additionalPrice)})
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: HISTÓRICO DE AUDITORIA */}
          {activeTab === 'historico' && (
            <div className="space-y-2.5">
              <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-500">
                Registros imutáveis de entradas, saídas, transferências e ajustes para este item.
              </div>

              {productMovements.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Nenhuma movimentação registrada para este produto.
                </p>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {productMovements.map((m) => {
                    const wh = warehouses.find((w) => w.id === m.warehouseId);
                    const destWh = m.destinationWarehouseId
                      ? warehouses.find((w) => w.id === m.destinationWarehouseId)
                      : null;

                    return (
                      <div key={m.id} className="p-3 bg-white hover:bg-slate-50/70 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                                m.type === 'entrada'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : m.type === 'saida'
                                  ? 'bg-blue-50 text-blue-700'
                                  : m.type === 'transferencia'
                                  ? 'bg-purple-50 text-purple-700'
                                  : m.type === 'defeituoso'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {m.type}
                            </span>
                            <span className="font-semibold text-slate-800 font-mono">
                              {m.type === 'saida' || m.type === 'defeituoso' ? '-' : '+'}
                              {m.quantity} {product.unitOfMeasure}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatDateTime(m.date)}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                          <span>
                            Armazém: <strong>{wh?.name || 'Geral'}</strong>
                            {destWh && ` → Destino: ${destWh.name}`}
                          </span>
                          <span>•</span>
                          <span>Responsável: {m.responsible}</span>
                          {m.reference && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-600">Ref: {m.reference}</span>
                            </>
                          )}
                        </div>

                        {m.reason && (
                          <div className="mt-1 text-[11px] text-slate-600 italic">
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
