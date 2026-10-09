import { HomeBill, HomeData, HomeOccurrence } from '../types/home';
import {
  addHomeEntry,
  accountCurrency,
  homeExchange,
  money,
  settlementCurrency,
  validDate,
  text,
  todayLocal,
} from './home';

/** Anchor each month to the original day: January 31 -> February 28 -> March 31. */
export function occurrenceDate(bill: HomeBill, index: number): string {
  const start = bill.startDate!;
  const r = bill.recurrence!;
  const d = new Date(`${start}T12:00:00Z`);
  const interval =
    r.frequency === 'custom'
      ? r.interval!
      : r.frequency === 'fortnightly'
        ? 2
        : 1;
  const unit =
    r.frequency === 'custom'
      ? r.unit
      : ['monthly', 'yearly'].includes(r.frequency)
        ? 'months'
        : 'weeks';
  if (unit === 'months') {
    const months = index * interval * (r.frequency === 'yearly' ? 12 : 1);
    const last = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months + 1, 0),
    ).getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + months);
    d.setUTCDate(Math.min(Number(start.slice(8)), last));
  } else
    d.setUTCDate(
      d.getUTCDate() + index * interval * (unit === 'weeks' ? 7 : 1),
    );
  return d.toISOString().slice(0, 10);
}
export function scheduledDates(bill: HomeBill, through: string): string[] {
  if (!bill.startDate || !bill.recurrence) return [];
  const dates: string[] = [];
  for (let i = 0; i < 50000; i++) {
    if (bill.recurrence.end === 'count' && i >= bill.recurrence.count!) break;
    const date = occurrenceDate(bill, i);
    if (
      date > through ||
      (bill.recurrence.end === 'date' && date > bill.recurrence.until!)
    )
      break;
    dates.push(date);
    if (bill.recurrence.frequency === 'none') break;
    if (i === 49999)
      throw new Error(
        'O intervalo da repetição é demasiado longo. Ajusta a data de início.',
      );
  }
  return dates;
}
export function validateHomeSchedules(data: HomeData) {
  if (
    data.settings?.accountingMode &&
    !['ask', 'automatic'].includes(data.settings.accountingMode)
  )
    throw new Error('Modo de contabilização inválido.');
  for (const b of data.bills) {
    if (b.type && !['income', 'expense'].includes(b.type))
      throw new Error('Tipo de conta inválido.');
    if (b.exchangeRate !== undefined)
      homeExchange(b.amount, b.currency ?? 'AOA', b.exchangeRate);
    if (
      b.accountId &&
      (!data.accounts.some((a) => a.id === b.accountId) ||
        accountCurrency(data.accounts.find((a) => a.id === b.accountId)) !==
          settlementCurrency(b.currency ?? 'AOA', b.exchangeRate))
    )
      throw new Error('Carteira da conta recorrente inválida.');
    if (b.generateAfter && !validDate(b.generateAfter))
      throw new Error('Data de pausa inválida.');
    if (!b.recurrence) continue; // Keep legacy monthly manual bills readable.
    const r = b.recurrence;
    if (
      !validDate(b.startDate) ||
      ![
        'none',
        'weekly',
        'fortnightly',
        'monthly',
        'yearly',
        'custom',
      ].includes(r.frequency) ||
      !['never', 'date', 'count'].includes(r.end) ||
      !['ask', 'automatic'].includes(b.accountingMode!)
    )
      throw new Error('Repetição inválida.');
    if (
      r.frequency === 'custom' &&
      (!Number.isInteger(r.interval) ||
        r.interval! < 1 ||
        r.interval! > 10000 ||
        !['days', 'weeks', 'months'].includes(r.unit!))
    )
      throw new Error('Intervalo personalizado inválido.');
    if (r.end === 'date' && (!validDate(r.until) || r.until! < b.startDate!))
      throw new Error('O fim deve ser posterior ao início.');
    if (
      r.end === 'count' &&
      (!Number.isInteger(r.count) || r.count! < 1 || r.count! > 50000)
    )
      throw new Error('Número de ocorrências inválido.');
  }
  if (
    !Array.isArray(data.occurrences ?? []) ||
    (data.occurrences?.length ?? 0) > 50000
  )
    throw new Error('Ocorrências inválidas.');
  const ids = new Set<string>();
  for (const o of data.occurrences ?? []) {
    if (
      !o ||
      o.id !== `${o.billId}:${o.due}` ||
      !validDate(o.due) ||
      !data.bills.some((b) => b.id === o.billId) ||
      ids.has(o.id) ||
      !['pending', 'accepted', 'ignored'].includes(o.state)
    )
      throw new Error('Ocorrência repetida ou inválida.');
    ids.add(o.id);
    text(o.snapshot.title);
    text(o.snapshot.category);
    money(o.snapshot.amount);
    if (!['expense', 'income'].includes(o.snapshot.type))
      throw new Error('Tipo de ocorrência inválido.');
    homeExchange(
      o.snapshot.amount,
      o.snapshot.currency,
      o.snapshot.exchangeRate,
    );
    if (
      o.snapshot.accountId &&
      !data.accounts.some((a) => a.id === o.snapshot.accountId)
    )
      throw new Error('Carteira de ocorrência inválida.');
    if (
      o.state === 'accepted' &&
      !data.entries.some(
        (e) =>
          e.id === o.entryId &&
          e.billId === o.billId &&
          e.occurrenceId === o.id,
      )
    )
      throw new Error('Lançamento de ocorrência em falta.');
    if (o.state !== 'accepted' && o.entryId)
      throw new Error('Ocorrência não contabilizada com lançamento.');
  }
  for (const e of data.entries)
    if (
      e.occurrenceId &&
      !(data.occurrences ?? []).some(
        (o) =>
          o.id === e.occurrenceId &&
          o.billId === e.billId &&
          (o.entryId === e.id || e.type === 'reversal'),
      )
    )
      throw new Error('Referência de ocorrência inválida.');
}
export function occurrenceSnapshot(b: HomeBill, due: string): HomeOccurrence {
  return {
    id: `${b.id}:${due}`,
    billId: b.id,
    due,
    state: 'pending',
    snapshot: {
      title: b.title,
      amount: b.amount,
      category: b.category,
      type: b.type ?? 'expense',
      currency: b.currency ?? 'AOA',
      exchangeRate: b.exchangeRate,
      accountId: b.accountId,
    },
  };
}
export function settleHomeOccurrence(
  data: HomeData,
  id: string,
  action: 'accept' | 'ignore',
  options?: {
    accountId?: string;
    date?: string;
    amount?: number;
    exchangeRate?: number;
  },
) {
  const o = data.occurrences?.find((o) => o.id === id);
  if (!o || o.state !== 'pending')
    throw new Error('Esta ocorrência já foi tratada.');
  if (action === 'ignore')
    return {
      ...data,
      occurrences: data.occurrences!.map((item) =>
        item.id === id
          ? {
              ...item,
              state: 'ignored' as const,
              settledAt: new Date().toISOString(),
              error: undefined,
            }
          : item,
      ),
    };
  const s = o.snapshot;
  const accountId = options?.accountId || s.accountId || '';
  const rate = options?.exchangeRate ?? s.exchangeRate;
  const converted = homeExchange(options?.amount ?? s.amount, s.currency, rate);
  if (
    accountCurrency(data.accounts.find((a) => a.id === accountId)) !==
    settlementCurrency(s.currency, rate)
  )
    throw new Error('Escolhe uma carteira da moeda de contabilização.');
  const next = addHomeEntry(data, {
    ...converted,
    type: s.type,
    title: s.title,
    date: options?.date ?? o.due,
    category: s.category,
    accountId,
    billId: o.billId,
    billMonth: o.due.slice(0, 7),
    occurrenceId: o.id,
  });
  return {
    ...next,
    occurrences: next.occurrences!.map((item) =>
      item.id === id
        ? {
            ...item,
            state: 'accepted' as const,
            entryId: next.entries[0].id,
            settledAt: new Date().toISOString(),
            error: undefined,
          }
        : item,
    ),
  };
}
export function processHomeRecurrences(
  data: HomeData,
  today = todayLocal(),
): HomeData {
  let next = data;
  for (const b of data.bills) {
    if (
      !b.active ||
      b.deletedAt ||
      !b.recurrence ||
      b.recurrence.frequency === 'none'
    )
      continue;
    for (const due of scheduledDates(b, today)) {
      const id = `${b.id}:${due}`;
      if (
        (b.generateAfter && due <= b.generateAfter) ||
        next.occurrences?.some((o) => o.id === id)
      )
        continue;
      const occurrence = occurrenceSnapshot(b, due);
      next = {
        ...next,
        occurrences: [...(next.occurrences ?? []), occurrence],
      };
      if (b.accountingMode === 'automatic') {
        try {
          next = settleHomeOccurrence(next, id, 'accept');
        } catch (e) {
          next = {
            ...next,
            occurrences: next.occurrences!.map((o) =>
              o.id === id
                ? {
                    ...o,
                    error:
                      e instanceof Error
                        ? e.message
                        : 'Não foi possível contabilizar.',
                  }
                : o,
            ),
          };
        }
      }
    }
  }
  return next;
}
