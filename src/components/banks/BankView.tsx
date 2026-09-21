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
    return companies.find((c) => c.principalBankId === bankId);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Gestão Bancária & Caixa
          </h1>
          <p className="text-xs text-slate-500 mt-1">
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
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors shadow-xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
            <span>Nova Movimentação</span>
          </button>

          <button
            type="button"
            id="btn-open-new-bank-modal"
            onClick={() => {
              setBankToEdit(null);
              setIsBankModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <span>Registar conta</span>
          </button>
        </div>
      </div>

      {/* Delete error notification if audit check blocked */}
      {deleteErrorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{deleteErrorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 font-semibold"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Total Consolidado */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Saldo Consolidado</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">
              {formatCurrencyValue(metrics.totalConsolidatedKz, 'Kz')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Conversão global em Kwanza</p>
        </div>

        {/* Contas Ativas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Contas Ativas</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">
              {metrics.activeAccountsCount}
            </span>
            <span className="text-xs text-slate-400">de {banks.length} contas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Instituições e caixas configurados</p>
        </div>

        {/* Entradas do Mês */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Entradas (Mês)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-emerald-600">
              +{formatCurrencyValue(metrics.monthInflowKz, 'Kz')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Vendas e depósitos do período</p>
        </div>

        {/* Saídas do Mês */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Saídas (Mês)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-rose-600">
              -{formatCurrencyValue(metrics.monthOutflowKz, 'Kz')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Despesas e transferências</p>
        </div>
      </div>

      {/* Tabs / View Mode Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-4">
          <button
            type="button"
            id="tab-bancos-contas"
            onClick={() => setActiveTab('contas')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'contas'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Contas & Saldos ({filteredBanks.length})
          </button>
          <button
            type="button"
            id="tab-bancos-historico"
            onClick={() => setActiveTab('historico')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'historico'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por banco, conta ou IBAN..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
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
                  className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all ${
                    bank.type === 'banco_padrao' ? 'border-blue-200/80 bg-linear-to-b from-blue-50/20 to-white' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon, Name, Type */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          bank.type === 'banco_padrao'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {bank.type === 'caixa_fisico' ? (
                            <Wallet className="w-4 h-4" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                            {bank.name}
                          </h3>
                          <span className="text-[11px] text-slate-500">
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
                        {bank.type === 'banco_padrao' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Banco Padrão
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            bank.status === 'ativa'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {bank.status === 'ativa' ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </div>

                    {/* Account Details */}
                    <div className="mt-3.5 space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                      {bank.accountNumber && (
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Nº Conta:</span>
                          <span className="font-mono">{bank.accountNumber}</span>
                        </div>
                      )}
                      {bank.iban && (
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">IBAN:</span>
                          <span className="font-mono truncate max-w-[180px]" title={bank.iban}>
                            {bank.iban}
                          </span>
                        </div>
                      )}
                      {linkedCompany && (
                        <div className="flex items-center gap-1 text-sky-700 font-medium pt-1 border-t border-slate-200/60 mt-1">
                          <ShieldCheck className="w-3 h-3 text-sky-600 shrink-0" />
                          <span>Banco Principal: {linkedCompany.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Live Balance Section */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
                        Saldo Atual em Carteira
                      </span>
                      <div className="text-lg font-bold text-slate-900 mt-0.5">
                        {formatCurrencyValue(balance, bank.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      id={`btn-bank-ledger-${bank.id}`}
                      onClick={() => setLedgerBank(bank)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                      title="Ver histórico e extrato de lançamentos"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
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
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Registrar movimentação nesta conta"
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
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar conta"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        id={`btn-bank-delete-${bank.id}`}
                        onClick={() => handleDeleteBank(bank.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir conta (sujeito a regras de auditoria)"
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Histórico Consolidado de Movimentações ({globalMovements.length})
            </h3>

            <button
              type="button"
              onClick={() => {
                setMovementTargetBankId(null);
                setIsMovementModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>Lançamento Manual</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Data</th>
                  <th className="py-2.5 px-3">Conta Bancária</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Descrição / Motivo</th>
                  <th className="py-2.5 px-3">Referência</th>
                  <th className="py-2.5 px-3">Responsável</th>
                  <th className="py-2.5 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {globalMovements.map((mov) => {
                  const bank = banks.find((b) => b.id === mov.bankId);
                  const isIncome = mov.type === 'entrada';
                  const isExpense = mov.type === 'saida';
                  const isTransfer = mov.type === 'transferencia';

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(mov.date)}
                      </td>

                      <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                        {bank?.name || 'Conta Removida'}
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

                      <td className="py-2.5 px-3 font-medium text-slate-800 max-w-sm truncate" title={mov.reason}>
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
          setLedgerBank(null);
          setMovementTargetBankId(bankId);
          setIsMovementModalOpen(true);
        }}
      />
    </div>
  );
};
