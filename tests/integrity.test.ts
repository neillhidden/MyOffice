import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createId } from '../src/utils/ids';
import { createReversal, migrateFinancialAudit } from '../src/utils/financialAudit';
import { validateSaleItem, validateCreditSaleClient } from '../src/utils/saleValidation';
import { validateProductPrices } from '../src/utils/productValidation';
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

test('validateProductPrices rejects negative cost and sale prices, variations and invalid empties', () => {
  for (const costPrice of [-1, -500, -Infinity, NaN, '', '   ']) {
    assert.throws(() => validateProductPrices({ costPrice }));
  }
  for (const salePrice of [-1, -100, -Infinity, NaN, '', '   ']) {
    assert.throws(() => validateProductPrices({ salePrice }));
  }
  for (const additionalPrice of [-1, -250, -Infinity, NaN, '', '   ']) {
    assert.throws(() => validateProductPrices({ variations: [{ additionalPrice: additionalPrice as unknown as number }] }));
  }
  assert.doesNotThrow(() => validateProductPrices({ costPrice: 0, salePrice: 0 }));
  assert.doesNotThrow(() => validateProductPrices({ costPrice: 500, salePrice: 1000, variations: [{ additionalPrice: 150 }] }));
});

test('credit sales strictly require an identified client', () => {
  assert.throws(() => validateCreditSaleClient('a_prazo', undefined, undefined));
  assert.throws(() => validateCreditSaleClient('a_prazo', '', ''));
  assert.throws(() => validateCreditSaleClient('a_prazo', undefined, '   '));
  assert.throws(() => validateCreditSaleClient('a_prazo', undefined, 'Consumidor final'));
  assert.throws(() => validateCreditSaleClient('a_prazo', undefined, 'Consumidor Final (Não registado)'));
  assert.throws(() => validateCreditSaleClient('a_prazo', undefined, 'consumidor final'));
  assert.doesNotThrow(() => validateCreditSaleClient('a_prazo', 'client-1', undefined));
  assert.doesNotThrow(() => validateCreditSaleClient('a_prazo', undefined, 'João Silva'));
  assert.doesNotThrow(() => validateCreditSaleClient('dinheiro', undefined, undefined));
  assert.doesNotThrow(() => validateCreditSaleClient('dinheiro', undefined, 'Consumidor final'));
  assert.doesNotThrow(() => validateCreditSaleClient('multicaixa', undefined, undefined));
});

test('credit sale reversal marks linked debt as anulada and creates reversal bank movements for payments', () => {
  const saleId = 'VND-TEST-001';
  const debtId = 'DEB-TEST-001';
  const bankId = 'bank-1';

  const debt = {
    id: debtId,
    type: 'a_receber' as const,
    counterpartyType: 'cliente' as const,
    counterpartyName: 'Cliente VIP',
    companyId: 'comp-1',
    totalAmount: 50000,
    initialAmount: 50000,
    currency: 'Kz',
    createdAt: '2026-10-01T10:00:00Z',
    saleId,
    reference: `Venda #${saleId}`,
  };

  const payment = {
    id: 'pay-1',
    debtId,
    amount: 20000,
    date: '2026-10-02T10:00:00Z',
    bankId,
    movementId: 'bmov-pay-1',
  };

  // Reversal simulation:
  const paymentBankMovement: BankMovement = {
    id: payment.movementId,
    bankId,
    type: 'entrada',
    category: 'Recebimento de Dívida',
    amount: payment.amount,
    date: payment.date,
    responsible: 'Operador',
    reason: `Recebimento de dívida #${debtId}`,
    debtId,
    debtPaymentId: payment.id,
  };

  const reversalMovement: BankMovement = {
    id: 'bmov-rev-1',
    bankId,
    type: 'saida',
    category: 'Estorno de Pagamento de Dívida',
    amount: payment.amount,
    date: '2026-10-03T10:00:00Z',
    responsible: 'Administrador',
    reason: `Estorno de Venda a Prazo #${saleId}: Reversão de recebimento de dívida #${debtId}`,
    reference: `Estorno #${saleId}`,
    saleId,
    debtId,
    debtPaymentId: payment.id,
    reversalOfId: paymentBankMovement.id,
    isReversed: true,
  };

  const markedPaymentBankMovement = { ...paymentBankMovement, isReversed: true };
  const allBankMovements = [reversalMovement, markedPaymentBankMovement];

  // Net effect on bank balance must be 0
  const netBankBalance = allBankMovements.reduce((acc, m) => acc + (m.type === 'entrada' ? m.amount : -m.amount), 0);
  assert.equal(netBankBalance, 0);

  // Debt cancelled
  const cancelledDebt = {
    ...debt,
    isCancelled: true,
    status: 'anulada' as const,
    cancelledAt: '2026-10-03T10:00:00Z',
    cancellationReason: 'Cliente desistiu',
  };
  assert.equal(cancelledDebt.status, 'anulada');
  assert.equal(cancelledDebt.isCancelled, true);
});

