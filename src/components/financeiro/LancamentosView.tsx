import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Eye as DetailsIcon,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { BankMovement, BankMovementType, FinancialCategory } from '../../types/stock';
import { formatCurrencyValue, formatDate } from '../../utils/formatters';
import { LancamentoModal } from './LancamentoModal';
import { PositiveBadge } from '../common/PositiveBadge';
import { formatShortRef, matchRefOrFull } from '../../utils/references';

export const FINANCIAL_CATEGORIES: FinancialCategory[] = [
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

interface LancamentosViewProps {
  externalSearchQuery?: string;
  onExternalSearchChange?: (q: string) => void;
}

export const LancamentosView: React.FC<LancamentosViewProps> = ({
  externalSearchQuery,
  onExternalSearchChange,
}) => {
  const {
    banks,
    bankMovements,
    companies,
    getCompanyForBank,
    isCompanyDisabled,
    reverseBankMovement,
  } = useStock();

  // Filters
  const [search, setSearch] = useState<string>(externalSearchQuery || '');
  const [bankFilter, setBankFilter] = useState<string>('todas');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [periodFilter, setPeriodFilter] = useState<string>('todos');
  const [showRemoved, setShowRemoved] = useState<boolean>(false);

  // Sync externalSearchQuery when navigating from Recibo de Venda -> Ver entrada no Financeiro
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearch(externalSearchQuery);
      if (externalSearchQuery.trim() !== '') {
        setShowRemoved(false);
        setBankFilter('todas');
        setTypeFilter('todos');
        setCategoryFilter('todas');
        setPeriodFilter('todos');
      }
    }
  }, [externalSearchQuery]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    onExternalSearchChange?.(val);
  };

  // Modal states
  const [isNewLancamentoOpen, setIsNewLancamentoOpen] = useState<boolean>(false);
  const [movementToRemove, setMovementToRemove] = useState<BankMovement | null>(null);
  const [removalReason, setRemovalReason] = useState<string>('');
  const [removalError, setRemovalError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        if (showRemoved && !mov.isReversed && !mov.reversalOfId) return false;

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
          const matchId = matchRefOrFull(mov.id, q, 'LAN');
          const matchRef = mov.reference ? matchRefOrFull(mov.reference, q, 'DOC') : false;
          const matchReversalOf = mov.reversalOfId ? matchRefOrFull(mov.reversalOfId, q, 'LAN') : false;
          const matchResp = mov.responsible.toLowerCase().includes(q);
          const bank = banks.find((b) => b.id === mov.bankId);
          const matchBank = bank?.name.toLowerCase().includes(q);
          const matchCat = (mov.category || '').toLowerCase().includes(q);
          return matchReason || matchId || matchRef || matchReversalOf || matchResp || matchBank || matchCat;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bankMovements, showRemoved, bankFilter, typeFilter, categoryFilter, periodFilter, search, banks]);

  // Counts for tabs/badges
  const activeCount = useMemo(
    () => bankMovements.filter((m) => operationalBanks.some((b) => b.id === m.bankId)).length,
    [bankMovements, operationalBanks]
  );
  const removedCount = useMemo(
    () => bankMovements.filter((m) => (m.isReversed || m.reversalOfId) && operationalBanks.some((b) => b.id === m.bankId)).length,
    [bankMovements, operationalBanks]
  );

  const handleConfirmRemoval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementToRemove) return;

    if (!removalReason.trim()) {
      setRemovalError('O motivo do estorno é obrigatório.');
      return;
    }

    try {
      reverseBankMovement(movementToRemove.id, removalReason.trim(), 'Administrador');
    } catch (error) {
      setRemovalError(error instanceof Error ? error.message : 'Não foi possível estornar.');
      return;
    }
    setMovementToRemove(null);
    setRemovalReason('');
    setRemovalError(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & View Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-dm-text tracking-tight">
            Lançamentos Financeiros
          </h2>
          <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
            Registo unificado e imutável de todas as movimentações financeiras
          </p>
        </div>

        {/* Tab / View switch: Ativos vs Removidos */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-dm-surface border border-transparent dark:border-dm-border rounded-xl text-xs self-start sm:self-auto">
          <button
            type="button"
            id="btn-tab-lancamentos-ativos"
            onClick={() => setShowRemoved(false)}
            className={`dm-segment-btn px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              !showRemoved
                ? 'bg-white dark:bg-dm-elevated text-slate-900 dark:text-dm-text shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text'
            }`}
          >
            Histórico ({activeCount})
          </button>
          <button
            type="button"
            id="btn-tab-lancamentos-removidos"
            onClick={() => setShowRemoved(true)}
            className={`dm-segment-btn px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              showRemoved
                ? 'bg-white dark:bg-dm-elevated text-slate-900 dark:text-dm-text shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text'
            }`}
          >
            Estornos ({removedCount})
          </button>
        </div>
      </div>

      {/* Unified Filter Capsule Toolbar */}
      <div className="dm-filter-capsule bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-2xl p-1.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex flex-wrap items-center divide-x divide-slate-200/80 dark:divide-dm-border flex-1">
          {/* Conta Segment */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <label htmlFor="filter-conta" className="text-[11px] font-medium text-slate-500 dark:text-dm-muted shrink-0">
              Conta:
            </label>
            <select
              id="filter-conta"
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-slate-800 dark:text-dm-text focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas as Contas</option>
              {operationalBanks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo Segment */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <label htmlFor="filter-tipo" className="text-[11px] font-medium text-slate-500 dark:text-dm-muted shrink-0">
              Tipo:
            </label>
            <select
              id="filter-tipo"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-slate-800 dark:text-dm-text focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="entrada">Entrada (+)</option>
              <option value="saida">Saída (-)</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </div>

          {/* Categoria Segment */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <label htmlFor="filter-categoria" className="text-[11px] font-medium text-slate-500 dark:text-dm-muted shrink-0">
              Categoria:
            </label>
            <select
              id="filter-categoria"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-slate-800 dark:text-dm-text focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas as Categorias</option>
              {FINANCIAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Período Segment */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <label htmlFor="filter-periodo" className="text-[11px] font-medium text-slate-500 dark:text-dm-muted shrink-0">
              Período:
            </label>
            <select
              id="filter-periodo"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-slate-800 dark:text-dm-text focus:outline-none cursor-pointer"
            >
              <option value="todos">Todo o Histórico</option>
              <option value="hoje">Hoje</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="este_mes">Este Mês</option>
            </select>
          </div>

          {/* Search Segment */}
          <div className="flex items-center px-3 py-1.5 flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-dm-muted mr-2 shrink-0" />
            <input
              type="text"
              id="input-busca-lancamentos"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por motivo, responsável, referência (ex: VND-1001)..."
              className="w-full bg-transparent border-0 text-xs text-slate-800 dark:text-dm-text placeholder:text-slate-400 dark:placeholder:text-dm-muted focus:outline-none"
            />
            {search.trim() !== '' && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded ml-1 cursor-pointer"
                title="Limpar filtro"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Solid White Action Button at End of Capsule */}
        <button
          type="button"
          id="btn-novo-lancamento"
          onClick={() => setIsNewLancamentoOpen(true)}
          className="dm-btn-primary px-4 py-2 bg-slate-900 dark:bg-dm-text text-white dark:text-dm-page rounded-xl text-xs font-semibold hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer shrink-0"
        >
          Registar lançamento
        </button>
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
                ? 'Nenhum estorno foi registado com os filtros selecionados.'
                : 'Não há registos com os filtros selecionados ou ainda não foram realizados lançamentos.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 min-w-[320px]">Registo / Descrição</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">Tipo & Estado</th>
                  <th className="py-3 px-4 text-right min-w-[140px]">Valor</th>
                  <th className="py-3 px-4 text-right sticky right-0 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-xs min-w-[110px] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMovements.map((mov) => {
                  const bank = banks.find((b) => b.id === mov.bankId);
                  const currency = bank?.currency || 'Kz';
                  const isEntrada = mov.type === 'entrada';
                  const isSaida = mov.type === 'saida';
                  const isExpanded = expandedId === mov.id;

                  return (
                    <React.Fragment key={mov.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : mov.id)}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                          mov.isReversed ? 'bg-slate-50/40 dark:bg-slate-850/40 opacity-75' : ''
                        }`}
                      >
                        {/* Linha 1: Descrição (14px) + Ref (12-13px). Linha 2: Conta • Categoria • Data • Responsável (Item 2.9) */}
                        <td className="py-3 px-4 min-w-[320px]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                              {mov.reason}
                            </span>
                            <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                              {formatShortRef(mov.reference || mov.id, 'LAN')}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {bank?.name || 'Conta Financeira'}
                            </span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                              {mov.category || 'Outro'}
                            </span>
                            <span>•</span>
                            <span>{formatDate(mov.date)}</span>
                            <span>•</span>
                            <span>por {mov.responsible || 'Administrador'}</span>
                          </div>
                        </td>

                        {/* Tipo & Estado */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            {isEntrada && <PositiveBadge label="Entrada" />}
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
                            {mov.isReversed && (
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                                Estornado
                              </span>
                            )}
                            {mov.reversalOfId && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                Estorno
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Valor (Sempre visível à direita) */}
                        <td
                          className={`py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-sm ${
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

                        {/* Ações (Sticky right com botões 44x44px) */}
                        <td
                          className="py-2.5 px-4 whitespace-nowrap text-right sticky right-0 bg-white/95 dark:bg-slate-900/95 group-hover:bg-slate-50/95 dark:group-hover:bg-slate-800/95 backdrop-blur-xs min-w-[110px] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : mov.id)}
                              className="dm-icon-action min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg text-slate-400 dark:text-dm-muted hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-dm-elevated transition-colors cursor-pointer"
                              title={isExpanded ? 'Ocultar detalhes' : 'Ver detalhes completos'}
                            >
                              <span className="sr-only">Abrir detalhes</span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <DetailsIcon aria-hidden="true" className="w-4 h-4" />
                              )}
                            </button>

                            {!mov.isReversed && !mov.reversalOfId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMovementToRemove(mov);
                                  setRemovalReason('');
                                  setRemovalError(null);
                                }}
                                className="dm-icon-action min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 dark:text-dm-muted dark:hover:text-dm-text hover:bg-rose-50 dark:hover:bg-dm-elevated rounded-lg cursor-pointer transition-colors"
                                title="Estornar com justificativa"
                                aria-label={`Estornar lançamento de ${formatCurrencyValue(mov.amount, currency)}`}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Detalhe Expansível: motivos, referências completas e avisos de estorno (Item 2.9) */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800">
                          <td colSpan={4} className="py-3.5 px-6 text-xs">
                            <div className="space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">ID Completo:</span>
                                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300">#{mov.id}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(mov.id);
                                      setCopiedId(mov.id);
                                      setTimeout(() => setCopiedId(null), 1500);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded cursor-pointer"
                                    title="Copiar ID completo"
                                    aria-label="Copiar ID completo"
                                  >
                                    {copiedId === mov.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                {mov.reference && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">Referência Vinculada:</span>
                                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300">#{mov.reference}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(mov.reference!);
                                        setCopiedId(mov.reference!);
                                        setTimeout(() => setCopiedId(null), 1500);
                                      }}
                                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded cursor-pointer"
                                      title="Copiar referência completa"
                                      aria-label="Copiar referência completa"
                                    >
                                      {copiedId === mov.reference ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">Motivo / Descrição Completa:</span>
                                <p className="mt-0.5 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{mov.reason}</p>
                              </div>

                              {mov.reversalOfId && (
                                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-800 dark:text-amber-300 text-xs">
                                  <strong>Aviso Contabilístico:</strong> Este lançamento é um estorno vinculado ao registo <code>#{mov.reversalOfId}</code>.
                                </div>
                              )}

                              {mov.isReversed && (
                                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 text-xs">
                                  <div className="font-semibold flex items-center gap-1.5">
                                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                    Lançamento Estornado
                                  </div>
                                  <p className="mt-1">
                                    <span className="font-medium">Motivo do Estorno:</span> {mov.reversalReason || 'Justificativa não informada'} • por {mov.reversedBy || 'Administrador'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
                    Estornar Lançamento
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    O lançamento original será preservado. Um novo lançamento de sentido contrário compensará o valor na mesma conta.
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
                  Justificativa do Estorno <span className="text-rose-500">*</span>
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
