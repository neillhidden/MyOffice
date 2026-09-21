import React, { useState } from 'react';
import { X, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { BankMovementType, FinancialCategory } from '../../types/stock';
import { formatCurrencyValue } from '../../utils/formatters';

interface LancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedBankId?: string | null;
}

const FINANCIAL_CATEGORIES: FinancialCategory[] = [
  'Venda',
  'Compra de estoque',
  'Dívida',
  'Salário',
  'Serviços',
  'Aluguer',
  'Impostos',
  'Transporte',
  'Alimentação',
  'Marketing',
  'Outro',
];

export const LancamentoModal: React.FC<LancamentoModalProps> = ({
  isOpen,
  onClose,
  preSelectedBankId,
}) => {
  const { banks, recordBankMovement, getBankBalance } = useStock();

  const [bankId, setBankId] = useState<string>(preSelectedBankId || banks[0]?.id || '');
  const [type, setType] = useState<BankMovementType>('entrada');
  const [category, setCategory] = useState<FinancialCategory>('Outro');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('Administrador');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (preSelectedBankId) {
      setBankId(preSelectedBankId);
    } else if (!bankId && banks.length > 0) {
      setBankId(banks[0].id);
    }
  }, [preSelectedBankId, isOpen, banks]);

  if (!isOpen) return null;

  const currentBank = banks.find((b) => b.id === bankId);
  const currentBalance = currentBank ? getBankBalance(currentBank.id) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);

    if (!bankId) {
      setError('Selecione uma conta financeira válida.');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Insira um montante válido maior que zero.');
      return;
    }

    if (!reason.trim()) {
      setError('O motivo ou justificativa é obrigatório para conformidade e auditoria.');
      return;
    }

    if (type === 'saida' && numAmount > currentBalance) {
      const confirmNegative = window.confirm(
        `Atenção: O saldo atual da conta (${formatCurrencyValue(
          currentBalance,
          currentBank?.currency || 'Kz'
        )}) é inferior ao valor do lançamento. Deseja registrar a saída mesmo com saldo negativo?`
      );
      if (!confirmNegative) return;
    }

    recordBankMovement({
      bankId,
      type,
      category,
      amount: numAmount,
      reason: reason.trim(),
      reference: reference.trim() || undefined,
      responsible: responsible.trim() || 'Administrador',
      date: new Date(date).toISOString(),
    });

    onClose();
  };

  return (
    <div
      id="modal-lancamento-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-lancamento-card"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-lancamento-title" className="text-sm font-semibold text-slate-900">
                Novo Lançamento Financeiro
              </h3>
              <p className="text-[11px] text-slate-500">
                Registro direto de entrada, saída ou ajuste em conta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tipo de Lançamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de Operação <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-lancamento-tipo-entrada"
                onClick={() => setType('entrada')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                  type === 'entrada'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Entrada (+)
              </button>
              <button
                type="button"
                id="btn-lancamento-tipo-saida"
                onClick={() => setType('saida')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                  type === 'saida'
                    ? 'bg-rose-50 border-rose-300 text-rose-800 ring-1 ring-rose-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Saída (-)
              </button>
              <button
                type="button"
                id="btn-lancamento-tipo-ajuste"
                onClick={() => setType('ajuste')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                  type === 'ajuste'
                    ? 'bg-slate-100 border-slate-400 text-slate-800 ring-1 ring-slate-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Ajuste
              </button>
            </div>
          </div>

          {/* Conta e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="select-lancamento-conta" className="block text-xs font-semibold text-slate-700 mb-1">
                Conta Financeira <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-lancamento-conta"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.currency})
                  </option>
                ))}
              </select>
              {currentBank && (
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Saldo: {formatCurrencyValue(currentBalance, currentBank.currency)}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="select-lancamento-categoria" className="block text-xs font-semibold text-slate-700 mb-1">
                Categoria Financeira <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-lancamento-categoria"
                value={category}
                onChange={(e) => setCategory(e.target.value as FinancialCategory)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
              >
                {FINANCIAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-lancamento-valor" className="block text-xs font-semibold text-slate-700 mb-1">
                Montante / Valor <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  id="input-lancamento-valor"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 font-mono"
                  required
                />
                <span className="absolute right-3 top-2 text-[11px] font-mono text-slate-400">
                  {currentBank?.currency || 'Kz'}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="input-lancamento-data" className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Lançamento <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="input-lancamento-data"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
                required
              />
            </div>
          </div>

          {/* Responsável e Documento/Referência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-lancamento-responsavel" className="block text-xs font-semibold text-slate-700 mb-1">
                Responsável
              </label>
              <input
                type="text"
                id="input-lancamento-responsavel"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Administrador"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label htmlFor="input-lancamento-referencia" className="block text-xs font-semibold text-slate-700 mb-1">
                Documento / Referência
              </label>
              <input
                type="text"
                id="input-lancamento-referencia"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: Fatura #402, Recibo #12"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* Motivo / Justificativa */}
          <div>
            <label htmlFor="textarea-lancamento-motivo" className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo / Justificativa de Auditoria <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="textarea-lancamento-motivo"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva a finalidade desta movimentação para registro contábil e de auditoria..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
              required
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-lancamento"
              className="px-5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              Confirmar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
