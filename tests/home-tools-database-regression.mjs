import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
const { PGlite } = await import(
  process.env.MYOFFICE_PGLITE_MODULE || '@electric-sql/pglite'
);
test('offline Home tools schema preserves workspace isolation, financial links, file metadata and immutable revisions', async () => {
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
 INSERT INTO workspaces(id,kind,name) VALUES('h','personal','Home'),('b','business','Empresa');
 INSERT INTO bank_accounts(workspace_id,workspace_kind,id,name,currency,status,type) VALUES('h','personal','wallet','Carteira','AOA','ativo','current');
 INSERT INTO personal_debts(workspace_id,id,title,person,type,principal,currency,issued_on,installment_count,first_installment) VALUES('h','d','Dívida','Ana','payable',100,'AOA','2026-01-01',2,'2026-02-01');
 INSERT INTO bank_movements(workspace_id,id,bank_id,type,amount,reason,responsible,occurred_at) VALUES('h','m','wallet','saida',10,'Amortização','Teste',now());
 INSERT INTO personal_debt_payments(workspace_id,id,debt_id,bank_id,movement_id,currency,amount,paid_on) VALUES('h','p','d','wallet','m','AOA',10,'2026-10-09');
 INSERT INTO personal_documents(workspace_id,id,title,file_name,mime,size_bytes,object_key,uploaded_at,kind) VALUES('h','doc','Fatura','f.pdf','application/pdf',100,'private/h/f.pdf',now(),'invoice');
 INSERT INTO personal_entity_revisions(workspace_id,id,entity_type,entity_id,action,snapshot) VALUES('h','r','debt','d','edit','{"principal":100}');`);
    await assert.rejects(
      db.exec("UPDATE personal_debt_payments SET amount=20 WHERE id='p'"),
      /imutável/,
    );
    await assert.rejects(
      db.exec("DELETE FROM personal_entity_revisions WHERE id='r'"),
      /imutável/,
    );
    await assert.rejects(
      db.exec(
        "INSERT INTO personal_debts(workspace_id,id,title,person,type,principal,currency,issued_on,installment_count) VALUES('b','wrong','Dívida','Ana','payable',1,'AOA','2026-01-01',1)",
      ),
      /foreign key/,
    );
    await assert.rejects(
      db.exec(
        "INSERT INTO personal_debt_payments(workspace_id,id,debt_id,bank_id,movement_id,currency,amount,paid_on) VALUES('h','bad','d','wallet','m','USD',1,'2026-10-09')",
      ),
      /foreign key|unique constraint/,
    );
    await assert.rejects(
      db.exec(
        "INSERT INTO personal_statement_rows(workspace_id,id,bank_id,occurred_on,title,signed_amount,fingerprint_sha256,batch_id,state) VALUES('h','s','wallet','2026-10-09','Banco',-10,repeat('a',64),'batch','matched')",
      ),
      /check constraint/,
    );
    await assert.rejects(
      db.exec("UPDATE personal_documents SET mime='text/html' WHERE id='doc'"),
      /check constraint/,
    );
    await assert.rejects(
      db.exec(
        "INSERT INTO personal_entity_revisions(workspace_id,id,entity_type,entity_id,action,snapshot) VALUES('h','binary','document','doc','edit','{\"content\":\"abc\"}')",
      ),
      /check constraint/,
    );
    const tables = (
      await db.query(
        "SELECT tablename,rowsecurity FROM pg_tables WHERE schemaname='myoffice'",
      )
    ).rows;
    assert.equal(tables.length, 51);
    assert.ok(tables.every((t) => t.rowsecurity));
    console.log(
      '51 tables created with RLS enabled; frontend remains disconnected.',
    );
  } finally {
    await db.close();
  }
});
