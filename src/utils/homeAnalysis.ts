import { HomeData, HomeCurrency } from '../types/home';
import {
  text,
  money,
  goalAcquired,
  accountCurrency,
  balances,
  dueDate,
  effectiveEntries,
  entryCurrency,
  formatHomeMoney,
  homeExchange,
  todayLocal,
  validDate,
} from './home';
import { scheduledDates } from './homeRecurrence';
import {
  debtInstallments,
  entrySignedAmount,
  taskDates,
} from './homeExtensions';
import { createId } from './ids';
import { homeCategoryName } from './homeCategories';
export interface HomeCalendarEvent {
  id: string;
  date: string;
  title: string;
  kind: 'task' | 'bill' | 'goal' | 'debt' | 'document';
  sourceId: string;
  time?: string;
  done: boolean;
}
export function homeCalendarEvents(
  data: HomeData,
  from: string,
  to: string,
): HomeCalendarEvent[] {
  const events: HomeCalendarEvent[] = [];
  for (const t of data.tasks.filter((t) => !t.deletedAt))
    for (const date of taskDates(t, to).filter((d) => d >= from))
      events.push({
        id: `task:${t.id}:${date}`,
        date,
        title: t.title,
        kind: 'task',
        sourceId: t.id,
        time: t.time,
        done: t.completedDates?.includes(date) ?? (date === t.date && t.done),
      });
  for (const b of data.bills.filter((b) => !b.deletedAt && b.active)) {
    let dates = b.recurrence ? scheduledDates(b, to) : [];
    if (!b.recurrence) {
      for (let m = from.slice(0, 7); m <= to.slice(0, 7); ) {
        dates.push(dueDate(m, b.day));
        const d = new Date(m + '-01T12:00:00Z');
        d.setUTCMonth(d.getUTCMonth() + 1);
        m = d.toISOString().slice(0, 7);
      }
    }
    dates = [
      ...new Set([
        ...dates,
        ...(data.occurrences ?? [])
          .filter((o) => o.billId === b.id)
          .map((o) => o.due),
      ]),
    ];
    for (const date of dates.filter(
      (d) =>
        d >= from &&
        d <= to &&
        (!b.generateAfter ||
          d > b.generateAfter ||
          data.occurrences?.some((o) => o.id === `${b.id}:${d}`)),
    )) {
      const o = data.occurrences?.find((o) => o.id === `${b.id}:${date}`);
      events.push({
        id: `bill:${b.id}:${date}`,
        date,
        title: o?.snapshot.title ?? b.title,
        kind: 'bill',
        sourceId: b.id,
        done: o
          ? o.state !== 'pending'
          : effectiveEntries(data).some(
              (e) => e.billId === b.id && e.billMonth === date.slice(0, 7),
            ),
      });
    }
  }
  for (const g of data.goals.filter(
    (g) => !g.deletedAt && g.deadline >= from && g.deadline <= to,
  ))
    events.push({
      id: `goal:${g.id}`,
      date: g.deadline,
      title: g.title,
      kind: 'goal',
      sourceId: g.id,
      done: goalAcquired(data, g.id),
    });
  for (const d of (data.debts ?? []).filter((d) => !d.deletedAt))
    for (const p of debtInstallments(data, d).filter(
      (p) => p.date >= from && p.date <= to,
    ))
      events.push({
        id: `debt:${d.id}:${p.number}`,
        date: p.date,
        title: `${d.title} · Prestação ${p.number}`,
        kind: 'debt',
        sourceId: d.id,
        done: p.remaining === 0,
      });
  for (const d of (data.documents ?? []).filter(
    (d) =>
      !d.deletedAt && d.expiresOn && d.expiresOn >= from && d.expiresOn <= to,
  ))
    events.push({
      id: `document:${d.id}`,
      date: d.expiresOn!,
      title: `Garantia: ${d.title}`,
      kind: 'document',
      sourceId: d.id,
      done: false,
    });
  return events.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.time ?? '').localeCompare(b.time ?? ''),
  );
}
export interface HomeForecastItem {
  id: string;
  date: string;
  title: string;
  amount: number;
  accountId: string;
  type: 'income' | 'expense' | 'reserve' | 'debt';
  overdue: boolean;
}
export function homeForecast(
  data: HomeData,
  from: string,
  to: string,
  currency: HomeCurrency,
  accountId = 'all',
) {
  if (!validDate(from) || !validDate(to) || to < from)
    throw new Error('Escolhe um intervalo válido.');
  const totals = balances(data);
  const accounts = data.accounts.filter(
    (a) =>
      !a.deletedAt &&
      a.kind === 'current' &&
      accountCurrency(a) === currency &&
      (accountId === 'all' || a.id === accountId),
  );
  const allowed = new Set(accounts.map((a) => a.id));
  const items: HomeForecastItem[] = [];
  for (const b of data.bills.filter((b) => !b.deletedAt && b.active)) {
    let dates = b.recurrence ? scheduledDates(b, to) : [];
    if (!b.recurrence)
      for (let m = from.slice(0, 7); m <= to.slice(0, 7); ) {
        dates.push(dueDate(m, b.day));
        const d = new Date(m + '-01T12:00:00Z');
        d.setUTCMonth(d.getUTCMonth() + 1);
        m = d.toISOString().slice(0, 7);
      }
    dates = [
      ...new Set([
        ...dates,
        ...(data.occurrences ?? [])
          .filter((o) => o.billId === b.id && o.state === 'pending')
          .map((o) => o.due),
      ]),
    ];
    for (const due of dates) {
      const o = data.occurrences?.find((o) => o.id === `${b.id}:${due}`);
      if (
        due > to ||
        (due < from && !o) ||
        (o && o.state !== 'pending') ||
        (b.generateAfter && due <= b.generateAfter && !o) ||
        (!b.recurrence &&
          effectiveEntries(data).some(
            (e) => e.billId === b.id && e.billMonth === due.slice(0, 7),
          ))
      )
        continue;
      const s = o?.snapshot ?? b;
      const id = s.accountId;
      if (!id || !allowed.has(id)) continue;
      const converted = homeExchange(
        s.amount,
        s.currency ?? 'AOA',
        s.exchangeRate,
      );
      if (accountCurrency(data.accounts.find((a) => a.id === id)) !== currency)
        continue;
      const income = (s.type ?? 'expense') === 'income';
      items.push({
        id: `bill:${b.id}:${due}`,
        date: due < from ? from : due,
        title: `${due < from ? 'Em atraso: ' : ''}${s.title}`,
        amount: income ? converted.amount : -converted.amount,
        accountId: id,
        type: income ? 'income' : 'expense',
        overdue: due < from,
      });
    }
  }
  for (const d of (data.debts ?? []).filter(
    (d) => !d.deletedAt && d.currency === currency,
  )) {
    // Debt forecasts need an explicitly chosen wallet; unknown allocations are shown separately.
    if (accountId !== 'all' && allowed.has(accountId))
      for (const p of debtInstallments(data, d).filter(
        (p) => p.remaining > 0 && p.date && p.date <= to,
      ))
        items.push({
          id: `debt:${d.id}:${p.number}`,
          date: p.date < from ? from : p.date,
          title: `${d.title} · Prestação ${p.number}`,
          amount: d.type === 'receivable' ? p.remaining : -p.remaining,
          accountId,
          type: 'debt',
          overdue: p.date < from,
        });
  }
  for (const p of (data.plans ?? []).filter(
    (p) =>
      !p.deletedAt &&
      p.currency === currency &&
      p.date >= from &&
      p.date <= to &&
      allowed.has(p.accountId),
  ))
    items.push({
      id: `plan:${p.id}`,
      date: p.date,
      title: p.title,
      amount: p.type === 'income' ? p.amount : -p.amount,
      accountId: p.accountId,
      type: p.type,
      overdue: false,
    });
  items.sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  let balance =
    Math.round(accounts.reduce((s, a) => s + totals[a.id], 0) * 100) / 100;
  const opening = balance;
  const steps = items.map((i) => {
    balance = Math.round((balance + i.amount) * 100) / 100;
    return { ...i, balance };
  });
  return {
    opening,
    closing: balance,
    steps,
    unallocatedBills: data.bills.filter(
      (b) => b.active && !b.deletedAt && !b.accountId,
    ).length,
    unallocatedDebts:
      accountId === 'all'
        ? (data.debts ?? []).filter(
            (d) =>
              !d.deletedAt &&
              d.currency === currency &&
              debtInstallments(data, d).some(
                (p) => p.remaining > 0 && p.date && p.date <= to,
              ),
          ).length
        : 0,
  };
}
export function homeReport(
  data: HomeData,
  from: string,
  to: string,
  currency: HomeCurrency,
  accountId = 'all',
) {
  const entries = effectiveEntries(data)
    .filter(
      (e) =>
        e.date >= from &&
        e.date <= to &&
        entryCurrency(data, e) === currency &&
        (accountId === 'all' ||
          e.accountId === accountId ||
          e.destinationId === accountId),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const income = entries
      .filter((e) => e.type === 'income')
      .reduce((s, e) => s + e.amount, 0),
    expense = entries
      .filter((e) => e.type === 'expense')
      .reduce((s, e) => s + e.amount, 0);
  const monthly = new Map<
    string,
    {
      month: string;
      income: number;
      expense: number;
      debtIn: number;
      debtOut: number;
    }
  >();
  const categories = new Map<string, number>();
  for (const e of entries) {
    const key = e.date.slice(0, 7);
    const row = monthly.get(key) ?? {
      month: key,
      income: 0,
      expense: 0,
      debtIn: 0,
      debtOut: 0,
    };
    if (e.type === 'income') row.income += e.amount;
    if (e.type === 'expense') {
      row.expense += e.amount;
      categories.set(e.category, (categories.get(e.category) ?? 0) + e.amount);
    }
    if (e.type === 'debt_in') row.debtIn += e.amount;
    if (e.type === 'debt_out') row.debtOut += e.amount;
    monthly.set(key, row);
  }
  return {
    entries,
    income,
    expense,
    net: income - expense,
    monthly: [...monthly.values()],
    categories: [...categories].map(([category, amount]) => ({
      category,
      amount,
    })),
  };
}
const csvCell = (v: unknown) => {
  let s = String(v ?? '');
  if (/^\s*[=+@\-]|^[\t\r\n]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
};
export function reportCsv(
  data: HomeData,
  from: string,
  to: string,
  currency: HomeCurrency,
  accountId = 'all',
) {
  const r = homeReport(data, from, to, currency, accountId);
  const headers = [
    'Data',
    'Descrição',
    'Tipo',
    'Categoria',
    'Carteira',
    'Destino',
    'Valor contabilizado',
    'Moeda contabilizada',
    'Valor original',
    'Moeda original',
    'Câmbio',
  ];
  const kinds = {
    income: 'Rendimento',
    expense: 'Despesa',
    transfer: 'Transferência',
    debt_in: 'Amortização recebida',
    debt_out: 'Amortização paga',
    reversal: 'Estorno',
  };
  const rows = r.entries.map((e) => [
    e.date.split('-').reverse().join('/'),
    e.title,
    kinds[e.type],
    homeCategoryName(
      data,
      e.category,
      undefined,
      e.type === 'income' ? 'income' : 'expense',
    ),
    data.accounts.find((a) => a.id === e.accountId)?.name,
    data.accounts.find((a) => a.id === e.destinationId)?.name,
    (accountId === e.destinationId ? e.amount : entrySignedAmount(e))
      .toFixed(2)
      .replace('.', ','),
    currency,
    (e.originalAmount ?? e.amount).toFixed(2).replace('.', ','),
    e.originalCurrency ?? currency,
    e.exchangeRate?.toString().replace('.', ','),
  ]);
  return (
    '\ufeff' +
    [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')
  );
}
/** Minimal multi-page PDF, using built-in Helvetica/WinAnsi for Portuguese text. */
export function reportPdf(
  data: HomeData,
  from: string,
  to: string,
  currency: HomeCurrency,
  accountId = 'all',
): Uint8Array {
  const r = homeReport(data, from, to, currency, accountId);
  const kinds = {
    income: 'Rendimento',
    expense: 'Despesa',
    transfer: 'Transferência',
    debt_in: 'Amortização recebida',
    debt_out: 'Amortização paga',
    reversal: 'Estorno',
  };
  const lines = [
    `MyOffice Home - ${data.name}`,
    `Relatório: ${from.split('-').reverse().join('/')} a ${to.split('-').reverse().join('/')} - ${currency}`,
    `Carteira: ${accountId === 'all' ? 'Todas' : (data.accounts.find((a) => a.id === accountId)?.name ?? accountId)}`,
    `Rendimentos: ${formatHomeMoney(r.income, currency)} | Despesas: ${formatHomeMoney(r.expense, currency)}`,
    `Resultado: ${formatHomeMoney(r.net, currency)}`,
    'Despesas por categoria:',
    ...r.categories.map(
      (c) =>
        `${homeCategoryName(data, c.category).slice(0, 60)}: ${formatHomeMoney(c.amount, currency)}`,
    ),
    '',
    'Movimentos efetivos:',
    ...r.entries.flatMap((e) => [
      `${e.date.split('-').reverse().join('/')}  ${kinds[e.type]}  ${formatHomeMoney(accountId === e.destinationId ? e.amount : entrySignedAmount(e), currency)}`,
      `  ${e.title.slice(0, 75)} - ${data.accounts.find((a) => a.id === e.accountId)?.name.slice(0, 25) ?? ''}`,
    ]),
  ];
  const wrapped = lines.flatMap((line) => line.match(/.{1,52}/g) ?? ['']);
  const chunks = Array.from(
    { length: Math.max(1, Math.ceil(wrapped.length / 45)) },
    (_, i) => wrapped.slice(i * 45, (i + 1) * 45),
  );
  const objects: string[] = [];
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Count ${chunks.length} /Kids [${chunks.map((_, i) => `${4 + i * 2} 0 R`).join(' ')}] >>`;
  objects[2] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  const pdfText = (s: string) =>
    s
      .replace(/[\u00a0\u202f]/g, ' ')
      .replace(/[^\x20-\xff]/g, '?')
      .replaceAll('\\', '\\\\')
      .replaceAll('(', '\\(')
      .replaceAll(')', '\\)');
  chunks.forEach((chunk, i) => {
    const stream = `BT /F1 10 Tf 45 795 Td 16 TL ${chunk.map((line, j) => `${j ? 'T* ' : ''}(${pdfText(line)}) Tj`).join('\n')} ET`;
    objects[3 + i * 2] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`;
    objects[4 + i * 2] =
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  let out = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => String(n).padStart(10, '0') + ' 00000 n ')
    .join(
      '\n',
    )}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Uint8Array.from(out, (c) => c.charCodeAt(0));
}
export function parseStatementCsv(content: string, accountId: string) {
  if (content.length > 2e6) throw new Error('O extrato excede 2 MB.');
  const first = content.replace(/^\ufeff/, '').split(/\r?\n/)[0];
  const delimiter = first.includes(';')
    ? ';'
    : first.includes('\t')
      ? '\t'
      : ',';
  const table: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === '"') {
      if (quoted && content[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === delimiter && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && content[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c.trim())) table.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('Aspas incompletas no CSV.');
  row.push(cell);
  if (row.some((c) => c.trim())) table.push(row);
  if (table.length < 2 || table.length > 1001)
    throw new Error('Importa entre 1 e 1000 movimentos.');
  const norm = (s: string) =>
    s
      .replace(/^\ufeff/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  const h = table[0].map(norm);
  const dateIndex = h.findIndex((s) => ['data', 'date'].includes(s)),
    titleIndex = h.findIndex((s) =>
      ['descricao', 'description', 'historico'].includes(s),
    ),
    amountIndex = h.findIndex((s) =>
      ['valor', 'amount', 'montante'].includes(s),
    ),
    refIndex = h.findIndex((s) =>
      ['referencia', 'reference', 'id'].includes(s),
    );
  if (dateIndex < 0 || titleIndex < 0 || amountIndex < 0)
    throw new Error(
      'O CSV precisa das colunas Data, Descrição e Valor. Valores negativos são saídas.',
    );
  const batchId = createId('home-statement-batch');
  const repeated = new Map<string, number>();
  return table.slice(1).map((r, i) => {
    let date = r[dateIndex]?.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date))
      date = date.split('/').reverse().join('-');
    if (!validDate(date) || date > todayLocal())
      throw new Error(`Data inválida na linha ${i + 2}.`);
    const title = r[titleIndex]?.trim();
    if (!title) throw new Error(`Descrição em falta na linha ${i + 2}.`);
    text(title);
    let value = (r[amountIndex] ?? '').trim().replace(/[\s\u00a0]/g, '');
    if (value.includes(','))
      value = value.replaceAll('.', '').replace(',', '.');
    if (!/^-?\d+(\.\d{1,2})?$/.test(value))
      throw new Error(`Valor inválido na linha ${i + 2}.`);
    const amount = Number(value);
    if (!amount) throw new Error(`Valor zero na linha ${i + 2}.`);
    money(Math.abs(amount));
    const reference = refIndex < 0 ? '' : (r[refIndex]?.trim() ?? '');
    if (reference.length > 300)
      throw new Error(`Referência demasiado longa na linha ${i + 2}.`);
    const key = JSON.stringify([accountId, date, title, amount, reference]);
    const index = (repeated.get(key) ?? 0) + 1;
    repeated.set(key, index);
    return {
      id: createId('home-statement'),
      accountId,
      date,
      title,
      amount,
      reference: reference || undefined,
      fingerprint: `${key}:${index}`,
      batchId,
      state: 'pending' as const,
    };
  });
}
