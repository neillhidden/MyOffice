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
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const base = process.env.HOME_TEST_URL || 'http://127.0.0.1:4191/';
const store = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem('myoffice-home-v1')));
const row = (name) =>
  page.locator('[data-home-category-id]').filter({
    has: page
      .locator('strong')
      .filter({ hasText: new RegExp('^' + name + '$') }),
  });
const close = () =>
  page.getByRole('button', { name: 'Cancelar', exact: true }).click();
const save = async () => {
  await page.locator('#home-category-save').click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
};
const categories = async () => {
  await page.locator('#home-nav-6').click();
  await page.locator('#home-settings-categories').click();
};
try {
  await context.addInitScript(() => {
    if (!localStorage.getItem('myoffice-home-v1'))
      localStorage.setItem(
        'myoffice-home-v1',
        JSON.stringify({
          version: 1,
          name: 'Casa teste',
          accounts: [
            {
              id: 'wallet',
              name: 'Carteira',
              kind: 'current',
              openingBalance: 1000,
              currency: 'AOA',
            },
          ],
          entries: [
            {
              id: 'paid',
              type: 'expense',
              title: 'Compra teste',
              amount: 25,
              date: '2026-10-08',
              category: 'Games',
              accountId: 'wallet',
            },
          ],
          budgets: [],
          bills: [],
          goals: [],
          tasks: [],
          shopping: [
            {
              id: 'item',
              name: 'Jogo',
              category: 'Games',
              subcategory: 'Jogos',
              quantity: 1,
              unitPrice: 25,
              entryId: 'paid',
              archived: false,
            },
          ],
        }),
      );
  });
  await page.goto(base);
  await page.locator('#mode-btn-home').click();
  await categories();
  await page.getByText(/Internet existe como categoria principal/).waitFor();
  assert.equal(
    await page.locator('#home-category-add').innerText(),
    'Adicionar',
  );
  await page.locator('#home-category-add').click();
  assert.equal(await page.locator('#home-category-name').inputValue(), '');
  assert.equal(
    await page.getByRole('button', { name: /^Ícone /, pressed: true }).count(),
    0,
  );
  await page.locator('#home-category-save').click();
  await page.locator('#home-category-error').waitFor();
  assert.equal(await page.getByRole('dialog').count(), 1);
  await page.locator('#home-category-name').fill('Teste Casa');
  await page.locator('#home-category-icon-search').fill('Casa');
  await page.getByRole('button', { name: 'Ícone Casa', exact: true }).click();
  await save();
  const created = (await store()).categoryCatalog.find(
    (c) => c.name === 'Teste Casa',
  );
  assert.equal(created.icon, 'house');
  await row('Teste Casa')
    .getByRole('button', { name: 'Editar Teste Casa', exact: true })
    .click();
  assert.equal(
    await page.locator('#home-category-name').inputValue(),
    'Teste Casa',
  );
  await page.locator('#home-category-name').fill('Casa renomeada');
  await close();
  assert.equal(
    (await store()).categoryCatalog.find((c) => c.id === created.id).name,
    'Teste Casa',
  );
  await row('Teste Casa')
    .getByRole('button', { name: 'Editar Teste Casa', exact: true })
    .click();
  await page.locator('#home-category-name').fill('Casa renomeada');
  await save();
  assert.equal(
    (await store()).categoryCatalog.find((c) => c.id === created.id).name,
    'Casa renomeada',
  );
  await row('Casa renomeada')
    .getByText(/editado em/)
    .waitFor();
  await row('Casa renomeada')
    .getByRole('button', { name: /^Casa renomeada/ })
    .click();
  await page.locator('#home-subcategory-add').click();
  assert.equal(await page.locator('#home-subcategory-name').inputValue(), '');
  await page.locator('#home-subcategory-name').fill('Filho teste');
  await save();
  assert.equal(await row('Filho teste').locator('svg.lucide-house').count(), 1);
  await row('Filho teste')
    .getByRole('button', { name: 'Editar Filho teste' })
    .click();
  await page.locator('#home-subcategory-name').fill('Filho editado');
  await page.locator('#home-category-icon-search').fill('Internet');
  await page.getByRole('button', { name: 'Ícone Internet' }).click();
  await save();
  assert.equal(
    await row('Filho editado').locator('svg.lucide-wifi').count(),
    1,
  );
  await page.getByRole('button', { name: 'Categorias', exact: true }).click();
  await page.locator('#home-category-view-all').click();
  await row('Filho editado')
    .getByText(/Casa renomeada/)
    .waitFor();
  await page.locator('#home-category-search').fill('Filho editado');
  assert.equal(await page.locator('[data-home-category-id]').count(), 1);
  await page.locator('#home-category-search').fill('');
  await page.locator('#home-category-view-categories').click();
  await page.locator('#home-category-add').click();
  await page.locator('#home-category-name').fill('  CASA   RENOMEADA  ');
  await page.locator('#home-category-save').click();
  await page.getByRole('button', { name: 'Ver existente' }).click();
  await page
    .getByRole('navigation', { name: 'Categorias' })
    .getByText('Casa renomeada', { exact: true })
    .waitFor();
  await page.getByRole('button', { name: 'Categorias', exact: true }).click();
  await page.locator('#home-category-add').click();
  await page.locator('#home-category-name').fill('casa renomeada');
  await page.locator('#home-category-save').click();
  await page.getByRole('button', { name: 'Continuar mesmo assim' }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  const dupes = (await store()).categoryCatalog.filter(
    (c) => c.name.toLowerCase() === 'casa renomeada',
  );
  assert.equal(dupes.length, 2);
  assert.notEqual(dupes[0].id, dupes[1].id);
  await row('Games').getByRole('button', { name: 'Eliminar Games' }).click();
  await page
    .getByRole('alert')
    .filter({ hasText: /em uso/ })
    .waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Eliminar', exact: true }).count(),
    0,
  );
  await page.locator('#home-category-delete-confirm').click();
  await page
    .getByRole('alert')
    .filter({ hasText: 'Escolhe a categoria de destino.' })
    .waitFor();
  const target = (await store()).categoryCatalog.find(
    (c) => c.name === 'Lazer' && !c.parentId,
  );
  await page.locator('#home-category-move-target').selectOption(target.id);
  await page.locator('#home-category-delete-confirm').click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  const moved = await store();
  assert.equal(moved.entries[0].id, 'paid');
  assert.equal(moved.entries[0].category, 'Lazer');
  assert.equal(moved.entries[0].amount, 25);
  assert.equal(moved.shopping[0].category, 'Lazer');
  assert.equal(moved.entries[0].categoryHistory[0].category, 'Games');
  await row('Casa renomeada')
    .getByRole('button', { name: 'Eliminar Casa renomeada' })
    .click();
  await close();
  assert.ok((await store()).categoryCatalog.some((c) => c.id === created.id));
  await row('Casa renomeada')
    .getByRole('button', { name: 'Eliminar Casa renomeada' })
    .click();
  await page.locator('#home-category-delete-confirm').click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.reload();
  await categories();
  assert.equal(await row('Casa renomeada').count(), 0);
  await page.locator('#home-category-kind').selectOption('income');
  await row('Salário').waitFor();
  await page.locator('#home-category-kind').selectOption('shopping');
  await row('Lazer').waitFor();
  await page.locator('#btn-toggle-theme').click();
  await page.waitForFunction(
    () =>
      document.documentElement.classList.contains('dark') &&
      getComputedStyle(document.querySelector('#app-root-shell')).color ===
        'rgb(245, 245, 245)',
  );
  await page.screenshot({ path: '/tmp/myoffice-categories-dark.png' });
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
  await page.screenshot({ path: '/tmp/myoffice-categories-mobile.png' });
  assert.deepEqual(errors, []);
  console.log(
    'Category filters, lines, drilldown, all-subcategory view, empty/filled modals, inline validation, icon search/inheritance, rename/cancel, duplicate choices, protected move/delete, persistence, dark and mobile passed.',
  );
} finally {
  await browser.close();
}
