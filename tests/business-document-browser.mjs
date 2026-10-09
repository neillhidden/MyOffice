import ExcelJS from 'exceljs';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pdfText } from './fixtures/financial-pdf.mjs';
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
  }),
  page = await context.newPage();
page.setDefaultTimeout(20000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const today = new Date().toLocaleDateString('en-CA');
const pdf = process.env.HOME_BUSINESS_RECEIPT
  ? await readFile(process.env.HOME_BUSINESS_RECEIPT)
  : pdfText([
      ['Comprovativo Digital', 40, 790],
      ['Data - Hora', 40, 750],
      [today + ' 13:59:23', 40, 730],
      ['Operacao Compra', 40, 700],
      ['Comerciante LOJA TESTE', 40, 660],
      ['Montante 1.000,00 Kz', 40, 620],
      ['Transaccao 123456', 40, 580],
    ]);
const ledger = () =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem('myoffice_estoque_bankMovements')),
  );
const tools = () =>
  page.evaluate(() =>
    JSON.parse(
      localStorage.getItem('myoffice-business-documents-v1') || 'null',
    ),
  );
const apply = async () => {
  await page
    .getByRole('button', { name: 'Rever e aplicar no Business', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Aplicar', exact: true })
    .click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
};
try {
  await context.addInitScript(() => {
    localStorage.setItem('myoffice_estoque_is_fresh_install', 'true');
    if (!localStorage.getItem('myoffice_estoque_bankMovements'))
      localStorage.setItem(
        'myoffice_estoque_bankMovements',
        JSON.stringify([
          {
            id: 'test-capital',
            bankId: 'bank-1',
            type: 'entrada',
            amount: 2000,
            date: new Date().toISOString(),
            reason: 'Capital teste',
            responsible: 'Administrador',
          },
        ]),
      );
  });
  await page.goto(
    process.env.HOME_TEST_URL || 'http://127.0.0.1:4199/MyOffice/',
  );
  await page.locator('#nav-item-financeiro').click();
  await page.locator('#subnav-financeiro-documentos-tab').click();
  await page
    .getByLabel('Conta empresarial do documento')
    .selectOption('bank-1');
  await page.getByLabel('Ler ficheiro Business').setInputFiles({
    name: 'comprovativo.pdf',
    mimeType: 'application/pdf',
    buffer: pdf,
  });
  await page.getByLabel('Valor sem sinal Business 1').waitFor();
  assert.equal(
    await page.getByLabel('Valor sem sinal Business 1').inputValue(),
    '1000.00',
  );
  assert.equal(
    await page.getByLabel('Sentido Business 1').inputValue(),
    'expense',
  );
  assert.equal((await ledger()).length, 1);
  await page.getByLabel('Categoria Business 1').selectOption('Alimentação');
  await page.getByLabel('Orçamento Business 1').selectOption('new');
  await page.getByLabel('Limite do orçamento Business 1').fill('1500');
  await apply();
  assert.equal((await ledger()).length, 2);
  assert.equal((await tools()).documents.length, 1);
  assert.equal((await tools()).budgets.length, 1);
  const original = await ledger();
  // Renaming a repeated PDF cannot create another archive or debit.
  await page.getByLabel('Ler ficheiro Business').setInputFiles({
    name: 'renomeado.pdf',
    mimeType: 'application/pdf',
    buffer: pdf,
  });
  await page.getByLabel('Lançamento compatível Business 1').waitFor();
  await page
    .getByLabel('Lançamento compatível Business 1')
    .selectOption(original[0].id);
  await page
    .getByLabel('Orçamento Business 1')
    .selectOption((await tools()).budgets[0].id);
  await apply();
  assert.deepEqual(await ledger(), original);
  assert.equal((await tools()).documents.length, 1);
  // Table preview is editable; one explicit confirmation books the complete batch.
  const csv = `Data;Descrição;Débito;Crédito;Saldo;Referência\n${today};Internet;100,00;;900,00;internet-1\n${today};Recebimento;;200,00;1100,00;income-1`;
  await page.getByLabel('Ler ficheiro Business').setInputFiles({
    name: 'extrato.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });
  await page.getByLabel('Valor sem sinal Business 2').waitFor();
  assert.equal(
    await page.getByLabel('Valor sem sinal Business 1').inputValue(),
    '100.00',
  );
  assert.equal(
    await page.getByLabel('Sentido Business 2').inputValue(),
    'income',
  );
  await page.getByLabel('Categoria Business 1').selectOption('Serviços');
  await page.getByLabel('Categoria Business 2').selectOption('Venda');
  await apply();
  assert.equal((await ledger()).length, 4);
  assert.equal((await tools()).documents.length, 1);
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Notas').addRow(['Notas de exportação']);
  const worksheet = workbook.addWorksheet('Movimentos');
  worksheet.addRow(['Data', 'Descrição', 'Valor', 'Referência']);
  worksheet.addRow([today, 'Rendimento Excel', '300,00', 'excel-300']);
  await page
    .getByLabel('Ler ficheiro Business')
    .setInputFiles({
      name: 'extrato.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    });
  await page.getByLabel('Folha do Excel Business').waitFor();
  await page.getByLabel('Folha do Excel Business').selectOption('1');
  await page.getByLabel('Categoria Business 1').selectOption('Venda');
  assert.equal(
    await page.getByLabel('Valor sem sinal Business 1').inputValue(),
    '300.00',
  );
  await apply();
  assert.equal((await ledger()).length, 5);
  const photoPage = await context.newPage();
  await photoPage.setViewportSize({ width: 1100, height: 550 });
  await photoPage.setContent(
    `<div style="font:44px Arial;color:black;background:white;padding:45px"><p>LOJA FOTOGRAFIA</p><p>DATA ${today.split('-').reverse().join('/')}</p><p>PAGAMENTO</p><p>TOTAL AOA 50,00</p></div>`,
  );
  const photo = await photoPage.screenshot();
  await photoPage.close();
  await page
    .getByLabel('Ler ficheiro Business')
    .setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: photo });
  await page
    .getByLabel('Valor sem sinal Business 1')
    .waitFor({ timeout: 90000 });
  assert.equal(
    await page.getByLabel('Valor sem sinal Business 1').inputValue(),
    '50.00',
  );
  await page
    .getByLabel('Orçamento Business 1')
    .selectOption((await tools()).budgets[0].id);
  await apply();
  assert.equal((await ledger()).length, 6);
  assert.equal((await tools()).documents.length, 2);
  assert.equal(await page.locator('#home-nav-1').count(), 0);
  await page.reload();
  await page.locator('#nav-item-financeiro').click();
  await page.locator('#subnav-financeiro-documentos-tab').click();
  assert.equal((await tools()).budgets[0].limit, 1500);
  assert.equal((await ledger()).length, 6);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    'Business PDF receipt, renamed duplicate, immutable ledger association, new/existing budget, CSV debit/credit vs balance, real Excel and photo OCR, batch confirmation, persistence and phone passed.',
  );
} finally {
  await browser.close();
}
