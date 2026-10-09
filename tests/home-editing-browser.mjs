import assert from 'node:assert/strict';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || 'playwright'
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1365, height: 1000 },
  locale: 'pt-PT',
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const base = process.env.HOME_TEST_URL || 'http://127.0.0.1:4191/';
const data = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem('myoffice-home-v1')));
const nav = (i) => page.locator('#home-nav-' + i).click();
const field = (name, value) => page.locator('#home-field-' + name).fill(value);
const save = async () => {
  await page.locator('#home-save').click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
};
const eliminate = async (name) => {
  await page
    .getByRole('button', { name: 'Eliminar ' + name, exact: true })
    .click();
  await page.locator('#home-delete-confirm').click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
};
try {
  await context.addInitScript(() => {
    if (!localStorage.getItem('myoffice-home-v1'))
      localStorage.setItem(
        'myoffice-home-v1',
        JSON.stringify({
          version: 1,
          name: 'Bloco 2',
          accounts: [
            {
              id: 'a',
              name: 'Carteira',
              openingBalance: 1000,
              kind: 'current',
              currency: 'AOA',
            },
            {
              id: 'empty',
              name: 'Carteira vazia',
              openingBalance: 0,
              kind: 'current',
              currency: 'USD',
            },
            {
              id: 'reserve',
              name: 'Reserva',
              openingBalance: 0,
              kind: 'savings',
              currency: 'AOA',
            },
          ],
          entries: [
            {
              id: 'expense',
              type: 'expense',
              title: 'Primeira despesa',
              amount: 10,
              date: '2026-10-09',
              category: 'Alimentação',
              accountId: 'a',
            },
            {
              id: 'income',
              type: 'income',
              title: 'Salário teste',
              amount: 100,
              date: '2026-10-09',
              category: 'Salário',
              accountId: 'a',
            },
          ],
          budgets: [
            {
              id: 'budget',
              category: 'Alimentação',
              month: '2026-10',
              limit: 100,
              currency: 'AOA',
            },
          ],
          bills: [
            {
              id: 'bill',
              title: 'Internet teste',
              amount: 20,
              category: 'Internet',
              day: 15,
              startDate: '2026-10-15',
              type: 'expense',
              accountId: 'a',
              accountingMode: 'ask',
              recurrence: { frequency: 'none', end: 'never' },
              active: true,
              currency: 'AOA',
            },
          ],
          goals: [
            {
              id: 'goal',
              title: 'Sonho teste',
              target: 50,
              deadline: '2027-01-01',
              accountId: 'reserve',
              fundingMode: 'plan',
              sourceAccountId: 'a',
            },
          ],
          tasks: [],
        }),
      );
  });
  await page.goto(base);
  await page.locator('#mode-btn-home').click();
  await nav(2);
  const expense = page.locator('[data-home-budget-entry-id="expense"]');
  await expense
    .getByRole('button', { name: 'Editar Primeira despesa' })
    .click();
  assert.equal(
    await page.locator('#home-field-title').inputValue(),
    'Primeira despesa',
  );
  assert.equal(await page.locator('#home-field-amount').inputValue(), '10');
  assert.equal(
    await page.locator('#home-save').innerText(),
    'Guardar alterações',
  );
  const before = await data();
  await field('title', 'Cancelada');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  assert.deepEqual(await data(), before);
  await expense
    .getByRole('button', { name: 'Editar Primeira despesa' })
    .click();
  await field('title', '');
  await page.locator('#home-save').click();
  await page.locator('#home-error-title').waitFor();
  assert.equal(await page.getByRole('dialog').count(), 1);
  await field('title', 'Despesa corrigida');
  await field('amount', '25');
  await save();
  let changed = await data();
  assert.equal(changed.entries.find((e) => e.id === 'expense').amount, 25);
  assert.equal(changed.entries.length, 2);
  assert.ok(changed.entries.find((e) => e.id === 'expense').editedAt);
  assert.equal(
    changed.entries.find((e) => e.id === 'expense').edits[0].before.amount,
    10,
  );
  await expense.getByText(/editado em/).waitFor();
  await page
    .getByRole('button', { name: 'Editar orçamento Alimentação' })
    .click();
  await page.locator('#home-field-category').selectOption('Saúde');
  await field('amount', '150');
  await save();
  changed = await data();
  assert.equal(changed.budgets.length, 1);
  assert.equal(changed.budgets[0].id, 'budget');
  assert.equal(changed.budgets[0].category, 'Saúde');
  await eliminate('orçamento Saúde');
  assert.ok((await data()).budgets[0].deletedAt);
  await nav(1);
  await page
    .getByRole('button', { name: 'Editar carteira Carteira', exact: true })
    .click();
  assert.equal(
    await page.locator('#home-field-openingBalance').isDisabled(),
    true,
  );
  await field('title', 'Carteira corrigida');
  await save();
  assert.equal(
    (await data()).accounts.find((a) => a.id === 'a').openingBalance,
    1000,
  );
  await page
    .getByRole('button', { name: 'Eliminar Carteira corrigida', exact: true })
    .click();
  await page.locator('#home-delete-confirm').click();
  await page.getByRole('dialog').getByRole('alert').waitFor();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  const income = page.locator('[data-home-entry-id="income"]');
  await income.getByRole('button', { name: 'Editar Salário teste' }).click();
  await field('amount', '150');
  await save();
  assert.equal(
    (await data()).entries.find((e) => e.id === 'income').amount,
    150,
  );
  await income.getByRole('button', { name: 'Eliminar Salário teste' }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  assert.ok(!(await data()).entries.find((e) => e.id === 'income').deletedAt);
  await eliminate('Salário teste');
  assert.ok((await data()).entries.find((e) => e.id === 'income').deletedAt);
  await nav(2);
  await eliminate('Despesa corrigida');
  assert.equal(await page.locator('[data-home-budget-entry-id]').count(), 0);
  await nav(3);
  await page.getByRole('button', { name: 'Editar Internet teste' }).click();
  await field('title', 'Internet editada');
  await save();
  assert.equal((await data()).bills[0].id, 'bill');
  await eliminate('Internet editada');
  await nav(4);
  await page.getByRole('button', { name: 'Editar meta Sonho teste' }).click();
  await field('title', 'Sonho editado');
  await save();
  assert.equal((await data()).goals[0].id, 'goal');
  assert.ok((await data()).goals[0].editedAt);
  await eliminate('meta Sonho editado');
  await nav(1);
  await page.locator('#home-currency').selectOption('USD');
  await eliminate('Carteira vazia');
  assert.ok((await data()).accounts.find((a) => a.id === 'empty').deletedAt);
  await page.reload();
  await nav(1);
  assert.equal(
    await page
      .getByRole('button', { name: 'Editar carteira Carteira vazia' })
      .count(),
    0,
  );
  // A linked Business transfer is deleted by compensation in both histories.
  const bank = await page.evaluate(() => {
    const banks = JSON.parse(localStorage.getItem('myoffice_estoque_banks'));
    const bank = banks.find(
      (b) =>
        b.status === 'ativo' &&
        !b.companyId &&
        ['AOA', 'Kz'].includes(b.currency),
    );
    const ledger = JSON.parse(
      localStorage.getItem('myoffice_estoque_bankMovements'),
    );
    ledger.unshift({
      id: 'funding-edit-test',
      bankId: bank.id,
      type: 'entrada',
      amount: 1000,
      date: '2026-10-09T12:00:00',
      reason: 'Teste',
      responsible: 'Teste',
      category: 'Outros',
    });
    localStorage.setItem(
      'myoffice_estoque_bankMovements',
      JSON.stringify(ledger),
    );
    return bank.id;
  });
  await page.reload();
  await nav(1);
  await page.locator('#home-currency').selectOption('AOA');
  await page.locator('#home-business-bank').selectOption(bank);
  await page.locator('#home-business-wallet').selectOption('a');
  await page.locator('#home-business-amount').fill('20');
  await page.locator('#home-business-date').fill('2026-10-09');
  await page.locator('#home-business-reason').fill('Business ligado');
  await page.locator('#home-business-transfer').click();
  await page
    .getByText('Transferência guardada nos dois históricos.', { exact: true })
    .waitFor();
  const linked = (await data()).entries.find((e) => e.businessMovementId);
  await page
    .locator(`[data-home-entry-id="${linked.id}"]`)
    .getByRole('button', { name: 'Editar Business ligado' })
    .click();
  assert.equal(await page.locator('#home-field-amount').isDisabled(), true);
  await field('title', 'Business descrito');
  await save();
  await eliminate('Business descrito');
  const final = await data();
  assert.ok(final.entries.find((e) => e.id === linked.id).deletedAt);
  const ledger = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('myoffice_estoque_bankMovements')),
  );
  assert.ok(ledger.some((e) => e.reversalOfId === linked.businessMovementId));
  await page.locator('#home-currency').selectOption('AOA');
  await nav(2);
  await page.screenshot({ path: '/tmp/myoffice-home-editing.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#sidebar-brand-toggle').click();
  await page.waitForFunction(
    () =>
      document.querySelector('#app-sidebar').getBoundingClientRect().width ===
      64,
  );
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    'Block 2: expense edits from Budget, same IDs/cancel/inline errors, budget category update, audit dates, income edits/deletes, wallets and protections, bill/goal deletes, persistence, paired Business deletion, mobile passed.',
  );
} finally {
  await browser.close();
}
