import { useToday } from '../../hooks/useToday';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  DollarSign,
  Receipt,
  ShoppingCart,
  Layers,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { DashboardPeriod, computeDashboardData, computeTopProducts,
} from './dashboardUtils';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardChart } from './DashboardChart';
import { TopProductsList } from './TopProductsList';

export const DashboardView: React.FC = () => {
  const today = useToday();
  const { sales, warehouses, companies, products,
    stockConfigs,
    getCurrentStock,
    transports,
  } = useStock();

  // Filter States
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('todas');
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('semana');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('Kz');

  // Empresas visíveis no seletor:
  // - Empresa Desativada: não aparece na lista de opções (excluída por completo)
  // - Empresa Parada: aparece em cinza com a indicação "Parada", não selecionável
  const visibleCompanies = useMemo(() => {
    return companies.filter((c) => c.status !== 'desativada');
  }, [companies]);

  // Se a empresa atualmente selecionada for desativada ou parada, reverte para 'todas'
  useEffect(() => {
    if (selectedCompanyId !== 'todas') {
      const current = companies.find((c) => c.id === selectedCompanyId);
      if (!current || current.status === 'desativada' || current.status === 'parada') {
        setSelectedCompanyId('todas');
      }
    }
  }, [companies, selectedCompanyId]);

  // Detect distinct currencies available in the company/sales scope (only non-disabled companies)
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    visibleCompanies.forEach((c) => {
      set.add(c.currency);
    });
    return Array.from(set);
  }, [visibleCompanies]);

  // Ensure selectedCurrency is valid
  useEffect(() => {
    if (availableCurrencies.length > 0 && !availableCurrencies.includes(selectedCurrency)) {
      setSelectedCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, selectedCurrency]);

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
      referenceDate: new Date(`${today}T12:00:00`),
      period: selectedPeriod,
      selectedCompanyId,
      selectedCurrency,
      warehouses,
      companies,
    });
  }, [
    today,
    sales,
    selectedPeriod,
    selectedCompanyId,
    selectedCurrency,
    warehouses,
    companies,
  ]);

  // Compute Top Selling Products
  const topProducts = useMemo(() => {
    return computeTopProducts({
      sales,
      referenceDate: new Date(`${today}T12:00:00`),
      period: selectedPeriod,
      selectedCompanyId,
      selectedCurrency,
      warehouses,
      companies,
      products,
      limit: 8,
    });
  }, [
    today,
    sales,
    selectedPeriod,
    selectedCompanyId,
    selectedCurrency,
    warehouses,
    companies,
    products,
  ]);

  const eligibleWarehouses = new Set(
    warehouses
      .filter((w) => {
        const company = companies.find((c) => c.id === w.companyId);
        return (
          company?.status !== 'desativada' &&
          !!company &&
          (selectedCompanyId === 'todas' || company.id === selectedCompanyId)
        );
      })
      .map((w) => w.id),
  );
  const lowStock = stockConfigs.filter(
    (config) =>
      !config.variationId &&
      eligibleWarehouses.has(config.warehouseId) &&
      config.minLimit > 0 &&
      getCurrentStock(config.productId, config.warehouseId) < config.minLimit,
  ).length;
  const pendingDeliveries = transports.filter(
    (t) =>
      (t.status === 'pendente' || t.status === 'em_transito') &&
      sales.some(
        (s) =>
          s.id === t.saleId &&
          eligibleWarehouses.has(s.warehouseId) &&
          s.status === 'concluida',
      ),
  ).length;
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

  return (
    <div id="dashboard-container" className="space-y-6 pb-12">
      {/* Top Header & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Title & Status */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Dashboard de Vendas
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Tempo Real
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visão consolidada de desempenho comercial e análise comparativa de
            períodos.
          </p>
        </div>

        {/* Right Controls: Company Selector & Period Segmented Control */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Company Selector Dropdown */}
          <div className="relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Building2 className="w-4 h-4" />
            </div>
            <select
              id="dashboard-company-select"
              value={selectedCompanyId}
              onChange={(e) => {
                const val = e.target.value;
                const comp = companies.find((c) => c.id === val);
                if (comp && comp.status === 'parada') return;
                setSelectedCompanyId(val);
              }}
              className="w-full pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-700/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 transition-colors cursor-pointer appearance-none [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
            >
              <option value="todas">Todas as empresas</option>
              {visibleCompanies.map((comp) => {
                const isParada = comp.status === 'parada';
                return (
                  <option
                    key={comp.id}
                    value={comp.id}
                    disabled={isParada}
                    className={
                      isParada
                        ? 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
                        : 'text-slate-800 dark:text-slate-100'
                    }
                  >
                    {comp.name} ({comp.currency}){isParada ? ' — Parada' : ''}
                  </option>
                );
              })}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
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
            className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700"
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
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
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
          className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <Layers className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>
              As empresas cadastradas utilizam moedas diferentes. Os totais são
              calculados separadamente por moeda para preservar a precisão
              contabilística.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
              Visualizar moeda:
            </span>
            <div className="inline-flex bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-amber-200 dark:border-amber-900/60 shadow-2xs">
              {availableCurrencies.map((curr) => (
                <button
                  key={curr}
                  type="button"
                  id={`dashboard-currency-toggle-${curr}`}
                  onClick={() => setSelectedCurrency(curr)}
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    metrics.currency === curr
                      ? 'bg-amber-800 text-white dark:bg-amber-700'
                      : 'text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-900/40'
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

      <section
        id="dashboard-operational-summary"
        className="rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface p-4 space-y-3"
      >
        <div>
          <h2 className="text-sm font-semibold">Acompanhamento operacional</h2>
          <p className="text-xs text-slate-500 dark:text-dm-muted mt-1">
            Situação atual das empresas selecionadas ·{' '}
            {new Date(`${today}T12:00:00`).toLocaleDateString('pt-PT')}
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-dm-muted">
              Produtos abaixo do mínimo por armazém
            </p>
            <p className="text-xl font-semibold mt-1">{lowStock}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-dm-muted">
              Entregas por concluir
            </p>
            <p className="text-xl font-semibold mt-1">{pendingDeliveries}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-dm-muted">
              Empresas visíveis neste âmbito
            </p>
            <p className="text-xl font-semibold mt-1">
              {
                visibleCompanies.filter(
                  (c) =>
                    selectedCompanyId === 'todas' || c.id === selectedCompanyId,
                ).length
              }
            </p>
          </div>
        </div>
        {!metrics.currentCount && (
          <p className="text-xs text-slate-500 dark:text-dm-muted">
            Não há vendas concluídas no período e moeda selecionados. Podes
            mudar os filtros para consultar o histórico.
          </p>
        )}
      </section>
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
