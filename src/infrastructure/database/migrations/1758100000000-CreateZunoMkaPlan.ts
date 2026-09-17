import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ZUNO MKA + Plan schema - Implementation Roadmap phase 7.
 *
 * Creates the tables from ZUNO Data Model (Step 20) sections 36-43:
 *   zuno_mka_programs       section 36
 *   zuno_mka_items          section 37
 *   zuno_mka_completions    section 38
 *   zuno_plans              section 39
 *   zuno_plan_items         section 41
 *   zuno_plan_item_events   section 43
 *
 * THE CHECK-CONSTRAINT LESSON, APPLIED.
 * `1757800000000-AddZunoCheckConstraints` exists because inline constraints
 * inside `CREATE TABLE IF NOT EXISTS` were silently skipped on a database where
 * TypeORM `synchronize` had already created the tables - verified on ib_db,
 * which had 28 ZUNO tables and zero CHECK constraints. Indexes survived,
 * because `CREATE INDEX IF NOT EXISTS` is its own statement.
 *
 * So this migration declares NO inline CHECK constraints. Every one is added
 * through the `addCheck` helper at the end, which tests `pg_constraint` first
 * and is therefore idempotent and correct whether the table already existed or
 * not. The same applies to the unique constraint on MKA completions, which is
 * created as a unique INDEX rather than a table constraint for the same reason.
 *
 * `database.module.ts` still hard-codes `synchronize: true` and
 * `migrationsRun: false` (recorded in ZUNO_DECISION_LOG.md), so in the current
 * configuration TypeORM creates these tables by reflection and this migration
 * does not run. It is written to be correct when that flag is turned off, and
 * idempotent so it is safe against a database synchronize already touched.
 */
