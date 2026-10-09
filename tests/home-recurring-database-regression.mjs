import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(
  process.env.MYOFFICE_PGLITE_MODULE || '@electric-sql/pglite'
);
test('offline recurrence and FX schema enforces occurrence uniqueness, accounted currency and original conversion', async () => {
  const db = new PGlite();
  try {
    for (const name of [
      '001_initial.sql',
      '002_categories_and_home_shopping.sql',
      '003_home_goal_funding.sql',
      '004_home_category_metadata.sql',
      '005_home_recurrence_and_exchange.sql',
    ])
      await db.exec(
        await readFile(
          new URL('../database/migrations/' + name, import.meta.url),
          'utf8',
        ),
      );
    await db.exec(`SET search_path=myoffice,public;
   INSERT INTO workspaces(id,kind,name) VALUES ('h','personal','Home');
   INSERT INTO bank_accounts(workspace_id,workspace_kind,id,name,currency,status,type) VALUES ('h','personal','wallet','Carteira','AOA','ativo','current');
   INSERT INTO recurring_bills(workspace_id,id,name,bank_id,amount,currency,next_due_date,frequency,starts_on,settlement_currency,exchange_rate) VALUES ('h','bill','Salário USD','wallet',25,'USD','2026-10-09','fortnightly','2026-10-09','AOA',925);
   INSERT INTO recurring_bill_occurrences(workspace_id,id,bill_id,due_on,snapshot) VALUES ('h','o','bill','2026-10-09','{}');
   INSERT INTO personal_goals(workspace_id,id,name,target_amount,currency,source_bank_id,original_amount,original_currency,exchange_rate) VALUES ('h','g','Sonho',23125,'AOA','wallet',25,'USD',925);`);
    await assert.rejects(
      db.exec(
        "INSERT INTO recurring_bill_occurrences(workspace_id,id,bill_id,due_on,snapshot) VALUES ('h','duplicate','bill','2026-10-09','{}')",
      ),
      /unique constraint/,
    );
    await assert.rejects(
      db.exec(
        "UPDATE recurring_bill_occurrences SET state='accepted',settled_at=now() WHERE id='o'",
      ),
      /check constraint/,
    );
    await assert.rejects(
      db.exec("UPDATE personal_goals SET target_amount=1 WHERE id='g'"),
      /check constraint/,
    );
    await assert.rejects(
      db.exec(
        "UPDATE recurring_bills SET settlement_currency='USD' WHERE id='bill'",
      ),
      /check constraint|foreign key/,
    );
    assert.equal(
      (await db.query("SELECT target_date FROM personal_goals WHERE id='g'"))
        .rows[0].target_date,
      null,
    );
    assert.equal(
      (
        await db.query(
          "SELECT rowsecurity FROM pg_tables WHERE schemaname='myoffice' AND tablename='recurring_bill_occurrences'",
        )
      ).rows[0].rowsecurity,
      true,
    );
  } finally {
    await db.close();
  }
});
