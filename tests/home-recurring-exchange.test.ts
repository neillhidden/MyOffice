import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HomeBill, HomeData } from '../src/types/home';
import {
  emptyHome,
  validateHomeData,
  balances,
  homeExchange,
  addHomeEntry,
  entryMoneyLabel,
  reverseHomeEntry,
  contributeHomeGoal,
  acquireHomeGoal,
  todayLocal,
} from '../src/utils/home';
import {
  processHomeRecurrences,
  scheduledDates,
  settleHomeOccurrence,
} from '../src/utils/homeRecurrence';
import { deleteHomeEntity, editHomeEntry } from '../src/utils/homeEditing';
const bill = (overrides: Partial<HomeBill> = {}): HomeBill => ({
  id: 'bill',
  title: 'Salário',
  type: 'income',
  currency: 'AOA',
  amount: 100,
  category: 'Salário',
  day: 1,
  active: true,
  startDate: '2026-01-01',
  accountId: 'home-wallet',
  accountingMode: 'ask',
  recurrence: { frequency: 'monthly', end: 'never' },
  ...overrides,
});
const setup = (b = bill()): HomeData => ({ ...emptyHome(), bills: [b] });
test('recurrences cover weekly, fortnightly, yearly and custom dates without month drift', () => {
  assert.deepEqual(
    scheduledDates(
      bill({
        startDate: '2026-01-31',
        recurrence: { frequency: 'monthly', end: 'count', count: 3 },
      }),
      '2026-04-01',
    ),
    ['2026-01-31', '2026-02-28', '2026-03-31'],
  );
  assert.deepEqual(
    scheduledDates(
      bill({
        recurrence: { frequency: 'weekly', end: 'date', until: '2026-01-15' },
      }),
      '2026-02-01',
    ),
    ['2026-01-01', '2026-01-08', '2026-01-15'],
  );
  assert.deepEqual(
    scheduledDates(
      bill({
        recurrence: { frequency: 'fortnightly', end: 'count', count: 2 },
      }),
      '2026-02-01',
    ),
    ['2026-01-01', '2026-01-15'],
  );
  assert.deepEqual(
    scheduledDates(
      bill({
        startDate: '2024-02-29',
        recurrence: { frequency: 'yearly', end: 'count', count: 3 },
      }),
      '2027-01-01',
    ),
    ['2024-02-29', '2025-02-28', '2026-02-28'],
  );
  for (const unit of ['days', 'weeks', 'months'] as const)
    assert.equal(
      scheduledDates(
        bill({
          recurrence: {
            frequency: 'custom',
            end: 'count',
            count: 3,
            interval: 2,
            unit,
          },
        }),
        '2026-12-01',
      ).length,
      3,
    );
});
test('pending confirmations survive reload and accept or ignore exactly once', () => {
  let d = validateHomeData(processHomeRecurrences(setup(), '2026-02-01'));
  assert.equal(d.occurrences!.length, 2);
  assert.equal(d.entries.length, 0);
  d = validateHomeData(JSON.parse(JSON.stringify(d)));
  assert.equal(processHomeRecurrences(d, '2026-02-01'), d);
  d = validateHomeData(settleHomeOccurrence(d, 'bill:2026-01-01', 'accept'));
  d = validateHomeData(settleHomeOccurrence(d, 'bill:2026-02-01', 'ignore'));
  assert.equal(balances(d)['home-wallet'], 100);
  assert.throws(
    () => settleHomeOccurrence(d, 'bill:2026-01-01', 'accept'),
    /tratada/,
  );
  assert.equal(processHomeRecurrences(d, '2026-02-01'), d);
});
test('automatic income catches up once and deleted or reversed occurrences are not regenerated', () => {
  let d = validateHomeData(
    processHomeRecurrences(
      setup(bill({ accountingMode: 'automatic' })),
      '2026-03-01',
    ),
  );
  assert.equal(d.entries.length, 3);
  assert.equal(balances(d)['home-wallet'], 300);
  d = deleteHomeEntity(d, 'entry', d.entries[0].id);
  d = validateHomeData(
    reverseHomeEntry(d, d.entries.find((e) => !e.deletedAt)!.id, 'Correção'),
  );
  assert.equal(processHomeRecurrences(d, '2026-03-01'), d);
  assert.equal(balances(d)['home-wallet'], 100);
});
test('automatic insufficient funds create a pending actionable notification and no debit', () => {
  let d = processHomeRecurrences(
    setup(
      bill({
        type: 'expense',
        category: 'Internet',
        accountingMode: 'automatic',
        recurrence: { frequency: 'monthly', end: 'count', count: 1 },
      }),
    ),
    '2026-01-01',
  );
  d = validateHomeData(d);
  assert.equal(d.entries.length, 0);
  assert.match(d.occurrences![0].error!, /insuficiente/);
  d = addHomeEntry(d, {
    type: 'income',
    title: 'Entrada',
    amount: 100,
    date: '2026-01-01',
    accountId: 'home-wallet',
    category: 'Salário',
  });
  d = validateHomeData(settleHomeOccurrence(d, 'bill:2026-01-01', 'accept'));
  assert.equal(balances(d)['home-wallet'], 0);
});
test('pause and resume skip paused dates; editing preserves pending and paid snapshots', () => {
  let d = processHomeRecurrences(setup(), '2026-01-01');
  d.bills[0] = {
    ...d.bills[0],
    amount: 200,
    title: 'Salário novo',
    generateAfter: '2026-01-10',
  };
  d = processHomeRecurrences(d, '2026-02-01');
  assert.equal(d.occurrences![0].snapshot.amount, 100);
  assert.equal(d.occurrences![1].snapshot.amount, 200);
  d.bills[0] = { ...d.bills[0], active: false };
  assert.equal(processHomeRecurrences(d, '2026-04-01'), d);
  d.bills[0] = { ...d.bills[0], active: true, generateAfter: '2026-04-02' };
  d = processHomeRecurrences(d, '2026-05-01');
  assert.equal(d.occurrences!.length, 3);
  assert.equal(d.occurrences![2].due, '2026-05-01');
});
test('manual nonrecurring bills do not produce notifications automatically', () => {
  const d = setup(bill({ recurrence: { frequency: 'none', end: 'never' } }));
  assert.equal(processHomeRecurrences(d, '2026-02-01'), d);
});
test('backups reject duplicate occurrences, invalid custom intervals and forged accepted references', () => {
  const d = processHomeRecurrences(setup(), '2026-01-01');
  assert.throws(
    () =>
      validateHomeData({
        ...d,
        occurrences: [...d.occurrences!, d.occurrences![0]],
      }),
    /Ocorrência/,
  );
  assert.throws(
    () =>
      validateHomeData({
        ...d,
        bills: [
          bill({
            recurrence: {
              frequency: 'custom',
              end: 'never',
              interval: 0,
              unit: 'days',
            },
          }),
        ],
      }),
    /Intervalo/,
  );
  assert.throws(
    () =>
      validateHomeData({
        ...d,
        occurrences: [
          { ...d.occurrences![0], state: 'accepted', entryId: 'missing' },
        ],
      }),
    /falta/,
  );
});
test('USD original and explicit conversion debit Kz once; no-rate USD leaves Kz unchanged', () => {
  let d = emptyHome();
  d.accounts[0].openingBalance = 50000;
  d.accounts.push({
    id: 'usd',
    name: 'USD',
    currency: 'USD',
    openingBalance: 100,
    kind: 'current',
  });
  d = validateHomeData(
    addHomeEntry(d, {
      ...homeExchange(25, 'USD', 925),
      type: 'expense',
      title: 'Perfume',
      category: 'Roupa',
      date: todayLocal(),
      accountId: 'home-wallet',
    }),
  );
  assert.equal(balances(d)['home-wallet'], 26875);
  assert.equal(d.entries[0].originalAmount, 25);
  assert.match(entryMoneyLabel(d, d.entries[0]), /925/);
  d = validateHomeData(
    addHomeEntry(d, {
      ...homeExchange(2.5, 'USD'),
      type: 'expense',
      title: 'USD',
      category: 'Outros',
      date: todayLocal(),
      accountId: 'usd',
    }),
  );
  assert.equal(balances(d).usd, 97.5);
  assert.equal(balances(d)['home-wallet'], 26875);
  assert.throws(
    () =>
      validateHomeData({
        ...d,
        entries: d.entries.map((e) =>
          e.originalAmount === 25 ? { ...e, amount: 1 } : e,
        ),
      }),
    /convertido/,
  );
  assert.throws(() => homeExchange(25, 'USD', -1), /câmbio/);
});
test('converted entry edits preserve ID and reversal restores the converted amount', () => {
  let d = emptyHome();
  d.accounts[0].openingBalance = 50000;
  d = addHomeEntry(d, {
    ...homeExchange(25, 'USD', 925),
    type: 'expense',
    title: 'Teste',
    category: 'Outros',
    date: todayLocal(),
    accountId: 'home-wallet',
  });
  const id = d.entries[0].id;
  d = editHomeEntry(d, id, {
    ...d.entries[0],
    ...homeExchange(20, 'USD', 925),
  });
  assert.equal(d.entries[0].id, id);
  assert.equal(d.entries[0].originalAmount, 20);
  assert.equal(balances(d)['home-wallet'], 31500);
  d = validateHomeData(reverseHomeEntry(d, id, 'Cancelar'));
  assert.equal(balances(d)['home-wallet'], 50000);
});
test('recurring USD bills use immutable exchange snapshots when future rate changes', () => {
  let d = setup(bill({ currency: 'USD', exchangeRate: 925, amount: 25 }));
  d = processHomeRecurrences(d, '2026-01-01');
  d.bills[0] = { ...d.bills[0], exchangeRate: 1000 };
  d = validateHomeData(settleHomeOccurrence(d, 'bill:2026-01-01', 'accept'));
  assert.equal(d.entries[0].amount, 23125);
  assert.equal(d.entries[0].exchangeRate, 925);
  assert.equal(d.entries[0].originalAmount, 25);
});
test('goals allow no deadline, use saved source, reserve once and preserve converted purchase original', () => {
  let d = emptyHome();
  d.accounts[0].openingBalance = 50000;
  d.accounts.push({
    id: 'reserve',
    name: 'Meta',
    openingBalance: 0,
    kind: 'savings',
    currency: 'AOA',
  });
  d.goals = [
    {
      id: 'dream',
      title: 'Sonho',
      target: 23125,
      deadline: '',
      accountId: 'reserve',
      sourceAccountId: 'home-wallet',
      fundingMode: 'reserve',
      originalAmount: 25,
      originalCurrency: 'USD',
      exchangeRate: 925,
    },
  ];
  d = validateHomeData(contributeHomeGoal(d, 'dream', '', 23125, todayLocal()));
  assert.equal(balances(d)['home-wallet'], 26875);
  assert.equal(balances(d).reserve, 23125);
  d = validateHomeData(acquireHomeGoal(d, 'dream', todayLocal()));
  assert.equal(balances(d)['home-wallet'], 26875);
  assert.equal(d.entries[0].originalAmount, 25);
  assert.equal(balances(d).reserve, 0);
});
test('goal preference defaults on; off contributions only add progress, then on reserves without losing progress', () => {
  let d = emptyHome();
  assert.equal(validateHomeData(d).settings!.reserveGoals, true);
  d.accounts[0].openingBalance = 1000;
  d.accounts.push({
    id: 'reserve',
    name: 'Meta',
    openingBalance: 0,
    kind: 'savings',
    currency: 'AOA',
  });
  d.goals = [
    {
      id: 'dream',
      title: 'Sonho',
      target: 100,
      deadline: '',
      accountId: 'reserve',
      sourceAccountId: 'home-wallet',
      fundingMode: 'plan',
    },
  ];
  d.settings!.reserveGoals = false;
  d = contributeHomeGoal(d, 'dream', '', 10, todayLocal());
  d = contributeHomeGoal(d, 'dream', '', 15, todayLocal());
  assert.equal(d.goals[0].plannedAmount, 25);
  assert.equal(d.entries.length, 0);
  assert.equal(balances(d)['home-wallet'], 1000);
  d.settings!.reserveGoals = true;
  d = validateHomeData(contributeHomeGoal(d, 'dream', '', 20, todayLocal()));
  assert.equal(d.goals[0].plannedAmount, 25);
  assert.equal(balances(d)['home-wallet'], 980);
  assert.equal(balances(d).reserve, 20);
});
