import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ZUNO Scenario & What-If schema - Implementation Roadmap Phase 6
 * (sections 41-45), Step 20 Data Model sections 26-30, Step 12 Scenario Engine.
 *
 * Creates five tables:
 *   zuno_scenario_sets        versioned generations (Step 12 s.65, 87-88)
 *   zuno_scenarios            Step 20 s.26
 *   zuno_scenario_conditions  Step 20 s.28, Step 12 s.19-20, 58
 *   zuno_what_if_sessions     Step 20 s.29, Step 12 s.38-44
 *   zuno_what_if_assumptions  Step 20 s.30
 *
 * WHY EVERY CHECK CONSTRAINT IS A SEPARATE `ALTER TABLE`
 *
 * This repository has been bitten by the alternative. `CREATE TABLE IF NOT
 * EXISTS` is a no-op on a database where the table already exists, and this
 * project's schema has historically been created by TypeORM `synchronize`,
 * which does not emit CHECK constraints. Every inline constraint in the first
 * two ZUNO migrations was therefore silently skipped - verified on ib_db, which
 * had 28 ZUNO tables, 78 indexes and zero CHECK constraints, and had to be
 * repaired by `1757800000000-AddZunoCheckConstraints`. Indexes survived because
 * `CREATE INDEX IF NOT EXISTS` runs as its own statement.
 *
 * So: no CHECK appears inside a CREATE TABLE here. Every one is added by
 * `addCheck()` below, which is idempotent and runs whether or not the table was
 * created by this migration.
 *
 * The constraints are not cosmetic. Each one is the last line of defence for a
 * rule the specification treats as non-negotiable, and each would still hold if
 * the service-layer check were refactored away:
 *
 *   chk_zuno_scenarios_probability_label_not_numeric
 *       Step 12 sections 16, 97 and Rule 2, Step 20 section 27, Step 08
 *       section 23: no numeric event probability without a validated
 *       probabilistic model. There is no such model. The column may hold
 *       PRIMARY / PLAUSIBLE / SECONDARY / CONTINGENCY and nothing containing a
 *       digit, so no code path can ever write "72%" into it.
 *
 *   chk_zuno_what_if_sessions_hypothetical
 *       Step 12 section 39, Step 20 Rule 4, Build Rule 42: a What-If is always
 *       hypothetical. A row claiming otherwise cannot be inserted at all.
 *
 *   chk_zuno_what_if_sessions_no_plan_change
 *       Step 12 sections 39 and 41: a What-If never changes the active plan.
 *       The column exists to be asserted, so the database asserts it.
 *
 *   chk_zuno_scenarios_hypothetical_type
 *       Step 20 Rule 4: only a USER_DEFINED_WHAT_IF row may be hypothetical.
 *       A hypothetical CONTINUITY scenario sitting in an active set would be
 *       exactly the contamination the rule exists to prevent.
 *
 *   chk_zuno_scenarios_confidence_range
 *       Step 12 section 50: confidence is 0..1 and means "worth modelling",
 *       not "will happen". Out-of-range values are how a probability sneaks in.
 *
 *   chk_zuno_scenario_sets_user_facing_count
 *       Step 12 section 5 and section 103: at most four scenarios in the
 *       primary journey, never fifteen possible futures.
 *
 *   chk_zuno_scenario_sets_version_positive
 *       Step 12 section 65: set versions start at 1 and are never reused.
 *
 * OPERATIONAL NOTE, carried forward from `1757600000000-CreateZunoFoundation`:
 * `database.module.ts` currently hard-codes `synchronize: true` and
 * `migrationsRun: false`, so in the present configuration TypeORM creates these
 * tables by reflection and this migration does not run. It is written to be
 * correct when that flag is turned off and is idempotent throughout, so it is
 * safe against a database where synchronize has already built the tables -
 * which is precisely the case the ALTER TABLE approach above exists to handle.
 */
