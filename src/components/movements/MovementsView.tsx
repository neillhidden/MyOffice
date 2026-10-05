import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Plus,
  ShieldCheck,
  Search,
  Building,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatDateTime } from '../../utils/formatters';
import { PositiveBadge } from '../common/PositiveBadge';

interface MovementsViewProps {
  onOpenNewMovementModal: () => void;
  onSelectProduct?: (productId: string) => void;
}

export const MovementsView: React.FC<MovementsViewProps> = ({
  onOpenNewMovementModal,
  onSelectProduct,
}) => {
  const { movements, products, warehouses, companies, isCompanyDisabled, isWarehouseDisabled } = useStock();

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Visible warehouses excluding disabled companies
  const visibleWarehouses = useMemo(() => {
    return warehouses.filter((w) => {
      if (w.id === 'wh-kianda' || w.companyId === 'comp-kianda') {
        const kiandaComp = companies.find((c) => c.id === 'comp-kianda');
        if (kiandaComp ? kiandaComp.status === 'desativada' : true) return false;
      }
      const comp = companies.find((c) => c.id === w.companyId);
      if (comp?.status === 'desativada' || isCompanyDisabled(w.companyId)) return false;
      return true;
    });
  }, [warehouses, companies, isCompanyDisabled]);

  // Visible movements: completely excludes disabled companies
  const visibleMovements = useMemo(() => {
    return movements.filter((m) => {
      if (
        m.warehouseId === 'wh-kianda' ||
        m.destinationWarehouseId === 'wh-kianda' ||
        m.id.startsWith('mov-knd')
      ) {
        const kiandaComp = companies.find((c) => c.id === 'comp-kianda');
        if (kiandaComp ? kiandaComp.status === 'desativada' : true) return false;
      }

      const wh = warehouses.find((w) => w.id === m.warehouseId);
      const comp = companies.find((c) => c.id === wh?.companyId);
      if (comp && (comp.status === 'desativada' || isCompanyDisabled(comp.id))) return false;
      if (wh && isWarehouseDisabled(wh.id)) return false;

      if (m.destinationWarehouseId) {
        const destWh = warehouses.find((w) => w.id === m.destinationWarehouseId);
        const destComp = companies.find((c) => c.id === destWh?.companyId);
        if (destComp && (destComp.status === 'desativada' || isCompanyDisabled(destComp.id))) return false;
        if (destWh && isWarehouseDisabled(destWh.id)) return false;
      }
      return true;
    });
  }, [movements, warehouses, companies, isCompanyDisabled, isWarehouseDisabled]);

  // Sorted & filtered movements (strictly chronological, latest first)
  const filteredMovements = useMemo(() => {
    return [...visibleMovements]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((m) => {
        if (typeFilter !== 'all' && m.type !== typeFilter) return false;
        if (
          warehouseFilter !== 'all' &&
          m.warehouseId !== warehouseFilter &&
          m.destinationWarehouseId !== warehouseFilter
        ) {
          return false;
        }
        if (productFilter !== 'all' && m.productId !== productFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const product = products.find((p) => p.id === m.productId);
          const matchesProd = product?.name.toLowerCase().includes(q) || product?.sku.toLowerCase().includes(q);
          const matchesReason = m.reason?.toLowerCase().includes(q);
          const matchesRef = m.reference?.toLowerCase().includes(q);
          const matchesResp = m.responsible?.toLowerCase().includes(q);
          if (!matchesProd && !matchesReason && !matchesRef && !matchesResp) {
            return false;
          }
        }
        return true;
      });
  }, [visibleMovements, typeFilter, warehouseFilter, productFilter, searchQuery, products]);

  // Movement type stats
  const typeCounts = useMemo(() => {
    const counts = { entrada: 0, saida: 0, transferencia: 0, ajuste: 0, defeituoso: 0 };
    visibleMovements.forEach((m) => {
      if (counts[m.type] !== undefined) {
        counts[m.type]++;
      }
    });
    return counts;
  }, [visibleMovements]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Audit Rule Notice */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Livro de Auditoria e Rastreabilidade de Movimentações
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Movimentações registadas são rigorosamente imutáveis para manter a conformidade fiscal e auditoria contabilística. Correções de saldo são efetuadas através do registo de um <strong>Ajuste</strong> justificado.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-new-movement"
          onClick={onOpenNewMovementModal}
          className="dm-btn-primary inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-dm-text dark:hover:bg-white dark:text-dm-page rounded-lg text-xs font-medium transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Registar Movimentação</span>
        </button>
      </div>

      {/* Unified Filter Capsule Bar */}
      <div className="dm-filter-capsule bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-2xl p-1.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex flex-wrap items-center divide-x divide-slate-200/80 dark:divide-dm-border flex-1">
          {/* Type Filter Segment */}
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5">
            <span className="font-medium text-slate-500 dark:text-dm-muted">Tipo:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent border-0 font-semibold text-slate-800 dark:text-dm-text focus:outline-none cursor-pointer capitalize"
            >
              <option value="all">Todos ({visibleMovements.length})</option>
              <option value="entrada">Entrada ({typeCounts.entrada})</option>
              <option value="saida">Saída ({typeCounts.saida})</option>
              <option value="transferencia">Transferência ({typeCounts.transferencia})</option>
              <option value="ajuste">Ajuste ({typeCounts.ajuste})</option>
              <option value="defeituoso">Defeituoso ({typeCounts.defeituoso})</option>
            </select>
          </div>

          {/* Warehouse Filter Segment */}
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5">
            <span className="font-medium text-slate-500 dark:text-dm-muted">Local:</span>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="bg-transparent border-0 font-semibold text-slate-800 dark:text-dm-text focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os Armazéns</option>
              {visibleWarehouses.map((w) => {
                const comp = companies.find((c) => c.id === w.companyId);
                const isParada = comp?.status === 'parada';
                return (
                  <option key={w.id} value={w.id}>
                    {w.name} {isParada ? '(Parada)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Product Filter Segment */}
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5">
            <span className="font-medium text-slate-500 dark:text-dm-muted">Produto:</span>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="bg-transparent border-0 font-semibold text-slate-800 dark:text-dm-text focus:outline-none cursor-pointer max-w-[180px]"
            >
              <option value="all">Todos os Produtos</option>
              {products
                .filter((p) => visibleMovements.some((m) => m.productId === p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Quick Search Segment */}
          <div className="flex items-center px-3 py-1.5 flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-dm-muted mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar motivo, ref, operador..."
              className="w-full bg-transparent border-0 text-xs text-slate-700 dark:text-dm-text focus:outline-none placeholder:text-slate-400 dark:placeholder:text-dm-muted"
            />
          </div>
        </div>

        {/* Capsule Action Button */}
        <button
          type="button"
          onClick={onOpenNewMovementModal}
          className="dm-btn-primary inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-dm-text dark:hover:bg-white dark:text-dm-page rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Adicionar</span>
        </button>
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Data & Hora</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4 text-center">Tipo</th>
                <th className="py-3 px-4 text-right">Quantidade</th>
                <th className="py-3 px-4">Origem / Destino</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Motivo / Documento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    Nenhuma movimentação encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const product = products.find((p) => p.id === mov.productId);
                  const wh = warehouses.find((w) => w.id === mov.warehouseId);
                  const whComp = companies.find((c) => c.id === wh?.companyId);
                  const destWh = mov.destinationWarehouseId
                    ? warehouses.find((w) => w.id === mov.destinationWarehouseId)
                    : null;
                  const destComp = destWh ? companies.find((c) => c.id === destWh.companyId) : null;

                  return (
                    <tr
                      key={mov.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Data & Hora */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {formatDateTime(mov.date)}
                      </td>

                      {/* Produto */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => onSelectProduct?.(mov.productId)}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          {product?.mainImage && (
                            <img
                              src={product.mainImage}
                              alt=""
                              className="w-7 h-7 rounded object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          )}
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:underline block">
                              {product?.name || 'Produto não encontrado'}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              SKU: {product?.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {mov.type === 'entrada' ? (
                          <PositiveBadge label="Entrada" />
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                              mov.type === 'saida'
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60'
                                : mov.type === 'transferencia'
                                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/60'
                                : mov.type === 'defeituoso'
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
                            }`}
                          >
                            {mov.type === 'saida' && <ArrowUpRight className="w-3 h-3" />}
                            {mov.type === 'transferencia' && <ArrowLeftRight className="w-3 h-3" />}
                            {mov.type === 'ajuste' && <RotateCcw className="w-3 h-3" />}
                            {mov.type === 'defeituoso' && <AlertTriangle className="w-3 h-3" />}
                            {mov.type}
                          </span>
                        )}
                      </td>

                      {/* Quantidade */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                        <span
                          className={
                            mov.type === 'saida' || mov.type === 'defeituoso'
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-slate-900 dark:text-slate-100'
                          }
                        >
                          {mov.type === 'saida' || mov.type === 'defeituoso' ? '-' : '+'}
                          {mov.quantity} {product?.unitOfMeasure}
                        </span>
                      </td>

                      {/* Origem / Destino */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{wh?.name || 'Armazém Geral'}</span>
                            {whComp?.status === 'parada' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded">
                                Parada
                              </span>
                            )}
                          </div>
                          {destWh && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">
                                → {destWh.name}
                              </span>
                              {destComp?.status === 'parada' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded">
                                  Parada
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Responsável */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 text-[11px]">
                        {mov.responsible}
                      </td>

                      {/* Motivo & Referência */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-800 dark:text-slate-200 line-clamp-1">{mov.reason}</p>
                        {mov.reference && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            Doc: {mov.reference}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>{filteredMovements.length} movimentações auditadas</span>
          <span>Registos assinados e protegidos contra eliminação</span>
        </div>
      </div>
    </div>
  );
};
