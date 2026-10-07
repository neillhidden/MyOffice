import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.MYOFFICE_PGLITE_MODULE || '@electric-sql/pglite');
let db;
before(async () => {
  db = new PGlite();
  await db.exec(await readFile(new URL('../database/migrations/001_initial.sql', import.meta.url), 'utf8'));
  await db.exec(`
    SET search_path = myoffice, public;
    INSERT INTO workspaces(id,kind,name) VALUES ('business','business','Empresa'), ('personal','personal','Casa'), ('other','business','Outro grupo');
    INSERT INTO companies(workspace_id,id,name,nif,currency,status) VALUES ('business','company','Empresa','123','AOA','ativa'), ('other','company','Outro','456','AOA','ativa');
    INSERT INTO warehouses(workspace_id,company_id,id,name,type,status) VALUES ('business','company','warehouse','Armazém','armazem','ativo');
    INSERT INTO bank_accounts(workspace_id,workspace_kind,company_id,id,name,currency,status,type) VALUES ('business','business','company','bank','Banco','AOA','ativo','banco'), ('personal','personal',NULL,'personal-bank','Casa','AOA','ativo','caixa_fisico');
    INSERT INTO products(workspace_id,id,name,sku,unit_of_measure,status,cost_price,sale_price) VALUES ('business','product','Produto','SKU','kg','ativo',50,100);
    INSERT INTO sales(workspace_id,company_id,id,warehouse_id,bank_id,currency,seller,payment_method,total,status,occurred_at) VALUES ('business','company','sale','warehouse','bank','AOA','Operador','dinheiro',100,'concluida',now());
    INSERT INTO bank_movements(workspace_id,id,bank_id,type,amount,reason,responsible,occurred_at) VALUES ('business','original','bank','entrada',100,'Entrada','Operador',now());
  `);
});
after(async () => { await db?.close(); });

test('schema creates 36 tables with row security enabled', async () => {
  const { rows } = await db.query("SELECT count(*)::int AS total, count(*) FILTER (WHERE rowsecurity)::int AS protected FROM pg_tables WHERE schemaname='myoffice'");
  assert.deepEqual(rows[0], { total: 36, protected: 36 });
});
test('personal and business workspaces cannot exchange company records or account ownership', async () => {
  await assert.rejects(db.exec("INSERT INTO companies(workspace_id,id,name,nif,status) VALUES ('personal','bad','Empresa','789','ativa')"), /foreign key/);
  await assert.rejects(db.exec("INSERT INTO bank_accounts(workspace_id,workspace_kind,company_id,id,name,currency,status,type) VALUES ('personal','personal','company','bad','Conta','AOA','ativo','banco')"), /check constraint/);
  await assert.rejects(db.exec("INSERT INTO warehouses(workspace_id,company_id,id,name,type,status) VALUES ('other','unknown','bad','Armazém','armazem','ativo')"), /foreign key/);
});
test('SQL refuses invalid sale quantities, prices and product references', async () => {
  const insert = (id, quantity, price, product = 'product') => db.exec(`INSERT INTO sale_items(workspace_id,id,sale_id,product_id,quantity,unit_price) VALUES ('business','${id}','sale','${product}',${quantity},${price})`);
  await assert.rejects(insert('negative', '-1', '100'), /check constraint/);
  await assert.rejects(insert('zero', '0', '100'), /check constraint/);
  await assert.rejects(insert('nan', "'NaN'", '100'), /check constraint/);
  await assert.rejects(insert('bad-price', '1', '-100'), /check constraint/);
  await assert.rejects(insert('missing', '1', '100', 'missing'), /foreign key/);
  await insert('fractional', '0.5', '100');
  const { rows } = await db.query("SELECT subtotal::text FROM sale_items WHERE id='fractional'");
  assert.equal(rows[0].subtotal, '50.00');
});
test('SQL preserves originals, verifies compensation and prevents duplicate reversal', async () => {
  const insert = (id, amount) => db.exec(`INSERT INTO bank_movements(workspace_id,id,bank_id,type,amount,reason,responsible,occurred_at,reversal_of_id) VALUES ('business','${id}','bank','saida',${amount},'Estorno','Operador',now(),'original')`);
  await assert.rejects(insert('wrong', 50), /compensar/);
  await insert('reversal', 100);
  await assert.rejects(insert('duplicate', 100), /unique constraint/);
  await assert.rejects(db.exec("UPDATE bank_movements SET amount=0 WHERE id='original'"), /imutável/);
  await assert.rejects(db.exec("DELETE FROM bank_movements WHERE id='original'"), /imutável/);
  await assert.rejects(db.exec("TRUNCATE bank_movements CASCADE"), /imutável/);
  const { rows } = await db.query("SELECT balance::text FROM bank_balances WHERE bank_id='bank'");
  assert.equal(rows[0].balance, '0.00');
  assert.equal((await db.query("SELECT is_reversed FROM financial_ledger WHERE id='original'")).rows[0].is_reversed, true);
});
test('stock history accepts audited removal but refuses rewriting quantities or deleting entries', async () => {
  await db.exec("INSERT INTO stock_movements(workspace_id,id,product_id,warehouse_id,type,quantity,occurred_at,responsible,reason) VALUES ('business','stock','product','warehouse','entrada',5,now(),'Operador','Compra')");
  await assert.rejects(db.exec("UPDATE stock_movements SET quantity=10 WHERE id='stock'"), /reescrita/);
  await assert.rejects(db.exec("DELETE FROM stock_movements WHERE id='stock'"), /imutável/);
  await assert.rejects(db.exec("UPDATE stock_movements SET is_removed=true WHERE id='stock'"), /check constraint/);
  await db.exec("UPDATE stock_movements SET is_removed=true,removal_reason='Correção',removed_by='Operador',removed_at=now() WHERE id='stock'");
});
test('personal goals and budgets are stored separately from business planning', async () => {
  await db.exec("INSERT INTO personal_categories(workspace_id,id,name,kind) VALUES ('personal','food','Alimentação','expense'); INSERT INTO personal_budgets(workspace_id,id,category_id,starts_on,ends_on,currency,amount) VALUES ('personal','budget','food','2026-10-01','2026-10-31','AOA',50000); INSERT INTO personal_goals(workspace_id,id,name,target_amount,currency) VALUES ('personal','holiday','Férias',200000,'AOA')");
  await assert.rejects(db.exec("INSERT INTO personal_goals(workspace_id,id,name,target_amount,currency) VALUES ('business','wrong','Férias',200000,'AOA')"), /foreign key/);
  await assert.rejects(db.exec("INSERT INTO personal_budgets(workspace_id,id,category_id,starts_on,ends_on,currency,amount) VALUES ('business','wrong','food','2026-10-01','2026-10-31','AOA',50000)"), /foreign key/);
});
