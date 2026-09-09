import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Calendar,
  ArrowRight,
  PackageX,
  Sparkles,
  Layers,
  Percent,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatKwanza } from '../../utils/formatters';

interface ProductAnalyticsViewProps {
  onSelectProduct: (productId: string) => void;
  onGoToPurchaseList?: () => void;
}

export const ProductAnalyticsView: React.FC<ProductAnalyticsViewProps> = ({
  onSelectProduct,
  onGoToPurchaseList,
}) => {
  const { products, movements, getProductStockInfo, getCurrentStock } = useStock();

  const [deadStockPeriodDays, setDeadStockPeriodDays] = useState<number>(60);
  const [activeTab, setActiveTab] = useState<'ranking' | 'parados' | 'reposicao' | 'margens'>('ranking');

  // 1. Calculate sales per product (movements of type 'saida')
  const salesAnalysis = useMemo(() => {
    const map = new Map<string, { totalQtySold: number; totalRevenueKz: number; totalProfitKz: number }>();

    products.forEach((p) => {
      map.set(p.id, { totalQtySold: 0, totalRevenueKz: 0, totalProfitKz: 0 });
    });

    movements.forEach((m) => {
      if (m.type === 'saida') {
        const p = products.find((prod) => prod.id === m.productId);
        if (p) {
          const current = map.get(p.id) || { totalQtySold: 0, totalRevenueKz: 0, totalProfitKz: 0 };
          const qty = m.quantity;
          const revenue = qty * p.salePrice;
          const profit = qty * (p.salePrice - p.costPrice);

          map.set(p.id, {
            totalQtySold: current.totalQtySold + qty,
            totalRevenueKz: current.totalRevenueKz + revenue,
            totalProfitKz: current.totalProfitKz + profit,
          });
        }
      }
    });

    const list = products.map((p) => {
      const stats = map.get(p.id) || { totalQtySold: 0, totalRevenueKz: 0, totalProfitKz: 0 };
      const currentStock = getCurrentStock(p.id);
      const marginPercent = p.salePrice > 0 ? ((p.salePrice - p.costPrice) / p.salePrice) * 100 : 0;

      return {
        product: p,
        ...stats,
        currentStock,
        unitMarginKz: p.salePrice - p.costPrice,
        marginPercent,
      };
    });

    // Top selling by quantity
    const byQtyDesc = [...list].sort((a, b) => b.totalQtySold - a.totalQtySold);
    // Top selling by revenue
    const byRevenueDesc = [...list].sort((a, b) => b.totalRevenueKz - a.totalRevenueKz);
    // Least selling
    const leastSelling = [...list].filter((item) => item.totalQtySold === 0 || item.totalQtySold <= 5);

    return {
      all: list,
      byQtyDesc,
      byRevenueDesc,
      leastSelling,
    };
  }, [products, movements, getCurrentStock]);

  // 2. Produtos "Parados" (sem saídas nos últimos X dias)
  const deadStock = useMemo(() => {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - deadStockPeriodDays);

    return products
      .map((p) => {
        const recentExitMovements = movements.filter(
          (m) =>
            m.productId === p.id &&
            m.type === 'saida' &&
            new Date(m.date).getTime() >= thresholdDate.getTime()
        );

        const currentStock = getCurrentStock(p.id);
        const capitalTiedUp = currentStock * p.costPrice;

        return {
          product: p,
          exitCountInPeriod: recentExitMovements.length,
          currentStock,
          capitalTiedUp,
        };
      })
      .filter((item) => item.exitCountInPeriod === 0 && item.currentStock > 0)
      .sort((a, b) => b.capitalTiedUp - a.capitalTiedUp);
  }, [products, movements, deadStockPeriodDays, getCurrentStock]);

  const totalDeadStockCapital = deadStock.reduce((sum, item) => sum + item.capitalTiedUp, 0);

  // 3. Produtos abaixo do limite mínimo (Prioridade de Reposição)
  const replenishmentList = useMemo(() => {
    return products
      .map((p) => {
        const info = getProductStockInfo(p.id);
        const deficit = Math.max(0, info.minLimit - info.currentStock);
        const estimatedRestockCost = deficit * p.costPrice;

        return {
          product: p,
          currentStock: info.currentStock,
          minLimit: info.minLimit,
          deficit,
          estimatedRestockCost,
          status: info.status,
        };
      })
      .filter((item) => item.status === 'critico_baixo' || item.status === 'zerado')
      .sort((a, b) => b.deficit - a.deficit);
  }, [products, getProductStockInfo]);

  // 4. Margens de Lucro
  const marginRankings = useMemo(() => {
    return [...salesAnalysis.all].sort((a, b) => a.marginPercent - b.marginPercent);
  }, [salesAnalysis]);

  // 5. Volume comparativo Entradas vs. Saídas
  const movementVolume = useMemo(() => {
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalDefeituosos = 0;

    movements.forEach((m) => {
      if (m.type === 'entrada') totalEntradas += m.quantity;
      if (m.type === 'saida') totalSaidas += m.quantity;
      if (m.type === 'defeituoso') totalDefeituosos += m.quantity;
    });

    return { totalEntradas, totalSaidas, totalDefeituosos };
  }, [movements]);

  return (
    <div className="space-y-6">
      {/* Top High-Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Faturamento Realizado
          </span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1 truncate">
            {formatKwanza(
              salesAnalysis.all.reduce((acc, curr) => acc + curr.totalRevenueKz, 0)
            )}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
            Baseado em saídas auditadas
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Capital Parado ({deadStockPeriodDays} dias)
          </span>
          <div className="text-lg font-bold font-mono text-amber-600 mt-1 truncate">
            {formatKwanza(totalDeadStockCapital)}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {deadStock.length} produtos sem saída
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Itens para Reposição
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-rose-600">
              {replenishmentList.length}
            </span>
            <span className="text-xs text-rose-500">em alerta</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Abaixo do limite mínimo
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Fluxo Entradas vs. Saídas
          </span>
          <div className="flex items-center gap-3 mt-1.5 font-mono text-xs">
            <div className="flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>+{movementVolume.totalEntradas} un</span>
            </div>
            <div className="flex items-center gap-1 text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>-{movementVolume.totalSaidas} un</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex mt-2">
            <div
              className="bg-emerald-500 h-full"
              style={{
                width: `${
                  (movementVolume.totalEntradas /
                    (movementVolume.totalEntradas + movementVolume.totalSaidas || 1)) *
                  100
                }%`,
              }}
            />
            <div
              className="bg-blue-500 h-full"
              style={{
                width: `${
                  (movementVolume.totalSaidas /
                    (movementVolume.totalEntradas + movementVolume.totalSaidas || 1)) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('ranking')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'ranking'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ranking de Vendas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('parados')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'parados'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Produtos Parados</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-700 font-medium rounded">
              {deadStock.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reposicao')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'reposicao'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Reposição Prioritária</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-rose-50 text-rose-700 font-medium rounded">
              {replenishmentList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('margens')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'margens'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Margem de Lucro</span>
          </button>
        </div>

        {/* Configuration for Dead stock */}
        {activeTab === 'parados' && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Período sem saídas:</span>
            <select
              value={deadStockPeriodDays}
              onChange={(e) => setDeadStockPeriodDays(Number(e.target.value))}
              className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded font-medium text-slate-800"
            >
              <option value={30}>Últimos 30 dias</option>
              <option value={60}>Últimos 60 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Ranking de Mais e Menos Vendidos */}
      {activeTab === 'ranking' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Mais Vendidos */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-semibold text-slate-800">
                  Mais Vendidos (Por Quantidade & Valor)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Top saídas</span>
            </div>

            <div className="space-y-2">
              {salesAnalysis.byQtyDesc.slice(0, 5).map((item, idx) => (
                <div
                  key={item.product.id}
                  onClick={() => onSelectProduct(item.product.id)}
                  className="p-2.5 bg-slate-50/70 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-200 font-mono text-[10px] font-bold text-slate-700 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900 block line-clamp-1">
                        {item.product.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.product.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold font-mono text-slate-800 block">
                      {item.totalQtySold} {item.product.unitOfMeasure} vendidos
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatKwanza(item.totalRevenueKz)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Menos Vendidos / Baixa Rotatividade */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-semibold text-slate-800">
                  Menor Rotatividade de Vendas
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Candidatos a promoção</span>
            </div>

            <div className="space-y-2">
              {salesAnalysis.leastSelling.slice(0, 5).map((item) => (
                <div
                  key={item.product.id}
                  onClick={() => onSelectProduct(item.product.id)}
                  className="p-2.5 bg-slate-50/70 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800 block line-clamp-1">
                      {item.product.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Estoque em depósito: {item.currentStock} {item.product.unitOfMeasure}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-mono block">
                      {item.totalQtySold} saídas registradas
                    </span>
                    <span className="text-[10px] text-amber-600">Baixa procura</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Produtos Parados (Dead Stock) */}
      {activeTab === 'parados' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-amber-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <div>
                <h4 className="text-xs font-semibold text-slate-800">
                  Produtos Sem Saída nos Últimos {deadStockPeriodDays} Dias
                </h4>
                <p className="text-[11px] text-slate-500">
                  Estes itens não tiveram nenhuma movimentação de venda ou saída registrada no período.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Imobilizado</span>
              <div className="font-mono font-bold text-amber-700 text-sm">
                {formatKwanza(totalDeadStockCapital)}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-right">Estoque Parado</th>
                  <th className="py-3 px-4 text-right">Custo Unitário</th>
                  <th className="py-3 px-4 text-right">Capital Parado (Kz)</th>
                  <th className="py-3 px-4 text-center">Ações Sugeridas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {deadStock.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Excelente! Nenhum produto estagnado no período de {deadStockPeriodDays} dias.
                    </td>
                  </tr>
                ) : (
                  deadStock.map((item) => (
                    <tr
                      key={item.product.id}
                      onClick={() => onSelectProduct(item.product.id)}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.product.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.product.category}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {item.currentStock} {item.product.unitOfMeasure}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatKwanza(item.product.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                        {formatKwanza(item.capitalTiedUp)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                          Criar Promoção / Campanha
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Reposição Prioritária */}
      {activeTab === 'reposicao' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-rose-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <div>
                <h4 className="text-xs font-semibold text-slate-800">
                  Produtos Abaixo do Limite Mínimo de Segurança
                </h4>
                <p className="text-[11px] text-slate-500">
                  Priorize ordens de compra para evitar perda de vendas por rutura de estoque.
                </p>
              </div>
            </div>

            {onGoToPurchaseList && (
              <button
                type="button"
                onClick={onGoToPurchaseList}
                className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs flex items-center gap-1"
              >
                <span>Ir para Lista de Compras</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-right">Estoque Atual</th>
                  <th className="py-3 px-4 text-right">Limite Mínimo</th>
                  <th className="py-3 px-4 text-right">Déficit a Comprar</th>
                  <th className="py-3 px-4 text-right">Custo Est. Reposição</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {replenishmentList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Nenhum produto abaixo do limite de segurança no momento.
                    </td>
                  </tr>
                ) : (
                  replenishmentList.map((item) => (
                    <tr
                      key={item.product.id}
                      onClick={() => onSelectProduct(item.product.id)}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.product.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.product.category}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {item.currentStock} {item.product.unitOfMeasure}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {item.minLimit} {item.product.unitOfMeasure}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        +{item.deficit} {item.product.unitOfMeasure}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                        {formatKwanza(item.estimatedRestockCost)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Reposição Urgente
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Margem de Lucro por Produto */}
      {activeTab === 'margens' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-800">
                Análise de Margens de Lucro por Produto (Kz & %)
              </h4>
              <p className="text-[11px] text-slate-500">
                Identifique produtos com menor margem para renegociação com fornecedores ou reajuste de preço.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4 text-right">Preço de Custo</th>
                  <th className="py-3 px-4 text-right">Preço de Venda</th>
                  <th className="py-3 px-4 text-right">Margem Unitária (Kz)</th>
                  <th className="py-3 px-4 text-right">Margem Bruta (%)</th>
                  <th className="py-3 px-4 text-center">Classificação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {marginRankings.map((item) => {
                  const isLowMargin = item.marginPercent < 25;
                  const isHighMargin = item.marginPercent >= 40;

                  return (
                    <tr
                      key={item.product.id}
                      onClick={() => onSelectProduct(item.product.id)}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.product.name}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatKwanza(item.product.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatKwanza(item.product.salePrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {formatKwanza(item.unitMarginKz)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            isLowMargin
                              ? 'text-amber-600'
                              : isHighMargin
                              ? 'text-emerald-600'
                              : 'text-slate-800'
                          }
                        >
                          {item.marginPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isLowMargin ? (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium">
                            Margem Estreita
                          </span>
                        ) : isHighMargin ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                            Alta Margem
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Média</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
