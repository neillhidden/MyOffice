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
  timezoneId: 'Africa/Lagos',
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.setDefaultTimeout(15000);
const base = process.env.HOME_TEST_URL || 'http://127.0.0.1:4191/';
const field = (name, value) => page.locator('#home-field-' + name).fill(value);
const choose = (name, value) =>
  page.locator('#home-field-' + name).selectOption(value);
const save = async () => {
  await page.locator('#home-save').click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
};
const home = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem('myoffice-home-v1')));
const nav = (i) => page.locator('#home-nav-' + i).click();
const goal = (name) =>
  page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name, exact: true }) });
try {
  await page.goto(base);
  await page.locator('#mode-btn-home').click();
  await nav(1);
  await page.locator('#home-add-account').click();
  await field('title', 'Carteira Kz teste');
  await field('openingBalance', '2000');
  await choose('currency', 'AOA');
  await save();
  const wallet = (await home()).accounts.find(
    (a) => a.name === 'Carteira Kz teste',
  ).id;
  await page.locator('#home-add-account').click();
  await field('title', 'Carteira USD teste');
  await field('openingBalance', '100');
  await choose('currency', 'USD');
  await save();
  const dollar = (await home()).accounts.find(
    (a) => a.name === 'Carteira USD teste',
  ).id;
  assert.equal(await page.locator('#home-currency').inputValue(), 'USD');
  await page.locator('#home-add').click();
  await choose('currency', 'USD');
  await choose('type', 'income');
  await choose('category', 'Salário');
  await field('date', '2026-10-09');
  await field('title', 'Salário USD');
  await field('amount', '10');
  await choose('accountId', dollar);
  await save();
  await nav(0);
  await page.locator('#home-dashboard-charts').waitFor();
  assert.match(
    await page
      .getByText('Rendimentos do mês', { exact: true })
      .first()
      .innerText(),
    /Rendimentos/,
  );
  await page.locator('#home-currency').selectOption('AOA');
  await nav(6);
  await page.locator('#home-settings-goals').click();
  await page.locator('#home-goals-auto-reserve').uncheck();
  await nav(4);
  await page.locator('#home-add').click();
  await choose('currency', 'AOA');
  await choose('category', 'Roupa');
  await choose('sourceAccountId', wallet);
  await field('title', 'Perfume planeado');
  await field('amount', '50');
  await field('deadline', '2027-12-01');
  await save();
  await goal('Perfume planeado')
    .getByRole('button', { name: 'Registar progresso', exact: true })
    .click();
  await field('amount', '50');
  await field('date', '2026-10-09');
  assert.equal(await page.locator('#home-field-accountId').count(), 0);
  await save();
  assert.equal((await home()).entries.length, 1);
  await goal('Perfume planeado')
    .getByRole('button', { name: 'Marcar como adquirido' })
    .click();
  assert.equal((await home()).entries.length, 1);
  await nav(6);
  await page.locator('#home-settings-goals').click();
  await page.locator('#home-goals-auto-reserve').check();
  await nav(4);
  await page.locator('#home-add').click();

  await choose('currency', 'AOA');
  await choose('sourceAccountId', wallet);
  await field('title', 'Perfume real');
  await field('amount', '300');
  await field('deadline', '2027-12-01');
  await choose('category', 'Roupa');
  await save();
  await goal('Perfume real')
    .getByRole('button', { name: 'Reservar valor', exact: true })
    .click();
  await field('amount', '300');
  await field('date', '2026-10-09');
  await choose('accountId', wallet);
  await save();
  assert.equal((await home()).entries[0].type, 'transfer');
  await goal('Perfume real')
    .getByRole('button', { name: 'Marcar como adquirido' })
    .click();
  const acquired = await home();
  assert.equal(acquired.entries[0].amount, 300);
  assert.equal(acquired.entries[0].type, 'expense');
  assert.equal(
    await goal('Perfume real')
      .getByRole('button', { name: 'Marcar como adquirido' })
      .count(),
    0,
  );
  await nav(0);
  await page.locator('#home-dashboard-charts').waitFor();
  assert.ok((await page.locator('#home-dashboard-charts svg').count()) >= 3);
  await page.screenshot({
    path: '/tmp/myoffice-home-finance-charts.png',
    fullPage: true,
  });
  await nav(6);
  await page.locator('#home-settings-categories').click();
  await page.locator('#home-category-kind').selectOption('income');
  await page
    .locator('strong')
    .filter({ hasText: /^Salário$/ })
    .waitFor();
  await page.locator('#home-category-kind').selectOption('expense');
  await page
    .locator('strong')
    .filter({ hasText: /^Internet$/ })
    .waitFor();
  const header = await page.locator('header').boundingBox();
  await page.mouse.move(1000, 500);
  await page.mouse.wheel(0, 40000);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  assert.equal((await page.locator('header').boundingBox()).y, header.y);
  assert.equal((await page.locator('#app-sidebar').boundingBox()).y, 0);
  assert.ok(
    await page
      .locator('main')
      .evaluate(
        (el) => Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 3,
      ),
  );
  const bank = await page.evaluate(() => {
    const companies = JSON.parse(
      localStorage.getItem('myoffice_estoque_companies'),
    );
    const banks = JSON.parse(localStorage.getItem('myoffice_estoque_banks'));
    const bank = banks.find(
      (b) =>
        b.status === 'ativo' &&
        ['Kz', 'AOA'].includes(b.currency) &&
        (!b.companyId ||
          companies.some((c) => c.id === b.companyId && c.status === 'ativa')),
    );
    if (!bank) throw Error('No eligible bank fixture');
    const records = JSON.parse(
      localStorage.getItem('myoffice_estoque_bankMovements'),
    );
    records.unshift({
      id: 'finance-test-funding',
      bankId: bank.id,
      type: 'entrada',
      amount: 10000,
      date: new Date().toISOString(),
      reason: 'Fixture de teste',
      responsible: 'Teste',
      category: 'Outros',
    });
    localStorage.setItem(
      'myoffice_estoque_bankMovements',
      JSON.stringify(records),
    );
    return bank.id;
  });
  await page.reload();
  await nav(1);
  await page.locator('#home-business-bank').selectOption(bank);
  await page.locator('#home-business-wallet').selectOption(wallet);
  await page.locator('#home-business-amount').fill('200');
  await page.locator('#home-business-date').fill('2026-10-09');
  await page.locator('#home-business-reason').fill('Rendimento Business teste');
  const before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('myoffice_estoque_bankMovements')),
  );
  await page.locator('#home-business-transfer').click();
  await page
    .getByText('Transferência guardada nos dois históricos.', { exact: true })
    .waitFor();
  const after = await home();
  const linked = after.entries.find((e) => e.businessMovementId);
  assert.equal(linked.amount, 200);
  assert.equal(
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem('myoffice_estoque_bankMovements')),
      )
    ).length,
    before.length + 1,
  );
  await page
    .locator(`[data-home-entry-id="${linked.id}"]`)
    .getByRole('button', { name: 'Estornar' })
    .click();
  await field('title', 'Devolver ao Business');
  await save();
  const corrected = await home();
  assert.equal(corrected.entries[0].reversalOf, linked.id);
  const ledger = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('myoffice_estoque_bankMovements')),
  );
  assert.ok(ledger.some((m) => m.reversalOfId === linked.businessMovementId));
  assert.equal(ledger.length, before.length + 2);
  await page.reload();
  await nav(6);
  await page.locator('#home-settings-business').click();
  await page.locator('#home-show-business-income').uncheck();
  await nav(1);
  assert.equal(await page.locator('#home-business-income').count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#sidebar-brand-toggle').click();
  await nav(0);
  await page.locator('#home-dashboard-charts').waitFor();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: '/tmp/myoffice-home-finance-mobile.png',
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    'Home AOA/USD, income/expense categories, planning/reserve/acquisition, charts, paired Business transfer/reversal, visibility, fixed frame and mobile passed.',
  );
} finally {
  await browser.close();
}
