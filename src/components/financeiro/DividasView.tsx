import React, { useState, useMemo } from 'react';
import {
  HandCoins,
  Search,
  Filter,
  CreditCard,
  History,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Debt, DebtType } from '../../types/stock';
import { formatCurrencyValue, formatDate } from '../../utils/formatters';
import { DebtModal } from './DebtModal';
import { DebtPaymentModal } from './DebtPaymentModal';
import { DebtLedgerModal } from './DebtLedgerModal';

type DebtFilterTab = 'todas' | 'a_pagar' | 'a_receber' | 'vencidas';

export const DividasView: React.FC = () => {
  const { debts, companies, deleteDebt, getDebtCalculations } = useStock();

  // Filters
  const [activeTab, setActiveTab] = useState<DebtFilterTab>('todas');
  const [search, setSearch] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Modals
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<Debt | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetDebt, setPaymentTargetDebt] = useState<Debt | null>(null);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [ledgerTargetDebt, setLedgerTargetDebt] = useState<Debt | null>(null);

  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Consolidated Metrics
  const metrics = useMemo(() => {
    let totalAReceberRestante = 0;
    let totalAPagarRestante = 0;
    let totalVencido = 0;
    let totalQuitado = 0;

    debts.forEach((d) => {
      const calcs = getDebtCalculations(d.id);
      if (calcs.status === 'quitada') {
        totalQuitado += d.totalAmount;
      } else {
        if (d.type === 'a_receber') {
          totalAReceberRestante += calcs.remainingAmount;
        } else {
          totalAPagarRestante += calcs.remainingAmount;
        }
        if (calcs.isOverdue) {
          totalVencido += calcs.remainingAmount;
        }
      }
    });

    return {
      totalAReceberRestante,
      totalAPagarRestante,
      saldoLiquido: totalAReceberRestante - totalAPagarRestante,
      totalVencido,
      totalQuitado,
    };
  }, [debts, getDebtCalculations]);

  // Filtered Debts
  const filteredDebts = useMemo(() => {
    return debts
      .filter((d) => {
        const calcs = getDebtCalculations(d.id);

        // Tab filter
        if (activeTab === 'a_pagar' && d.type !== 'a_pagar') return false;
        if (activeTab === 'a_receber' && d.type !== 'a_receber') return false;
        if (activeTab === 'vencidas' && !calcs.isOverdue) return false;

        // Company filter
        if (companyFilter !== 'todas' && d.companyId !== companyFilter) return false;

        // Status filter
        if (statusFilter !== 'todos' && calcs.status !== statusFilter) return false;

        // Search text
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = d.counterpartyName.toLowerCase().includes(q);
          const matchNotes = (d.notes || '').toLowerCase().includes(q);
          const comp = companies.find((c) => c.id === d.companyId);
          const matchCompany = (comp?.name || '').toLowerCase().includes(q);
          return matchName || matchNotes || matchCompany;
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [debts, activeTab, companyFilter, statusFilter, search, companies, getDebtCalculations]);

  const handleDeleteDebt = (debt: Debt) => {
    setErrorMessage(null);
    const res = deleteDebt(debt.id);
    if (!res.success) {
      setErrorMessage(res.message || 'Não foi possível eliminar a dívida.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Gestão de Dívidas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Controlo de contas a pagar a fornecedores e valores a receber de clientes
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            id="btn-registar-divida"
            onClick={() => {
              setDebtToEdit(null);
              setIsDebtModalOpen(true);
            }}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs cursor-pointer"
          >
            Registar dívida
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 font-semibold text-xs cursor-pointer"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total a Receber */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">A Receber</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
              {formatCurrencyValue(metrics.totalAReceberRestante, 'Kz')}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              Saldo pendente de clientes e terceiros
            </span>
          </div>
        </div>

        {/* Total a Pagar */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">A Pagar</span>
            <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
              {formatCurrencyValue(metrics.totalAPagarRestante, 'Kz')}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              Obrigações com fornecedores e terceiros
            </span>
          </div>
        </div>

        {/* Saldo Líquido de Dívidas */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Saldo Previsional</span>
            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <HandCoins className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span
              className={`text-lg font-bold font-mono ${
                metrics.saldoLiquido >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {metrics.saldoLiquido >= 0 ? '+' : ''}
              {formatCurrencyValue(metrics.saldoLiquido, 'Kz')}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              Diferença líquida (A receber - A pagar)
            </span>
          </div>
        </div>

        {/* Total Vencido */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Vencido</span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400 font-mono">
              {formatCurrencyValue(metrics.totalVencido, 'Kz')}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              Prazos ultrapassados pendentes de quitação
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3.5">
        {/* Row 1: Tabs & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs overflow-x-auto self-start md:self-auto">
            <button
              type="button"
              id="tab-dividas-todas"
              onClick={() => setActiveTab('todas')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'todas'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Todas ({debts.length})
            </button>
            <button
              type="button"
              id="tab-dividas-a-pagar"
              onClick={() => setActiveTab('a_pagar')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'a_pagar'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              A Pagar ({debts.filter((d) => d.type === 'a_pagar').length})
            </button>
            <button
              type="button"
              id="tab-dividas-a-receber"
              onClick={() => setActiveTab('a_receber')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'a_receber'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              A Receber ({debts.filter((d) => d.type === 'a_receber').length})
            </button>
            <button
              type="button"
              id="tab-dividas-vencidas"
              onClick={() => setActiveTab('vencidas')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'vencidas'
                  ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Vencidas ({debts.filter((d) => getDebtCalculations(d.id).isOverdue).length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              id="input-busca-dividas"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por contraparte, empresa..."
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
            />
          </div>
        </div>

        {/* Row 2: Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label htmlFor="filter-dividas-empresa" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Empresa MyOffice
            </label>
            <select
              id="filter-dividas-empresa"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
            >
              <option value="todas">Todas as Empresas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-dividas-status" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Estado de Quitação
            </label>
            <select
              id="filter-dividas-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
            >
              <option value="todos">Todos os Estados</option>
              <option value="pendente">Pendente (nada pago)</option>
              <option value="parcialmente_paga">Parcialmente Paga</option>
              <option value="quitada">Quitada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Debts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        {filteredDebts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500">
              <HandCoins className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Nenhuma dívida encontrada
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Não existem registros com os filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-medium uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Contraparte</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Empresa</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-right">Valor Pago</th>
                  <th className="py-3 px-4 text-right">Restante</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDebts.map((debt) => {
                  const calcs = getDebtCalculations(debt.id);
                  const isAPagar = debt.type === 'a_pagar';
                  const comp = companies.find((c) => c.id === debt.companyId);
                  const progressPct =
                    debt.totalAmount > 0
                      ? Math.min(100, Math.round((calcs.paidAmount / debt.totalAmount) * 100))
                      : 0;

                  return (
                    <tr key={debt.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Contraparte */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                          {debt.counterpartyName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                          {debt.counterpartyType}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isAPagar ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60">
                            A Pagar
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
                            A Receber
                          </span>
                        )}
                      </td>

                      {/* Empresa */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {comp?.name || 'Empresa'}
                      </td>

                      {/* Valor Total */}
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                        {formatCurrencyValue(debt.totalAmount, 'Kz')}
                      </td>

                      {/* Valor Pago */}
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                        {formatCurrencyValue(calcs.paidAmount, 'Kz')}
                      </td>

                      {/* Restante + Barra de progresso */}
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono">
                        <span
                          className={`font-semibold ${
                            calcs.remainingAmount === 0 ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {formatCurrencyValue(calcs.remainingAmount, 'Kz')}
                        </span>
                        <div className="w-16 ml-auto mt-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </td>

                      {/* Vencimento */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {debt.dueDate ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                              {formatDate(debt.dueDate)}
                            </span>
                            {calcs.isOverdue && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 uppercase">
                                Vencida
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {calcs.status === 'quitada' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            Quitada
                          </span>
                        )}
                        {calcs.status === 'parcialmente_paga' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                            Parcial ({progressPct}%)
                          </span>
                        )}
                        {calcs.status === 'pendente' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Pendente
                          </span>
                        )}
                      </td>

                      {/* Ações (Apenas ícones, com aria-label descritivo) */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {/* Registar Pagamento (só se não quitada) */}
                          {calcs.remainingAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentTargetDebt(debt);
                                setIsPaymentModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                              title={isAPagar ? 'Registar pagamento' : 'Registar recebimento'}
                              aria-label={`Registar pagamento para ${debt.counterpartyName}`}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Ver Histórico de Pagamentos */}
                          <button
                            type="button"
                            onClick={() => {
                              setLedgerTargetDebt(debt);
                              setIsLedgerModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Histórico de pagamentos"
                            aria-label={`Ver histórico de pagamentos de ${debt.counterpartyName}`}
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar Dívida (apenas ícone de lápis) */}
                          <button
                            type="button"
                            onClick={() => {
                              setDebtToEdit(debt);
                              setIsDebtModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Editar dívida"
                            aria-label={`Editar dívida de ${debt.counterpartyName}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar Dívida (apenas ícone de lixeira) */}
                          <button
                            type="button"
                            onClick={() => setDebtToDelete(debt)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar dívida"
                            aria-label={`Eliminar dívida de ${debt.counterpartyName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal to Delete Debt */}
      {debtToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Eliminar Dívida
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tem a certeza que deseja eliminar a dívida de <strong className="text-slate-800 dark:text-slate-200">"{debtToDelete.counterpartyName}"</strong> no valor total de <strong className="text-slate-800 dark:text-slate-200">{formatCurrencyValue(debtToDelete.totalAmount, 'Kz')}</strong>?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDebtToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const debt = debtToDelete;
                  setDebtToDelete(null);
                  handleDeleteDebt(debt);
                }}
                className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Eliminar dívida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setDebtToEdit(null);
        }}
        debtToEdit={debtToEdit}
      />

      <DebtPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentTargetDebt(null);
        }}
        debt={paymentTargetDebt}
      />

      <DebtLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => {
          setIsLedgerModalOpen(false);
          setLedgerTargetDebt(null);
        }}
        debt={ledgerTargetDebt}
        onOpenNewPayment={(d) => {
          setPaymentTargetDebt(d);
          setIsPaymentModalOpen(true);
        }}
      />
    </div>
  );
};
