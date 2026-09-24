import React, { useState, useEffect } from 'react';
import { X, TrendingUp, AlertCircle, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Debt } from '../../types/stock';
import { formatCurrencyValue } from '../../utils/formatters';

interface DebtIncrementModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
}

export const DebtIncrementModal: React.FC<DebtIncrementModalProps> = ({
  isOpen,
  onClose,
  debt,
}) => {
  const { addDebtIncrement, getDebtCalculations } = useStock();

  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset all fields clean whenever modal opens (Rule 7 & 9)
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setReason('');
      setReference('');
      setDate(new Date().toISOString().slice(0, 10));
      setResponsible('Administrador');
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen || !debt) return null;

  const calcs = getDebtCalculations(debt.id);
  const isAPagar = debt.type === 'a_pagar';

  const numAmount = parseFloat(amount);
  const validAmount = !isNaN(numAmount) && numAmount > 0;
  const newTotal = validAmount ? debt.totalAmount + numAmount : debt.totalAmount;
  const newRemaining = validAmount ? calcs.remainingAmount + numAmount : calcs.remainingAmount;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!amount.trim()) {
      errs.amount = 'O montante a acrescentar é obrigatório.';
    } else if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Insira um valor numérico válido superior a zero.';
    }

    if (!reason.trim()) {
      errs.reason = 'O motivo ou justificativa do acréscimo é obrigatório para conformidade e auditoria.';
    }

    if (!date) {
      errs.date = 'A data do acréscimo é obrigatória.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addDebtIncrement({
      debtId: debt.id,
      amount: numAmount,
      reason: reason.trim(),
      reference: reference.trim() || undefined,
      responsible: responsible.trim() || 'Administrador',
      date: new Date(date).toISOString(),
    });

    // Clean and close
    setAmount('');
    setReason('');
    setReference('');
    setErrors({});
    onClose();
  };

  return (
    <div
      id="modal-debt-increment-overlay"
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-debt-increment-card"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-debt-increment-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Acrescentar Valor à Dívida
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Registo rastreável de novo lançamento em conta de {debt.counterpartyName}
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

        {/* Current Debt State Context Banner */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 block font-medium">
              Valor Atual da Dívida
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {formatCurrencyValue(debt.totalAmount, debt.currency || 'Kz')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Liquidado: {formatCurrencyValue(calcs.paidAmount, debt.currency || 'Kz')}
            </span>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 block font-medium">
              Novo Total Atualizado
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
              {formatCurrencyValue(newTotal, debt.currency || 'Kz')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Novo restante: {formatCurrencyValue(newRemaining, debt.currency || 'Kz')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Montante a acrescentar */}
          <div>
            <label htmlFor="inc-amount" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Montante a Acrescentar ({debt.currency || 'Kz'}) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              id="inc-amount"
              step="any"
              min="0"
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
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              O montante será somado de forma transparente ao valor total já contratado.
            </p>
          </div>

          {/* Motivo do acréscimo (obrigatório) */}
          <div>
            <label htmlFor="inc-reason" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Motivo ou Justificativa do Acréscimo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="inc-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors((prev) => ({ ...prev, reason: '' }));
              }}
              placeholder="Ex: Encomenda adicional de mercadoria, despesa de transporte imprevista"
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
              <label htmlFor="inc-reference" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Referência / Documento (Opcional)
              </label>
              <input
                type="text"
                id="inc-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: Guia #89, Fatura #402"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="inc-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Data do Acréscimo <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="inc-date"
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
            <label htmlFor="inc-responsible" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Responsável pelo Lançamento
            </label>
            <input
              type="text"
              id="inc-responsible"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Ex: Administrador"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-colors"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-confirm-add-increment"
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl text-xs font-medium transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Confirmar Acréscimo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
