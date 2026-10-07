-- PostgreSQL 15+. Offline schema; this migration is NOT loaded by the frontend.
BEGIN;
CREATE SCHEMA myoffice;
SET LOCAL search_path = myoffice, public;

CREATE TABLE app_users (
  id text PRIMARY KEY, -- Future authentication provider's subject; never a password.
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE workspaces (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('personal', 'business')),
  name text NOT NULL,
  base_currency text NOT NULL DEFAULT 'AOA' CHECK (base_currency ~ '^[A-Z]{3}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, kind)
);
CREATE TABLE workspace_memberships (
  workspace_id text NOT NULL REFERENCES workspaces(id),
  user_id text NOT NULL REFERENCES app_users(id),
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'operator', 'viewer', 'family_member')),
  PRIMARY KEY (workspace_id, user_id)
);
CREATE TABLE companies (
  workspace_id text NOT NULL,
  workspace_kind text NOT NULL DEFAULT 'business' CHECK (workspace_kind = 'business'),
  id text NOT NULL,
  name text NOT NULL,
  nif text NOT NULL,
  currency text NOT NULL DEFAULT 'AOA' CHECK (currency ~ '^[A-Z]{3}$'),
  status text NOT NULL CHECK (status IN ('ativa', 'parada', 'desativada')),
  principal_bank_id text,
  details jsonb NOT NULL DEFAULT '{}', -- address, contact, logo and other current fields
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, workspace_kind) REFERENCES workspaces(id, kind)
);
CREATE TABLE warehouses (
  workspace_id text NOT NULL,
  company_id text NOT NULL,
  id text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('armazem', 'loja_fisica')),
  status text NOT NULL CHECK (status IN ('ativo', 'inativo')),
  details jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, company_id, id),
  FOREIGN KEY (workspace_id, company_id) REFERENCES companies(workspace_id, id)
);
CREATE TABLE bank_accounts (
  workspace_id text NOT NULL,
  workspace_kind text NOT NULL,
  company_id text,
  id text NOT NULL,
  name text NOT NULL,
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  status text NOT NULL CHECK (status IN ('ativo', 'inativo')),
  type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, company_id, id),
  UNIQUE (workspace_id, id, currency),
  CHECK ((workspace_kind = 'business' AND company_id IS NOT NULL) OR (workspace_kind = 'personal' AND company_id IS NULL)),
  FOREIGN KEY (workspace_id, workspace_kind) REFERENCES workspaces(id, kind),
  FOREIGN KEY (workspace_id, company_id) REFERENCES companies(workspace_id, id)
);
ALTER TABLE companies ADD FOREIGN KEY (workspace_id, id, principal_bank_id)
  REFERENCES bank_accounts(workspace_id, company_id, id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE contacts (
  workspace_id text NOT NULL REFERENCES workspaces(id),
  id text NOT NULL,
  company_id text,
  kind text NOT NULL CHECK (kind IN ('client', 'supplier', 'employee', 'affiliate', 'personal')),
  name text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}', -- telephone, email, birthday, role and existing fields
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, company_id) REFERENCES companies(workspace_id, id)
);
CREATE TABLE products (
  workspace_id text NOT NULL,
  workspace_kind text NOT NULL DEFAULT 'business' CHECK (workspace_kind = 'business'),
  id text NOT NULL,
  name text NOT NULL,
  sku text NOT NULL,
  supplier_id text,
  unit_of_measure text NOT NULL,
  status text NOT NULL CHECK (status IN ('ativo', 'inativo', 'descontinuado')),
  cost_price numeric(20,4) NOT NULL CHECK (cost_price >= 0 AND cost_price <> 'NaN'::numeric),
  sale_price numeric(20,4) NOT NULL CHECK (sale_price >= 0 AND sale_price <> 'NaN'::numeric),
  details jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, workspace_kind) REFERENCES workspaces(id, kind),
  FOREIGN KEY (workspace_id, supplier_id) REFERENCES contacts(workspace_id, id)
);
CREATE TABLE product_variations (
  workspace_id text NOT NULL,
  product_id text NOT NULL,
  id text NOT NULL,
  sku text NOT NULL,
  additional_price numeric(20,4) NOT NULL DEFAULT 0 CHECK (additional_price <> 'NaN'::numeric),
  details jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, product_id, id),
  FOREIGN KEY (workspace_id, product_id) REFERENCES products(workspace_id, id)
);
CREATE TABLE stock_configs (
  workspace_id text NOT NULL,
  product_id text NOT NULL,
  warehouse_id text NOT NULL,
  variation_id text,
  min_limit numeric(20,6) NOT NULL DEFAULT 0 CHECK (min_limit >= 0 AND min_limit <> 'NaN'::numeric),
  max_limit numeric(20,6) NOT NULL DEFAULT 0 CHECK (max_limit >= 0 AND max_limit <> 'NaN'::numeric),
  physical_location text,
  UNIQUE NULLS NOT DISTINCT (workspace_id, product_id, warehouse_id, variation_id),
  FOREIGN KEY (workspace_id, product_id, variation_id) REFERENCES product_variations(workspace_id, product_id, id),
  FOREIGN KEY (workspace_id, product_id) REFERENCES products(workspace_id, id),
  FOREIGN KEY (workspace_id, warehouse_id) REFERENCES warehouses(workspace_id, id)
);
CREATE TABLE purchase_groups (
  workspace_id text NOT NULL REFERENCES workspaces(id), id text NOT NULL,
  name text NOT NULL, details jsonb NOT NULL DEFAULT '{}', PRIMARY KEY (workspace_id, id)
);
CREATE TABLE purchase_lists (
  workspace_id text NOT NULL REFERENCES workspaces(id), id text NOT NULL, group_id text,
  name text NOT NULL, status text NOT NULL CHECK (status IN ('em_pesquisa', 'concluido', 'cancelado')),
  details jsonb NOT NULL DEFAULT '{}', PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, group_id) REFERENCES purchase_groups(workspace_id, id)
);
CREATE TABLE purchase_sources (
  workspace_id text NOT NULL, id text NOT NULL, list_id text NOT NULL,
  details jsonb NOT NULL, PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, list_id) REFERENCES purchase_lists(workspace_id, id)
);
CREATE TABLE sales (
  workspace_id text NOT NULL, company_id text NOT NULL, id text NOT NULL,
  warehouse_id text NOT NULL, bank_id text NOT NULL, currency text NOT NULL,
  client_id text, client_name text, seller text NOT NULL,
  payment_method text NOT NULL,
  total numeric(20,2) NOT NULL CHECK (total >= 0 AND total <> 'NaN'::numeric),
  requires_transport boolean NOT NULL DEFAULT false,
  transport_cost numeric(20,2) NOT NULL DEFAULT 0 CHECK (transport_cost >= 0 AND transport_cost <> 'NaN'::numeric),
  status text NOT NULL CHECK (status IN ('concluida', 'cancelada')),
  occurred_at timestamptz NOT NULL, notes text,
  PRIMARY KEY (workspace_id, id),
  CHECK (requires_transport OR transport_cost = 0),
  FOREIGN KEY (workspace_id, company_id, warehouse_id) REFERENCES warehouses(workspace_id, company_id, id),
  FOREIGN KEY (workspace_id, company_id, bank_id) REFERENCES bank_accounts(workspace_id, company_id, id),
  FOREIGN KEY (workspace_id, bank_id, currency) REFERENCES bank_accounts(workspace_id, id, currency),
  FOREIGN KEY (workspace_id, client_id) REFERENCES contacts(workspace_id, id)
);
CREATE TABLE sale_items (
  workspace_id text NOT NULL, id text NOT NULL, sale_id text NOT NULL,
  product_id text NOT NULL, variation_id text,
  quantity numeric(20,6) NOT NULL CHECK (quantity > 0 AND quantity <> 'NaN'::numeric),
  unit_price numeric(20,4) NOT NULL CHECK (unit_price >= 0 AND unit_price <> 'NaN'::numeric),
  subtotal numeric(20,2) GENERATED ALWAYS AS (round(quantity * unit_price, 2)) STORED,
  snapshot jsonb NOT NULL DEFAULT '{}', -- Names/SKUs at the time of sale
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, sale_id) REFERENCES sales(workspace_id, id),
  FOREIGN KEY (workspace_id, product_id) REFERENCES products(workspace_id, id),
  FOREIGN KEY (workspace_id, product_id, variation_id) REFERENCES product_variations(workspace_id, product_id, id)
);
CREATE TABLE transports (
  workspace_id text NOT NULL REFERENCES workspaces(id), id text NOT NULL, sale_id text,
  status text NOT NULL CHECK (status IN ('pendente', 'em_transito', 'entregue', 'cancelado')),
  delivery_address text NOT NULL, details jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (workspace_id, id), UNIQUE (workspace_id, sale_id),
  FOREIGN KEY (workspace_id, sale_id) REFERENCES sales(workspace_id, id)
);
CREATE TABLE debts (
  workspace_id text NOT NULL REFERENCES workspaces(id), id text NOT NULL, company_id text,
  type text NOT NULL CHECK (type IN ('a_pagar', 'a_receber')),
  counterparty_id text, counterparty_name text NOT NULL,
  initial_amount numeric(20,2) NOT NULL CHECK (initial_amount > 0 AND initial_amount <> 'NaN'::numeric),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  due_date date, details jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, company_id) REFERENCES companies(workspace_id, id),
  FOREIGN KEY (workspace_id, counterparty_id) REFERENCES contacts(workspace_id, id)
);
CREATE TABLE bank_movements (
  workspace_id text NOT NULL, id text NOT NULL, bank_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste', 'transferencia')),
  amount numeric(20,2) NOT NULL CHECK (amount <> 'NaN'::numeric),
  category text, reason text NOT NULL CHECK (length(trim(reason)) > 0),
  responsible text NOT NULL, occurred_at timestamptz NOT NULL,
  reference text, sale_id text, debt_id text, reversal_of_id text,
  transfer_group_id text, import_details jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, bank_id, id),
  UNIQUE (workspace_id, reversal_of_id),
  CHECK (type IN ('ajuste', 'transferencia') OR amount >= 0),
  CHECK (reversal_of_id IS NULL OR reversal_of_id <> id),
  FOREIGN KEY (workspace_id, bank_id) REFERENCES bank_accounts(workspace_id, id),
  FOREIGN KEY (workspace_id, bank_id, reversal_of_id) REFERENCES bank_movements(workspace_id, bank_id, id),
  FOREIGN KEY (workspace_id, sale_id) REFERENCES sales(workspace_id, id),
  FOREIGN KEY (workspace_id, debt_id) REFERENCES debts(workspace_id, id)
);
CREATE TABLE debt_payments (
  workspace_id text NOT NULL, id text NOT NULL, debt_id text NOT NULL, movement_id text NOT NULL,
  amount numeric(20,2) NOT NULL CHECK (amount > 0 AND amount <> 'NaN'::numeric),
  occurred_at timestamptz NOT NULL, details jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (workspace_id, id), UNIQUE (workspace_id, movement_id),
  FOREIGN KEY (workspace_id, debt_id) REFERENCES debts(workspace_id, id),
  FOREIGN KEY (workspace_id, movement_id) REFERENCES bank_movements(workspace_id, id)
);
CREATE TABLE debt_increments (
  workspace_id text NOT NULL, id text NOT NULL, debt_id text NOT NULL,
  amount numeric(20,2) NOT NULL CHECK (amount > 0 AND amount <> 'NaN'::numeric),
  reason text NOT NULL CHECK (length(trim(reason)) > 0), occurred_at timestamptz NOT NULL,
  details jsonb NOT NULL DEFAULT '{}', PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, debt_id) REFERENCES debts(workspace_id, id)
);
CREATE TABLE stock_movements (
  workspace_id text NOT NULL, id text NOT NULL, product_id text NOT NULL, variation_id text,
  warehouse_id text NOT NULL, destination_warehouse_id text,
  type text NOT NULL CHECK (type IN ('entrada', 'saida', 'transferencia', 'defeituoso', 'ajuste')),
  quantity numeric(20,6) NOT NULL CHECK (quantity <> 'NaN'::numeric),
  occurred_at timestamptz NOT NULL, responsible text NOT NULL, reason text NOT NULL,
  reference text, sale_id text, is_removed boolean NOT NULL DEFAULT false,
  removal_reason text, removed_by text, removed_at timestamptz,
  PRIMARY KEY (workspace_id, id),
  CHECK (type = 'ajuste' OR quantity > 0),
  CHECK (type <> 'transferencia' OR (destination_warehouse_id IS NOT NULL AND destination_warehouse_id <> warehouse_id)),
  CHECK (NOT is_removed OR (length(trim(removal_reason)) > 0 AND removed_by IS NOT NULL AND removed_at IS NOT NULL AND removal_reason IS NOT NULL)),
  FOREIGN KEY (workspace_id, product_id) REFERENCES products(workspace_id, id),
  FOREIGN KEY (workspace_id, product_id, variation_id) REFERENCES product_variations(workspace_id, product_id, id),
  FOREIGN KEY (workspace_id, warehouse_id) REFERENCES warehouses(workspace_id, id),
  FOREIGN KEY (workspace_id, destination_warehouse_id) REFERENCES warehouses(workspace_id, id),
  FOREIGN KEY (workspace_id, sale_id) REFERENCES sales(workspace_id, id)
);
CREATE TABLE defective_records (
  workspace_id text NOT NULL, id text NOT NULL, movement_id text NOT NULL,
  details jsonb NOT NULL, PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, movement_id) REFERENCES stock_movements(workspace_id, id)
);
CREATE TABLE product_drafts (
  workspace_id text NOT NULL REFERENCES workspaces(id), id text NOT NULL,
  details jsonb NOT NULL, PRIMARY KEY (workspace_id, id)
);
CREATE TABLE agendas (
  workspace_id text NOT NULL REFERENCES workspaces(id), id text NOT NULL, name text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}', PRIMARY KEY (workspace_id, id)
);
CREATE TABLE calendar_events (
  workspace_id text NOT NULL, id text NOT NULL, agenda_id text NOT NULL,
  title text NOT NULL, event_date date NOT NULL, details jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (workspace_id, id), FOREIGN KEY (workspace_id, agenda_id) REFERENCES agendas(workspace_id, id)
);
CREATE TABLE notifications (
  workspace_id text NOT NULL REFERENCES workspaces(id), id text NOT NULL, user_id text,
  title text NOT NULL, message text NOT NULL, read_at timestamptz, details jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (workspace_id, id), FOREIGN KEY (user_id) REFERENCES app_users(id)
);