export class CreateZunoMkaPlan1758100000000 implements MigrationInterface {
  name = 'CreateZunoMkaPlan1758100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ---------------------------------------------------------------
    // MKA (Step 20 sections 36-38)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_mka_programs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "challenge_id" uuid NOT NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "plan_id" uuid NULL,
        "period_type" varchar(16) NOT NULL DEFAULT 'WEEK',
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "status" varchar(24) NOT NULL DEFAULT 'DRAFT',
        "rulebook_version_id" uuid NULL,
        "remedy_status" varchar(40) NOT NULL DEFAULT 'NO_APPROVED_RULE_AVAILABLE',
        "review_trigger" varchar(32) NOT NULL DEFAULT 'END_OF_PERIOD',
        "review_at" date NULL,
        "context_version" integer NOT NULL DEFAULT 0,
        "source_response_id" uuid NULL,
        "safety_decision_id" uuid NULL,
        "engine_version" varchar(64) NOT NULL,
        "generated_reason" varchar(48) NOT NULL,
        "superseded_by_id" uuid NULL,
        "activated_at" timestamptz NULL,
        "completed_at" timestamptz NULL,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    // One index per foreign key and per filtered column (Step 20 section 87).
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_user" ON "zuno_mka_programs" ("user_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_challenge" ON "zuno_mka_programs" ("challenge_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_period" ON "zuno_mka_programs" ("user_id", "start_date", "end_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_review" ON "zuno_mka_programs" ("status", "review_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_plan" ON "zuno_mka_programs" ("plan_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_rulebook" ON "zuno_mka_programs" ("rulebook_version_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_superseded" ON "zuno_mka_programs" ("superseded_by_id")`,
    );
    /**
     * At most one ACTIVE programme per challenge.
     *
     * Step 15 section 76 versions MKA sets, and section 92 forbids
     * uncontrolled duplicates. A partial unique index (Step 20 section 88) is
     * what makes "only one version is current" a database fact rather than a
     * service-layer hope - two concurrent generate calls would otherwise both
     * pass their read-check and both insert.
     */
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_mka_programs_one_active"
         ON "zuno_mka_programs" ("challenge_id")
         WHERE "status" = 'ACTIVE' AND "deleted_at" IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_mka_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "mka_program_id" uuid NOT NULL REFERENCES "zuno_mka_programs"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "dimension" varchar(16) NOT NULL,
        "title" varchar(300) NOT NULL,
        "description" text NOT NULL,
        "purpose" text NULL,
        "source_type" varchar(40) NOT NULL,
        "source_rule_key" varchar(64) NULL,
        "source_remedy_key" varchar(64) NULL,
        "source_rule_id" uuid NULL,
        "rulebook_version_id" uuid NULL,
        "frequency" varchar(24) NOT NULL DEFAULT 'WEEKLY',
        "schedule_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "duration_minutes" integer NULL,
        "priority" varchar(16) NOT NULL DEFAULT 'IMPORTANT',
        "valid_from" date NULL,
        "valid_to" date NULL,
        "plan_eligible" boolean NOT NULL DEFAULT true,
        "karma_eligible" boolean NOT NULL DEFAULT false,
        "safety_class" varchar(32) NOT NULL DEFAULT 'LOW_RISK',
        "is_devotional" boolean NOT NULL DEFAULT false,
        "alternative_keys" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "display_order" integer NOT NULL DEFAULT 0,
        "status" varchar(32) NOT NULL DEFAULT 'ACTIVE',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_items_program" ON "zuno_mka_items" ("mka_program_id", "display_order")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_items_user" ON "zuno_mka_items" ("user_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_items_dimension" ON "zuno_mka_items" ("mka_program_id", "dimension")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_items_plan_eligible" ON "zuno_mka_items" ("mka_program_id", "plan_eligible")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_items_rule" ON "zuno_mka_items" ("source_rule_id")`,
    );
    // Step 15 section 74: expired remedies must not continue automatically, so
    // the expiry sweep needs an index it can actually use.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_items_validity" ON "zuno_mka_items" ("status", "valid_to")
         WHERE "valid_to" IS NOT NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_mka_completions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "mka_item_id" uuid NOT NULL REFERENCES "zuno_mka_items"("id") ON DELETE CASCADE,
        "mka_program_id" uuid NOT NULL REFERENCES "zuno_mka_programs"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "completion_date" date NOT NULL,
        "status" varchar(32) NOT NULL,
        "user_note" text NULL,
        "source" varchar(16) NOT NULL DEFAULT 'USER',
        "karma_eligible" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
    /**
     * One completion per item per day.
     *
     * A unique INDEX rather than a table constraint, deliberately: this is the
     * idempotency guarantee behind "Mark Done", and an inline UNIQUE in the
     * CREATE TABLE would have been skipped on a synchronize-created database
     * exactly like the CHECK constraints were.
     */
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_mka_completions_item" ON "zuno_mka_completions" ("mka_item_id", "completion_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_completions_user" ON "zuno_mka_completions" ("user_id", "completion_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_mka_completions_program" ON "zuno_mka_completions" ("mka_program_id", "status")`,
    );

    // ---------------------------------------------------------------
    // Plan (Step 20 sections 39-43)
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_plans" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "challenge_id" uuid NOT NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "mka_program_id" uuid NULL REFERENCES "zuno_mka_programs"("id") ON DELETE SET NULL,
        "plan_type" varchar(16) NOT NULL,
        "title" varchar(200) NOT NULL,
        "primary_goal" varchar(300) NULL,
        "start_date" date NOT NULL,
        "end_date" date NULL,
        "status" varchar(16) NOT NULL DEFAULT 'DRAFT',
        "timezone" varchar(64) NULL,
        "review_trigger" varchar(32) NOT NULL DEFAULT 'END_OF_HORIZON',
        "review_at" date NULL,
        "generated_from_realignment_id" uuid NULL,
        "superseded_by_id" uuid NULL,
        "context_version" integer NOT NULL DEFAULT 0,
        "safety_decision_id" uuid NULL,
        "engine_version" varchar(64) NOT NULL,
        "generated_reason" varchar(48) NOT NULL,
        "capacity_snapshot" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "activated_at" timestamptz NULL,
        "completed_at" timestamptz NULL,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plans_user_status" ON "zuno_plans" ("user_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plans_challenge" ON "zuno_plans" ("challenge_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plans_type" ON "zuno_plans" ("challenge_id", "plan_type", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plans_window" ON "zuno_plans" ("user_id", "start_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plans_review" ON "zuno_plans" ("status", "review_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plans_mka" ON "zuno_plans" ("mka_program_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plans_superseded" ON "zuno_plans" ("superseded_by_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plans_realignment" ON "zuno_plans" ("generated_from_realignment_id")`,
    );
    /**
     * Step 16 section 48: only one version should normally be active for a
     * given plan scope. Enforced per (challenge, plan_type) so a TODAY and a
     * WEEKLY plan can coexist, which section 3 requires.
     */
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_plans_one_active"
         ON "zuno_plans" ("challenge_id", "plan_type")
         WHERE "status" IN ('DRAFT', 'ACTIVE') AND "deleted_at" IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_plan_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "plan_id" uuid NOT NULL REFERENCES "zuno_plans"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "parent_item_id" uuid NULL REFERENCES "zuno_plan_items"("id") ON DELETE SET NULL,
        "title" varchar(300) NOT NULL,
        "description" text NULL,
        "why_this_matters" text NULL,
        "category" varchar(32) NOT NULL DEFAULT 'OTHER',
        "priority" varchar(16) NOT NULL DEFAULT 'IMPORTANT',
        "priority_rank" integer NOT NULL DEFAULT 2,
        "is_practice" boolean NOT NULL DEFAULT false,
        "status" varchar(16) NOT NULL DEFAULT 'PENDING',
        "scheduled_date" date NULL,
        "due_at" timestamptz NULL,
        "due_source" varchar(32) NULL,
        "estimated_minutes" integer NULL,
        "source_type" varchar(40) NOT NULL,
        "source_ref_id" uuid NULL,
        "mka_item_id" uuid NULL REFERENCES "zuno_mka_items"("id") ON DELETE SET NULL,
        "scenario_scope" varchar(32) NOT NULL DEFAULT 'SHARED_ACROSS_SCENARIOS',
        "scenario_refs" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "trigger_condition" varchar(64) NULL,
        "depends_on_item_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "karma_eligible" boolean NOT NULL DEFAULT false,
        "realignment_policy" varchar(32) NOT NULL DEFAULT 'PRESERVE_IF_RELEVANT',
        "is_hypothetical" boolean NOT NULL DEFAULT false,
        "display_order" integer NOT NULL DEFAULT 0,
        "started_at" timestamptz NULL,
        "completed_at" timestamptz NULL,
        "deferred_to" date NULL,
        "blocked_reason" text NULL,
        "deferral_count" integer NOT NULL DEFAULT 0,
        "user_note" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_plan" ON "zuno_plan_items" ("plan_id", "display_order")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_user_status" ON "zuno_plan_items" ("user_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_plan_status" ON "zuno_plan_items" ("plan_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_scheduled" ON "zuno_plan_items" ("user_id", "scheduled_date", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_due" ON "zuno_plan_items" ("user_id", "due_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_mka" ON "zuno_plan_items" ("mka_item_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_parent" ON "zuno_plan_items" ("parent_item_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_source_ref" ON "zuno_plan_items" ("source_ref_id")`,
    );
    /**
     * Partial index for the capacity query, which is the hottest read in this
     * module: it runs on every generation, every activation and every
     * user-added task. Step 20 section 88 endorses partial indexes for exactly
     * this "small subset of a large table" case.
     */
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_capacity"
         ON "zuno_plan_items" ("plan_id", "is_practice", "priority")
         WHERE "status" IN ('PENDING', 'IN_PROGRESS', 'BLOCKED') AND "deleted_at" IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_plan_item_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "plan_item_id" uuid NOT NULL REFERENCES "zuno_plan_items"("id") ON DELETE CASCADE,
        "plan_id" uuid NOT NULL REFERENCES "zuno_plans"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "event_type" varchar(32) NOT NULL,
        "old_status" varchar(32) NULL,
        "new_status" varchar(32) NULL,
        "reason" text NULL,
        "source" varchar(16) NOT NULL DEFAULT 'SYSTEM',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plan_item_events_item" ON "zuno_plan_item_events" ("plan_item_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plan_item_events_plan" ON "zuno_plan_item_events" ("plan_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_plan_item_events_user" ON "zuno_plan_item_events" ("user_id", "event_type")`,
    );

    // ---------------------------------------------------------------
    // CHECK constraints - explicit ALTER TABLE, never inline
    // ---------------------------------------------------------------

    /**
     * Step 15 Rule 1 and section 17: every astrology-derived practice traces to
     * an active, approved SME Rulebook rule.
     *
     * This is the single most important constraint in the migration. It makes a
     * hallucinated remedy physically unstorable: a row claiming
     * APPROVED_ASTRO_REMEDY or SME_APPROVED_PRACTICE must carry both a rulebook
     * version and a remedy or rule key. Service-layer checks can be refactored
     * away; this cannot.
     */
    await this.addCheck(
      queryRunner,
      'zuno_mka_items',
      'chk_zuno_mka_items_astro_provenance',
      `"source_type" NOT IN ('APPROVED_ASTRO_REMEDY', 'SME_APPROVED_PRACTICE')
       OR ("rulebook_version_id" IS NOT NULL
           AND ("source_remedy_key" IS NOT NULL OR "source_rule_key" IS NOT NULL))`,
    );

    /** Step 15 section 31: a bounded window must actually be a window. */
    await this.addCheck(
      queryRunner,
      'zuno_mka_items',
      'chk_zuno_mka_items_validity_window',
      `"valid_from" IS NULL OR "valid_to" IS NULL OR "valid_to" >= "valid_from"`,
    );

    /** A practice with a duration must have a positive one. */
    await this.addCheck(
      queryRunner,
      'zuno_mka_items',
      'chk_zuno_mka_items_duration_positive',
      `"duration_minutes" IS NULL OR "duration_minutes" > 0`,
    );

    /** Step 20 section 36: the MKA period is a real interval. */
    await this.addCheck(
      queryRunner,
      'zuno_mka_programs',
      'chk_zuno_mka_programs_period',
      `"end_date" >= "start_date"`,
    );

    /**
     * A superseded programme points at a different programme.
     * Step 15 section 76: a self-reference would make the version chain a loop
     * that audit traversal cannot terminate.
     */
    await this.addCheck(
      queryRunner,
      'zuno_mka_programs',
      'chk_zuno_mka_programs_supersede_distinct',
      `"superseded_by_id" IS NULL OR "superseded_by_id" <> "id"`,
    );

    await this.addCheck(
      queryRunner,
      'zuno_plans',
      'chk_zuno_plans_window',
      `"end_date" IS NULL OR "end_date" >= "start_date"`,
    );

    await this.addCheck(
      queryRunner,
      'zuno_plans',
      'chk_zuno_plans_supersede_distinct',
      `"superseded_by_id" IS NULL OR "superseded_by_id" <> "id"`,
    );

    /**
     * Step 16 section 14 / Step 21 section 51: the label and the numeric rank
     * are two views of one value and must not disagree.
     *
     * A row where `priority = 'ESSENTIAL'` but `priority_rank = 3` would sort
     * an essential action to the bottom of the user's day while still rendering
     * as essential - a silent, plausible, wrong result.
     */
    await this.addCheck(
      queryRunner,
      'zuno_plan_items',
      'chk_zuno_plan_items_priority_rank',
      `("priority" = 'ESSENTIAL' AND "priority_rank" = 1)
       OR ("priority" = 'IMPORTANT' AND "priority_rank" = 2)
       OR ("priority" = 'OPTIONAL' AND "priority_rank" = 3)`,
    );

    /** A task cannot depend on itself. Step 16 sections 31-32. */
    await this.addCheck(
      queryRunner,
      'zuno_plan_items',
      'chk_zuno_plan_items_parent_distinct',
      `"parent_item_id" IS NULL OR "parent_item_id" <> "id"`,
    );

    await this.addCheck(
      queryRunner,
      'zuno_plan_items',
      'chk_zuno_plan_items_deferral_count',
      `"deferral_count" >= 0`,
    );

    await this.addCheck(
      queryRunner,
      'zuno_plan_items',
      'chk_zuno_plan_items_estimate_positive',
      `"estimated_minutes" IS NULL OR "estimated_minutes" > 0`,
    );

    /**
     * Step 16 section 24: a CONDITIONAL item is dormant until a trigger fires,
     * so it must say what that trigger is. A conditional item with no condition
     * could never be activated and would sit in the plan for ever.
     */
    await this.addCheck(
      queryRunner,
      'zuno_plan_items',
      'chk_zuno_plan_items_conditional_trigger',
      `"status" <> 'CONDITIONAL' OR "trigger_condition" IS NOT NULL`,
    );

    /**
     * Step 16 section 47 and Golden Test 100: an item cancelled by a
     * realignment must never also be recorded as completed work, and vice
     * versa. `completed_at` is only meaningful for DONE.
     */
    await this.addCheck(
      queryRunner,
      'zuno_plan_items',
      'chk_zuno_plan_items_completed_at',
      `("status" = 'DONE' AND "completed_at" IS NOT NULL)
       OR ("status" <> 'DONE' AND "completed_at" IS NULL)`,
    );
  }

  /**
   * Rollback. Step 20 section 97 requires every migration to consider one.
   *
   * Dropped in reverse dependency order. This destroys plan history and MKA
   * completions, so it is a development and staging facility - rolling back a
   * release that carried live plans needs a data-preserving plan, not this.
   * CASCADE removes the indexes and constraints with the tables.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'zuno_plan_item_events',
      'zuno_plan_items',
      'zuno_plans',
      'zuno_mka_completions',
      'zuno_mka_items',
      'zuno_mka_programs',
    ];
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
  }

  /**
   * Adds a CHECK constraint only if it is absent.
   *
   * Same helper as `1757800000000-AddZunoCheckConstraints`, and for the same
   * reason: PostgreSQL has no `ADD CONSTRAINT IF NOT EXISTS`, and this
   * migration must be safe to re-run against a database where the tables
   * already exist. The table-existence guard matters too - failing here on a
   * database missing one of these tables would block every later migration.
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
