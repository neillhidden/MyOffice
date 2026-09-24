import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeftRight,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { MovementType } from '../../types/stock';

interface MovementCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedProductId?: string | null;
  preSelectedWarehouseId?: string | null;
  preSelectedVariationId?: string | null;
}

export const MovementCreateModal: React.FC<MovementCreateModalProps> = ({
  isOpen,
  onClose,
  preSelectedProductId,
  preSelectedWarehouseId,
  preSelectedVariationId,
}) => {
  const {
    products,
    warehouses,
    companies,
    banks,
    recordMovement,
    getCurrentStock,
    getProductWarehouses,
  } = useStock();

  const isProductLocked = Boolean(preSelectedProductId);

  // Rules 1 & 7: No default operation selection, no preselected fields
  const [productId, setProductId] = useState<string>('');
  const [variationId, setVariationId] = useState<string>('');
  const [type, setType] = useState<MovementType | ''>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Saída financeira automática (opcional para entradas)
  const [generateFinancialExit, setGenerateFinancialExit] = useState<boolean>(false);
  const [financialBankId, setFinancialBankId] = useState<string>('');
  const [financialAmount, setFinancialAmount] = useState<number | ''>('');
  const [financialNotes, setFinancialNotes] = useState<string>('');

  // Rules 7 & 9: Clean state on modal open
  useEffect(() => {
    if (!isOpen) return;

    setProductId(preSelectedProductId || '');
    setVariationId(preSelectedVariationId || '');
    setWarehouseId(preSelectedWarehouseId || '');
    setDestinationWarehouseId('');
    setQuantity('');
    setReason('');
    setReference('');
    setResponsible('');
    setType('');
    setGenerateFinancialExit(false);
    setFinancialBankId('');
    setFinancialAmount('');
    setFinancialNotes('');
    setErrors({});
  }, [
    isOpen,
    preSelectedProductId,
    preSelectedWarehouseId,
    preSelectedVariationId,
  ]);

  if (!isOpen) return null;

  // Operational warehouses excluding disabled companies
  const activeAndStoppedWarehouses = warehouses.filter((w) => {
    const comp = companies.find((c) => c.id === w.companyId);
    return comp?.status !== 'desativada';
  });

  const operationalProducts = products.filter((p) => {
    const prodWhs = getProductWarehouses(p.id);
    return prodWhs.length > 0;
  });

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedVariation = selectedProduct?.variations.find((v) => v.id === variationId);

  // Associated warehouses for the selected product (already excludes disabled companies)
  const associatedWarehouses = selectedProduct
    ? getProductWarehouses(selectedProduct.id)
    : [];

  const otherWarehouses = activeAndStoppedWarehouses.filter(
    (w) => !associatedWarehouses.some((aw) => aw.id === w.id)
  );

  const currentAvailableStock = selectedProduct && warehouseId
    ? getCurrentStock(selectedProduct.id, warehouseId, variationId || undefined)
    : 0;

  const handleWarehouseChange = (newWhId: string) => {
    setWarehouseId(newWhId);
    if (errors.warehouseId) setErrors((prev) => ({ ...prev, warehouseId: '' }));

    if (destinationWarehouseId === newWhId) {
      setDestinationWarehouseId('');
    }
    // Sugerir conta principal da empresa do armazém selecionado
    const wh = warehouses.find((w) => w.id === newWhId);
    const comp = companies.find((c) => c.id === wh?.companyId);
    if (comp?.principalBankId && !financialBankId) {
      setFinancialBankId(comp.principalBankId);
    }
  };

  const handleTypeChange = (newType: MovementType) => {
    setType(newType);
    if (errors.type) setErrors((prev) => ({ ...prev, type: '' }));
  };

  const availableDestinations = activeAndStoppedWarehouses.filter((w) => w.id !== warehouseId);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!type) {
      errs.type = 'Selecione o tipo de movimentação.';
    }

    if (!selectedProduct) {
      errs.productId = 'Selecione um produto.';
    }

    if (!warehouseId) {
      errs.warehouseId = type === 'transferencia' ? 'Selecione o armazém de origem.' : 'Selecione o armazém.';
    } else {
      const wh = warehouses.find((w) => w.id === warehouseId);
      const comp = companies.find((c) => c.id === wh?.companyId);
      if (comp?.status === 'parada') {
        errs.warehouseId = `O armazém ${wh?.name} pertence à empresa ${comp?.name}, que está atualmente Parada. Operações bloqueadas.`;
      }
    }

    if (type === 'transferencia') {
      if (!destinationWarehouseId) {
        errs.destinationWarehouseId = 'Selecione o armazém de destino.';
      } else if (destinationWarehouseId === warehouseId) {
        errs.destinationWarehouseId = 'O armazém de destino deve ser diferente da origem.';
      } else {
        const destWh = warehouses.find((w) => w.id === destinationWarehouseId);
        const destComp = companies.find((c) => c.id === destWh?.companyId);
        if (destComp?.status === 'parada') {
          errs.destinationWarehouseId = `O armazém de destino ${destWh?.name} pertence à empresa ${destComp?.name}, que está Parada. Operações bloqueadas.`;
        }
      }
    }

    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      errs.quantity = 'Informe uma quantidade válida superior a zero.';
    } else if (selectedProduct && (type === 'saida' || type === 'transferencia' || type === 'defeituoso')) {
      if (qty > currentAvailableStock) {
        errs.quantity = `Saldo insuficiente. O saldo disponível neste armazém é de ${currentAvailableStock} ${selectedProduct.unitOfMeasure}.`;
      }
    }

    if (!reason.trim()) {
      errs.reason = 'Informe o motivo ou observação de auditoria.';
    }

    if (type === 'entrada' && generateFinancialExit) {
      if (!financialBankId) {
        errs.financialBankId = 'Selecione a conta financeira para debitar a saída.';
      }
      const finAmt = Number(financialAmount);
      if (!financialAmount || isNaN(finAmt) || finAmt <= 0) {
        errs.financialAmount = 'Informe o valor total da compra para a saída financeira.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !type || !selectedProduct) return;

    const qty = Number(quantity);

    recordMovement(
      {
        productId: selectedProduct.id,
        variationId: variationId || undefined,
        warehouseId,
        destinationWarehouseId: type === 'transferencia' ? destinationWarehouseId : undefined,
        type,
        quantity: qty,
        responsible: responsible.trim() || 'Administrador MyOffice',
        reason: reason.trim(),
        reference: reference.trim() || undefined,
      },
      type === 'entrada' && generateFinancialExit && Number(financialAmount) > 0 && financialBankId
        ? {
            bankId: financialBankId,
            amount: Number(financialAmount),
            notes: financialNotes.trim() || undefined,
          }
        : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-6 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center shadow-xs">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {isProductLocked ? 'Movimentar Produto' : 'Registar Movimentação de Estoque'}
                </h3>
                {isProductLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded">
                    <Lock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                    Contexto Específico
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {isProductLocked
                  ? 'Produto e armazém vinculados a partir da ficha do item'
                  : 'Operação geral com recálculo automático de saldo contabilístico'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-movement-modal"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Tipo de Movimento (Sem seleção por defeito - Regra 1) */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Movimentação <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'entrada', label: 'Entrada', desc: '+ Saldo' },
                  { id: 'saida', label: 'Saída', desc: '- Saldo' },
                  { id: 'transferencia', label: 'Transferência', desc: 'Origem ➔ Destino' },
                  { id: 'ajuste', label: 'Ajuste', desc: 'Retificação' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  id={`btn-mov-type-${item.id}`}
                  onClick={() => handleTypeChange(item.id)}
                  className={`py-2 px-2 text-center rounded-lg border transition-all cursor-pointer ${
                    type === item.id
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs capitalize">{item.label}</div>
                  <div
                    className={`text-[10px] ${
                      type === item.id
                        ? 'text-slate-300 dark:text-slate-600'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
            {errors.type && (
              <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.type}</span>
              </p>
            )}
          </div>

          {/* Produto (Travado se aberto a partir do detalhe do produto) */}
          {isProductLocked && selectedProduct ? (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Produto Vinculado
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md shadow-2xs">
                  <Lock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  Fixado
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  {selectedProduct.mainImage ? (
                    <img
                      src={selectedProduct.mainImage}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-400">
                      {selectedProduct.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {selectedProduct.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    SKU: {selectedProduct.sku} • {selectedProduct.category}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="select-movement-product" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Produto <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-movement-product"
                value={productId}
                onChange={(e) => {
                  const newProdId = e.target.value;
                  setProductId(newProdId);
                  setVariationId('');
                  if (errors.productId) setErrors((prev) => ({ ...prev, productId: '' }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100 ${
                  errors.productId
                    ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                    : 'border-slate-300 dark:border-slate-700 focus:border-slate-800 dark:focus:border-slate-500'
                }`}
              >
                <option value="">Selecione o produto...</option>
                {operationalProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku})
                  </option>
                ))}
              </select>
              {errors.productId && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.productId}</span>
                </p>
              )}
            </div>
          )}

          {/* Variação (se houver) */}
          {selectedProduct && selectedProduct.variations.length > 0 && (
            <div>
              <label htmlFor="select-movement-variation" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Variação
              </label>
              {isProductLocked && preSelectedVariationId && selectedVariation ? (
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedVariation.color || ''} {selectedVariation.size ? `• ${selectedVariation.size}` : ''} (SKU: {selectedVariation.sku})
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded shadow-2xs">
                    <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    Variação Bloqueada
                  </span>
                </div>
              ) : (
                <select
                  id="select-movement-variation"
                  value={variationId}
                  onChange={(e) => setVariationId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                >
                  <option value="">Todas as variações / Produto base</option>
                  {selectedProduct.variations.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.color || ''} {v.size ? `• ${v.size}` : ''} (SKU: {v.sku})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Armazém de Origem e Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="select-movement-warehouse" className="font-medium text-slate-700 dark:text-slate-300">
                  {type === 'transferencia' ? 'Armazém de Origem' : 'Armazém'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
              </div>

              <select
                id="select-movement-warehouse"
                value={warehouseId}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>optgroup]:bg-white dark:[&>optgroup]:bg-slate-800 dark:[&>optgroup]:text-slate-300 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100 ${
                  errors.warehouseId
                    ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                    : 'border-slate-300 dark:border-slate-700 focus:border-slate-800 dark:focus:border-slate-500'
                }`}
              >
                <option value="">Selecione o armazém...</option>
                {isProductLocked && associatedWarehouses.length > 0 ? (
                  <>
                    <optgroup label="Armazéns com registo deste produto">
                      {associatedWarehouses.map((w) => {
                        const comp = companies.find((c) => c.id === w.companyId);
                        const isParada = comp?.status === 'parada';
                        const stock = selectedProduct
                          ? getCurrentStock(selectedProduct.id, w.id, variationId || undefined)
                          : 0;
                        return (
                          <option key={w.id} value={w.id} disabled={isParada}>
                            {w.name} {isParada ? '(Parada — Bloqueado)' : `— Saldo: ${stock} ${selectedProduct?.unitOfMeasure}`}
                          </option>
                        );
                      })}
                    </optgroup>
                    {otherWarehouses.length > 0 && (
                      <optgroup label="Outros armazéns">
                        {otherWarehouses.map((w) => {
                          const comp = companies.find((c) => c.id === w.companyId);
                          const isParada = comp?.status === 'parada';
                          return (
                            <option key={w.id} value={w.id} disabled={isParada}>
                              {w.name} {isParada ? '(Parada — Bloqueado)' : '(Sem saldo registado)'}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </>
                ) : (
                  activeAndStoppedWarehouses.map((w) => {
                    const comp = companies.find((c) => c.id === w.companyId);
                    const isParada = comp?.status === 'parada';
                    const stock = selectedProduct
                      ? getCurrentStock(selectedProduct.id, w.id, variationId || undefined)
                      : 0;
                    return (
                      <option key={w.id} value={w.id} disabled={isParada}>
                        {w.name} {isParada ? '(Parada — Bloqueado)' : selectedProduct ? `(Saldo: ${stock} ${selectedProduct.unitOfMeasure})` : ''}
                      </option>
                    );
                  })
                )}
              </select>
              {errors.warehouseId && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.warehouseId}</span>
                </p>
              )}

              {selectedProduct && warehouseId && (
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Saldo disponível neste local:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {currentAvailableStock} {selectedProduct?.unitOfMeasure || 'un'}
                  </span>
                </div>
              )}
            </div>

            {type === 'transferencia' && (
              <div>
                <label htmlFor="select-movement-destination-warehouse" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Armazém de Destino <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-movement-destination-warehouse"
                  value={destinationWarehouseId}
                  onChange={(e) => {
                    setDestinationWarehouseId(e.target.value);
                    if (errors.destinationWarehouseId) setErrors((prev) => ({ ...prev, destinationWarehouseId: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100 ${
                    errors.destinationWarehouseId
                      ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                      : 'border-slate-300 dark:border-slate-700 focus:border-slate-800 dark:focus:border-slate-500'
                  }`}
                >
                  <option value="">Selecione o armazém de destino...</option>
                  {availableDestinations.map((w) => {
                    const comp = companies.find((c) => c.id === w.companyId);
                    const isParada = comp?.status === 'parada';
                    return (
                      <option key={w.id} value={w.id} disabled={isParada}>
                        {w.name} {isParada ? '(Parada — Bloqueado)' : ''}
                      </option>
                    );
                  })}
                </select>
                {errors.destinationWarehouseId && (
                  <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.destinationWarehouseId}</span>
                  </p>
                )}
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                  Livre para transferir para qualquer outro armazém da rede.
                </span>
              </div>
            )}
          </div>

          {/* Quantidade e Referência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-movement-quantity" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Quantidade <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  id="input-movement-quantity"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value ? Number(e.target.value) : '');
                    if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
                  }}
                  placeholder="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${
                    errors.quantity
                      ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                      : 'border-slate-300 dark:border-slate-700 focus:border-slate-800 dark:focus:border-slate-500'
                  }`}
                />
                <span className="absolute right-3 top-2 text-slate-400 dark:text-slate-500 font-medium text-[11px]">
                  {selectedProduct?.unitOfMeasure || 'un'}
                </span>
              </div>
              {errors.quantity && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.quantity}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="input-movement-reference" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Documento / Referência <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                id="input-movement-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: Fatura #1029, Guia GT-40"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Saída Financeira Automática (Apenas para Entradas / Compras) */}
          {type === 'entrada' && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="chk-movement-financial-exit"
                  checked={generateFinancialExit}
                  onChange={(e) => setGenerateFinancialExit(e.target.checked)}
                  aria-label="Gerar saída financeira automática"
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-600 text-slate-900 focus:ring-slate-900 accent-slate-900 dark:accent-slate-100"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Gerar saída financeira automática
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Gera um lançamento de saída na categoria "Compra de estoque", debitando da conta financeira selecionada.
                  </p>
                </div>
              </label>

              {generateFinancialExit && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="select-financial-bank" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Conta Financeira <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-financial-bank"
                      value={financialBankId}
                      onChange={(e) => {
                        setFinancialBankId(e.target.value);
                        if (errors.financialBankId) setErrors((prev) => ({ ...prev, financialBankId: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100 ${
                        errors.financialBankId
                          ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                          : 'border-slate-300 dark:border-slate-700 focus:border-slate-800 dark:focus:border-slate-500'
                      }`}
                    >
                      <option value="">Selecione a conta bancária...</option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.currency})
                        </option>
                      ))}
                    </select>
                    {errors.financialBankId && (
                      <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.financialBankId}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="input-financial-amount" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Valor Total da Compra <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        id="input-financial-amount"
                        value={financialAmount}
                        onChange={(e) => {
                          setFinancialAmount(e.target.value ? Number(e.target.value) : '');
                          if (errors.financialAmount) setErrors((prev) => ({ ...prev, financialAmount: '' }));
                        }}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${
                          errors.financialAmount
                            ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                            : 'border-slate-300 dark:border-slate-700 focus:border-slate-800 dark:focus:border-slate-500'
                        }`}
                      />
                      <span className="absolute right-3 top-2 text-slate-400 dark:text-slate-500 font-medium text-[11px]">
                        {banks.find((b) => b.id === financialBankId)?.currency || 'Kz'}
                      </span>
                    </div>
                    {errors.financialAmount && (
                      <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.financialAmount}</span>
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="input-financial-notes" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Observação Financeira <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      id="input-financial-notes"
                      value={financialNotes}
                      onChange={(e) => setFinancialNotes(e.target.value)}
                      placeholder="Ex: Fornecedor ABC, fatura #490..."
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Responsável */}
          <div>
            <label htmlFor="input-movement-responsible" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Responsável pelo Registo
            </label>
            <input
              type="text"
              id="input-movement-responsible"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Ex: Nome do operador"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Motivo / Justificativa */}
          <div>
            <label htmlFor="input-movement-reason" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Motivo / Observação de Auditoria <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              id="input-movement-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors((prev) => ({ ...prev, reason: '' }));
              }}
              placeholder="Descreva o motivo desta movimentação (ex: reposição de estoque, inventário periódico, venda em balcão)..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                errors.reason
                  ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                  : 'border-slate-300 dark:border-slate-700 focus:border-slate-800 dark:focus:border-slate-500'
              }`}
            />
            {errors.reason && (
              <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.reason}</span>
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              id="btn-cancel-movement"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-movement"
              className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Registar Movimentação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
