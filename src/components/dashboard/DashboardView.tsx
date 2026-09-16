import React, { useState, useMemo } from 'react';
import {
  Building2,
  Calendar,
  DollarSign,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { DashboardPeriod, computeDashboardData, computeTopProducts } from './dashboardUtils';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardChart } from './DashboardChart';
import { TopProductsList } from './TopProductsList';
import { formatCurrencyValue } from '../../utils/formatters';

export const DashboardView: React.FC = () => {
  const { sales, warehouses, companies, products } = useStock();

  // Filter States
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('todas');
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('semana');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('Kz');

  // Detect distinct currencies available in the company/sales scope
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.status === 'ativa') set.add(c.currency);
    });
    return Array.from(set);
  }, [companies]);

  // Compute Dashboard Data
  const {
    chartData,
    metrics,
    periodLabel,
    currentPeriodRangeDescription,
    previousPeriodRangeDescription,
  } = useMemo(() => {
    return computeDashboardData({
      sales,
      period: selectedPeriod,
      selectedCompanyId,
      selectedCurrency,
      warehouses,
      companies,
    });
  }, [sales, selectedPeriod, selectedCompanyId, selectedCurrency, warehouses, companies]);

  // Compute Top Selling Products
  const topProducts = useMemo(() => {
    return computeTopProducts({
      sales,
      period: selectedPeriod,
      selectedCompanyId,
      selectedCurrency,
      warehouses,
      companies,
      products,
      limit: 8,
    });
  }, [sales, selectedPeriod, selectedCompanyId, selectedCurrency, warehouses, companies, products]);

  // Subtitle comparison text based on period
  const comparisonPeriodLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 'semana':
        return 'vs. semana anterior';
      case 'mes':
        return 'vs. mês anterior';
      case 'ano':
        return 'vs. ano anterior';
    }
  }, [selectedPeriod]);

  // Selected company name
  const selectedCompanyName = useMemo(() => {
    if (selectedCompanyId === 'todas') return 'Todas as Empresas';
    const comp = companies.find((c) => c.id === selectedCompanyId);
    return comp ? comp.name : 'Empresa';
  }, [selectedCompanyId, companies]);

  return (
    <div id="dashboard-container" className="space-y-6 pb-12">
      {/* Top Header & Filters Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Title & Status */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard de Vendas</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Tempo Real
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visão consolidada de desempenho comercial e análise comparativa de períodos.
          </p>
        </div>

        {/* Right Controls: Company Selector & Period Segmented Control */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Company Selector Dropdown */}
          <div className="relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Building2 className="w-4 h-4" />
            </div>
            <select
              id="dashboard-company-select"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer appearance-none"
            >
              <option value="todas">Todas as empresas</option>
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name} ({comp.currency})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Period Selector Segmented Control */}
          <div
            id="dashboard-period-selector"
            className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/60"
          >
            {(['semana', 'mes', 'ano'] as DashboardPeriod[]).map((period) => {
              const isActive = selectedPeriod === period;
              const labels = {
                semana: 'Semana',
                mes: 'Mês',
                ano: 'Ano',
              };

              return (
                <button
                  key={period}
                  type="button"
                  id={`dashboard-period-btn-${period}`}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {labels[period]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Multi-Currency Notice / Pill Selector (if 'Todas as empresas' has multiple currencies) */}
      {metrics.isMultiCurrency && (
        <div
          id="dashboard-currency-banner"
          className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2 text-amber-900">
            <Layers className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              As empresas cadastradas utilizam moedas diferentes. Os totais são calculados
              separadamente por moeda para preservar a precisão contábil.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-[11px] font-medium text-amber-800">Visualizar moeda:</span>
            <div className="inline-flex bg-white rounded-lg p-0.5 border border-amber-200 shadow-2xs">
              {availableCurrencies.map((curr) => (
                <button
                  key={curr}
                  type="button"
                  id={`dashboard-currency-toggle-${curr}`}
                  onClick={() => setSelectedCurrency(curr)}
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-md transition-colors ${
                    metrics.currency === curr
                      ? 'bg-amber-800 text-white'
                      : 'text-amber-800 hover:bg-amber-100/60'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Total Vendido */}
        <DashboardMetricCard
          id="metric-total-vendido"
          title={`Total Vendido (${metrics.currency})`}
          value={metrics.currentTotal}
          isCurrency={true}
          currency={metrics.currency}
          changePercent={metrics.totalChangePercent}
          comparisonText={comparisonPeriodLabel}
          icon={DollarSign}
        />

        {/* Card 2: Número de Vendas */}
        <DashboardMetricCard
          id="metric-numero-vendas"
          title="Número de Vendas"
          value={`${metrics.currentCount} ${metrics.currentCount === 1 ? 'venda' : 'vendas'}`}
          changePercent={metrics.countChangePercent}
          comparisonText={comparisonPeriodLabel}
          icon={Receipt}
        />

        {/* Card 3: Ticket Médio */}
        <DashboardMetricCard
          id="metric-ticket-medio"
          title={`Ticket Médio (${metrics.currency})`}
          value={metrics.currentAverageTicket}
          isCurrency={true}
          currency={metrics.currency}
          changePercent={metrics.ticketChangePercent}
          comparisonText={comparisonPeriodLabel}
          icon={ShoppingCart}
        />
      </div>

      {/* Main Chart Section: Comparison of Periods */}
      <DashboardChart
        id="dashboard-main-chart"
        data={chartData}
        period={selectedPeriod}
        currency={metrics.currency}
        currentRangeLabel={currentPeriodRangeDescription}
        previousRangeLabel={previousPeriodRangeDescription}
      />

      {/* Bottom Section: Top Products */}
      <TopProductsList
        id="dashboard-top-products"
        items={topProducts}
        currency={metrics.currency}
        periodLabel={periodLabel}
      />
    </div>
  );
};
