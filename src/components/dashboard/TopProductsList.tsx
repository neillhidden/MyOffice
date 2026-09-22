import React from 'react';
import { Package, Award } from 'lucide-react';
import { TopProductItem } from './dashboardUtils';
import { formatCurrencyValue } from '../../utils/formatters';

interface TopProductsListProps {
  id?: string;
  items: TopProductItem[];
  currency: string;
  periodLabel: string;
}

export const TopProductsList: React.FC<TopProductsListProps> = ({
  id = 'top-products-list-card',
  items,
  currency,
  periodLabel,
}) => {
  return (
    <div
      id={id}
      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Produtos Mais Vendidos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Top produtos ordenados por receita gerada na {periodLabel.toLowerCase()}
          </p>
        </div>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2.5 py-1 rounded-md">
          {items.length} {items.length === 1 ? 'produto' : 'produtos'}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500">
          <Package className="w-9 h-9 mx-auto mb-2 text-slate-300 dark:text-slate-600 stroke-1" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Nenhum produto vendido neste período</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            As vendas concluídas neste intervalo serão listadas aqui.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((prod, index) => {
            const rank = index + 1;

            return (
              <div
                key={prod.productId}
                id={`top-product-item-${prod.productId}`}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group"
              >
                {/* Left: Rank & Name */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Rank Badge */}
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                      rank === 1
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : rank === 2
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        : rank === 3
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {rank}
                  </span>

                  {/* Product Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {prod.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{prod.sku}</span>
                      <span>•</span>
                      <span>{prod.category}</span>
                    </div>

                    {/* Mini progress share bar */}
                    <div className="w-full max-w-[200px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(8, prod.percentageOfTotal))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Quantity & Revenue */}
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrencyValue(prod.totalRevenue, currency)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{prod.quantity}</span>{' '}
                    {prod.quantity === 1 ? 'unidade' : 'unidades'} ({prod.percentageOfTotal.toFixed(1)}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
