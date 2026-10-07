import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.MYOFFICE_PLAYWRIGHT_MODULE || 'playwright-core');
const baseUrl = process.env.MYOFFICE_TEST_URL || 'http://127.0.0.1:3000';
let browser;
before(async () => { browser = await chromium.launch({ executablePath: process.env.MYOFFICE_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] }); });
after(async () => { await browser?.close(); });
async function fixture(run, preload) {
  const context = await browser.newContext();
  if (preload) await context.addInitScript(preload);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto(`${baseUrl}/tests/fixtures/provider.html`);
    await page.waitForFunction(() => !!window.myofficeTest);
    await run(page);
    assert.deepEqual(errors, [], 'No uncaught browser errors');
  } finally { await context.close(); }
}
async function setupSale(page) {
  return page.evaluate(() => {
    const c = window.myofficeTest;
    const warehouse = c.warehouses.find((w) => w.status === 'ativo' && c.companies.some((x) => x.id === w.companyId && x.status === 'ativa'));
    const company = c.companies.find((x) => x.id === warehouse.companyId);
    const product = c.products.find((p) => p.status === 'ativo' && !p.variations.length && c.getCurrentStock(p.id, warehouse.id) > 3);
    const data = { warehouseId: warehouse.id, bankId: company.principalBankId, items: [{ productId: product.id, productName: product.name, quantity: 1, unitPrice: 100 }], paymentMethod: 'dinheiro', requiresTransport: true, transportDetails: { deliveryAddress: 'Teste isolado', cost: 20 } };
    return { data, product: product.id, stock: c.getCurrentStock(product.id, warehouse.id), balance: c.getBankBalance(company.principalBankId) };
  });
}

test('central sale validation rejects invalid input without partial state', () => fixture(async (page) => {
  const { data } = await setupSale(page);
  const result = await page.evaluate((data) => {
    const c = window.myofficeTest;
    const before = JSON.stringify([c.sales, c.movements, c.bankMovements, c.transports]);
    const errors = [];
    for (const [field, value] of [['quantity', -1], ['quantity', 0], ['quantity', NaN], ['quantity', Infinity], ['unitPrice', -1], ['unitPrice', Infinity]]) {
      try { c.completeSale({ ...data, items: [{ ...data.items[0], [field]: value }] }); errors.push(false); }
      catch { errors.push(true); }
    }
    for (const cost of [-1, NaN, Infinity]) {
      try { c.completeSale({ ...data, transportDetails: { ...data.transportDetails, cost } }); errors.push(false); }
      catch { errors.push(true); }
    }
    return { errors, unchanged: before === JSON.stringify([c.sales, c.movements, c.bankMovements, c.transports]) };
  }, data);
  assert.equal(result.errors.length, 9); assert.ok(result.errors.every(Boolean)); assert.equal(result.unchanged, true);
}));

