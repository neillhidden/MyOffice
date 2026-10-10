-- Offline preparation only; the frontend never executes SQL.
BEGIN;
SET LOCAL search_path=myoffice,public;
CREATE TABLE business_budgets (
 workspace_id text NOT NULL, workspace_kind text NOT NULL DEFAULT 'business' CHECK(workspace_kind='business'),
 id text NOT NULL, company_id text NOT NULL, category text NOT NULL CHECK(length(trim(category))>0),
 budget_month date NOT NULL CHECK(extract(day FROM budget_month)=1), currency text NOT NULL CHECK(currency IN ('AOA','USD')),
 amount numeric(20,2) NOT NULL CHECK(amount>0 AND amount<>'NaN'::numeric),
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,company_id,category,budget_month,currency),
 FOREIGN KEY(workspace_id,workspace_kind) REFERENCES workspaces(id,kind),
 FOREIGN KEY(workspace_id,company_id) REFERENCES companies(workspace_id,id)
);
CREATE TABLE business_documents (
 workspace_id text NOT NULL, workspace_kind text NOT NULL DEFAULT 'business' CHECK(workspace_kind='business'),
 id text NOT NULL, bank_id text NOT NULL, movement_id text NOT NULL, title text NOT NULL, file_name text NOT NULL,
 mime text NOT NULL CHECK(mime IN ('application/pdf','image/png','image/jpeg')), size_bytes bigint NOT NULL CHECK(size_bytes>0),
 object_key text NOT NULL CHECK(length(trim(object_key))>0), file_sha256 text NOT NULL CHECK(file_sha256~'^[a-f0-9]{64}$'),
 uploaded_at timestamptz NOT NULL, kind text NOT NULL CHECK(kind IN ('receipt','invoice','warranty','other')),
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,file_sha256), UNIQUE(workspace_id,object_key),
 FOREIGN KEY(workspace_id,workspace_kind) REFERENCES workspaces(id,kind),
 FOREIGN KEY(workspace_id,bank_id,movement_id) REFERENCES bank_movements(workspace_id,bank_id,id)
);
CREATE TABLE business_receipt_links (
 workspace_id text NOT NULL, workspace_kind text NOT NULL DEFAULT 'business' CHECK(workspace_kind='business'),
 id text NOT NULL, bank_id text NOT NULL, movement_id text NOT NULL, occurred_on date NOT NULL,
 transaction_reference text CHECK(transaction_reference IS NULL OR length(trim(transaction_reference))>0),
 file_sha256 text CHECK(file_sha256 IS NULL OR file_sha256~'^[a-f0-9]{64}$'),
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,file_sha256), UNIQUE(workspace_id,bank_id,occurred_on,transaction_reference),
 FOREIGN KEY(workspace_id,workspace_kind) REFERENCES workspaces(id,kind),
 FOREIGN KEY(workspace_id,bank_id,movement_id) REFERENCES bank_movements(workspace_id,bank_id,id),
 CHECK(transaction_reference IS NOT NULL OR file_sha256 IS NOT NULL)
);
CREATE TRIGGER business_receipt_links_append_only BEFORE UPDATE OR DELETE ON business_receipt_links
 FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER business_receipt_links_no_truncate BEFORE TRUNCATE ON business_receipt_links
 FOR EACH STATEMENT EXECUTE FUNCTION reject_history_mutation();
ALTER TABLE business_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_receipt_links ENABLE ROW LEVEL SECURITY;
-- Future API must lock accounts, verify company status/ownership and match
-- date/value/currency/direction before booking or linking. Files stay private.
COMMIT;
