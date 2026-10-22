import { detailRowProps } from '../../utils/detailRows';
import { Eye as DetailsIcon } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Truck,
  Building2,
  Warehouse as WarehouseIcon,
  Printer,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  ArrowUpRight,
  Receipt,
  Eye,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Sale, Transport } from '../../types/stock';
import { formatCurrencyValue, formatDate, convertToKwanza } from '../../utils/formatters';
import { formatShortRef, matchRefOrFull } from '../../utils/references';
import { NewSaleModal } from './NewSaleModal';
import { SaleReceiptModal } from './SaleReceiptModal';
import { PositiveBadge } from '../common/PositiveBadge';

interface VendaViewProps {
  onGoToTransport?: (saleId?: string) => void;
  onGoToStockMovement?: (saleId: string) => void;
  onGoToFinancialEntry?: (saleId: string) => void;
  onGoToDebt?: (debtIdOrSaleId: string) => void;
  externalSearchQuery?: string;
  onExternalSearchChange?: (q: string) => void;
}

export const VendaView: React.FC<VendaViewProps> = ({
  onGoToTransport,
  onGoToStockMovement,
  onGoToFinancialEntry,
  onGoToDebt,
  externalSearchQuery,
  onExternalSearchChange,
}) => {
  const {
    sales,
    warehouses,
    companies,
    cancelSale,
    transports,
    debts,
    bankMovements,
    getDebtCalculations,
  } = useStock();

  // Search & Filter state
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [paymentFilter, setPaymentFilter] = useState<string>('todos');

  const effectiveSearch = externalSearchQuery !== undefined ? externalSearchQuery : search;

  // Modals state
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [receiptTransport, setReceiptTransport] = useState<Transport | null>(null);

  // Cancel Confirmation modal state
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1.7 Detetar se existem vendas a prazo anteriores com lançamento bancário indevido
  const legacyCreditSalesWithDirectBankCredit = useMemo(() => {
    return sales.filter((s) => {
      if (s.paymentMethod !== 'a_prazo') return false;
      return bankMovements.some(
        (bm) =>
          bm.type === 'entrada' &&
          !bm.debtPaymentId &&
          (bm.category === 'Venda' || bm.category === 'Receita') &&
          (bm.saleId === s.id || bm.reference === `Venda #${s.id}`) &&
          !bm.isRemoved &&
          !bm.reversalOfId
      );
    });
  }, [sales, bankMovements]);

  // 1.3 Estado da venda a prazo: "A prazo" → "Parcialmente paga" → "Paga"
  const getSaleDisplayStatus = (
    sale: Sale
  ): { label: string; type: 'concluida' | 'cancelada' | 'a_prazo' | 'parcialmente_paga' | 'paga' } => {
    if (sale.status === 'cancelada') {
      return { label: 'Estornada', type: 'cancelada' };
    }
    if (sale.paymentMethod === 'a_prazo') {
      const linkedDebt = debts.find(
        (d) =>
          (sale.debtId && d.id === sale.debtId) ||
          d.saleId === sale.id ||
          d.reference === `Venda #${sale.id}`
      );
      if (!linkedDebt) {
        return { label: 'A prazo', type: 'a_prazo' };
      }
      const calcs = getDebtCalculations(linkedDebt);
      if (calcs.status === 'anulada') {
        return { label: 'Estornada', type: 'cancelada' };
      }
      if (calcs.status === 'quitada' || calcs.remainingAmount <= 0) {
        return { label: 'Paga', type: 'paga' };
      }
      if (calcs.status === 'parcialmente_paga' || calcs.paidAmount > 0) {
        return { label: 'Parcialmente paga', type: 'parcialmente_paga' };
      }
      return { label: 'A prazo', type: 'a_prazo' };
    }
    return { label: 'Concluída', type: 'concluida' };
  };

  // Financial Metrics
  const metrics = useMemo(() => {
    let totalCompletedKz = 0;
    let todayCount = 0;
    let todayKz = 0;
    let withTransportCount = 0;
    let completedCount = 0;

    const todayStr = new Date().toISOString().slice(0, 10);

    sales.forEach((s) => {
      const warehouse = warehouses.find((w) => w.id === s.warehouseId);
      const company = companies.find((c) => c.id === warehouse?.companyId);
      // Empresas desativadas não contribuem para contadores, totais e indicadores
      if (company?.status === 'desativada') return;

      const currency = company?.currency || 'Kz';
      const totalKz = convertToKwanza(s.total, currency);

      if (s.status === 'concluida') {
        totalCompletedKz += totalKz;
        completedCount++;

        if (s.date.startsWith(todayStr)) {
          todayCount++;
          todayKz += totalKz;
        }

        if (s.requiresTransport) {
          withTransportCount++;
        }
      }
    });

    const averageTicketKz = completedCount > 0 ? totalCompletedKz / completedCount : 0;

    return {
      totalCompletedKz,
      todayCount,
      todayKz,
      withTransportCount,
      averageTicketKz,
      completedCount,
    };
  }, [sales, warehouses, companies]);

  // Filtered sales sorted by date desc (excludes desativada companies)
  const filteredSales = useMemo(() => {
    return sales
      .filter((sale) => {
        const warehouse = warehouses.find((w) => w.id === sale.warehouseId);
        const company = companies.find((c) => c.id === warehouse?.companyId);
        // Desativada: histórico oculto de consultas operacionais
        if (company?.status === 'desativada') return false;

        if (statusFilter !== 'todas') {
          const statusInfo = getSaleDisplayStatus(sale);
          if (statusFilter === 'concluida') {
            if (sale.status !== 'concluida') return false;
          } else if (statusFilter === 'cancelada') {
            if (sale.status !== 'cancelada') return false;
          } else if (statusFilter === 'paga') {
            if (statusInfo.type !== 'paga' && (sale.status !== 'concluida' || sale.paymentMethod === 'a_prazo')) return false;
          } else if (statusFilter === 'parcialmente_paga') {
            if (statusInfo.type !== 'parcialmente_paga') return false;
          } else if (statusFilter === 'a_prazo') {
            if (statusInfo.type !== 'a_prazo') return false;
          }
        }
        if (paymentFilter !== 'todos') {
          if (paymentFilter === 'tpa' || paymentFilter === 'multicaixa') {
            if (sale.paymentMethod !== 'tpa' && sale.paymentMethod !== 'multicaixa') return false;
          } else if (sale.paymentMethod !== paymentFilter) {
            return false;
          }
        }
        if (effectiveSearch.trim()) {
          const q = effectiveSearch.toLowerCase();
          const matchId = matchRefOrFull(sale.id, q, 'VND');
          const matchSeller = sale.seller.toLowerCase().includes(q);
          const matchClient = sale.clientName?.toLowerCase().includes(q) || false;
          const matchItem = sale.items.some((it) => it.productName.toLowerCase().includes(q));
          return matchId || matchSeller || matchClient || matchItem;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, warehouses, companies, statusFilter, paymentFilter, effectiveSearch, debts, bankMovements, getDebtCalculations]);

  const handleOpenReceipt = (sale: Sale) => {
    const tr = transports.find((t) => t.saleId === sale.id) || null;
    setReceiptTransport(tr);
    setReceiptSale(sale);
  };

  const handleConfirmCancel = () => {
    if (!saleToCancel) return;
    try {
      const wh = warehouses.find((w) => w.id === saleToCancel.warehouseId);
      const comp = companies.find((c) => c.id === wh?.companyId);
      if (comp?.status === 'parada') {
        setCancelError(`Operação bloqueada: A empresa "${comp.name}" está com status Parada. Não é possível estornar vendas.`);
        return;
      }
      if (comp?.status === 'desativada') {
        setCancelError(`Operação bloqueada: A empresa "${comp.name}" está desativada.`);
        return;
      }
      const res = cancelSale(saleToCancel.id, cancelReason.trim() || undefined);
      if (res && !res.success) {
        setCancelError(res.message || 'Erro ao estornar a venda.');
        return;
      }
      setSaleToCancel(null);
      setCancelReason('');
      setCancelError(null);
    } catch (err: any) {
      setCancelError(err?.message || 'Erro ao estornar a venda.');
    }
  };

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case 'dinheiro':
        return <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200">Numerário</span>;
      case 'tpa':
      case 'multicaixa':
        return <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[11px] font-medium border border-sky-200">Multicaixa</span>;
      case 'transferencia':
        return <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] font-medium border border-indigo-200">Transferência</span>;
      case 'a_prazo':
        return <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">A Prazo</span>;
      default:
        return <span>{method}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Caixa • Terminal de Vendas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de vendas no balcão com baixa atômica de estoque e crédito bancário automático
          </p>
        </div>

        {/* Single primary creation action (Bloco 4: 'Nova venda' no cabeçalho, 44-48px, sem '+') */}
        <button
          type="button"
          id="btn-open-pos-sale"
          onClick={() => setIsNewSaleModalOpen(true)}
          className="dm-btn-primary min-h-[44px] h-11 inline-flex items-center justify-center gap-2 px-6 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.99] cursor-pointer shrink-0"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Nova venda</span>
        </button>
      </div>

      {/* 1.7 Aviso de Vendas a Prazo Antigas com Crédito Bancário Indevido */}
      {legacyCreditSalesWithDirectBankCredit.length > 0 && (
        <div
          id="banner-warning-credit-sales-with-bank-credit"
          className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">
                Aviso: Vendas a prazo anteriores com crédito bancário indevido ({legacyCreditSalesWithDirectBankCredit.length})
              </p>
              <p className="text-[11px] leading-relaxed">
                Foram detetadas as seguintes vendas a prazo registadas no histórico com crédito direto na conta bancária. Conforme a regra de auditoria, os movimentos originais foram preservados:
              </p>
              <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
                {legacyCreditSalesWithDirectBankCredit.map((s) => (
                  <li key={s.id}>
                    Venda #{s.id} — Total: {formatCurrencyValue(s.total, 'Kz')} ({s.clientName || 'Cliente'}) • Data: {formatDate(s.date)}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Pode utilizar a ação de Estorno para repor o estoque e anular a dívida/crédito, ou mantê-las como arquivo histórico.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Consolidado */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Faturamento Realizado</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">
              {formatCurrencyValue(metrics.totalCompletedKz, 'Kz')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{metrics.completedCount} vendas finalizadas</p>
        </div>

        {/* Vendas Hoje */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Vendas de Hoje</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">
              {metrics.todayCount}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              ({formatCurrencyValue(metrics.todayKz, 'Kz')})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total faturado na data atual</p>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ticket Médio</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">
              {formatCurrencyValue(metrics.averageTicketKz, 'Kz')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Média por recibo emitido</p>
        </div>

        {/* Vendas com Transporte (Clickable to navigate to Transporte submenu) */}
        <div
          id="card-metric-transporte"
          role="button"
          tabIndex={0}
          onClick={() => onGoToTransport?.()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onGoToTransport?.();
            }
          }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-sm cursor-pointer transition-all group active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          title="Clique para ir ao submenu Transporte"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 group-hover:text-sky-700 transition-colors">
              Entregas / Transporte
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-100 group-hover:text-sky-700 transition-colors flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-sky-900">
              {metrics.withTransportCount}
            </span>
            <span className="text-xs text-slate-400">pedidos com entrega</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-sky-600 transition-colors">
            <span>Sincronizado com Transporte</span>
            <span className="font-semibold flex items-center gap-0.5 text-sky-600 opacity-80 group-hover:opacity-100">
              Aceder &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Unified Filter Capsule Toolbar */}
      <div className="dm-filter-capsule flex flex-col sm:flex-row items-center justify-between gap-2 bg-white dark:bg-dm-surface p-1.5 rounded-2xl border border-slate-200 dark:border-dm-border shadow-xs">
        <div className="flex flex-wrap items-center divide-x divide-slate-200/80 dark:divide-dm-border flex-1 w-full">
          {/* Status Filter Segment */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs">
            <span className="font-medium text-slate-500 dark:text-dm-muted">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-0 text-xs text-slate-800 dark:text-dm-text font-semibold focus:outline-none cursor-pointer"
            >
              <option value="todas">Todos os Estados</option>
              <option value="concluida">Todas as Concluídas / Válidas</option>
              <option value="paga">Pagas</option>
              <option value="parcialmente_paga">Parcialmente pagas</option>
              <option value="a_prazo">A prazo (Pendentes)</option>
              <option value="cancelada">Canceladas / Estornadas</option>
            </select>
          </div>

          {/* Payment Filter Segment */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs">
            <span className="font-medium text-slate-500 dark:text-dm-muted">Pagamento:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-transparent border-0 text-xs text-slate-800 dark:text-dm-text font-semibold focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos os Pagamentos</option>
              <option value="dinheiro">Numerário</option>
              <option value="tpa">Multicaixa</option>
              <option value="transferencia">Transferência</option>
              <option value="a_prazo">A Prazo</option>
            </select>
          </div>

          {/* Search Segment */}
          <div className="flex items-center px-3.5 py-1.5 flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-dm-muted mr-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por ID, produto ou vendedor..."
              className="w-full bg-transparent border-0 text-xs text-slate-900 dark:text-dm-text placeholder:text-slate-400 dark:placeholder:text-dm-muted focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-[150px] min-w-[120px] max-w-[160px]">Ref. Venda</th>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Armazém / Empresa</th>
                <th className="py-2.5 px-3">Artigos</th>
                <th className="py-2.5 px-3">Vendedor</th>
                <th className="py-2.5 px-3">Pagamento</th>
                <th className="py-2.5 px-3">Transporte</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-4 text-right sticky right-0 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-xs min-w-[110px] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Nenhuma venda encontrada para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const warehouse = warehouses.find((w) => w.id === sale.warehouseId);
                  const company = companies.find((c) => c.id === warehouse?.companyId);
                  const isCompleted = sale.status === 'concluida';
                  const itemsCount = sale.items.reduce((acc, it) => acc + it.quantity, 0);

                  return (
                    <tr {...detailRowProps(() => handleOpenReceipt(sale))} key={sale.id} className="cursor-pointer hover:bg-slate-50/60 transition-colors group">
                      {/* Ref. Venda: Curta 120-160px com cópia de ID completo (Item 2.4 e 2.7) */}
                      <td className="py-3 px-3 w-[150px] min-w-[120px] max-w-[160px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {formatShortRef(sale.id, 'VND')}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(sale.id);
                              setCopiedId(sale.id);
                              setTimeout(() => setCopiedId(null), 1500);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded cursor-pointer"
                            title={`Copiar identificador completo (#${sale.id})`}
                            aria-label="Copiar ID completo"
                          >
                            {copiedId === sale.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {formatDate(sale.date)}
                      </td>

                      <td className="py-3 px-3 text-slate-800 whitespace-nowrap">
                        {sale.clientName ? (
                          <span className="font-semibold text-slate-900">{sale.clientName}</span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Consumidor Final</span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-medium text-slate-800 block">{warehouse?.name || 'Armazém'}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-400">{company?.name || 'Empresa'}</span>
                          {company?.status === 'parada' && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                              Parada
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-700 max-w-xs">
                        <div className="truncate font-medium" title={sale.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}>
                          {sale.items[0]?.productName}
                          {sale.items.length > 1 && (
                            <span className="text-[11px] text-slate-400 ml-1">
                              (+{sale.items.length - 1} outros)
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {itemsCount} {itemsCount === 1 ? 'unidade' : 'unidades'} no total
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        {sale.seller}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {getPaymentBadge(sale.paymentMethod)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {sale.requiresTransport ? (
                          <button
                            type="button"
                            onClick={() => onGoToTransport?.(sale.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 font-medium bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition-colors cursor-pointer"
                            title={`Ver registo de transporte da venda #${sale.id}`}
                          >
                            <Truck className="w-3 h-3 text-sky-600" />
                            Sim
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Balcão</span>
                        )}
                      </td>

                      {/* Total sempre visível (Item 2.4 & 8.2) */}
                      <td className="py-3 px-4 text-right tabular-nums font-semibold text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrencyValue(sale.total, company?.currency || 'Kz')}
                      </td>

                      {/* Estado sempre visível (Item 1.3 & 2.4) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {(() => {
                          const statusInfo = getSaleDisplayStatus(sale);
                          if (statusInfo.type === 'cancelada') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                Estornada
                              </span>
                            );
                          }
                          if (statusInfo.type === 'paga') {
                            return <PositiveBadge label="Paga" />;
                          }
                          if (statusInfo.type === 'parcialmente_paga') {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                Parcialmente paga
                              </span>
                            );
                          }
                          if (statusInfo.type === 'a_prazo') {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                A prazo
                              </span>
                            );
                          }
                          return <PositiveBadge label="Concluída" />;
                        })()}
                      </td>

                      {/* Ações sempre visíveis à direita com ícones 44x44px (Item 2.4) */}
                      <td
                        className="py-2.5 px-4 text-right whitespace-nowrap sticky right-0 bg-white/95 dark:bg-slate-900/95 group-hover:bg-slate-50/95 dark:group-hover:bg-slate-800/95 backdrop-blur-xs min-w-[110px] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(sale)}
                            className="dm-icon-action min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg text-slate-400 dark:text-dm-muted hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-dm-elevated transition-colors cursor-pointer"
                            title="Ver Recibo de Venda"
                          >
                            <span className="sr-only">Abrir detalhes</span>
                            <DetailsIcon aria-hidden="true" className="w-4 h-4" />
                          </button>

                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => {
                                if (company?.status === 'parada') return;
                                setSaleToCancel(sale);
                                setCancelReason('');
                                setCancelError(null);
                              }}
                              disabled={company?.status === 'parada'}
                              className={`dm-icon-action min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg transition-colors ${
                                company?.status === 'parada'
                                  ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                                  : 'text-slate-400 hover:text-rose-600 dark:text-dm-muted dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'
                              }`}
                              title={
                                company?.status === 'parada'
                                  ? 'Operação bloqueada: Empresa Parada'
                                  : 'Estornar venda (devolve ao estoque e estorna o banco)'
                              }
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel / Reverse Sale Confirmation Modal */}
      {saleToCancel && (
        <div
          id="modal-cancel-sale-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div
            id="modal-cancel-sale-card"
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 text-rose-600 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Estornar Venda #{saleToCancel.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Operação contábil de cancelamento e reposição
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSaleToCancel(null)}
                aria-label="Fechar"
                title="Fechar"
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors -mr-2 -mt-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cancelError && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {cancelError}
              </div>
            )}

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1.5 mb-4">
              <p className="font-semibold">Esta ação realizará automaticamente:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                <li>Gera movimentação de <span className="font-semibold">Entrada</span> devolvendo cada artigo ao estoque do armazém.</li>
                <li>Gera movimentação de <span className="font-semibold">Saída</span> no banco estornando o valor recebido.</li>
                <li>Se houver transporte em andamento, o status passa para cancelado.</li>
              </ul>
            </div>

            <div className="mb-4">
              <label htmlFor="cancel-sale-reason" className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo do Estorno <span className="text-rose-500">*</span>
              </label>
              <input
                id="cancel-sale-reason"
                required
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex.: Devolução do cliente ou erro na cobrança"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSaleToCancel(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                id="btn-confirm-cancel-sale"
                disabled={!cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors"
              >
                Confirmar Estorno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Sale Modal */}
      <NewSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={() => setIsNewSaleModalOpen(false)}
        onSaleCompleted={(sale, transport) => {
          setReceiptSale(sale);
          setReceiptTransport(transport || null);
        }}
      />

      {/* Sale Receipt Modal */}
      <SaleReceiptModal
        sale={receiptSale}
        transport={receiptTransport}
        isOpen={Boolean(receiptSale)}
        onClose={() => setReceiptSale(null)}
        onGoToTransport={onGoToTransport}
        onGoToStockMovement={onGoToStockMovement}
        onGoToFinancialEntry={onGoToFinancialEntry}
        onGoToDebt={onGoToDebt}
      />
    </div>
  );
};
