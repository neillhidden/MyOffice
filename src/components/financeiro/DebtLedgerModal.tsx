import React, { useState } from 'react';
import { X, History, Trash2, CheckCircle2, AlertCircle, PlusCircle, TrendingUp } from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Debt } from '../../types/stock';
import { formatCurrencyValue, formatDate } from '../../utils/formatters';

interface DebtLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  onOpenNewPayment: (debt: Debt) => void;
  onOpenIncrement?: (debt: Debt) => void;
}

export const DebtLedgerModal: React.FC<DebtLedgerModalProps> = ({
  isOpen,
  onClose,
  debt,
  onOpenNewPayment,
  onOpenIncrement,
}) => {
  const { banks, debtPayments, deleteDebtPayment, getDebtCalculations } = useStock();
  const [activeTab, setActiveTab] = useState<'pagamentos' | 'acrescimos'>('pagamentos');
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; amount: number } | null>(null);

  if (!isOpen || !debt) return null;

  const calcs = getDebtCalculations(debt.id);
  const payments = debtPayments
    .filter((p) => p.debtId === debt.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const increments = debt.increments || [];

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
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl h-[85vh] max-h-[750px] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-debt-ledger-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Extrato da Dívida — {debt.counterpartyName}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {debt.type === 'a_pagar' ? 'Conta a Pagar' : 'Conta a Receber'} • Valor Total:{' '}
                {formatCurrencyValue(debt.totalAmount, debt.currency || 'Kz')}
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
        <div className="shrink-0 p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 text-center font-mono text-xs">
          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-sans text-slate-400 dark:text-slate-500 block">Total Acumulado</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {formatCurrencyValue(debt.totalAmount, debt.currency || 'Kz')}
            </span>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-sans text-slate-400 dark:text-slate-500 block">Total Liquidado</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
              {formatCurrencyValue(calcs.paidAmount, debt.currency || 'Kz')}
            </span>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-sans text-slate-400 dark:text-slate-500 block">Saldo Restante</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
              {formatCurrencyValue(calcs.remainingAmount, debt.currency || 'Kz')}
            </span>
          </div>
        </div>

        {/* Tabs: Pagamentos vs Acréscimos */}
        <div className="shrink-0 px-6 pt-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20 flex items-center justify-between">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('pagamentos')}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'pagamentos'
                  ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Pagamentos & Amortizações ({payments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('acrescimos')}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'acrescimos'
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Acréscimos ao Valor ({increments.length})</span>
            </button>
          </div>

          {onOpenIncrement && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenIncrement(debt);
              }}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <PlusCircle className="w-3 h-3" />
              <span>+ Acrescentar Valor</span>
            </button>
          )}
        </div>

        {/* Content Body with internal scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'pagamentos' ? (
            payments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center">
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
                            {formatCurrencyValue(p.amount, debt.currency || 'Kz')}
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
                              aria-label={`Estornar pagamento de ${formatCurrencyValue(p.amount, debt.currency || 'Kz')}`}
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
            )
          ) : (
            /* Tab Acréscimos (Rule 6) */
            increments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sem acréscimos adicionais</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Esta dívida mantém o valor inicial original de {formatCurrencyValue(debt.initialAmount || debt.totalAmount, debt.currency || 'Kz')}.
                </p>
                {onOpenIncrement && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenIncrement(debt);
                    }}
                    className="mt-3 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                  >
                    Acrescentar valor a esta dívida
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Valor Inicial:</span>
                    <span className="ml-1.5 font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {formatCurrencyValue(debt.initialAmount || debt.totalAmount, debt.currency || 'Kz')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Total Acrescentado:</span>
                    <span className="ml-1.5 font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                      +{formatCurrencyValue(
                        increments.reduce((acc, inc) => acc + inc.amount, 0),
                        debt.currency || 'Kz'
                      )}
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200/80 dark:border-slate-700/80 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3 text-right">Valor Acrescido</th>
                        <th className="py-2.5 px-3">Motivo / Justificativa</th>
                        <th className="py-2.5 px-3">Referência</th>
                        <th className="py-2.5 px-3">Responsável</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {increments.map((inc) => (
                        <tr key={inc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {formatDate(inc.date)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono font-bold text-indigo-700 dark:text-indigo-400">
                            +{formatCurrencyValue(inc.amount, debt.currency || 'Kz')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium">
                            {inc.reason}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {inc.reference || '—'}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {inc.responsible}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>

        {/* Delete Confirmation inside Ledger Modal */}
        {paymentToDelete && (
          <div className="shrink-0 p-4 mx-6 mb-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="font-semibold">Confirmar estorno de pagamento?</p>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                  Deseja estornar/eliminar o pagamento de <strong>{formatCurrencyValue(paymentToDelete.amount, debt.currency || 'Kz')}</strong>? O saldo da dívida será recalculado e a movimentação financeira vinculada será revertida.
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
        <div className="shrink-0 px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {activeTab === 'pagamentos'
              ? `${payments.length} pagamento(s) registado(s)`
              : `${increments.length} acréscimo(s) registado(s)`}
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
                Registar pagamento
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
