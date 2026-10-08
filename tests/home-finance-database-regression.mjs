import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(
  process.env.MYOFFICE_PGLITE_MODULE || '@electric-sql/pglite'
);
test('offline goal funding keeps planning separate from financial acquisition', async () => {
  const db = new PGlite();
  try {
    for (const name of [
      '001_initial.sql',
      '002_categories_and_home_shopping.sql',
      '003_home_goal_funding.sql',
    ])
      await db.exec(
        await readFile(
          new URL('../database/migrations/' + name, import.meta.url),
          'utf8',
        ),
      );
    await db.exec(`SET search_path=myoffice,public;
      INSERT INTO workspaces(id,kind,name) VALUES ('h','personal','Home'),('b','business','Business');
      INSERT INTO personal_goals(workspace_id,id,name,target_amount,currency,funding_mode,planned_amount,acquired_on) VALUES ('h','perfume','Perfume',50,'USD','plan',50,'2026-10-08');`);
    assert.equal(
      (await db.query('SELECT count(*)::int AS total FROM bank_movements'))
        .rows[0].total,
      0,
    );
    await assert.rejects(
      db.exec("UPDATE personal_goals SET planned_amount=-1 WHERE id='perfume'"),
      /check constraint/,
    );
    await assert.rejects(
      db.exec(
        "UPDATE personal_goals SET funding_mode='unknown' WHERE id='perfume'",
      ),
      /check constraint/,
    );
    await assert.rejects(
      db.exec(
        "UPDATE personal_goals SET acquisition_movement_id='missing' WHERE id='perfume'",
      ),
      /check constraint/,
    );
    await assert.rejects(
      db.exec("UPDATE personal_goals SET workspace_id='b' WHERE id='perfume'"),
      /foreign key/,
    );
  } finally {
    await db.close();
  }
});
