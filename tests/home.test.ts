import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addHomeEntry,
  balances,
  billPaid,
  dueDate,
  effectiveEntries,
  emptyHome,
  reverseHomeEntry,
  todayLocal,
  validateHomeData,
} from '../src/utils/home';
import { HomeData } from '../src/types/home';
const entry = (overrides = {}) => ({
  type: 'income' as const,
  title: 'Salário',
  category: 'Salário',
  accountId: 'home-wallet',
  amount: 1000,
  date: todayLocal(),
  ...overrides,
});

test('personal transfers reserve money without becoming an expense or creating money', () => {
  let d = emptyHome();
  d.accounts.push({
    id: 'reserve',
    name: 'Férias',
    kind: 'savings',
    openingBalance: 0,
  });
  d = addHomeEntry(d, entry());
  d = addHomeEntry(
    d,
    entry({
      type: 'transfer',
      destinationId: 'reserve',
      amount: 250,
      title: 'Férias',
    }),
  );
  assert.deepEqual(balances(d), { 'home-wallet': 750, reserve: 250 });
  assert.equal(
    effectiveEntries(d).filter((e) => e.type === 'expense').length,
    0,
  );
  assert.equal(
    Object.values(balances(d)).reduce((a, b) => a + b, 0),
    1000,
  );
  assert.throws(
    () =>
      addHomeEntry(
        d,
        entry({ type: 'transfer', destinationId: 'reserve', amount: 751 }),
      ),
    /insuficiente/,
  );
});
test('monthly bills cannot be paid twice and a reversal permits correcting a payment', () => {
  let d = addHomeEntry(emptyHome(), entry());
  d.bills.push({
    id: 'water',
    title: 'Água',
    amount: 100,
    day: 31,
    active: true,
    category: 'Habitação',
  });
  const payment = {
    ...entry({ type: 'expense', amount: 100 }),
    billId: 'water',
    billMonth: todayLocal().slice(0, 7),
  };
  d = addHomeEntry(d, payment);
  const id = d.entries[0].id;
  assert.equal(billPaid(d, 'water', payment.billMonth), true);
  assert.throws(() => addHomeEntry(d, payment), /já está paga/);
  d = reverseHomeEntry(d, id, 'Valor incorreto');
  assert.equal(billPaid(d, 'water', payment.billMonth), false);
  assert.equal(d.entries.find((e) => e.id === id)?.amount, 100);
  assert.equal(balances(d)['home-wallet'], 1000);
  assert.throws(() => reverseHomeEntry(d, id, 'Outra vez'), /já foi estornado/);
  d = addHomeEntry(d, payment);
  assert.equal(balances(d)['home-wallet'], 900);
  validateHomeData(d);
});
test('reversing allocated income cannot make personal balances negative', () => {
  let d = addHomeEntry(emptyHome(), entry());
  const incomeId = d.entries[0].id;
  d = addHomeEntry(d, entry({ type: 'expense', amount: 50 }));
  assert.throws(() => reverseHomeEntry(d, incomeId, 'Desfazer'), /sem saldo/);
});
test('money is handled in cents and invalid dates and amounts are rejected', () => {
  let d = addHomeEntry(emptyHome(), entry({ amount: 0.3 }));
  d = addHomeEntry(d, entry({ type: 'expense', amount: 0.1 }));
  assert.equal(balances(d)['home-wallet'], 0.2);
  for (const amount of [NaN, Infinity, 0, -2, 0.001])
    assert.throws(() => addHomeEntry(d, entry({ amount })));
  assert.throws(() => addHomeEntry(d, entry({ date: '2026-02-30' })));
  assert.equal(dueDate('2026-02', 31), '2026-02-28');
  assert.equal(dueDate('2028-02', 31), '2028-02-29');
});
test('restoring a backup validates identifiers, references, duplicate payments and reversal integrity', () => {
  const d = addHomeEntry(emptyHome(), entry());
  assert.deepEqual(validateHomeData(JSON.parse(JSON.stringify(d))), d);
  const bad = (change: (d: HomeData) => void) => {
    const copy = structuredClone(d);
    change(copy);
    assert.throws(() => validateHomeData(copy));
  };
  bad((d) => d.accounts.push({ ...d.accounts[0] }));
  bad((d) => (d.entries[0].accountId = 'missing'));
  bad((d) => (d.entries[0].amount = Infinity));
  bad((d) =>
    d.entries.push({
      ...d.entries[0],
      id: 'fake-reversal',
      type: 'reversal',
      reversalOf: d.entries[0].id,
      amount: 999,
    }),
  );
  bad((d) =>
    d.budgets.push(
      { id: 'b1', category: 'Casa', month: '2026-10', limit: 10 },
      { id: 'b2', category: 'Casa', month: '2026-10', limit: 20 },
    ),
  );
  assert.throws(() => validateHomeData({ version: 2 }));
});
