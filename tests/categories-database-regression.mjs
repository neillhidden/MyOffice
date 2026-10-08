import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.MYOFFICE_PGLITE_MODULE || '@electric-sql/pglite');
test('offline category and shopping schema preserves tenant and parent boundaries',async()=>{
  const db=new PGlite();
  try {
    for(const migration of ['001_initial.sql','002_categories_and_home_shopping.sql']) await db.exec(await readFile(new URL('../database/migrations/'+migration,import.meta.url),'utf8'));
    await db.exec(`SET search_path=myoffice,public;
      INSERT INTO workspaces(id,kind,name) VALUES ('b','business','Business'),('h','personal','Home');
      INSERT INTO business_categories(workspace_id,id,name) VALUES ('b','games','Games'),('b','fashion','Moda');
      INSERT INTO business_subcategories(workspace_id,category_id,id,name) VALUES ('b','games','consoles','Consoles');
      INSERT INTO products(workspace_id,id,name,sku,unit_of_measure,status,cost_price,sale_price,category_id,subcategory_id) VALUES ('b','console','Console','C','un','ativo',100,150,'games','consoles');
      INSERT INTO personal_categories(workspace_id,id,name,kind) VALUES ('h','food','Alimentação','expense'),('h','games','Games','expense');
      INSERT INTO personal_subcategories(workspace_id,category_id,id,name) VALUES ('h','food','fruit','Frutas');
      INSERT INTO personal_shopping_items(workspace_id,id,name,category_id,subcategory_id,quantity,unit_price,currency) VALUES ('h','apple','Maçãs','food','fruit',1.5,100,'AOA');`);
    const {rows}=await db.query("SELECT count(*)::int AS total,count(*) FILTER (WHERE rowsecurity)::int AS protected FROM pg_tables WHERE schemaname='myoffice'");
    assert.deepEqual(rows[0],{total:40,protected:40});
    await assert.rejects(db.exec("UPDATE products SET category_id='fashion' WHERE id='console'"),/foreign key/);
    await assert.rejects(db.exec("INSERT INTO business_categories(workspace_id,id,name) VALUES ('h','bad','Games')"),/foreign key/);
    await assert.rejects(db.exec("INSERT INTO business_categories(workspace_id,id,name) VALUES ('b','dupe',' games ')"),/unique constraint/);
    await assert.rejects(db.exec("UPDATE personal_shopping_items SET category_id='games' WHERE id='apple'"),/foreign key/);
    await assert.rejects(db.exec("UPDATE personal_shopping_items SET quantity=-1 WHERE id='apple'"),/check constraint/);
    await assert.rejects(db.exec("UPDATE personal_shopping_items SET workspace_id='b' WHERE id='apple'"),/foreign key/);
  } finally {await db.close();}
});
