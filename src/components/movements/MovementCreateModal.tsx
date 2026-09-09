import React, { useState } from 'react';
import {
  X,
  ArrowLeftRight,
  ShieldAlert,
  Building,
  CheckCircle2,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { MovementType } from '../../types/stock';

interface MovementCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedProductId?: string | null;
}

export const MovementCreateModal: React.FC<MovementCreateModalProps> = ({
  isOpen,
  onClose,
  preSelectedProductId,
}) => {
  const { products, warehouses, recordMovement, getCurrentStock } = useStock();

  const [productId, setProductId] = useState<string>(
    preSelectedProductId || (products[0]?.id ?? '')
  );
  const [variationId, setVariationId] = useState<string>('');
  const [type, setType] = useState<MovementType>('entrada');
  const [warehouseId, setWarehouseId] = useState<string>(warehouses[0]?.id ?? '');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<string>(
    warehouses[1]?.id ?? ''
  );
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('Administrador MyOffice');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === productId);
  const currentAvailableStock = selectedProduct
    ? getCurrentStock(selectedProduct.id, warehouseId, variationId || undefined)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProduct) {
      setErrorMessage('Selecione um produto.');
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

    if (type === 'transferencia' && warehouseId === destinationWarehouseId) {
      setErrorMessage('O armazém de destino não pode ser o mesmo de origem.');
      return;
    }

    recordMovement({
      productId: selectedProduct.id,
      variationId: variationId || undefined,
      warehouseId,
      destinationWarehouseId: type === 'transferencia' ? destinationWarehouseId : undefined,
      type,
      quantity: qty,
      responsible: responsible.trim() || 'Administrador MyOffice',
      reason: reason.trim(),
      reference: reference.trim() || undefined,
    });

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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Registrar Movimentação de Estoque
              </h3>
              <p className="text-[11px] text-slate-400">
                Operação auditada com recálculo automático de saldo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
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

          {/* Audit Rule Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-600 text-[11px] leading-relaxed">
            <strong>Auditoria Contábil:</strong> Este registro será gravado no histórico definitivo. Para retificar saldos físicos, utilize o tipo <strong>Ajuste</strong> acompanhado da devida justificativa.
          </div>

          {/* Produto */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Produto <span className="text-rose-500">*</span>
            </label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setVariationId('');
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Variação (se houver) */}
          {selectedProduct && selectedProduct.variations.length > 0 && (
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Variação
              </label>
              <select
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
            </div>
          )}

          {/* Tipo de Movimento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['entrada', 'saida', 'transferencia', 'ajuste'] as MovementType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 px-2 text-center rounded-lg border font-medium capitalize transition-colors ${
                  type === t
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Armazém de Origem e Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                {type === 'transferencia' ? 'Armazém de Origem' : 'Armazém'} <span className="text-rose-500">*</span>
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Disponível neste local: <strong>{currentAvailableStock}</strong> {selectedProduct?.unitOfMeasure}
              </span>
            </div>

            {type === 'transferencia' && (
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Armazém de Destino <span className="text-rose-500">*</span>
                </label>
                <select
                  value={destinationWarehouseId}
                  onChange={(e) => setDestinationWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
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
                  {selectedProduct?.unitOfMeasure}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Documento / Referência
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: Fatura #1029, Guia GT-40"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* Responsável */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Responsável pelo Registro
            </label>
            <input
              type="text"
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
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-movement"
              className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Registrar Movimentação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
