import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  Plus,
  Filter,
  ShieldAlert,
  Building,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Wrench,
  DollarSign,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  DefectReason,
  DefectDecision,
  DefectiveRecord,
} from '../../types/stock';
import { formatKwanza, formatDateTime } from '../../utils/formatters';

export const DefectiveView: React.FC = () => {
  const {
    defectiveRecords,
    products,
    warehouses,
    recordDefective,
    updateDefectiveResolution,
    getCurrentStock,
  } = useStock();

  const [showModal, setShowModal] = useState(false);
  const [filterDecision, setFilterDecision] = useState<string>('all');
  const [filterReason, setFilterReason] = useState<string>('all');

  // Form states
  const [productId, setProductId] = useState<string>(products[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState<string>(warehouses[0]?.id || '');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState<DefectReason>('defeito_fabrica');
  const [decision, setDecision] = useState<DefectDecision>('descartar');
  const [responsible, setResponsible] = useState<string>('Controle de Qualidade');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId);
  const currentAvailableStock = selectedProduct
    ? getCurrentStock(selectedProduct.id, warehouseId)
    : 0;

  // Filtered Defective List
  const filteredList = useMemo(() => {
    return defectiveRecords.filter((item) => {
      if (filterDecision !== 'all' && item.decision !== filterDecision) return false;
      if (filterReason !== 'all' && item.reason !== filterReason) return false;
      return true;
    });
  }, [defectiveRecords, filterDecision, filterReason]);

  // High-level metrics
  const metrics = useMemo(() => {
    let totalQty = 0;
    let totalLossKz = 0;
    let pendingCount = 0;
    let discardedCount = 0;

    defectiveRecords.forEach((d) => {
      totalQty += d.quantity;
      const p = products.find((prod) => prod.id === d.productId);
      if (p) {
        totalLossKz += d.quantity * p.costPrice;
      }
      if (d.status === 'pendente') pendingCount++;
      if (d.decision === 'descartar') discardedCount++;
    });

    return { totalQty, totalLossKz, pendingCount, discardedCount };
  }, [defectiveRecords, products]);

  const handleSaveDefective = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProduct) {
      setFormError('Selecione um produto.');
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setFormError('Informe uma quantidade válida.');
      return;
    }

    if (qty > currentAvailableStock) {
      setFormError(
        `Estoque insuficiente no armazém selecionado. Disponível: ${currentAvailableStock} ${selectedProduct.unitOfMeasure}.`
      );
      return;
    }

    recordDefective({
      productId: selectedProduct.id,
      warehouseId,
      quantity: qty,
      reason,
      decision,
      responsible: responsible.trim() || 'Controle de Qualidade',
      notes: notes.trim() || undefined,
    });

    setShowModal(false);
    setQuantity('');
    setNotes('');
  };

  const getDefectReasonLabel = (r: DefectReason) => {
    switch (r) {
      case 'defeito_fabrica':
        return 'Defeito de Fábrica';
      case 'dano_transporte':
        return 'Avaria em Transporte';
      case 'vencido':
        return 'Prazo Vencido / Expirado';
      case 'outro':
        return 'Outra Ocorrência';
    }
  };

  const getDecisionBadge = (dec: DefectDecision) => {
    switch (dec) {
      case 'descartar':
        return (
          <span className="text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1 justify-center">
            <Trash2 className="w-3 h-3" /> Descarte / Baixa
          </span>
        );
      case 'reparar':
        return (
          <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1 justify-center">
            <Wrench className="w-3 h-3" /> Reparo Interno
          </span>
        );
      case 'devolver_fornecedor':
        return (
          <span className="text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded flex items-center gap-1 justify-center">
            <RotateCcw className="w-3 h-3" /> Devolver Fornecedor
          </span>
        );
      case 'vender_com_desconto':
        return (
          <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
            Venda c/ Desconto
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total de Itens Avariados
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {metrics.totalQty}
            </span>
            <span className="text-xs text-slate-400">unidades baixadas</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Retirados automaticamente do saldo
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Valor de Perda (Custo)
          </span>
          <div className="text-lg font-bold font-mono text-rose-600 mt-1 truncate">
            {formatKwanza(metrics.totalLossKz)}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Impacto acumulado no inventário
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Pendentes de Resolução
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-600">
              {metrics.pendingCount}
            </span>
            <span className="text-xs text-amber-600">pendências</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Exigem acompanhamento
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Baixas Definitivas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-700">
              {metrics.discardedCount}
            </span>
            <span className="text-xs text-slate-400">descartes</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Descartados ou sucateados
          </span>
        </div>
      </div>

      {/* Action and Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Reason Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <span className="font-medium text-slate-500">Motivo da Avaria:</span>
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as avarias</option>
              <option value="defeito_fabrica">Defeito de Fábrica</option>
              <option value="dano_transporte">Avaria em Transporte</option>
              <option value="vencido">Prazo Vencido</option>
              <option value="outro">Outra Ocorrência</option>
            </select>
          </div>

          {/* Decision Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <span className="font-medium text-slate-500">Decisão:</span>
            <select
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as Decisões</option>
              <option value="descartar">Descarte / Baixa</option>
              <option value="reparar">Reparação Interna</option>
              <option value="devolver_fornecedor">Devolução Fornecedor</option>
              <option value="vender_com_desconto">Venda com Desconto</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          id="btn-register-defective"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs ml-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Registrar Defeituoso</span>
        </button>
      </div>

      {/* Defective Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Data Registro</th>
                <th className="py-3 px-4">Produto Avariado</th>
                <th className="py-3 px-4 text-right">Qtd</th>
                <th className="py-3 px-4">Armazém Origem</th>
                <th className="py-3 px-4">Motivo do Defeito</th>
                <th className="py-3 px-4 text-center">Decisão / Destino</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Responsável & Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum produto defeituoso registrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  const warehouse = warehouses.find((w) => w.id === item.warehouseId);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {formatDateTime(item.date)}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          {product?.mainImage && (
                            <img
                              src={product.mainImage}
                              alt=""
                              className="w-7 h-7 rounded object-cover border border-slate-200"
                            />
                          )}
                          <div>
                            <span>{product?.name || 'Produto'}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              SKU: {product?.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                        -{item.quantity} {product?.unitOfMeasure}
                      </td>

                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {warehouse?.name || 'Armazém Geral'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800">
                          {getDefectReasonLabel(item.reason)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {getDecisionBadge(item.decision)}

                          {/* Inline change decision */}
                          <select
                            value={item.decision}
                            onChange={(e) =>
                              updateDefectiveResolution(
                                item.id,
                                e.target.value as DefectDecision,
                                item.status
                              )
                            }
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 font-medium cursor-pointer"
                            title="Atualizar decisão"
                          >
                            <option value="descartar">Descarte</option>
                            <option value="reparar">Reparo</option>
                            <option value="devolver_fornecedor">Devolução</option>
                            <option value="vender_com_desconto">Desconto</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            updateDefectiveResolution(
                              item.id,
                              item.decision,
                              item.status === 'pendente' ? 'resolvido' : 'pendente'
                            )
                          }
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                            item.status === 'resolvido'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.status === 'resolvido' ? 'Resolvido' : 'Pendente'}
                        </button>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <span className="text-[11px] text-slate-500 block">
                          Por: {item.responsible}
                        </span>
                        {item.notes && (
                          <span className="text-[11px] text-slate-700 italic line-clamp-1">
                            "{item.notes}"
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
      </div>

      {/* MODAL: Registrar Defeituoso */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Registrar Item Defeituoso / Avariado
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Gera saída imediata do estoque com baixa auditada
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDefective} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px]">
                <strong>Aviso de Estoque:</strong> Ao confirmar, o sistema registrará uma movimentação de <strong>saída por defeito</strong>, deduzindo a quantidade do armazém selecionado.
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Produto Avariado <span className="text-rose-500">*</span>
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Armazém de Ocorrência <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Disponível no armazém: <strong>{currentAvailableStock}</strong> {selectedProduct?.unitOfMeasure}
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Quantidade com Defeito <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 font-mono"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-medium text-[11px]">
                      {selectedProduct?.unitOfMeasure}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Motivo da Avaria <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as DefectReason)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                  >
                    <option value="defeito_fabrica">Defeito de Fábrica</option>
                    <option value="dano_transporte">Avaria em Transporte</option>
                    <option value="vencido">Prazo de Validade Expirado</option>
                    <option value="outro">Outro Motivo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Decisão Operacional
                  </label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value as DefectDecision)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 bg-white"
                  >
                    <option value="descartar">Descarte / Baixa Definitiva</option>
                    <option value="reparar">Reparação Interna</option>
                    <option value="devolver_fornecedor">Devolução ao Fornecedor</option>
                    <option value="vender_com_desconto">Venda com Desconto Especial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Responsável pela Averiguação
                </label>
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  placeholder="Nome do inspetor"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Detalhes do Defeito / Observações
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descreva o dano constatado ou laudo técnico..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
                >
                  Confirmar Baixa por Defeito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
