import {
  homeAuditEdit,
  editHomeEntry,
  deleteHomeEntity,
  HomeEntity,
} from '../../utils/homeEditing';
import { homeCategoryName } from '../../utils/homeCategories';
import { HomeModal } from './HomeModal';
import {
  BusinessIncomeTransfer,
  useBusinessHomeTransfers,
} from './BusinessIncomeTransfer';
import { HomeCharts } from './HomeCharts';
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
  Trash2,
  Download,
  Upload,
  X,
  House,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Palette,
  Tags,
  Building2,
} from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import {
  HomeData,
  HomeEntry,
  HomeSection,
  HomeCurrency,
  HomeAudit,
} from '../../types/home';
import {
  HOME_CATEGORIES,
  HOME_INCOME_CATEGORIES,
  accountCurrency,
  entryCurrency,
  formatHomeMoney,
  contributeHomeGoal,
  acquireHomeGoal,
  goalAcquired,
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
  const bridge = useBusinessHomeTransfers();
  const { data: savedData, update, storageError, importData } = useHome();
  const data = {
    ...savedData,
    budgets: savedData.budgets.filter((r) => !r.deletedAt),
    bills: savedData.bills.filter((r) => !r.deletedAt),
    goals: savedData.goals.filter((r) => !r.deletedAt),
    tasks: savedData.tasks.filter((r) => !r.deletedAt),
  };
  const [currency, setCurrency] = useState<HomeCurrency>('AOA');
  const cash = (value: number) => formatHomeMoney(value, currency);
  const today = useToday();
  const thisMonth = today.slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const previousMonthRef = useRef(thisMonth);
  useEffect(() => {
    const previous = previousMonthRef.current;
    if (previous !== thisMonth) {
      setMonth((current) => (current === previous ? thisMonth : current));
      previousMonthRef.current = thisMonth;
    }
  }, [thisMonth]);
  const [query, setQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [form, setForm] = useState<{
    kind: FormKind;
    values: Record<string, string>;
  } | null>(null);
  const [removing, setRemoving] = useState<{
    kind: HomeEntity;
    id: string;
    name: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingImport, setPendingImport] = useState<HomeData | null>(null);
  const [importConfirmation, setImportConfirmation] = useState('');
  const [name, setName] = useState(data.name);
  const [settingsSection, setSettingsSection] = useState<string | null>(null);
  useEffect(() => {
    setSettingsSection(null);
  }, [section]);
  useEffect(() => setName(data.name), [data.name]);
  const totals = balances(data);
  const financialAccounts = data.accounts.filter(
    (a) =>
      !a.deletedAt &&
      !savedData.goals.some(
        (g) => g.accountId === a.id && g.fundingMode === 'plan',
      ),
  );
  const active = effectiveEntries(data).filter(
    (e) => entryCurrency(data, e) === currency,
  );
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
      .filter(
        (a) =>
          !a.deletedAt &&
          a.kind === 'current' &&
          accountCurrency(a) === currency,
      )
      .reduce((s, a) => s + Math.round(totals[a.id] * 100), 0) / 100;
  const reserved =
    data.accounts
      .filter((a) => a.kind === 'savings' && accountCurrency(a) === currency)
      .reduce((s, a) => s + Math.round(totals[a.id] * 100), 0) / 100;
  const expenseCategories = Array.from(
    new Set([
      ...(data.categories ?? HOME_CATEGORIES),
      ...data.budgets.map((b) => b.category),
      ...data.bills.map((b) => b.category),
    ]),
  );
  const incomeCategories = data.incomeCategories ?? HOME_INCOME_CATEGORIES;
  const categories =
    form?.kind === 'entry' && form.values.type === 'income'
      ? incomeCategories
      : expenseCategories;
  const spending = (category: string) =>
    period
      .filter((e) => e.type === 'expense' && e.category === category)
      .reduce((s, e) => s + Math.round(e.amount * 100), 0) / 100;
  const outstanding = data.bills
    .filter(
      (b) =>
        (b.currency ?? 'AOA') === currency &&
        b.active &&
        !billPaid(data, b.id, month),
    )
    .sort((a, b) => a.day - b.day);
  const upcomingTasks = data.tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.date.localeCompare(b.date));
  const budgets = data.budgets.filter(
    (b) => b.month === month && (b.currency ?? 'AOA') === currency,
  );
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
    setFieldErrors({});
    setError('');
    setNotice('');
    setForm({
      kind,
      values: {
        currency,
        fundingMode: data.settings?.reserveGoals ? 'reserve' : 'plan',
        title: '',
        amount: '',
        date: todayLocal(),
        category:
          kind === 'task'
            ? 'Casa'
            : expenseCategories.includes('Outros')
              ? 'Outros'
              : '',
        accountId:
          data.accounts.find(
            (a) =>
              !a.deletedAt &&
              a.kind === 'current' &&
              accountCurrency(a) === currency,
          )?.id || '',
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
      new Blob([JSON.stringify(savedData, null, 2)], {
        type: 'application/json',
      }),
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
    const errors: Record<string, string> = {};
    for (const el of Array.from<HTMLInputElement | HTMLSelectElement>(
      (event.currentTarget as HTMLFormElement).querySelectorAll('[required]'),
    )) {
      if (el.disabled) continue;
      const key = el.id.replace('home-field-', '');
      if (!el.value.trim()) errors[key] = 'Preenche este campo.';
      else if (!el.validity.valid)
        errors[key] = 'Indica um valor válido para este campo.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    run(() => {
      const { kind, values: v } = form;
      if (
        kind === 'reversal' &&
        data.entries.find((e) => e.id === v.entryId)?.businessMovementId
      ) {
        bridge.reverse(v.entryId, v.title);
        setForm(null);
        return;
      }
      update((current) => {
        const id = v.editId || createId(`home-${kind}`);
        const replace = <T extends { id: string } & HomeAudit>(
          rows: T[],
          item: T,
        ) =>
          v.editId
            ? rows.map((row) =>
                row.id === id ? homeAuditEdit(row, { ...row, ...item }) : row,
              )
            : [...rows, item];
        if (kind === 'contribution')
          return contributeHomeGoal(
            current,
            v.goalId,
            v.accountId,
            Number(v.amount),
            v.date,
          );
        if (kind === 'entry' || kind === 'payment') {
          const goal = current.goals.find((g) => g.id === v.goalId);
          const values = {
            type:
              kind === 'payment' ? 'expense' : (v.type as HomeEntry['type']),
            title: v.title,
            amount: Number(v.amount),
            date: v.date,
            category: v.category,
            accountId: v.accountId,
            destinationId: v.type === 'transfer' ? v.destinationId : undefined,
            billId: kind === 'payment' ? v.billId : undefined,
            billMonth: kind === 'payment' ? v.month : undefined,
          };
          return v.editId
            ? editHomeEntry(current, v.editId, values)
            : addHomeEntry(current, values);
        }
        if (kind === 'reversal')
          return reverseHomeEntry(current, v.entryId, v.title);
        if (kind === 'account') {
          const existing = current.accounts.find((a) => a.id === v.editId);
          return {
            ...current,
            accounts: replace(current.accounts, {
              id,
              name: text(v.title),
              openingBalance:
                existing?.openingBalance ??
                money(Number(v.openingBalance), false),
              kind: existing?.kind ?? 'current',
              currency: existing?.currency ?? (v.currency as HomeCurrency),
            }),
          };
        }
        if (kind === 'budget') {
          if (!validMonth(v.month)) throw new Error('Escolhe um mês válido.');
          const duplicate = current.budgets.find(
            (b) =>
              !b.deletedAt &&
              b.id !== v.editId &&
              b.month === v.month &&
              b.category === v.category &&
              (b.currency ?? 'AOA') === v.currency,
          );
          if (v.editId && duplicate)
            throw new Error(
              'Já existe um limite para esta categoria, mês e moeda.',
            );
          const existing =
            current.budgets.find((b) => b.id === v.editId) ?? duplicate;
          const item = {
            id: existing?.id ?? id,
            month: v.month,
            category: text(v.category),
            limit: money(Number(v.amount)),
            currency: v.currency as HomeCurrency,
          };
          return {
            ...current,
            budgets: existing
              ? current.budgets.map((b) =>
                  b.id === existing.id
                    ? homeAuditEdit(b, { ...b, ...item })
                    : b,
                )
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
              currency: v.currency as HomeCurrency,
              active: current.bills.find((b) => b.id === id)?.active ?? true,
            }),
          };
        }
        if (kind === 'goal') {
          if (!validDate(v.deadline))
            throw new Error('Indica uma data válida para a meta.');
          const existing = current.goals.find((g) => g.id === id);
          if (
            existing &&
            goalAcquired(current, id) &&
            (existing.target !== Number(v.amount) ||
              (existing.fundingMode ?? 'reserve') !== v.fundingMode)
          )
            throw new Error(
              'Uma meta adquirida mantém os seus dados originais.',
            );
          if (
            existing &&
            accountCurrency(
              current.accounts.find((a) => a.id === existing.accountId),
            ) !== v.currency
          )
            throw new Error('A moeda de uma meta existente não pode mudar.');
          if (
            existing &&
            (existing.fundingMode ?? 'reserve') !== v.fundingMode &&
            balances(current)[existing.accountId] > 0
          )
            throw new Error(
              'Retira a reserva antes de mudar para planeamento.',
            );
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
                    currency: v.currency as HomeCurrency,
                  },
                ],
            goals: replace(current.goals, {
              ...existing,
              id,
              title,
              target: money(Number(v.amount)),
              deadline: v.deadline,
              accountId,
              fundingMode: v.fundingMode as 'reserve' | 'plan',
              plannedAmount: existing?.plannedAmount ?? 0,
              acquisitionEntryId: existing?.acquisitionEntryId,
              category: v.category,
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
      if (['account', 'budget', 'bill', 'goal'].includes(kind))
        setCurrency(v.currency as HomeCurrency);
      setForm(null);
    });
  };
  const editEntry = (e: HomeEntry) =>
    open('entry', {
      editId: e.id,
      type: e.type,
      title: e.title,
      amount: String(e.amount),
      date: e.date,
      category: e.category,
      accountId: e.accountId,
      currency: entryCurrency(data, e),
      subcategory: e.subcategory ?? '',
    });
  const removeButton = (kind: HomeEntity, id: string, name: string) => (
    <button
      type="button"
      className={secondary}
      aria-label={`Eliminar ${name}`}
      title={`Eliminar ${name}`}
      onClick={() => {
        setRemoving({ kind, id, name });
        setError('');
      }}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
  const editStamp = (row: { editedAt?: string }) =>
    row.editedAt ? (
      <p className={`${muted} mt-1`}>
        editado em {new Date(row.editedAt).toLocaleDateString('pt-PT')}
      </p>
    ) : null;
  const entryActions = (e: HomeEntry) =>
    effectiveEntries(savedData).some((r) => r.id === e.id) &&
    ['expense', 'income'].includes(e.type) ? (
      <div className="flex gap-2">
        <button
          type="button"
          className={secondary}
          aria-label={`Editar ${e.title}`}
          title={`Editar ${e.title}`}
          onClick={() => editEntry(e)}
        >
          <Pencil className="h-4 w-4" />
        </button>
        {removeButton('entry', e.id, e.title)}
      </div>
    ) : null;
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
            aria-invalid={Boolean(fieldErrors[key])}
            aria-describedby={
              fieldErrors[key] ? `home-error-${key}` : undefined
            }
            disabled={Boolean(
              form?.values.editId &&
              ((form.kind === 'account' &&
                ['currency', 'openingBalance'].includes(key)) ||
                (form.kind === 'bill' &&
                  key === 'currency' &&
                  data.entries.some((e) => e.billId === form.values.editId)) ||
                (form.kind === 'goal' &&
                  ['amount', 'fundingMode', 'currency'].includes(key) &&
                  goalAcquired(savedData, form.values.editId)) ||
                (form.kind === 'entry' &&
                  ((data.entries.find((e) => e.id === form.values.editId)
                    ?.businessMovementId &&
                    ['type', 'amount', 'date', 'accountId'].includes(key)) ||
                    (data.entries.find((e) => e.id === form.values.editId)
                      ?.goalId &&
                      ['type', 'accountId'].includes(key)) ||
                    ((data.entries.find((e) => e.id === form.values.editId)
                      ?.billId ||
                      data.shopping?.some(
                        (i) => i.entryId === form.values.editId,
                      )) &&
                      key === 'type')))),
            )}
            value={v[key] || ''}
            onChange={(e) => {
              set(key, e.target.value);
              if (key === 'type')
                set(
                  'category',
                  e.target.value === 'income'
                    ? (incomeCategories[0] ?? 'Salário')
                    : expenseCategories[0],
                );
            }}
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
            aria-invalid={Boolean(fieldErrors[key])}
            aria-describedby={
              fieldErrors[key] ? `home-error-${key}` : undefined
            }
            disabled={Boolean(
              form?.values.editId &&
              ((form.kind === 'account' &&
                ['currency', 'openingBalance'].includes(key)) ||
                (form.kind === 'bill' &&
                  key === 'currency' &&
                  data.entries.some((e) => e.billId === form.values.editId)) ||
                (form.kind === 'goal' &&
                  ['amount', 'fundingMode', 'currency'].includes(key) &&
                  goalAcquired(savedData, form.values.editId)) ||
                (form.kind === 'entry' &&
                  ((data.entries.find((e) => e.id === form.values.editId)
                    ?.businessMovementId &&
                    ['type', 'amount', 'date', 'accountId'].includes(key)) ||
                    (data.entries.find((e) => e.id === form.values.editId)
                      ?.goalId &&
                      ['type', 'accountId'].includes(key)) ||
                    ((data.entries.find((e) => e.id === form.values.editId)
                      ?.billId ||
                      data.shopping?.some(
                        (i) => i.entryId === form.values.editId,
                      )) &&
                      key === 'type')))),
            )}
            value={v[key] || ''}
            onChange={(e) => {
              set(key, e.target.value);
              if (key === 'type')
                set(
                  'category',
                  e.target.value === 'income'
                    ? (incomeCategories[0] ?? 'Salário')
                    : expenseCategories[0],
                );
            }}
            min={
              type === 'number'
                ? key === 'openingBalance' ||
                  (form!.kind === 'contribution' &&
                    form!.values.fundingMode === 'plan')
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
        {fieldErrors[key] && (
          <span
            id={`home-error-${key}`}
            role="alert"
            className="block text-xs text-rose-600 dark:text-rose-400"
          >
            {fieldErrors[key]}
          </span>
        )}
      </label>
    );
  };
  const accountOptions = financialAccounts
    .filter((a) => accountCurrency(a) === (form?.values.currency ?? currency))
    .map((a) => ({
      value: a.id,
      label: `${a.name} · ${formatHomeMoney(totals[a.id], accountCurrency(a))}`,
    }));
  const categoryOptions = categories.map((c) => ({
    value: c,
    label: homeCategoryName(
      data,
      c,
      undefined,
      form?.kind === 'entry' && form.values.type === 'income'
        ? 'income'
        : 'expense',
    ),
  }));
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
          {!['Agenda', 'Definições'].includes(section) && (
            <label className="text-xs">
              <span className="sr-only">Moeda de consulta</span>
              <select
                id="home-currency"
                aria-label="Moeda de consulta"
                className={input}
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value as HomeCurrency);
                  setAccountFilter('all');
                }}
              >
                <option value="AOA">Kwanza (Kz)</option>
                <option value="USD">Dólar (USD)</option>
              </select>
            </label>
          )}
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
                  {cash(value)}
                </p>
              </div>
            ))}
          </div>
          <HomeCharts entries={period} month={month} currency={currency} />
          <section className={panel} id="home-dashboard-planning">
            <h2 className="text-sm font-semibold">O mês em perspetiva</h2>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <div>
                <p className={muted}>Contas ainda por pagar</p>
                <p className="mt-1 font-mono font-semibold">{cash(dueTotal)}</p>
                <p className={`${muted} mt-1`}>
                  {outstanding.length} contas no mês selecionado
                </p>
              </div>
              <div>
                <p className={muted}>Saldo atual após essas contas</p>
                <p
                  className={`mt-1 font-mono font-semibold ${available < dueTotal ? 'text-rose-600 dark:text-rose-300' : ''}`}
                >
                  {cash(available - dueTotal)}
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
                  Mês anterior completo: {cash(previousSpent)}
                </p>
              </div>
            </div>
            {budgetAlerts.length > 0 && (
              <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300">
                Atenção ao orçamento:{' '}
                {budgetAlerts
                  .map(
                    (b) =>
                      `${homeCategoryName(data, b.category)} (${Math.round((spending(b.category) / b.limit) * 100)}%)`,
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
                Resultado do mês: {cash(income - spent)}
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
                        <span className="font-mono">{cash(spending(c))}</span>
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
                      {cash(b.amount)}
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
                {data.goals
                  .filter(
                    (g) =>
                      accountCurrency(
                        data.accounts.find((a) => a.id === g.accountId),
                      ) === currency,
                  )
                  .slice(0, 3)
                  .map((g) => (
                    <div key={g.id}>
                      <div className="flex justify-between gap-3 text-xs mb-2">
                        <span className="font-medium">{g.title}</span>
                        <span>
                          {percent(
                            goalAcquired(data, g.id)
                              ? g.target
                              : g.fundingMode === 'plan'
                                ? (g.plannedAmount ?? 0)
                                : totals[g.accountId],
                            g.target,
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={percent(
                          goalAcquired(data, g.id)
                            ? g.target
                            : g.fundingMode === 'plan'
                              ? (g.plannedAmount ?? 0)
                              : totals[g.accountId],
                          g.target,
                        )}
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
                        {dateLabel(t.date)} ·{' '}
                        {homeCategoryName(data, t.category)}
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
          {data.settings?.showBusinessIncome !== false && (
            <BusinessIncomeTransfer currency={currency} />
          )}
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
            <div
              className="grid sm:grid-cols-3 gap-3 mb-4"
              id="home-account-totals"
            >
              {[
                { label: 'Total nas contas', value: available + reserved },
                { label: 'Disponível nas carteiras', value: available },
                { label: 'Reservado para metas', value: reserved },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg bg-slate-50 dark:bg-dm-elevated p-3"
                >
                  <p className={muted}>{item.label}</p>
                  <p className="font-mono text-sm font-semibold mt-1">
                    {cash(item.value)}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {financialAccounts
                .filter((a) => accountCurrency(a) === currency)
                .map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-slate-200 dark:border-dm-border p-3"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="text-xs font-medium break-words">
                        {a.name}
                      </p>
                      {a.kind === 'current' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className={secondary}
                            aria-label={`Editar carteira ${a.name}`}
                            onClick={() =>
                              open('account', {
                                editId: a.id,
                                title: a.name,
                                currency: accountCurrency(a),
                                openingBalance: String(a.openingBalance),
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {removeButton('account', a.id, a.name)}
                        </div>
                      )}
                    </div>
                    {editStamp(a)}
                    <p className="font-mono text-base font-semibold mt-2 break-words">
                      {cash(totals[a.id])}
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
                  {financialAccounts
                    .filter((a) => accountCurrency(a) === currency)
                    .map((a) => (
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
                    !e.deletedAt &&
                    entryCurrency(data, e) === currency &&
                    e.date.startsWith(month) &&
                    (accountFilter === 'all' ||
                      e.accountId === accountFilter ||
                      e.destinationId === accountFilter) &&
                    `${e.title} ${homeCategoryName(data, e.category)}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                )
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((e) => {
                  const reversed = !active.some((a) => a.id === e.id);
                  return (
                    <div
                      key={e.id}
                      data-home-entry-id={e.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium break-words">
                          {e.title}
                        </p>
                        {editStamp(e)}
                        <p className={`${muted} mt-1`}>
                          {dateLabel(e.date)} ·{' '}
                          {e.type === 'income'
                            ? 'Rendimento'
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
                          {homeCategoryName(data, e.category)}
                          {e.type !== 'reversal' && reversed
                            ? ' · Estornado'
                            : ''}
                        </p>
                      </div>
                      <span className="font-mono text-xs">
                        {cash(e.amount)}
                      </span>
                      {entryActions(e)}
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
          <section className={panel}>
            <h2 className="text-sm font-semibold">Gastos realizados no mês</h2>
            <p className={`${muted} mt-1`}>
              Total: {cash(spent)}. Inclui categorias sem limite definido.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              {Array.from(
                new Set(
                  period
                    .filter((e) => e.type === 'expense')
                    .map((e) => e.category),
                ),
              ).map((category) => (
                <div
                  key={category}
                  className="flex justify-between gap-2 text-xs rounded-lg bg-slate-50 dark:bg-dm-elevated p-3"
                >
                  <span>{homeCategoryName(data, category)}</span>
                  <span className="font-mono">{cash(spending(category))}</span>
                </div>
              ))}
            </div>
          </section>
          <section className={panel}>
            <h2 className="text-sm font-semibold">Despesas registadas</h2>
            <div className="divide-y divide-slate-200 dark:divide-dm-border">
              {period
                .filter((e) => e.type === 'expense')
                .map((e) => (
                  <div
                    key={e.id}
                    data-home-budget-entry-id={e.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className={muted}>
                        {dateLabel(e.date)} ·{' '}
                        {homeCategoryName(data, e.category)}
                      </p>
                      {editStamp(e)}
                    </div>
                    <span className="font-mono text-xs">{cash(e.amount)}</span>
                    {entryActions(e)}
                  </div>
                ))}
            </div>
          </section>
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
                    <h2 className="text-sm font-semibold">
                      {homeCategoryName(data, b.category)}
                    </h2>
                    <button
                      className={secondary}
                      aria-label={`Editar orçamento ${homeCategoryName(data, b.category)}`}
                      onClick={() =>
                        open('budget', {
                          editId: b.id,
                          currency: b.currency ?? 'AOA',
                          category: b.category,
                          amount: String(b.limit),
                          month: b.month,
                        })
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {removeButton(
                      'budget',
                      b.id,
                      `orçamento ${homeCategoryName(data, b.category)}`,
                    )}
                  </div>
                  {editStamp(b)}
                  <p className="font-mono text-sm mt-3">
                    {cash(used)} / {cash(b.limit)}
                  </p>
                  <div className="mt-3">
                    <Progress
                      value={percent(used, b.limit)}
                      label={`Orçamento ${homeCategoryName(data, b.category)}`}
                    />
                  </div>
                  <p className={`${muted} mt-2`}>
                    {used > b.limit
                      ? `Limite ultrapassado em ${cash(used - b.limit)}`
                      : `Ainda disponível: ${cash(b.limit - used)}`}
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
            {data.bills
              .filter((b) => (b.currency ?? 'AOA') === currency)
              .map((b) => {
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
                        {homeCategoryName(data, b.category)} · Vence em{' '}
                        {dateLabel(due)}
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
                    {editStamp(b)}
                    <span className="font-mono text-sm">{cash(b.amount)}</span>
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
                            currency: b.currency ?? 'AOA',
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
                      {removeButton('bill', b.id, b.title)}
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
            Planeamento acompanha um valor sem retirar dinheiro. Reserva
            transfere de uma carteira para a meta; “Adquirido” usa a reserva e
            regista a despesa uma única vez.
          </p>
          <div className="grid lg:grid-cols-2 gap-4">
            {data.goals
              .filter(
                (g) =>
                  accountCurrency(
                    data.accounts.find((a) => a.id === g.accountId),
                  ) === currency,
              )
              .map((g) => {
                const acquired = goalAcquired(data, g.id);
                const saved =
                  g.fundingMode === 'plan'
                    ? (g.plannedAmount ?? 0)
                    : acquired
                      ? g.target + totals[g.accountId]
                      : totals[g.accountId];
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
                      {cash(saved)}{' '}
                      <span className="text-xs font-normal text-slate-500 dark:text-dm-muted">
                        de {cash(g.target)}
                      </span>
                    </p>
                    <Progress
                      value={percent(saved, g.target)}
                      label={g.title}
                    />
                    <p className={`${muted} mt-2`}>
                      {saved >= g.target
                        ? acquired
                          ? 'Adquirido'
                          : 'Meta alcançada!'
                        : `Faltam ${cash(g.target - saved)}`}
                    </p>
                    <p className={`${muted} mt-2`}>
                      {g.fundingMode === 'plan'
                        ? 'Planeamento: sem desconto da carteira'
                        : 'Reserva: dinheiro retirado do saldo disponível'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {!acquired && saved >= g.target && (
                        <button
                          className={primary}
                          onClick={() =>
                            run(() =>
                              update((d) =>
                                acquireHomeGoal(d, g.id, todayLocal()),
                              ),
                            )
                          }
                        >
                          Marcar como adquirido
                        </button>
                      )}
                      <button
                        className={primary}
                        disabled={acquired}
                        onClick={() =>
                          open('contribution', {
                            goalId: g.id,
                            title: g.title,
                            currency: accountCurrency(
                              data.accounts.find((a) => a.id === g.accountId),
                            ),
                            fundingMode: g.fundingMode ?? 'reserve',
                            ...(g.fundingMode === 'plan'
                              ? { amount: String(g.plannedAmount ?? 0) }
                              : {}),
                          })
                        }
                      >
                        {g.fundingMode === 'plan'
                          ? 'Atualizar progresso'
                          : 'Reservar valor'}
                      </button>
                      {g.fundingMode !== 'plan' && totals[g.accountId] > 0 && (
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
                            currency: accountCurrency(
                              data.accounts.find((a) => a.id === g.accountId),
                            ),
                            fundingMode: g.fundingMode ?? 'reserve',
                            category: g.category ?? 'Outros',
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {removeButton('goal', g.id, `meta ${g.title}`)}
                      {editStamp(g)}
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
                      {dateLabel(t.date)} · {homeCategoryName(data, t.category)}
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
                  {removeButton('task', t.id, `tarefa ${t.title}`)}
                  {editStamp(t)}
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

      {section === 'Compras' && <HomeShopping currency={currency} />}
      {section === 'Definições' && (
        <div className="space-y-4">
          {settingsSection === null ? (
            <div className="space-y-1">
              {[
                {
                  key: 'appearance',
                  title: 'Aparência',
                  description: 'Escolher Claro, Anoitecer ou o tema do sistema',
                  icon: Palette,
                },
                {
                  key: 'categories',
                  title: 'Categorias e subcategorias',
                  description: 'Organizar despesas, rendimentos e compras',
                  icon: Tags,
                },
                {
                  key: 'goals',
                  title: 'Metas e carteiras',
                  description:
                    'Definir como reservar dinheiro para os teus sonhos',
                  icon: Target,
                },
                {
                  key: 'business',
                  title: 'Rendimentos do Business',
                  description:
                    'Mostrar a transferência para uma carteira pessoal',
                  icon: Building2,
                },
                {
                  key: 'house',
                  title: 'O teu espaço Home',
                  description: 'Personalizar o nome da casa',
                  icon: House,
                },
                {
                  key: 'backup',
                  title: 'Cópia de segurança',
                  description: 'Exportar ou restaurar os dados pessoais',
                  icon: ShieldCheck,
                },
              ].map(({ key, title, description, icon: Icon }) => (
                <button
                  key={key}
                  id={`home-settings-${key}`}
                  type="button"
                  onClick={() => setSettingsSection(key)}
                  className="flex w-full items-center gap-4 rounded-lg border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface px-4 py-5 text-left hover:bg-slate-50 dark:hover:bg-dm-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium">{title}</span>
                    <span className={`${muted} block mt-1`}>{description}</span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          ) : (
            <button
              id="home-settings-overview"
              type="button"
              onClick={() => setSettingsSection(null)}
              className={secondary}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar às Definições
            </button>
          )}
          {settingsSection === 'appearance' && <AppearanceSettings />}
          {settingsSection === 'categories' && <HomeCategories />}
          {settingsSection === 'goals' && (
            <section className={panel}>
              <h2 className="text-sm font-semibold">Metas e carteiras</h2>
              <label className="flex items-start gap-3 mt-4 text-sm">
                <input
                  id="home-goals-auto-reserve"
                  type="checkbox"
                  checked={data.settings?.reserveGoals ?? false}
                  onChange={(e) =>
                    run(() =>
                      update((d) => ({
                        ...d,
                        settings: {
                          ...d.settings,
                          reserveGoals: e.target.checked,
                          goalsPreferenceSet: true,
                        },
                      })),
                    )
                  }
                />
                <span>
                  Reservar dinheiro automaticamente nas novas metas
                  <span className={`${muted} block mt-1`}>
                    Desligado: progresso apenas planeado. Ligado: cada
                    contribuição sai da carteira escolhida. As metas existentes
                    conservam o seu modo; podes alterá-lo ao editar, depois de
                    retirar eventuais reservas.
                  </span>
                </span>
              </label>
            </section>
          )}
          {settingsSection === 'business' && (
            <section className={panel}>
              <label className="flex items-start gap-3 text-sm">
                <input
                  id="home-show-business-income"
                  type="checkbox"
                  checked={data.settings?.showBusinessIncome !== false}
                  onChange={(e) =>
                    run(() =>
                      update((d) => ({
                        ...d,
                        settings: {
                          ...d.settings,
                          reserveGoals: d.settings?.reserveGoals ?? false,
                          goalsPreferenceSet: true,
                          showBusinessIncome: e.target.checked,
                        },
                      })),
                    )
                  }
                />
                <span>
                  Mostrar transferência de rendimentos do Business nas Finanças
                </span>
              </label>
            </section>
          )}
          {settingsSection === 'house' && (
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
                Contas em Kwanza (AOA) e Dólar (USD). Totais separados por
                moeda; sem câmbio automático.
              </p>
            </section>
          )}
          {settingsSection === 'backup' && (
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
          )}
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
          <form noValidate onSubmit={save} className="space-y-4">
            {error && (
              <p
                role="alert"
                className="text-xs text-rose-700 dark:text-rose-300"
              >
                {error}
              </p>
            )}
            {['account', 'goal', 'budget', 'bill'].includes(form.kind) &&
              field('Moeda', 'currency', 'text', [
                { value: 'AOA', label: 'Kwanza (Kz)' },
                { value: 'USD', label: 'Dólar (USD)' },
              ])}
            {form.kind === 'goal' &&
              field('Funcionamento da meta', 'fundingMode', 'text', [
                { value: 'plan', label: 'Planeamento, sem desconto' },
                { value: 'reserve', label: 'Reserva, descontar da carteira' },
              ])}
            {form.kind === 'entry' &&
              field('Operação', 'type', 'text', [
                { value: 'income', label: 'Rendimento' },
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
                  ? `Valor da meta (${form.values.currency === 'USD' ? 'USD' : 'Kz'})`
                  : form.kind === 'budget'
                    ? `Limite mensal (${form.values.currency === 'USD' ? 'USD' : 'Kz'})`
                    : `Valor (${form.values.currency === 'USD' ? 'USD' : 'Kz'})`,
                'amount',
                'number',
              )}
            {form.kind === 'account' &&
              field(
                `Saldo atual inicial (${form.values.currency === 'USD' ? 'USD' : 'Kz'})`,
                'openingBalance',
                'number',
              )}
            {['entry', 'contribution', 'payment'].includes(form.kind) &&
              !(
                form.kind === 'contribution' &&
                form.values.fundingMode === 'plan'
              ) &&
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
            {['entry', 'bill', 'budget', 'task', 'goal'].includes(form.kind) &&
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
            {form.kind === 'account' && form.values.editId && (
              <p className={muted}>
                O saldo é calculado pelos lançamentos. O saldo de abertura e a
                moeda ficam preservados nesta edição.
              </p>
            )}
            {form.kind === 'entry' &&
              form.values.editId &&
              data.entries.find((e) => e.id === form.values.editId)
                ?.businessMovementId && (
                <p className={muted}>
                  Valor, data e carteira pertencem à transferência Business.
                  Para corrigir esses campos, estorna em conjunto e regista uma
                  transferência correta. Descrição e categoria podem ser
                  editadas aqui.
                </p>
              )}
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
                {form.values.editId ? 'Guardar alterações' : 'Guardar'}
              </button>
            </div>
          </form>
        </HomeModal>
      )}
      {removing && (
        <HomeModal
          title={`Eliminar ${removing.name}`}
          onClose={() => setRemoving(null)}
        >
          <p className="text-sm">
            Confirmas eliminar este registo? A operação recalcula os saldos e
            totais. O histórico fica guardado na cópia de segurança.
          </p>
          {error && (
            <p role="alert" className="text-xs text-rose-600 mt-3">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className={secondary}
              onClick={() => setRemoving(null)}
            >
              Cancelar
            </button>
            <button
              id="home-delete-confirm"
              type="button"
              className={primary}
              onClick={() =>
                run(() => {
                  const linked =
                    removing.kind === 'entry' &&
                    savedData.entries.find((e) => e.id === removing.id)
                      ?.businessMovementId;
                  if (linked)
                    bridge.reverse(
                      removing.id,
                      'Eliminação pessoal confirmada',
                      true,
                    );
                  else
                    update((d) =>
                      deleteHomeEntity(d, removing.kind, removing.id),
                    );
                  setRemoving(null);
                })
              }
            >
              Eliminar
            </button>
          </div>
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
