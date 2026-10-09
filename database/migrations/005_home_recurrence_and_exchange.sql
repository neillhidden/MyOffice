-- Offline preparation only; no database connection is enabled by the frontend.
BEGIN;
SET search_path = myoffice, public;
ALTER TABLE recurring_bills
  DROP CONSTRAINT recurring_bills_frequency_check,
  DROP CONSTRAINT recurring_bills_workspace_id_bank_id_currency_fkey,
  ADD COLUMN entry_type text NOT NULL DEFAULT 'expense' CHECK (entry_type IN ('income','expense')),
  ADD COLUMN starts_on date,
  ADD COLUMN interval_count integer CHECK (interval_count BETWEEN 1 AND 10000),
  ADD COLUMN interval_unit text CHECK (interval_unit IN ('days','weeks','months')),
  ADD COLUMN end_mode text NOT NULL DEFAULT 'never' CHECK (end_mode IN ('never','date','count')),
  ADD COLUMN ends_on date,
  ADD COLUMN occurrence_count integer CHECK (occurrence_count BETWEEN 1 AND 50000),
  ADD COLUMN accounting_mode text NOT NULL DEFAULT 'ask' CHECK (accounting_mode IN ('ask','automatic')),
  ADD COLUMN generate_after date,
  ADD COLUMN exchange_rate numeric(20,6) CHECK (exchange_rate > 0 AND exchange_rate <> 'NaN'::numeric),
  ADD COLUMN settlement_currency text,
  ADD COLUMN deleted_at timestamptz,
  ADD CHECK (frequency IN ('none','weekly','fortnightly','monthly','yearly','custom')),
  ADD CHECK (frequency <> 'custom' OR (interval_count IS NOT NULL AND interval_unit IS NOT NULL)),
  ADD CHECK (end_mode <> 'date' OR (ends_on IS NOT NULL AND starts_on IS NOT NULL AND ends_on >= starts_on)),
  ADD CHECK (end_mode <> 'count' OR occurrence_count IS NOT NULL),
  ADD CHECK (exchange_rate IS NULL OR currency = 'USD');
UPDATE recurring_bills SET starts_on=next_due_date, settlement_currency=currency;
ALTER TABLE recurring_bills
  ALTER COLUMN starts_on SET NOT NULL,
  ALTER COLUMN settlement_currency SET NOT NULL,
  ADD CHECK (settlement_currency = CASE WHEN exchange_rate IS NULL THEN currency ELSE 'AOA' END),
  ADD FOREIGN KEY (workspace_id,bank_id,settlement_currency) REFERENCES bank_accounts(workspace_id,id,currency);
ALTER TABLE bank_movements
  ADD COLUMN original_amount numeric(20,2),
  ADD COLUMN original_currency text CHECK (original_currency IN ('USD','AOA')),
  ADD COLUMN exchange_rate numeric(20,6) CHECK (exchange_rate > 0 AND exchange_rate <> 'NaN'::numeric),
  ADD COLUMN settlement_currency text,
  ADD CHECK ((original_amount IS NULL AND original_currency IS NULL AND exchange_rate IS NULL AND settlement_currency IS NULL) OR
    (original_amount IS NOT NULL AND original_currency IS NOT NULL AND settlement_currency IS NOT NULL AND
     original_amount > 0 AND original_amount <> 'NaN'::numeric AND
     ((exchange_rate IS NULL AND settlement_currency=original_currency AND abs(amount)=original_amount) OR
      (exchange_rate IS NOT NULL AND original_currency='USD' AND settlement_currency='AOA' AND abs(amount)=round(original_amount*exchange_rate,2))))),
  ADD FOREIGN KEY (workspace_id,bank_id,settlement_currency) REFERENCES bank_accounts(workspace_id,id,currency);
ALTER TABLE personal_goals
  ADD COLUMN source_bank_id text,
  ADD COLUMN original_amount numeric(20,2),
  ADD COLUMN original_currency text CHECK (original_currency IN ('USD','AOA')),
  ADD COLUMN exchange_rate numeric(20,6) CHECK (exchange_rate > 0 AND exchange_rate <> 'NaN'::numeric),
  ADD FOREIGN KEY (workspace_id,source_bank_id,currency) REFERENCES bank_accounts(workspace_id,id,currency),
  ADD CHECK ((original_amount IS NULL AND original_currency IS NULL AND exchange_rate IS NULL) OR
    (original_amount IS NOT NULL AND original_currency IS NOT NULL AND original_amount > 0 AND original_amount <> 'NaN'::numeric AND
     ((exchange_rate IS NULL AND currency=original_currency AND target_amount=original_amount) OR
      (exchange_rate IS NOT NULL AND original_currency='USD' AND currency='AOA' AND target_amount=round(original_amount*exchange_rate,2)))));
CREATE TABLE recurring_bill_occurrences (
  workspace_id text NOT NULL, id text NOT NULL, bill_id text NOT NULL, due_on date NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','accepted','ignored')),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot)='object'),
  movement_id text, error_message text, settled_at timestamptz,
  PRIMARY KEY (workspace_id,id), UNIQUE (workspace_id,bill_id,due_on),
  UNIQUE (workspace_id,movement_id),
  FOREIGN KEY (workspace_id,bill_id) REFERENCES recurring_bills(workspace_id,id),
  FOREIGN KEY (workspace_id,movement_id) REFERENCES bank_movements(workspace_id,id),
  CHECK ((state='accepted' AND movement_id IS NOT NULL AND settled_at IS NOT NULL) OR
         (state='ignored' AND movement_id IS NULL AND settled_at IS NOT NULL) OR
         (state='pending' AND movement_id IS NULL AND settled_at IS NULL))
);
ALTER TABLE recurring_bill_occurrences ENABLE ROW LEVEL SECURITY;
-- Future API: lock the occurrence and post its movement + accepted state atomically.
-- Existing immutable Business ledger triggers remain in force. Home edits need
-- versioned overlays/audit_events rather than UPDATE/DELETE of bank_movements.
COMMIT;
