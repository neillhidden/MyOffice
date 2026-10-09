import {
  matchHomeStatement,
  importStatementEntry,
  statementEntryMatches,
} from '../src/utils/homeExtensions';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  readImportAmount,
  tableDrafts,
  textDrafts,
  applyReceipt,
  draftsToStatements,
  receiptMatches,
  draftFromSigned,
} from '../src/utils/homeDocumentImport';
import { csvTable } from '../src/utils/financialTables';
import {
  emptyHome,
  validateHomeData,
  balances,
  todayLocal,
  addHomeEntry,
} from '../src/utils/home';
import { HomeDocument } from '../src/types/home';
const date = todayLocal();
const pt = date.split('-').reverse().join('/');
function fixture() {
  const d = emptyHome();
  d.accounts[0].openingBalance = 100;
  return validateHomeData(d);
}
test('bank debit, credit and signed amount columns never use the balance as a movement', () => {
  const rows = tableDrafts([
    ['Data', 'Descrição', 'Débito', 'Crédito', 'Saldo'],
    [pt, 'Compra', '25,00', '', '975,00'],
    [pt, 'Salário', '', '100,00', '1.075,00'],
  ]);
  assert.deepEqual(
    rows.map((r) => [r.amount, r.direction]),
    [
      ['25.00', 'expense'],
      ['100.00', 'income'],
    ],
  );
  const signed = tableDrafts(
    csvTable(
      `Data;Descrição;Valor;Saldo\n${pt};Compra;-25,00;975,00\n${pt};Salário;+100,00;1075,00`,
    ),
  );
  assert.deepEqual(
    signed.map((r) => r.direction),
    ['expense', 'income'],
  );
  assert.throws(
    () =>
      tableDrafts([
        ['Data', 'Descrição', 'Saldo'],
        [pt, 'Saldo', '100'],
      ]),
    /Saldo não é um movimento/,
  );
  assert.throws(
    () =>
      tableDrafts([
        ['Data', 'Descrição', 'Débito', 'Crédito'],
        [pt, 'Erro', '10', '20'],
      ]),
    /simultaneamente/,
  );
});
test('receipt totals exclude change and subtotal; ambiguous positive values need direction confirmation', () => {
  const [receipt] = textDrafts(
    `LOJA TESTE\nDATA ${pt}\nPAGAMENTO\nSUBTOTAL 23,00 AOA\nTOTAL AOA 25,00\nTROCO 75,00`,
    'receipt',
  );
  assert.equal(receipt.amount, '25.00');
  assert.equal(receipt.date, date);
  assert.equal(receipt.currency, 'AOA');
  assert.equal(receipt.direction, 'expense');
  const [ambiguous] = textDrafts(
    `Extrato\nData Descrição Valor Saldo\n${pt} Compra 25,00 975,00`,
    'statement',
  );
  assert.equal(ambiguous.direction, '');
  assert.throws(
    () => draftsToStatements([ambiguous], 'home-wallet', 'AOA'),
    /Escolhe Entrada/,
  );
  const signed = textDrafts(
    `${pt} Compra -25,00\n${pt} Depósito +100,00`,
    'statement',
  );
  assert.deepEqual(
    signed.map((r) => r.direction),
    ['expense', 'income'],
  );
});
test('Portuguese, international, parentheses and Unicode minus amounts normalize without guessing extra decimals', () => {
  assert.equal(readImportAmount('12.500,25 Kz'), 12500.25);
  assert.equal(readImportAmount('12,500.25 USD'), 12500.25);
  assert.equal(readImportAmount('(25,00)'), -25);
  assert.equal(readImportAmount('−25,00'), -25);
  assert.throws(() => readImportAmount('25,555'), /inválido/);
  assert.throws(() => readImportAmount('0,00'), /válido/);
});
const document: HomeDocument = {
  id: 'original',
  title: 'Comprovativo',
  fileName: 'r.pdf',
  mime: 'application/pdf',
  size: 9,
  content: btoa('%PDF-1.4\n'),
  uploadedAt: new Date().toISOString(),
  kind: 'receipt',
};
test('applying a reviewed receipt posts and attaches atomically, while duplicate association never double debits', () => {
  let d = fixture();
  const row = {
    ...draftFromSigned(date, 'Loja', -25, 'AOA'),
    category: 'Alimentação',
  };
  d = applyReceipt(d, row, 'home-wallet', document);
  assert.equal(balances(d)['home-wallet'], 75);
  assert.equal(d.documents![0].entityId, d.entries[0].id);
  assert.equal(d.documents![0].entityType, 'entry');
  assert.equal(d.entries[0].amount, 25);
  assert.throws(() => applyReceipt(d, row, 'home-wallet'), /Já existe/);
  assert.equal(receiptMatches(d, row, 'home-wallet').length, 1);
  const match = d.entries[0].id;
  d = applyReceipt(
    d,
    row,
    'home-wallet',
    { ...document, id: 'another' },
    match,
  );
  assert.equal(d.entries.length, 1);
  assert.equal(balances(d)['home-wallet'], 75);
  assert.equal(d.documents!.length, 2);
  assert.throws(
    () => applyReceipt(d, row, 'home-wallet', undefined, 'invalid'),
    /corresponde/,
  );
  assert.deepEqual(validateHomeData(JSON.parse(JSON.stringify(d))), d);
});
test('invalid receipts and currency differences cannot alter cash, and failed file validation leaves no orphan expense', () => {
  const d = fixture();
  const row = {
    ...draftFromSigned(date, 'Loja', -25, 'AOA'),
    category: 'Alimentação',
  };
  const before = structuredClone(d);
  assert.throws(
    () => applyReceipt(d, { ...row, currency: 'USD' }, 'home-wallet'),
    /moeda/,
  );
  assert.throws(
    () => applyReceipt(d, { ...row, amount: '101' }, 'home-wallet'),
    /saldo/,
  );
  assert.throws(
    () =>
      applyReceipt(d, row, 'home-wallet', { ...document, mime: 'image/png' }),
    /Conteúdo/,
  );
  assert.throws(
    () => applyReceipt(d, { ...row, category: 'inexistente' }, 'home-wallet'),
    /categoria/,
  );
  assert.deepEqual(d, before);
});
test('reviewed bank drafts preserve +/- signs and pass through the existing idempotent staging without ledger effects', () => {
  const d = fixture();
  const rows = [
    draftFromSigned(date, 'Compra', -25, 'AOA'),
    draftFromSigned(date, 'Salário', 100, 'AOA'),
  ];
  const staged = draftsToStatements(rows, 'home-wallet', 'AOA');
  assert.deepEqual(
    staged.map((r) => r.amount),
    [-25, 100],
  );
  assert.deepEqual(
    draftsToStatements(rows, 'home-wallet', 'AOA').map((r) => r.fingerprint),
    staged.map((r) => r.fingerprint),
  );
  assert.equal(d.entries.length, 0);
  assert.equal(balances(d)['home-wallet'], 100);
});

