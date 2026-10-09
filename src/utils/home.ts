import { normalizeHomeCatalog } from './homeCategories';
import {
  HOME_SUBCATEGORIES,
  validateCategoryTree,
  categoryChildren,
} from './categories';
import { HomeData, HomeEntry, HomeAccount, HomeCurrency } from '../types/home';
import { formatCurrencyValue } from './formatters';
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
  'Games',
  'Eletrodomésticos',
  'Animais de estimação',
  'Família',
  'Roupa',
  'Lixo',
  'Internet',
  'Tecnologia',
];
export const HOME_INCOME_CATEGORIES = [
  'Salário',
  'Rendimentos do Business',
  'Bónus',
  'Investimentos',
  'Outras receitas',
];
export const accountCurrency = (
  account: HomeAccount | undefined,
): HomeCurrency => account?.currency ?? 'AOA';
export const formatHomeMoney = (value: number, currency: HomeCurrency) =>
  formatCurrencyValue(value, currency === 'AOA' ? 'Kz' : currency);
export const entryCurrency = (data: HomeData, entry: HomeEntry) =>
  accountCurrency(data.accounts.find((a) => a.id === entry.accountId));
export const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const emptyHome = (): HomeData => ({
  version: 1,
  settings: { reserveGoals: false, showBusinessIncome: true },
  incomeCategories: [...HOME_INCOME_CATEGORIES],
  incomeSubcategories: {},
  name: 'Minha casa',
  accounts: [
    {
      id: 'home-wallet',
      name: 'Carteira',
      openingBalance: 0,
      kind: 'current',
      currency: 'AOA',
    },
  ],
  entries: [],
  budgets: [],
  bills: [],
  goals: [],
  tasks: [],
  categories: [...HOME_CATEGORIES],
  shopping: [],
  subcategories: structuredClone(HOME_SUBCATEGORIES),
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
  if (
    entry.type === 'transfer' &&
    accountCurrency(data.accounts.find((a) => a.id === entry.accountId)) !==
      accountCurrency(data.accounts.find((a) => a.id === entry.destinationId))
  )
    throw new Error(
      'Escolhe contas da mesma moeda. Não há conversão automática.',
    );
  if (
    entry.billId &&
    (data.bills.find((b) => b.id === entry.billId)?.currency ?? 'AOA') !==
      accountCurrency(data.accounts.find((a) => a.id === entry.accountId))
  )
    throw new Error('A moeda da conta deve coincidir com a conta da casa.');
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
  allowBusiness = false,
): HomeData {
  const original = effectiveEntries(data).find((e) => e.id === id);
  if (!original)
    throw new Error('Este lançamento já foi estornado ou não existe.');
  if (original.businessMovementId && !allowBusiness)
    throw new Error('Estorna esta transferência pelo fluxo Business/Home.');
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
  const source = input as HomeData;
  const data = source && {
    ...source,
    accounts: Array.isArray(source.accounts)
      ? source.accounts.map((a) => ({ ...a, currency: a.currency ?? 'AOA' }))
      : source.accounts,
    settings: source.settings?.goalsPreferenceSet
      ? source.settings
      : { reserveGoals: false, showBusinessIncome: source.settings?.showBusinessIncome ?? true },
    incomeCategories: source.incomeCategories ?? [...HOME_INCOME_CATEGORIES],
    incomeSubcategories: source.incomeSubcategories ?? {},
    categories: source.categoryCatalog ? source.categories ?? [] : Array.isArray(source.categories)
      ? [
          ...source.categories,
          ...HOME_CATEGORIES.filter(
            (c) =>
              !source.categories!.some(
                (old) =>
                  typeof old === 'string' &&
                  old.toLocaleLowerCase() === c.toLocaleLowerCase(),
              ),
          ),
        ]
      : (source.categories ?? [...HOME_CATEGORIES]),
    shopping: source.shopping ?? [],
    subcategories: source.subcategories ?? structuredClone(HOME_SUBCATEGORIES),
  };
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
    data.shopping!,
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
    if (!['AOA', 'USD'].includes(a.currency!))
      throw new Error('Moeda de conta inválida.');
    if (!['current', 'savings'].includes(a.kind))
      throw new Error('Tipo de conta inválido.');
  }
  for (const b of data.bills) {
    text(b.title);
    text(b.category);
    if (!['AOA', 'USD'].includes(b.currency ?? 'AOA'))
      throw new Error('Moeda de conta recorrente inválida.');
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
    if (
      e.type === 'transfer' &&
      accountCurrency(data.accounts.find((a) => a.id === e.accountId)) !==
        accountCurrency(data.accounts.find((a) => a.id === e.destinationId))
    )
      throw new Error('Transferência entre moedas diferentes.');
    if (
      e.billId &&
      (!bills.has(e.billId) ||
        !validMonth(e.billMonth) ||
        (e.type !== 'reversal' && e.type !== 'expense') ||
        (data.bills.find((b) => b.id === e.billId)?.currency ?? 'AOA') !==
          entryCurrency(data, e))
    )
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
        e.billMonth !== original.billMonth ||
        e.goalId !== original.goalId ||
        e.businessMovementId !== original.businessMovementId
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
    if (!['AOA', 'USD'].includes(b.currency ?? 'AOA'))
      throw new Error('Moeda do orçamento inválida.');
    const key = `${b.month}:${b.category}:${b.currency ?? 'AOA'}`;
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
    if (!['reserve', 'plan'].includes(g.fundingMode ?? 'reserve'))
      throw new Error('Modo da meta inválido.');
    money(g.plannedAmount ?? 0, false);
    if (g.acquiredDate && !validDate(g.acquiredDate))
      throw new Error('Data de aquisição inválida.');
    if (g.acquisitionEntryId) {
      const acquisition = data.entries.find(
        (e) => e.id === g.acquisitionEntryId,
      );
      if (
        !acquisition ||
        acquisition.type !== 'expense' ||
        acquisition.goalId !== g.id ||
        acquisition.accountId !== g.accountId ||
        (effectiveEntries(data).some((e) => e.id === acquisition.id) &&
          acquisition.amount !== g.target) ||
        g.fundingMode === 'plan'
      )
        throw new Error('Aquisição da meta inválida.');
    }
    if (g.fundingMode === 'plan' && balances(data)[g.accountId] !== 0)
      throw new Error(
        'Uma meta de planeamento não pode conter reservas reais.',
      );
  }
  for (const t of data.tasks) {
    text(t.title);
    text(t.category);
    if (!validDate(t.date) || typeof t.done !== 'boolean')
      throw new Error('Tarefa inválida.');
  }
  if (
    !Array.isArray(data.categories) ||
    data.categories.length > 500 ||
    new Set(data.categories.map((c) => text(c).toLocaleLowerCase())).size !==
      data.categories.length
  )
    throw new Error('Categorias inválidas ou repetidas.');
  data.categories.forEach((c) => text(c));
  if (typeof data.settings.reserveGoals !== 'boolean' || data.settings.showBusinessIncome !== undefined && typeof data.settings.showBusinessIncome !== 'boolean')
    throw new Error('Configuração de metas inválida.');
  if (
    !Array.isArray(data.incomeCategories) ||
    data.incomeCategories.length > 500 ||
    new Set(data.incomeCategories.map((c) => text(c).toLocaleLowerCase()))
      .size !== data.incomeCategories.length
  )
    throw new Error('Categorias de rendimentos inválidas.');
  validateCategoryTree(data.incomeSubcategories);
  for (const e of data.entries)
    if (e.goalId && !data.goals.some((g) => g.id === e.goalId))
      throw new Error('Referência de meta inválida.');
  validateCategoryTree(data.subcategories);
  const linkedEntries = new Set<string>();
  for (const item of data.shopping!) {
    text(item.name);
    text(item.category);
    if (
      item.subcategory &&
      !categoryChildren(data.subcategories!, item.category).includes(
        item.subcategory,
      )
    )
      throw new Error('Subcategoria de compras inválida.');
    money(item.unitPrice, false);
    if (!['AOA', 'USD'].includes(item.currency ?? 'AOA'))
      throw new Error('Moeda de compras inválida.');
    if (
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0 ||
      item.quantity > 1000000 ||
      typeof item.archived !== 'boolean'
    )
      throw new Error('Item de compras inválido.');
    money(Math.round(item.quantity * item.unitPrice * 100) / 100, false);
    if (item.entryId) {
      const original = data.entries.find((e) => e.id === item.entryId);
      if (
        !original ||
        original.type !== 'expense' ||
        linkedEntries.has(item.entryId) ||
        original.category !== item.category ||
        entryCurrency(data, original) !== (item.currency ?? 'AOA') ||
        Math.round(original.amount * 100) !==
          Math.round(item.quantity * item.unitPrice * 100)
      )
        throw new Error('Pagamento de compras inválido ou repetido.');
      linkedEntries.add(item.entryId);
    }
  }
  if (Object.values(balances(data)).some((v) => v < 0))
    throw new Error('A cópia contém saldos negativos.');
  return normalizeHomeCatalog(data);
}

