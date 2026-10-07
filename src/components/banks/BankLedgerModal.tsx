import React, { useState } from 'react';
import {
  X,
  Building2,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Plus,
  Search,
  Trash2,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  History,
} from 'lucide-react';
import { Bank, BankMovement } from '../../types/stock';
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
  const {
    bankMovements,
    getBankBalance,
    reverseBankMovement,
    isBankOperationBlocked,
  } = useStock();

  const [activeTab, setActiveTab] = useState<'ativas' | 'removidas'>('ativas');
  const [filterType, setFilterType] = useState<string>('todas');
  const [search, setSearch] = useState<string>('');

  // Removal dialog state
  const [movementToRemove, setMovementToRemove] = useState<BankMovement | null>(null);
  const [removalReason, setRemovalReason] = useState<string>('');
  const [removalError, setRemovalError] = useState<string | null>(null);

  if (!isOpen || !bank) return null;

  const bankBlockInfo = isBankOperationBlocked(bank.id);

  const currentBalance = getBankBalance(bank.id);

  // Separate active and removed movements for this specific bank
  const bankAllMovements = bankMovements.filter((m) => m.bankId === bank.id);
  const activeMovements = bankAllMovements;
  const removedMovements = bankAllMovements.filter((m) => m.isReversed || m.reversalOfId);

  const currentList = activeTab === 'ativas' ? activeMovements : removedMovements;

  const filteredMovements = currentList
    .filter((mov) => {
      if (filterType !== 'todas' && mov.type !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchReason = mov.reason.toLowerCase().includes(q);
        const matchRef = mov.reference?.toLowerCase().includes(q);
        const matchResp = mov.responsible.toLowerCase().includes(q);
        const matchRemovalReason = (mov.reversalReason || '').toLowerCase().includes(q);
        return matchReason || matchRef || matchResp || matchRemovalReason;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenRemoval = (mov: BankMovement) => {
    setMovementToRemove(mov);
    setRemovalReason('');
    setRemovalError(null);
  };

  const handleConfirmRemoval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!removalReason.trim()) {
      setRemovalError('O motivo do estorno é obrigatório.');
      return;
    }

    if (movementToRemove) {
      try {
        reverseBankMovement(movementToRemove.id, removalReason.trim(), 'Administrador');
      } catch (error) {
        setRemovalError(error instanceof Error ? error.message : 'Não foi possível estornar.');
        return;
      }
      setMovementToRemove(null);
      setRemovalReason('');
      setRemovalError(null);
    }
  };


  return (
    <div
      id="modal-bank-ledger-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-bank-ledger-card"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] max-h-[820px] min-h-[560px] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
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
                {bankBlockInfo.blocked && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Empresa Parada — Operações Bloqueadas
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {bank.accountNumber ? `Nº Conta: ${bank.accountNumber}` : 'Conta Bancária'}
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

        {/* View Selection Tabs (Ativas vs Removidas do Histórico) */}
        <div className="shrink-0 px-6 pt-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
          <div className="flex gap-4">
            <button
              type="button"
              id="tab-ledger-ativas"
              onClick={() => setActiveTab('ativas')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'ativas'
                  ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Histórico ({activeMovements.length})
            </button>
            <button
              type="button"
              id="tab-ledger-removidas"
              onClick={() => setActiveTab('removidas')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'removidas'
                  ? 'border-rose-600 dark:border-rose-400 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Estornos ({removedMovements.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            Imutabilidade ativa: movimentações não são editáveis
          </span>
        </div>

        {/* Toolbar & Filter */}
        <div className="shrink-0 p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar extrato..."
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

          {/* Button + Nova Movimentação (Rule 3) */}
          <button
            type="button"
            id="btn-ledger-new-mov"
            onClick={() => onOpenNewMovement(bank.id)}
            title={bankBlockInfo.blocked ? 'Empresa parada — serviços indisponíveis' : 'Nova Movimentação'}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Movimentação</span>
          </button>
        </div>

        {/* Scrollable Container (Rule 5: keeps modal constant size) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-50/40 dark:bg-slate-950/20">
          {filteredMovements.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {activeTab === 'ativas'
                  ? 'Nenhuma movimentação ativa encontrada'
                  : 'Nenhum estorno registado'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                {search || filterType !== 'todas'
                  ? 'Nenhum resultado corresponde aos filtros aplicados.'
                  : activeTab === 'ativas'
                  ? 'Esta conta ainda não possui movimentações registadas no histórico.'
                  : 'Não existem estornos para esta conta bancária.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Data & Hora</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Descrição / Motivo</th>
                    <th className="py-2.5 px-3">Referência</th>
                    <th className="py-2.5 px-3">Responsável</th>
                    <th className="py-2.5 px-4 text-right">Montante</th>
                    <th className="py-2.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMovements.map((mov) => {
                    const isIncome = mov.type === 'entrada';
                    const isExpense = mov.type === 'saida';
                    const isTransfer = mov.type === 'transferencia';

                    return (
                      <tr
                        key={mov.id}
                        className={`transition-colors ${
                          mov.isReversed
                            ? 'bg-rose-50/30 dark:bg-rose-950/20 opacity-90'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                        }`}
                      >
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

                        <td className="py-2.5 px-3 max-w-xs">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate" title={mov.reason}>
                            {mov.reason}
                          </p>
                          {mov.isReversed && mov.reversalReason && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1 font-medium">
                              <span>Motivo da remoção:</span> {mov.reversalReason}
                            </p>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {mov.reference || '—'}
                        </td>

                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {mov.responsible}
                        </td>

                        <td
                          className={`py-2.5 px-4 text-right font-semibold whitespace-nowrap font-mono ${
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

                        {/* Actions Column (Rule 2: Estornar Lançamento / Restaurar) */}
                        <td className="py-2.5 px-4 whitespace-nowrap text-center">
                          {!mov.isReversed && !mov.reversalOfId ? (
                            <button type="button" onClick={() => handleOpenRemoval(mov)}
                              disabled={bankBlockInfo.blocked}
                              title={bankBlockInfo.message || 'Estornar com justificativa'}
                              aria-label="Estornar lançamento"
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-dm-muted dark:hover:text-dm-text rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : <span className="text-[10px] text-slate-500 dark:text-dm-muted">{mov.reversalOfId ? 'Estorno' : 'Estornado'}</span>}
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
        <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {activeTab === 'ativas'
              ? `Movimentações ativas: ${filteredMovements.length}`
              : `Registos de estorno: ${filteredMovements.length}`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Audit Confirmation Dialog for Removing Movement from History */}
      {movementToRemove && (
        <div
          id="modal-remove-movement-dialog"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setMovementToRemove(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Estornar Lançamento Contabilístico
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  O original será preservado e um lançamento de sentido contrário compensará o saldo.
                </p>
              </div>
            </div>

            {/* Movement Details Summary */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Tipo:</span>
                <span className="font-semibold uppercase">{movementToRemove.type}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Montante:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {formatCurrencyValue(movementToRemove.amount, bank.currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Descrição:</span>
                <span className="truncate max-w-[200px]">{movementToRemove.reason}</span>
              </div>
            </div>

            {/* Mandatory Reason Form */}
            <form onSubmit={handleConfirmRemoval} className="space-y-4">
              <div>
                <label htmlFor="removal-reason-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Motivo do Estorno (Obrigatório para Auditoria) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="removal-reason-input"
                  rows={3}
                  value={removalReason}
                  onChange={(e) => {
                    setRemovalReason(e.target.value);
                    if (removalError) setRemovalError(null);
                  }}
                  placeholder="Explique detalhadamente a razão da remoção (ex.: registo duplicado por erro do operador, montante introduzido incorretamente)..."
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-colors ${
                    removalError
                      ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-400'
                  }`}
                />
                {removalError && (
                  <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{removalError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setMovementToRemove(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-confirm-remove-mov"
                  className="px-4 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Estorno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
