import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyHome,
  addHomeEntry,
  balances,
  reverseHomeEntry,
  validateHomeData,
  todayLocal,
} from '../src/utils/home';
import { HomeDebt, HomeDocument } from '../src/types/home';
import {
  completeHomeTask,
  debtInstallments,
  debtRemaining,
  saveHomeDebt,
  payHomeDebt,
  matchHomeStatement,
  statementEntryMatches,
  importStatementEntry,
  saveHomePlan,
} from '../src/utils/homeExtensions';
import {
  homeCalendarEvents,
  homeForecast,
  homeReport,
  parseStatementCsv,
  reportCsv,
  reportPdf,
} from '../src/utils/homeAnalysis';
import {
  editHomeEntry,
  deleteHomeEntity,
  restoreHomeEntity,
  homeAuditEdit,
} from '../src/utils/homeEditing';
import {
  deleteHomeCategory,
  homeCategoryUsage,
} from '../src/utils/homeCategories';
const today = todayLocal();
function fixture() {
  const d = emptyHome();
  d.accounts[0].openingBalance = 100;
  return validateHomeData(d);
}
const debt: HomeDebt = {
  id: 'debt',
  title: 'Consola',
  person: 'Loja',
  type: 'payable',
  principal: 10,
  currency: 'AOA',
  issueDate: '2026-01-31',
  dueDate: '2026-03-31',
  installmentCount: 3,
  firstInstallment: '2026-01-31',
};
const expense = {
  type: 'expense' as const,
  title: 'Compra',
  amount: 5,
  date: today,
  category: 'Alimentação',
  accountId: 'home-wallet',
};
test('debt installments conserve cents and anchor month ends; payments affect cash without duplicating consumption', () => {
  let d = saveHomeDebt(fixture(), debt);
  assert.equal(balances(d)['home-wallet'], 100);
  assert.deepEqual(
    debtInstallments(d, debt).map((p) => [p.date, p.amount]),
    [
      ['2026-01-31', 3.34],
      ['2026-02-28', 3.33],
      ['2026-03-31', 3.33],
    ],
  );
  d = payHomeDebt(d, 'debt', 'home-wallet', 4, today);
  assert.equal(balances(d)['home-wallet'], 96);
  assert.equal(debtRemaining(d, 'debt'), 6);
  assert.deepEqual(
    debtInstallments(d, debt).map((p) => p.remaining),
    [0, 2.67, 3.33],
  );
  assert.equal(homeReport(d, today, today, 'AOA').expense, 0);
  assert.equal(homeReport(d, today, today, 'AOA').monthly[0].debtOut, 4);
  assert.throws(
    () => payHomeDebt(d, 'debt', 'home-wallet', 7, today),
    /excede/,
  );
  d = validateHomeData(reverseHomeEntry(d, d.entries[0].id, 'Correção'));
  assert.equal(balances(d)['home-wallet'], 100);
  assert.equal(debtRemaining(d, 'debt'), 10);
  assert.throws(() => deleteHomeEntity(d, 'debt', 'debt'), /histórico/);
});
test('debt payments reject wrong currency, insufficient funds and forged links atomically', () => {
  let d = fixture();
  d.accounts.push({
    id: 'usd',
    name: 'USD',
    currency: 'USD',
    kind: 'current',
    openingBalance: 100,
  });
  d = saveHomeDebt(d, { ...debt, principal: 101 });
  const before = structuredClone(d);
  assert.throws(() => payHomeDebt(d, 'debt', 'usd', 1, today), /moeda/);
  assert.throws(
    () => payHomeDebt(d, 'debt', 'home-wallet', 101, today),
    /saldo/,
  );
  assert.deepEqual(d, before);
  const paid = payHomeDebt(d, 'debt', 'home-wallet', 1, today);
  assert.throws(
    () => validateHomeData({ ...paid, debtPayments: [] }),
    /associado/,
  );
  assert.throws(
    () => saveHomeDebt(paid, { ...debt, type: 'receivable' }),
    /mantém/,
  );
});
test('restore revisions recalculates cash and protects dependent spending and budget uniqueness', () => {
  let d = addHomeEntry(fixture(), expense);
  const id = d.entries[0].id;
  d = editHomeEntry(d, id, { ...d.entries[0], amount: 20 });
  d = restoreHomeEntity(d, 'entry', id, 0);
  assert.equal(balances(d)['home-wallet'], 95);
  assert.equal(d.entries[0].id, id);
  assert.equal(d.entries[0].edits!.length, 2);
  d = deleteHomeEntity(d, 'entry', id);
  d = addHomeEntry(d, { ...expense, amount: 98 });
  assert.throws(() => restoreHomeEntity(d, 'entry', id), /saldo/);
  d.budgets = [
    { id: 'b1', category: 'Alimentação', month: '2026-10', limit: 10 },
  ];
  d = deleteHomeEntity(d, 'budget', 'b1');
  d.budgets.push({
    id: 'b2',
    category: 'Alimentação',
    month: '2026-10',
    limit: 20,
  });
  assert.throws(() => restoreHomeEntity(d, 'budget', 'b1'), /limite|repetido/);
});
test('task repetitions integrate the calendar and preserve independent completion, bills, goals and warranties', () => {
  let d = fixture();
  d.tasks = [
    {
      id: 't',
      title: 'Limpar',
      category: 'Casa',
      date: '2026-01-31',
      done: false,
      time: '08:30',
      priority: 'high',
      assignee: 'Ana',
      recurrence: { frequency: 'monthly', end: 'count', count: 3 },
    },
  ];
  d = completeHomeTask(d, 't', '2026-02-28', true);
  let events = homeCalendarEvents(d, '2026-01-01', '2026-03-31');
  assert.deepEqual(
    events.map((e) => [e.date, e.done, e.time]),
    [
      ['2026-01-31', false, '08:30'],
      ['2026-02-28', true, '08:30'],
      ['2026-03-31', false, '08:30'],
    ],
  );
  d = completeHomeTask(d, 't', '2026-02-28', false);
  assert.equal(
    homeCalendarEvents(d, '2026-02-01', '2026-02-28')[0].done,
    false,
  );
  assert.throws(
    () =>
      validateHomeData({
        ...d,
        tasks: [
          {
            ...d.tasks[0],
            recurrence: {
              frequency: 'custom',
              interval: 0,
              unit: 'days',
              end: 'never',
            },
          },
        ],
      }),
    /Repetição/,
  );
  d = saveHomeDebt(d, debt);
  d.bills = [
    {
      id: 'bill',
      title: 'Internet',
      day: 15,
      amount: 10,
      category: 'Internet',
      active: true,
    },
  ];
  events = homeCalendarEvents(d, '2026-02-01', '2026-02-28');
  assert.ok(events.some((e) => e.kind === 'bill'));
  assert.ok(events.some((e) => e.kind === 'debt'));
});
test('forecast separates currency and reserves, includes pending obligations and leaves actual balances untouched', () => {
  let d = fixture();
  d = saveHomePlan(d, {
    id: 'p',
    title: 'Previsto',
    type: 'expense',
    amount: 30,
    currency: 'AOA',
    date: today,
    accountId: 'home-wallet',
    category: 'Alimentação',
  });
  d = saveHomeDebt(d, debt);
  const before = structuredClone(d);
  const all = homeForecast(d, today, today, 'AOA');
  assert.equal(all.opening, 100);
  assert.equal(all.closing, 70);
  assert.equal(all.unallocatedDebts, 1);
  const wallet = homeForecast(d, today, today, 'AOA', 'home-wallet');
  assert.equal(wallet.closing, 60);
  assert.equal(wallet.steps.filter((s) => s.overdue).length, 3);
  assert.deepEqual(d, before);
  assert.equal(homeForecast(d, today, today, 'USD').opening, 0);
  const category = d.categoryCatalog!.find(
    (c) => c.key === 'Alimentação' && !c.parentId,
  )!;
  assert.equal(homeCategoryUsage(d, category.id).planos, 1);
  assert.throws(
    () => deleteHomeCategory(d, category.id),
    /uso|utilizada|registos/,
  );
});
test('CSV preview parses Portuguese amounts, quotes and dates and fingerprints retain identical legitimate rows', () => {
  const text = `Data;Descrição;Valor;Referência\n${today};"Loja; pão";-1.234,50;x\n${today};"Loja; pão";-1.234,50;x`;
  const rows = parseStatementCsv(text, 'home-wallet');
  assert.equal(rows[0].amount, -1234.5);
  assert.equal(rows[0].title, 'Loja; pão');
  assert.notEqual(rows[0].fingerprint, rows[1].fingerprint);
  assert.deepEqual(
    parseStatementCsv(text, 'home-wallet').map((r) => r.fingerprint),
    rows.map((r) => r.fingerprint),
  );
  assert.throws(
    () =>
      parseStatementCsv(
        'Data;Descrição;Valor\n2026-02-31;Erro;1',
        'home-wallet',
      ),
    /Data inválida/,
  );
  assert.throws(
    () =>
      parseStatementCsv(
        `Data;Descrição;Valor\n${today};Erro;1,234`,
        'home-wallet',
      ),
    /Valor inválido/,
  );
});
test('statement matching prevents duplicate ledger entries and reopens on edits, deletion and reversal', () => {
  let d = addHomeEntry(fixture(), expense);
  const id = d.entries[0].id;
  d.statementRows = parseStatementCsv(
    `Data;Descrição;Valor\n${today};Compra;-5`,
    'home-wallet',
  );
  const row = d.statementRows[0];
  assert.equal(statementEntryMatches(d, row).length, 1);
  assert.throws(
    () => importStatementEntry(d, row.id, 'Alimentação'),
    /correspondência/,
  );
  d = matchHomeStatement(d, row.id, id);
  assert.equal(balances(d)['home-wallet'], 95);
  d = editHomeEntry(d, id, { ...d.entries[0], amount: 6 });
  assert.equal(d.statementRows![0].state, 'pending');
  assert.equal(d.statementRows![0].entryId, undefined);
  d = editHomeEntry(d, id, { ...d.entries[0], amount: 5 });
  d = matchHomeStatement(d, row.id, id);
  d = deleteHomeEntity(d, 'entry', id);
  assert.equal(d.statementRows![0].state, 'pending');
  d = restoreHomeEntity(d, 'entry', id);
  d = matchHomeStatement(d, row.id, id);
  d = validateHomeData(reverseHomeEntry(d, id, 'Erro'));
  assert.equal(d.statementRows![0].state, 'pending');
});
test('statement creation links exactly one entry; transfer destination matches without fabricating income', () => {
  let d = fixture();
  d.statementRows = parseStatementCsv(
    `Data;Descrição;Valor\n${today};Saída;-5`,
    'home-wallet',
  );
  d = importStatementEntry(d, d.statementRows[0].id, 'Alimentação');
  assert.equal(d.entries.length, 1);
  assert.equal(d.statementRows![0].entryId, d.entries[0].id);
  assert.throws(
    () => importStatementEntry(d, d.statementRows![0].id, 'Alimentação'),
    /tratada/,
  );
  d.accounts.push({
    id: 'second',
    name: 'Outra',
    kind: 'current',
    openingBalance: 0,
  });
  d = addHomeEntry(d, {
    ...expense,
    type: 'transfer',
    destinationId: 'second',
  });
  const row = parseStatementCsv(
    `Data;Descrição;Valor\n${today};Transferência;5`,
    'second',
  )[0];
  d.statementRows!.push(row);
  assert.equal(statementEntryMatches(d, row)[0].type, 'transfer');
  d = matchHomeStatement(d, row.id, d.entries[0].id);
  assert.equal(homeReport(d, today, today, 'AOA').income, 0);
});
const document: HomeDocument = {
  id: 'doc',
  title: 'Fatura',
  fileName: 'fatura.pdf',
  mime: 'application/pdf',
  size: 9,
  content: btoa('%PDF-1.4\n'),
  uploadedAt: new Date().toISOString(),
  kind: 'invoice',
};
test('documents survive backup and recovery; reject disguised files, oversized contents and unknown links', () => {
  let d = validateHomeData({ ...fixture(), documents: [document] });
  assert.deepEqual(validateHomeData(JSON.parse(JSON.stringify(d))), d);
  assert.throws(
    () =>
      validateHomeData({
        ...d,
        documents: [{ ...document, mime: 'image/png' }],
      }),
    /Conteúdo/,
  );
  assert.throws(
    () =>
      validateHomeData({
        ...d,
        documents: [{ ...document, size: 1024 * 1024 + 1 }],
      }),
    /Documento/,
  );
  assert.throws(
    () =>
      validateHomeData({
        ...d,
        documents: [{ ...document, entityType: 'debt', entityId: 'missing' }],
      }),
    /Vínculo/,
  );
  d.documents![0] = homeAuditEdit(d.documents![0], {
    ...d.documents![0],
    title: 'Outra',
  });
  assert.equal(d.documents![0].edits![0].before.content, undefined);
  d = restoreHomeEntity(d, 'document', 'doc', 0);
  assert.equal(d.documents![0].title, 'Fatura');
  assert.equal(d.documents![0].content, document.content);
  d = deleteHomeEntity(d, 'document', 'doc');
  d = restoreHomeEntity(d, 'document', 'doc');
  assert.equal(d.documents![0].deletedAt, undefined);
});
test('CSV reports neutralize spreadsheet formulas and PDF contains valid offsets and multiple pages', () => {
  let d = fixture();
  for (let i = 0; i < 50; i++)
    d = addHomeEntry(d, {
      ...expense,
      type: 'income',
      title: i === 0 ? '=HYPERLINK("evil")' : 'Salário português',
      amount: 1,
    });
  const csv = reportCsv(d, today, today, 'AOA');
  assert.ok(csv.includes("'=HYPERLINK"));
  const bytes = reportPdf(d, today, today, 'AOA');
  const pdf = Buffer.from(bytes).toString('latin1');
  assert.ok(pdf.startsWith('%PDF-1.4'));
  assert.match(pdf, /\/Count 3/);
  const xref = Number(pdf.match(/startxref\n(\d+)/)![1]);
  assert.equal(pdf.slice(xref, xref + 4), 'xref');
  const offsets = [...pdf.slice(xref).matchAll(/(\d{10}) 00000 n/g)].map((m) =>
    Number(m[1]),
  );
  offsets.forEach((off, i) =>
    assert.ok(pdf.slice(off).startsWith(`${i + 1} 0 obj`)),
  );
  assert.ok(pdf.includes('português'));
});