CREATE TABLE import_simulations (
  workspace_id text NOT NULL, workspace_kind text NOT NULL DEFAULT 'business' CHECK (workspace_kind = 'business'),
  id text NOT NULL, name text NOT NULL, data_version integer NOT NULL DEFAULT 2,
  details jsonb NOT NULL, PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, workspace_kind) REFERENCES workspaces(id, kind)
);
CREATE TABLE import_thresholds (
  workspace_id text PRIMARY KEY REFERENCES workspaces(id), details jsonb NOT NULL
);
CREATE TABLE workspace_preferences (
  workspace_id text PRIMARY KEY REFERENCES workspaces(id), details jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE user_preferences (
  user_id text PRIMARY KEY REFERENCES app_users(id),
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  last_workspace_id text REFERENCES workspaces(id), details jsonb NOT NULL DEFAULT '{}'
);

-- Personal planning: separate workspaces, shared account/ledger foundation.
CREATE TABLE personal_categories (
  workspace_id text NOT NULL, workspace_kind text NOT NULL DEFAULT 'personal' CHECK (workspace_kind = 'personal'),
  id text NOT NULL, name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('income', 'expense')), PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, workspace_kind) REFERENCES workspaces(id, kind)
);
CREATE TABLE personal_budgets (
  workspace_id text NOT NULL, id text NOT NULL, category_id text NOT NULL,
  starts_on date NOT NULL, ends_on date NOT NULL, currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  amount numeric(20,2) NOT NULL CHECK (amount >= 0 AND amount <> 'NaN'::numeric),
  PRIMARY KEY (workspace_id, id), CHECK (ends_on >= starts_on),
  UNIQUE (workspace_id, category_id, starts_on, ends_on, currency),
  FOREIGN KEY (workspace_id, category_id) REFERENCES personal_categories(workspace_id, id)
);
CREATE TABLE recurring_bills (
  workspace_id text NOT NULL, workspace_kind text NOT NULL DEFAULT 'personal' CHECK (workspace_kind = 'personal'),
  id text NOT NULL, category_id text, name text NOT NULL, bank_id text,
  amount numeric(20,2) NOT NULL CHECK (amount > 0 AND amount <> 'NaN'::numeric),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'), next_due_date date NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  active boolean NOT NULL DEFAULT true, PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, workspace_kind) REFERENCES workspaces(id, kind),
  FOREIGN KEY (workspace_id, category_id) REFERENCES personal_categories(workspace_id, id),
  FOREIGN KEY (workspace_id, bank_id, currency) REFERENCES bank_accounts(workspace_id, id, currency)
);
CREATE TABLE personal_goals (
  workspace_id text NOT NULL, workspace_kind text NOT NULL DEFAULT 'personal' CHECK (workspace_kind = 'personal'),
  id text NOT NULL, name text NOT NULL,
  target_amount numeric(20,2) NOT NULL CHECK (target_amount > 0 AND target_amount <> 'NaN'::numeric),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'), target_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, workspace_kind) REFERENCES workspaces(id, kind)
);
CREATE TABLE goal_contributions (
  workspace_id text NOT NULL, id text NOT NULL, goal_id text NOT NULL, movement_id text,
  amount numeric(20,2) NOT NULL CHECK (amount > 0 AND amount <> 'NaN'::numeric),
  occurred_at timestamptz NOT NULL, PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, goal_id) REFERENCES personal_goals(workspace_id, id),
  FOREIGN KEY (workspace_id, movement_id) REFERENCES bank_movements(workspace_id, id)
);
CREATE TABLE audit_events (
  workspace_id text NOT NULL REFERENCES workspaces(id), id text NOT NULL, actor_user_id text,
  action text NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(), details jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (workspace_id, id), FOREIGN KEY (actor_user_id) REFERENCES app_users(id)
);

