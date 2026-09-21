import React from 'react';
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

  if (!isOpen || !debt) return null;

  const calcs = getDebtCalculations(debt.id);
  const payments = debtPayments
    .filter((p) => p.debtId === debt.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDeletePayment = (paymentId: string, paymentAmount: number) => {
    const confirmDelete = window.confirm(
      `Deseja estornar/eliminar o pagamento de ${formatCurrencyValue(
        paymentAmount,
        'Kz'
      )}? O saldo da dívida será recalculado e a movimentação financeira vinculada será revertida.`
    );
    if (!confirmDelete) return;

    deleteDebtPayment(paymentId);
  };

  return (
    <div
      id="modal-debt-ledger-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-debt-ledger-card"
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-debt-ledger-title" className="text-sm font-semibold text-slate-900">
                Histórico de Pagamentos — {debt.counterpartyName}
              </h3>
              <p className="text-[11px] text-slate-500">
                {debt.type === 'a_pagar' ? 'Conta a Pagar' : 'Conta a Receber'} • Total:{' '}
                {formatCurrencyValue(debt.totalAmount, 'Kz')}
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

        {/* Resumo visual de quitação */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-3 text-center font-mono text-xs">
          <div className="p-2.5 bg-white rounded-lg border border-slate-200/60">
            <span className="text-[10px] uppercase font-sans text-slate-400 block">Total da Dívida</span>
            <span className="font-semibold text-slate-800 text-sm">
              {formatCurrencyValue(debt.totalAmount, 'Kz')}
            </span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200/60">
            <span className="text-[10px] uppercase font-sans text-slate-400 block">Total Liquidado</span>
            <span className="font-semibold text-emerald-700 text-sm">
              {formatCurrencyValue(calcs.paidAmount, 'Kz')}
            </span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200/60">
            <span className="text-[10px] uppercase font-sans text-slate-400 block">Saldo Restante</span>
            <span className="font-bold text-rose-600 text-sm">
              {formatCurrencyValue(calcs.remainingAmount, 'Kz')}
            </span>
          </div>
        </div>

        {/* Lista de Pagamentos */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <History className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">Nenhum pagamento registrado</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ainda não foram efetuadas amortizações nesta dívida.
              </p>
              {calcs.remainingAmount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewPayment(debt);
                  }}
                  className="mt-3 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Registar pagamento
                </button>
              )}
            </div>
          ) : (
            <div className="border border-slate-200/80 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Conta</th>
                    <th className="py-2.5 px-3 text-right">Valor Pago</th>
                    <th className="py-2.5 px-3">Responsável</th>
                    <th className="py-2.5 px-3">Observação</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => {
                    const bank = banks.find((b) => b.id === p.bankId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                          {formatDate(p.date)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-800 font-medium">
                          {bank?.name || 'Conta Financeira'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono font-semibold text-emerald-700">
                          {formatCurrencyValue(p.amount, 'Kz')}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                          {p.responsible || 'Administrador'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                          {p.notes || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(p.id, p.amount)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {payments.length} pagamento(s) registrado(s)
          </span>
          <div className="flex items-center gap-2">
            {calcs.remainingAmount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewPayment(debt);
                }}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors shadow-xs"
              >
                Registar novo pagamento
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-white transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
