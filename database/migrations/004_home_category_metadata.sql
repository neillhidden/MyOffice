-- Offline only, after 001–003. Business uniqueness remains unchanged.
SET search_path = myoffice, public;
ALTER TABLE personal_categories ADD COLUMN icon text, ADD COLUMN edited_at timestamptz, ADD COLUMN legacy_key text;
ALTER TABLE personal_subcategories ADD COLUMN icon text, ADD COLUMN edited_at timestamptz, ADD COLUMN legacy_key text;
-- The UI explicitly warns about duplicates and can keep distinct IDs if confirmed.
DROP INDEX personal_subcategory_name;
CREATE INDEX personal_subcategory_name ON personal_subcategories(workspace_id, category_id, lower(trim(name)));
