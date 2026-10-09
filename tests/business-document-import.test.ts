import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Bank, Company, BankMovement } from '../src/types/stock';
import { HomeDocument } from '../src/types/home';
import {
  applyBusinessReceipt,
  emptyBusinessDocuments,
  businessReceiptMatches,
  validateBusinessDocuments,
} from '../src/utils/businessDocumentImport';
import {
  commitBusinessDocuments,
  recoverBusinessDocuments,
  BUSINESS_DOCUMENTS_KEY,
  BUSINESS_DOCUMENTS_JOURNAL,
} from '../src/utils/businessDocumentStorage';
import { BUSINESS_LEDGER_KEY } from '../src/utils/homeBusinessStorage';
import { draftFromSigned } from '../src/utils/homeDocumentImport';
import { todayLocal } from '../src/utils/home';
const company = {
  id: 'company',
  name: 'Empresa teste',
  status: 'ativa',
} as Company;
const bank = {
  id: 'bank',
  name: 'Banco',
  companyId: 'company',
  currency: 'Kz',
  status: 'ativo',
} as Bank;
const ledger: BankMovement[] = [
  {
    id: 'initial',
    bankId: 'bank',
    date: todayLocal() + 'T12:00:00',
    type: 'entrada',
    amount: 100,
    reason: 'Capital',
    responsible: 'Administrador',
  },
];
const row = {
  ...draftFromSigned(todayLocal(), 'Compra', -25, 'AOA'),
  category: 'Alimentação',
  reference: '123',
  fileHash: 'a'.repeat(64),
};
const doc: HomeDocument = {
  id: 'doc',
  title: 'Compra',
  fileName: 'original.pdf',
  mime: 'application/pdf',
  size: 9,
  content: btoa('%PDF-1.4\n'),
  uploadedAt: new Date().toISOString(),
  kind: 'receipt',
};
test('Business import books once, reuses renamed PDFs, preserves immutable ledger and creates/selects company budgets', () => {
  const result = applyBusinessReceipt(
    [bank],
    [company],
    ledger,
    emptyBusinessDocuments(),
    row,
    bank.id,
    doc,
    undefined,
    { limit: 100 },
  );
  assert.equal(result.movements.length, 2);
  assert.equal(result.tools.documents.length, 1);
  assert.equal(result.tools.budgets.length, 1);
  assert.deepEqual(result.movements[1], ledger[0]);
  assert.equal(result.movements[0].type, 'saida');
  assert.throws(
    () =>
      applyBusinessReceipt(
        [bank],
        [company],
        result.movements,
        result.tools,
        { ...row, amount: '30' },
        bank.id,
      ),
    /já foi adicionado/,
  );
  const same = applyBusinessReceipt(
    [bank],
    [company],
    result.movements,
    result.tools,
    row,
    bank.id,
    { ...doc, id: 'renamed', fileName: 'copy.pdf' },
    result.movements[0].id,
    { id: result.tools.budgets[0].id },
  );
  assert.equal(same.movements.length, 2);
  assert.equal(same.tools.documents.length, 1);
  assert.deepEqual(same.movements, result.movements);
  const other = {
    ...row,
    amount: '10',
    reference: '456',
    fileHash: 'b'.repeat(64),
  };
  assert.throws(
    () =>
      applyBusinessReceipt(
        [bank],
        [company],
        same.movements,
        same.tools,
        other,
        bank.id,
        undefined,
        undefined,
        { limit: 200 },
      ),
    /Já existe este orçamento/,
  );
  const next = applyBusinessReceipt(
    [bank],
    [company],
    same.movements,
    same.tools,
    other,
    bank.id,
    undefined,
    undefined,
    { id: same.tools.budgets[0].id },
  );
  assert.equal(next.tools.budgets.length, 1);
  assert.equal(next.movements.length, 3);
  assert.equal(businessReceiptMatches(next.movements, row, bank).length, 1);
  assert.deepEqual(
    validateBusinessDocuments(
      JSON.parse(JSON.stringify(next.tools)),
      next.movements,
    ),
    next.tools,
  );
});
test('Business blocks inactive companies/accounts, wrong currencies, insufficient money and incompatible budgets without mutation', () => {
  const tools = emptyBusinessDocuments(),
    before = structuredClone(ledger);
  for (const status of ['parada', 'desativada'] as const)
    assert.throws(
      () =>
        applyBusinessReceipt(
          [bank],
          [{ ...company, status }],
          ledger,
          tools,
          row,
          bank.id,
        ),
      /empresa ativa/,
    );
  assert.throws(
    () =>
      applyBusinessReceipt(
        [{ ...bank, status: 'inativo' }],
        [company],
        ledger,
        tools,
        row,
        bank.id,
      ),
    /conta ativa/,
  );
  assert.throws(
    () =>
      applyBusinessReceipt(
        [bank],
        [company],
        ledger,
        tools,
        { ...row, currency: 'USD' },
        bank.id,
      ),
    /moeda/i,
  );
  assert.throws(
    () =>
      applyBusinessReceipt(
        [bank],
        [company],
        ledger,
        tools,
        { ...row, amount: '101' },
        bank.id,
      ),
    /Saldo insuficiente/,
  );
  assert.throws(
    () =>
      applyBusinessReceipt([bank], [company], ledger, tools, row, bank.id, {
        ...doc,
        mime: 'image/png',
      }),
    /Conteúdo/,
  );
  assert.throws(
    () =>
      applyBusinessReceipt(
        [bank],
        [company],
        ledger,
        tools,
        row,
        bank.id,
        undefined,
        undefined,
        { id: 'other' },
      ),
    /empresa, categoria/,
  );
  assert.deepEqual(ledger, before);
  assert.deepEqual(tools, emptyBusinessDocuments());
});
class MemoryStorage {
  values = new Map<string, string>();
  failKey = '';
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (key === this.failKey) throw new Error('quota');
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}
test('Business receipt storage commits both documents or rolls back quota failures, and recovers interrupted writes', () => {
  const store = new MemoryStorage(),
    storage = store as unknown as Storage;
  const beforeLedger = JSON.stringify(ledger),
    beforeTools = JSON.stringify(emptyBusinessDocuments());
  store.setItem(BUSINESS_LEDGER_KEY, beforeLedger);
  store.setItem(BUSINESS_DOCUMENTS_KEY, beforeTools);
  const result = applyBusinessReceipt(
    [bank],
    [company],
    ledger,
    emptyBusinessDocuments(),
    row,
    bank.id,
    doc,
  );
  store.failKey = BUSINESS_DOCUMENTS_KEY;
  assert.throws(
    () =>
      commitBusinessDocuments(
        storage,
        beforeLedger,
        beforeTools,
        result.movements,
        result.tools,
      ),
    /interrompida/,
  );
  assert.equal(store.getItem(BUSINESS_LEDGER_KEY), beforeLedger);
  assert.ok(store.getItem(BUSINESS_DOCUMENTS_JOURNAL));
  store.failKey = '';
  recoverBusinessDocuments(storage);
  assert.equal(store.getItem(BUSINESS_DOCUMENTS_KEY), beforeTools);
  assert.equal(store.getItem(BUSINESS_DOCUMENTS_JOURNAL), null);
  commitBusinessDocuments(
    storage,
    beforeLedger,
    beforeTools,
    result.movements,
    result.tools,
  );
  assert.equal(JSON.parse(store.getItem(BUSINESS_LEDGER_KEY)!).length, 2);
  assert.equal(
    JSON.parse(store.getItem(BUSINESS_DOCUMENTS_KEY)!).documents.length,
    1,
  );
  assert.equal(store.getItem(BUSINESS_DOCUMENTS_JOURNAL), null);
  assert.throws(
    () =>
      commitBusinessDocuments(
        storage,
        beforeLedger,
        beforeTools,
        result.movements,
        result.tools,
      ),
    /noutra aba/,
  );
});