-- Ledger is append-only; reversed status is derived from the compensating row.
CREATE FUNCTION reject_history_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Histórico imutável: use um novo lançamento de estorno';
END;
$$;
CREATE TRIGGER bank_movements_append_only BEFORE UPDATE OR DELETE ON bank_movements
  FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER debt_payments_append_only BEFORE UPDATE OR DELETE ON debt_payments
  FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER debt_increments_append_only BEFORE UPDATE OR DELETE ON debt_increments
  FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER audit_events_append_only BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER stock_movements_no_delete BEFORE DELETE ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();

CREATE TRIGGER bank_movements_no_truncate BEFORE TRUNCATE ON bank_movements
  FOR EACH STATEMENT EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER stock_movements_no_truncate BEFORE TRUNCATE ON stock_movements
  FOR EACH STATEMENT EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER debt_payments_no_truncate BEFORE TRUNCATE ON debt_payments
  FOR EACH STATEMENT EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER audit_events_no_truncate BEFORE TRUNCATE ON audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION reject_history_mutation();

CREATE FUNCTION protect_stock_entry() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (to_jsonb(NEW) - ARRAY['is_removed', 'removal_reason', 'removed_by', 'removed_at']) IS DISTINCT FROM
     (to_jsonb(OLD) - ARRAY['is_removed', 'removal_reason', 'removed_by', 'removed_at']) THEN
    RAISE EXCEPTION 'Movimentação de estoque não pode ser reescrita';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER stock_movements_audit_only BEFORE UPDATE ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION protect_stock_entry();

