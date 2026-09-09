import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Filter,
  ShieldCheck,
  Search,
  Calendar,
  Building,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { MovementType } from '../../types/stock';
import { formatDateTime } from '../../utils/formatters';

interface MovementsViewProps {
  onOpenNewMovementModal: () => void;
  onSelectProduct?: (productId: string) => void;
}

export const MovementsView: React.FC<MovementsViewProps> = ({
  onOpenNewMovementModal,
  onSelectProduct,
}) => {
  const { movements, products, warehouses } = useStock();

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sorted & filtered movements (strictly chronological, latest first)
  const filteredMovements = useMemo(() => {
    return [...movements]
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
  }, [movements, typeFilter, warehouseFilter, productFilter, searchQuery, products]);

  // Movement type stats
  const typeCounts = useMemo(() => {
    const counts = { entrada: 0, saida: 0, transferencia: 0, ajuste: 0, defeituoso: 0 };
    movements.forEach((m) => {
      if (counts[m.type] !== undefined) {
        counts[m.type]++;
      }
    });
    return counts;
  }, [movements]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Audit Rule Notice */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800">
              Livro de Auditoria e Rastreabilidade de Movimentações
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Movimentações registradas são rigorosamente imutáveis para manter a conformidade fiscal e auditoria contábil. Correções de saldo são efetuadas através do registro de um <strong>Ajuste</strong> justificado.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-new-movement"
          onClick={onOpenNewMovementModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Registrar Movimentação</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <span className="font-medium text-slate-500">Tipo:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer capitalize"
            >
              <option value="all">Todos ({movements.length})</option>
              <option value="entrada">Entrada ({typeCounts.entrada})</option>
              <option value="saida">Saída ({typeCounts.saida})</option>
              <option value="transferencia">Transferência ({typeCounts.transferencia})</option>
              <option value="ajuste">Ajuste ({typeCounts.ajuste})</option>
              <option value="defeituoso">Defeituoso ({typeCounts.defeituoso})</option>
            </select>
          </div>

          {/* Warehouse Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os Armazéns</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">Todos os Produtos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Search */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar motivo, ref, operador..."
            className="w-full bg-transparent text-xs text-slate-700 focus:outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Data & Hora</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4 text-center">Tipo</th>
                <th className="py-3 px-4 text-right">Quantidade</th>
                <th className="py-3 px-4">Origem / Destino</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Motivo / Documento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhuma movimentação encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const product = products.find((p) => p.id === mov.productId);
                  const wh = warehouses.find((w) => w.id === mov.warehouseId);
                  const destWh = mov.destinationWarehouseId
                    ? warehouses.find((w) => w.id === mov.destinationWarehouseId)
                    : null;

                  return (
                    <tr
                      key={mov.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Data & Hora */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
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
                              className="w-7 h-7 rounded object-cover border border-slate-200 shrink-0"
                            />
                          )}
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:underline block">
                              {product?.name || 'Produto não encontrado'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              SKU: {product?.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                            mov.type === 'entrada'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : mov.type === 'saida'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : mov.type === 'transferencia'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : mov.type === 'defeituoso'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {mov.type === 'entrada' && <ArrowDownLeft className="w-3 h-3" />}
                          {mov.type === 'saida' && <ArrowUpRight className="w-3 h-3" />}
                          {mov.type === 'transferencia' && <ArrowLeftRight className="w-3 h-3" />}
                          {mov.type === 'ajuste' && <RotateCcw className="w-3 h-3" />}
                          {mov.type === 'defeituoso' && <AlertTriangle className="w-3 h-3" />}
                          {mov.type}
                        </span>
                      </td>

                      {/* Quantidade */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                        <span
                          className={
                            mov.type === 'saida' || mov.type === 'defeituoso'
                              ? 'text-slate-700'
                              : 'text-slate-900'
                          }
                        >
                          {mov.type === 'saida' || mov.type === 'defeituoso' ? '-' : '+'}
                          {mov.quantity} {product?.unitOfMeasure}
                        </span>
                      </td>

                      {/* Origem / Destino */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div>
                          <span>{wh?.name || 'Armazém Geral'}</span>
                          {destWh && (
                            <span className="text-[11px] text-purple-700 block font-medium">
                              → {destWh.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Responsável */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        {mov.responsible}
                      </td>

                      {/* Motivo & Referência */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-800 line-clamp-1">{mov.reason}</p>
                        {mov.reference && (
                          <span className="text-[10px] text-slate-400 font-mono">
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
        <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>{filteredMovements.length} movimentações auditadas</span>
          <span>Registros assinados e protegidos contra deleção</span>
        </div>
      </div>
    </div>
  );
};