test('reader staging preserves bank references and a changed fingerprint cannot create a second already-conferred debit', () => {
  const rows = tableDrafts([
    ['Data', 'Descrição', 'Valor', 'Referência'],
    [date, 'Compra', '-25,00', 'bank-ref'],
  ]);
  const staged = draftsToStatements(rows, 'home-wallet', 'AOA');
  assert.equal(staged[0].reference, 'bank-ref');
  let d = addHomeEntry(fixture(), {
    type: 'expense',
    amount: 25,
    date,
    title: 'Compra',
    category: 'Alimentação',
    accountId: 'home-wallet',
  });
  d.statementRows = staged;
  d = matchHomeStatement(d, staged[0].id, d.entries[0].id);
  const repeated = draftsToStatements(
    [{ ...rows[0], title: 'Outra descrição', reference: 'other-ref' }],
    'home-wallet',
    'AOA',
  )[0];
  d.statementRows!.push(repeated);
  assert.equal(statementEntryMatches(d, repeated).length, 0);
  const before = structuredClone(d);
  assert.throws(
    () => importStatementEntry(d, repeated.id, 'Alimentação'),
    /já conferidos/,
  );
  assert.deepEqual(d, before);
  assert.equal(balances(d)['home-wallet'], 75);
});

test('MULTICAIXA-like labelled receipts work in statements without mixing signature dates or bank balances', () => {
  const content = `Digitally signed by example\nDate: 2026.10.08 19:17:32\nComprovativo Digital\nDetalhe da operação realizada através do canal bancário.\nData - Hora\n${date} 13:59:23\nOperação\nCompra\nComerciante\nLOJA DE TESTE\nMontante\n1.000,00 Kz\nTransacção\n123456\nSaldo disponível 9.000,00 Kz`;
  for (const mode of ['statement', 'receipt'] as const) {
    const rows = textDrafts(content, mode);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].date, date);
    assert.equal(rows[0].amount, '1000.00');
    assert.equal(rows[0].direction, 'expense');
    assert.equal(rows[0].currency, 'AOA');
    assert.equal(rows[0].title, 'LOJA DE TESTE');
    assert.equal(rows[0].reference, '123456');
  }
  const inline = content
    .replace('Montante\n', 'Montante ')
    .replace('Comerciante\n', 'Comerciante ');
  assert.equal(textDrafts(inline, 'statement')[0].amount, '1000.00');
  // A transfer receipt alone does not identify whether the user sent or received money.
  assert.equal(
    textDrafts(content.replace('Compra', 'Transferência'), 'statement')[0]
      .direction,
    '',
  );
  assert.deepEqual(
    textDrafts('Comprovativo Digital\nSaldo 1.000,00 Kz', 'statement'),
    [],
  );
});