export class CreateZunoScenario1758400000000 implements MigrationInterface {
  name = 'CreateZunoScenario1758400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ---------------------------------------------------------------
    // Scenario sets - versioned generations (Step 12 sections 65, 87-88)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_scenario_sets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "challenge_id" uuid NOT NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "version_number" int NOT NULL,
        "status" varchar(24) NOT NULL DEFAULT 'CURRENT',
        "generated_reason" varchar(48) NOT NULL,
        "shared_preparation" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "watch_signals" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "seeds" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "comparison" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "diff" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "decision_readiness" varchar(32) NULL,
        "provenance" jsonb NOT NULL,
        "user_facing_count" int NOT NULL DEFAULT 0,
        "safety_decision_id" uuid NULL,
        "ai_generation_run_id" uuid NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    // Step 12 section 65: a challenge never has two sets at the same version.
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_scenario_sets_version" ON "zuno_scenario_sets" ("challenge_id", "version_number")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_scenario_sets_user" ON "zuno_scenario_sets" ("user_id", "created_at")`,
    );
    // The hot read: "give me the current set for this challenge".
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_scenario_sets_current" ON "zuno_scenario_sets" ("challenge_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_scenario_sets_safety_decision" ON "zuno_scenario_sets" ("safety_decision_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_scenario_sets_ai_run" ON "zuno_scenario_sets" ("ai_generation_run_id")`,
    );

    // ---------------------------------------------------------------
    // Scenarios (Step 20 Data Model section 26)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_scenarios" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "scenario_set_id" uuid NOT NULL REFERENCES "zuno_scenario_sets"("id") ON DELETE CASCADE,
        "challenge_id" uuid NOT NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "name" varchar(200) NOT NULL,
        "description" text NOT NULL,
        "scenario_type" varchar(32) NOT NULL,
        "case_class" varchar(32) NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'ACTIVE_CANDIDATE',
        "relevance" varchar(16) NOT NULL,
        "impact" varchar(16) NOT NULL,
        "horizon" varchar(24) NOT NULL DEFAULT 'UNSPECIFIED',
        "probability_label" varchar(32) NULL,
        "confidence" numeric(4,3) NULL,
        "hypothetical" boolean NOT NULL DEFAULT false,
        "user_facing" boolean NOT NULL DEFAULT true,
        "display_order" int NOT NULL DEFAULT 0,
        "option_ref" varchar(64) NULL,
        "payload" jsonb NOT NULL,
        "user_decision_note" text NULL,
        "triggered_at" timestamptz NULL,
        "version" int NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_scenarios_set" ON "zuno_scenarios" ("scenario_set_id", "display_order")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_scenarios_challenge_status" ON "zuno_scenarios" ("challenge_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_scenarios_user" ON "zuno_scenarios" ("user_id")`,
    );
    // Step 12 section 31: the relevance/impact matrix decides what is surfaced,
    // and Realignment reads it whenever evidence moves.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_scenarios_relevance" ON "zuno_scenarios" ("challenge_id", "relevance", "impact")`,
    );
    // Step 12 sections 69-70: rejected paths are read back on every
    // regeneration so they are not proposed again.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_zuno_scenarios_rejected"
      ON "zuno_scenarios" ("challenge_id")
      WHERE "status" = 'USER_REJECTED'
    `);

    // ---------------------------------------------------------------
    // Scenario conditions (Step 20 section 28, Step 12 sections 19-20, 58)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_scenario_conditions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "scenario_id" uuid NOT NULL REFERENCES "zuno_scenarios"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "condition_type" varchar(32) NOT NULL,
        "description" text NOT NULL,
        "signal_definition" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_scenario_conditions_scenario" ON "zuno_scenario_conditions" ("scenario_id", "condition_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_scenario_conditions_user" ON "zuno_scenario_conditions" ("user_id")`,
    );

    // ---------------------------------------------------------------
    // What-If sessions (Step 20 section 29, Step 12 sections 38-44)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_what_if_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "challenge_id" uuid NOT NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "prompt" text NOT NULL,
        "status" varchar(24) NOT NULL DEFAULT 'ACTIVE',
        "is_hypothetical" boolean NOT NULL DEFAULT true,
        "result" jsonb NULL,
        "current_plan_changed" boolean NOT NULL DEFAULT false,
        "challenge_context_version" int NULL,
        "engine_version" varchar(64) NOT NULL,
        "safety_decision_id" uuid NULL,
        "ai_generation_run_id" uuid NULL,
        "expires_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_sessions_challenge" ON "zuno_what_if_sessions" ("challenge_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_sessions_user_status" ON "zuno_what_if_sessions" ("user_id", "status")`,
    );
    // Step 20 section 29: expiry exists so a hypothetical ages out. A retention
    // sweep needs to find the expired ones without a full scan.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_sessions_expiry" ON "zuno_what_if_sessions" ("expires_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_sessions_safety_decision" ON "zuno_what_if_sessions" ("safety_decision_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_sessions_ai_run" ON "zuno_what_if_sessions" ("ai_generation_run_id")`,
    );

    // ---------------------------------------------------------------
    // What-If assumptions (Step 20 section 30)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_what_if_assumptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "what_if_session_id" uuid NOT NULL REFERENCES "zuno_what_if_sessions"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "assumption_text" text NOT NULL,
        "assumption_type" varchar(32) NOT NULL,
        "value" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_assumptions_session" ON "zuno_what_if_assumptions" ("what_if_session_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_assumptions_user" ON "zuno_what_if_assumptions" ("user_id")`,
    );

    // ---------------------------------------------------------------
    // CHECK constraints - separate statements, never inline. See the header.
    // ---------------------------------------------------------------

    /**
     * Step 12 sections 16, 97, Rule 2 / Step 20 section 27 / Step 08 s.23.
     * The one constraint in this migration that most directly protects a user:
     * it makes "72% chance of termination" unstorable.
     */
    await this.addCheck(
      queryRunner,
      'zuno_scenarios',
      'chk_zuno_scenarios_probability_label_not_numeric',
      `"probability_label" IS NULL OR "probability_label" !~ '[0-9]'`,
    );

    /** Step 12 section 50: confidence is a 0..1 modelling judgement. */
    await this.addCheck(
      queryRunner,
      'zuno_scenarios',
      'chk_zuno_scenarios_confidence_range',
      `"confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1)`,
    );

    /**
     * Step 20 Rule 4 and Step 12 section 39: hypothetical state stays isolated
     * from confirmed facts. Only a user-defined What-If row may be flagged
     * hypothetical; a hypothetical CONTINUITY scenario inside an active set is
     * the contamination the rule exists to prevent.
     */
    await this.addCheck(
      queryRunner,
      'zuno_scenarios',
      'chk_zuno_scenarios_hypothetical_type',
      `"hypothetical" = false OR "scenario_type" = 'USER_DEFINED_WHAT_IF'`,
    );

    /** Step 12 section 5 and section 103: 2-4 in the primary journey. */
    await this.addCheck(
      queryRunner,
      'zuno_scenario_sets',
      'chk_zuno_scenario_sets_user_facing_count',
      `"user_facing_count" >= 0 AND "user_facing_count" <= 4`,
    );

    /** Step 12 section 65: versions start at 1 and are never reused. */
    await this.addCheck(
      queryRunner,
      'zuno_scenario_sets',
      'chk_zuno_scenario_sets_version_positive',
      `"version_number" >= 1`,
    );

    /**
     * Step 12 section 39, Step 20 Rule 4, Build Rule 42.
     * A What-If session that is not hypothetical is a contradiction in terms,
     * and the database refuses to hold one.
     */
    await this.addCheck(
      queryRunner,
      'zuno_what_if_sessions',
      'chk_zuno_what_if_sessions_hypothetical',
      `"is_hypothetical" = true`,
    );

    /**
     * Step 12 sections 39, 41 and 102, Roadmap section 45 acceptance criterion
     * "What-If does not mutate factual state". The column is an assertion, so
     * it is asserted.
     */
    await this.addCheck(
      queryRunner,
      'zuno_what_if_sessions',
      'chk_zuno_what_if_sessions_no_plan_change',
      `"current_plan_changed" = false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const constraints: [string, string][] = [
      ['zuno_what_if_sessions', 'chk_zuno_what_if_sessions_no_plan_change'],
      ['zuno_what_if_sessions', 'chk_zuno_what_if_sessions_hypothetical'],
      ['zuno_scenario_sets', 'chk_zuno_scenario_sets_version_positive'],
      ['zuno_scenario_sets', 'chk_zuno_scenario_sets_user_facing_count'],
      ['zuno_scenarios', 'chk_zuno_scenarios_hypothetical_type'],
      ['zuno_scenarios', 'chk_zuno_scenarios_confidence_range'],
      ['zuno_scenarios', 'chk_zuno_scenarios_probability_label_not_numeric'],
    ];
    for (const [table, name] of constraints) {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "${table}" DROP CONSTRAINT IF EXISTS "${name}"`,
      );
    }

    // Child tables first, so the drop order is readable even though CASCADE
    // would tolerate any order.
    const tables = [
      'zuno_what_if_assumptions',
      'zuno_what_if_sessions',
      'zuno_scenario_conditions',
      'zuno_scenarios',
      'zuno_scenario_sets',
    ];
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
  }

  /**
   * Adds a CHECK constraint only if it is absent.
   *
   * PostgreSQL has no `ADD CONSTRAINT IF NOT EXISTS`, so existence is checked
   * against pg_constraint first. Mirrors the helper in
   * `1757800000000-AddZunoCheckConstraints` deliberately: two different ways of
   * doing the same thing in one codebase is how one of them ends up subtly
   * wrong.
   */
  private async addCheck(
    queryRunner: QueryRunner,
    table: string,
    name: string,
    expression: string,
  ): Promise<void> {
    const existing: unknown[] = await queryRunner.query(
      `SELECT 1 FROM pg_constraint WHERE conname = $1`,
      [name],
    );
    if (Array.isArray(existing) && existing.length > 0) return;

    await queryRunner.query(
      `ALTER TABLE "${table}" ADD CONSTRAINT "${name}" CHECK (${expression})`,
    );
  }
}