test('sale, delivery and cancellation preserve original ledger and restore balances once', () => fixture(async (page) => {
  const base = await setupSale(page);
  const id = await page.evaluate((data) => window.myofficeTest.completeSale(data).sale.id, base.data);
  await page.waitForFunction((id) => window.myofficeTest.sales.some((s) => s.id === id), id);
  const before = await page.evaluate(({ id, base }) => {
    const c = window.myofficeTest;
    const entry = c.bankMovements.find((m) => m.saleId === id && !m.reversalOfId);
    let guarded = false; try { c.reverseBankMovement(entry.id, 'Tentativa isolada'); } catch { guarded = true; }
    return { entry, guarded, stock: c.getCurrentStock(base.product, base.data.warehouseId), balance: c.getBankBalance(base.data.bankId) };
  }, { id, base });
  assert.equal(before.guarded, true); assert.equal(before.stock, base.stock - 1); assert.equal(before.balance, base.balance + 120);
  const cancelled = await page.evaluate((id) => {
    const c = window.myofficeTest;
    return [c.cancelSale(id, 'Teste de estorno'), c.cancelSale(id, 'Clique repetido')];
  }, id);
  assert.equal(cancelled[0].success, true); assert.equal(cancelled[1].success, false);
  await page.waitForFunction((id) => window.myofficeTest.sales.find((s) => s.id === id)?.status === 'cancelada', id);
  const after = await page.evaluate(({ id, base }) => {
    const c = window.myofficeTest;
    const original = c.bankMovements.find((m) => m.saleId === id && !m.reversalOfId);
    return { original, stock: c.getCurrentStock(base.product, base.data.warehouseId), balance: c.getBankBalance(base.data.bankId), delivery: c.transports.find((t) => t.saleId === id)?.status, reversals: c.bankMovements.filter((m) => m.reversalOfId === original.id).length };
  }, { id, base });
  assert.equal(after.stock, base.stock); assert.equal(after.balance, base.balance); assert.equal(after.delivery, 'cancelado'); assert.equal(after.reversals, 1);
  for (const field of ['id', 'amount', 'bankId', 'type', 'date', 'reason']) assert.equal(after.original[field], before.entry[field]);
  await page.reload(); await page.waitForFunction(() => !!window.myofficeTest);
  assert.equal(await page.evaluate((bank) => window.myofficeTest.getBankBalance(bank), base.data.bankId), base.balance);
}));

test('new sale and transport IDs remain distinct with repeating clock suffixes', () => fixture(async (page) => {
  const { data } = await setupSale(page);
  const ids = await page.evaluate((data) => {
    const c = window.myofficeTest, clock = Date.now;
    try { Date.now = () => 100000; const first = c.completeSale(data); Date.now = () => 110000; const second = c.completeSale(data); return [first.sale.id, second.sale.id, first.transport.id, second.transport.id]; }
    finally { Date.now = clock; }
  }, data);
  assert.equal(new Set(ids).size, 4);
}));

test('manual reversal requires reason and cannot be repeated or restored', () => fixture(async (page) => {
  const id = await page.evaluate(() => {
    const c = window.myofficeTest;
    const bank = c.banks.find((b) => b.status === 'ativo' && !c.isBankOperationBlocked(b.id).blocked);
    window.auditBaseline = c.getBankBalance(bank.id);
    return c.recordBankMovement({ bankId: bank.id, type: 'entrada', amount: 75, reason: 'Teste', responsible: 'Teste' }).id;
  });
  await page.waitForFunction((id) => window.myofficeTest.bankMovements.some((m) => m.id === id), id);
  const result = await page.evaluate((id) => {
    const c = window.myofficeTest; const errors = [];
    try { c.reverseBankMovement(id, ' '); } catch { errors.push('reason'); }
    const reversal = c.reverseBankMovement(id, 'Duplicado');
    try { c.reverseBankMovement(id, 'Duplicado'); } catch { errors.push('duplicate'); }
    try { c.restoreFinancialMovement(id); } catch { errors.push('restore'); }
    return { reversal, errors };
  }, id);
  assert.deepEqual(result.errors, ['reason', 'duplicate', 'restore']);
  await page.waitForFunction((id) => window.myofficeTest.bankMovements.find((m) => m.id === id)?.isReversed, id);
  assert.equal(await page.evaluate((bank) => window.myofficeTest.getBankBalance(bank), result.reversal.bankId), await page.evaluate(() => window.auditBaseline));
}));

test('legacy removed entries convert once and remain neutral after reload', () => fixture(async (page) => {
  const inspect = () => { const c = window.myofficeTest; return c.bankMovements.filter((m) => m.id === 'legacy-test' || m.reversalOfId === 'legacy-test'); };
  const first = await page.evaluate(inspect); assert.equal(first.length, 2); assert.equal(first.find((m) => m.id === 'legacy-test').isReversed, true);
  assert.equal(first.reduce((sum, m) => sum + (m.type === 'saida' ? -m.amount : m.amount), 0), 0);
  await page.reload(); await page.waitForFunction(() => !!window.myofficeTest); assert.deepEqual(JSON.parse(JSON.stringify(await page.evaluate(inspect))), JSON.parse(JSON.stringify(first)));
}, () => {
  if (!localStorage.getItem('myoffice_estoque_bankMovements')) localStorage.setItem('myoffice_estoque_bankMovements', JSON.stringify([{ id: 'legacy-test', bankId: 'bank-1', type: 'entrada', amount: 80, reason: 'Original', responsible: 'Teste', date: '2026-10-01T12:00:00Z', isRemoved: true, removedReason: 'Duplicado' }]));
}));

