"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateZunoRulebook1757700000000 = void 0;
class CreateZunoRulebook1757700000000 {
    constructor() {
        this.name = 'CreateZunoRulebook1757700000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_rulebook_versions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "version" varchar(32) NOT NULL,
        "release_name" varchar(200) NOT NULL,
        "description" text NULL,
        "release_type" varchar(16) NOT NULL,
        "status" varchar(40) NOT NULL DEFAULT 'UPLOADED',
        "source_file_name" varchar(300) NOT NULL,
        "source_file_hash" varchar(64) NOT NULL,
        "source_file_size" bigint NOT NULL,
        "source_file_location" text NULL,
        "sme_reference" varchar(120) NULL,
        "change_summary" text NULL,
        "uploaded_by" uuid NULL,
        "uploaded_at" timestamptz NOT NULL,
        "reviewed_by" uuid NULL,
        "reviewed_at" timestamptz NULL,
        "approved_by" uuid NULL,
        "approved_at" timestamptz NULL,
        "activated_by" uuid NULL,
        "activated_at" timestamptz NULL,
        "superseded_at" timestamptz NULL,
        "supersedes_version_id" uuid NULL,
        "total_rules" integer NOT NULL DEFAULT 0,
        "total_interpretations" integer NOT NULL DEFAULT 0,
        "total_remedies" integer NOT NULL DEFAULT 0,
        "total_timing_rules" integer NOT NULL DEFAULT 0,
        "total_golden_cases" integer NOT NULL DEFAULT 0,
        "domains_covered" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "status_reason" text NULL,
        "is_production" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_rulebook_versions_version" ON "zuno_rulebook_versions" ("version")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_rulebook_versions_status" ON "zuno_rulebook_versions" ("status")`);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_rulebook_single_production"
      ON "zuno_rulebook_versions" (("is_production"))
      WHERE "is_production" = true
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_rulebook_file_hash" ON "zuno_rulebook_versions" ("source_file_hash")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_rulebook_rules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "rulebook_version_id" uuid NOT NULL REFERENCES "zuno_rulebook_versions"("id") ON DELETE CASCADE,
        "external_rule_key" varchar(64) NOT NULL,
        "rule_name" varchar(300) NOT NULL,
        "domain" varchar(32) NOT NULL,
        "subcategory" varchar(64) NULL,
        "conditions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "theme" varchar(48) NOT NULL,
        "direction" varchar(16) NOT NULL,
        "strength" varchar(16) NOT NULL,
        "interpretation_key" varchar(64) NULL,
        "timing_rule_keys" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "remedy_keys" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "conflict_rule_keys" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "status" varchar(24) NOT NULL DEFAULT 'DRAFT',
        "safety_class" varchar(32) NOT NULL,
        "sensitive_subjects" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "sme_confidence" varchar(24) NOT NULL DEFAULT 'CONTEXT_DEPENDENT',
        "sme_comment" text NULL,
        "effective_from" date NULL,
        "effective_until" date NULL,
        "rule_version" varchar(16) NOT NULL DEFAULT '1.0',
        "change_reason" text NULL,
        "source_row" integer NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_rules_version_key" ON "zuno_rulebook_rules" ("rulebook_version_id", "external_rule_key")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_rules_domain" ON "zuno_rulebook_rules" ("rulebook_version_id", "domain", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_rules_theme" ON "zuno_rulebook_rules" ("rulebook_version_id", "theme")`);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_zuno_rules_approved"
      ON "zuno_rulebook_rules" ("rulebook_version_id", "domain")
      WHERE "status" = 'APPROVED' AND "deleted_at" IS NULL
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_rulebook_interpretations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "rulebook_version_id" uuid NOT NULL REFERENCES "zuno_rulebook_versions"("id") ON DELETE CASCADE,
        "external_interpretation_key" varchar(64) NOT NULL,
        "theme" varchar(48) NULL,
        "meaning" text NOT NULL,
        "allowed_domains" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "user_safe_summary" text NULL,
        "status" varchar(24) NOT NULL DEFAULT 'DRAFT',
        "source_row" integer NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_interpretations_key" ON "zuno_rulebook_interpretations" ("rulebook_version_id", "external_interpretation_key")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_rulebook_timing_rules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "rulebook_version_id" uuid NOT NULL REFERENCES "zuno_rulebook_versions"("id") ON DELETE CASCADE,
        "external_timing_key" varchar(64) NOT NULL,
        "domain" varchar(32) NULL,
        "window_type" varchar(32) NOT NULL,
        "strength" varchar(16) NOT NULL,
        "conditions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "timing_language" text NULL,
        "status" varchar(24) NOT NULL DEFAULT 'DRAFT',
        "source_row" integer NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_timing_key" ON "zuno_rulebook_timing_rules" ("rulebook_version_id", "external_timing_key")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_rulebook_remedies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "rulebook_version_id" uuid NOT NULL REFERENCES "zuno_rulebook_versions"("id") ON DELETE CASCADE,
        "external_remedy_key" varchar(64) NOT NULL,
        "name" varchar(300) NOT NULL,
        "remedy_type" varchar(32) NOT NULL,
        "mka_dimension" varchar(16) NOT NULL,
        "purpose" text NOT NULL,
        "astrological_basis" text NULL,
        "instructions" text NOT NULL,
        "frequency" varchar(24) NOT NULL,
        "duration" varchar(64) NULL,
        "preferred_time" varchar(120) NULL,
        "restrictions" text NULL,
        "conflicts_with" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "safety_class" varchar(32) NOT NULL DEFAULT 'LOW_RISK',
        "has_financial_cost" boolean NOT NULL DEFAULT false,
        "is_devotional" boolean NOT NULL DEFAULT false,
        "alternative_keys" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "user_explanation" text NULL,
        "status" varchar(24) NOT NULL DEFAULT 'DRAFT',
        "source_row" integer NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_remedies_key" ON "zuno_rulebook_remedies" ("rulebook_version_id", "external_remedy_key")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_remedies_type" ON "zuno_rulebook_remedies" ("rulebook_version_id", "remedy_type")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_rulebook_domain_configs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "rulebook_version_id" uuid NOT NULL REFERENCES "zuno_rulebook_versions"("id") ON DELETE CASCADE,
        "domain" varchar(32) NOT NULL,
        "primary_houses" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "secondary_houses" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "primary_planets" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "supporting_planets" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "relevant_divisional_charts" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "timing_factors" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "methodology_notes" text NULL,
        "source_row" integer NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_domain_config" ON "zuno_rulebook_domain_configs" ("rulebook_version_id", "domain")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_rulebook_conflict_rules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "rulebook_version_id" uuid NOT NULL REFERENCES "zuno_rulebook_versions"("id") ON DELETE CASCADE,
        "external_conflict_key" varchar(64) NOT NULL,
        "rule_keys" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "resolution_strategy" varchar(64) NOT NULL,
        "winning_rule_key" varchar(64) NULL,
        "rationale" text NULL,
        "source_row" integer NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_conflict_key" ON "zuno_rulebook_conflict_rules" ("rulebook_version_id", "external_conflict_key")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_rulebook_golden_cases" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "rulebook_version_id" uuid NOT NULL REFERENCES "zuno_rulebook_versions"("id") ON DELETE CASCADE,
        "external_case_key" varchar(64) NOT NULL,
        "case_name" varchar(300) NOT NULL,
        "domain" varchar(32) NULL,
        "birth_data" jsonb NOT NULL,
        "challenge_statement" text NOT NULL,
        "expected_rule_keys" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "expected_themes" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "expected_outcome_notes" text NULL,
        "source_row" integer NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_golden_key" ON "zuno_rulebook_golden_cases" ("rulebook_version_id", "external_case_key")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_rulebook_validation_runs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "rulebook_version_id" uuid NOT NULL REFERENCES "zuno_rulebook_versions"("id") ON DELETE CASCADE,
        "validator_version" varchar(32) NOT NULL,
        "status" varchar(24) NOT NULL,
        "total_rules" integer NOT NULL DEFAULT 0,
        "valid_rules" integer NOT NULL DEFAULT 0,
        "invalid_rules" integer NOT NULL DEFAULT 0,
        "error_count" integer NOT NULL DEFAULT 0,
        "warning_count" integer NOT NULL DEFAULT 0,
        "findings" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "started_at" timestamptz NOT NULL,
        "completed_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_validation_version" ON "zuno_rulebook_validation_runs" ("rulebook_version_id", "created_at")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_rulebook_review_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "rulebook_version_id" uuid NOT NULL REFERENCES "zuno_rulebook_versions"("id") ON DELETE CASCADE,
        "rule_id" uuid NOT NULL REFERENCES "zuno_rulebook_rules"("id") ON DELETE CASCADE,
        "external_rule_key" varchar(64) NOT NULL,
        "review_status" varchar(32) NOT NULL DEFAULT 'PENDING',
        "reviewer_id" uuid NULL,
        "review_comment" text NULL,
        "reviewed_at" timestamptz NULL,
        "secondary_reviewer_id" uuid NULL,
        "secondary_reviewed_at" timestamptz NULL,
        "requires_two_person_review" boolean NOT NULL DEFAULT false,
        "duplicate_of_key" varchar(64) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        -- Step 08 section 62: two-person review means two different people.
        CONSTRAINT "chk_zuno_review_distinct_reviewers" CHECK (
          "secondary_reviewer_id" IS NULL
          OR "reviewer_id" IS NULL
          OR "secondary_reviewer_id" <> "reviewer_id"
        )
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_review_rule" ON "zuno_rulebook_review_items" ("rule_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_review_version" ON "zuno_rulebook_review_items" ("rulebook_version_id", "review_status")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_rulebook_audit_log" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "rulebook_version_id" uuid NOT NULL REFERENCES "zuno_rulebook_versions"("id") ON DELETE CASCADE,
        "action" varchar(48) NOT NULL,
        "actor_id" uuid NULL,
        "actor_role" varchar(32) NULL,
        "reason" text NULL,
        "from_status" varchar(40) NULL,
        "to_status" varchar(40) NULL,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_rulebook_audit_version" ON "zuno_rulebook_audit_log" ("rulebook_version_id", "created_at")`);
    }
    async down(queryRunner) {
        const tables = [
            'zuno_rulebook_audit_log',
            'zuno_rulebook_review_items',
            'zuno_rulebook_validation_runs',
            'zuno_rulebook_golden_cases',
            'zuno_rulebook_conflict_rules',
            'zuno_rulebook_domain_configs',
            'zuno_rulebook_remedies',
            'zuno_rulebook_timing_rules',
            'zuno_rulebook_interpretations',
            'zuno_rulebook_rules',
            'zuno_rulebook_versions',
        ];
        for (const table of tables) {
            await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        }
    }
}
exports.CreateZunoRulebook1757700000000 = CreateZunoRulebook1757700000000;
//# sourceMappingURL=1757700000000-CreateZunoRulebook.js.map