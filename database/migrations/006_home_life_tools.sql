-- Offline preparation only: the frontend does not run this migration.
BEGIN;
SET search_path = myoffice, public;
CREATE TABLE personal_debts (
  workspace_id text NOT NULL, workspace_kind text NOT NULL DEFAULT 'personal' CHECK (workspace_kind='personal'),
  id text NOT NULL, title text NOT NULL CHECK (length(trim(title))>0), person text NOT NULL,
  type text NOT NULL CHECK (type IN ('payable','receivable')),
  principal numeric(20,2) NOT NULL CHECK (principal>0 AND principal<>'NaN'::numeric),
  currency text NOT NULL CHECK (currency IN ('AOA','USD')), issued_on date NOT NULL, due_on date,
  installment_count integer NOT NULL CHECK (installment_count BETWEEN 1 AND 600), first_installment date,
  edited_at timestamptz, deleted_at timestamptz,
  PRIMARY KEY (workspace_id,id), UNIQUE(workspace_id,id,currency),
  FOREIGN KEY(workspace_id,workspace_kind) REFERENCES workspaces(id,kind),
  CHECK (principal*100>=installment_count), CHECK (installment_count=1 OR first_installment IS NOT NULL)
);
CREATE TABLE personal_debt_payments (
  workspace_id text NOT NULL, id text NOT NULL, debt_id text NOT NULL, bank_id text NOT NULL,
  movement_id text NOT NULL, currency text NOT NULL,
  amount numeric(20,2) NOT NULL CHECK (amount>0 AND amount<>'NaN'::numeric), paid_on date NOT NULL,
  PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,movement_id),
  FOREIGN KEY(workspace_id,debt_id,currency) REFERENCES personal_debts(workspace_id,id,currency),
  FOREIGN KEY(workspace_id,bank_id,currency) REFERENCES bank_accounts(workspace_id,id,currency),
  FOREIGN KEY(workspace_id,bank_id,movement_id) REFERENCES bank_movements(workspace_id,bank_id,id)
);
CREATE TRIGGER personal_debt_payments_append_only BEFORE UPDATE OR DELETE ON personal_debt_payments
  FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER personal_debt_payments_no_truncate BEFORE TRUNCATE ON personal_debt_payments
  FOR EACH STATEMENT EXECUTE FUNCTION reject_history_mutation();
