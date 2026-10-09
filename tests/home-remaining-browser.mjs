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
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const base = process.env.HOME_TEST_URL || 'http://127.0.0.1:4191/';
const nav = (i) => page.locator('#home-nav-' + i).click();
const field = (key, value) => page.locator('#home-field-' + key).fill(value);
const select = (key, value) =>
  page.locator('#home-field-' + key).selectOption(value);
const data = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem('myoffice-home-v1')));
const save = async () => {
  await page.locator('#home-save').click();
  try {
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
  } catch (e) {
    console.error(await page.getByRole('dialog').innerText());
    throw e;
  }
};
const today = new Date().toLocaleDateString('en-CA');
try {
  await context.addInitScript(() => {
    if (!localStorage.getItem('myoffice-home-v1'))
      localStorage.setItem(
        'myoffice-home-v1',
        JSON.stringify({
          version: 1,
          name: 'Teste completo',
          accounts: [
            {
              id: 'a',
              name: 'Carteira Kz',
              currency: 'AOA',
              openingBalance: 50000,
              kind: 'current',
            },
            {
              id: 'usd',
              name: 'Carteira USD',
              currency: 'USD',
              openingBalance: 100,
              kind: 'current',
            },
          ],
          entries: [],
          bills: [],
          goals: [],
          tasks: [],
          budgets: [],
        }),
      );
  });
  await page.goto(base);
  await page.locator('#mode-btn-home').click();
  await nav(2);
  await page.locator('#home-add').click();
  for (const key of ['currency', 'category', 'month', 'amount'])
    assert.equal(await page.locator('#home-field-' + key).inputValue(), '');
  await page.locator('#home-save').click();
  assert.equal(await page.locator('#home-error-currency').count(), 1);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await nav(3);
  await page.locator('#home-add').click();
  assert.equal(await page.locator('#home-field-startDate').inputValue(), '');
  await select('currency', 'AOA');
  await select('type', 'income');
  await field('title', 'Salário pendente');
  await field('amount', '100');
  await select('category', 'Salário');
  await field('startDate', today);
  await select('frequency', 'monthly');
  await select('end', 'count');
  await field('count', '2');
  await select('accountId', 'a');
  await save();
  await page.locator('#home-notifications-badge').waitFor();
  assert.equal((await data()).occurrences.length, 1);
  assert.equal((await data()).entries.length, 0);
  await page.reload();
  await page.locator('#home-notifications-button').click();
  await page.getByRole('button', { name: 'Aceitar', exact: true }).click();
  await page.locator('#home-notifications-badge').waitFor({ state: 'hidden' });
  assert.equal((await data()).entries.length, 1);
  await page.locator('#home-notifications-button').click();
  await page.reload();
  assert.equal((await data()).entries.length, 1);
  // Automatic expense, then pause and edit must not modify its posted snapshot.
  await nav(3);
  await page.locator('#home-add').click();
  await select('currency', 'AOA');
  await select('type', 'expense');
  await field('title', 'Internet automática');
  await field('amount', '50');
  await select('category', 'Internet');
  await field('startDate', today);
  await select('frequency', 'weekly');
  await select('end', 'never');
  await select('accountingMode', 'automatic');
  await select('accountId', 'a');
  await save();
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem('myoffice-home-v1')).entries.length === 2,
  );
  const original = (await data()).entries.find(
    (e) => e.title === 'Internet automática',
  );
  await page
    .getByRole('button', { name: 'Editar Internet automática', exact: true })
    .click();
  await field('amount', '60');
  await save();
  assert.equal(
    (await data()).entries.find((e) => e.id === original.id).amount,
    50,
  );
  // An ignored recurring occurrence never becomes a ledger entry.
  await page.locator('#home-add').click();
  await select('currency', 'AOA');
  await select('type', 'expense');
  await field('title', 'Conta ignorada');
  await field('amount', '30');
  await select('category', 'Outros');
  await field('startDate', today);
  await select('frequency', 'yearly');
  await select('end', 'never');
  await select('accountingMode', 'ask');
  await select('accountId', 'a');
  await save();
  await page.locator('#home-notifications-badge').waitFor();
  await page.locator('#home-notifications-button').click();
  await page.getByRole('button', { name: 'Ignorar', exact: true }).click();
  await page.locator('#home-notifications-button').click();
  assert.equal((await data()).entries.length, 2);
  // Manual account remains available and does not generate a notification.
  await page.locator('#home-add').click();
  await select('currency', 'AOA');
  await select('type', 'expense');
  await field('title', 'Conta manual');
  await field('amount', '20');
  await select('category', 'Outros');
  await field('startDate', today);
  await select('frequency', 'none');
  await select('accountId', 'a');
  await save();
  const manual = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Conta manual', exact: true }),
  });
  await manual
    .getByRole('button', { name: 'Registar pagamento', exact: true })
    .click();
  await field('date', today);
  await save();
  assert.equal((await data()).entries.length, 3);
  // Original USD is preserved, converted Kz counted once, USD wallet stays unchanged.
  await nav(1);
  await page.locator('#home-add').click();
  await select('currency', 'USD');
  await field('exchangeRate', '925');
  await select('type', 'expense');
  await field('title', 'Perfume em USD');
  await field('amount', '25');
  await select('category', 'Roupa');
  await select('accountId', 'a');
  await field('date', today);
  await save();
  let d = await data();
  const fx = d.entries.find((e) => e.title === 'Perfume em USD');
  assert.equal(fx.originalAmount, 25);
  assert.equal(fx.amount, 23125);
  assert.equal(fx.exchangeRate, 925);
  await page
    .getByText(/25,00 USD.*925/)
    .first()
    .waitFor();
  await page.locator('#home-add').click();
  await select('currency', 'USD');
  await select('type', 'expense');
  await field('title', 'Despesa em USD');
  await field('amount', '2.50');
  await select('category', 'Outros');
  await select('accountId', 'usd');
  await field('date', today);
  await save();
  d = await data();
  assert.equal(d.entries.find((e) => e.title === 'Despesa em USD').amount, 2.5);
  assert.equal(
    d.entries.find((e) => e.title === 'Despesa em USD').exchangeRate,
    undefined,
  );
  // A dream without a deadline chooses its source; repeated contributions preserve funds.
  await nav(4);
  await page.locator('#home-add').click();
  await select('currency', 'AOA');
  await field('title', 'Sonho sem prazo');
  await field('amount', '200');
  await select('category', 'Lazer');
  await select('sourceAccountId', 'a');
  await save();
  await page.getByText('Sonho sem prazo', { exact: true }).first().waitFor();
  assert.equal((await data()).goals[0].deadline, '');
  assert.equal((await data()).goals[0].sourceAccountId, 'a');
  await page
    .getByRole('button', { name: 'Reservar valor', exact: true })
    .click();
  assert.equal(await page.locator('#home-field-accountId').inputValue(), 'a');
  await field('amount', '50');
  await field('date', today);
  await save();
  assert.equal((await data()).entries[0].type, 'transfer');
  await nav(6);
  await page.locator('#home-settings-goals').click();
  assert.equal(
    await page.locator('#home-goals-auto-reserve').isChecked(),
    true,
  );
  await page.locator('#home-goals-auto-reserve').uncheck();
  await nav(4);
  await page
    .getByRole('button', { name: 'Registar progresso', exact: true })
    .click();
  await field('amount', '25');
  await field('date', today);
  const count = (await data()).entries.length;
  await save();
  assert.equal((await data()).entries.length, count);
  assert.equal((await data()).goals[0].plannedAmount, 25);
  await page.locator('#home-add').click();
  await select('currency','USD');
  await field('exchangeRate','925');
  await field('title','Sonho USD convertido');
  await field('amount','10');
  await select('category','Lazer');
  await select('sourceAccountId','a');
  await save();
  const convertedGoal=(await data()).goals.find(g=>g.title==='Sonho USD convertido');
  assert.equal(convertedGoal.originalAmount,10);
  assert.equal(convertedGoal.target,9250);
  assert.equal(convertedGoal.deadline,'');
  await nav(0);
  assert.equal(
    await page.getByText('Receitas do mês', { exact: true }).count(),
    0,
  );
  assert.ok(
    (await page.getByText('Rendimentos do mês', { exact: true }).count()) > 0,
  );
  await page.screenshot({
    path: '/tmp/myoffice-home-completo.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#sidebar-brand-toggle').click();
  await page.locator('#home-notifications-button').click();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  await page.locator('#home-notifications-button').click();
  await page.reload();
  assert.equal((await data()).goals[0].plannedAmount, 25);
  const missingContext=await browser.newContext({locale:'pt-PT'});
  const missing=await missingContext.newPage();
  await missing.goto(base);
  await missing.locator('#mode-btn-home').click();
  await missing.locator('#home-nav-1').click();
  await missing.locator('#home-add').click();
  await missing.locator('#home-field-currency').selectOption('USD');
  await missing.getByText(/Não existe carteira em USD/).waitFor();
  await missing.getByRole('button',{name:'Criar carteira USD',exact:true}).click();
  await missing.locator('#home-field-title').fill('Nova carteira USD');
  await missing.locator('#home-field-openingBalance').fill('0');
  await missing.locator('#home-save').click();
  await missing.getByRole('dialog').waitFor({state:'hidden'});
  assert.ok(await missing.evaluate(()=>JSON.parse(localStorage.getItem('myoffice-home-v1')).accounts.some(a=>a.name==='Nova carteira USD' && a.currency==='USD')));
  await missingContext.close();
  assert.deepEqual(errors, []);
  console.log(
    'Blocks 3–6 browser: empty forms/inline validation, recurring ask/automatic/ignore/manual, reload no duplicates, future-only edit, USD with/without FX, source dream/no deadline, reserve/on-off progress, dashboard/mobile passed.',
  );
} finally {
  await browser.close();
}
