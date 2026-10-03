import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowLeftRight, AlertCircle, PlusCircle, MinusCircle, SlidersHorizontal } from 'lucide-react';
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
  const {
    banks,
    companies,
    recordBankMovement,
    getBankBalance,
    getCompanyForBank,
    isCompanyDisabled,
    isBankOperationBlocked,
  } = useStock();

  // No pre-selection by default (Rule 1 & Rule 7)
  const [type, setType] = useState<BankMovementType | ''>('');
  const [bankId, setBankId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset all fields clean whenever modal opens (Rule 7 & Rule 9)
  useEffect(() => {
    if (isOpen) {
      setType('');
      setBankId(preSelectedBankId || '');
      setCategory('');
      setAmount('');
      setReason('');
      setReference('');
      setResponsible('');
      setDate(new Date().toISOString().slice(0, 16));
      setErrors({});
    }
  }, [isOpen, preSelectedBankId]);

  // Operational banks: strictly exclude banks of disabled companies
  const operationalBanks = useMemo(() => {
    return banks.filter((b) => {
      if (b.id === 'bank-kianda') {
        const kiandaComp = companies.find((c) => c.id === 'comp-kianda');
        if (kiandaComp ? kiandaComp.status === 'desativada' : true) return false;
      }
      const comp = getCompanyForBank(b.id);
      if (comp && (comp.status === 'desativada' || isCompanyDisabled(comp.id))) return false;
      return true;
    });
  }, [banks, companies, getCompanyForBank, isCompanyDisabled]);

  if (!isOpen) return null;

  const currentBank = banks.find((b) => b.id === bankId);
  const currentBalance = currentBank ? getBankBalance(currentBank.id) : 0;
  const currentBankBlock = isBankOperationBlocked(bankId);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!type) {
      errs.type = 'Selecione o tipo de operação (Entrada, Saída ou Ajuste).';
    }

    if (!bankId) {
      errs.bankId = 'Selecione a conta bancária.';
    } else {
      const blockCheck = isBankOperationBlocked(bankId);
      if (blockCheck.blocked) {
        errs.bankId = blockCheck.message || 'Empresa parada — serviços indisponíveis.';
      }
    }

    const numAmount = parseFloat(amount);
    if (!amount.trim()) {
      errs.amount = 'O montante é obrigatório.';
    } else if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Insira um montante válido superior a zero.';
    }

    if (!category) {
      errs.category = 'Selecione a categoria financeira.';
    }

    if (!reason.trim()) {
      errs.reason = 'O motivo ou justificativa é obrigatório para conformidade e auditoria.';
    }

    if (!date) {
      errs.date = 'A data do lançamento é obrigatória.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const numAmount = parseFloat(amount);

    try {
      if (type) {
        recordBankMovement({
          bankId,
          type,
          category: (category as FinancialCategory) || 'Outro',
          amount: numAmount,
          reason: reason.trim(),
          reference: reference.trim() || undefined,
          responsible: responsible.trim() || 'Administrador',
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
        });
      }

      onClose();
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        bankId: err.message || 'Empresa parada — serviços indisponíveis.',
      }));
    }
  };

  return (
    <div
      id="modal-lancamento-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-lancamento-card"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-xs">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-lancamento-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Nova Movimentação
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Registo de entrada, saída ou ajuste de conciliação
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo de Operação (sem seleção prévia) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Operação <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-op-entrada"
                onClick={() => {
                  setType('entrada');
                  if (errors.type) setErrors((prev) => ({ ...prev, type: '' }));
                }}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  type === 'entrada'
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600 dark:ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <PlusCircle className={`w-4 h-4 ${type === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>Entrada</span>
              </button>

              <button
                type="button"
                id="btn-op-saida"
                onClick={() => {
                  setType('saida');
                  if (errors.type) setErrors((prev) => ({ ...prev, type: '' }));
                }}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  type === 'saida'
                    ? 'border-rose-600 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 ring-1 ring-rose-600 dark:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <MinusCircle className={`w-4 h-4 ${type === 'saida' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>Saída</span>
              </button>

              <button
                type="button"
                id="btn-op-ajuste"
                onClick={() => {
                  setType('ajuste');
                  if (errors.type) setErrors((prev) => ({ ...prev, type: '' }));
                }}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  type === 'ajuste'
                    ? 'border-amber-600 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 ring-1 ring-amber-600 dark:ring-amber-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <SlidersHorizontal className={`w-4 h-4 ${type === 'ajuste' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>Ajuste</span>
              </button>
            </div>
            {errors.type && (
              <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.type}</span>
              </p>
            )}
          </div>

          {/* Conta Bancária */}
          <div>
            <label htmlFor="lanc-bank" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Conta Bancária <span className="text-rose-500">*</span>
            </label>
            <select
              id="lanc-bank"
              value={bankId}
              onChange={(e) => {
                setBankId(e.target.value);
                if (errors.bankId) setErrors((prev) => ({ ...prev, bankId: '' }));
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100 ${
                errors.bankId
                  ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-400'
              }`}
            >
              <option value="">Selecione a conta bancária...</option>
              {operationalBanks.map((b) => {
                const comp = getCompanyForBank(b.id);
                const isStopped = comp?.status === 'parada';
                return (
                  <option
                    key={b.id}
                    value={b.id}
                    disabled={isStopped}
                    className={isStopped ? 'text-slate-400 bg-slate-100 dark:bg-slate-800' : ''}
                  >
                    {b.name} ({b.currency}){isStopped ? ' — [PARADA - Serviços indisponíveis]' : ` • Saldo: ${formatCurrencyValue(getBankBalance(b.id), b.currency)}`}
                  </option>
                );
              })}
            </select>
            {errors.bankId && (
              <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.bankId}</span>
              </p>
            )}
            {currentBankBlock.blocked && !errors.bankId && (
              <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{currentBankBlock.message || 'Empresa parada — serviços indisponíveis.'}</span>
              </p>
            )}
          </div>

          {/* Categoria e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="lanc-cat" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Categoria <span className="text-rose-500">*</span>
              </label>
              <select
                id="lanc-cat"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100 ${
                  errors.category
                    ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-400'
                }`}
              >
                <option value="">Selecione a categoria...</option>
                {FINANCIAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.category}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="lanc-amount" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Montante ({currentBank?.currency || 'Kz'}) <span className="text-rose-500">*</span>
              </label>
              <input
                id="lanc-amount"
                type="number"
                step="any"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                placeholder="Ex: 50000"
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none transition-colors ${
                  errors.amount
                    ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-400'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.amount}</span>
                </p>
              )}
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label htmlFor="lanc-reason" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Motivo ou Justificativa <span className="text-rose-500">*</span>
            </label>
            <input
              id="lanc-reason"
              type="text"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors((prev) => ({ ...prev, reason: '' }));
              }}
              placeholder="Ex: Pagamento mensal de eletricidade e água"
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-colors ${
                errors.reason
                  ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-400'
              }`}
            />
            {errors.reason && (
              <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.reason}</span>
              </p>
            )}
          </div>

          {/* Referência e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="lanc-ref" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Referência / Recibo <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                id="lanc-ref"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: Fatura #1024"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="lanc-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Data do Lançamento <span className="text-rose-500">*</span>
              </label>
              <input
                id="lanc-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-colors ${
                  errors.date
                    ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-400'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.date}</span>
                </p>
              )}
            </div>
          </div>

          {/* Responsável */}
          <div>
            <label htmlFor="lanc-resp" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Responsável
            </label>
            <input
              id="lanc-resp"
              type="text"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Ex: Administrador"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-confirm-lancamento"
              disabled={currentBankBlock.blocked}
              title={currentBankBlock.blocked ? currentBankBlock.message : undefined}
              className={`px-5 py-2 text-xs font-medium rounded-xl shadow-xs transition-colors ${
                currentBankBlock.blocked
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer'
              }`}
            >
              Confirmar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
