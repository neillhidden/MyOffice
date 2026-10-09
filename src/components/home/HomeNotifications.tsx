import { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { settleHomeOccurrence } from '../../utils/homeRecurrence';
import { exchangeLabel } from '../../utils/home';

export function HomeNotifications() {
  const { data, update } = useHome();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const pending = (data.occurrences ?? []).filter((o) => o.state === 'pending');
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', key);
    };
  }, []);
  const action = (id: string, accept: boolean) => {
    try {
      update((d) => settleHomeOccurrence(d, id, accept ? 'accept' : 'ignore'));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível guardar.');
    }
  };
  return (
    <div ref={ref} className="relative">
      <button
        id="home-notifications-button"
        type="button"
        aria-label={`Notificações Home: ${pending.length} pendentes`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-dm-elevated"
      >
        <Bell className="w-4 h-4" />
        {pending.length > 0 && (
          <span
            id="home-notifications-badge"
            className="absolute -top-1 -right-1 rounded-full bg-rose-600 text-white text-[9px] px-1"
          >
            {pending.length}
          </span>
        )}
      </button>
      {open && (
        <section
          id="home-notifications-popover"
          aria-label="Confirmações pendentes"
          className="fixed right-3 top-14 z-50 w-[calc(100vw-1.5rem)] sm:w-96 max-h-[75vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface shadow-lg p-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold">Confirmações pendentes</h2>
            <button
              aria-label="Fechar notificações"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {error && (
            <p role="alert" className="text-xs text-rose-600 mt-3">
              {error}
            </p>
          )}
          {!pending.length && (
            <p className="text-xs text-slate-500 dark:text-dm-muted mt-4">
              Não há confirmações pendentes.
            </p>
          )}
          {pending.map((o) => (
            <article
              key={o.id}
              data-home-occurrence-id={o.id}
              className="py-3 border-b border-slate-100 dark:border-dm-border"
            >
              <p className="text-sm font-medium">{o.snapshot.title}</p>
              <p className="text-xs text-slate-500 dark:text-dm-muted mt-1">
                {o.snapshot.type === 'income' ? 'A receber' : 'A pagar'} ·
                Vencimento{' '}
                {new Date(o.due + 'T12:00:00').toLocaleDateString('pt-PT')}
              </p>
              <p className="font-mono text-xs mt-1">
                {exchangeLabel(
                  o.snapshot.amount,
                  o.snapshot.currency,
                  o.snapshot.exchangeRate,
                )}
              </p>
              {o.error && (
                <p className="text-xs text-rose-600 mt-2">
                  {o.error} Corrige a carteira e aceita novamente.
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  className="dm-btn-primary rounded-lg bg-slate-900 text-white px-3 py-2 text-xs"
                  onClick={() => action(o.id, true)}
                >
                  Aceitar
                </button>
                <button
                  className="rounded-lg border border-slate-200 dark:border-dm-border px-3 py-2 text-xs"
                  onClick={() => action(o.id, false)}
                >
                  Ignorar
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
