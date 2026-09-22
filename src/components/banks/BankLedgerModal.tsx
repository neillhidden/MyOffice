import React, { useState } from 'react';
import { X, Building2, ArrowDownRight, ArrowUpRight, ArrowLeftRight, SlidersHorizontal, Plus, Search, Calendar } from 'lucide-react';
import { Bank } from '../../types/stock';
import { useStock } from '../../context/StockContext';
import { formatCurrencyValue, formatDate } from '../../utils/formatters';

interface BankLedgerModalProps {
  bank: Bank | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenNewMovement: (bankId: string) => void;
}

export const BankLedgerModal: React.FC<BankLedgerModalProps> = ({
  bank,
  isOpen,
  onClose,
  onOpenNewMovement,
}) => {
  const { getBankBalance, getBankMovements } = useStock();
  const [filterType, setFilterType] = useState<string>('todas');
  const [search, setSearch] = useState<string>('');

  if (!isOpen || !bank) return null;

  const movements = getBankMovements(bank.id);
  const currentBalance = getBankBalance(bank.id);

  const filteredMovements = movements.filter((mov) => {
    if (filterType !== 'todas' && mov.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchReason = mov.reason.toLowerCase().includes(q);
      const matchRef = mov.reference?.toLowerCase().includes(q);
      const matchResp = mov.responsible.toLowerCase().includes(q);
      return matchReason || matchRef || matchResp;
    }
    return true;
  });

  return (
    <div
      id="modal-bank-ledger-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-bank-ledger-card"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-bank-ledger-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {bank.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {bank.currency}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    bank.status === 'ativa'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {bank.status === 'ativa' ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {bank.accountNumber ? `Nº Conta: ${bank.accountNumber}` : 'Conta'}
                {bank.iban ? ` • IBAN: ${bank.iban}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block">
                Saldo Atual
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatCurrencyValue(currentBalance, bank.currency)}
              </span>
            </div>

            <button
              type="button"
              id="btn-close-bank-ledger-modal"
              onClick={onClose}
              aria-label="Fechar"
              title="Fechar"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar histórico..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
            >
              <option value="todas">Todos os Tipos</option>
              <option value="entrada">Apenas Entradas (+)</option>
              <option value="saida">Apenas Saídas (-)</option>
              <option value="transferencia">Transferências</option>
              <option value="ajuste">Ajustes</option>
            </select>
          </div>

          <button
            type="button"
            id="btn-ledger-new-mov"
            onClick={() => onOpenNewMovement(bank.id)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Movimentação</span>
          </button>
        </div>

        {/* Table of Movements */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nenhuma movimentação registada</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                {search || filterType !== 'todas'
                  ? 'Nenhum resultado corresponde aos filtros aplicados.'
                  : 'Esta conta ainda não possui movimentações no histórico contabilístico.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Data & Hora</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Descrição / Motivo</th>
                    <th className="py-2.5 px-3">Referência</th>
                    <th className="py-2.5 px-3">Responsável</th>
                    <th className="py-2.5 px-4 text-right">Montante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMovements.map((mov) => {
                    const isIncome = mov.type === 'entrada';
                    const isExpense = mov.type === 'saida';
                    const isTransfer = mov.type === 'transferencia';

                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(mov.date)}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isIncome && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Entrada
                            </span>
                          )}
                          {isExpense && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                              <ArrowDownRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              Saída
                            </span>
                          )}
                          {isTransfer && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                              <ArrowLeftRight className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                              Transf.
                            </span>
                          )}
                          {mov.type === 'ajuste' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <SlidersHorizontal className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              Ajuste
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate" title={mov.reason}>
                          {mov.reason}
                        </td>

                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {mov.reference || '—'}
                        </td>

                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {mov.responsible}
                        </td>

                        <td
                          className={`py-2.5 px-4 text-right font-semibold whitespace-nowrap ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatCurrencyValue(mov.amount, bank.currency)}
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
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Total de registos: {filteredMovements.length}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