export function payHomeShopping(
  data: HomeData,
  itemId: string,
  accountId: string,
  date: string,
): HomeData {
  const item = data.shopping?.find((i) => i.id === itemId);
  if (
    item &&
    accountCurrency(data.accounts.find((a) => a.id === accountId)) !==
      (item.currency ?? 'AOA')
  )
    throw new Error('Escolhe uma conta da mesma moeda da compra.');
  if (!item || item.archived) throw new Error('Item indisponível.');
  if (item.entryId && effectiveEntries(data).some((e) => e.id === item.entryId))
    throw new Error('Esta compra já foi paga.');
  const next = addHomeEntry(data, {
    type: 'expense',
    title: `Compra: ${item.name}`,
    category: item.category,
    subcategory: item.subcategory,
    amount: money(Math.round(item.quantity * item.unitPrice * 100) / 100),
    accountId,
    date,
  });
  return {
    ...next,
    shopping: data.shopping!.map((i) =>
      i.id === item.id ? { ...i, entryId: next.entries[0].id } : i,
    ),
  };
}

export function contributeHomeGoal(
  data: HomeData,
  goalId: string,
  accountId: string,
  amount: number,
  date: string,
): HomeData {
  const goal = data.goals.find((g) => g.id === goalId);
  if (!goal || goalAcquired(data, goalId))
    throw new Error('Meta indisponível ou já adquirida.');
  if (goal.fundingMode === 'plan') {
    money(amount, false);
    return {
      ...data,
      goals: data.goals.map((g) =>
        g.id === goalId ? { ...g, plannedAmount: amount } : g,
      ),
    };
  }
  return addHomeEntry(data, {
    type: 'transfer',
    title: `Reserva: ${goal.title}`,
    amount,
    date,
    category: 'Reserva para metas',
    accountId,
    destinationId: goal.accountId,
  });
}
export function goalAcquired(data: HomeData, id: string): boolean {
  const goal = data.goals.find((g) => g.id === id);
  return (
    !!goal &&
    (goal.fundingMode === 'plan'
      ? !!goal.acquiredDate
      : !!goal.acquisitionEntryId &&
        effectiveEntries(data).some((e) => e.id === goal.acquisitionEntryId))
  );
}
export function acquireHomeGoal(
  data: HomeData,
  id: string,
  date: string,
): HomeData {
  const goal = data.goals.find((g) => g.id === id);
  if (!goal || goalAcquired(data, id))
    throw new Error('Meta indisponível ou já adquirida.');
  if (!validDate(date) || date > todayLocal())
    throw new Error('Escolhe uma data de aquisição até hoje.');
  if (goal.fundingMode === 'plan') {
    if ((goal.plannedAmount ?? 0) < goal.target)
      throw new Error('A meta ainda não foi alcançada.');
    return {
      ...data,
      goals: data.goals.map((g) =>
        g.id === id ? { ...g, acquiredDate: date } : g,
      ),
    };
  }
  if (balances(data)[goal.accountId] < goal.target)
    throw new Error('Completa primeiro a reserva desta meta.');
  const next = addHomeEntry(data, {
    type: 'expense',
    title: `Adquirido: ${goal.title}`,
    amount: goal.target,
    date,
    category: goal.category || 'Outros',
    accountId: goal.accountId,
    goalId: id,
  });
  return {
    ...next,
    goals: next.goals.map((g) =>
      g.id === id
        ? { ...g, acquiredDate: date, acquisitionEntryId: next.entries[0].id }
        : g,
    ),
  };
}
