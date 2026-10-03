import React, { useState, useEffect } from 'react';
import { X, HandCoins, AlertCircle } from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Debt } from '../../types/stock';
import { formatCurrencyValue } from '../../utils/formatters';

interface DebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
}

export const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({
  isOpen,
  onClose,
  debt,
}) => {
  const {
    banks,
    companies,
    recordDebtPayment,
    getDebtCalculations,
    getCompanyForBank,
    isCompanyDisabled,
  } = useStock();

  const [amount, setAmount] = useState<string>('');
  const [bankId, setBankId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset fields clean whenever modal opens (Rule 7 & Rule 9)
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setBankId('');
      setDate(new Date().toISOString().slice(0, 10));
      setResponsible('');
      setNotes('');
      setErrors({});
    }
  }, [isOpen]);

  const operationalBanks = React.useMemo(() => {
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

  if (!isOpen || !debt) return null;

  const calcs = getDebtCalculations(debt.id);
  const isAPagar = debt.type === 'a_pagar';

  const validate = () => {
    const errs: Record<string, string> = {};

    const numAmount = parseFloat(amount);
    if (!amount.trim()) {
      errs.amount = 'O montante do pagamento é obrigatório.';
    } else if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Insira um valor numérico válido superior a zero.';
    } else if (numAmount > calcs.remainingAmount + 0.001) {
      errs.amount = `O valor não pode exceder o saldo restante da dívida (${formatCurrencyValue(
        calcs.remainingAmount,
        'Kz'
      )}).`;
    }

    if (!bankId) {
      errs.bankId = 'Selecione a conta financeira envolvida na transação.';
    }

    if (!date) {
      errs.date = 'A data da operação é obrigatória.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const numAmount = parseFloat(amount);

    recordDebtPayment({
      debtId: debt.id,
      amount: numAmount,
      bankId,
      date: new Date(date).toISOString(),
      responsible: responsible.trim() || 'Administrador',
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div
      id="modal-debt-payment-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-debt-payment-card"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-xs">
              <HandCoins className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-debt-payment-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {isAPagar ? 'Registar Pagamento de Dívida' : 'Registar Recebimento de Valor'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAPagar
                  ? 'Gera saída automática no Financeiro debitando a conta'
                  : 'Gera entrada automática no Financeiro creditando a conta'}
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
          {/* Resumo da Dívida */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Contraparte:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{debt.counterpartyName}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-center font-mono">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/50 dark:border-slate-700/60">
                <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 block font-sans">Total</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {formatCurrencyValue(debt.totalAmount, debt.currency || 'Kz')}
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/50 dark:border-slate-700/60">
                <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 block font-sans">Já Pago</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-xs">
                  {formatCurrencyValue(calcs.paidAmount, debt.currency || 'Kz')}
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/50 dark:border-slate-700/60">
                <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 block font-sans">Restante</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 text-xs">
                  {formatCurrencyValue(calcs.remainingAmount, debt.currency || 'Kz')}
                </span>
              </div>
            </div>
          </div>

          {/* Valor a Pagar/Receber & Conta Financeira */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-debt-payment-amount" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Desta Operação <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  max={calcs.remainingAmount}
                  id="input-debt-payment-amount"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono ${
                    errors.amount
                      ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                      : 'border-slate-300 dark:border-slate-700 focus:border-slate-800 dark:focus:border-slate-400'
                  }`}
                />
                <span className="absolute right-3 top-2 text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  {debt.currency || 'Kz'}
                </span>
              </div>
              {errors.amount && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.amount}</span>
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setAmount(String(calcs.remainingAmount));
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mt-1 inline-block cursor-pointer"
              >
                Preencher total restante ({formatCurrencyValue(calcs.remainingAmount, debt.currency || 'Kz')})
              </button>
            </div>

            <div>
              <label htmlFor="select-debt-payment-bank" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Conta Financeira <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-debt-payment-bank"
                value={bankId}
                onChange={(e) => {
                  setBankId(e.target.value);
                  if (errors.bankId) setErrors((prev) => ({ ...prev, bankId: '' }));
                }}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100 ${
                  errors.bankId
                    ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                    : 'border-slate-300 dark:border-slate-700 focus:border-slate-800 dark:focus:border-slate-400'
                }`}
              >
                <option value="">Selecionar Conta Bancária...</option>
                {operationalBanks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.currency})
                  </option>
                ))}
              </select>
              {errors.bankId && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.bankId}</span>
                </p>
              )}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                {isAPagar ? 'O saldo sairá desta conta' : 'O valor entrará nesta conta'}
              </span>
            </div>
          </div>

          {/* Data & Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-debt-payment-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Pagamento <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="input-debt-payment-date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${
                  errors.date
                    ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                    : 'border-slate-300 dark:border-slate-700 focus:border-slate-800 dark:focus:border-slate-400'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.date}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="input-debt-payment-responsible" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Responsável
              </label>
              <input
                type="text"
                id="input-debt-payment-responsible"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Ex: Administrador"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="textarea-debt-payment-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observação / Recibo
            </label>
            <textarea
              id="textarea-debt-payment-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Quitação parcial, comprovativo de transferência..."
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-confirmar-pagamento-divida"
              className="px-5 py-2 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs cursor-pointer"
            >
              Confirmar Operação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