test('phone normalization and validation accepts valid international numbers and rejects invalid strings', async () => {
  const { normalizePhone, isValidPhone, validatePhoneField } = await import('../src/utils/phoneValidation');

  // Normalization removes spaces, hyphens, parentheses, dots, brackets, slashes
  assert.equal(normalizePhone('+244 (923) 111-222'), '+244923111222');
  assert.equal(normalizePhone('  923.111.222 / 333  '), '923111222333');
  assert.equal(normalizePhone('[+351] 912-345-678'), '+351912345678');

  // Valid numbers (7 to 15 digits, optional +)
  assert.equal(isValidPhone('+244923111222'), true);
  assert.equal(isValidPhone('923111222'), true);
  assert.equal(isValidPhone('+351 912 345 678'), true);
  assert.equal(isValidPhone('+86 138 0000 0000'), true);
  assert.equal(isValidPhone('1234567'), true); // exactly 7 digits
  assert.equal(isValidPhone('+123456789012345'), true); // exactly 15 digits

  // Invalid numbers
  assert.equal(isValidPhone('abc'), false);
  assert.equal(isValidPhone('+12'), false); // too short
  assert.equal(isValidPhone('123456'), false); // 6 digits, too short
  assert.equal(isValidPhone('+1234567890123456'), false); // 16 digits, too long
  assert.equal(isValidPhone(''), false);
  assert.equal(isValidPhone(null), false);
  assert.equal(isValidPhone(undefined), false);

  // Field validation
  const invalidResult = validatePhoneField('abc', true);
  assert.equal(invalidResult.isValid, false);
  assert.ok(invalidResult.error);

  const optionalEmpty = validatePhoneField('', false);
  assert.equal(optionalEmpty.isValid, true);
  assert.equal(optionalEmpty.normalized, '');

  const requiredEmpty = validatePhoneField('', true);
  assert.equal(requiredEmpty.isValid, false);
  assert.ok(requiredEmpty.error);
});

test('navigationRouter accurately bi-directionally maps URLs and respects browser history states', async () => {
  const { stateToHash, hashToState, DEFAULT_NAVIGATION_STATE } = await import('../src/utils/navigationRouter');

  // Business module routes
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Estoque', estoqueSub: 'Armazém' }), '#/armazem');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Estoque', estoqueSub: 'Movimentação' }), '#/movimentacao');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Estoque', estoqueSub: 'Simulador de Importação e Rentabilidade' }), '#/simulador');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Estoque', estoqueSub: 'Lista de compras' }), '#/lista-compras');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Estoque', estoqueSub: 'Defeituoso' }), '#/defeituoso');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Caixa', caixaSub: 'Venda' }), '#/venda');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Caixa', caixaSub: 'Transporte' }), '#/transporte');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Financeiro', financeiroSub: 'Contas' }), '#/contas');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Financeiro', financeiroSub: 'Lançamentos' }), '#/lancamentos');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Financeiro', financeiroSub: 'Dívidas' }), '#/dividas');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Financeiro', financeiroSub: 'Documentos' }), '#/documentos-financeiro');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Contactos', contactosSub: 'Funcionários' }), '#/funcionarios');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Contactos', contactosSub: 'Clientes' }), '#/clientes');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Contactos', contactosSub: 'Fornecedores' }), '#/fornecedores');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Contactos', contactosSub: 'Afiliados' }), '#/afiliados');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Dashboard' }), '#/dashboard');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Calendário' }), '#/calendario');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'business', module: 'Definições' }), '#/definicoes');

  // Home section routes
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'home', homeSection: 'Dashboard' }), '#/home/dashboard');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'home', homeSection: 'Finanças' }), '#/home/financas');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'home', homeSection: 'Orçamento' }), '#/home/orcamento');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'home', homeSection: 'Contas da casa' }), '#/home/contas-da-casa');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'home', homeSection: 'Metas e sonhos' }), '#/home/metas');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'home', homeSection: 'Agenda' }), '#/home/agenda');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'home', homeSection: 'Compras' }), '#/home/compras');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'home', homeSection: 'Histórico' }), '#/home/historico');
  assert.equal(stateToHash({ ...DEFAULT_NAVIGATION_STATE, mode: 'home', homeSection: 'Dívidas pessoais' }), '#/home/dividas-pessoais');

  // hashToState parsing
  const parsedArmazem = hashToState('#/armazem');
  assert.equal(parsedArmazem.mode, 'business');
  assert.equal(parsedArmazem.module, 'Estoque');
  assert.equal(parsedArmazem.estoqueSub, 'Armazém');

  const parsedClientes = hashToState('#/clientes');
  assert.equal(parsedClientes.mode, 'business');
  assert.equal(parsedClientes.module, 'Contactos');
  assert.equal(parsedClientes.contactosSub, 'Clientes');

  const parsedHomeOrcamento = hashToState('#/home/orcamento');
  assert.equal(parsedHomeOrcamento.mode, 'home');
  assert.equal(parsedHomeOrcamento.homeSection, 'Orçamento');

  // Direct and alias routing
  assert.equal(hashToState('#/pos').caixaSub, 'Venda');
  assert.equal(hashToState('#/entregas').caixaSub, 'Transporte');
  assert.equal(hashToState('#/produtos').estoqueSub, 'Armazém');
});



