import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ZUNO Phase 9 schema - Life Signals and Realignment.
 *
 * Creates the tables from Step 20 Data Model sections 31-35, plus two the data
 * model implies but does not name: `zuno_life_signal_confirmations` (Roadmap
 * section 60 requires user confirmation and rejection to be a recorded
 * transition, not a mutable flag) and `zuno_realignment_assumptions` (Step 14
 * section 24 makes assumption tracking the thing that keeps realignment
 * explainable).
 *
 * WHY EVERY CHECK CONSTRAINT IS A SEPARATE `ALTER TABLE`
 *
 * This bit the project once already, and the evidence is in
 * `1757800000000-AddZunoCheckConstraints.ts`: this schema has historically been
 * created by TypeORM `synchronize`, so by the time a migration runs the tables
 * usually exist and `CREATE TABLE IF NOT EXISTS` becomes a no-op - silently
 * taking every inline constraint with it. On ib_db that left 28 ZUNO tables
 * with 78 indexes and zero CHECK constraints. Indexes survived only because
 * `CREATE INDEX IF NOT EXISTS` is its own statement.
 *
 * So no CHECK is declared inline below. Each one is added afterwards through
 * `addCheck`, which tests `pg_constraint` first and is therefore idempotent and
 * correct whether the table was created here or by synchronize.
 *
 * `database.module.ts` still hard-codes `synchronize: true` and
 * `migrationsRun: false`, so in the current configuration this file does not
 * run. It is written to be correct when that flag is turned off, and safe to
 * run against a database synchronize has already touched.
 */