test('all three reset functions refuse to erase transaction history', () => fixture(async (page) => {
  const result = await page.evaluate(() => {
    const c = window.myofficeTest; const before = JSON.stringify(localStorage); const errors = [];
    for (const fn of [c.resetHistory, c.resetAll, c.resetToDefaults]) try { fn(); } catch { errors.push(true); }
    return { allowed: c.canResetData, errors, unchanged: before === JSON.stringify(localStorage) };
  });
  assert.equal(result.allowed, false); assert.equal(result.errors.length, 3); assert.equal(result.unchanged, true);
}));

test('debt payment reversal preserves payment history and reopens the debt', () => fixture(async (page) => {
  const id = await page.evaluate(() => {
    const c = window.myofficeTest, company = c.companies.find((x) => x.status === 'ativa' && x.principalBankId);
    window.debtBank = company.principalBankId; window.debtBalance = c.getBankBalance(window.debtBank);
    return c.addDebt({ type: 'a_receber', counterpartyType: 'outro', counterpartyName: 'Teste', companyId: company.id, totalAmount: 100, currency: company.currency }).id;
  });
  await page.waitForFunction((id) => window.myofficeTest.debts.some((d) => d.id === id), id);
  const payment = await page.evaluate((id) => window.myofficeTest.recordDebtPayment({ debtId: id, amount: 100, bankId: window.debtBank }).id, id);
  await page.waitForFunction((id) => window.myofficeTest.debtPayments.some((p) => p.id === id), payment);
  assert.equal(await page.evaluate((id) => window.myofficeTest.getDebtCalculations(id).remainingAmount, id), 0);
  await page.evaluate((id) => window.myofficeTest.deleteDebtPayment(id, 'Pagamento duplicado'), payment);
  await page.waitForFunction((id) => window.myofficeTest.getDebtCalculations(id).remainingAmount === 100, id);
  assert.equal(await page.evaluate((id) => window.myofficeTest.debtPayments.some((p) => p.id === id), payment), true);
  assert.equal(await page.evaluate(() => window.myofficeTest.getBankBalance(window.debtBank)), await page.evaluate(() => window.debtBalance));
}));

test('financial UI exposes reversals and disables destructive reset controls', () => fixture(async (page) => {
  await page.goto(baseUrl); await page.locator('#btn-toggle-theme').waitFor();
  await page.locator('#nav-item-financeiro').click(); await page.locator('#subnav-financeiro-lançamentos').click();
  await page.locator('#input-busca-lancamentos').fill('Aporte');
  const action = page.getByRole('button', { name: /^Estornar lançamento de/ }).first(); await action.click();
  await page.locator('#textarea-motivo-remocao').fill('Correção de teste'); await page.locator('#btn-confirmar-remocao-lancamento').click();
  await page.locator('#modal-remover-lancamento-overlay').waitFor({ state: 'hidden' });
  await page.locator('#btn-tab-lancamentos-removidos').click();
  await page.locator('#input-busca-lancamentos').fill('');
  await page.getByText(/^Estorno de bmov/).first().waitFor();
  assert.match(await page.locator('main').innerText(), /Estorno de/);
  await page.locator('#btn-toggle-theme').click();
  await page.locator('#nav-item-definições').click(); await page.locator('#tab-btn-reset').click();
  assert.equal(await page.locator('#btn-open-reset-history').isDisabled(), true); assert.equal(await page.locator('#btn-open-reset-all').isDisabled(), true);
}));
