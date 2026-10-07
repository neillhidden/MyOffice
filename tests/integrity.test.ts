import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createId } from '../src/utils/ids';
import { createReversal, migrateFinancialAudit } from '../src/utils/financialAudit';
import { validateSaleItem } from '../src/utils/saleValidation';
import { INITIAL_PRODUCTS } from '../src/data/seedData';
import type { BankMovement } from '../src/types/stock';

const original: BankMovement = { id: 'old-id', bankId: 'bank-1', type: 'entrada', amount: 120, date: '2026-10-01T12:00:00Z', reason: 'Receita', responsible: 'Operador', debtId: 'debt-1' };
const product = INITIAL_PRODUCTS.find((p) => p.status === 'ativo' && p.variations.length === 0)!;

test('IDs remain unique in the same millisecond and ten seconds apart', () => {
  const clock = Date.now;
  try {
    Date.now = () => 100000;
    const ids = Array.from({ length: 10000 }, () => createId('VND'));
    Date.now = () => 110000;
    ids.push(createId('VND'));
    assert.equal(new Set(ids).size, ids.length);
    assert.match(ids[0], /^VND-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  } finally { Date.now = clock; }
});

test('invalid quantities and prices cannot enter a sale', () => {
  const item = { productId: product.id, quantity: 1, unitPrice: 100 };
  for (const quantity of [-1, 0, NaN, Infinity, -Infinity]) assert.throws(() => validateSaleItem({ ...item, quantity }, INITIAL_PRODUCTS));
  for (const unitPrice of [-1, NaN, Infinity]) assert.throws(() => validateSaleItem({ ...item, unitPrice }, INITIAL_PRODUCTS));
  assert.throws(() => validateSaleItem({ ...item, productId: 'missing' }, INITIAL_PRODUCTS));
  assert.throws(() => validateSaleItem({ ...item, variationId: 'missing' }, INITIAL_PRODUCTS));
  assert.throws(() => validateSaleItem({ ...item, quantity: Number.MAX_VALUE, unitPrice: Number.MAX_VALUE }, INITIAL_PRODUCTS));
  assert.doesNotThrow(() => validateSaleItem({ ...item, unitPrice: 0 }, INITIAL_PRODUCTS));
});

test('fractional quantities remain supported for weighted goods', () => {
  assert.doesNotThrow(() => validateSaleItem({ productId: product.id, quantity: 0.5, unitPrice: 100 }, [{ ...product, unitOfMeasure: 'kg' }]));
});

test('reversals preserve original amounts and compensate every supported movement type', () => {
  for (const type of ['entrada', 'saida', 'ajuste', 'transferencia'] as const) {
    const entry = { ...original, type };
    const before = structuredClone(entry);
    const reversal = createReversal(entry, 'Correção');
    assert.deepEqual(entry, before);
    assert.equal(reversal.reversalOfId, entry.id);
    assert.equal(reversal.bankId, entry.bankId);
    assert.equal(reversal.debtId, entry.debtId);
    const effect = (m: BankMovement) => m.type === 'saida' ? -m.amount : m.amount;
    assert.equal(effect(entry) + effect(reversal), 0);
  }
  assert.throws(() => createReversal(original, '  '));
});

test('legacy removals migrate idempotently without changing the previous balance', () => {
  const removed = { ...original, isRemoved: true, removedAt: '2026-10-02T12:00:00Z', removedReason: 'Duplicado' };
  const migrated = migrateFinancialAudit([removed]);
  assert.equal(migrated.length, 2);
  assert.equal(migrated.find((m) => m.id === original.id)?.amount, original.amount);
  assert.equal(migrated.find((m) => m.id === original.id)?.isReversed, true);
  assert.equal(migrated.reduce((sum, m) => sum + (m.type === 'saida' ? -m.amount : m.amount), 0), 0);
  assert.deepEqual(migrateFinancialAudit(migrated), migrated);
});
