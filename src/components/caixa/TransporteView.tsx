import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Transport, TransportStatus } from '../../types/stock';
import { formatCurrencyValue, formatDate } from '../../utils/formatters';
import { TransportModal } from './TransportModal';
import { PositiveBadge } from '../common/PositiveBadge';

interface TransporteViewProps {
  onOpenSaleReceipt?: (saleId: string) => void;
}

export const TransporteView: React.FC<TransporteViewProps> = ({ onOpenSaleReceipt }) => {
  const { transports, sales, warehouses, companies, isCompanyDisabled, isWarehouseDisabled, updateTransport } = useStock();

  // Search & Filter state
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Modal state
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Visible transports: excludes transports associated with disabled companies
  const visibleTransports = useMemo(() => {
    return transports.filter((t) => {
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
          const q = search.toLowerCase();
          const matchId = t.id.toLowerCase().includes(q);
          const matchSaleId = t.saleId.toLowerCase().includes(q);
          const matchAddr = t.deliveryAddress.toLowerCase().includes(q);
          const matchDriver = t.driver?.toLowerCase().includes(q);
          const matchVehicle = t.vehicle?.toLowerCase().includes(q);
          const matchTrack = t.trackingCode?.toLowerCase().includes(q);
          return matchId || matchSaleId || matchAddr || matchDriver || matchVehicle || matchTrack;
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
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Expedições</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">
              {metrics.total}
            </span>
            <span className="text-xs text-slate-400">pedidos</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Histórico completo de entregas</p>
        </div>

        {/* Pendentes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pendentes</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-amber-700">
              {metrics.pending}
            </span>
            <span className="text-xs text-slate-400">aguardando envio</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Aguardando motorista / separação</p>
        </div>

        {/* Em Trânsito */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Em Rota / Trânsito</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-sky-700">
              {metrics.inTransit}
            </span>
            <span className="text-xs text-slate-400">na rua</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Entregas em circulação</p>
        </div>

        {/* Entregues */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Entregues com Sucesso</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-emerald-600">
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por endereço, motorista ou ref..."
              className="w-full bg-transparent border-0 text-xs text-slate-900 dark:text-dm-text placeholder:text-slate-400 dark:placeholder:text-dm-muted focus:outline-none"
            />
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
                <th className="py-2.5 px-4">Ref. Transporte</th>
                <th className="py-2.5 px-3">Venda Vinculada</th>
                <th className="py-2.5 px-3">Endereço de Destino</th>
                <th className="py-2.5 px-3">Motorista & Viatura</th>
                <th className="py-2.5 px-3">Previsão Entrega</th>
                <th className="py-2.5 px-3 text-right">Taxa Frete</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-4 text-right">Ações</th>
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
                    <tr key={transport.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        #{transport.id}
                        {transport.trackingCode && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Rastreio: {transport.trackingCode}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-medium text-slate-800 block">
                          #{transport.saleId}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {warehouse?.name} ({company?.name})
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-800 max-w-xs">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2" title={transport.deliveryAddress}>
                            {transport.deliveryAddress}
                          </span>
                        </div>
                        {transport.notes && (
                          <span className="text-[10px] text-slate-400 italic block mt-0.5">
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

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick progression button */}
                          {transport.status === 'pendente' && (
                            <button
                              type="button"
                              onClick={() => handleQuickAdvanceStatus(transport)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-medium transition-colors"
                              title="Marcar como Em Trânsito"
                            >
                              <span>Expedir</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {transport.status === 'em_transito' && (
                            <button
                              type="button"
                              onClick={() => handleQuickAdvanceStatus(transport)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-medium transition-colors"
                              title="Confirmar Entrega ao Cliente"
                            >
                              <span>Confirmar Entrega</span>
                              <CheckCircle2 className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTransport(transport);
                              setIsModalOpen(true);
                            }}
                            className="dm-btn-primary px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-dm-text dark:text-dm-page text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Ver e editar detalhes do transporte"
                          >
                            Ver detalhes
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTransport(transport);
                              setIsModalOpen(true);
                            }}
                            className="dm-icon-action p-1.5 text-slate-500 hover:text-slate-900 dark:text-dm-muted dark:hover:text-dm-text hover:bg-slate-100 dark:hover:bg-dm-elevated rounded-lg transition-colors"
                            title="Editar detalhes do transporte"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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
