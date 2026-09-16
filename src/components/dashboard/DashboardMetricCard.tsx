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
      className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs transition-all hover:border-slate-300"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-medium text-slate-500 tracking-tight">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{displayValue}</h3>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {changePercent !== null && (
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : isNegative
                ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                : 'bg-slate-50 text-slate-600 border border-slate-200/60'
            }`}
          >
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {isZero && <Minus className="w-3 h-3" />}
            {isPositive ? '+' : ''}
            {changePercent.toFixed(1)}%
          </span>
        )}
        <span className="text-[11px] text-slate-500 font-normal truncate">{comparisonText}</span>
      </div>
    </div>
  );
};
