import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrencyValue } from '../../utils/formatters';

interface DashboardMetricCardProps {
  id: string;
  title: string;
  value: string | number;
  isCurrency?: boolean;
  currency?: string;
  changePercent: number | null;
  comparisonText: string;
  icon: React.ElementType;
}

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  id,
  title,
  value,
  isCurrency = false,
  currency = 'Kz',
  changePercent,
  comparisonText,
  icon: Icon,
}) => {
  const isPositive = changePercent !== null && changePercent > 0;
  const isNegative = changePercent !== null && changePercent < 0;
  const isZero = changePercent === 0 || changePercent === null;

  const displayValue = isCurrency && typeof value === 'number'
    ? formatCurrencyValue(value, currency)
    : value;

  return (
    <div
      id={id}
      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-tight">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{displayValue}</h3>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {changePercent !== null && (
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
              isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800'
                : isNegative
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700'
            }`}
          >
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {isZero && <Minus className="w-3 h-3" />}
            {isPositive ? '+' : ''}
            {changePercent.toFixed(1)}%
          </span>
        )}
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">{comparisonText}</span>
      </div>
    </div>
  );
};
