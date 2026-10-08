import { useToday } from '../../hooks/useToday';
import { HomeCategories, HomeShopping } from './HomeShopping';
import { AppearanceSettings } from '../settings/AppearanceSettings';
import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Wallet,
  Target,
  Check,
  Pencil,
  Download,
  Upload,
  X,
  House,
  ShieldCheck,
} from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { HomeData, HomeEntry, HomeSection } from '../../types/home';
import {
  HOME_CATEGORIES,
  addHomeEntry,
  balances,
  billPaid,
  dueDate,
  effectiveEntries,
  money,
  reverseHomeEntry,
  text,
  todayLocal,
  validateHomeData,
  validDate,
  validMonth,
} from '../../utils/home';
import { createId } from '../../utils/ids';
import { formatKwanza } from '../../utils/formatters';

const panel =
  'rounded-xl border border-slate-200/80 dark:border-dm-border bg-white dark:bg-dm-surface p-4 sm:p-5';
const primary =
  'dm-btn-primary inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50';
const secondary =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-dm-border px-3 py-2 text-xs font-medium text-slate-700 dark:text-dm-text hover:bg-slate-50 dark:hover:bg-dm-elevated';
const input =
  'w-full min-w-0 rounded-lg border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated px-3 py-2.5 text-sm text-slate-900 dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-slate-400';
const muted = 'text-xs text-slate-500 dark:text-dm-muted';
const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('pt-PT');
const percent = (saved: number, target: number) =>
  Math.min(100, Math.max(0, Math.round((saved / target) * 100)));
type FormKind =
  | 'entry'
  | 'account'
  | 'budget'
  | 'bill'
  | 'goal'
  | 'contribution'
  | 'task'
  | 'payment'
  | 'reversal';

function HomeModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLElement>('input,select,button')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab') {
        const items = Array.from<HTMLElement>(
          ref.current?.querySelectorAll<HTMLElement>(
            'button,input,select,textarea,[tabindex="0"]',
          ) || [],
        ).filter((el) => !el.hasAttribute('disabled'));
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-modal-title"
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-dm-border p-5">
          <h2 id="home-modal-title" className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={secondary}
            aria-label="Fechar formulário"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-dm-elevated"
    >
      <div
        className="h-full rounded-full bg-indigo-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className={`${muted} py-6 text-center`}>{children}</p>;
}

