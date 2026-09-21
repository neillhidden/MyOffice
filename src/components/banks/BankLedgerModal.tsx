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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-bank-ledger-card"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-bank-ledger-title" className="text-base font-semibold text-slate-900">
                  {bank.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-200 text-slate-700">
                  {bank.currency}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    bank.status === 'ativa'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {bank.status === 'ativa' ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {bank.accountNumber ? `Nº Conta: ${bank.accountNumber}` : 'Conta'}
                {bank.iban ? ` • IBAN: ${bank.iban}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                Saldo Atual
              </span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrencyValue(currentBalance, bank.currency)}
              </span>
            </div>

            <button
              type="button"
              id="btn-close-bank-ledger-modal"
              onClick={onClose}
              aria-label="Fechar"
              title="Fechar"
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar histórico..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
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
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Movimentação</span>
          </button>
        </div>

        {/* Table of Movements */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Nenhuma movimentação registada</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {search || filterType !== 'todas'
                  ? 'Nenhum resultado corresponde aos filtros aplicados.'
                  : 'Esta conta ainda não possui movimentações no histórico contábil.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Data & Hora</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Descrição / Motivo</th>
                    <th className="py-2.5 px-3">Referência</th>
                    <th className="py-2.5 px-3">Responsável</th>
                    <th className="py-2.5 px-4 text-right">Montante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMovements.map((mov) => {
                    const isIncome = mov.type === 'entrada';
                    const isExpense = mov.type === 'saida';
                    const isTransfer = mov.type === 'transferencia';

                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                          {formatDate(mov.date)}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isIncome && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                              Entrada
                            </span>
                          )}
                          {isExpense && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <ArrowDownRight className="w-3 h-3 text-rose-600" />
                              Saída
                            </span>
                          )}
                          {isTransfer && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                              <ArrowLeftRight className="w-3 h-3 text-sky-600" />
                              Transf.
                            </span>
                          )}
                          {mov.type === 'ajuste' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <SlidersHorizontal className="w-3 h-3 text-amber-600" />
                              Ajuste
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs truncate" title={mov.reason}>
                          {mov.reason}
                        </td>

                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                          {mov.reference || '—'}
                        </td>

                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {mov.responsible}
                        </td>

                        <td
                          className={`py-2.5 px-4 text-right font-semibold whitespace-nowrap ${
                            isIncome
                              ? 'text-emerald-600'
                              : isExpense
                              ? 'text-rose-600'
                              : 'text-slate-800'
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
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Total de registos: {filteredMovements.length}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