CREATE TABLE personal_plans (
  workspace_id text NOT NULL, workspace_kind text NOT NULL DEFAULT 'personal' CHECK(workspace_kind='personal'),
  id text NOT NULL, title text NOT NULL, type text NOT NULL CHECK(type IN ('income','expense','reserve')),
  amount numeric(20,2) NOT NULL CHECK(amount>0 AND amount<>'NaN'::numeric), currency text NOT NULL,
  planned_on date NOT NULL, bank_id text NOT NULL, category_id text NOT NULL, goal_id text,
  edited_at timestamptz, deleted_at timestamptz, details jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY(workspace_id,id),
  FOREIGN KEY(workspace_id,workspace_kind) REFERENCES workspaces(id,kind),
  FOREIGN KEY(workspace_id,bank_id,currency) REFERENCES bank_accounts(workspace_id,id,currency),
  FOREIGN KEY(workspace_id,category_id) REFERENCES personal_categories(workspace_id,id),
  FOREIGN KEY(workspace_id,goal_id) REFERENCES personal_goals(workspace_id,id),
  CHECK(type<>'reserve' OR goal_id IS NOT NULL)
);
CREATE TABLE personal_statement_rows (
  workspace_id text NOT NULL, workspace_kind text NOT NULL DEFAULT 'personal' CHECK(workspace_kind='personal'),
  id text NOT NULL, bank_id text NOT NULL, occurred_on date NOT NULL, title text NOT NULL,
  signed_amount numeric(20,2) NOT NULL CHECK(signed_amount<>0 AND signed_amount<>'NaN'::numeric),
  reference text, fingerprint_sha256 text NOT NULL CHECK(fingerprint_sha256~'^[a-f0-9]{64}$'), batch_id text NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','matched','ignored')), movement_id text,
  PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,fingerprint_sha256), UNIQUE(workspace_id,bank_id,movement_id),
  FOREIGN KEY(workspace_id,workspace_kind) REFERENCES workspaces(id,kind),
  FOREIGN KEY(workspace_id,bank_id) REFERENCES bank_accounts(workspace_id,id),
  FOREIGN KEY(workspace_id,bank_id,movement_id) REFERENCES bank_movements(workspace_id,bank_id,id),
  CHECK ((state='matched' AND movement_id IS NOT NULL) OR (state<>'matched' AND movement_id IS NULL))
);
CREATE TABLE personal_documents (
  workspace_id text NOT NULL, workspace_kind text NOT NULL DEFAULT 'personal' CHECK(workspace_kind='personal'),
  id text NOT NULL, title text NOT NULL, file_name text NOT NULL,
  mime text NOT NULL CHECK(mime IN ('application/pdf','image/png','image/jpeg')),
  size_bytes bigint NOT NULL CHECK(size_bytes>0), object_key text NOT NULL CHECK(length(trim(object_key))>0),
  uploaded_at timestamptz NOT NULL, kind text NOT NULL CHECK(kind IN ('receipt','invoice','warranty','other')),
  expires_on date, entity_type text CHECK(entity_type IN ('entry','shopping','debt','goal')), entity_id text,
  edited_at timestamptz, deleted_at timestamptz,
  PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,object_key),
  FOREIGN KEY(workspace_id,workspace_kind) REFERENCES workspaces(id,kind),
  CHECK((entity_type IS NULL)=(entity_id IS NULL))
);
-- Files live in private object storage in the future. Never store public URLs or
-- local base64 contents in the metadata table. The API must validate entity links.
CREATE TABLE personal_entity_revisions (
  workspace_id text NOT NULL, workspace_kind text NOT NULL DEFAULT 'personal' CHECK(workspace_kind='personal'),
  id text NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL,
  action text NOT NULL CHECK(action IN ('edit','delete','restore')), actor_user_id text,
  occurred_at timestamptz NOT NULL DEFAULT now(), snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object' AND NOT(snapshot ? 'content')),
  PRIMARY KEY(workspace_id,id),
  FOREIGN KEY(workspace_id,workspace_kind) REFERENCES workspaces(id,kind), FOREIGN KEY(actor_user_id) REFERENCES app_users(id)
);
CREATE TRIGGER personal_entity_revisions_append_only BEFORE UPDATE OR DELETE ON personal_entity_revisions
  FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER personal_entity_revisions_no_truncate BEFORE TRUNCATE ON personal_entity_revisions
  FOR EACH STATEMENT EXECUTE FUNCTION reject_history_mutation();
ALTER TABLE calendar_events
  ADD COLUMN event_time time,
  ADD COLUMN priority text CHECK(priority IN ('low','normal','high')),
  ADD COLUMN assignee text,
  ADD COLUMN recurrence jsonb CHECK(recurrence IS NULL OR jsonb_typeof(recurrence)='object'),
  ADD COLUMN edited_at timestamptz,
  ADD COLUMN deleted_at timestamptz;
CREATE TABLE personal_task_completions (
  workspace_id text NOT NULL, workspace_kind text NOT NULL DEFAULT 'personal' CHECK(workspace_kind='personal'),
  task_id text NOT NULL, occurred_on date NOT NULL, completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(workspace_id,task_id,occurred_on),
  FOREIGN KEY(workspace_id,workspace_kind) REFERENCES workspaces(id,kind),
  FOREIGN KEY(workspace_id,task_id) REFERENCES calendar_events(workspace_id,id)
);
ALTER TABLE personal_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_statement_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_entity_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_task_completions ENABLE ROW LEVEL SECURITY;
-- Future API must lock balances/debts and check payment totals, movement direction,
-- matches by date/value, goal currency, recurrence dates and tenant permissions.
-- Home ledger edits use audited overlays/compensation; Business remains append-only.
COMMIT;