export class CreateZunoLifeSignals1758300000000 implements MigrationInterface {
  name = 'CreateZunoLifeSignals1758300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ---------------------------------------------------------------
    // Life Signals (Step 20 section 31)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_life_signals" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "challenge_id" uuid NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "signal_type" varchar(32) NOT NULL,
        "source" varchar(32) NOT NULL,
        "nature" varchar(16) NOT NULL DEFAULT 'EVENT',
        "domain" varchar(32) NULL,
        "raw_value" jsonb NOT NULL,
        "normalized_value" jsonb NULL,
        "confidence" numeric(4,3) NOT NULL DEFAULT 0,
        "reliability" varchar(24) NOT NULL,
        "confirmation_status" varchar(32) NOT NULL,
        "materiality" varchar(16) NOT NULL,
        "relevance" varchar(16) NOT NULL,
        "urgency_change" varchar(16) NOT NULL,
        "status" varchar(24) NOT NULL,
        "is_inference" boolean NOT NULL DEFAULT false,
        "clarification_required" boolean NOT NULL DEFAULT false,
        "realignment_required" boolean NOT NULL DEFAULT false,
        "reason_codes" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "fingerprint" varchar(64) NOT NULL,
        "supersedes_signal_id" uuid NULL,
        "occurred_at" timestamptz NULL,
        "detected_at" timestamptz NOT NULL,
        "processed_at" timestamptz NULL,
        "stale_after" timestamptz NULL,
        "rulebook_version_id" uuid NULL,
        "detector_version" varchar(64) NOT NULL,
        "safety_decision_id" uuid NULL,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    // Step 20 section 87 names life_signals(user_id, challenge_id, status) as
    // the primary access path.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signals_user_challenge_status" ON "zuno_life_signals" ("user_id", "challenge_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signals_user_detected" ON "zuno_life_signals" ("user_id", "detected_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signals_challenge" ON "zuno_life_signals" ("challenge_id")`,
    );
    // Filtered column: every "is this real yet" read narrows on it.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signals_confirmation" ON "zuno_life_signals" ("confirmation_status")`,
    );
    // Deduplication lookup (Step 13 sections 20, 88) happens on every write.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signals_fingerprint" ON "zuno_life_signals" ("challenge_id", "fingerprint")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signals_supersedes" ON "zuno_life_signals" ("supersedes_signal_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signals_rulebook" ON "zuno_life_signals" ("rulebook_version_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signals_safety_decision" ON "zuno_life_signals" ("safety_decision_id")`,
    );
    // The staleness sweep (Step 13 section 60) scans exactly this predicate.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_zuno_life_signals_stale_due"
      ON "zuno_life_signals" ("stale_after")
      WHERE "deleted_at" IS NULL
        AND "stale_after" IS NOT NULL
        AND "status" IN ('CANDIDATE','ACTIVE')
    `);
    // The Realignment Engine's read: confirmed, active, mine.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_zuno_life_signals_actionable"
      ON "zuno_life_signals" ("user_id", "challenge_id", "detected_at" DESC)
      WHERE "deleted_at" IS NULL
        AND "status" = 'ACTIVE'
        AND "confirmation_status" IN ('CONFIRMED_USER_REPORTED','CONFIRMED_SYSTEM_OBSERVED','CONFIRMED_ADMIN')
    `);

    // ---------------------------------------------------------------
    // Life Signal sources - the evidence behind a signal (Step 13 section 6)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_life_signal_sources" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "life_signal_id" uuid NOT NULL REFERENCES "zuno_life_signals"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL,
        "source" varchar(32) NOT NULL,
        "origin" varchar(32) NOT NULL,
        "reliability" varchar(24) NOT NULL,
        "source_event_id" uuid NULL,
        "source_ref" varchar(128) NULL,
        "fingerprint" varchar(64) NOT NULL,
        "payload" jsonb NOT NULL,
        "observed_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signal_sources_signal" ON "zuno_life_signal_sources" ("life_signal_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signal_sources_ref" ON "zuno_life_signal_sources" ("source_event_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signal_sources_user" ON "zuno_life_signal_sources" ("user_id")`,
    );

    // ---------------------------------------------------------------
    // Confirmation transitions (Roadmap section 60)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_life_signal_confirmations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "life_signal_id" uuid NOT NULL REFERENCES "zuno_life_signals"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL,
        "from_status" varchar(32) NOT NULL,
        "to_status" varchar(32) NOT NULL,
        "actor_type" varchar(16) NOT NULL,
        "actor_id" uuid NULL,
        "prompt_text" text NULL,
        "response_note" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signal_confirmations_signal" ON "zuno_life_signal_confirmations" ("life_signal_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signal_confirmations_user" ON "zuno_life_signal_confirmations" ("user_id")`,
    );

    // ---------------------------------------------------------------
    // Life Signal impacts (Step 20 section 33)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_life_signal_impacts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "life_signal_id" uuid NOT NULL REFERENCES "zuno_life_signals"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL,
        "entity_type" varchar(32) NOT NULL,
        "entity_id" uuid NULL,
        "entity_key" varchar(128) NULL,
        "impact_type" varchar(24) NOT NULL,
        "impact_score" numeric(4,3) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signal_impacts_signal" ON "zuno_life_signal_impacts" ("life_signal_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signal_impacts_entity" ON "zuno_life_signal_impacts" ("entity_type", "entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_life_signal_impacts_user" ON "zuno_life_signal_impacts" ("user_id")`,
    );

    // ---------------------------------------------------------------
    // Realignments (Step 20 section 34)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_realignments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "challenge_id" uuid NOT NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "trigger_type" varchar(32) NOT NULL,
        "trigger_signal_id" uuid NULL REFERENCES "zuno_life_signals"("id") ON DELETE SET NULL,
        "level" varchar(16) NOT NULL,
        "scope" varchar(24) NOT NULL,
        "status" varchar(32) NOT NULL,
        "reason" text NOT NULL,
        "reason_codes" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "previous_state_ref" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "new_state_ref" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "previous_context_version" integer NULL,
        "current_context_version" integer NULL,
        "plan_change_mode" varchar(16) NOT NULL DEFAULT 'NONE',
        "scenario_reassessment_required" boolean NOT NULL DEFAULT false,
        "mka_refresh_required" boolean NOT NULL DEFAULT false,
        "user_confirmation_required" boolean NOT NULL DEFAULT false,
        "safety_review_required" boolean NOT NULL DEFAULT false,
        "trigger_fingerprint" varchar(64) NOT NULL,
        "superseded_by_id" uuid NULL,
        "rulebook_version_id" uuid NULL,
        "engine_version" varchar(64) NOT NULL,
        "applied_at" timestamptz NULL,
        "completed_at" timestamptz NULL,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_realignments_user_challenge" ON "zuno_realignments" ("user_id", "challenge_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_realignments_status" ON "zuno_realignments" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_realignments_trigger_signal" ON "zuno_realignments" ("trigger_signal_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_realignments_fingerprint" ON "zuno_realignments" ("challenge_id", "trigger_fingerprint")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_realignments_superseded_by" ON "zuno_realignments" ("superseded_by_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_realignments_rulebook" ON "zuno_realignments" ("rulebook_version_id")`,
    );
    // Roadmap section 63: at most one realignment may be in flight per
    // challenge. Two concurrently applicable realignments are precisely how a
    // user ends up with contradictory current plans, and a partial unique index
    // makes that unrepresentable rather than merely discouraged.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_realignments_one_in_flight"
      ON "zuno_realignments" ("challenge_id")
      WHERE "deleted_at" IS NULL
        AND "status" IN ('PENDING','EVALUATED','AWAITING_USER_CONFIRMATION')
    `);

    // ---------------------------------------------------------------
    // Realignment changes (Step 20 section 35)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_realignment_changes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "realignment_id" uuid NOT NULL REFERENCES "zuno_realignments"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL,
        "entity_type" varchar(32) NOT NULL,
        "entity_id" uuid NULL,
        "change_type" varchar(32) NOT NULL,
        "before_value" jsonb NULL,
        "after_value" jsonb NULL,
        "reason" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_realignment_changes_realignment" ON "zuno_realignment_changes" ("realignment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_realignment_changes_entity" ON "zuno_realignment_changes" ("entity_type", "entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_realignment_changes_user" ON "zuno_realignment_changes" ("user_id")`,
    );

    // ---------------------------------------------------------------
    // Realignment assumptions (Step 14 sections 24-25)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_realignment_assumptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "realignment_id" uuid NOT NULL REFERENCES "zuno_realignments"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL,
        "assumption_key" varchar(128) NOT NULL,
        "statement" text NOT NULL,
        "source" varchar(32) NOT NULL,
        "status" varchar(16) NOT NULL,
        "invalidated_by_signal_id" uuid NULL REFERENCES "zuno_life_signals"("id") ON DELETE SET NULL,
        "affected_components" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_realignment_assumptions_realignment" ON "zuno_realignment_assumptions" ("realignment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_realignment_assumptions_status" ON "zuno_realignment_assumptions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_realignment_assumptions_signal" ON "zuno_realignment_assumptions" ("invalidated_by_signal_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_realignment_assumptions_user" ON "zuno_realignment_assumptions" ("user_id")`,
    );

    // ---------------------------------------------------------------
    // CHECK constraints - separate ALTER TABLE statements. See the header.
    // ---------------------------------------------------------------

    /**
     * Step 13 Rule 3: a fear must never be promoted to fact without evidence.
     *
     * `is_inference` is what every presentation layer branches on, so it must
     * never disagree with `confirmation_status`. A confirmed signal claiming to
     * be an inference would hide a real change; an inference claiming to be
     * confirmed would present a guess as a fact - the exact harm the rule
     * exists to prevent. The service sets both together today; this makes the
     * pair impossible to break from anywhere else.
     */
    await this.addCheck(
      queryRunner,
      'zuno_life_signals',
      'chk_zuno_life_signal_inference_consistent',
      `("confirmation_status" IN ('CONFIRMED_USER_REPORTED','CONFIRMED_SYSTEM_OBSERVED','CONFIRMED_ADMIN') AND "is_inference" = false)
       OR ("confirmation_status" NOT IN ('CONFIRMED_USER_REPORTED','CONFIRMED_SYSTEM_OBSERVED','CONFIRMED_ADMIN'))`,
    );

    /**
     * Step 13 sections 19 and 51: only a confirmed signal may ask for a
     * realignment. Without this, a hedged guess could reach the Realignment
     * Engine through any future write path that forgets the rule.
     */
    await this.addCheck(
      queryRunner,
      'zuno_life_signals',
      'chk_zuno_life_signal_realignment_confirmed',
      `"realignment_required" = false
       OR "confirmation_status" IN ('CONFIRMED_USER_REPORTED','CONFIRMED_SYSTEM_OBSERVED','CONFIRMED_ADMIN')`,
    );

    /** Step 13 section 22: a signal cannot supersede itself. */
    await this.addCheck(
      queryRunner,
      'zuno_life_signals',
      'chk_zuno_life_signal_supersedes_distinct',
      `"supersedes_signal_id" IS NULL OR "supersedes_signal_id" <> "id"`,
    );

    /** Step 13 section 18: confidence is a probability, not a score. */
    await this.addCheck(
      queryRunner,
      'zuno_life_signals',
      'chk_zuno_life_signal_confidence_range',
      `"confidence" >= 0 AND "confidence" <= 1`,
    );

    /**
     * Step 14 section 62: REALIGNMENT_LEVEL = NONE is a valid, useful outcome -
     * "our plan still holds". What it must never do is change a plan. Applying
     * a NONE realignment would be Anti-Pattern 108, changing the plan because
     * something happened rather than because something mattered.
     */
    await this.addCheck(
      queryRunner,
      'zuno_realignments',
      'chk_zuno_realignment_none_not_applied',
      `"level" <> 'NONE' OR "status" <> 'APPLIED'`,
    );

    /** An applied realignment has an applied_at, and vice versa. */
    await this.addCheck(
      queryRunner,
      'zuno_realignments',
      'chk_zuno_realignment_applied_at',
      `("status" = 'APPLIED' AND "applied_at" IS NOT NULL)
       OR ("status" <> 'APPLIED' AND "applied_at" IS NULL)`,
    );

    /** Step 14 section 57: a realignment cannot supersede itself. */
    await this.addCheck(
      queryRunner,
      'zuno_realignments',
      'chk_zuno_realignment_superseded_distinct',
      `"superseded_by_id" IS NULL OR "superseded_by_id" <> "id"`,
    );

    /** Step 20 section 33: an impact score is 0..1 when present. */
    await this.addCheck(
      queryRunner,
      'zuno_life_signal_impacts',
      'chk_zuno_life_signal_impact_score_range',
      `"impact_score" IS NULL OR ("impact_score" >= 0 AND "impact_score" <= 1)`,
    );

    /** A confirmation transition that goes nowhere records nothing useful. */
    await this.addCheck(
      queryRunner,
      'zuno_life_signal_confirmations',
      'chk_zuno_life_signal_confirmation_moves',
      `"from_status" <> "to_status"`,
    );
  }

  /**
   * Drops everything this migration created, in reverse dependency order.
   *
   * This destroys Life Signal and Realignment history, which is user data -
   * a development and staging facility. A production rollback of a release
   * carrying live realignments needs a data-preserving plan, not this.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    const constraints: [string, string][] = [
      ['zuno_life_signal_confirmations', 'chk_zuno_life_signal_confirmation_moves'],
      ['zuno_life_signal_impacts', 'chk_zuno_life_signal_impact_score_range'],
      ['zuno_realignments', 'chk_zuno_realignment_superseded_distinct'],
      ['zuno_realignments', 'chk_zuno_realignment_applied_at'],
      ['zuno_realignments', 'chk_zuno_realignment_none_not_applied'],
      ['zuno_life_signals', 'chk_zuno_life_signal_confidence_range'],
      ['zuno_life_signals', 'chk_zuno_life_signal_supersedes_distinct'],
      ['zuno_life_signals', 'chk_zuno_life_signal_realignment_confirmed'],
      ['zuno_life_signals', 'chk_zuno_life_signal_inference_consistent'],
    ];
    for (const [table, name] of constraints) {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "${table}" DROP CONSTRAINT IF EXISTS "${name}"`,
      );
    }

    const tables = [
      'zuno_realignment_assumptions',
      'zuno_realignment_changes',
      'zuno_realignments',
      'zuno_life_signal_impacts',
      'zuno_life_signal_confirmations',
      'zuno_life_signal_sources',
      'zuno_life_signals',
    ];
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
  }

  /**
   * Adds a CHECK constraint only if it is absent.
   *
   * PostgreSQL has no `ADD CONSTRAINT IF NOT EXISTS`, so `pg_constraint` is
   * consulted first. The table-existence guard matters as much: failing here on
   * a database where a ZUNO table is somehow missing would block every later
   * migration. Same helper, same reasoning, as
   * `1757800000000-AddZunoCheckConstraints.ts`.
   */
  private async addCheck(
    queryRunner: QueryRunner,
    table: string,
    constraintName: string,
    expression: string,
  ): Promise<void> {
    const tableExists = await queryRunner.query(
      `SELECT to_regclass($1) IS NOT NULL AS present`,
      [`public.${table}`],
    );
    if (!tableExists?.[0]?.present) return;

    const exists = await queryRunner.query(
      `SELECT 1 FROM pg_constraint WHERE conname = $1 AND conrelid = $2::regclass`,
      [constraintName, `public.${table}`],
    );
    if (exists?.length) return;

    await queryRunner.query(
      `ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" CHECK (${expression})`,
    );
  }
}
