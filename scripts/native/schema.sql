CREATE TABLE IF NOT EXISTS "app_config" (
 "app_name" TEXT DEFAULT 'ImobFlow AI',
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "super_admin_emails" TEXT NOT NULL DEFAULT '[]',
 "system_settings" TEXT DEFAULT '{}',
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS "commission" (
 "company_id" TEXT NOT NULL,
 "corretor_id" TEXT NOT NULL,
 "corretor_nome" TEXT,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "date" TEXT NOT NULL,
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "notes" TEXT,
 "payment_status" TEXT NOT NULL DEFAULT 'pendente',
 "percentage" REAL DEFAULT 0 CHECK("percentage" BETWEEN 0 AND 100),
 "property_id" TEXT,
 "proposal_id" TEXT,
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "value" REAL NOT NULL CHECK("value" IS NULL OR "value">=0)
);
CREATE INDEX IF NOT EXISTS idx_commission_company_id ON commission(company_id);
CREATE INDEX IF NOT EXISTS idx_commission_date ON commission(date);
CREATE TABLE IF NOT EXISTS "company" (
 "cnpj" TEXT,
 "cor_primaria" TEXT,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "creci" TEXT,
 "email" TEXT,
 "endereco" TEXT DEFAULT '{}',
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "logo_url" TEXT,
 "name" TEXT NOT NULL,
 "owner_email" TEXT,
 "owner_nome" TEXT,
 "owner_telefone" TEXT,
 "plano" TEXT NOT NULL DEFAULT 'starter',
 "settings" TEXT NOT NULL DEFAULT '{}',
 "slug" TEXT UNIQUE,
 "status" TEXT NOT NULL DEFAULT 'trial',
 "telefone" TEXT,
 "trial_ate" TEXT,
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS "company_user" (
 "ativo" BOOLEAN NOT NULL DEFAULT 1,
 "comissao_pct" REAL NOT NULL DEFAULT '50' CHECK("comissao_pct" BETWEEN 0 AND 100),
 "company_id" TEXT NOT NULL,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "creci" TEXT,
 "email" TEXT NOT NULL,
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "must_change_password" BOOLEAN NOT NULL DEFAULT '0',
 "nome" TEXT,
 "role" TEXT NOT NULL DEFAULT 'corretor',
 "ultimo_login" TEXT,
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "user_id" TEXT
);
CREATE INDEX IF NOT EXISTS idx_company_user_company_id ON company_user(company_id);
CREATE INDEX IF NOT EXISTS idx_company_user_user_id ON company_user(user_id);
CREATE TABLE IF NOT EXISTS "lead" (
 "assigned_to" TEXT,
 "bedrooms_min" REAL DEFAULT 0,
 "budget_max" REAL DEFAULT 0 CHECK("budget_max" IS NULL OR "budget_max">=0),
 "company_id" TEXT NOT NULL,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "email" TEXT,
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "interest_property_id" TEXT,
 "interest_type" TEXT,
 "lost_reason" TEXT,
 "name" TEXT NOT NULL,
 "neighborhoods" TEXT DEFAULT '[]',
 "notes" TEXT,
 "phone" TEXT NOT NULL,
 "source" TEXT NOT NULL DEFAULT 'manual',
 "status" TEXT NOT NULL DEFAULT 'novo',
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_lead_company_id ON lead(company_id);
CREATE TABLE IF NOT EXISTS "operational_cost" (
 "amount" REAL NOT NULL CHECK("amount" IS NULL OR "amount">=0),
 "category" TEXT,
 "company_id" TEXT NOT NULL,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "date" TEXT NOT NULL,
 "description" TEXT NOT NULL,
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "payment_status" TEXT NOT NULL DEFAULT 'pendente',
 "recurring" BOOLEAN NOT NULL DEFAULT '0',
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_operational_cost_company_id ON operational_cost(company_id);
CREATE INDEX IF NOT EXISTS idx_operational_cost_date ON operational_cost(date);
CREATE TABLE IF NOT EXISTS "property" (
 "address" TEXT NOT NULL DEFAULT '{}',
 "area_total" REAL DEFAULT 0,
 "area_useful" REAL DEFAULT 0,
 "bathrooms" REAL DEFAULT 0,
 "bedrooms" REAL DEFAULT 0,
 "captado_por" TEXT,
 "city" TEXT,
 "code" TEXT,
 "company_id" TEXT NOT NULL,
 "condo_fee" REAL DEFAULT 0 CHECK("condo_fee" IS NULL OR "condo_fee">=0),
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "description" TEXT,
 "features" TEXT DEFAULT '[]',
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "iptu" REAL DEFAULT 0 CHECK("iptu" IS NULL OR "iptu">=0),
 "listed_at" TEXT,
 "neighborhood" TEXT,
 "owner_email" TEXT,
 "owner_name" TEXT,
 "owner_phone" TEXT,
 "parking" REAL DEFAULT 0,
 "photos" TEXT DEFAULT '[]',
 "price" REAL NOT NULL CHECK("price" IS NULL OR "price">=0),
 "slug" TEXT,
 "state" TEXT,
 "status" TEXT NOT NULL DEFAULT 'disponivel',
 "suites" REAL DEFAULT 0,
 "title" TEXT NOT NULL,
 "transaction" TEXT NOT NULL,
 "type" TEXT NOT NULL,
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "video_url" TEXT,
 "zip_code" TEXT
);
CREATE INDEX IF NOT EXISTS idx_property_company_id ON property(company_id);
CREATE TABLE IF NOT EXISTS "proposal" (
 "company_id" TEXT NOT NULL,
 "contract_url" TEXT,
 "corretor_id" TEXT,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "lead_id" TEXT NOT NULL,
 "lead_name" TEXT,
 "observations" TEXT,
 "payment_terms" TEXT,
 "property_id" TEXT NOT NULL,
 "property_title" TEXT,
 "status" TEXT NOT NULL DEFAULT 'em_analise',
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "value" REAL NOT NULL CHECK("value" IS NULL OR "value">=0)
);
CREATE INDEX IF NOT EXISTS idx_proposal_company_id ON proposal(company_id);
CREATE INDEX IF NOT EXISTS idx_proposal_lead_id ON proposal(lead_id);
CREATE TABLE IF NOT EXISTS "revenue" (
 "amount" REAL NOT NULL CHECK("amount" IS NULL OR "amount">=0),
 "category" TEXT,
 "company_id" TEXT NOT NULL,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "date" TEXT NOT NULL,
 "description" TEXT NOT NULL,
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "notes" TEXT,
 "payment_status" TEXT NOT NULL DEFAULT 'pendente',
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_revenue_company_id ON revenue(company_id);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date);
CREATE TABLE IF NOT EXISTS "user_roles" (
 "company_id" TEXT,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "role" TEXT NOT NULL,
 "user_id" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON user_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE TABLE IF NOT EXISTS "visit" (
 "company_id" TEXT NOT NULL,
 "corretor_id" TEXT,
 "corretor_nome" TEXT,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "feedback" TEXT,
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "lead_id" TEXT,
 "lead_name" TEXT,
 "lead_phone" TEXT,
 "notes" TEXT,
 "property_id" TEXT NOT NULL,
 "property_title" TEXT,
 "scheduled_at" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'agendada',
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_visit_company_id ON visit(company_id);
CREATE INDEX IF NOT EXISTS idx_visit_lead_id ON visit(lead_id);
CREATE TABLE IF NOT EXISTS "zone" (
 "city" TEXT,
 "company_id" TEXT NOT NULL,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "name" TEXT NOT NULL,
 "state" TEXT
);
CREATE INDEX IF NOT EXISTS idx_zone_company_id ON zone(company_id);
CREATE TABLE IF NOT EXISTS profiles(user_id TEXT PRIMARY KEY,email TEXT);
CREATE TABLE IF NOT EXISTS template_owner(id TEXT PRIMARY KEY,user_id TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS company_member_email ON company_user(company_id,lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS user_role_unique ON user_roles(user_id,role);
CREATE UNIQUE INDEX IF NOT EXISTS visit_property_slot ON visit(property_id,scheduled_at) WHERE status<>'cancelada';
CREATE UNIQUE INDEX IF NOT EXISTS commission_proposal_unique ON commission(proposal_id,corretor_id) WHERE proposal_id IS NOT NULL;
CREATE TRIGGER IF NOT EXISTS ref_commission_company_id_insert BEFORE INSERT ON "commission" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_commission_company_id_update BEFORE UPDATE ON "commission" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_commission_corretor_id_insert BEFORE INSERT ON "commission" WHEN NEW."corretor_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."corretor_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_commission_corretor_id_update BEFORE UPDATE ON "commission" WHEN NEW."corretor_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."corretor_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_commission_property_id_insert BEFORE INSERT ON "commission" WHEN NEW."property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_commission_property_id_update BEFORE UPDATE ON "commission" WHEN NEW."property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_commission_proposal_id_insert BEFORE INSERT ON "commission" WHEN NEW."proposal_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "proposal" WHERE id=NEW."proposal_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_commission_proposal_id_update BEFORE UPDATE ON "commission" WHEN NEW."proposal_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "proposal" WHERE id=NEW."proposal_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_company_user_company_id_insert BEFORE INSERT ON "company_user" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_company_user_company_id_update BEFORE UPDATE ON "company_user" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_lead_company_id_insert BEFORE INSERT ON "lead" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_lead_company_id_update BEFORE UPDATE ON "lead" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_lead_assigned_to_insert BEFORE INSERT ON "lead" WHEN NEW."assigned_to" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."assigned_to" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_lead_assigned_to_update BEFORE UPDATE ON "lead" WHEN NEW."assigned_to" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."assigned_to" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_lead_interest_property_id_insert BEFORE INSERT ON "lead" WHEN NEW."interest_property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."interest_property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_lead_interest_property_id_update BEFORE UPDATE ON "lead" WHEN NEW."interest_property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."interest_property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_operational_cost_company_id_insert BEFORE INSERT ON "operational_cost" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_operational_cost_company_id_update BEFORE UPDATE ON "operational_cost" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_property_company_id_insert BEFORE INSERT ON "property" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_property_company_id_update BEFORE UPDATE ON "property" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_property_captado_por_insert BEFORE INSERT ON "property" WHEN NEW."captado_por" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."captado_por" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_property_captado_por_update BEFORE UPDATE ON "property" WHEN NEW."captado_por" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."captado_por" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_proposal_company_id_insert BEFORE INSERT ON "proposal" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_proposal_company_id_update BEFORE UPDATE ON "proposal" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_proposal_lead_id_insert BEFORE INSERT ON "proposal" WHEN NEW."lead_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "lead" WHERE id=NEW."lead_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_proposal_lead_id_update BEFORE UPDATE ON "proposal" WHEN NEW."lead_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "lead" WHERE id=NEW."lead_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_proposal_property_id_insert BEFORE INSERT ON "proposal" WHEN NEW."property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_proposal_property_id_update BEFORE UPDATE ON "proposal" WHEN NEW."property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_proposal_corretor_id_insert BEFORE INSERT ON "proposal" WHEN NEW."corretor_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."corretor_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_proposal_corretor_id_update BEFORE UPDATE ON "proposal" WHEN NEW."corretor_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."corretor_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_revenue_company_id_insert BEFORE INSERT ON "revenue" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_revenue_company_id_update BEFORE UPDATE ON "revenue" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_visit_company_id_insert BEFORE INSERT ON "visit" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_visit_company_id_update BEFORE UPDATE ON "visit" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_visit_property_id_insert BEFORE INSERT ON "visit" WHEN NEW."property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_visit_property_id_update BEFORE UPDATE ON "visit" WHEN NEW."property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_visit_lead_id_insert BEFORE INSERT ON "visit" WHEN NEW."lead_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "lead" WHERE id=NEW."lead_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_visit_lead_id_update BEFORE UPDATE ON "visit" WHEN NEW."lead_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "lead" WHERE id=NEW."lead_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_visit_corretor_id_insert BEFORE INSERT ON "visit" WHEN NEW."corretor_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."corretor_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_visit_corretor_id_update BEFORE UPDATE ON "visit" WHEN NEW."corretor_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."corretor_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_zone_company_id_insert BEFORE INSERT ON "zone" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS ref_zone_company_id_update BEFORE UPDATE ON "zone" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Referência pertence a outra imobiliária ou não existe'); END;
CREATE TRIGGER IF NOT EXISTS imobflow_schema_v1 AFTER INSERT ON app_config BEGIN SELECT 1; END;
