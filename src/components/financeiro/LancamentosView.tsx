import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { BankMovement, BankMovementType, FinancialCategory } from '../../types/stock';
import { formatCurrencyValue, formatDate } from '../../utils/formatters';
import { LancamentoModal } from './LancamentoModal';

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

export const LancamentosView: React.FC = () => {
  const {
    banks,
    bankMovements,
    companies,
    getCompanyForBank,
    isCompanyDisabled,
    removeFinancialMovement,
    restoreFinancialMovement,
  } = useStock();

  // Filters
  const [search, setSearch] = useState<string>('');
  const [bankFilter, setBankFilter] = useState<string>('todas');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [periodFilter, setPeriodFilter] = useState<string>('todos');
  const [showRemoved, setShowRemoved] = useState<boolean>(false);

  // Modal states
  const [isNewLancamentoOpen, setIsNewLancamentoOpen] = useState<boolean>(false);
  const [movementToRemove, setMovementToRemove] = useState<BankMovement | null>(null);
  const [removalReason, setRemovalReason] = useState<string>('');
  const [removalError, setRemovalError] = useState<string | null>(null);

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

  // Filtered movements sorted in reverse chronological order
  const filteredMovements = useMemo(() => {
    return bankMovements
      .filter((mov) => {
        // Exclude movements belonging to disabled companies
        const bank = banks.find((b) => b.id === mov.bankId);
        if (!bank) return false;
        if (bank.id === 'bank-kianda') {
          const kiandaComp = companies.find((c) => c.id === 'comp-kianda');
          if (kiandaComp ? kiandaComp.status === 'desativada' : true) return false;
        }
        const comp = getCompanyForBank(bank.id);
        if (comp && (comp.status === 'desativada' || isCompanyDisabled(comp.id))) return false;
        // Removed filter
        if (!showRemoved && mov.isRemoved) return false;
        if (showRemoved && !mov.isRemoved) return false;

        // Bank filter
        if (bankFilter !== 'todas' && mov.bankId !== bankFilter) return false;

        // Type filter
        if (typeFilter !== 'todos' && mov.type !== typeFilter) return false;

        // Category filter
        if (categoryFilter !== 'todas') {
          const movCat = mov.category || 'Outro';
          if (movCat !== categoryFilter) return false;
        }

        // Period filter
        if (periodFilter !== 'todos') {
          const movDate = new Date(mov.date);
          const now = new Date();
          if (periodFilter === 'hoje') {
            const isToday =
              movDate.getDate() === now.getDate() &&
              movDate.getMonth() === now.getMonth() &&
              movDate.getFullYear() === now.getFullYear();
            if (!isToday) return false;
          } else if (periodFilter === '7dias') {
            const diffDays = (now.getTime() - movDate.getTime()) / (1000 * 3600 * 24);
            if (diffDays > 7 || diffDays < 0) return false;
          } else if (periodFilter === 'este_mes') {
            const isThisMonth =
              movDate.getMonth() === now.getMonth() &&
              movDate.getFullYear() === now.getFullYear();
            if (!isThisMonth) return false;
          }
        }

        // Search text
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchReason = mov.reason.toLowerCase().includes(q);
          const matchRef = mov.reference?.toLowerCase().includes(q);
          const matchResp = mov.responsible.toLowerCase().includes(q);
          const bank = banks.find((b) => b.id === mov.bankId);
          const matchBank = bank?.name.toLowerCase().includes(q);
          const matchCat = (mov.category || '').toLowerCase().includes(q);
          return matchReason || matchRef || matchResp || matchBank || matchCat;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bankMovements, showRemoved, bankFilter, typeFilter, categoryFilter, periodFilter, search, banks]);

  // Counts for tabs/badges
  const activeCount = useMemo(
    () => bankMovements.filter((m) => !m.isRemoved).length,
    [bankMovements]
  );
  const removedCount = useMemo(
    () => bankMovements.filter((m) => m.isRemoved).length,
    [bankMovements]
  );

  const handleConfirmRemoval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementToRemove) return;

    if (!removalReason.trim()) {
      setRemovalError('O motivo da remoção é obrigatório para conformidade de auditoria.');
      return;
    }

    removeFinancialMovement(movementToRemove.id, removalReason.trim(), 'Administrador');
    setMovementToRemove(null);
    setRemovalReason('');
    setRemovalError(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Lançamentos Financeiros
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registo unificado e imutável de todas as movimentações financeiras
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            id="btn-novo-lancamento"
            onClick={() => setIsNewLancamentoOpen(true)}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs cursor-pointer"
          >
            Registar lançamento
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3.5">
        {/* Row 1: Search & Toggles */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              id="input-busca-lancamentos"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por motivo, responsável, referência..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
            />
          </div>

          {/* Tab / View switch: Ativos vs Removidos */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs self-start md:self-auto">
            <button
              type="button"
              id="btn-tab-lancamentos-ativos"
              onClick={() => setShowRemoved(false)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                !showRemoved
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Ativos ({activeCount})
            </button>
            <button
              type="button"
              id="btn-tab-lancamentos-removidos"
              onClick={() => setShowRemoved(true)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                showRemoved
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Removidos do Histórico ({removedCount})
            </button>
          </div>
        </div>

        {/* Row 2: Select Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label htmlFor="filter-conta" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Conta
            </label>
            <select
              id="filter-conta"
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
            >
              <option value="todas">Todas as Contas</option>
              {operationalBanks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.currency})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-tipo" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Tipo
            </label>
            <select
              id="filter-tipo"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="entrada">Entrada (+)</option>
              <option value="saida">Saída (-)</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-categoria" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Categoria
            </label>
            <select
              id="filter-categoria"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
            >
              <option value="todas">Todas as Categorias</option>
              {FINANCIAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-periodo" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Período
            </label>
            <select
              id="filter-periodo"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
            >
              <option value="todos">Todo o Histórico</option>
              <option value="hoje">Hoje</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="este_mes">Este Mês</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Movements */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        {filteredMovements.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Nenhum lançamento financeiro encontrado
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {showRemoved
                ? 'Nenhum lançamento foi removido com justificativa de auditoria.'
                : 'Não há registos com os filtros selecionados ou ainda não foram realizados lançamentos.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-medium uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Conta</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4">Motivo / Observação</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMovements.map((mov) => {
                  const bank = banks.find((b) => b.id === mov.bankId);
                  const currency = bank?.currency || 'Kz';
                  const isEntrada = mov.type === 'entrada';
                  const isSaida = mov.type === 'saida';

                  return (
                    <tr
                      key={mov.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        mov.isRemoved ? 'bg-slate-50/40 dark:bg-slate-850/40 opacity-75' : ''
                      }`}
                    >
                      {/* Data */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {formatDate(mov.date)}
                      </td>

                      {/* Conta */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {bank?.name || 'Conta Financeira'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">
                          {currency}
                        </span>
                      </td>

                      {/* Tipo Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isEntrada && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                            Entrada
                          </span>
                        )}
                        {isSaida && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                            Saída
                          </span>
                        )}
                        {!isEntrada && !isSaida && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Ajuste
                          </span>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {mov.category || 'Outro'}
                        </span>
                      </td>

                      {/* Valor */}
                      <td
                        className={`py-3 px-4 whitespace-nowrap text-right font-mono font-semibold ${
                          isEntrada
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : isSaida
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {isEntrada ? '+' : isSaida ? '-' : ''}
                        {formatCurrencyValue(mov.amount, currency)}
                      </td>

                      {/* Responsável */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {mov.responsible || 'Administrador'}
                      </td>

                      {/* Motivo / Observação */}
                      <td className="py-3 px-4 min-w-[220px]">
                        <p className="text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">
                          {mov.reason}
                        </p>
                        {mov.reference && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 block">
                            Ref: {mov.reference}
                          </span>
                        )}
                        {mov.isRemoved && (
                          <div className="mt-1 p-1.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900 rounded text-[10px] text-rose-700 dark:text-rose-300">
                            <span className="font-semibold">Removido do histórico:</span> {mov.removedReason} (por {mov.removedBy || 'Administrador'})
                          </div>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        {!mov.isRemoved ? (
                          <button
                            type="button"
                            onClick={() => {
                              setMovementToRemove(mov);
                              setRemovalReason('');
                              setRemovalError(null);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Remover do histórico com justificativa"
                            aria-label={`Remover lançamento de ${formatCurrencyValue(mov.amount, currency)} do histórico`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => restoreFinancialMovement(mov.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Restaurar ao histórico ativo"
                            aria-label="Restaurar ao histórico ativo"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Novo Lançamento */}
      <LancamentoModal
        isOpen={isNewLancamentoOpen}
        onClose={() => setIsNewLancamentoOpen(false)}
      />

      {/* Modal de Confirmação de Remoção com Auditoria */}
      {movementToRemove && (
        <div
          id="modal-remover-lancamento-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            id="modal-remover-lancamento-card"
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Remover Lançamento do Histórico
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Conforme as regras de auditoria, o registo não é eliminado permanentemente da base, mas marcado como removido com justificativa obrigatória.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-delete-movement-modal"
                onClick={() => setMovementToRemove(null)}
                aria-label="Fechar"
                title="Fechar"
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors -mr-1 -mt-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRemoval} className="p-5 space-y-4">
              {removalError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{removalError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/70 dark:border-slate-700 text-xs space-y-1">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Valor:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                    {formatCurrencyValue(
                      movementToRemove.amount,
                      banks.find((b) => b.id === movementToRemove.bankId)?.currency || 'Kz'
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Motivo original:</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate max-w-[200px] text-right">
                    {movementToRemove.reason}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="textarea-motivo-remocao" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Justificativa da Remoção <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="textarea-motivo-remocao"
                  rows={3}
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  placeholder="Ex: Lançamento duplicado por engano, cancelamento de operação..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMovementToRemove(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-confirmar-remocao-lancamento"
                  className="px-4 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Confirmar Remoção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
