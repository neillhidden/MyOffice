import { homeCategoryName } from '../../utils/homeCategories';
import { useHome } from '../../context/HomeContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { HomeCurrency, HomeEntry } from '../../types/home';
import { formatHomeMoney } from '../../utils/home';
import { useTheme } from '../../context/ThemeContext';

export function HomeCharts({
  entries,
  month,
  currency,
}: {
  entries: HomeEntry[];
  month: string;
  currency: HomeCurrency;
}) {
  const { actualTheme } = useTheme();
  const { data } = useHome();
  const color = actualTheme === 'dark' ? '#a1a1aa' : '#64748b';
  const [year, monthNumber] = month.split('-').map(Number);
  const days = Array.from(
    { length: new Date(year, monthNumber, 0).getDate() },
    (_, i) => ({ day: String(i + 1), income: 0, expense: 0 }),
  );
  const categories = new Map<string, number>();
  for (const e of entries) {
    if (e.type !== 'income' && e.type !== 'expense') continue;
    const day = days[Number(e.date.slice(8, 10)) - 1];
    if (day) day[e.type] += Math.round(e.amount * 100) / 100;
    if (e.type === 'expense')
      categories.set(
        e.category,
        (categories.get(e.category) ?? 0) + Math.round(e.amount * 100) / 100,
      );
  }
  const slices = Array.from(categories, ([name, value]) => ({
    id: name,
    name: homeCategoryName(data, name, undefined, 'expense'),
    value,
  })).sort((a, b) => b.value - a.value);
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const colors = [
    '#6366f1',
    '#f97316',
    '#10b981',
    '#ec4899',
    '#0ea5e9',
    '#eab308',
    '#8b5cf6',
    '#14b8a6',
  ];
  const panel =
    'min-w-0 rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface p-4';
  const tooltip = {
    backgroundColor: actualTheme === 'dark' ? '#18181b' : '#fff',
    borderColor: actualTheme === 'dark' ? '#3f3f46' : '#e2e8f0',
    color: actualTheme === 'dark' ? '#fafafa' : '#0f172a',
    borderRadius: 8,
  };
  return (
    <section id="home-dashboard-charts" className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        {(
          [
            { key: 'income', title: 'Rendimentos do mês', color: '#10b981' },
            { key: 'expense', title: 'Despesas do mês', color: '#f43f5e' },
          ] as const
        ).map((chart) => (
          <div key={chart.key} className={panel}>
            <h2 className="text-sm font-semibold">{chart.title}</h2>
            <p className="text-xs text-slate-500 dark:text-dm-muted mt-1">
              Por dia · {currency === 'AOA' ? 'Kz' : 'USD'} ·{' '}
              {formatHomeMoney(
                days.reduce((sum, d) => sum + d[chart.key], 0),
                currency,
              )}
            </p>
            <div
              className="h-56 mt-4"
              role="img"
              aria-label={`${chart.title}, valores por dia em ${currency}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={days}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <XAxis
                    dataKey="day"
                    tick={{ fill: color, fontSize: 10 }}
                    tickLine={false}
                  />
                  <YAxis
                    width={48}
                    tick={{ fill: color, fontSize: 10 }}
                    tickFormatter={(v) =>
                      Intl.NumberFormat('pt-PT', {
                        notation: 'compact',
                      }).format(v)
                    }
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltip}
                    labelFormatter={(value) => `Dia ${value}`}
                    formatter={(value) => [
                      formatHomeMoney(Number(value), currency),
                      chart.title,
                    ]}
                  />
                  <Bar
                    dataKey={chart.key}
                    fill={chart.color}
                    radius={[3, 3, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
      <div className={panel}>
        <h2 className="text-sm font-semibold">Despesas por categoria</h2>
        {!total ? (
          <p className="text-xs text-slate-500 dark:text-dm-muted py-10 text-center">
            Sem despesas realizadas neste mês e moeda.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <div
              className="h-64"
              role="img"
              aria-label="Gráfico de pizza das despesas por categoria"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="45%"
                    outerRadius="75%"
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {slices.map((s, i) => (
                      <Cell key={s.id} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltip}
                    formatter={(value) =>
                      formatHomeMoney(Number(value), currency)
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3">
              {slices.map((s, i) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: colors[i % colors.length] }}
                    />
                    {s.name}
                  </span>
                  <span className="font-mono">
                    {formatHomeMoney(s.value, currency)} ·{' '}
                    {Math.round((s.value / total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
