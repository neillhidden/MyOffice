import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Search,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  FileText,
  CreditCard,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Bank } from '../../types/stock';
import { formatCurrencyValue, formatDate, convertToKwanza } from '../../utils/formatters';
import { BankModal } from './BankModal';
import { BankMovementModal } from './BankMovementModal';
import { BankLedgerModal } from './BankLedgerModal';

export const BankView: React.FC = () => {
  const {
    banks,
    bankMovements,
    companies,
    getBankBalance,
    addBank,
    updateBank,
    deleteBank,
    getCompanyForBank,
  } = useStock();

  // Search & Filter state
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('todas');
  const [activeTab, setActiveTab] = useState<'contas' | 'historico'>('contas');

  // Modals state
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankToEdit, setBankToEdit] = useState<Bank | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementTargetBankId, setMovementTargetBankId] = useState<string | null>(null);

  const [ledgerBank, setLedgerBank] = useState<Bank | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Consolidated KPIs
  const metrics = useMemo(() => {
    let totalConsolidatedKz = 0;
    let activeAccountsCount = 0;

    banks.forEach((bank) => {
      const bal = getBankBalance(bank.id);
      totalConsolidatedKz += convertToKwanza(bal, bank.currency);
      if (bank.status === 'ativo' || (bank.status as string) === 'ativa') activeAccountsCount++;
    });

    // Inflow & Outflow this month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthInflowKz = 0;
    let monthOutflowKz = 0;

    bankMovements.forEach((mov) => {
      const d = new Date(mov.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const bank = banks.find((b) => b.id === mov.bankId);
        const curr = bank?.currency || 'Kz';
        const valKz = convertToKwanza(mov.amount, curr);

        if (mov.type === 'entrada') {
          monthInflowKz += valKz;
        } else if (mov.type === 'saida') {
          monthOutflowKz += valKz;
        }
      }
    });

    return {
      totalConsolidatedKz,
      activeAccountsCount,
      monthInflowKz,
      monthOutflowKz,
    };
  }, [banks, bankMovements, getBankBalance]);

  // Filtered Banks
  const filteredBanks = useMemo(() => {
    return banks.filter((b) => {
      if (typeFilter !== 'todas' && b.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = b.name.toLowerCase().includes(q);
        const matchAcc = b.accountNumber?.toLowerCase().includes(q);
        const matchIban = b.iban?.toLowerCase().includes(q);
        return matchName || matchAcc || matchIban;
      }
      return true;
    });
  }, [banks, typeFilter, search]);

  // Global Movements list sorted by date
  const globalMovements = useMemo(() => {
    return [...bankMovements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [bankMovements]);

  const handleDeleteBank = (bankId: string) => {
    setDeleteErrorMessage(null);
    const result = deleteBank(bankId);
    if (!result.success && result.message) {
      setDeleteErrorMessage(result.message);
    }
  };

  const getCompanyLinkedToBank = (bankId: string) => {
    return getCompanyForBank(bankId);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Gestão Bancária & Caixa
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Contas bancárias corporativas, saldos consolidados e histórico auditável de tesouraria
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="btn-open-bank-movement-modal"
            onClick={() => {
              setMovementTargetBankId(null);
              setIsMovementModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Nova Movimentação</span>
          </button>

          <button
            type="button"
            id="btn-open-new-bank-modal"
            onClick={() => {
              setBankToEdit(null);
              setIsBankModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <span>Registar conta</span>
          </button>
        </div>
      </div>

      {/* Delete error notification if audit check blocked */}
      {deleteErrorMessage && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{deleteErrorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 font-semibold cursor-pointer"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Total Consolidado */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Saldo Consolidado</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrencyValue(metrics.totalConsolidatedKz, 'Kz')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Conversão global em Kwanza</p>
        </div>

        {/* Contas Ativas */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Contas Ativas</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {metrics.activeAccountsCount}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">de {banks.length} contas</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Instituições e caixas configurados</p>
        </div>

        {/* Entradas do Mês */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Entradas (Mês)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              +{formatCurrencyValue(metrics.monthInflowKz, 'Kz')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Vendas e depósitos do período</p>
        </div>

        {/* Saídas do Mês */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Saídas (Mês)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
              -{formatCurrencyValue(metrics.monthOutflowKz, 'Kz')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Despesas e transferências</p>
        </div>
      </div>

      {/* Tabs / View Mode Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-4">
          <button
            type="button"
            id="tab-bancos-contas"
            onClick={() => setActiveTab('contas')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'contas'
                ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Contas & Saldos ({filteredBanks.length})
          </button>
          <button
            type="button"
            id="tab-bancos-historico"
            onClick={() => setActiveTab('historico')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'historico'
                ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Extrato Geral Consolidado ({bankMovements.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Bank Accounts Cards */}
      {activeTab === 'contas' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por banco, conta ou IBAN..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
              >
                <option value="todas">Todos os Tipos de Conta</option>
                <option value="banco_padrao">Banco padrão da empresa</option>
                <option value="corrente">Conta Corrente</option>
                <option value="poupanca">Conta Poupança</option>
                <option value="caixa_fisico">Caixa Físico</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBanks.map((bank) => {
              const balance = getBankBalance(bank.id);
              const linkedCompany = getCompanyLinkedToBank(bank.id);

              return (
                <div
                  key={bank.id}
                  id={`card-bank-${bank.id}`}
                  className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                    bank.type === 'banco_padrao'
                      ? 'border-blue-200/80 dark:border-blue-800/80 bg-linear-to-b from-blue-50/20 dark:from-blue-950/20 to-white dark:to-slate-900 hover:border-blue-300 dark:hover:border-blue-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon, Name, Type */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          bank.type === 'banco_padrao'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {bank.type === 'caixa_fisico' ? (
                            <Wallet className="w-4 h-4" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                            {bank.name}
                          </h3>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {bank.type === 'banco_padrao'
                              ? 'Banco padrão da empresa'
                              : bank.type === 'caixa_fisico'
                              ? 'Caixa Físico'
                              : bank.type === 'poupanca'
                              ? 'Poupança'
                              : bank.type === 'carteira_digital'
                              ? 'Carteira Digital'
                              : 'Conta Corrente'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {linkedCompany?.status === 'parada' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Parada
                          </span>
                        )}
                        {bank.type === 'banco_padrao' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Banco Padrão
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            bank.status === 'ativa'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {bank.status === 'ativa' ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </div>

                    {/* Account Details */}
                    <div className="mt-3.5 space-y-1 bg-slate-50/70 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/80 text-[11px]">
                      {bank.accountNumber && (
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400 dark:text-slate-500">Nº Conta:</span>
                          <span className="font-mono">{bank.accountNumber}</span>
                        </div>
                      )}
                      {bank.iban && (
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400 dark:text-slate-500">IBAN:</span>
                          <span className="font-mono truncate max-w-[180px]" title={bank.iban}>
                            {bank.iban}
                          </span>
                        </div>
                      )}
                      {linkedCompany && (
                        <div className={`flex items-center gap-1 font-medium pt-1 border-t border-slate-200/60 dark:border-slate-700 mt-1 ${
                          linkedCompany.status === 'parada'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-sky-700 dark:text-sky-400'
                        }`}>
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                          <span>
                            Banco Principal: {linkedCompany.name}
                            {linkedCompany.status === 'parada' ? ' (Parada)' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Live Balance Section */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 block">
                        Saldo Atual em Carteira
                      </span>
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {formatCurrencyValue(balance, bank.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      id={`btn-bank-ledger-${bank.id}`}
                      onClick={() => setLedgerBank(bank)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      title="Ver histórico e extrato de lançamentos"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Extrato</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        id={`btn-bank-mov-${bank.id}`}
                        onClick={() => {
                          setMovementTargetBankId(bank.id);
                          setIsMovementModalOpen(true);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          linkedCompany?.status === 'parada'
                            ? 'text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={
                          linkedCompany?.status === 'parada'
                            ? 'Empresa parada — serviços indisponíveis'
                            : 'Registar movimentação nesta conta'
                        }
                        aria-label="Registar movimentação nesta conta"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        id={`btn-bank-edit-${bank.id}`}
                        onClick={() => {
                          setBankToEdit(bank);
                          setIsBankModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Editar conta"
                        aria-label="Editar conta"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        id={`btn-bank-delete-${bank.id}`}
                        onClick={() => handleDeleteBank(bank.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar conta (sujeito a regras de auditoria)"
                        aria-label="Eliminar conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Global Movements Table */}
      {activeTab === 'historico' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Histórico Consolidado de Movimentações ({globalMovements.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Data</th>
                  <th className="py-2.5 px-3">Conta Bancária</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Descrição / Motivo</th>
                  <th className="py-2.5 px-3">Referência</th>
                  <th className="py-2.5 px-3">Responsável</th>
                  <th className="py-2.5 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {globalMovements.map((mov) => {
                  const bank = banks.find((b) => b.id === mov.bankId);
                  const isIncome = mov.type === 'entrada';
                  const isExpense = mov.type === 'saida';
                  const isTransfer = mov.type === 'transferencia';

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(mov.date)}
                      </td>

                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {bank?.name || 'Conta Removida'}
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

                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 max-w-sm truncate" title={mov.reason}>
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
                        {formatCurrencyValue(mov.amount, bank?.currency || 'Kz')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <BankModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onSave={(data) => {
          if (bankToEdit) {
            updateBank(bankToEdit.id, data);
          } else {
            addBank(data);
          }
        }}
        bankToEdit={bankToEdit}
      />

      <BankMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        preSelectedBankId={movementTargetBankId}
      />

      <BankLedgerModal
        bank={ledgerBank}
        isOpen={Boolean(ledgerBank)}
        onClose={() => setLedgerBank(null)}
        onOpenNewMovement={(bankId) => {
          setMovementTargetBankId(bankId);
          setIsMovementModalOpen(true);
        }}
      />
    </div>
  );
};
