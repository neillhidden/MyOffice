import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
const { PGlite } = await import(
  process.env.MYOFFICE_PGLITE_MODULE || '@electric-sql/pglite'
);
test('offline Business document schema prevents duplicate files, references and budgets and preserves workspace boundaries', async () => {
  const db = new PGlite();
  try {
    for (const f of (
      await readdir(new URL('../database/migrations/', import.meta.url))
    )
      .filter((f) => f.endsWith('.sql'))
      .sort())
      await db.exec(
        await readFile(
          new URL('../database/migrations/' + f, import.meta.url),
          'utf8',
        ),
      );
    await db.exec(`SET search_path=myoffice,public;
   INSERT INTO workspaces(id,kind,name) VALUES('b','business','Empresa'),('h','personal','Home');
   INSERT INTO companies(workspace_id,id,name,nif,status) VALUES('b','c','Empresa','123','ativa');
   INSERT INTO bank_accounts(workspace_id,workspace_kind,company_id,id,name,currency,status,type) VALUES('b','business','c','bank','Banco','AOA','ativo','banco');
   INSERT INTO bank_movements(workspace_id,id,bank_id,type,amount,reason,responsible,occurred_at) VALUES('b','m','bank','saida',1000,'Compra','Teste',now());
   INSERT INTO business_budgets(workspace_id,id,company_id,category,budget_month,currency,amount) VALUES('b','budget','c','Alimentação','2026-10-01','AOA',1500);
   INSERT INTO business_documents(workspace_id,id,bank_id,movement_id,title,file_name,mime,size_bytes,object_key,file_sha256,uploaded_at,kind) VALUES('b','doc','bank','m','Compra','f.pdf','application/pdf',100,'private/b/f.pdf',repeat('a',64),now(),'receipt');
   INSERT INTO business_receipt_links(workspace_id,id,bank_id,movement_id,occurred_on,transaction_reference,file_sha256) VALUES('b','link','bank','m','2026-10-09','txn-123',repeat('a',64));`);
    await assert.rejects(
      db.exec(
        "INSERT INTO business_budgets(workspace_id,id,company_id,category,budget_month,currency,amount) VALUES('b','duplicate','c','Alimentação','2026-10-01','AOA',2000)",
      ),
      /unique constraint/,
    );
    await assert.rejects(
      db.exec(
        "INSERT INTO business_receipt_links(workspace_id,id,bank_id,movement_id,occurred_on,transaction_reference) VALUES('b','duplicate','bank','m','2026-10-09','txn-123')",
      ),
      /unique constraint/,
    );
    await assert.rejects(
      db.exec(
        "INSERT INTO business_documents(workspace_id,id,bank_id,movement_id,title,file_name,mime,size_bytes,object_key,file_sha256,uploaded_at,kind) VALUES('b','renamed','bank','m','Compra','renamed.pdf','application/pdf',100,'private/b/other.pdf',repeat('a',64),now(),'receipt')",
      ),
      /unique constraint/,
    );
    await assert.rejects(
      db.exec(
        "INSERT INTO business_receipt_links(workspace_id,id,bank_id,movement_id,occurred_on,transaction_reference) VALUES('h','wrong','bank','m','2026-10-09','other')",
      ),
      /foreign key/,
    );
    await assert.rejects(
      db.exec('DELETE FROM business_receipt_links'),
      /imutável/,
    );
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS total FROM pg_tables WHERE schemaname='myoffice' AND rowsecurity",
        )
      ).rows[0].total,
      51,
    );
  } finally {
    await db.close();
  }
});
