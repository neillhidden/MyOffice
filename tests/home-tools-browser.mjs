import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
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
const today = new Date().toLocaleDateString('en-CA');
const nav = (i) => page.locator('#home-nav-' + i).click();
const field = (k, v) => page.locator('#home-tool-' + k).fill(v);
const select = (k, v) => page.locator('#home-tool-' + k).selectOption(v);
const data = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem('myoffice-home-v1')));
async function save() {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Guardar', exact: true })
    .click();
  try {
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
  } catch (e) {
    console.error(await page.getByRole('dialog').innerText());
    throw e;
  }
}
try {
  await context.addInitScript(() => {
    if (!localStorage.getItem('myoffice-home-v1'))
      localStorage.setItem(
        'myoffice-home-v1',
        JSON.stringify({
          version: 1,
          name: 'Teste ferramentas',
          accounts: [
            {
              id: 'a',
              name: 'Carteira Kz',
              currency: 'AOA',
              kind: 'current',
              openingBalance: 1000,
            },
            {
              id: 'u',
              name: 'Carteira USD',
              currency: 'USD',
              kind: 'current',
              openingBalance: 100,
            },
          ],
          entries: [],
          budgets: [],
          bills: [],
          goals: [],
          tasks: [],
        }),
      );
  });
  await page.goto(process.env.HOME_TEST_URL || 'http://127.0.0.1:4191/');
  await page.locator('#mode-btn-home').click();
  // Existing task creation remains available, with detailed scheduling attached.
  await nav(5);
  await page.locator('#home-add').click();
  await page.locator('#home-field-title').fill('Limpar a casa');
  await page.locator('#home-field-date').fill(today);
  await page.locator('#home-field-category').selectOption('Casa');
  await page.locator('#home-save').click();
  await page
    .getByRole('button', {
      name: 'Detalhes da tarefa Limpar a casa',
      exact: true,
    })
    .click();
  await field('time', '08:30');
  await select('priority', 'high');
  await field('assignee', 'Ana');
  await select('frequency', 'weekly');
  await select('end', 'count');
  await field('count', '3');
  await save();
  await page
    .getByRole('checkbox', {
      name: 'Concluir ocorrência Limpar a casa ' + today,
      exact: true,
    })
    .check();
  assert.equal((await data()).tasks[0].done, true);
  assert.equal((await data()).tasks[0].assignee, 'Ana');
  await page.getByLabel('Vista do calendário pessoal').selectOption('week');
  await page
    .getByRole('button', { name: 'Período seguinte', exact: true })
    .click();
  const nextDate = new Date(Date.parse(today) + 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  assert.equal(
    await page
      .getByRole('checkbox', {
        name: 'Concluir ocorrência Limpar a casa ' + nextDate,
        exact: true,
      })
      .isChecked(),
    false,
  );
  await page.getByRole('button', { name: 'Hoje', exact: true }).click();
  // Debt CRUD, cent installments, partial payment and compensation.
  await nav(9);
  await page
    .getByRole('button', { name: 'Nova dívida pessoal', exact: true })
    .click();
  assert.equal(await page.locator('#home-tool-principal').inputValue(), '');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Guardar', exact: true })
    .click();
  assert.ok(await page.getByRole('dialog').getByRole('alert').count()); // required inline errors keep dialog open
  await field('title', 'Consola');
  await field('person', 'Loja Games');
  await select('type', 'payable');
  await field('principal', '300');
  await select('currency', 'AOA');
  await field('issueDate', today);
  await field('dueDate', today);
  await field('installmentCount', '3');
  await field('firstInstallment', today);
  await save();
  assert.equal((await data()).entries.length, 0);
  await page.getByRole('button', { name: 'Pagar', exact: true }).click();
  await field('amount', '50');
  await field('date', today);
  await select('accountId', 'a');
  await save();
  assert.equal((await data()).entries[0].type, 'debt_out');
  assert.equal((await data()).debtPayments.length, 1);
  await page.getByText('Prestações e pagamentos', { exact: true }).click();
  await page.getByRole('button', { name: 'Estornar', exact: true }).click();
  await field('reason', 'Teste de correção');
  await save();
  assert.equal((await data()).entries[0].type, 'reversal');
  // Projections do not post money; deleted plans recover with IDs.
  await nav(10);
  await page
    .getByRole('button', { name: 'Nova previsão', exact: true })
    .click();
  await field('title', 'Compra futura');
  await select('type', 'expense');
  await field('amount', '75');
  await select('currency', 'AOA');
  await field('date', today);
  await select('accountId', 'a');
  await select('category', 'Alimentação');
  await save();
  assert.equal((await data()).entries.length, 2);
  const planId = (await data()).plans[0].id;
  await page
    .getByRole('button', { name: 'Editar previsão Compra futura', exact: true })
    .click();
  await field('amount', '100');
  await save();
  await page
    .getByRole('button', {
      name: 'Eliminar previsão Compra futura',
      exact: true,
    })
    .click();
  await save();
  await nav(8);
  await page.getByLabel('Tipo de histórico').selectOption('plan');
  await page
    .getByRole('button', { name: 'Recuperar eliminado', exact: true })
    .click();
  await save();
  assert.equal((await data()).plans[0].id, planId);
  assert.equal((await data()).plans[0].deletedAt, undefined);
  await page
    .getByText(/Versão anterior a/)
    .first()
    .click();
  await page
    .getByRole('button', { name: 'Recuperar esta versão', exact: true })
    .first()
    .click();
  await save();
  assert.equal((await data()).plans[0].amount, 75);
  // CSV staging, creating a reviewed expense, duplicate detection and matching.
  await nav(12);
  await page
    .getByLabel('Carteira do extrato', { exact: true })
    .selectOption('a');
  const csv = `Data;Descrição;Valor;Referência\n${today};Mercado;-20;one`;
  await page
    .getByLabel('Selecionar extrato CSV')
    .setInputFiles({
      name: 'extrato.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv),
    });
  await page
    .getByRole('button', { name: 'Importar para conferência', exact: true })
    .click();
  await save();
  assert.equal((await data()).entries.length, 2);
  await page
    .getByRole('button', { name: 'Criar lançamento', exact: true })
    .click();
  await select('category', 'Alimentação');
  await save();
  assert.equal((await data()).entries.length, 3);
  assert.equal((await data()).statementRows[0].state, 'matched');
  await page
    .getByLabel('Selecionar extrato CSV')
    .setInputFiles({
      name: 'extrato.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv),
    });
  assert.equal(
    await page
      .getByRole('button', { name: 'Importar para conferência', exact: true })
      .isDisabled(),
    true,
  );
  await page.getByLabel('Estado do extrato').selectOption('matched');
  await page
    .getByRole('button', { name: 'Voltar a pendente', exact: true })
    .click();
  await save();
  await page.getByLabel('Estado do extrato').selectOption('pending');
  await page
    .getByRole('button', { name: 'Conferir: Mercado', exact: true })
    .click();
  await save();
  assert.equal((await data()).entries.length, 3);
  // Real CSV/PDF downloads, PDF parsing and year report.
  await nav(11);
  assert.ok((await page.getByText('Despesas', { exact: true }).count()) > 0);
  const pdfPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar PDF', exact: true }).click();
  const pdf = await pdfPromise;
  await pdf.saveAs('/tmp/myoffice-home-tools-report.pdf');
  assert.ok(
    (await readFile('/tmp/myoffice-home-tools-report.pdf'))
      .subarray(0, 5)
      .equals(Buffer.from('%PDF-')),
  );
  const pdfText = execFileSync(
    'pdftotext',
    ['/tmp/myoffice-home-tools-report.pdf', '-'],
    { encoding: 'utf8' },
  );
  assert.ok(pdfText.includes('Mercado'));
  assert.ok(pdfText.includes('Relatório'));
  const csvPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV', exact: true }).click();
  const exported = await csvPromise;
  await exported.saveAs('/tmp/myoffice-home-tools-report.csv');
  assert.ok(
    (await readFile('/tmp/myoffice-home-tools-report.csv', 'utf8')).includes(
      'Mercado',
    ),
  );
  await page.getByLabel('Período do relatório').selectOption('year');
  // Real file persisted and included in Home JSON, metadata edits and recovery.
  await nav(13);
  await page.getByLabel('Título do documento').fill('Fatura Games');
  await page.getByLabel('Tipo de documento').selectOption('invoice');
  await page
    .getByLabel('Ficheiro do documento')
    .setInputFiles({
      name: 'fatura.pdf',
      mimeType: 'application/pdf',
      buffer: await readFile('/tmp/myoffice-home-tools-report.pdf'),
    });
  await page.getByLabel('Validade do documento').fill(today);
  await page
    .getByLabel('Associação do documento')
    .selectOption('debt:' + (await data()).debts[0].id);
  await page
    .getByRole('button', { name: 'Guardar documento', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Descarregar ficheiro', exact: true })
    .waitFor();
  assert.equal((await data()).documents.length, 1);
  const encoded = (await data()).documents[0].content;
  await page
    .getByRole('button', { name: 'Editar documento Fatura Games', exact: true })
    .click();
  await field('title', 'Fatura Consola');
  await save();
  assert.equal((await data()).documents[0].edits[0].before.content, undefined);
  await page
    .getByRole('button', {
      name: 'Eliminar documento Fatura Consola',
      exact: true,
    })
    .click();
  await save();
  await nav(8);
  await page.getByLabel('Tipo de histórico').selectOption('document');
  await page
    .getByRole('button', { name: 'Recuperar eliminado', exact: true })
    .click();
  await save();
  assert.equal((await data()).documents[0].content, encoded);
  await page.reload();
  await nav(13);
  assert.ok(await page.getByText('Fatura Consola', { exact: true }).count());
  // All new pages stay within the phone viewport; dark and scroll remain usable.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#sidebar-brand-toggle').click();
  await page.locator('#btn-toggle-theme').click();
  for (const i of [5, 8, 9, 10, 11, 12, 13]) {
    await nav(i);
    await page.waitForTimeout(100);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    assert.equal(overflow, false, 'Overflow in Home page ' + i);
  }
  await page.screenshot({
    path: '/tmp/myoffice-home-tools-mobile.png',
    fullPage: false,
  });
  assert.deepEqual(errors, []);
  console.log(
    'All eight Home additions passed in Chromium: calendar/tasks, revisions, debts, forecasting, CSV reconciliation, reports/PDF, documents, persistence, phone and dark layout.',
  );
} finally {
  await browser.close();
}