CREATE FUNCTION validate_reversal() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE original bank_movements;
BEGIN
  IF NEW.reversal_of_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO STRICT original FROM bank_movements
    WHERE workspace_id = NEW.workspace_id AND id = NEW.reversal_of_id;
  IF original.reversal_of_id IS NOT NULL THEN RAISE EXCEPTION 'Um estorno não pode ser estornado'; END IF;
  IF original.bank_id <> NEW.bank_id THEN RAISE EXCEPTION 'Estorno deve usar a conta original'; END IF;
  IF NEW.sale_id IS DISTINCT FROM original.sale_id OR NEW.debt_id IS DISTINCT FROM original.debt_id THEN
    RAISE EXCEPTION 'Estorno deve preservar os vínculos originais';
  END IF;
  IF (original.type = 'entrada' AND (NEW.type <> 'saida' OR NEW.amount <> original.amount)) OR
     (original.type = 'saida' AND (NEW.type <> 'entrada' OR NEW.amount <> original.amount)) OR
     (original.type IN ('ajuste', 'transferencia') AND (NEW.type <> original.type OR NEW.amount <> -original.amount)) THEN
    RAISE EXCEPTION 'Estorno deve compensar exatamente o valor original';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER bank_movements_validate_reversal BEFORE INSERT ON bank_movements
  FOR EACH ROW EXECUTE FUNCTION validate_reversal();
