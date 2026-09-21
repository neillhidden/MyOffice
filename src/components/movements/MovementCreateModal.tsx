import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowLeftRight,
  ShieldAlert,
  Building,
  CheckCircle2,
  Calendar,
  User,
  FileText,
  Lock,
  Info,
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

  const [productId, setProductId] = useState<string>(
    preSelectedProductId || (products[0]?.id ?? '')
  );
  const [variationId, setVariationId] = useState<string>(preSelectedVariationId || '');
  const [type, setType] = useState<MovementType>('entrada');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('Administrador MyOffice');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Saída financeira automática (opcional para entradas)
  const [generateFinancialExit, setGenerateFinancialExit] = useState<boolean>(false);
  const [financialBankId, setFinancialBankId] = useState<string>('');
  const [financialAmount, setFinancialAmount] = useState<number | ''>('');
  const [financialNotes, setFinancialNotes] = useState<string>('');

  // Synchronize state on modal opening or props update
  useEffect(() => {
    if (!isOpen) return;

    const initialProdId = preSelectedProductId || (products[0]?.id ?? '');
    setProductId(initialProdId);
    setVariationId(preSelectedVariationId || '');
    setQuantity('');
    setReason('');
    setReference('');
    setErrorMessage(null);
    setType('entrada');
    setGenerateFinancialExit(false);
    setFinancialAmount('');
    setFinancialNotes('');

    // Determine initial origin warehouse
    let targetWhId = '';
    if (initialProdId) {
      const prodWhs = getProductWarehouses(initialProdId);
      if (preSelectedWarehouseId && warehouses.some((w) => w.id === preSelectedWarehouseId)) {
        targetWhId = preSelectedWarehouseId;
      } else if (prodWhs.length > 0) {
        targetWhId = prodWhs[0].id;
      } else if (warehouses.length > 0) {
        targetWhId = warehouses[0].id;
      }
    } else if (warehouses.length > 0) {
      targetWhId = warehouses[0].id;
    }
    setWarehouseId(targetWhId);

    // Initial destination warehouse different from origin
    const otherWh = warehouses.find((w) => w.id !== targetWhId);
    setDestinationWarehouseId(otherWh ? otherWh.id : (warehouses[1]?.id ?? warehouses[0]?.id ?? ''));

    // Sugerir conta financeira da empresa dona do armazém
    const wh = warehouses.find((w) => w.id === targetWhId);
    const comp = companies.find((c) => c.id === wh?.companyId);
    setFinancialBankId(comp?.principalBankId || banks[0]?.id || '');
  }, [
    isOpen,
    preSelectedProductId,
    preSelectedWarehouseId,
    preSelectedVariationId,
    products,
    warehouses,
    companies,
    banks,
    getProductWarehouses,
  ]);

  if (!isOpen) return null;

  const getWarehouseCompany = (wId: string) => {
    const wh = warehouses.find((item) => item.id === wId);
    return companies.find((c) => c.id === wh?.companyId);
  };

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
    if (destinationWarehouseId === newWhId) {
      const otherWh = activeAndStoppedWarehouses.find((w) => w.id !== newWhId);
      if (otherWh) {
        setDestinationWarehouseId(otherWh.id);
      }
    }
    // Sugerir conta principal da empresa do armazém selecionado
    const wh = warehouses.find((w) => w.id === newWhId);
    const comp = companies.find((c) => c.id === wh?.companyId);
    if (comp?.principalBankId) {
      setFinancialBankId(comp.principalBankId);
    }
  };

  const handleTypeChange = (newType: MovementType) => {
    setType(newType);
    if (newType !== 'entrada') {
      setGenerateFinancialExit(false);
    }
    if (newType === 'transferencia') {
      if (destinationWarehouseId === warehouseId || !destinationWarehouseId) {
        const otherWh = activeAndStoppedWarehouses.find((w) => w.id !== warehouseId);
        if (otherWh) setDestinationWarehouseId(otherWh.id);
      }
    }
  };

  const availableDestinations = activeAndStoppedWarehouses.filter((w) => w.id !== warehouseId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProduct) {
      setErrorMessage('Selecione um produto válido.');
      return;
    }

    if (!warehouseId) {
      setErrorMessage('Selecione o armazém de origem.');
      return;
    }

    const originComp = getWarehouseCompany(warehouseId);
    if (originComp?.status === 'desativada') {
      setErrorMessage(`Operação bloqueada: A empresa "${originComp.name}" está desativada.`);
      return;
    }
    if (originComp?.status === 'parada') {
      setErrorMessage(`Operação bloqueada: A empresa "${originComp.name}" está com status Parada (serviços temporariamente congelados).`);
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setErrorMessage('A quantidade deve ser maior que zero.');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('O motivo ou justificativa é obrigatório para manter o registro de auditoria.');
      return;
    }

    // Check availability for saída or transferência
    if ((type === 'saida' || type === 'transferencia') && qty > currentAvailableStock) {
      setErrorMessage(
        `Estoque insuficiente no armazém selecionado. Disponível: ${currentAvailableStock} ${selectedProduct.unitOfMeasure}.`
      );
      return;
    }

    if (type === 'transferencia') {
      if (!destinationWarehouseId) {
        setErrorMessage('Selecione o armazém de destino para transferência.');
        return;
      }
      if (warehouseId === destinationWarehouseId) {
        setErrorMessage('O armazém de destino não pode ser o mesmo de origem.');
        return;
      }
      const destComp = getWarehouseCompany(destinationWarehouseId);
      if (destComp?.status === 'desativada') {
        setErrorMessage(`Operação bloqueada: A empresa de destino "${destComp.name}" está desativada.`);
        return;
      }
      if (destComp?.status === 'parada') {
        setErrorMessage(`Operação bloqueada: A empresa de destino "${destComp.name}" está com status Parada (serviços temporariamente congelados).`);
        return;
      }
    }

    // Validação da saída financeira automática (opcional para entradas)
    if (type === 'entrada' && generateFinancialExit) {
      if (!financialBankId) {
        setErrorMessage('Selecione a conta financeira de onde sai o dinheiro.');
        return;
      }
      const finAmt = Number(financialAmount);
      if (!finAmt || finAmt <= 0) {
        setErrorMessage('Informe o valor total da compra para a saída financeira.');
        return;
      }
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-6 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  {isProductLocked ? 'Movimentar Produto' : 'Registrar Movimentação de Estoque'}
                </h3>
                {isProductLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Contexto Específico
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {isProductLocked
                  ? 'Produto e armazém vinculados a partir da ficha do item'
                  : 'Operação geral com recálculo automático de saldo contábil'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-movement-modal"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Produto (Travado se aberto a partir do detalhe do produto) */}
          {isProductLocked && selectedProduct ? (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Produto Vinculado
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Bloqueado (Ficha do Produto)</span>
                </span>
              </div>

              <div className="flex items-center gap-3 pt-0.5">
                <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 shadow-2xs">
                  <img
                    src={selectedProduct.mainImage}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {selectedProduct.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                    <span className="font-mono">
                      SKU: <strong className="text-slate-700">{selectedProduct.sku}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Marca: <strong className="text-slate-700">{selectedProduct.brand}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Categoria: <strong className="text-slate-700">{selectedProduct.category}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Produto <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-movement-product"
                value={productId}
                onChange={(e) => {
                  const newProdId = e.target.value;
                  setProductId(newProdId);
                  setVariationId('');
                  const prodWhs = getProductWarehouses(newProdId);
                  if (prodWhs.length > 0 && !prodWhs.some((w) => w.id === warehouseId)) {
                    setWarehouseId(prodWhs[0].id);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
              >
                {operationalProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Variação (se houver) */}
          {selectedProduct && selectedProduct.variations.length > 0 && (
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Variação
              </label>
              {isProductLocked && preSelectedVariationId && selectedVariation ? (
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800">
                    {selectedVariation.color || ''} {selectedVariation.size ? `• ${selectedVariation.size}` : ''} (SKU: {selectedVariation.sku})
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Variação Bloqueada
                  </span>
                </div>
              ) : (
                <select
                  id="select-movement-variation"
                  value={variationId}
                  onChange={(e) => setVariationId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
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

          {/* Tipo de Movimento */}
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">
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
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-xs capitalize">{item.label}</div>
                  <div
                    className={`text-[10px] ${
                      type === item.id ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Armazém de Origem e Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-slate-700">
                  {type === 'transferencia' ? 'Armazém de Origem' : 'Armazém'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                {isProductLocked && (
                  <span className="text-[10px] text-slate-500">
                    {associatedWarehouses.length > 1
                      ? `${associatedWarehouses.length} armazéns com registro`
                      : 'Pré-selecionado do produto'}
                  </span>
                )}
              </div>

              <select
                id="select-movement-warehouse"
                value={warehouseId}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
              >
                {isProductLocked && associatedWarehouses.length > 0 ? (
                  <>
                    <optgroup label="Armazéns com registro deste produto">
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
                              {w.name} {isParada ? '(Parada — Bloqueado)' : '(Sem saldo registrado)'}
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

              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Saldo disponível neste local:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {currentAvailableStock} {selectedProduct?.unitOfMeasure || 'un'}
                </span>
              </div>
            </div>

            {type === 'transferencia' && (
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Armazém de Destino <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-movement-destination-warehouse"
                  value={destinationWarehouseId}
                  onChange={(e) => setDestinationWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                >
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
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Livre para transferir para qualquer outro armazém da rede.
                </span>
              </div>
            )}
          </div>

          {/* Quantidade e Referência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Quantidade <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  id="input-movement-quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 font-mono"
                />
                <span className="absolute right-3 top-2 text-slate-400 font-medium text-[11px]">
                  {selectedProduct?.unitOfMeasure || 'un'}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Documento / Referência
              </label>
              <input
                type="text"
                id="input-movement-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: Fatura #1029, Guia GT-40"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* Saída Financeira Automática (Apenas para Entradas / Compras) */}
          {type === 'entrada' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="chk-movement-financial-exit"
                  checked={generateFinancialExit}
                  onChange={(e) => setGenerateFinancialExit(e.target.checked)}
                  aria-label="Gerar saída financeira automática"
                  className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Gerar saída financeira automática
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gera um lançamento de saída na categoria "Compra de estoque", debitando da conta financeira selecionada.
                  </p>
                </div>
              </label>

              {generateFinancialExit && (
                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Conta Financeira <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-financial-bank"
                      value={financialBankId}
                      onChange={(e) => setFinancialBankId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                    >
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.currency})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Valor Total da Compra <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        id="input-financial-amount"
                        value={financialAmount}
                        onChange={(e) => setFinancialAmount(e.target.value ? Number(e.target.value) : '')}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 font-mono"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 font-medium text-[11px]">
                        {banks.find((b) => b.id === financialBankId)?.currency || 'Kz'}
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-700 mb-1">
                      Observação Financeira (Opcional)
                    </label>
                    <input
                      type="text"
                      id="input-financial-notes"
                      value={financialNotes}
                      onChange={(e) => setFinancialNotes(e.target.value)}
                      placeholder="Ex: Fornecedor ABC, fatura #490..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Responsável */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Responsável pelo Registro
            </label>
            <input
              type="text"
              id="input-movement-responsible"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Nome do operador"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
            />
          </div>

          {/* Motivo / Justificativa */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Motivo / Observação de Auditoria <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              id="input-movement-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo desta movimentação (ex: reposição de estoque, inventário periódico, venda em balcão)..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              id="btn-cancel-movement"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-movement"
              className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Registrar Movimentação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
