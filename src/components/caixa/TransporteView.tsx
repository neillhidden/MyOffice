import { detailRowProps } from '../../utils/detailRows';
import { Eye as DetailsIcon } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  User,
  Calendar,
  AlertCircle,
  FileText,
  Edit2,
  ExternalLink,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Transport, TransportStatus } from '../../types/stock';
import { formatCurrencyValue, formatDate } from '../../utils/formatters';
import { formatShortRef, matchRefOrFull } from '../../utils/references';
import { TransportModal } from './TransportModal';
import { PositiveBadge } from '../common/PositiveBadge';

interface TransporteViewProps {
  onOpenSaleReceipt?: (saleId: string) => void;
  externalSearchQuery?: string;
  onExternalSearchChange?: (q: string) => void;
}

export const TransporteView: React.FC<TransporteViewProps> = ({
  onOpenSaleReceipt,
  externalSearchQuery,
  onExternalSearchChange,
}) => {
  const { transports, sales, warehouses, companies, isCompanyDisabled, isWarehouseDisabled, updateTransport } = useStock();

  // Search & Filter state
  const [search, setSearch] = useState<string>(externalSearchQuery || '');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Modal state
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copiedSaleId, setCopiedSaleId] = useState<string | null>(null);

  // Sync externalSearchQuery when navigating from Venda ("Sim") or Recibo de Venda
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearch(externalSearchQuery);
      if (externalSearchQuery.trim() !== '') {
        setStatusFilter('todos');
      }
    }
  }, [externalSearchQuery]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    onExternalSearchChange?.(val);
  };

  // Visible transports: excludes transports associated with disabled companies
  // Also guarantees that any sale with requiresTransport: true has a linked transport record
  const visibleTransports = useMemo(() => {
    const baseList = [...transports];
    const coveredSaleIds = new Set(baseList.map((t) => t.saleId).filter(Boolean));

    sales.forEach((sale) => {
      if (sale.requiresTransport && !coveredSaleIds.has(sale.id)) {
        const wh = warehouses.find((w) => w.id === sale.warehouseId);
        baseList.push({
          id: sale.transportId || `TRP-${sale.id.replace('VND-', '')}`,
          saleId: sale.id,
          deliveryAddress: sale.notes || `Entrega a partir de ${wh?.name || 'Armazém'}`,
          responsible: sale.seller || 'Administrador',
          cost: 0,
          status: sale.status === 'cancelada' ? 'cancelado' : 'pendente',
          createdAt: sale.date,
          notes: sale.notes,
        });
      }
    });

    return baseList.filter((t) => {
      if (
        t.id.includes('KND') ||
        t.saleId?.includes('KND') ||
        t.driver?.toLowerCase().includes('kianda') ||
        t.vehicle?.toLowerCase().includes('kianda')
      ) {
        const kiandaComp = companies.find((c) => c.id === 'comp-kianda');
        if (kiandaComp ? kiandaComp.status === 'desativada' : true) return false;
      }

      const sale = sales.find((s) => s.id === t.saleId);
      const wh = warehouses.find((w) => w.id === sale?.warehouseId);
      const comp = companies.find((c) => c.id === wh?.companyId);
      if (comp && (comp.status === 'desativada' || isCompanyDisabled(comp.id))) return false;
      if (sale?.warehouseId && isWarehouseDisabled(sale.warehouseId)) return false;
      return true;
    });
  }, [transports, sales, warehouses, companies, isCompanyDisabled, isWarehouseDisabled]);

  // Status metrics
  const metrics = useMemo(() => {
    let pending = 0;
    let inTransit = 0;
    let delivered = 0;
    let totalCost = 0;

    visibleTransports.forEach((t) => {
      if (t.status === 'pendente') pending++;
      else if (t.status === 'em_transito') inTransit++;
      else if (t.status === 'entregue') delivered++;
      totalCost += t.cost;
    });

    return {
      total: visibleTransports.length,
      pending,
      inTransit,
      delivered,
      totalCost,
    };
  }, [visibleTransports]);

  // Filtered transports sorted by creation desc
  const filteredTransports = useMemo(() => {
    return visibleTransports
      .filter((t) => {
        if (statusFilter !== 'todos' && t.status !== statusFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchId = matchRefOrFull(t.id, q, 'TRP');
          const matchSaleId = matchRefOrFull(t.saleId, q, 'VND');
          const matchAddr = t.deliveryAddress.toLowerCase().includes(q);
          const matchDriver = t.driver?.toLowerCase().includes(q);
          const matchVehicle = t.vehicle?.toLowerCase().includes(q);
          const matchTrack = t.trackingCode?.toLowerCase().includes(q);
          return Boolean(matchId || matchSaleId || matchAddr || matchDriver || matchVehicle || matchTrack);
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [visibleTransports, statusFilter, search]);

  const handleQuickAdvanceStatus = (transport: Transport) => {
    if (transport.status === 'pendente') {
      updateTransport(transport.id, { status: 'em_transito' });
    } else if (transport.status === 'em_transito') {
      updateTransport(transport.id, {
        status: 'entregue',
        deliveredAt: new Date().toISOString(),
      });
    }
  };

  const getStatusBadge = (status: TransportStatus) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pendente
          </span>
        );
      case 'em_transito':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            <Truck className="w-3 h-3 text-sky-600" />
            Em Trânsito
          </span>
        );
      case 'entregue':
        return <PositiveBadge label="Entregue" />;
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Caixa • Rastreio de Transporte & Entregas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhamento logístico de entregas domiciliares originadas no terminal de vendas
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registos */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Expedições</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {metrics.total}
            </span>
            <span className="text-xs text-slate-400">pedidos</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Histórico completo de entregas</p>
        </div>

        {/* Pendentes */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pendentes</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-[#FCD34D] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-amber-800 dark:text-[#FCD34D]">
              {metrics.pending}
            </span>
            <span className="text-xs text-slate-400">aguardando envio</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Aguardando motorista / separação</p>
        </div>

        {/* Em Trânsito (Bloco 3.2: no escuro, usa o azul de informação #7DD3FC garantindo contraste >= 4.5:1) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Em Rota / Trânsito</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#075985] dark:text-[#7DD3FC] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-[#075985] dark:text-[#7DD3FC]">
              {metrics.inTransit}
            </span>
            <span className="text-xs text-slate-400">na rua</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Entregas em circulação</p>
        </div>

        {/* Entregues */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Entregues com Sucesso</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-[#6EE7B7] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-emerald-800 dark:text-[#6EE7B7]">
              {metrics.delivered}
            </span>
            <span className="text-xs text-slate-400">concluídas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Concluídas com confirmação</p>
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
              <option value="todos">Todos os Estados</option>
              <option value="pendente">Apenas Pendentes</option>
              <option value="em_transito">Em Trânsito</option>
              <option value="entregue">Apenas Entregues</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>

          {/* Search Segment */}
          <div className="flex items-center px-3.5 py-1.5 flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-dm-muted mr-2 shrink-0" />
            <input
              type="text"
              id="input-search-transports"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Pesquisar por venda (ex: VND-1001), endereço, motorista..."
              className="w-full bg-transparent border-0 text-xs text-slate-900 dark:text-dm-text placeholder:text-slate-400 dark:placeholder:text-dm-muted focus:outline-none"
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

        <button
          type="button"
          onClick={() => {}}
          className="dm-btn-primary px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-dm-text dark:text-dm-page rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          Pesquisar
        </button>
      </div>

      {/* Transports Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4 w-[140px] min-w-[120px]">Ref. Transporte</th>
                <th className="py-2.5 px-3 w-[150px] min-w-[120px]">Venda Vinculada</th>
                <th className="py-2.5 px-3 w-[280px] min-w-[240px] max-w-[320px]">Endereço de Destino</th>
                <th className="py-2.5 px-3">Motorista & Viatura</th>
                <th className="py-2.5 px-3">Previsão Entrega</th>
                <th className="py-2.5 px-3 text-right">Taxa Frete</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-4 text-right sticky right-0 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-xs min-w-[140px] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhuma entrega registada nos critérios selecionados.
                  </td>
                </tr>
              ) : (
                filteredTransports.map((transport) => {
                  const sale = sales.find((s) => s.id === transport.saleId);
                  const warehouse = warehouses.find((w) => w.id === sale?.warehouseId);
                  const company = companies.find((c) => c.id === warehouse?.companyId);

                  return (
                    <tr {...detailRowProps(() => { setSelectedTransport(transport); setIsModalOpen(true); })} key={transport.id} className="cursor-pointer hover:bg-slate-50/60 transition-colors group">
                      {/* Ref. Transporte: Curta (Item 2.5 e 2.7) */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {formatShortRef(transport.id, 'TRP')}
                        {transport.trackingCode && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Rastreio: {transport.trackingCode}
                          </span>
                        )}
                      </td>

                      {/* Venda com referência curta (Item 2.5 e 2.7) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSaleReceipt?.(transport.saleId);
                            }}
                            className="font-bold text-xs text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                            title={`Abrir recibo da venda #${transport.saleId}`}
                          >
                            {formatShortRef(transport.saleId, 'VND')}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(transport.saleId);
                              setCopiedSaleId(transport.saleId);
                              setTimeout(() => setCopiedSaleId(null), 1500);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded cursor-pointer"
                            title={`Copiar ID completo (#${transport.saleId})`}
                            aria-label="Copiar ID da venda"
                          >
                            {copiedSaleId === transport.saleId ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {warehouse?.name} ({company?.name})
                        </span>
                      </td>

                      {/* Endereço de destino com 240-320 px, até três linhas (Item 2.5) */}
                      <td className="py-3 px-3 w-[280px] min-w-[240px] max-w-[320px] text-slate-800">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-3 text-xs leading-relaxed" title={transport.deliveryAddress}>
                            {transport.deliveryAddress}
                          </span>
                        </div>
                        {transport.notes && (
                          <span className="text-[10px] text-slate-400 italic block mt-1 line-clamp-1">
                            Obs: {transport.notes}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        {transport.driver ? (
                          <>
                            <span className="font-medium text-slate-900 block">{transport.driver}</span>
                            <span className="text-[11px] text-slate-400">{transport.vehicle || 'Viatura não informada'}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Não atribuído</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {transport.estimatedDeliveryDate ? (
                          formatDate(transport.estimatedDeliveryDate)
                        ) : (
                          <span className="text-slate-400">Não definida</span>
                        )}
                        {transport.deliveredAt && (
                          <span className="block text-[10px] text-emerald-600">
                            Entregue: {formatDate(transport.deliveredAt)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrencyValue(transport.cost, company?.currency || 'Kz')}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(transport.status)}
                      </td>

                      {/* Ação logística preservada e coluna fixa à direita (Item 2.5) */}
                      <td
                        className="py-2.5 px-4 text-right whitespace-nowrap sticky right-0 bg-white/95 dark:bg-slate-900/95 group-hover:bg-slate-50/95 dark:group-hover:bg-slate-800/95 backdrop-blur-xs min-w-[140px] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick progression button preserved (Item 2.5) */}
                          {transport.status === 'pendente' && (
                            <button
                              type="button"
                              onClick={() => handleQuickAdvanceStatus(transport)}
                              className="inline-flex items-center gap-1 min-h-[44px] px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                              title="Marcar como Em Trânsito"
                            >
                              <span>Expedir</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {transport.status === 'em_transito' && (
                            <button
                              type="button"
                              onClick={() => handleQuickAdvanceStatus(transport)}
                              className="inline-flex items-center gap-1 min-h-[44px] px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                              title="Confirmar Entrega ao Cliente"
                            >
                              <span>Confirmar Entrega</span>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTransport(transport);
                              setIsModalOpen(true);
                            }}
                            className="dm-icon-action min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg text-slate-400 dark:text-dm-muted hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-dm-elevated transition-colors cursor-pointer"
                            title="Ver e editar detalhes do transporte"
                          >
                            <span className="sr-only">Abrir detalhes</span>
                            <DetailsIcon aria-hidden="true" className="w-4 h-4" />
                          </button>
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

      {/* Edit Transport Modal */}
      <TransportModal
        transport={selectedTransport}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTransport(null);
        }}
        onSave={(id, updates) => {
          updateTransport(id, updates);
        }}
      />
    </div>
  );
};
