import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(
  process.env.MYOFFICE_PGLITE_MODULE || '@electric-sql/pglite'
);
test('offline personal taxonomy supports duplicate display names and independent icons without losing parent boundaries', async () => {
  const db = new PGlite();
  try {
    for (const name of [
      '001_initial.sql',
      '002_categories_and_home_shopping.sql',
      '003_home_goal_funding.sql',
      '004_home_category_metadata.sql',
    ])
      await db.exec(
        await readFile(
          new URL('../database/migrations/' + name, import.meta.url),
          'utf8',
        ),
      );
    await db.exec(`SET search_path=myoffice,public;
 INSERT INTO workspaces(id,kind,name) VALUES ('h','personal','Home');
 INSERT INTO personal_categories(workspace_id,id,name,kind,icon,legacy_key) VALUES ('h','a','Casa','expense','house','Casa'),('h','b','Casa','expense',null,'category:b');
 INSERT INTO personal_subcategories(workspace_id,category_id,id,name,icon) VALUES ('h','a','c','Quarto',null),('h','a','d','Quarto','bed');`);
    assert.equal(
      (
        await db.query(
          'SELECT count(*)::int AS total FROM personal_subcategories',
        )
      ).rows[0].total,
      2,
    );
    await assert.rejects(
      db.exec(
        "UPDATE personal_subcategories SET category_id='missing' WHERE id='c'",
      ),
      /foreign key/,
    );
    await assert.rejects(
      db.exec("DELETE FROM personal_categories WHERE id='a'"),
      /foreign key/,
    );
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS total FROM pg_tables WHERE schemaname='myoffice' AND rowsecurity",
        )
      ).rows[0].total,
      40,
    );
  } finally {
    await db.close();
  }
});
