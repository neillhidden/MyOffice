import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  Plus,
  ShieldAlert,
  Trash2,
  RotateCcw,
  Wrench,
  X,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  DefectReason,
  DefectDecision,
} from '../../types/stock';
import { formatKwanza, formatDateTime } from '../../utils/formatters';

export const DefectiveView: React.FC = () => {
  const {
    defectiveRecords,
    products,
    warehouses,
    companies,
    isCompanyDisabled,
    recordDefective,
    updateDefectiveResolution,
    getCurrentStock,
    getProductWarehouses,
  } = useStock();

  const [showModal, setShowModal] = useState(false);
  const [filterDecision, setFilterDecision] = useState<string>('all');
  const [filterReason, setFilterReason] = useState<string>('all');

  // Warehouses excluding disabled companies
  const operationalWarehouses = useMemo(() => {
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

  // Products excluding products linked to disabled companies
  const operationalProducts = useMemo(() => {
    return products.filter((p) => {
      // Direct Kianda check
      if (p.id.includes('kianda') || p.brand?.toLowerCase().includes('kianda')) {
        const kiandaComp = companies.find((c) => c.id === 'comp-kianda');
        if (kiandaComp ? kiandaComp.status === 'desativada' : true) return false;
      }

      // Check operational warehouses for this product (excludes warehouses of disabled companies)
      const operationalWhs = getProductWarehouses(p.id);
      if (operationalWhs.length === 0) {
        return false;
      }

      return true;
    });
  }, [products, companies, isCompanyDisabled, getProductWarehouses]);

  // Form states
  const [productId, setProductId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState<DefectReason>('defeito_fabrica');
  const [decision, setDecision] = useState<DefectDecision>('descartar');
  const [responsible, setResponsible] = useState<string>('Controlo de Qualidade');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync initial product and warehouse
  React.useEffect(() => {
    if (operationalProducts.length > 0 && !productId) {
      setProductId(operationalProducts[0].id);
    }
  }, [operationalProducts, productId]);

  React.useEffect(() => {
    if (operationalWarehouses.length > 0 && !warehouseId) {
      setWarehouseId(operationalWarehouses[0].id);
    }
  }, [operationalWarehouses, warehouseId]);

  const selectedProduct = operationalProducts.find((p) => p.id === productId) || products.find((p) => p.id === productId);
  const currentAvailableStock = selectedProduct
    ? getCurrentStock(selectedProduct.id, warehouseId)
    : 0;

  // Filtered Defective List (excludes desativada companies)
  const filteredList = useMemo(() => {
    return defectiveRecords.filter((item) => {
      const wh = warehouses.find((w) => w.id === item.warehouseId);
      const comp = companies.find((c) => c.id === wh?.companyId);
      if (comp?.status === 'desativada') return false;

      if (filterDecision !== 'all' && item.decision !== filterDecision) return false;
      if (filterReason !== 'all' && item.reason !== filterReason) return false;
      return true;
    });
  }, [defectiveRecords, warehouses, companies, filterDecision, filterReason]);

  // High-level metrics (excludes desativada companies)
  const metrics = useMemo(() => {
    let totalQty = 0;
    let totalLossKz = 0;
    let pendingCount = 0;
    let discardedCount = 0;

    defectiveRecords.forEach((d) => {
      const wh = warehouses.find((w) => w.id === d.warehouseId);
      const comp = companies.find((c) => c.id === wh?.companyId);
      if (comp?.status === 'desativada') return;

      totalQty += d.quantity;
      const p = products.find((prod) => prod.id === d.productId);
      if (p) {
        totalLossKz += d.quantity * p.costPrice;
      }
      if (d.status === 'pendente') pendingCount++;
      if (d.decision === 'descartar') discardedCount++;
    });

    return { totalQty, totalLossKz, pendingCount, discardedCount };
  }, [defectiveRecords, warehouses, companies, products]);

  const handleSaveDefective = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetWh = warehouses.find((w) => w.id === warehouseId);
    const targetComp = companies.find((c) => c.id === targetWh?.companyId);

    if (targetComp?.status === 'desativada') {
      setFormError(`Operação bloqueada: A empresa "${targetComp.name}" está desativada.`);
      return;
    }

    if (targetComp?.status === 'parada') {
      setFormError(`Operação bloqueada: A empresa "${targetComp.name}" está com estado Parada. Não é possível registar avarias.`);
      return;
    }

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

    try {
      recordDefective({
        productId: selectedProduct.id,
        warehouseId,
        quantity: qty,
        reason,
        decision,
        responsible: responsible.trim() || 'Controlo de Qualidade',
        notes: notes.trim() || undefined,
      });

      setShowModal(false);
      setQuantity('');
      setNotes('');
    } catch (err: any) {
      setFormError(err?.message || 'Erro ao registar defeito.');
    }
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
          <span className="text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 px-2 py-0.5 rounded flex items-center gap-1 justify-center">
            <Trash2 className="w-3 h-3" /> Descarte / Baixa
          </span>
        );
      case 'reparar':
        return (
          <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60 px-2 py-0.5 rounded flex items-center gap-1 justify-center">
            <Wrench className="w-3 h-3" /> Reparo Interno
          </span>
        );
      case 'devolver_fornecedor':
        return (
          <span className="text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/60 px-2 py-0.5 rounded flex items-center gap-1 justify-center">
            <RotateCcw className="w-3 h-3" /> Devolver Fornecedor
          </span>
        );
      case 'vender_com_desconto':
        return (
          <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60 px-2 py-0.5 rounded">
            Venda c/ Desconto
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total de Itens Avariados
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {metrics.totalQty}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">unidades baixadas</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Retirados automaticamente do saldo
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Valor de Perda (Custo)
          </span>
          <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 truncate">
            {formatKwanza(metrics.totalLossKz)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Impacto acumulado no inventário
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pendentes de Resolução
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {metrics.pendingCount}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">pendências</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Exigem acompanhamento
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Baixas Definitivas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-700 dark:text-slate-300">
              {metrics.discardedCount}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">descartes</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Descartados ou sucateados
          </span>
        </div>
      </div>

      {/* Action and Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Reason Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg">
            <span className="font-medium text-slate-500 dark:text-slate-400">Motivo da Avaria:</span>
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="bg-transparent font-medium text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
            >
              <option value="all">Todas as avarias</option>
              <option value="defeito_fabrica">Defeito de Fábrica</option>
              <option value="dano_transporte">Avaria em Transporte</option>
              <option value="vencido">Prazo Vencido</option>
              <option value="outro">Outra Ocorrência</option>
            </select>
          </div>

          {/* Decision Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg">
            <span className="font-medium text-slate-500 dark:text-slate-400">Decisão:</span>
            <select
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value)}
              className="bg-transparent font-medium text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
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
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-lg text-xs font-medium transition-colors shadow-xs ml-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Registar Defeituoso</span>
        </button>
      </div>

      {/* Defective Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Data Registo</th>
                <th className="py-3 px-4">Produto Avariado</th>
                <th className="py-3 px-4 text-right">Qtd</th>
                <th className="py-3 px-4">Armazém Origem</th>
                <th className="py-3 px-4">Motivo do Defeito</th>
                <th className="py-3 px-4 text-center">Decisão / Destino</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Responsável & Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    Nenhum produto defeituoso registado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  const warehouse = warehouses.find((w) => w.id === item.warehouseId);
                  const comp = companies.find((c) => c.id === warehouse?.companyId);
                  const isParada = comp?.status === 'parada';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {formatDateTime(item.date)}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          {product?.mainImage && (
                            <img
                              src={product.mainImage}
                              alt=""
                              className="w-7 h-7 rounded object-cover border border-slate-200 dark:border-slate-700"
                            />
                          )}
                          <div>
                            <span>{product?.name || 'Produto'}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                              SKU: {product?.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        -{item.quantity} {product?.unitOfMeasure}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">{warehouse?.name || 'Armazém Geral'}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{comp?.name || 'Empresa'}</span>
                          {isParada && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              Parada
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {getDefectReasonLabel(item.reason)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {getDecisionBadge(item.decision)}

                          {/* Inline change decision */}
                          <select
                            value={item.decision}
                            disabled={isParada}
                            onChange={(e) =>
                              updateDefectiveResolution(
                                item.id,
                                e.target.value as DefectDecision,
                                item.status
                              )
                            }
                            className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-600 dark:text-slate-300 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                            title={isParada ? 'Operação bloqueada: Empresa Parada' : 'Atualizar decisão'}
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
                          disabled={isParada}
                          onClick={() => {
                            if (isParada) return;
                            updateDefectiveResolution(
                              item.id,
                              item.decision,
                              item.status === 'pendente' ? 'resolvido' : 'pendente'
                            );
                          }}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            isParada ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            item.status === 'resolvido'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                          }`}
                          title={isParada ? 'Operação bloqueada: Empresa Parada' : undefined}
                        >
                          {item.status === 'resolvido' ? 'Resolvido' : 'Pendente'}
                        </button>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          Por: {item.responsible}
                        </span>
                        {item.notes && (
                          <span className="text-[11px] text-slate-700 dark:text-slate-300 italic line-clamp-1">
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

      {/* MODAL: Registar Defeituoso */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Registar Item Defeituoso / Avariado
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Gera saída imediata do estoque com baixa auditada
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-close-defective-modal"
                onClick={() => setShowModal(false)}
                aria-label="Fechar"
                title="Fechar"
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDefective} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-[11px]">
                <strong>Aviso de Estoque:</strong> Ao confirmar, o sistema registará uma movimentação de <strong>saída por defeito</strong>, deduzindo a quantidade do armazém selecionado.
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Produto Avariado <span className="text-rose-500">*</span>
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                >
                  {operationalProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Armazém de Ocorrência <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                  >
                    {operationalWarehouses.map((w) => {
                      const comp = companies.find((c) => c.id === w.companyId);
                      const isParada = comp?.status === 'parada';
                      return (
                        <option key={w.id} value={w.id} disabled={isParada}>
                          {w.name} ({comp?.name || 'Empresa'}){isParada ? ' — [PARADA]' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Disponível no armazém: <strong className="text-slate-700 dark:text-slate-300">{currentAvailableStock}</strong> {selectedProduct?.unitOfMeasure}
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Quantidade com Defeito <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 dark:text-slate-500 font-medium text-[11px]">
                      {selectedProduct?.unitOfMeasure}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Motivo da Avaria <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as DefectReason)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                  >
                    <option value="defeito_fabrica">Defeito de Fábrica</option>
                    <option value="dano_transporte">Avaria em Transporte</option>
                    <option value="vencido">Prazo de Validade Expirado</option>
                    <option value="outro">Outro Motivo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Decisão Operacional
                  </label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value as DefectDecision)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                  >
                    <option value="descartar">Descarte / Baixa Definitiva</option>
                    <option value="reparar">Reparação Interna</option>
                    <option value="devolver_fornecedor">Devolução ao Fornecedor</option>
                    <option value="vender_com_desconto">Venda com Desconto Especial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Responsável pela Averiguação
                </label>
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  placeholder="Nome do inspetor"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Detalhes do Defeito / Observações
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descreva o dano constatado ou laudo técnico..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
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