CREATE VIEW bank_balances WITH (security_invoker = true) AS
  SELECT a.workspace_id, a.id AS bank_id, a.currency,
    coalesce(sum(CASE WHEN m.type = 'saida' THEN -m.amount ELSE m.amount END), 0) AS balance
  FROM bank_accounts a LEFT JOIN bank_movements m ON m.workspace_id = a.workspace_id AND m.bank_id = a.id
  GROUP BY a.workspace_id, a.id, a.currency;
CREATE VIEW financial_ledger WITH (security_invoker = true) AS
  SELECT m.*, EXISTS (SELECT 1 FROM bank_movements r WHERE r.workspace_id = m.workspace_id AND r.reversal_of_id = m.id) AS is_reversed
  FROM bank_movements m;

CREATE VIEW stock_balances WITH (security_invoker = true) AS
  SELECT workspace_id, product_id, variation_id, warehouse_id, sum(delta) AS quantity
  FROM (
    SELECT workspace_id, product_id, variation_id, warehouse_id,
      CASE WHEN type IN ('saida', 'defeituoso', 'transferencia') THEN -quantity ELSE quantity END AS delta
    FROM stock_movements WHERE NOT is_removed
    UNION ALL
    SELECT workspace_id, product_id, variation_id, destination_warehouse_id AS warehouse_id, quantity AS delta
    FROM stock_movements WHERE type = 'transferencia' AND NOT is_removed
  ) entries GROUP BY workspace_id, product_id, variation_id, warehouse_id;