export function HomeView({
  section,
  onNavigate,
}: {
  section: HomeSection;
  onNavigate: (section: HomeSection) => void;
}) {
  const { data, update, storageError, importData } = useHome();
  const today = useToday();
  const thisMonth = today.slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const previousMonthRef = useRef(thisMonth);
  useEffect(() => {
    const previous = previousMonthRef.current;
    if (previous !== thisMonth) {
      setMonth(current => current === previous ? thisMonth : current);
      previousMonthRef.current = thisMonth;
    }
  }, [thisMonth]);
  const [query, setQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [form, setForm] = useState<{
    kind: FormKind;
    values: Record<string, string>;
  } | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingImport, setPendingImport] = useState<HomeData | null>(null);
  const [importConfirmation, setImportConfirmation] = useState('');
  const [name, setName] = useState(data.name);
  useEffect(() => setName(data.name), [data.name]);
  const totals = balances(data);
  const active = effectiveEntries(data);
  const period = active.filter((e) => e.date.startsWith(month));
  const income =
    period
      .filter((e) => e.type === 'income')
      .reduce((s, e) => s + Math.round(e.amount * 100), 0) / 100;
  const spent =
    period
      .filter((e) => e.type === 'expense')
      .reduce((s, e) => s + Math.round(e.amount * 100), 0) / 100;
  const available =
    data.accounts
      .filter((a) => a.kind === 'current')
      .reduce((s, a) => s + Math.round(totals[a.id] * 100), 0) / 100;
  const reserved =
    data.accounts
      .filter((a) => a.kind === 'savings')
      .reduce((s, a) => s + Math.round(totals[a.id] * 100), 0) / 100;
  const expenseCategories = Array.from(
    new Set([
      ...HOME_CATEGORIES,
      ...(data.categories ?? []),
      ...data.budgets.map((b) => b.category),
      ...data.bills.map((b) => b.category),
    ]),
  );
  const categories = [...expenseCategories, 'Salário', 'Outras receitas'];
  const spending = (category: string) =>
    period
      .filter((e) => e.type === 'expense' && e.category === category)
      .reduce((s, e) => s + Math.round(e.amount * 100), 0) / 100;
  const outstanding = data.bills
    .filter((b) => b.active && !billPaid(data, b.id, month))
    .sort((a, b) => a.day - b.day);
  const upcomingTasks = data.tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.date.localeCompare(b.date));
  const budgets = data.budgets.filter((b) => b.month === month);
  const dueTotal =
    outstanding.reduce((sum, b) => sum + Math.round(b.amount * 100), 0) / 100;
  const previousMonth = new Date(`${month}-01T12:00:00`);
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousMonthKey = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;
  const previousSpent =
    active
      .filter(
        (e) => e.type === 'expense' && e.date.startsWith(previousMonthKey),
      )
      .reduce((sum, e) => sum + Math.round(e.amount * 100), 0) / 100;
  const budgetAlerts = budgets.filter(
    (b) => spending(b.category) >= b.limit * 0.8,
  );
  const shoppingPending = (data.shopping ?? []).filter(
    (i) =>
      !i.archived && (!i.entryId || !active.some((e) => e.id === i.entryId)),
  );

  const run = (operation: () => void) => {
    try {
      operation();
      setError('');
      setNotice('Alteração guardada neste navegador.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível guardar.');
    }
  };
  const open = (kind: FormKind, values: Record<string, string> = {}) => {
    setError('');
    setNotice('');
    setForm({
      kind,
      values: {
        title: '',
        amount: '',
        date: todayLocal(),
        category: kind === 'task' ? 'Casa' : 'Outros',
        accountId: data.accounts.find((a) => a.kind === 'current')?.id || '',
        destinationId: '',
        type: 'expense',
        month,
        day: '1',
        deadline: '',
        openingBalance: '0',
        ...values,
      },
    });
  };
  const set = (key: string, value: string) =>
    setForm((f) =>
      f ? { ...f, values: { ...f.values, [key]: value } } : null,
    );
  const exportBackup = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `myoffice-home-${todayLocal()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    run(() => {
      const { kind, values: v } = form;
      update((current) => {
        const id = v.editId || createId(`home-${kind}`);
        const replace = <T extends { id: string }>(rows: T[], item: T) =>
          v.editId
            ? rows.map((row) => (row.id === id ? item : row))
            : [...rows, item];
        if (kind === 'entry' || kind === 'payment' || kind === 'contribution') {
          const goal = current.goals.find((g) => g.id === v.goalId);
          return addHomeEntry(current, {
            type:
              kind === 'contribution'
                ? 'transfer'
                : kind === 'payment'
                  ? 'expense'
                  : (v.type as HomeEntry['type']),
            title:
              kind === 'contribution' ? `Reserva: ${goal?.title}` : v.title,
            amount: Number(v.amount),
            date: v.date,
            category:
              kind === 'contribution' ? 'Reserva para metas' : v.category,
            accountId: v.accountId,
            destinationId:
              kind === 'contribution'
                ? goal?.accountId
                : v.type === 'transfer'
                  ? v.destinationId
                  : undefined,
            billId: kind === 'payment' ? v.billId : undefined,
            billMonth: kind === 'payment' ? v.month : undefined,
          });
        }
        if (kind === 'reversal')
          return reverseHomeEntry(current, v.entryId, v.title);
        if (kind === 'account')
          return {
            ...current,
            accounts: [
              ...current.accounts,
              {
                id,
                name: text(v.title),
                openingBalance: money(Number(v.openingBalance), false),
                kind: 'current',
              },
            ],
          };
        if (kind === 'budget') {
          if (!validMonth(v.month)) throw new Error('Escolhe um mês válido.');
          const existing = current.budgets.find(
            (b) => b.month === v.month && b.category === v.category,
          );
          const item = {
            id: existing?.id || id,
            month: v.month,
            category: text(v.category),
            limit: money(Number(v.amount)),
          };
          return {
            ...current,
            budgets: existing
              ? current.budgets.map((b) => (b.id === existing.id ? item : b))
              : [...current.budgets, item],
          };
        }
        if (kind === 'bill') {
          const day = Number(v.day);
          if (!Number.isInteger(day) || day < 1 || day > 31)
            throw new Error('O dia deve estar entre 1 e 31.');
          return {
            ...current,
            bills: replace(current.bills, {
              id,
              title: text(v.title),
              amount: money(Number(v.amount)),
              category: text(v.category),
              day,
              active: current.bills.find((b) => b.id === id)?.active ?? true,
            }),
          };
        }
        if (kind === 'goal') {
          if (!validDate(v.deadline))
            throw new Error('Indica uma data válida para a meta.');
          const existing = current.goals.find((g) => g.id === id);
          const accountId = existing?.accountId || createId('home-reserve');
          const title = text(v.title);
          return {
            ...current,
            accounts: existing
              ? current.accounts.map((a) =>
                  a.id === accountId ? { ...a, name: `Reserva: ${title}` } : a,
                )
              : [
                  ...current.accounts,
                  {
                    id: accountId,
                    name: `Reserva: ${title}`,
                    openingBalance: 0,
                    kind: 'savings',
                  },
                ],
            goals: replace(current.goals, {
              id,
              title,
              target: money(Number(v.amount)),
              deadline: v.deadline,
              accountId,
            }),
          };
        }
        if (!validDate(v.date))
          throw new Error('Indica uma data válida para a tarefa.');
        return {
          ...current,
          tasks: replace(current.tasks, {
            id,
            title: text(v.title),
            date: v.date,
            category: text(v.category),
            done: current.tasks.find((t) => t.id === id)?.done ?? false,
          }),
        };
      });
      setForm(null);
    });
  };
  const field = (
    label: string,
    key: string,
    type = 'text',
    options?: { value: string; label: string }[],
  ) => {
    const v = form!.values;
    return (
      <label
        className="block space-y-1.5 text-xs font-medium"
        key={key}
        htmlFor={`home-field-${key}`}
      >
        <span>{label}</span>
        {options ? (
          <select
            id={`home-field-${key}`}
            required
            value={v[key] || ''}
            onChange={(e) => set(key, e.target.value)}
            className={input}
          >
            <option value="">Escolher…</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={`home-field-${key}`}
            className={input}
            required
            maxLength={300}
            type={type}
            value={v[key] || ''}
            onChange={(e) => set(key, e.target.value)}
            min={
              type === 'number'
                ? key === 'openingBalance'
                  ? 0
                  : key === 'day'
                    ? 1
                    : 0.01
                : undefined
            }
            max={
              key === 'day'
                ? 31
                : type === 'date' && form!.kind !== 'task' && key !== 'deadline'
                  ? todayLocal()
                  : undefined
            }
            step={key === 'day' ? 1 : type === 'number' ? 0.01 : undefined}
          />
        )}
      </label>
    );
  };
  const accountOptions = data.accounts.map((a) => ({
    value: a.id,
    label: `${a.name} · ${formatKwanza(totals[a.id])}`,
  }));
  const categoryOptions = categories.map((c) => ({ value: c, label: c }));
  const titleMap: Record<FormKind, string> = {
    entry: 'Novo lançamento',
    account: 'Adicionar conta pessoal',
    budget: 'Definir orçamento',
    bill: 'Conta recorrente da casa',
    goal: 'Meta ou sonho',
    contribution: 'Reservar para a meta',
    task: 'Compromisso ou tarefa',
    payment: 'Registar pagamento',
    reversal: 'Estornar lançamento',
  };
  const actionMap: Partial<Record<HomeSection, () => void>> = {
    Finanças: () => open('entry'),
    Orçamento: () => open('budget'),
    'Contas da casa': () => open('bill'),
    'Metas e sonhos': () => open('goal'),
    Agenda: () => open('task'),
  };
  const actionLabel: Partial<Record<HomeSection, string>> = {
    Finanças: 'Novo lançamento',
    Orçamento: 'Definir limite',
    'Contas da casa': 'Adicionar conta',
    'Metas e sonhos': 'Criar meta',
    Agenda: 'Adicionar tarefa',
  };
  return (
    <div id="home-view" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
            Home · {data.name}
          </p>
          <h1 className="text-xl font-bold tracking-tight">
            {section === 'Dashboard' ? 'A tua vida, com mais clareza' : section}
          </h1>
          <p className={`${muted} mt-1`}>
            {section === 'Dashboard'
              ? 'Finanças, casa e planos num só lugar.'
              : 'Organiza o que importa, um passo de cada vez.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!['Metas e sonhos', 'Agenda', 'Definições', 'Compras'].includes(
            section,
          ) && (
            <label className="text-xs">
              <span className="sr-only">Mês de referência</span>
              <input
                id="home-month"
                aria-label="Mês de referência"
                className={input}
                type="month"
                value={month}
                onChange={(e) => {
                  if (validMonth(e.target.value)) setMonth(e.target.value);
                }}
              />
            </label>
          )}
          {actionMap[section] && (
            <button
              id="home-add"
              type="button"
              className={primary}
              onClick={actionMap[section]}
            >
              <Plus className="h-4 w-4" />
              {actionLabel[section]}
            </button>
          )}
        </div>
      </div>
      {storageError && (
        <p
          role="alert"
          className={`${panel} text-sm text-rose-700 dark:text-rose-300`}
        >
          {storageError}
        </p>
      )}
      {error && !form && (
        <p
          role="alert"
          className={`${panel} text-sm text-rose-700 dark:text-rose-300`}
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className={muted}>
          {notice}
        </p>
      )}

      {section === 'Dashboard' && (
        <>
          {!data.entries.length && (
            <div
              className={`${panel} flex flex-wrap items-center justify-between gap-4 bg-indigo-50/40`}
            >
              <div>
                <h2 className="text-sm font-semibold">Bem-vindo ao teu Home</h2>
                <p className={`${muted} mt-1`}>
                  Começa por registar uma receita ou adicionar uma conta com o
                  teu saldo atual.
                </p>
              </div>
              <button
                className={primary}
                onClick={() => onNavigate('Finanças')}
              >
                Organizar as finanças
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 min-[450px]:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Saldo disponível', value: available, icon: Wallet },
              { label: 'Receitas do mês', value: income, icon: ArrowDownLeft },
              { label: 'Despesas do mês', value: spent, icon: ArrowUpRight },
              { label: 'Reservado para metas', value: reserved, icon: Target },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className={panel}>
                <div className="flex justify-between gap-2">
                  <p className={muted}>{label}</p>
                  <Icon className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="mt-3 text-lg sm:text-xl font-semibold font-mono break-words">
                  {formatKwanza(value)}
                </p>
              </div>
            ))}
          </div>
          <section className={panel} id="home-dashboard-planning">
            <h2 className="text-sm font-semibold">O mês em perspetiva</h2>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <div>
                <p className={muted}>Contas ainda por pagar</p>
                <p className="mt-1 font-mono font-semibold">
                  {formatKwanza(dueTotal)}
                </p>
                <p className={`${muted} mt-1`}>
                  {outstanding.length} contas no mês selecionado
                </p>
              </div>
              <div>
                <p className={muted}>Saldo atual após essas contas</p>
                <p
                  className={`mt-1 font-mono font-semibold ${available < dueTotal ? 'text-rose-600 dark:text-rose-300' : ''}`}
                >
                  {formatKwanza(available - dueTotal)}
                </p>
                <p className={`${muted} mt-1`}>
                  Previsão com o saldo atual, sem futuras receitas
                </p>
              </div>
              <div>
                <p className={muted}>Despesas face ao mês anterior</p>
                <p className="mt-1 font-mono font-semibold">
                  {previousSpent
                    ? `${spent > previousSpent ? '+' : ''}${Math.round(((spent - previousSpent) / previousSpent) * 100)}%`
                    : 'Sem base de comparação'}
                </p>
                <p className={`${muted} mt-1`}>
                  Mês anterior completo: {formatKwanza(previousSpent)}
                </p>
              </div>
            </div>
            {budgetAlerts.length > 0 && (
              <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300">
                Atenção ao orçamento:{' '}
                {budgetAlerts
                  .map(
                    (b) =>
                      `${b.category} (${Math.round((spending(b.category) / b.limit) * 100)}%)`,
                  )
                  .join(' · ')}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <button className={secondary} onClick={() => open('entry')}>
                Registar receita ou despesa
              </button>
              <button
                className={secondary}
                onClick={() => onNavigate('Compras')}
              >
                Compras da casa ({shoppingPending.length})
              </button>
              <button
                className={secondary}
                onClick={() => onNavigate('Agenda')}
              >
                Organizar tarefas
              </button>
            </div>
          </section>
          <div className="grid lg:grid-cols-2 gap-4">
            <section className={panel}>
              <div className="flex justify-between items-center gap-2">
                <h2 className="text-sm font-semibold">
                  Para onde vai o dinheiro
                </h2>
                <button
                  className={secondary}
                  onClick={() => onNavigate('Orçamento')}
                >
                  Orçamento
                </button>
              </div>
              <p className={`${muted} mt-1`}>
                Resultado do mês: {formatKwanza(income - spent)}
              </p>
              <div className="mt-4 space-y-4">
                {Array.from(
                  new Set(
                    period
                      .filter((e) => e.type === 'expense')
                      .map((e) => e.category),
                  ),
                )
                  .sort((a, b) => spending(b) - spending(a))
                  .map((c) => (
                    <div key={c}>
                      <div className="flex justify-between gap-2 text-xs mb-2">
                        <span>{c}</span>
                        <span className="font-mono">
                          {formatKwanza(spending(c))}
                        </span>
                      </div>
                      <Progress value={percent(spending(c), spent)} label={c} />
                    </div>
                  ))}
                {!spent && (
                  <Empty>Regista despesas para conhecer os teus hábitos.</Empty>
                )}
              </div>
            </section>
            <section className={panel}>
              <div className="flex justify-between items-center gap-2">
                <h2 className="text-sm font-semibold">Contas por pagar</h2>
                <button
                  className={secondary}
                  onClick={() => onNavigate('Contas da casa')}
                >
                  Ver contas
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {outstanding.slice(0, 4).map((b) => (
                  <div
                    key={b.id}
                    className="flex justify-between gap-3 border-b border-slate-100 dark:border-dm-border pb-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium break-words">
                        {b.title}
                      </p>
                      <p className={`${muted} mt-1`}>
                        {dueDate(month, b.day) < todayLocal()
                          ? 'Em atraso · '
                          : ''}
                        {dateLabel(dueDate(month, b.day))}
                      </p>
                    </div>
                    <span className="font-mono text-xs shrink-0">
                      {formatKwanza(b.amount)}
                    </span>
                  </div>
                ))}
                {!outstanding.length && (
                  <Empty>
                    {data.bills.length
                      ? 'Tudo em dia neste mês.'
                      : 'Adiciona renda, água, energia ou mensalidades.'}
                  </Empty>
                )}
              </div>
            </section>
            <section className={panel}>
              <div className="flex justify-between items-center gap-2">
                <h2 className="text-sm font-semibold">Metas e sonhos</h2>
                <button
                  className={secondary}
                  onClick={() => onNavigate('Metas e sonhos')}
                >
                  Ver metas
                </button>
              </div>
              <div className="mt-4 space-y-4">
                {data.goals.slice(0, 3).map((g) => (
                  <div key={g.id}>
                    <div className="flex justify-between gap-3 text-xs mb-2">
                      <span className="font-medium">{g.title}</span>
                      <span>{percent(totals[g.accountId], g.target)}%</span>
                    </div>
                    <Progress
                      value={percent(totals[g.accountId], g.target)}
                      label={g.title}
                    />
                  </div>
                ))}
                {!data.goals.length && (
                  <Empty>
                    Planeia férias, uma reserva ou o teu próximo sonho.
                  </Empty>
                )}
              </div>
            </section>
            <section className={panel}>
              <div className="flex justify-between items-center gap-2">
                <h2 className="text-sm font-semibold">Na tua agenda</h2>
                <button
                  className={secondary}
                  onClick={() => onNavigate('Agenda')}
                >
                  Ver agenda
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {upcomingTasks.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <button
                      className={secondary}
                      aria-label={`Concluir ${t.title}`}
                      onClick={() =>
                        run(() =>
                          update((d) => ({
                            ...d,
                            tasks: d.tasks.map((item) =>
                              item.id === t.id ? { ...item, done: true } : item,
                            ),
                          })),
                        )
                      }
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm break-words">{t.title}</p>
                      <p className={muted}>
                        {dateLabel(t.date)} · {t.category}
                      </p>
                    </div>
                  </div>
                ))}
                {!upcomingTasks.length && (
                  <Empty>Sem tarefas pendentes. Planeia a tua semana.</Empty>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {section === 'Finanças' && (
        <>
          <section className={panel}>
            <div className="flex flex-wrap justify-between gap-3 mb-4">
              <h2 className="text-sm font-semibold">As tuas contas</h2>
              <button
                id="home-add-account"
                className={secondary}
                onClick={() => open('account')}
              >
                <Plus className="h-4 w-4" />
                Adicionar conta
              </button>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {data.accounts.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-slate-200 dark:border-dm-border p-3"
                >
                  <p className="text-xs font-medium break-words">{a.name}</p>
                  <p className="font-mono text-base font-semibold mt-2 break-words">
                    {formatKwanza(totals[a.id])}
                  </p>
                  <p className={`${muted} mt-1`}>
                    {a.kind === 'savings'
                      ? 'Reserva de uma meta'
                      : 'Dinheiro disponível'}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className={panel}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">
                Histórico de lançamentos
              </h2>
              <div className="flex flex-wrap gap-2">
                <input
                  aria-label="Pesquisar lançamentos"
                  placeholder="Pesquisar…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={`${input} !w-40`}
                />
                <select
                  aria-label="Filtrar conta"
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className={`${input} !w-40`}
                >
                  <option value="all">Todas as contas</option>
                  {data.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 divide-y divide-slate-100 dark:divide-dm-border">
              {data.entries
                .filter(
                  (e) =>
                    e.date.startsWith(month) &&
                    (accountFilter === 'all' ||
                      e.accountId === accountFilter ||
                      e.destinationId === accountFilter) &&
                    `${e.title} ${e.category}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                )
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((e) => {
                  const reversed = !active.some((a) => a.id === e.id);
                  return (
                    <div
                      key={e.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium break-words">
                          {e.title}
                        </p>
                        <p className={`${muted} mt-1`}>
                          {dateLabel(e.date)} ·{' '}
                          {e.type === 'income'
                            ? 'Receita'
                            : e.type === 'expense'
                              ? 'Despesa'
                              : e.type === 'transfer'
                                ? 'Transferência'
                                : 'Estorno'}{' '}
                          ·{' '}
                          {
                            data.accounts.find((a) => a.id === e.accountId)
                              ?.name
                          }
                          {e.destinationId
                            ? ` → ${data.accounts.find((a) => a.id === e.destinationId)?.name}`
                            : ''}
                        </p>
                        <p className={`${muted} mt-1`}>
                          {e.category}
                          {e.type !== 'reversal' && reversed
                            ? ' · Estornado'
                            : ''}
                        </p>
                      </div>
                      <span className="font-mono text-xs">
                        {formatKwanza(e.amount)}
                      </span>
                      {e.type !== 'reversal' && !reversed && (
                        <button
                          className={secondary}
                          onClick={() =>
                            open('reversal', { entryId: e.id, title: '' })
                          }
                        >
                          Estornar
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
            {!data.entries.some((e) => e.date.startsWith(month)) && (
              <Empty>Sem lançamentos neste mês.</Empty>
            )}
          </section>
        </>
      )}

      {section === 'Orçamento' && (
        <>
          <p className={muted}>
            Define limites mensais por categoria. As despesas pagas atualizam o
            progresso; transferências e reservas não são despesas.
          </p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const used = spending(b.category);
              return (
                <section key={b.id} className={panel}>
                  <div className="flex justify-between gap-2 items-center">
                    <h2 className="text-sm font-semibold">{b.category}</h2>
                    <button
                      className={secondary}
                      aria-label={`Editar orçamento ${b.category}`}
                      onClick={() =>
                        open('budget', {
                          category: b.category,
                          amount: String(b.limit),
                          month: b.month,
                        })
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="font-mono text-sm mt-3">
                    {formatKwanza(used)} / {formatKwanza(b.limit)}
                  </p>
                  <div className="mt-3">
                    <Progress
                      value={percent(used, b.limit)}
                      label={`Orçamento ${b.category}`}
                    />
                  </div>
                  <p className={`${muted} mt-2`}>
                    {used > b.limit
                      ? `Limite ultrapassado em ${formatKwanza(used - b.limit)}`
                      : `Ainda disponível: ${formatKwanza(b.limit - used)}`}
                  </p>
                </section>
              );
            })}
          </div>
          {!budgets.length && (
            <div className={panel}>
              <Empty>Define o primeiro limite para este mês.</Empty>
            </div>
          )}
        </>
      )}

      {section === 'Contas da casa' && (
        <>
          <p className={muted}>
            Contas mensais. Cada pagamento entra nas despesas uma única vez no
            mês escolhido.
          </p>
          <div className="space-y-3">
            {data.bills.map((b) => {
              const paid = billPaid(data, b.id, month);
              const due = dueDate(month, b.day);
              return (
                <section
                  key={b.id}
                  className={`${panel} flex flex-wrap items-center justify-between gap-4`}
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold break-words">
                      {b.title}
                    </h2>
                    <p className={`${muted} mt-1`}>
                      {b.category} · Vence em {dateLabel(due)}
                    </p>
                    <p className="text-xs mt-2">
                      {!b.active
                        ? 'Pausada'
                        : paid
                          ? 'Paga neste mês'
                          : due < todayLocal()
                            ? 'Em atraso'
                            : 'Por pagar'}
                    </p>
                  </div>
                  <span className="font-mono text-sm">
                    {formatKwanza(b.amount)}
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {b.active && !paid && (
                      <button
                        className={primary}
                        onClick={() =>
                          open('payment', {
                            billId: b.id,
                            title: b.title,
                            amount: String(b.amount),
                            category: b.category,
                            month,
                          })
                        }
                      >
                        Registar pagamento
                      </button>
                    )}
                    <button
                      className={secondary}
                      aria-label={`Editar ${b.title}`}
                      onClick={() =>
                        open('bill', {
                          editId: b.id,
                          title: b.title,
                          amount: String(b.amount),
                          day: String(b.day),
                          category: b.category,
                        })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className={secondary}
                      onClick={() =>
                        run(() =>
                          update((d) => ({
                            ...d,
                            bills: d.bills.map((item) =>
                              item.id === b.id
                                ? { ...item, active: !item.active }
                                : item,
                            ),
                          })),
                        )
                      }
                    >
                      {b.active ? 'Pausar' : 'Retomar'}
                    </button>
                  </div>
                </section>
              );
            })}
            {!data.bills.length && (
              <div className={panel}>
                <Empty>
                  Adiciona as mensalidades e despesas recorrentes da tua casa.
                </Empty>
              </div>
            )}
          </div>
        </>
      )}

      {section === 'Metas e sonhos' && (
        <>
          <p className={muted}>
            Reservar transfere dinheiro de uma conta pessoal para a meta. O
            valor continua teu e não conta como despesa.
          </p>
          <div className="grid lg:grid-cols-2 gap-4">
            {data.goals.map((g) => {
              const saved = totals[g.accountId];
              return (
                <section key={g.id} className={panel}>
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold break-words">
                        {g.title}
                      </h2>
                      <p className={`${muted} mt-1`}>
                        Até {dateLabel(g.deadline)}
                        {g.deadline < todayLocal() && saved < g.target
                          ? ' · Prazo ultrapassado'
                          : ''}
                      </p>
                    </div>
                    <Target className="h-5 w-5 text-indigo-500 shrink-0" />
                  </div>
                  <p className="font-mono text-base font-semibold my-4 break-words">
                    {formatKwanza(saved)}{' '}
                    <span className="text-xs font-normal text-slate-500 dark:text-dm-muted">
                      de {formatKwanza(g.target)}
                    </span>
                  </p>
                  <Progress value={percent(saved, g.target)} label={g.title} />
                  <p className={`${muted} mt-2`}>
                    {saved >= g.target
                      ? 'Meta alcançada!'
                      : `Faltam ${formatKwanza(g.target - saved)}`}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      className={primary}
                      onClick={() =>
                        open('contribution', { goalId: g.id, title: g.title })
                      }
                    >
                      Reservar valor
                    </button>
                    {saved > 0 && (
                      <button
                        className={secondary}
                        onClick={() =>
                          open('entry', {
                            type: 'transfer',
                            accountId: g.accountId,
                            title: `Retirar reserva: ${g.title}`,
                            category: 'Reserva para metas',
                          })
                        }
                      >
                        Retirar reserva
                      </button>
                    )}
                    <button
                      className={secondary}
                      aria-label={`Editar meta ${g.title}`}
                      onClick={() =>
                        open('goal', {
                          editId: g.id,
                          title: g.title,
                          amount: String(g.target),
                          deadline: g.deadline,
                        })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
          {!data.goals.length && (
            <div className={panel}>
              <Empty>
                Uma viagem, a tua casa, um curso ou uma reserva de emergência:
                começa com uma meta.
              </Empty>
            </div>
          )}
        </>
      )}

      {section === 'Agenda' && (
        <>
          <p className={muted}>
            Tarefas da casa e compromissos pessoais, organizados por data.
          </p>
          <div className="space-y-3">
            {[...data.tasks]
              .sort(
                (a, b) =>
                  Number(a.done) - Number(b.done) ||
                  a.date.localeCompare(b.date),
              )
              .map((t) => (
                <section
                  key={t.id}
                  className={`${panel} flex items-center gap-3`}
                >
                  <input
                    aria-label={`Concluir ${t.title}`}
                    type="checkbox"
                    className="w-5 h-5 shrink-0 accent-indigo-600"
                    checked={t.done}
                    onChange={() =>
                      run(() =>
                        update((d) => ({
                          ...d,
                          tasks: d.tasks.map((item) =>
                            item.id === t.id
                              ? { ...item, done: !item.done }
                              : item,
                          ),
                        })),
                      )
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <h2
                      className={`text-sm font-medium break-words ${t.done ? 'line-through text-slate-400' : ''}`}
                    >
                      {t.title}
                    </h2>
                    <p className={`${muted} mt-1`}>
                      {dateLabel(t.date)} · {t.category}
                      {!t.done && t.date < todayLocal() ? ' · Em atraso' : ''}
                    </p>
                  </div>
                  <button
                    className={secondary}
                    aria-label={`Editar tarefa ${t.title}`}
                    onClick={() =>
                      open('task', {
                        editId: t.id,
                        title: t.title,
                        date: t.date,
                        category: t.category,
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </section>
              ))}
            {!data.tasks.length && (
              <div className={panel}>
                <Empty>
                  Adiciona uma tarefa ou um compromisso para começar.
                </Empty>
              </div>
            )}
          </div>
        </>
      )}

      {section === 'Compras' && <HomeShopping />}
      {section === 'Definições' && (
        <div className="space-y-4">
          <AppearanceSettings />
          <HomeCategories />
          <section className={panel}>
            <div className="flex items-center gap-2 mb-3">
              <House className="h-5 w-5" />
              <h2 className="text-sm font-semibold">O teu espaço Home</h2>
            </div>
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => update((d) => ({ ...d, name: text(name) })));
              }}
            >
              <label className="text-xs flex-1 min-w-[150px]">
                Nome da casa
                <input
                  id="home-house-name"
                  required
                  maxLength={300}
                  className={`${input} mt-2`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <button className={primary}>Guardar nome</button>
            </form>
            <p className={`${muted} mt-3`}>
              Moeda: Kwanza (AOA). Contas e dados independentes do Business.
            </p>
          </section>
          <section className={panel}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-sm font-semibold">Cópia de segurança</h2>
            </div>
            <p className={`${muted} mb-4`}>
              Os dados ficam neste navegador. Exporta regularmente uma cópia
              para recuperares noutro dispositivo. A cópia contém informação
              pessoal: guarda-a num lugar seguro.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                id="home-export"
                className={primary}
                onClick={exportBackup}
              >
                <Download className="h-4 w-4" />
                Exportar Home
              </button>
              <label className={`${secondary} cursor-pointer`}>
                <Upload className="h-4 w-4" />
                Importar cópia
                <input
                  id="home-import"
                  className="sr-only"
                  aria-label="Importar cópia Home"
                  type="file"
                  accept=".json,application/json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    try {
                      if (file.size > 10 * 1024 * 1024)
                        throw new Error('Escolhe um ficheiro até 10 MB.');
                      setPendingImport(
                        validateHomeData(JSON.parse(await file.text())),
                      );
                      setImportConfirmation('');
                      setError('');
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : 'Ficheiro inválido.',
                      );
                    }
                  }}
                />
              </label>
            </div>
          </section>
        </div>
      )}

      {form && (
        <HomeModal
          title={titleMap[form.kind]}
          onClose={() => {
            setForm(null);
            setError('');
          }}
        >
          <form onSubmit={save} className="space-y-4">
            {error && (
              <p
                role="alert"
                className="text-xs text-rose-700 dark:text-rose-300"
              >
                {error}
              </p>
            )}
            {form.kind === 'entry' &&
              field('Operação', 'type', 'text', [
                { value: 'income', label: 'Receita' },
                { value: 'expense', label: 'Despesa' },
                { value: 'transfer', label: 'Transferência' },
              ])}
            {!['contribution', 'budget'].includes(form.kind) &&
              field(
                form.kind === 'reversal'
                  ? 'Motivo do estorno'
                  : form.kind === 'account'
                    ? 'Nome da conta'
                    : 'Descrição',
                'title',
              )}
            {[
              'entry',
              'budget',
              'bill',
              'goal',
              'contribution',
              'payment',
            ].includes(form.kind) &&
              field(
                form.kind === 'goal'
                  ? 'Valor da meta (Kz)'
                  : form.kind === 'budget'
                    ? 'Limite mensal (Kz)'
                    : 'Valor (Kz)',
                'amount',
                'number',
              )}
            {form.kind === 'account' &&
              field('Saldo atual inicial (Kz)', 'openingBalance', 'number')}
            {['entry', 'contribution', 'payment'].includes(form.kind) &&
              field(
                form.kind === 'entry' && form.values.type === 'income'
                  ? 'Conta de destino'
                  : 'Conta de origem',
                'accountId',
                'text',
                form.kind === 'contribution'
                  ? accountOptions.filter(
                      (a) =>
                        a.value !==
                        data.goals.find((g) => g.id === form.values.goalId)
                          ?.accountId,
                    )
                  : accountOptions,
              )}
            {form.kind === 'entry' &&
              form.values.type === 'transfer' &&
              field(
                'Conta de destino',
                'destinationId',
                'text',
                accountOptions.filter((a) => a.value !== form.values.accountId),
              )}
            {['entry', 'contribution', 'payment', 'task'].includes(form.kind) &&
              field('Data', 'date', 'date')}
            {['entry', 'bill', 'budget', 'task'].includes(form.kind) &&
              !(form.kind === 'entry' && form.values.type === 'transfer') &&
              field(
                'Categoria',
                'category',
                'text',
                form.kind === 'task'
                  ? [
                      { value: 'Casa', label: 'Casa' },
                      { value: 'Pessoal', label: 'Pessoal' },
                      { value: 'Saúde', label: 'Saúde' },
                      { value: 'Estudos', label: 'Estudos' },
                    ]
                  : categoryOptions,
              )}
            {form.kind === 'budget' && field('Mês', 'month', 'month')}
            {form.kind === 'payment' && (
              <p className={muted}>
                Pagamento referente a {form.values.month}. O valor efetivamente
                pago será registado como despesa.
              </p>
            )}
            {form.kind === 'bill' &&
              field('Dia de vencimento mensal (1–31)', 'day', 'number')}
            {form.kind === 'goal' &&
              field('Data para alcançar a meta', 'deadline', 'date')}
            {form.kind === 'reversal' && (
              <p className={muted}>
                O lançamento original permanece no histórico. O estorno desfaz o
                efeito no saldo.
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  setForm(null);
                  setError('');
                }}
              >
                Cancelar
              </button>
              <button id="home-save" type="submit" className={primary}>
                Guardar
              </button>
            </div>
          </form>
        </HomeModal>
      )}
      {pendingImport && (
        <HomeModal
          title="Restaurar a cópia do Home"
          onClose={() => setPendingImport(null)}
        >
          {error && (
            <p
              role="alert"
              className="text-xs text-rose-700 dark:text-rose-300 mb-3"
            >
              {error}
            </p>
          )}
          <p className={`${muted} mb-4`}>
            A cópia de {pendingImport.name} contém{' '}
            {pendingImport.entries.length} lançamentos. Esta operação substitui
            os dados pessoais atuais; os dados Business não serão alterados. Uma
            cópia dos dados atuais será descarregada antes de restaurar.
          </p>
          <label className="text-xs">
            Escreve RESTAURAR para confirmar
            <input
              className={`${input} mt-2`}
              value={importConfirmation}
              onChange={(e) => setImportConfirmation(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <button
              className={secondary}
              onClick={() => setPendingImport(null)}
            >
              Cancelar
            </button>
            <button
              className={primary}
              disabled={importConfirmation !== 'RESTAURAR'}
              onClick={() =>
                run(() => {
                  exportBackup();
                  importData(pendingImport);
                  setName(pendingImport.name);
                  setPendingImport(null);
                })
              }
            >
              Restaurar Home
            </button>
          </div>
        </HomeModal>
      )}
    </div>
  );
}
