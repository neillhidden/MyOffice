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
  ArrowUpRight,
  Receipt,
  Eye,
  X,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Sale, Transport } from '../../types/stock';
import { formatCurrencyValue, formatDate, convertToKwanza } from '../../utils/formatters';
import { NewSaleModal } from './NewSaleModal';
import { SaleReceiptModal } from './SaleReceiptModal';

interface VendaViewProps {
  onGoToTransport?: () => void;
}

export const VendaView: React.FC<VendaViewProps> = ({ onGoToTransport }) => {
  const { sales, warehouses, companies, cancelSale, transports } = useStock();

  // Search & Filter state
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [paymentFilter, setPaymentFilter] = useState<string>('todos');

  // Modals state
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [receiptTransport, setReceiptTransport] = useState<Transport | null>(null);

  // Cancel Confirmation modal state
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelError, setCancelError] = useState<string | null>(null);

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

        if (statusFilter !== 'todas' && sale.status !== statusFilter) return false;
        if (paymentFilter !== 'todos' && sale.paymentMethod !== paymentFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchId = sale.id.toLowerCase().includes(q);
          const matchSeller = sale.seller.toLowerCase().includes(q);
          const matchClient = sale.clientName?.toLowerCase().includes(q) || false;
          const matchItem = sale.items.some((it) => it.productName.toLowerCase().includes(q));
          return matchId || matchSeller || matchClient || matchItem;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, warehouses, companies, statusFilter, paymentFilter, search]);

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
      cancelSale(saleToCancel.id, cancelReason.trim() || undefined);
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
        return <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[11px] font-medium border border-sky-200">TPA / Multicaixa</span>;
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

        {/* Highlighted 'Vender' button per user instructions */}
        <button
          type="button"
          id="btn-open-pos-sale"
          onClick={() => setIsNewSaleModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-[0.99]"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Vender (Nova Venda)</span>
        </button>
      </div>

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
          onClick={onGoToTransport}
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

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por ID, produto ou vendedor..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="todas">Todos os Estados</option>
            <option value="concluida">Apenas Concluídas</option>
            <option value="cancelada">Canceladas / Estornadas</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="todos">Todos os Pagamentos</option>
            <option value="dinheiro">Numerário</option>
            <option value="tpa">TPA / Multicaixa</option>
            <option value="transferencia">Transferência</option>
            <option value="a_prazo">A Prazo</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Ref. Venda</th>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Armazém / Empresa</th>
                <th className="py-2.5 px-3">Artigos</th>
                <th className="py-2.5 px-3">Vendedor</th>
                <th className="py-2.5 px-3">Pagamento</th>
                <th className="py-2.5 px-3">Transporte</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-4 text-right">Ações</th>
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
                    <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        #{sale.id}
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
                            onClick={onGoToTransport}
                            className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 font-medium bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition-colors cursor-pointer"
                            title="Clique para ir ao submenu Transporte"
                          >
                            <Truck className="w-3 h-3 text-sky-600" />
                            Sim
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Balcão</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrencyValue(sale.total, company?.currency || 'Kz')}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Concluída
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Estornada
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(sale)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Ver Recibo de Venda"
                          >
                            <Printer className="w-3.5 h-3.5" />
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
                              className={`p-1.5 rounded-lg transition-colors ${
                                company?.status === 'parada'
                                  ? 'text-slate-300 cursor-not-allowed opacity-50'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={
                                company?.status === 'parada'
                                  ? 'Operação bloqueada: Empresa Parada'
                                  : 'Estornar venda (devolve ao estoque e estorna o banco)'
                              }
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
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
                Motivo do Estorno <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                id="cancel-sale-reason"
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
      />
    </div>
  );
};