CREATE VIEW debt_balances WITH (security_invoker = true) AS
  SELECT d.workspace_id, d.id AS debt_id, d.currency,
    d.initial_amount + coalesce(i.amount, 0) AS total_amount,
    coalesce(p.amount, 0) AS paid_amount,
    d.initial_amount + coalesce(i.amount, 0) - coalesce(p.amount, 0) AS remaining_amount
  FROM debts d
  LEFT JOIN (SELECT workspace_id, debt_id, sum(amount) AS amount FROM debt_increments GROUP BY workspace_id, debt_id) i
    ON i.workspace_id = d.workspace_id AND i.debt_id = d.id
  LEFT JOIN (
    SELECT p.workspace_id, p.debt_id, sum(p.amount) AS amount FROM debt_payments p
    WHERE NOT EXISTS (SELECT 1 FROM bank_movements r WHERE r.workspace_id = p.workspace_id AND r.reversal_of_id = p.movement_id)
    GROUP BY p.workspace_id, p.debt_id
  ) p ON p.workspace_id = d.workspace_id AND p.debt_id = d.id;

CREATE INDEX sales_company_date ON sales(workspace_id, company_id, occurred_at);
CREATE INDEX bank_movements_account_date ON bank_movements(workspace_id, bank_id, occurred_at);
CREATE INDEX stock_movements_product_warehouse ON stock_movements(workspace_id, product_id, warehouse_id);
CREATE INDEX bank_movements_sale ON bank_movements(workspace_id, sale_id);
CREATE INDEX debt_payments_debt ON debt_payments(workspace_id, debt_id);

-- Default-deny for future non-owner roles. Auth policies are intentionally not invented.
-- Configure authenticated policies/roles BEFORE connecting an application.
DO $$
DECLARE table_name text;
BEGIN
  FOR table_name IN SELECT tablename FROM pg_tables WHERE schemaname = 'myoffice' LOOP
    EXECUTE format('ALTER TABLE myoffice.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END;
$$;
COMMIT;
