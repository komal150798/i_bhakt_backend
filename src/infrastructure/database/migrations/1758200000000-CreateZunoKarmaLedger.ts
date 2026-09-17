import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ZUNO Karma Ledger schema - Implementation Roadmap Phase 8.
 *
 * Creates the four tables of Step 20 Data Model sections 44-48:
 *   zuno_karma_entries                 section 44
 *   zuno_karma_entry_revisions         section 46
 *   zuno_karma_score_configurations    section 47
 *   zuno_karma_patterns                section 48
 *
 * There is deliberately no totals, balance or ranking table. Step 17 sections
 * 38, 61 and 68 rule out a stored figure that summarises the person, and Rule
 * 10 rules out anything orderable across users. Daily and weekly figures are
 * computed per request from the caller's own rows.
 *
 * WHY THE CHECK CONSTRAINTS ARE SEPARATE `ALTER TABLE` STATEMENTS
 * `CREATE TABLE IF NOT EXISTS` is a no-op when the table already exists, and a
 * no-op silently skips every inline constraint in the body. This repository has
 * `synchronize: true` forced on in `database.module.ts`, so TypeORM will
 * usually have created these tables by reflection before this migration ever
 * runs - and reflection does not create CHECK constraints. An inline
 * `CHECK (points >= 0)` would therefore be absent in exactly the deployments
 * that matter. Each constraint below is added by name through a guarded
 * `ALTER TABLE`, which applies whether the table was created here or by
 * reflection, and is safe to re-run.
 *
 * The constraints are not decoration. `chk_zuno_karma_points_non_negative` is
 * the database-level expression of Step 17 Rule 4 ("Missing an MKA or astrology
 * remedy never creates negative Karma") and section 19 (negative scoring
 * requires Product, Safety, Behavioural Design and SME Governance approval). A
 * future bug that tries to write a deduction fails the insert rather than
 * quietly moralising at somebody.
 */
export class CreateZunoKarmaLedger1758200000000 implements MigrationInterface {
  name = 'CreateZunoKarmaLedger1758200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // -----------------------------------------------------------------
    // Ledger entries (Step 20 section 44)
    // -----------------------------------------------------------------
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

    // Every FK and every filtered column, per Step 20 section 84's index plan
    // and the filters Step 17 section 72 anticipates.
    await this.index(
      queryRunner,
      'idx_zuno_karma_entries_user_created',
      'zuno_karma_entries',
      '"user_id", "created_at" DESC',
    );
    await this.index(
      queryRunner,
      'idx_zuno_karma_entries_user_status',
      'zuno_karma_entries',
      '"user_id", "status"',
    );
    await this.index(
      queryRunner,
      'idx_zuno_karma_entries_user_category',
      'zuno_karma_entries',
      '"user_id", "category"',
    );
    await this.index(
      queryRunner,
      'idx_zuno_karma_entries_user_classification',
      'zuno_karma_entries',
      '"user_id", "classification"',
    );
    await this.index(
      queryRunner,
      'idx_zuno_karma_entries_user_source',
      'zuno_karma_entries',
      '"user_id", "source"',
    );
    await this.index(
      queryRunner,
      'idx_zuno_karma_entries_user_occurred',
      'zuno_karma_entries',
      '"user_id", "occurred_at" DESC',
    );
    await this.index(
      queryRunner,
      'idx_zuno_karma_entries_challenge',
      'zuno_karma_entries',
      '"challenge_id"',
    );
    await this.index(
      queryRunner,
      'idx_zuno_karma_entries_plan_item',
      'zuno_karma_entries',
      '"plan_item_id"',
    );
    await this.index(
      queryRunner,
      'idx_zuno_karma_entries_mka_item',
      'zuno_karma_entries',
      '"mka_item_id"',
    );

