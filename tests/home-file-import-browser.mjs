import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import ExcelJS from 'exceljs';
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
page.setDefaultTimeout(20000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const today = new Date().toLocaleDateString('en-CA'),
  pt = today.split('-').reverse().join('/');
function pdfText(items) {
  const escaped = (s) =>
    s.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
  const stream = items
    .map(([s, x, y]) => `BT /F1 12 Tf ${x} ${y} Td (${escaped(s)}) Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Count 1 /Kids [3 0 R] >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let out = '%PDF-1.4\n',
    offsets = [];
  objects.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 6\n0000000000 65535 f \n${offsets.map((n) => String(n).padStart(10, '0') + ' 00000 n ').join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}
const receipt = pdfText([
  ['LOJA PDF', 40, 790],
  [`DATA ${pt}`, 40, 750],
  ['PAGAMENTO', 40, 710],
  ['TOTAL AOA 25,00', 40, 670],
]);
const bank = pdfText([
  ['Data', 40, 790],
  ['Descricao', 120, 790],
  ['Debito', 340, 790],
  ['Credito', 410, 790],
  ['Saldo', 485, 790],
  [pt, 40, 750],
  ['Compra PDF', 120, 750],
  ['25,00', 340, 750],
  ['175,00', 485, 750],
  [pt, 40, 710],
  ['Salario', 120, 710],
  ['100,00', 410, 710],
  ['275,00', 485, 710],
]);
const nav = (i) => page.locator('#home-nav-' + i).click();
const data = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem('myoffice-home-v1')));
const receiptReader = () =>
  page.getByRole('region', { name: 'Leitura de comprovativos' });
const statementReader = () =>
  page.getByRole('region', { name: 'Leitura de extratos' });
async function applyReceiptUI() {
  await receiptReader()
    .getByRole('button', { name: 'Rever e aplicar movimento', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Aplicar', exact: true })
    .click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
}
try {
  await context.addInitScript(() => {
    if (!localStorage.getItem('myoffice-home-v1'))
      localStorage.setItem(
        'myoffice-home-v1',
        JSON.stringify({
          version: 1,
          name: 'Teste leitura',
          accounts: [
            {
              id: 'a',
              name: 'Carteira Kz',
              currency: 'AOA',
              kind: 'current',
              openingBalance: 200,
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
          bills: [],
          budgets: [],
          goals: [],
          tasks: [],
        }),
      );
  });
  await page.goto(
    process.env.HOME_TEST_URL || 'http://127.0.0.1:4199/MyOffice/',
  );
  await page.locator('#mode-btn-home').click();
  await nav(13);
  await page.getByLabel('Carteira do comprovativo').selectOption('a');
  await page
    .getByLabel('Ler ficheiro de comprovativo')
    .setInputFiles({
      name: 'compra.pdf',
      mimeType: 'application/pdf',
      buffer: receipt,
    });
  await page.getByLabel('Valor lido 1').waitFor();
  assert.equal(await page.getByLabel('Valor lido 1').inputValue(), '25.00');
  assert.equal(await page.getByLabel('Data lida 1').inputValue(), today);
  assert.equal(await page.getByLabel('Sentido lido 1').inputValue(), 'expense');
  assert.equal((await data()).entries.length, 0);
  await page
    .getByLabel('Categoria do comprovativo', { exact: true })
    .selectOption('Alimentação');
  await applyReceiptUI();
  assert.equal((await data()).entries[0].amount, 25);
  assert.equal(
    (await data()).documents[0].entityId,
    (await data()).entries[0].id,
  );
  // Re-reading the receipt associates it to the existing expense, never another debit.
  await page
    .getByLabel('Ler ficheiro de comprovativo')
    .setInputFiles({
      name: 'copia.pdf',
      mimeType: 'application/pdf',
      buffer: receipt,
    });
  await page.getByLabel('Lançamento compatível').waitFor();
  await page
    .getByLabel('Lançamento compatível')
    .selectOption((await data()).entries[0].id);
  await applyReceiptUI();
  assert.equal((await data()).entries.length, 1);
  assert.equal((await data()).documents.length, 2);
  // Bank PDF with debit/credit/balance columns reads the movements instead of account balances.
  await nav(12);
  await page
    .getByLabel('Carteira do extrato', { exact: true })
    .selectOption('a');
  await page
    .getByLabel('Ler ficheiro de extrato')
    .setInputFiles({
      name: 'banco.pdf',
      mimeType: 'application/pdf',
      buffer: bank,
    });
  await page.getByLabel('Valor lido 2').waitFor();
  assert.equal(await page.getByLabel('Valor lido 1').inputValue(), '25.00');
  assert.equal(await page.getByLabel('Sentido lido 1').inputValue(), 'expense');
  assert.equal(await page.getByLabel('Valor lido 2').inputValue(), '100.00');
  assert.equal(await page.getByLabel('Sentido lido 2').inputValue(), 'income');
  await statementReader()
    .getByRole('button', {
      name: 'Enviar movimentos revistos para conferência',
      exact: true,
    })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Aplicar', exact: true })
    .click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page
    .getByRole('button', { name: 'Importar para conferência', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Guardar', exact: true })
    .click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.deepEqual(
    (await data()).statementRows.map((r) => r.amount),
    [-25, 100],
  );
  assert.equal((await data()).entries.length, 1);
  // Real XLSX, numeric and Date cells, multiple sheets and signed values.
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Notas').addRow(['Texto']);
  const sheet = workbook.addWorksheet('Movimentos');
  sheet.addRow(['Data', 'Descrição', 'Valor', 'Saldo']);
  sheet.addRow([new Date(today + 'T12:00:00Z'), 'Excel saída', -20, 255]);
  sheet.addRow([new Date(today + 'T12:00:00Z'), 'Excel entrada', 80, 335]);
  const xlsx = Buffer.from(await workbook.xlsx.writeBuffer());
  await page
    .getByLabel('Ler ficheiro de extrato')
    .setInputFiles({
      name: 'banco.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: xlsx,
    });
  await page.getByLabel('Folha do Excel').waitFor();
  await page.getByLabel('Folha do Excel').selectOption('1');
  assert.equal(await page.getByLabel('Valor lido 1').inputValue(), '20.00');
  assert.equal(await page.getByLabel('Sentido lido 1').inputValue(), 'expense');
  assert.equal(await page.getByLabel('Valor lido 2').inputValue(), '80.00');
  assert.equal(await page.getByLabel('Data lida 1').inputValue(), today);
  const csv = `Data;Descrição;Débito;Crédito;Saldo\n${pt};CSV saída;5,00;;330,00\n${pt};CSV entrada;;10,00;340,00`;
  await page
    .getByLabel('Ler ficheiro de extrato')
    .setInputFiles({
      name: 'banco.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv),
    });
  await page.getByLabel('Descrição lida 1').waitFor();
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Descrição lida 1"]')?.value ===
      'CSV saída',
  );
  assert.equal(await page.getByLabel('Valor lido 1').inputValue(), '5.00');
  assert.equal(await page.getByLabel('Sentido lido 2').inputValue(), 'income');
  // Real OCR from an image, with local worker/WASM/model. No external API request.
  const imagePage = await context.newPage();
  await imagePage.setViewportSize({ width: 1100, height: 550 });
  await imagePage.setContent(
    `<div style="font:44px Arial;color:#000;background:white;padding:45px;width:950px"><p>LOJA FOTOGRAFIA</p><p>DATA ${pt}</p><p>PAGAMENTO</p><p>TOTAL AOA 15,00</p></div>`,
  );
  const photograph = await imagePage.screenshot();
  const jpeg = await imagePage.screenshot({ type: 'jpeg', quality: 95 });
  await imagePage.close();
  await writeFile('/tmp/myoffice-ocr-fixture.png', photograph);
  await nav(13);
  await page.getByLabel('Carteira do comprovativo').selectOption('a');
  const outgoing = [];
  page.on('request', (r) => {
    if (
      !r.url().startsWith(new URL(page.url()).origin) &&
      !r.url().startsWith('blob:') &&
      !r.url().startsWith('data:')
    )
      outgoing.push(r.url());
  });
  await page
    .getByLabel('Ler ficheiro de comprovativo')
    .setInputFiles({
      name: 'fotografia.png',
      mimeType: 'image/png',
      buffer: photograph,
    });
  await page.getByLabel('Valor lido 1').waitFor({ timeout: 90000 });
  assert.equal(await page.getByLabel('Valor lido 1').inputValue(), '15.00');
  assert.equal(await page.getByLabel('Sentido lido 1').inputValue(), 'expense');
  await page
    .getByLabel('Categoria do comprovativo', { exact: true })
    .selectOption('Alimentação');
  await applyReceiptUI();
  assert.equal((await data()).entries.length, 2);
  assert.equal((await data()).documents.length, 3);
  assert.deepEqual(outgoing, []);
  // Scanned PDF runs the OCR fallback and detects the same existing expense.
  const imageStream = `q 595 0 0 297 0 400 cm /Im0 Do Q`;
  const scanObjects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Count 1 /Kids [3 0 R] >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>',
    `<< /Type /XObject /Subtype /Image /Width 1100 /Height 550 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n${jpeg.toString('latin1')}\nendstream`,
    `<< /Length ${imageStream.length} >>\nstream\n${imageStream}\nendstream`,
  ];
  let scan = '%PDF-1.4\n';
  const scanOffsets = [];
  scanObjects.forEach((o, i) => {
    scanOffsets.push(scan.length);
    scan += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const scanXref = scan.length;
  scan += `xref\n0 6\n0000000000 65535 f \n${scanOffsets.map((n) => String(n).padStart(10, '0') + ' 00000 n ').join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${scanXref}\n%%EOF`;
  await page
    .getByLabel('Ler ficheiro de comprovativo')
    .setInputFiles({
      name: 'digitalizado.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(scan, 'latin1'),
    });
  await page.getByLabel('Valor lido 1').waitFor({ timeout: 90000 });
  assert.equal(await page.getByLabel('Valor lido 1').inputValue(), '15.00');
  await page.getByLabel('Lançamento compatível').waitFor();
  assert.equal((await data()).entries.length, 2);
  await receiptReader()
    .getByRole('button', { name: 'Adicionar movimento manual', exact: true })
    .click();
  // Manual/pasted review and unknown direction; no automatic posting.
  await receiptReader()
    .getByText('Colar ou corrigir texto', { exact: true })
    .click();
  await page
    .getByLabel('Texto do documento')
    .fill(`COMPROVATIVO\nDATA ${pt}\nTOTAL AOA 10,00`);
  await receiptReader()
    .getByRole('button', { name: 'Interpretar texto', exact: true })
    .click();
  assert.equal(await page.getByLabel('Sentido lido 1').inputValue(), '');
  await receiptReader()
    .getByRole('button', { name: 'Rever e aplicar movimento', exact: true })
    .click();
  await receiptReader().getByRole('alert').waitFor();
  assert.equal((await data()).entries.length, 2);
  await page.getByLabel('Sentido lido 1').selectOption('expense');
  await page.getByLabel('Descrição lida 1').fill('Manual');
  await page
    .getByLabel('Categoria do comprovativo', { exact: true })
    .selectOption('Alimentação');
  await applyReceiptUI();
  assert.equal((await data()).entries.length, 3);
  await page.reload();
  assert.equal((await data()).documents.length, 3);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#sidebar-brand-toggle').click();
  await nav(12);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    ),
    false,
  );
  await page.screenshot({ path: '/tmp/myoffice-file-import-mobile.png' });
  assert.deepEqual(errors, []);
  console.log(
    'PDF text, real XLSX and CSV, local photograph OCR, debit/credit vs balance, explicit review, atomic receipt links, duplicates, manual text, persistence and phone passed.',
  );
} finally {
  await browser.close();
}
