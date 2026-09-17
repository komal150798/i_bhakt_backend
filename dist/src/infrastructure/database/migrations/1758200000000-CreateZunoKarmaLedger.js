"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateZunoKarmaLedger1758200000000 = void 0;
class CreateZunoKarmaLedger1758200000000 {
    constructor() {
        this.name = 'CreateZunoKarmaLedger1758200000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_karma_entries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "challenge_id" uuid NULL REFERENCES "zuno_challenges"("id") ON DELETE SET NULL,
        -- No FK to the plan/MKA tables: those modules ship in their own phases
        -- and the ledger must not fail to record a completed action because a
        -- sibling table does not exist yet. The service verifies the reference
        -- through KARMA_SOURCE_PORT instead.
        "plan_item_id" uuid NULL,
        "mka_item_id" uuid NULL,
        "source" varchar(32) NOT NULL,
        "source_event_id" varchar(128) NULL,
        "raw_text" text NULL,
        "classification" varchar(16) NOT NULL,
        "category" varchar(32) NOT NULL,
        "intent" varchar(32) NULL,
        "impact_scope" varchar(32) NULL,
        "points" integer NOT NULL DEFAULT 0,
        "confidence" numeric(4,3) NULL,
        "user_confirmed" boolean NOT NULL DEFAULT false,
        "visibility" varchar(24) NOT NULL DEFAULT 'PRIVATE',
        "scoring_model_version" varchar(32) NOT NULL,
        "classification_model_version" varchar(64) NOT NULL,
        "score_factors" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "evidence" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "status" varchar(16) NOT NULL DEFAULT 'ACTIVE',
        "occurred_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await this.index(queryRunner, 'idx_zuno_karma_entries_user_created', 'zuno_karma_entries', '"user_id", "created_at" DESC');
        await this.index(queryRunner, 'idx_zuno_karma_entries_user_status', 'zuno_karma_entries', '"user_id", "status"');
        await this.index(queryRunner, 'idx_zuno_karma_entries_user_category', 'zuno_karma_entries', '"user_id", "category"');
        await this.index(queryRunner, 'idx_zuno_karma_entries_user_classification', 'zuno_karma_entries', '"user_id", "classification"');
        await this.index(queryRunner, 'idx_zuno_karma_entries_user_source', 'zuno_karma_entries', '"user_id", "source"');
        await this.index(queryRunner, 'idx_zuno_karma_entries_user_occurred', 'zuno_karma_entries', '"user_id", "occurred_at" DESC');
        await this.index(queryRunner, 'idx_zuno_karma_entries_challenge', 'zuno_karma_entries', '"challenge_id"');
        await this.index(queryRunner, 'idx_zuno_karma_entries_plan_item', 'zuno_karma_entries', '"plan_item_id"');
        await this.index(queryRunner, 'idx_zuno_karma_entries_mka_item', 'zuno_karma_entries', '"mka_item_id"');
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_zuno_karma_entries_source_event"
      ON "zuno_karma_entries" ("user_id", "source_event_id")
      WHERE "source_event_id" IS NOT NULL AND "deleted_at" IS NULL
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_zuno_karma_entries_plan_item"
      ON "zuno_karma_entries" ("user_id", "plan_item_id")
      WHERE "plan_item_id" IS NOT NULL AND "deleted_at" IS NULL
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_zuno_karma_entries_mka_item"
      ON "zuno_karma_entries" ("user_id", "mka_item_id")
      WHERE "mka_item_id" IS NOT NULL AND "deleted_at" IS NULL
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_karma_entry_revisions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "karma_entry_id" uuid NOT NULL REFERENCES "zuno_karma_entries"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        -- Classified attributes only. Step 17 section 70 and Build Rule 34: an
        -- audit table outlives the row it describes, so the user's own words
        -- are never copied here. The raw_text_changed flag answers the audit
        -- question without holding a second copy.
        "previous_value" jsonb NOT NULL,
        "new_value" jsonb NOT NULL,
        "changed_by" varchar(16) NOT NULL,
        "reason" text NULL,
        "raw_text_changed" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
        await this.index(queryRunner, 'idx_zuno_karma_revisions_entry', 'zuno_karma_entry_revisions', '"karma_entry_id", "created_at" DESC');
        await this.index(queryRunner, 'idx_zuno_karma_revisions_user', 'zuno_karma_entry_revisions', '"user_id", "created_at" DESC');
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_karma_score_configurations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "version" varchar(32) NOT NULL,
        "configuration" jsonb NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'DRAFT',
        "rescore_policy" varchar(32) NOT NULL DEFAULT 'FUTURE_ONLY',
        "effective_from" timestamptz NOT NULL DEFAULT now(),
        "effective_to" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_zuno_karma_score_configs_version"
      ON "zuno_karma_score_configurations" ("version")
    `);
        await this.index(queryRunner, 'idx_zuno_karma_score_configs_status', 'zuno_karma_score_configurations', '"status"');
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_zuno_karma_score_configs_active"
      ON "zuno_karma_score_configurations" ("status")
      WHERE "status" = 'ACTIVE' AND "deleted_at" IS NULL
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_karma_patterns" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "challenge_id" uuid NULL REFERENCES "zuno_challenges"("id") ON DELETE SET NULL,
        "pattern_type" varchar(48) NOT NULL,
        "evidence_count" integer NOT NULL DEFAULT 0,
        "confidence" numeric(4,3) NULL,
        "status" varchar(16) NOT NULL DEFAULT 'OBSERVED',
        "first_observed_at" timestamptz NOT NULL DEFAULT now(),
        "last_observed_at" timestamptz NOT NULL DEFAULT now(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await this.index(queryRunner, 'idx_zuno_karma_patterns_user', 'zuno_karma_patterns', '"user_id", "status"');
        await this.index(queryRunner, 'idx_zuno_karma_patterns_user_type', 'zuno_karma_patterns', '"user_id", "pattern_type"');
        await this.index(queryRunner, 'idx_zuno_karma_patterns_challenge', 'zuno_karma_patterns', '"challenge_id"');
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_zuno_karma_patterns_user_type"
      ON "zuno_karma_patterns" ("user_id", "pattern_type")
      WHERE "deleted_at" IS NULL
    `);
        await this.check(queryRunner, 'zuno_karma_entries', 'chk_zuno_karma_points_non_negative', `"points" >= 0`);
        await this.check(queryRunner, 'zuno_karma_entries', 'chk_zuno_karma_points_bounded', `"points" <= 10`);
        await this.check(queryRunner, 'zuno_karma_entries', 'chk_zuno_karma_classification', `"classification" IN ('CONSTRUCTIVE','UNCONSTRUCTIVE','NEUTRAL','MIXED','UNCERTAIN')`);
        await this.check(queryRunner, 'zuno_karma_entries', 'chk_zuno_karma_status', `"status" IN ('ACTIVE','EDITED','DELETED','SUPERSEDED')`);
        await this.check(queryRunner, 'zuno_karma_entries', 'chk_zuno_karma_visibility_private', `"visibility" IN ('PRIVATE')`);
        await this.check(queryRunner, 'zuno_karma_entries', 'chk_zuno_karma_confidence_range', `"confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1)`);
        await this.check(queryRunner, 'zuno_karma_entries', 'chk_zuno_karma_single_source_ref', `NOT ("plan_item_id" IS NOT NULL AND "mka_item_id" IS NOT NULL)`);
        await this.check(queryRunner, 'zuno_karma_entries', 'chk_zuno_karma_provenance_present', `length("scoring_model_version") > 0 AND length("classification_model_version") > 0`);
        await this.check(queryRunner, 'zuno_karma_entries', 'chk_zuno_karma_redaction_consistent', `"redacted_at" IS NULL OR "raw_text" IS NULL`);
        await this.check(queryRunner, 'zuno_karma_entry_revisions', 'chk_zuno_karma_revision_actor', `"changed_by" IN ('USER','SYSTEM')`);
        await this.check(queryRunner, 'zuno_karma_score_configurations', 'chk_zuno_karma_score_config_status', `"status" IN ('DRAFT','ACTIVE','RETIRED')`);
        await this.check(queryRunner, 'zuno_karma_score_configurations', 'chk_zuno_karma_rescore_policy', `"rescore_policy" IN ('FUTURE_ONLY','USER_OPT_IN_RECALCULATION','ADMIN_MIGRATION_WITH_AUDIT')`);
        await this.check(queryRunner, 'zuno_karma_patterns', 'chk_zuno_karma_pattern_evidence', `"evidence_count" >= 0`);
        await this.check(queryRunner, 'zuno_karma_patterns', 'chk_zuno_karma_pattern_status', `"status" IN ('OBSERVED','FADED')`);
        await queryRunner.query(`
      INSERT INTO "zuno_karma_score_configurations"
        ("version", "configuration", "status", "rescore_policy", "effective_from")
      VALUES (
        '1.0',
        '{
          "version": "1.0",
          "maxPointsPerEntry": 10,
          "minPointsPerEntry": 0,
          "dailySoftCap": 30,
          "negativeScoringEnabled": false,
          "baseValue": 5,
          "repetitionWindowDays": 7,
          "repetitionCurve": [1.0, 1.0, 0.85, 0.7, 0.6, 0.5],
          "autoConfirmConfidence": 0.75,
          "uncertainBelowConfidence": 0.45
        }'::jsonb,
        'ACTIVE',
        'FUTURE_ONLY',
        now()
      )
      ON CONFLICT DO NOTHING
    `);
    }
    async down(queryRunner) {
        const tables = [
            'zuno_karma_patterns',
            'zuno_karma_score_configurations',
            'zuno_karma_entry_revisions',
            'zuno_karma_entries',
        ];
        for (const table of tables) {
            await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        }
    }
    async index(queryRunner, name, table, columns) {
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "${name}" ON "${table}" (${columns})`);
    }
    async check(queryRunner, table, name, expression) {
        await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = '${name}'
        ) THEN
          ALTER TABLE "${table}" ADD CONSTRAINT "${name}" CHECK (${expression});
        END IF;
      END
      $$;
    `);
    }
}
exports.CreateZunoKarmaLedger1758200000000 = CreateZunoKarmaLedger1758200000000;
//# sourceMappingURL=1758200000000-CreateZunoKarmaLedger.js.map