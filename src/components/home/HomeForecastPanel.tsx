import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useHome } from '../../context/HomeContext';
import { HomeCurrency } from '../../types/home';
import { formatHomeMoney, todayLocal } from '../../utils/home';
import { homeForecast } from '../../utils/homeAnalysis';

export function HomeForecastPanel({ currency, onOpenPlanning }: { currency: HomeCurrency; onOpenPlanning: () => void }) {
  const { data } = useHome();
  const [period, setPeriod] = useState('week');
  const today = todayLocal();
  const length = period === 'week' ? 7 : 30;
  const dates = Array.from({ length }, (_, index) => {
    const date = new Date(`${today}T12:00:00`);
    date.setDate(date.getDate() + index);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  const forecast = homeForecast(data, today, dates[dates.length - 1], currency);
  const series = dates.map((date) => ({
    date: date.slice(8, 10) + '/' + date.slice(5, 7),
    current: forecast.opening,
    projected: forecast.steps.filter((step) => step.date <= date).at(-1)?.balance ?? forecast.opening,
  }));
  return <section id="home-dashboard-forecast" className="rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface p-4 sm:p-5 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-sm font-semibold">Saldo atual e previsão</h2>
      <div className="flex gap-2">
        <select aria-label="Período da previsão no dashboard" value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-lg border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated px-3 py-2 text-xs">
          <option value="week">Próximos 7 dias</option><option value="month">Próximos 30 dias</option>
        </select>
        <button type="button" onClick={onOpenPlanning} className="rounded-lg border border-slate-200 dark:border-dm-border px-3 py-2 text-xs">Abrir planeamento</button>
      </div>
    </div>
    <p className="text-xs text-slate-500 dark:text-dm-muted">Saldo atual: {formatHomeMoney(forecast.opening, currency)} · Previsto: {formatHomeMoney(forecast.closing, currency)}. A linha verde mantém o saldo de hoje como referência; a cinzenta simula contas e planos, sem movimentar dinheiro.</p>
    <div className="h-64 min-w-0" role="img" aria-label={`Previsão de ${formatHomeMoney(forecast.opening, currency)} para ${formatHomeMoney(forecast.closing, currency)} nos próximos ${length} dias`}>
      <ResponsiveContainer width="100%" height="100%"><LineChart data={series} margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={24}/>
        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={80} tickFormatter={(value: number) => new Intl.NumberFormat('pt-PT', { notation: 'compact' }).format(value)} />
        <Tooltip formatter={(value) => formatHomeMoney(Number(value), currency)} contentStyle={{ background: 'var(--color-dm-surface, #fff)', color: 'var(--color-dm-text, #0f172a)' }} />
        <Legend />
        <Line type="stepAfter" dataKey="current" name="Saldo atual (referência)" stroke="#059669" strokeWidth={2} dot={false}/>
        <Line type="stepAfter" dataKey="projected" name="Saldo previsto" stroke="#94a3b8" strokeWidth={2} dot={false}/>
      </LineChart></ResponsiveContainer>
    </div>
    {!forecast.steps.length && <p className="text-xs text-slate-500 dark:text-dm-muted">Sem movimentos previstos neste período. Adiciona planos ou contas agendadas no Planeamento.</p>}
    {!!(forecast.unallocatedBills + forecast.unallocatedDebts) && <p className="text-xs text-amber-700 dark:text-amber-300">Fora da previsão: {forecast.unallocatedBills} contas e {forecast.unallocatedDebts} dívidas sem carteira atribuída. Confere o Planeamento para mais detalhes.</p>}
  </section>;
}
