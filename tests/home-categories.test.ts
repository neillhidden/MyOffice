import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyHome,
  validateHomeData,
  addHomeEntry,
  payHomeShopping,
  balances,
  todayLocal,
} from '../src/utils/home';
import {
  normalizeHomeCatalog,
  saveHomeCategory,
  deleteHomeCategory,
  moveHomeCategory,
  categoryDuplicates,
  homeCategoryUsage,
  homeCategoryName,
} from '../src/utils/homeCategories';
const root = (d: ReturnType<typeof emptyHome>, name: string) =>
  normalizeHomeCatalog(d).categoryCatalog!.find(
    (c) => c.name === name && !c.parentId && c.kind === 'expense',
  )!;
test('legacy category migration is stable and keeps Internet in its two levels', () => {
  const original = emptyHome(),
    d = validateHomeData(original);
  assert.deepEqual(validateHomeData(d), d);
  assert.equal(
    d.categoryCatalog!.filter((c) => c.name === 'Internet').length,
    2,
  );
  assert.equal(original.categoryCatalog, undefined);
  assert.deepEqual(d.accounts, original.accounts);
  assert.throws(
    () =>
      validateHomeData({
        ...d,
        categoryCatalog: [...d.categoryCatalog!, { ...d.categoryCatalog![0] }],
      }),
    /inválido/,
  );
});
test('rename and icon changes preserve keys, financial IDs and balances', () => {
  let d = addHomeEntry(emptyHome(), {
    type: 'income',
    title: 'Salário',
    amount: 1000,
    date: todayLocal(),
    category: 'Salário',
    accountId: 'home-wallet',
  });
  d = addHomeEntry(d, {
    type: 'expense',
    title: 'Internet',
    amount: 10,
    date: todayLocal(),
    category: 'Internet',
    accountId: 'home-wallet',
  });
  const c = root(d, 'Internet'),
    before = structuredClone(d.entries),
    saldo = balances(d);
  d = validateHomeData(
    saveHomeCategory(d, { ...c, name: 'Conectividade', icon: 'wifi' }),
  );
  assert.deepEqual(d.entries, before);
  assert.deepEqual(balances(d), saldo);
  assert.equal(homeCategoryName(d, 'Internet'), 'Conectividade');
  assert.equal(d.categoryCatalog!.find((r) => r.id === c.id)?.icon, 'wifi');
});
test('duplicates ignore whitespace/case, require explicit override and have separate keys', () => {
  let d = saveHomeCategory(emptyHome(), {
    name: 'Nova Categoria',
    kind: 'expense',
  });
  assert.equal(
    categoryDuplicates(d, '  nova   categoria  ', 'expense').length,
    1,
  );
  assert.throws(
    () => saveHomeCategory(d, { name: 'nova categoria', kind: 'expense' }),
    /Já existe/,
  );
  d = validateHomeData(
    saveHomeCategory(d, { name: 'nova categoria', kind: 'expense' }, true),
  );
  const matches = categoryDuplicates(d, 'Nova Categoria', 'expense');
  assert.equal(matches.length, 2);
  assert.notEqual(matches[0].key, matches[1].key);
  assert.notEqual(matches[0].id, matches[1].id);
});
test('unused deletion persists and used categories cannot silently remove history', () => {
  let d = normalizeHomeCatalog(emptyHome()),
    c = root(d, 'Internet');
  d = validateHomeData(deleteHomeCategory(d, c.id));
  assert.ok(
    !d.categoryCatalog!.some((c) => c.id === root(emptyHome(), 'Internet').id),
  );
  assert.ok(!d.categories!.includes('Internet'));
  d = addHomeEntry(d, {
    type: 'income',
    title: 'Salário',
    amount: 1000,
    date: todayLocal(),
    category: 'Salário',
    accountId: 'home-wallet',
  });
  d = addHomeEntry(d, {
    type: 'expense',
    title: 'Passeio',
    amount: 10,
    date: todayLocal(),
    category: 'Lazer',
    accountId: 'home-wallet',
  });
  assert.throws(() => deleteHomeCategory(d, root(d, 'Lazer').id), /em uso/);
});
test('moving a used shopping subcategory preserves payment linkage, amounts and classification history', () => {
  let d = emptyHome();
  d.accounts[0].openingBalance = 1000;
  d.shopping = [
    {
      id: 's',
      name: 'Compra',
      category: 'Games',
      subcategory: 'Jogos',
      quantity: 1,
      unitPrice: 25,
      archived: false,
    },
  ];
  d = payHomeShopping(d, 's', 'home-wallet', todayLocal());
  const oldId = d.entries[0].id,
    saldo = balances(d),
    catalog = normalizeHomeCatalog(d).categoryCatalog!;
  const source = catalog.find(
    (c) => c.name === 'Jogos' && c.parentId === root(d, 'Games').id,
  )!;
  assert.equal(homeCategoryUsage(d, source.id).compras, 1);
  const target = root(d, 'Lazer');
  d = validateHomeData(moveHomeCategory(d, source.id, target.id));
  assert.equal(d.entries[0].id, oldId);
  assert.equal(d.shopping![0].entryId, oldId);
  assert.deepEqual(balances(d), saldo);
  assert.equal(d.entries[0].category, 'Lazer');
  assert.equal(d.shopping![0].category, 'Lazer');
  assert.equal(d.shopping![0].subcategory, undefined);
  assert.equal(d.entries[0].categoryHistory![0].category, 'Games');
});
test('moving limits refuses conflicts instead of removing IDs or combining financial plans', () => {
  const d = normalizeHomeCatalog(emptyHome());
  d.budgets = [
    { id: 'a', category: 'Games', month: '2026-10', limit: 100 },
    { id: 'b', category: 'Lazer', month: '2026-10', limit: 50 },
  ];
  assert.throws(
    () => moveHomeCategory(d, root(d, 'Games').id, root(d, 'Lazer').id),
    /Já existe um limite/,
  );
  assert.equal(d.budgets.length, 2);
});
