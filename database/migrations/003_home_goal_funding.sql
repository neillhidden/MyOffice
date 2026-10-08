-- Offline only. Apply after 001 and 002 when implementing the future backend.
SET search_path = myoffice, public;
ALTER TABLE personal_goals
  ADD COLUMN funding_mode text NOT NULL DEFAULT 'reserve' CHECK (funding_mode IN ('plan', 'reserve')),
  ADD COLUMN planned_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (planned_amount >= 0 AND planned_amount <> 'NaN'::numeric),
  ADD COLUMN acquired_on date,
  ADD COLUMN acquisition_movement_id text,
  ADD COLUMN category_id text,
  ADD FOREIGN KEY (workspace_id, acquisition_movement_id) REFERENCES bank_movements(workspace_id, id),
  ADD FOREIGN KEY (workspace_id, category_id) REFERENCES personal_categories(workspace_id, id),
  ADD CHECK (funding_mode = 'reserve' OR acquisition_movement_id IS NULL),
  ADD CHECK (acquisition_movement_id IS NULL OR acquired_on IS NOT NULL);
-- Preserve existing reserve goals. New goals must explicitly use the owner's
-- preference (plan by default) rather than this legacy migration default.
