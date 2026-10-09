import {
  HomeData,
  HomeDebt,
  HomeDebtPayment,
  HomePlan,
  HomeStatementRow,
  HomeTask,
  HomeDocument,
} from '../types/home';
import {
  accountCurrency,
  addHomeEntry,
  balances,
  effectiveEntries,
  money,
  text,
  todayLocal,
  validDate,
  validateHomeData,
  dueDate,
} from './home';
import { createId } from './ids';
import { homeAuditEdit } from './homeEditing';
import { scheduledDates } from './homeRecurrence';

export function debtRemaining(data: HomeData, id: string) {
  const debt = data.debts?.find((d) => d.id === id);
  if (!debt) throw new Error('Dívida inexistente.');
  const active = new Set(effectiveEntries(data).map((e) => e.id));
  return money(
    (Math.round(debt.principal * 100) -
      (data.debtPayments ?? [])
        .filter((p) => p.debtId === id && active.has(p.entryId))
        .reduce((s, p) => s + Math.round(p.amount * 100), 0)) /
      100,
    false,
  );
}
export function saveHomeDebt(data: HomeData, input: HomeDebt) {
  const old = data.debts?.find((d) => d.id === input.id);
  if (
    old &&
    (old.currency !== input.currency || old.type !== input.type) &&
    data.debtPayments?.some((p) => p.debtId === old.id)
  )
    throw new Error('Uma dívida com pagamentos mantém o tipo e a moeda.');
  return validateHomeData({
    ...data,
    debts: old
      ? data.debts!.map((d) =>
          d.id === input.id ? homeAuditEdit(d, { ...d, ...input }) : d,
        )
      : [...(data.debts ?? []), input],
  });
}
export function payHomeDebt(
  data: HomeData,
  id: string,
  accountId: string,
  amount: number,
  date: string,
) {
  const debt = data.debts?.find((d) => d.id === id && !d.deletedAt);
  if (!debt) throw new Error('Dívida indisponível.');
  money(amount);
  if (amount > debtRemaining(data, id))
    throw new Error('O pagamento excede o saldo da dívida.');
  if (
    accountCurrency(data.accounts.find((a) => a.id === accountId)) !==
    debt.currency
  )
    throw new Error('Escolhe uma carteira da mesma moeda.');
  const paymentId = createId('home-debt-payment');
  const next = addHomeEntry(data, {
    type: debt.type === 'payable' ? 'debt_out' : 'debt_in',
    title: `${debt.type === 'payable' ? 'Pagamento' : 'Recebimento'}: ${debt.title}`,
    amount,
    date,
    category: 'Amortização de dívidas',
    accountId,
    debtId: id,
    debtPaymentId: paymentId,
  });
  const payment: HomeDebtPayment = {
    id: paymentId,
    debtId: id,
    entryId: next.entries[0].id,
    amount,
    date,
  };
  return validateHomeData({
    ...next,
    debtPayments: [...(data.debtPayments ?? []), payment],
  });
}
export function debtInstallments(data: HomeData, debt: HomeDebt) {
  const count = debt.installmentCount;
  const total = Math.round(debt.principal * 100);
  const active = new Set(effectiveEntries(data).map((e) => e.id));
  let paid = Math.round(
    (data.debtPayments ?? [])
      .filter((p) => p.debtId === debt.id && active.has(p.entryId))
      .reduce((s, p) => s + p.amount, 0) * 100,
  );
  return Array.from({ length: count }, (_, i) => {
    const base = Math.floor(total / count) + (i < total % count ? 1 : 0);
    const covered = Math.min(base, paid);
    paid -= covered;
    const anchor = debt.firstInstallment || debt.dueDate;
    let date = anchor;
    if (count > 1 && anchor) {
      const d = new Date(anchor + 'T12:00:00Z');
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() + i);
      date = dueDate(d.toISOString().slice(0, 7), Number(anchor.slice(8)));
    }
    return {
      number: i + 1,
      date,
      amount: base / 100,
      remaining: (base - covered) / 100,
    };
  });
}
export function saveHomePlan(data: HomeData, input: HomePlan) {
  const old = data.plans?.find((p) => p.id === input.id);
  return validateHomeData({
    ...data,
    plans: old
      ? data.plans!.map((p) =>
          p.id === input.id ? homeAuditEdit(p, { ...p, ...input }) : p,
        )
      : [...(data.plans ?? []), input],
  });
}
export function completeHomeTask(
  data: HomeData,
  id: string,
  date: string,
  done: boolean,
) {
  const task = data.tasks.find((t) => t.id === id && !t.deletedAt);
  if (!task || !validDate(date)) throw new Error('Tarefa ou data inválida.');
  if (!taskDates(task, date).includes(date))
    throw new Error('A data não pertence a uma ocorrência desta tarefa.');
  const dates = new Set(task.completedDates ?? (task.done ? [task.date] : []));
  done ? dates.add(date) : dates.delete(date);
  return validateHomeData({
    ...data,
    tasks: data.tasks.map((t) =>
      t.id === id
        ? homeAuditEdit(t, {
            ...t,
            done: dates.has(t.date),
            completedDates: [...dates].sort(),
          })
        : t,
    ),
  });
}
export function taskDates(task: HomeTask, through: string): string[] {
  if (!task.recurrence || task.recurrence.frequency === 'none')
    return task.date <= through ? [task.date] : [];
  return scheduledDates(
    {
      id: task.id,
      title: task.title,
      amount: 1,
      category: task.category,
      day: Number(task.date.slice(8)),
      active: true,
      startDate: task.date,
      recurrence: task.recurrence,
    },
    through,
  );
}
export function entrySignedAmount(e: HomeData['entries'][number]) {
  return ['income', 'debt_in'].includes(e.type) ? e.amount : -e.amount;
}
export function statementEntryMatches(data: HomeData, row: HomeStatementRow) {
  return effectiveEntries(data).filter((e) => {
    const signed =
      e.accountId === row.accountId
        ? entrySignedAmount(e)
        : e.type === 'transfer' && e.destinationId === row.accountId
          ? e.amount
          : undefined;
    return (
      e.date === row.date &&
      signed !== undefined &&
      Math.round(signed * 100) === Math.round(row.amount * 100) &&
      !(data.statementRows ?? []).some(
        (s) =>
          s.state === 'matched' &&
          s.entryId === e.id &&
          s.accountId === row.accountId &&
          s.id !== row.id,
      )
    );
  });
}
export function matchHomeStatement(
  data: HomeData,
  id: string,
  entryId: string,
) {
  const row = data.statementRows?.find(
    (r) => r.id === id && r.state === 'pending',
  );
  if (!row) throw new Error('Linha já tratada.');
  if (!statementEntryMatches(data, row).some((e) => e.id === entryId))
    throw new Error(
      'O valor, data ou carteira não coincidem, ou o lançamento já foi conferido.',
    );
  return validateHomeData({
    ...data,
    statementRows: data.statementRows!.map((r) =>
      r.id === id ? { ...r, state: 'matched', entryId } : r,
    ),
  });
}
export function importStatementEntry(
  data: HomeData,
  id: string,
  category: string,
) {
  const row = data.statementRows?.find(
    (r) => r.id === id && r.state === 'pending',
  );
  if (!row) throw new Error('Linha já tratada.');
  if (
    statementEntryMatches(data, row).length ||
    effectiveEntries(data).some(
      (e) =>
        e.date === row.date &&
        (e.accountId === row.accountId
          ? entrySignedAmount(e)
          : e.type === 'transfer' && e.destinationId === row.accountId
            ? e.amount
            : undefined) === row.amount,
    )
  )
    throw new Error(
      'Há um lançamento com este valor, carteira e data, incluindo os já conferidos. Verifica a correspondência para evitar duplicação; uma operação realmente distinta pode ser registada nas Finanças antes da conferência.',
    );
  const next = addHomeEntry(data, {
    type: row.amount > 0 ? 'income' : 'expense',
    title: row.title,
    amount: Math.abs(row.amount),
    date: row.date,
    accountId: row.accountId,
    category,
    reconciliationId: row.id,
  });
  return matchHomeStatement(next, id, next.entries[0].id);
}
export function validateHomeExtensions(data: HomeData) {
  const debts = data.debts ?? [],
    payments = data.debtPayments ?? [],
    plans = data.plans ?? [],
    rows = data.statementRows ?? [],
    documents = data.documents ?? [];
  for (const arr of [debts, payments, plans, rows, documents])
    if (!Array.isArray(arr) || arr.length > 50000)
      throw new Error('Estrutura Home inválida.');
  const allIds = new Set(
    [
      ...data.accounts,
      ...data.entries,
      ...data.budgets,
      ...data.bills,
      ...data.goals,
      ...data.tasks,
      ...(data.shopping ?? []),
      ...debts,
      ...plans,
      ...documents,
    ].map((r) => r.id),
  );
  for (const p of [...payments, ...rows]) {
    if (
      typeof p.id !== 'string' ||
      !p.id ||
      p.id.length > 300 ||
      allIds.has(p.id)
    )
      throw new Error('Identificador repetido.');
    allIds.add(p.id);
  }
  for (const d of debts) {
    text(d.title);
    text(d.person);
    money(d.principal);
    if (
      !['payable', 'receivable'].includes(d.type) ||
      !['AOA', 'USD'].includes(d.currency) ||
      !validDate(d.issueDate) ||
      (d.dueDate && !validDate(d.dueDate)) ||
      !Number.isInteger(d.installmentCount) ||
      d.installmentCount < 1 ||
      d.installmentCount > 600 ||
      d.principal * 100 < d.installmentCount ||
      (d.firstInstallment && !validDate(d.firstInstallment)) ||
      (d.installmentCount > 1 && !d.firstInstallment)
    )
      throw new Error('Dívida ou prestações inválidas.');
    debtRemaining(data, d.id);
  }
  const linked = new Set<string>();
  for (const p of payments) {
    money(p.amount);
    const d = debts.find((d) => d.id === p.debtId);
    const e = data.entries.find((e) => e.id === p.entryId);
    if (
      !d ||
      !e ||
      linked.has(e.id) ||
      e.debtId !== d.id ||
      e.debtPaymentId !== p.id ||
      e.amount !== p.amount ||
      e.date !== p.date ||
      e.type !== (d.type === 'payable' ? 'debt_out' : 'debt_in') ||
      accountCurrency(data.accounts.find((a) => a.id === e.accountId)) !==
        d.currency
    )
      throw new Error('Pagamento de dívida inválido.');
    linked.add(e.id);
  }
  for (const e of data.entries) {
    if (
      ['debt_in', 'debt_out'].includes(e.type) &&
      !payments.some((p) => p.entryId === e.id)
    )
      throw new Error('Amortização sem pagamento associado.');
    if (e.debtId && !debts.some((d) => d.id === e.debtId))
      throw new Error('Dívida associada inexistente.');
  }
  for (const p of plans) {
    text(p.title);
    text(p.category);
    money(p.amount);
    if (
      !['income', 'expense', 'reserve'].includes(p.type) ||
      !validDate(p.date) ||
      !['AOA', 'USD'].includes(p.currency) ||
      !data.accounts.some(
        (a) => a.id === p.accountId && accountCurrency(a) === p.currency,
      ) ||
      (p.type === 'reserve' &&
        !data.goals.some(
          (g) =>
            g.id === p.goalId &&
            accountCurrency(data.accounts.find((a) => a.id === g.accountId)) ===
              p.currency,
        ))
    )
      throw new Error('Planeamento inválido.');
  }
  for (const t of data.tasks) {
    if (t.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time))
      throw new Error('Horário inválido.');
    if (t.priority && !['low', 'normal', 'high'].includes(t.priority))
      throw new Error('Prioridade inválida.');
    if (
      t.assignee &&
      (typeof t.assignee !== 'string' || t.assignee.length > 100)
    )
      throw new Error('Responsável inválido.');
    if (
      t.completedDates &&
      (!Array.isArray(t.completedDates) ||
        new Set(t.completedDates).size !== t.completedDates.length ||
        t.completedDates.some((d) => !validDate(d)))
    )
      throw new Error('Conclusões inválidas.');
    if (t.recurrence) {
      const r = t.recurrence;
      if (
        ![
          'none',
          'weekly',
          'fortnightly',
          'monthly',
          'yearly',
          'custom',
        ].includes(r.frequency) ||
        !['never', 'date', 'count'].includes(r.end) ||
        (r.frequency === 'custom' &&
          (!Number.isInteger(r.interval) ||
            r.interval! < 1 ||
            r.interval! > 10000 ||
            !['days', 'weeks', 'months'].includes(r.unit!))) ||
        (r.end === 'date' && (!validDate(r.until) || r.until! < t.date)) ||
        (r.end === 'count' &&
          (!Number.isInteger(r.count) || r.count! < 1 || r.count! > 50000))
      )
        throw new Error('Repetição da tarefa inválida.');
    }
  }
  const fingerprints = new Set<string>(),
    matches = new Set<string>();
  for (const r of rows) {
    text(r.title);
    money(Math.abs(r.amount));
    if (
      !validDate(r.date) ||
      !data.accounts.some((a) => a.id === r.accountId) ||
      !['pending', 'matched', 'ignored'].includes(r.state) ||
      typeof r.fingerprint !== 'string' ||
      !r.fingerprint ||
      r.fingerprint.length > 4000 ||
      (r.reference !== undefined &&
        (typeof r.reference !== 'string' || r.reference.length > 300)) ||
      r.date > todayLocal() ||
      fingerprints.has(r.fingerprint) ||
      !r.batchId
    )
      throw new Error('Extrato inválido ou repetido.');
    text(r.batchId);
    fingerprints.add(r.fingerprint);
    if (r.state === 'matched') {
      const e = effectiveEntries(data).find((e) => e.id === r.entryId);
      const signed =
        e &&
        (e.accountId === r.accountId
          ? entrySignedAmount(e)
          : e.destinationId === r.accountId
            ? e.amount
            : undefined);
      const key = `${r.accountId}:${r.entryId}`;
      if (
        !e ||
        matches.has(key) ||
        e.date !== r.date ||
        signed === undefined ||
        Math.round(signed * 100) !== Math.round(r.amount * 100)
      )
        throw new Error('Correspondência de extrato inválida.');
      matches.add(key);
    } else if (r.entryId)
      throw new Error('Extrato não conferido com lançamento.');
  }
  for (const e of data.entries)
    if (e.reconciliationId && !rows.some((r) => r.id === e.reconciliationId))
      throw new Error('Linha de extrato associada inexistente.');
  let fileBytes = 0;
  for (const d of documents) {
    text(d.title);
    text(d.fileName);
    if (
      !['application/pdf', 'image/png', 'image/jpeg'].includes(d.mime) ||
      !Number.isInteger(d.size) ||
      d.size < 1 ||
      d.size > 1024 * 1024 ||
      typeof d.content !== 'string' ||
      !d.content ||
      d.content.length > 1400000 ||
      !/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        d.content,
      ) ||
      !Number.isFinite(Date.parse(d.uploadedAt)) ||
      !['receipt', 'invoice', 'warranty', 'other'].includes(d.kind) ||
      (d.expiresOn && !validDate(d.expiresOn))
    )
      throw new Error('Documento inválido.');
    const raw = atob(d.content);
    if (
      raw.length !== d.size ||
      (d.mime === 'application/pdf' && !raw.startsWith('%PDF-')) ||
      (d.mime === 'image/png' && !raw.startsWith('\x89PNG\r\n\x1a\n')) ||
      (d.mime === 'image/jpeg' &&
        !(
          raw.charCodeAt(0) === 255 &&
          raw.charCodeAt(1) === 216 &&
          raw.charCodeAt(2) === 255
        ))
    )
      throw new Error('Conteúdo do documento inválido.');
    fileBytes += d.size;
    if (d.entityType || d.entityId) {
      const entities =
        d.entityType === 'entry'
          ? data.entries
          : d.entityType === 'shopping'
            ? data.shopping
            : d.entityType === 'debt'
              ? data.debts
              : d.entityType === 'goal'
                ? data.goals
                : undefined;
      if (!entities?.some((e) => e.id === d.entityId))
        throw new Error('Vínculo de documento inválido.');
    }
  }
  if (fileBytes > 2 * 1024 * 1024)
    throw new Error('Os documentos excedem o limite local de 2 MB.');
}
