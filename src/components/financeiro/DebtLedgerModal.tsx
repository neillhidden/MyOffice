import React, { useState } from 'react';
import { X, History, Trash2, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Debt } from '../../types/stock';
import { formatCurrencyValue, formatDate } from '../../utils/formatters';

interface DebtLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  onOpenNewPayment: (debt: Debt) => void;
}

export const DebtLedgerModal: React.FC<DebtLedgerModalProps> = ({
  isOpen,
  onClose,
  debt,
  onOpenNewPayment,
}) => {
  const { banks, debtPayments, deleteDebtPayment, getDebtCalculations } = useStock();
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; amount: number } | null>(null);

  if (!isOpen || !debt) return null;

  const calcs = getDebtCalculations(debt.id);
  const payments = debtPayments
    .filter((p) => p.debtId === debt.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleConfirmDelete = () => {
    if (!paymentToDelete) return;
    deleteDebtPayment(paymentToDelete.id);
    setPaymentToDelete(null);
  };

  return (
    <div
      id="modal-debt-ledger-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-debt-ledger-card"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-debt-ledger-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Histórico de Pagamentos — {debt.counterpartyName}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {debt.type === 'a_pagar' ? 'Conta a Pagar' : 'Conta a Receber'} • Total:{' '}
                {formatCurrencyValue(debt.totalAmount, 'Kz')}
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

        {/* Resumo visual de quitação */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 text-center font-mono text-xs">
          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-sans text-slate-400 dark:text-slate-500 block">Total da Dívida</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {formatCurrencyValue(debt.totalAmount, 'Kz')}
            </span>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-sans text-slate-400 dark:text-slate-500 block">Total Liquidado</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
              {formatCurrencyValue(calcs.paidAmount, 'Kz')}
            </span>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-sans text-slate-400 dark:text-slate-500 block">Saldo Restante</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
              {formatCurrencyValue(calcs.remainingAmount, 'Kz')}
            </span>
          </div>
        </div>

        {/* Lista de Pagamentos */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2">
                <History className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nenhum pagamento registado</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Ainda não foram efetuadas amortizações nesta dívida.
              </p>
              {calcs.remainingAmount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewPayment(debt);
                  }}
                  className="mt-3 px-3.5 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs cursor-pointer"
                >
                  Registar pagamento
                </button>
              )}
            </div>
          ) : (
            <div className="border border-slate-200/80 dark:border-slate-700/80 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Conta</th>
                    <th className="py-2.5 px-3 text-right">Valor Pago</th>
                    <th className="py-2.5 px-3">Responsável</th>
                    <th className="py-2.5 px-3">Observação</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((p) => {
                    const bank = banks.find((b) => b.id === p.bankId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {formatDate(p.date)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-800 dark:text-slate-200 font-medium">
                          {bank?.name || 'Conta Financeira'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          {formatCurrencyValue(p.amount, 'Kz')}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {p.responsible || 'Administrador'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                          {p.notes || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setPaymentToDelete({ id: p.id, amount: p.amount })}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                            title="Estornar/eliminar pagamento"
                            aria-label={`Estornar pagamento de ${formatCurrencyValue(p.amount, 'Kz')}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation inside Ledger Modal */}
        {paymentToDelete && (
          <div className="p-4 mx-6 mb-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="font-semibold">Confirmar estorno de pagamento?</p>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                  Deseja estornar/eliminar o pagamento de <strong>{formatCurrencyValue(paymentToDelete.amount, 'Kz')}</strong>? O saldo da dívida será recalculado e a movimentação financeira vinculada será revertida.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentToDelete(null)}
                className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Confirmar estorno
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {payments.length} pagamento(s) registado(s)
          </span>
          <div className="flex items-center gap-2">
            {calcs.remainingAmount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewPayment(debt);
                }}
                className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs cursor-pointer"
              >
                Registar novo pagamento
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
