import { readFile } from 'node:fs/promises';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || 'playwright'
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
const base = process.env.HOME_TEST_URL || 'http://127.0.0.1:4191/';
const context = await browser.newContext({
  viewport: { width: 1365, height: 1000 },
  acceptDownloads: true,
  locale: 'pt-PT',
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const field = (name, value) => page.locator(`#home-field-${name}`).fill(value);
const select = (name, value) =>
  page.locator(`#home-field-${name}`).selectOption(value);
const save = async () => {
  await page.locator('#home-save').click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
};
const nav = async (index) => page.locator(`#home-nav-${index}`).click();
try {
  await page.goto(base);
  await page.locator('#mode-btn-home').waitFor();
  await page.waitForFunction(() =>
    localStorage.getItem('myoffice_estoque_products'),
  );
  const business = await page.evaluate(() =>
    Object.fromEntries(
      ['products', 'sales', 'bankMovements'].map((key) => [
        key,
        localStorage.getItem('myoffice_estoque_' + key),
      ]),
    ),
  );
  await page.locator('#mode-btn-home').click();
  await page
    .getByRole('heading', { name: 'A tua vida, com mais clareza' })
    .waitFor();
  if (await page.locator('#btn-notifications').count())
    throw Error('Business notifications leaked into Home');
  await nav(1);
  await page.locator('#home-add-account').click();
  await field('title', 'Conta pessoal');
  await field('openingBalance', '200000');
  await save();
  const account = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('myoffice-home-v1')).accounts.find(
        (a) => a.name === 'Conta pessoal',
      ).id,
  );
  await page.locator('#home-add').click();
  await select('type', 'income');
  await field('title', 'Salário');
  await field('amount', '50000');
  await save();
  await page.locator('#home-add').click();
  await field('title', 'Supermercado');
  await field('amount', '5000');
  await select('category', 'Alimentação');
  await select('accountId', account);
  await save();
  await nav(2);
  await page.locator('#home-add').click();
  await select('category', 'Alimentação');
  await field('amount', '10000');
  await save();
  if (
    !(await page.getByText('Ainda disponível:', { exact: false }).textContent())
  )
    throw Error('Budget failed');
  await nav(3);
  await page.locator('#home-add').click();
  await field('title', 'Renda');
  await field('amount', '20000');
  await field('day', '5');
  await select('category', 'Habitação');
  await save();
  await page
    .getByRole('button', { name: 'Registar pagamento', exact: true })
    .click();
  await select('accountId', account);
  await save();
  if (
    await page
      .getByRole('button', { name: 'Registar pagamento', exact: true })
      .count()
  )
    throw Error('Duplicate bill payment offered');
  await nav(4);
  await page.locator('#home-add').click();
  await field('title', 'Férias');
  await field('amount', '100000');
  await field('deadline', '2027-12-01');
  await save();
  await page.getByRole('button', { name: 'Reservar valor' }).click();
  await field('amount', '30000');
  await select('accountId', account);
  await save();
  const progress = await page
    .getByRole('progressbar', { name: 'Férias', exact: true })
    .getAttribute('aria-valuenow');
  if (progress !== '30') throw Error('Goal balance wrong');
  await nav(5);
  await page.locator('#home-add').click();
  await field('title', 'Dentista');
  await field('date', '2027-01-10');
  await save();
  await page.getByRole('checkbox', { name: 'Concluir Dentista' }).check();
  await nav(0);
  await page.screenshot({ path: '/tmp/myoffice-home-dashboard.png' });
  const personal = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('myoffice-home-v1')),
  );
  if (
    personal.entries
      .filter((e) => e.type === 'expense')
      .reduce((s, e) => s + e.amount, 0) !== 25000
  )
    throw Error('Reservations counted as expenses');
  await page.locator('#mode-btn-business').click();
  await page.locator('#nav-item-estoque').waitFor();
  const after = await page.evaluate(() =>
    Object.fromEntries(
      ['products', 'sales', 'bankMovements'].map((key) => [
        key,
        localStorage.getItem('myoffice_estoque_' + key),
      ]),
    ),
  );
  if (JSON.stringify(business) !== JSON.stringify(after))
    throw Error('Personal operation changed Business data');
  await page.locator('#mode-btn-home').click();
  await page.reload();
  await page
    .getByRole('heading', { name: 'A tua vida, com mais clareza' })
    .waitFor();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('myoffice-home-v1')),
  );
  if (saved.goals.length !== 1 || !saved.tasks[0].done)
    throw Error('Persistence failed');
  await nav(6);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#home-export').click();
  const download = await downloadPromise;
  const backup = JSON.parse(await readFile(await download.path(), 'utf8'));
  if (backup.goals[0].title !== 'Férias') throw Error('Backup failed');
  await page.locator('#home-house-name').fill('Casa alterada');
  await page.getByRole('button', { name: 'Guardar nome' }).click();
  await page
    .locator('#home-import')
    .setInputFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });
  await page.getByRole('dialog').getByRole('textbox').fill('RESTAURAR');
  await page.getByRole('button', { name: 'Restaurar Home' }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  if ((await page.locator('#home-house-name').inputValue()) !== 'Minha casa')
    throw Error('Restore failed');
  await page
    .locator('#home-import')
    .setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"version":2}'),
    });
  await page.getByRole('alert').waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#sidebar-brand-toggle').click();
  await page.waitForFunction(
    () =>
      document.getElementById('app-sidebar').getBoundingClientRect().width <=
      70,
  );
  await page.locator('#mode-switch-compact').selectOption('business');
  await page.locator('#mode-switch-compact').selectOption('home');
  await nav(0);
  await page.locator('#btn-toggle-theme').click();
  await page.waitForFunction(
    () =>
      getComputedStyle(document.getElementById('app-root-shell'))
        .backgroundColor === 'rgb(13, 13, 15)' &&
      getComputedStyle(document.getElementById('app-root-shell')).color ===
        'rgb(245, 245, 245)',
  );
  await page.screenshot({ path: '/tmp/myoffice-home-mobile.png' });
  for (let i = 0; i < 7; i++) {
    await nav(i);
    if (
      await page
        .locator('#home-view')
        .evaluate((el) => el.scrollWidth > el.clientWidth)
    )
      throw Error('Home mobile overflow: ' + i);
  }
  // Failed storage writes must leave the saved ledger untouched.
  await nav(1);
  const beforeFailure = await page.evaluate(() =>
    localStorage.getItem('myoffice-home-v1'),
  );
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'myoffice-home-v1')
        throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.locator('#home-add').click();
  await select('type', 'income');
  await field('title', 'Não guardar');
  await field('amount', '100');
  await page.locator('#home-save').click();
  await page.getByRole('dialog').getByRole('alert').waitFor();
  if (
    (await page.evaluate(() => localStorage.getItem('myoffice-home-v1'))) !==
    beforeFailure
  )
    throw Error('Failed write changed persisted ledger');
  await page.reload();
  await nav(6);
  // A stale tab cannot overwrite newer changes made in another tab.
  const other = await context.newPage();
  await other.goto(base);
  await other.locator('#home-nav-6').click();
  await other.locator('#home-house-name').fill('Outra aba');
  await other.getByRole('button', { name: 'Guardar nome' }).click();
  await page.locator('#home-house-name').fill('Aba antiga');
  await page.getByRole('button', { name: 'Guardar nome' }).click();
  await page
    .getByText(
      'Há alterações do Home noutra aba. Recarrega a página antes de continuar.',
      { exact: true },
    )
    .first()
    .waitFor();
  if (
    (await page.evaluate(
      () => JSON.parse(localStorage.getItem('myoffice-home-v1')).name,
    )) !== 'Outra aba'
  )
    throw Error('Stale tab overwrote data');
  await other.close();
  // Corrupted saved personal data must never be silently replaced.
  const recoveryContext = await browser.newContext();
  await recoveryContext.addInitScript(() => {
    localStorage.setItem('myoffice-mode', 'home');
    localStorage.setItem('myoffice-home-v1', 'corrupted-original');
  });
  const recovery = await recoveryContext.newPage();
  await recovery.goto(base);
  await recovery.getByRole('alert').waitFor();
  await recovery.locator('#home-nav-1').click();
  await recovery.locator('#home-add-account').click();
  await recovery.locator('#home-field-title').fill('Impossível');
  await recovery.locator('#home-save').click();
  await recovery.getByRole('dialog').getByRole('alert').waitFor();
  if (
    (await recovery.evaluate(() =>
      localStorage.getItem('myoffice-home-v1'),
    )) !== 'corrupted-original'
  )
    throw Error('Corrupt data was overwritten');
  await recoveryContext.close();
  if (errors.length) throw Error(errors.join('\n'));
  console.log(
    'Home/Business isolation; accounts, income, expenses, budgets, bill payment, goals, tasks, backup/restore, persistence, mobile, dark theme, quota failure, cross-tab conflicts and corrupted-data preservation passed.',
  );
} catch (error) {
  await page.screenshot({ path: '/tmp/myoffice-home-test-failure.png' });
  throw error;
} finally {
  await browser.close();
}