    // Step 17 section 91 / Build Rule 79: a retried event must not create a
    // second entry. The service checks first, but two concurrent deliveries can
    // both pass that check - only a unique index actually decides the race.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_zuno_karma_entries_source_event"
      ON "zuno_karma_entries" ("user_id", "source_event_id")
      WHERE "source_event_id" IS NOT NULL AND "deleted_at" IS NULL
    `);

    // Step 17 sections 57 and 62: one upstream action, one ledger entry -
    // including when the same action supports two challenges.
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

    // -----------------------------------------------------------------
    // Revisions (Step 20 section 46)
    // -----------------------------------------------------------------
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
    await this.index(
      queryRunner,
      'idx_zuno_karma_revisions_entry',
      'zuno_karma_entry_revisions',
      '"karma_entry_id", "created_at" DESC',
    );
    await this.index(
      queryRunner,
      'idx_zuno_karma_revisions_user',
      'zuno_karma_entry_revisions',
      '"user_id", "created_at" DESC',
    );

    // -----------------------------------------------------------------
    // Versioned scoring configuration (Step 20 section 47)
    // -----------------------------------------------------------------
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
    await this.index(
      queryRunner,
      'idx_zuno_karma_score_configs_status',
      'zuno_karma_score_configurations',
      '"status"',
    );
    // At most one ACTIVE version at a time. Step 17 section 22 needs every
    // entry to name the model that scored it; two active models would make
    // "which one was in force" unanswerable.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_zuno_karma_score_configs_active"
      ON "zuno_karma_score_configurations" ("status")
      WHERE "status" = 'ACTIVE' AND "deleted_at" IS NULL
    `);

    // -----------------------------------------------------------------
    // Derived patterns (Step 20 section 48)
    // -----------------------------------------------------------------
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
    await this.index(
      queryRunner,
      'idx_zuno_karma_patterns_user',
      'zuno_karma_patterns',
      '"user_id", "status"',
    );
    await this.index(
      queryRunner,
      'idx_zuno_karma_patterns_user_type',
      'zuno_karma_patterns',
      '"user_id", "pattern_type"',
    );
    await this.index(
      queryRunner,
      'idx_zuno_karma_patterns_challenge',
      'zuno_karma_patterns',
      '"challenge_id"',
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_zuno_karma_patterns_user_type"
      ON "zuno_karma_patterns" ("user_id", "pattern_type")
      WHERE "deleted_at" IS NULL
    `);

    // -----------------------------------------------------------------
    // CHECK constraints - separate statements, see the header note
    // -----------------------------------------------------------------

    /**
     * Step 17 Rules 4 and 5, sections 17-19 and 28. The single most important
     * line in this migration: the ledger cannot hold a deduction.
     */
    await this.check(
      queryRunner,
      'zuno_karma_entries',
      'chk_zuno_karma_points_non_negative',
      `"points" >= 0`,
    );

    /** Step 17 section 17 / section 92: bounded output, 0-10 per entry. */
    await this.check(
      queryRunner,
      'zuno_karma_entries',
      'chk_zuno_karma_points_bounded',
      `"points" <= 10`,
    );

    /** Step 17 section 8: the five-valued taxonomy, never a binary. */
    await this.check(
      queryRunner,
      'zuno_karma_entries',
      'chk_zuno_karma_classification',
      `"classification" IN ('CONSTRUCTIVE','UNCONSTRUCTIVE','NEUTRAL','MIXED','UNCERTAIN')`,
    );

    /** Step 17 section 56. */
    await this.check(
      queryRunner,
      'zuno_karma_entries',
      'chk_zuno_karma_status',
      `"status" IN ('ACTIVE','EDITED','DELETED','SUPERSEDED')`,
    );

    /**
     * Step 17 sections 3, 68-69 and Roadmap section 56. Private is the only
     * value, because no approved sharing feature exists. Adding
     * 'SHARED_EXPLICIT' here is the schema half of building the explicit,
     * granular, revocable flow section 69 requires - not a prerequisite for it.
     */
    await this.check(
      queryRunner,
      'zuno_karma_entries',
      'chk_zuno_karma_visibility_private',
      `"visibility" IN ('PRIVATE')`,
    );

    /** Step 17 section 53: confidence is a probability, or absent. */
    await this.check(
      queryRunner,
      'zuno_karma_entries',
      'chk_zuno_karma_confidence_range',
      `"confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1)`,
    );

    /**
     * Step 17 section 62: one action, one entry. An entry may reference a plan
     * item or an MKA item, never both - a row referencing two upstream actions
     * could not be de-duplicated against either.
     */
    await this.check(
      queryRunner,
      'zuno_karma_entries',
      'chk_zuno_karma_single_source_ref',
      `NOT ("plan_item_id" IS NOT NULL AND "mka_item_id" IS NOT NULL)`,
    );

    /**
     * Step 17 sections 22 and 58: provenance is not optional. An entry that
     * cannot say which models produced it stops being explainable the moment
     * either one changes.
     */
    await this.check(
      queryRunner,
      'zuno_karma_entries',
      'chk_zuno_karma_provenance_present',
      `length("scoring_model_version") > 0 AND length("classification_model_version") > 0`,
    );

    /**
     * Step 17 section 71 / Build Rule 143: erasure is a real state. A redacted
     * entry must not still be holding the text it claims to have erased.
     */
    await this.check(
      queryRunner,
      'zuno_karma_entries',
      'chk_zuno_karma_redaction_consistent',
      `"redacted_at" IS NULL OR "raw_text" IS NULL`,
    );

    await this.check(
      queryRunner,
      'zuno_karma_entry_revisions',
      'chk_zuno_karma_revision_actor',
      `"changed_by" IN ('USER','SYSTEM')`,
    );

    await this.check(
      queryRunner,
      'zuno_karma_score_configurations',
      'chk_zuno_karma_score_config_status',
      `"status" IN ('DRAFT','ACTIVE','RETIRED')`,
    );

    /** Step 17 section 23: a rescore policy is always recorded, never implied. */
    await this.check(
      queryRunner,
      'zuno_karma_score_configurations',
      'chk_zuno_karma_rescore_policy',
      `"rescore_policy" IN ('FUTURE_ONLY','USER_OPT_IN_RECALCULATION','ADMIN_MIGRATION_WITH_AUDIT')`,
    );

    /** Step 17 section 75: a pattern without evidence is an assertion. */
    await this.check(
      queryRunner,
      'zuno_karma_patterns',
      'chk_zuno_karma_pattern_evidence',
      `"evidence_count" >= 0`,
    );

    await this.check(
      queryRunner,
      'zuno_karma_patterns',
      'chk_zuno_karma_pattern_status',
      `"status" IN ('OBSERVED','FADED')`,
    );

    // -----------------------------------------------------------------
    // Seed scoring model 1.0 (Step 17 sections 22, 92)
    // -----------------------------------------------------------------
    //
    // The row must exist before any entry can honestly stamp
    // scoring_model_version = '1.0'. Values mirror KARMA_SCORING_V1 in
    // `src/zuno/karma/scoring/karma-scoring.ts`; the code is the executable
    // copy, this row is the auditable one. ON CONFLICT DO NOTHING so a re-run
    // never disturbs a version already in force.
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

  /**
   * Rollback. Step 20 section 97 and Build Rule 25.
   *
   * Dropped in reverse dependency order. This destroys the user's private
   * ledger, so it is a development and staging facility - rolling back a
   * release that carried live entries needs a data-preserving plan, not this.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
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

  private async index(
    queryRunner: QueryRunner,
    name: string,
    table: string,
    columns: string,
  ): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "${name}" ON "${table}" (${columns})`,
    );
  }

  /**
   * Adds a named CHECK constraint if it is not already present.
   *
   * PostgreSQL has no `ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS`, so the
   * guard is a lookup in pg_constraint. Written this way rather than inline in
   * CREATE TABLE because `CREATE TABLE IF NOT EXISTS` skips the entire body
   * when the table exists, which is the common case here - see the header.
   */
  private async check(
    queryRunner: QueryRunner,
    table: string,
    name: string,
    expression: string,
  ): Promise<void> {
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