test('receivable repayments cannot be reversed after their money was spent', () => {
  let d = saveHomeDebt(fixture(), { ...debt, type: 'receivable' });
  d = payHomeDebt(d, 'debt', 'home-wallet', 10, today);
  const receipt = d.entries[0].id;
  assert.equal(balances(d)['home-wallet'], 110);
  assert.equal(debtRemaining(d, 'debt'), 0);
  d = addHomeEntry(d, { ...expense, amount: 105 });
  const before = structuredClone(d);
  assert.throws(() => reverseHomeEntry(d, receipt, 'Correção'), /saldo/);
  assert.deepEqual(d, before);
  assert.equal(homeReport(d, today, today, 'AOA').income, 0);
});
test('document total quota includes logically deleted files and invalid task occurrence dates are refused', () => {
  const raw = '%PDF-1.4\n' + 'x'.repeat(800000);
  const documents = Array.from({ length: 3 }, (_, i) => ({
    ...document,
    id: 'quota' + i,
    size: raw.length,
    content: btoa(raw),
    deletedAt: i === 0 ? new Date().toISOString() : undefined,
  }));
  assert.throws(
    () => validateHomeData({ ...fixture(), documents }),
    /limite local/,
  );
  const d = fixture();
  d.tasks = [
    {
      id: 'once',
      title: 'Uma tarefa',
      date: today,
      category: 'Casa',
      done: false,
    },
  ];
  const wrong = new Date(Date.parse(today) + 86400000)
    .toISOString()
    .slice(0, 10);
  assert.throws(() => completeHomeTask(d, 'once', wrong, true), /ocorrência/);
});
