import { HomeData, HomeEntry } from '../types/home';
import { createId } from './ids';

export const HOME_STORAGE_KEY = 'myoffice-home-v1';
export const HOME_CATEGORIES = [
  'Habitação',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Serviços',
  'Lazer',
  'Outros',
];
export const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const emptyHome = (): HomeData => ({
  version: 1,
  name: 'Minha casa',
  accounts: [
    { id: 'home-wallet', name: 'Carteira', openingBalance: 0, kind: 'current' },
  ],
  entries: [],
  budgets: [],
  bills: [],
  goals: [],
  tasks: [],
});
export function validDate(date: unknown): date is string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return false;
  const d = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === date;
}
export const validMonth = (month: unknown): month is string =>
  typeof month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
export function money(value: number, positive = true) {
  if (
    !Number.isFinite(value) ||
    (positive ? value <= 0 : value < 0) ||
    value > 1e12 ||
    Math.abs(value * 100 - Math.round(value * 100)) > 0.001
  )
    throw new Error('Indica um valor válido, com até duas casas decimais.');
  return Math.round(value * 100) / 100;
}
export const text = (value: string) => {
  if (typeof value !== 'string' || !value.trim() || value.length > 300)
    throw new Error('Preenche o nome ou a descrição (até 300 caracteres).');
  return value.trim();
};
export const effectiveEntries = (data: HomeData) => {
  const undone = new Set(
    data.entries.filter((e) => e.type === 'reversal').map((e) => e.reversalOf),
  );
  return data.entries.filter((e) => e.type !== 'reversal' && !undone.has(e.id));
};
export function balances(data: HomeData): Record<string, number> {
  const cents = Object.fromEntries(
    data.accounts.map((a) => [a.id, Math.round(a.openingBalance * 100)]),
  );
  for (const e of effectiveEntries(data)) {
    const amount = Math.round(e.amount * 100);
    cents[e.accountId] += e.type === 'income' ? amount : -amount;
    if (e.type === 'transfer') cents[e.destinationId!] += amount;
  }
  return Object.fromEntries(
    Object.entries(cents).map(([id, value]) => [id, value / 100]),
  );
}
export const billPaid = (data: HomeData, billId: string, month: string) =>
  effectiveEntries(data).some(
    (e) => e.billId === billId && e.billMonth === month,
  );
export function dueDate(month: string, day: number) {
  if (!validMonth(month)) throw new Error('Mês inválido.');
  const [y, m] = month.split('-').map(Number);
  return `${month}-${String(Math.min(day, new Date(y, m, 0).getDate())).padStart(2, '0')}`;
}
export function addHomeEntry(
  data: HomeData,
  input: Omit<HomeEntry, 'id'>,
): HomeData {
  const entry = {
    ...input,
    id: createId('home-entry'),
    title: text(input.title),
    category: text(input.category),
    amount: money(input.amount),
  };
  if (!validDate(entry.date) || entry.date > todayLocal())
    throw new Error(
      'Escolhe uma data válida, até hoje. Planeia despesas futuras nas contas da casa.',
    );
  if (!data.accounts.some((a) => a.id === entry.accountId))
    throw new Error('Escolhe uma conta válida.');
  if (entry.type === 'reversal') throw new Error('Usa a operação de estorno.');
  if (!['income', 'expense', 'transfer'].includes(entry.type))
    throw new Error('Tipo de lançamento inválido.');
  if (
    entry.type === 'transfer' &&
    (entry.accountId === entry.destinationId ||
      !data.accounts.some((a) => a.id === entry.destinationId))
  )
    throw new Error('Escolhe uma conta de destino diferente.');
  if (entry.type !== 'income' && balances(data)[entry.accountId] < entry.amount)
    throw new Error(
      'O saldo desta conta é insuficiente. Regista primeiro a receita ou escolhe outra conta.',
    );
  if (
    entry.billId &&
    (!data.bills.some((b) => b.id === entry.billId) ||
      !validMonth(entry.billMonth) ||
      entry.type !== 'expense')
  )
    throw new Error('Conta recorrente inválida.');
  if (entry.billId && billPaid(data, entry.billId, entry.billMonth!))
    throw new Error('Esta conta já está paga neste mês.');
  return { ...data, entries: [entry, ...data.entries] };
}
export function reverseHomeEntry(
  data: HomeData,
  id: string,
  reason: string,
): HomeData {
  const original = effectiveEntries(data).find((e) => e.id === id);
  if (!original)
    throw new Error('Este lançamento já foi estornado ou não existe.');
  const next: HomeData = {
    ...data,
    entries: [
      {
        ...original,
        id: createId('home-entry'),
        type: 'reversal',
        reversalOf: id,
        title: `Estorno: ${text(reason)}`,
        date: todayLocal(),
      },
      ...data.entries,
    ],
  };
  if (Object.values(balances(next)).some((value) => value < 0))
    throw new Error(
      'O estorno deixaria uma conta sem saldo. Corrige primeiro os movimentos dependentes.',
    );
  return next;
}

