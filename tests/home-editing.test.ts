import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyHome,
  addHomeEntry,
  balances,
  todayLocal,
  validateHomeData,
  payHomeShopping,
  contributeHomeGoal,
  acquireHomeGoal,
} from '../src/utils/home';
import { editHomeEntry, deleteHomeEntity } from '../src/utils/homeEditing';
const entry = (type: 'income' | 'expense', amount: number) => ({
  type,
  amount,
  title: 'Teste',
  date: todayLocal(),
  category: type === 'income' ? 'Salário' : 'Alimentação',
  accountId: 'home-wallet',
});
test('editing a personal expense keeps its ID, recalculates balance and records the prior values', () => {
  let d = emptyHome();
  d.accounts[0].openingBalance = 100;
  d = addHomeEntry(d, entry('expense', 10));
  const old = d.entries[0];
  d = editHomeEntry(d, old.id, { ...old, amount: 25, title: 'Corrigida' });
  assert.equal(d.entries.length, 1);
  assert.equal(d.entries[0].id, old.id);
  assert.equal(balances(d)['home-wallet'], 75);
  assert.equal(d.entries[0].edits![0].before.amount, 10);
  assert.ok(d.entries[0].editedAt);
  assert.deepEqual(validateHomeData(d), d);
});
test('income editing/deletion refuses to invalidate later spending and makes no mutation', () => {
  let d = addHomeEntry(emptyHome(), entry('income', 100));
  const income = d.entries[0];
  d = addHomeEntry(d, entry('expense', 60));
  const before = structuredClone(d);
  assert.throws(
    () => editHomeEntry(d, income.id, { ...income, amount: 50 }),
    /saldo/,
  );
  assert.throws(() => deleteHomeEntity(d, 'entry', income.id), /saldo/);
  assert.deepEqual(d, before);
  d = deleteHomeEntity(d, 'entry', d.entries[0].id);
  d = deleteHomeEntity(d, 'entry', income.id);
  assert.equal(balances(d)['home-wallet'], 0);
  assert.equal(d.entries.length, 2);
  assert.ok(d.entries.every((e) => e.deletedAt));
});
test('deleted monthly limits do not block creating a replacement, while original IDs survive', () => {
  let d = emptyHome();
  d.budgets = [
    { id: 'old', category: 'Alimentação', month: '2026-10', limit: 50 },
  ];
  d = deleteHomeEntity(d, 'budget', 'old');
  d.budgets.push({
    id: 'new',
    category: 'Alimentação',
    month: '2026-10',
    limit: 75,
  });
  d = validateHomeData(d);
  assert.equal(d.budgets.length, 2);
  assert.ok(d.budgets[0].deletedAt);
});
test('wallet deletion protects funds/references and deleted USD accounts retain historical currency', () => {
  let d = emptyHome();
  d.accounts.push({
    id: 'usd',
    name: 'USD',
    kind: 'current',
    openingBalance: 0,
    currency: 'USD',
  });
  d = deleteHomeEntity(d, 'account', 'usd');
  assert.throws(
    () => addHomeEntry(d, { ...entry('income', 10), accountId: 'usd' }),
    /conta válida/,
  );
  assert.equal(d.accounts.find((a) => a.id === 'usd')!.currency, 'USD');
  d = addHomeEntry(d, entry('income', 10));
  assert.throws(() => deleteHomeEntity(d, 'account', 'home-wallet'), /saldo/);
});
test('editing a paid shopping amount/classification preserves the payment ID and original quote', () => {
  let d = emptyHome();
  d.accounts[0].openingBalance = 100;
  d.shopping = [
    {
      id: 'item',
      name: 'Jogo',
      category: 'Games',
      subcategory: 'Jogos',
      quantity: 1,
      unitPrice: 25,
      archived: false,
    },
  ];
  d = payHomeShopping(d, 'item', 'home-wallet', todayLocal());
  const e = d.entries[0];
  d = editHomeEntry(d, e.id, { ...e, amount: 30 });
  assert.equal(d.shopping![0].paymentAmount, 30);
  d = editHomeEntry(d, e.id, {
    ...e,
    category: 'Lazer',
    title: 'Compra corrigida',
  });
  assert.equal(d.shopping![0].category, 'Lazer');
  assert.equal(d.shopping![0].entryId, e.id);
  assert.equal(d.shopping![0].subcategory, undefined);
  assert.equal(balances(d)['home-wallet'], 75);
});
test('metas with reserved funds cannot be deleted; deleting their acquisition reopens progress', () => {
  let d = emptyHome();
  d.accounts[0].openingBalance = 100;
  d.accounts.push({
    id: 'r',
    name: 'Reserva',
    kind: 'savings',
    openingBalance: 0,
  });
  d.goals = [
    {
      id: 'g',
      title: 'Meta',
      target: 25,
      deadline: '2027-01-01',
      accountId: 'r',
      fundingMode: 'reserve',
      category: 'Lazer',
    },
  ];
  d = contributeHomeGoal(d, 'g', 'home-wallet', 25, todayLocal());
  assert.throws(() => deleteHomeEntity(d, 'goal', 'g'), /reserva/);
  d = acquireHomeGoal(d, 'g', todayLocal());
  const expense = d.entries[0];
  d = editHomeEntry(d, expense.id, { ...expense, amount: 20 });
  assert.equal(d.goals[0].target, 20);
  assert.equal(balances(d).r, 5);
  d = deleteHomeEntity(d, 'entry', expense.id);
  assert.equal(balances(d).r, 25);
  assert.throws(() => deleteHomeEntity(d, 'goal', 'g'), /reserva/);
});
