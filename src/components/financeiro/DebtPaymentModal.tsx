import React, { useState, useEffect } from 'react';
import { X, HandCoins, AlertCircle, Building2, CheckCircle2 } from 'lucide-react';
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
  const { banks, companies, recordDebtPayment, getDebtCalculations } = useStock();

  const [amount, setAmount] = useState<string>('');
  const [bankId, setBankId] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [responsible, setResponsible] = useState<string>('Administrador');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Suggested bank based on company's principal bank
  useEffect(() => {
    if (debt) {
      const calcs = getDebtCalculations(debt.id);
      setAmount(String(calcs.remainingAmount > 0 ? calcs.remainingAmount : ''));

      const comp = companies.find((c) => c.id === debt.companyId);
      if (comp?.principalBankId) {
        setBankId(comp.principalBankId);
      } else if (banks.length > 0) {
        setBankId(banks[0].id);
      }
      setDate(new Date().toISOString().slice(0, 10));
      setNotes('');
      setError(null);
    }
  }, [debt, isOpen, companies, banks, getDebtCalculations]);

  if (!isOpen || !debt) return null;

  const calcs = getDebtCalculations(debt.id);
  const isAPagar = debt.type === 'a_pagar';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Insira um valor de pagamento válido superior a zero.');
      return;
    }

    if (numAmount > calcs.remainingAmount + 0.001) {
      setError(
        `O valor do pagamento não pode exceder o saldo restante da dívida (${formatCurrencyValue(
          calcs.remainingAmount,
          'Kz'
        )}).`
      );
      return;
    }

    if (!bankId) {
      setError('Selecione a conta financeira envolvida na transação.');
      return;
    }

    try {
      recordDebtPayment({
        debtId: debt.id,
        amount: numAmount,
        bankId,
        date: new Date(date).toISOString(),
        responsible: responsible.trim() || 'Administrador',
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao registrar pagamento.');
    }
  };

  return (
    <div
      id="modal-debt-payment-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-debt-payment-card"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <HandCoins className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-debt-payment-title" className="text-sm font-semibold text-slate-900">
                {isAPagar ? 'Registar Pagamento de Dívida' : 'Registar Recebimento de Valor'}
              </h3>
              <p className="text-[11px] text-slate-500">
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

          {/* Resumo da Dívida */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Contraparte:</span>
              <span className="font-semibold text-slate-900">{debt.counterpartyName}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center font-mono">
              <div className="p-2 bg-white rounded-lg border border-slate-200/50">
                <span className="text-[10px] uppercase text-slate-400 block font-sans">Total</span>
                <span className="font-semibold text-slate-800 text-xs">
                  {formatCurrencyValue(debt.totalAmount, 'Kz')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200/50">
                <span className="text-[10px] uppercase text-slate-400 block font-sans">Já Pago</span>
                <span className="font-semibold text-emerald-700 text-xs">
                  {formatCurrencyValue(calcs.paidAmount, 'Kz')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200/50">
                <span className="text-[10px] uppercase text-slate-400 block font-sans">Restante</span>
                <span className="font-bold text-rose-600 text-xs">
                  {formatCurrencyValue(calcs.remainingAmount, 'Kz')}
                </span>
              </div>
            </div>
          </div>

          {/* Valor a Pagar/Receber & Conta Financeira */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-debt-payment-amount" className="block text-xs font-semibold text-slate-700 mb-1">
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
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 font-mono"
                  required
                />
                <span className="absolute right-3 top-2 text-[11px] font-mono text-slate-400">
                  Kz
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAmount(String(calcs.remainingAmount))}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-medium mt-1 inline-block"
              >
                Preencher valor total restante
              </button>
            </div>

            <div>
              <label htmlFor="select-debt-payment-bank" className="block text-xs font-semibold text-slate-700 mb-1">
                Conta Financeira <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-debt-payment-bank"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                required
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.currency})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isAPagar ? 'O saldo sairá desta conta' : 'O valor entrará nesta conta'}
              </span>
            </div>
          </div>

          {/* Data & Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-debt-payment-date" className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Pagamento <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="input-debt-payment-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
                required
              />
            </div>

            <div>
              <label htmlFor="input-debt-payment-responsible" className="block text-xs font-semibold text-slate-700 mb-1">
                Responsável
              </label>
              <input
                type="text"
                id="input-debt-payment-responsible"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Administrador"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="textarea-debt-payment-notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Observação / Recibo
            </label>
            <textarea
              id="textarea-debt-payment-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Quitação parcial, comprovativo de transferência..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
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
              id="btn-confirmar-pagamento-divida"
              className="px-5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              Confirmar Operação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