/** Validate backup and references before replacing any saved data. */
export function validateHomeData(input: unknown): HomeData {
  const data = input as HomeData;
  if (!data || data.version !== 1)
    throw new Error('Este ficheiro não é uma cópia Home compatível.');
  text(data.name);
  const arrays = [
    data.accounts,
    data.entries,
    data.budgets,
    data.bills,
    data.goals,
    data.tasks,
  ];
  if (
    arrays.some((a) => !Array.isArray(a) || a.length > 50000) ||
    !data.accounts.length
  )
    throw new Error('Cópia incompleta ou demasiado grande.');
  const ids = new Set<string>();
  for (const rows of arrays)
    for (const row of rows) {
      if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id))
        throw new Error('Identificadores inválidos ou repetidos.');
      ids.add(row.id);
    }
  const accounts = new Set(data.accounts.map((a) => a.id));
  for (const a of data.accounts) {
    text(a.name);
    money(a.openingBalance, false);
    if (!['current', 'savings'].includes(a.kind))
      throw new Error('Tipo de conta inválido.');
  }
  for (const b of data.bills) {
    text(b.title);
    text(b.category);
    money(b.amount);
    if (
      !Number.isInteger(b.day) ||
      b.day < 1 ||
      b.day > 31 ||
      typeof b.active !== 'boolean'
    )
      throw new Error('Conta recorrente inválida.');
  }
  const bills = new Set(data.bills.map((b) => b.id));
  const reversals = new Set<string>();
  for (const e of data.entries) {
    text(e.title);
    text(e.category);
    money(e.amount);
    if (
      !validDate(e.date) ||
      !accounts.has(e.accountId) ||
      !['income', 'expense', 'transfer', 'reversal'].includes(e.type)
    )
      throw new Error('Lançamento inválido.');
    if (
      e.type === 'transfer' &&
      (!accounts.has(e.destinationId!) || e.accountId === e.destinationId)
    )
      throw new Error('Transferência inválida.');
    if (e.billId && (!bills.has(e.billId) || !validMonth(e.billMonth)))
      throw new Error('Referência de conta recorrente inválida.');
    if (e.type === 'reversal') {
      const original = data.entries.find((o) => o.id === e.reversalOf);
      if (
        !original ||
        original.type === 'reversal' ||
        reversals.has(original.id) ||
        e.amount !== original.amount ||
        e.accountId !== original.accountId ||
        e.destinationId !== original.destinationId ||
        e.billId !== original.billId ||
        e.billMonth !== original.billMonth
      )
        throw new Error('Estorno inválido.');
      reversals.add(original.id);
    } else if (e.reversalOf) throw new Error('Referência de estorno inválida.');
  }
  const payments = new Set<string>();
  for (const e of effectiveEntries(data))
    if (e.billId) {
      const key = `${e.billId}:${e.billMonth}`;
      if (e.type !== 'expense' || payments.has(key))
        throw new Error('Pagamento repetido ou inválido.');
      payments.add(key);
    }
  const budgetKeys = new Set<string>();
  for (const b of data.budgets) {
    text(b.category);
    money(b.limit);
    const key = `${b.month}:${b.category}`;
    if (!validMonth(b.month) || budgetKeys.has(key))
      throw new Error('Orçamento inválido ou repetido.');
    budgetKeys.add(key);
  }
  const goalAccounts = new Set<string>();
  for (const g of data.goals) {
    text(g.title);
    money(g.target);
    if (
      !validDate(g.deadline) ||
      !accounts.has(g.accountId) ||
      goalAccounts.has(g.accountId) ||
      data.accounts.find((a) => a.id === g.accountId)?.kind !== 'savings'
    )
      throw new Error('Meta inválida.');
    goalAccounts.add(g.accountId);
  }
  for (const t of data.tasks) {
    text(t.title);
    text(t.category);
    if (!validDate(t.date) || typeof t.done !== 'boolean')
      throw new Error('Tarefa inválida.');
  }
  if (Object.values(balances(data)).some((v) => v < 0))
    throw new Error('A cópia contém saldos negativos.');
  return data;
}
