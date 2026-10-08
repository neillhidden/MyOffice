-- Prepared offline; apply after 001_initial.sql during the future backend phase.
BEGIN;
SET LOCAL search_path = myoffice, public;
CREATE TABLE business_categories (
  workspace_id text NOT NULL,
  workspace_kind text NOT NULL DEFAULT 'business' CHECK (workspace_kind = 'business'),
  id text NOT NULL, name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 300),
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, workspace_kind) REFERENCES workspaces(id, kind)
);
CREATE UNIQUE INDEX business_category_name ON business_categories(workspace_id, lower(trim(name)));
CREATE TABLE business_subcategories (
  workspace_id text NOT NULL, category_id text NOT NULL, id text NOT NULL,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 300),
  PRIMARY KEY (workspace_id, id), UNIQUE (workspace_id, category_id, id),
  FOREIGN KEY (workspace_id, category_id) REFERENCES business_categories(workspace_id, id)
);
CREATE UNIQUE INDEX business_subcategory_name ON business_subcategories(workspace_id, category_id, lower(trim(name)));
ALTER TABLE products ADD COLUMN category_id text, ADD COLUMN subcategory_id text;
ALTER TABLE products ADD CONSTRAINT product_category_fk FOREIGN KEY (workspace_id, category_id) REFERENCES business_categories(workspace_id, id);
ALTER TABLE products ADD CONSTRAINT product_subcategory_fk FOREIGN KEY (workspace_id, category_id, subcategory_id) REFERENCES business_subcategories(workspace_id, category_id, id);
ALTER TABLE products ADD CONSTRAINT product_subcategory_parent CHECK (subcategory_id IS NULL OR category_id IS NOT NULL);
CREATE TABLE personal_subcategories (
  workspace_id text NOT NULL, category_id text NOT NULL, id text NOT NULL,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 300),
  PRIMARY KEY (workspace_id, id), UNIQUE (workspace_id, category_id, id),
  FOREIGN KEY (workspace_id, category_id) REFERENCES personal_categories(workspace_id, id)
);
CREATE UNIQUE INDEX personal_subcategory_name ON personal_subcategories(workspace_id, category_id, lower(trim(name)));
CREATE TABLE personal_shopping_items (
  workspace_id text NOT NULL,
  workspace_kind text NOT NULL DEFAULT 'personal' CHECK (workspace_kind = 'personal'),
  id text NOT NULL, name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 300),
  category_id text NOT NULL, subcategory_id text,
  quantity numeric(20,6) NOT NULL CHECK (quantity > 0 AND quantity <> 'NaN'::numeric),
  unit_price numeric(20,2) NOT NULL CHECK (unit_price >= 0 AND unit_price <> 'NaN'::numeric),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  movement_id text, archived boolean NOT NULL DEFAULT false,
  PRIMARY KEY (workspace_id, id), UNIQUE (workspace_id, movement_id),
  FOREIGN KEY (workspace_id, workspace_kind) REFERENCES workspaces(id, kind),
  FOREIGN KEY (workspace_id, category_id) REFERENCES personal_categories(workspace_id, id),
  FOREIGN KEY (workspace_id, category_id, subcategory_id) REFERENCES personal_subcategories(workspace_id, category_id, id),
  FOREIGN KEY (workspace_id, movement_id) REFERENCES bank_movements(workspace_id, id)
);
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_shopping_items ENABLE ROW LEVEL SECURITY;
COMMIT;
