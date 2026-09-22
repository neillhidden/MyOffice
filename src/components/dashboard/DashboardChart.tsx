import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartDataPoint, DashboardPeriod } from './dashboardUtils';
import { formatCurrencyValue } from '../../utils/formatters';

interface DashboardChartProps {
  id?: string;
  data: ChartDataPoint[];
  period: DashboardPeriod;
  currency: string;
  currentRangeLabel: string;
  previousRangeLabel: string;
}

// Compact currency formatter for Y-axis (e.g. 500k, 1.2M)
function formatCompactValue(value: number, currency: string): string {
  if (value === 0) return '0';
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 0)}k`;
  }
  return `${value}`;
}

export const DashboardChart: React.FC<DashboardChartProps> = ({
  id = 'dashboard-sales-chart',
  data,
  period,
  currency,
  currentRangeLabel,
  previousRangeLabel,
}) => {
  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const pointData: ChartDataPoint = payload[0].payload;
    const current = pointData.currentValue;
    const previous = pointData.previousValue;
    const diff = current - previous;
    const diffPercent = previous > 0 ? (diff / previous) * 100 : current > 0 ? 100 : 0;

    return (
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-lg p-3.5 shadow-xl border border-slate-800 text-xs min-w-[210px] space-y-2 z-50">
        <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span>{pointData.tooltipLabel}</span>
        </div>

        {/* Current Period */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
            <span className="text-slate-300">Período Atual:</span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-white">
              {formatCurrencyValue(current, currency)}
            </div>
            {pointData.currentSalesCount > 0 && (
              <div className="text-[10px] text-slate-400">
                {pointData.currentSalesCount} {pointData.currentSalesCount === 1 ? 'venda' : 'vendas'}
              </div>
            )}
          </div>
        </div>

        {/* Previous Period */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-slate-400">Período Anterior:</span>
          </div>
          <div className="text-right">
            <div className="font-medium text-slate-300">
              {formatCurrencyValue(previous, currency)}
            </div>
            {pointData.previousSalesCount > 0 && (
              <div className="text-[10px] text-slate-400">
                {pointData.previousSalesCount} {pointData.previousSalesCount === 1 ? 'venda' : 'vendas'}
              </div>
            )}
          </div>
        </div>

        {/* Comparison Diff */}
        <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Variação:</span>
          <span
            className={`font-semibold ${
              diff > 0
                ? 'text-emerald-400'
                : diff < 0
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {diff > 0 ? '+' : ''}
            {diff !== 0 ? `${formatCurrencyValue(diff, currency)} (${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(1)}%)` : '0%'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      id={id}
      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs"
    >
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Comparação de Período
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evolução de faturação: <span className="font-medium text-slate-700 dark:text-slate-200">{currentRangeLabel}</span> vs.{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">{previousRangeLabel}</span>
          </p>
        </div>

        {/* Minimalist Legend */}
        <div className="flex items-center gap-4 text-xs shrink-0 self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 rounded-full bg-blue-600 inline-block" />
            <span className="font-medium text-slate-800 dark:text-slate-200">Período Atual</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
            <span className="text-slate-500 dark:text-slate-400">Período Anterior</span>
          </div>
        </div>
      </div>

      {/* Chart Graphic Area */}
      <div className="w-full h-[300px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 12, right: 12, left: -14, bottom: 6 }}
          >
            {/* Clean, subtle grid lines */}
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} vertical={false} />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: '#64748b', strokeOpacity: 0.3 }}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              interval={period === 'mes' ? 2 : 0}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(v) => formatCompactValue(v, currency)}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Line 1: Previous Period (Muted dashed slate) */}
            <Line
              type="monotone"
              dataKey="previousValue"
              name="Período Anterior"
              stroke="#94a3b8"
              strokeWidth={1.75}
              strokeDasharray="4 4"
              dot={{ r: period === 'mes' ? 1.5 : 2.5, fill: '#94a3b8', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#64748b', stroke: '#ffffff', strokeWidth: 2 }}
            />

            {/* Line 2: Current Period (Accent solid blue) */}
            <Line
              type="monotone"
              dataKey="currentValue"
              name="Período Atual"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: period === 'mes' ? 2 : 3.5, fill: '#2563eb', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
