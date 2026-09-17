import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ZUNO Memory and Future Self schema - Implementation Roadmap Phase 10.
 *
 * Creates the tables from Step 20 Data Model sections 49-55:
 *   zuno_memories                 s.49
 *   zuno_memory_candidates        Step 18 s.21 / Build Rule 37
 *   zuno_memory_evidence          s.52
 *   zuno_memory_conflicts         s.53
 *   zuno_future_self_narratives   s.54
 *   zuno_future_self_sources      s.55
 *
 * -------------------------------------------------------------------------
 * WHY EVERY CHECK CONSTRAINT IS A SEPARATE ALTER TABLE
 * -------------------------------------------------------------------------
 *
 * `CREATE TABLE IF NOT EXISTS` is a no-op when the table already exists, and it
 * is a *silent* no-op - inline CHECK constraints in the body are simply never
 * applied. This project hit that exact problem: `database.module.ts` forces
 * `synchronize: true`, TypeORM created the ZUNO tables by reflection without
 * emitting any CHECKs, and the migrations that declared them inline then found
 * the tables already present and did nothing. The result was 28 tables, 78
 * indexes and zero CHECK constraints, and it needed a follow-up migration
 * (1757800000000-AddZunoCheckConstraints) to repair.
 *
 * Indexes were unaffected, because `CREATE INDEX IF NOT EXISTS` is its own
 * statement. So the rule this migration follows is: tables and indexes may use
 * IF NOT EXISTS, constraints never ride inside a CREATE TABLE. Every CHECK
 * below goes through `addCheck`, which tests pg_constraint first and is
 * therefore idempotent on a database where synchronize got there first.
 *
 * -------------------------------------------------------------------------
 * OPERATIONAL NOTE
 * -------------------------------------------------------------------------
 *
 * With `synchronize: true` still forced in `database.module.ts` and
 * `migrationsRun: false`, this migration does not run in the current
 * configuration - the same conflict with Build Rule 25 recorded for the
 * foundation migration. It is written to be correct when that flag is turned
 * off, and idempotent so it is safe against a synchronised database. Changing
 * the flag would alter behaviour for every existing iBhakt table and is not
 * this change's call to make.
 */
export class CreateZunoMemory1758500000000 implements MigrationInterface {
  name = 'CreateZunoMemory1758500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // =====================================================================
    // zuno_memories - Step 20 section 49
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_memories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "challenge_id" uuid NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "scope" varchar(32) NOT NULL DEFAULT 'GLOBAL',
        "memory_type" varchar(40) NOT NULL,
        "memory_key" varchar(120) NOT NULL,
        "memory_value" jsonb NOT NULL,
        "factuality" varchar(32) NOT NULL DEFAULT 'FACT',
        "source" varchar(32) NOT NULL,
        "source_event_id" varchar(120) NULL,
        "evidence_type" varchar(16) NOT NULL,
        "confidence" numeric(4,3) NOT NULL,
        "retention_class" varchar(32) NOT NULL,
        "sensitivity_class" varchar(16) NOT NULL DEFAULT 'STANDARD',
        "status" varchar(32) NOT NULL DEFAULT 'ACTIVE',
        "last_confirmed_at" timestamptz NULL,
        "confirmation_count" integer NOT NULL DEFAULT 1,
        "expires_at" timestamptz NULL,
        "supersedes_memory_id" uuid NULL,
        "superseded_by_memory_id" uuid NULL,
        "superseded_at" timestamptz NULL,
        "redacted_at" timestamptz NULL,
        "deletion_reason" varchar(40) NULL,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);

    // The self-references are added separately so the table can be created in
    // one statement regardless of ordering, and so a re-run is harmless.
    await this.addForeignKey(
      queryRunner,
      'zuno_memories',
      'fk_zuno_memories_supersedes',
      '"supersedes_memory_id"',
      'zuno_memories',
      '"id"',
      'SET NULL',
    );
    await this.addForeignKey(
      queryRunner,
      'zuno_memories',
      'fk_zuno_memories_superseded_by',
      '"superseded_by_memory_id"',
      'zuno_memories',
      '"id"',
      'SET NULL',
    );

    // Step 20 section 1853 names (user_id, memory_type, status) as the
    // retrieval index. Every column MemoryRetrievalService filters on is
    // covered by one of these.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memories_user_type_status" ON "zuno_memories" ("user_id", "memory_type", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memories_challenge_status" ON "zuno_memories" ("challenge_id", "status")`,
    );
    // Drives the expiry sweep. Partial, because the sweep only ever looks at
    // ACTIVE rows with a date and a full index would be mostly dead weight.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_zuno_memories_expiry"
      ON "zuno_memories" ("status", "expires_at")
      WHERE "expires_at" IS NOT NULL
    `);
    // Every remaining FK gets an index (both self-references and the user FK is
    // covered by the composite above).
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memories_supersedes" ON "zuno_memories" ("supersedes_memory_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memories_superseded_by" ON "zuno_memories" ("superseded_by_memory_id")`,
    );
    // Step 18 section 95: the idempotency triple. Reprocessing an event must
    // not create a second memory, and a partial unique index is what makes the
    // second insert lose the race rather than both succeeding.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_memories_event_idempotency"
      ON "zuno_memories" ("user_id", "memory_key", "source_event_id")
      WHERE "source_event_id" IS NOT NULL AND "status" = 'ACTIVE'
    `);
    // Step 18 section 59: at most one ACTIVE memory per key per scope, so
    // "prefers concise answers" cannot become seventeen rows. Two partial
    // indexes because PostgreSQL treats NULL challenge_id as distinct in a
    // plain unique index, which would defeat the global case entirely.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_memories_active_key_global"
      ON "zuno_memories" ("user_id", "memory_key")
      WHERE "status" = 'ACTIVE' AND "challenge_id" IS NULL AND "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_memories_active_key_challenge"
      ON "zuno_memories" ("user_id", "challenge_id", "memory_key")
      WHERE "status" = 'ACTIVE' AND "challenge_id" IS NOT NULL AND "deleted_at" IS NULL
    `);

    // =====================================================================
    // zuno_memory_candidates - Step 18 section 21, Build Rule 37
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_memory_candidates" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "challenge_id" uuid NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "scope" varchar(32) NOT NULL DEFAULT 'GLOBAL',
        "memory_type" varchar(40) NOT NULL,
        "memory_key" varchar(120) NOT NULL,
        "proposed_value" jsonb NULL,
        "factuality" varchar(32) NOT NULL DEFAULT 'FACT',
        "source" varchar(32) NOT NULL,
        "source_event_id" varchar(120) NULL,
        "evidence_type" varchar(16) NOT NULL,
        "confidence" numeric(4,3) NOT NULL,
        "suggested_retention" varchar(32) NOT NULL,
        "sensitivity_class" varchar(16) NOT NULL DEFAULT 'STANDARD',
        "status" varchar(32) NOT NULL DEFAULT 'PENDING',
        "confirmation_required" boolean NOT NULL DEFAULT false,
        "confirmation_reason" varchar(48) NULL,
        "rejection_reason" varchar(48) NULL,
        "resulting_memory_id" uuid NULL,
        "decided_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await this.addForeignKey(
      queryRunner,
      'zuno_memory_candidates',
      'fk_zuno_memory_candidates_memory',
      '"resulting_memory_id"',
      'zuno_memories',
      '"id"',
      'SET NULL',
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memory_candidates_user_status" ON "zuno_memory_candidates" ("user_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memory_candidates_challenge" ON "zuno_memory_candidates" ("challenge_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memory_candidates_event" ON "zuno_memory_candidates" ("user_id", "source_event_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memory_candidates_memory" ON "zuno_memory_candidates" ("resulting_memory_id")`,
    );

    // =====================================================================
    // zuno_memory_evidence - Step 20 section 52
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_memory_evidence" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "memory_id" uuid NOT NULL REFERENCES "zuno_memories"("id") ON DELETE CASCADE,
        "source_entity_type" varchar(64) NOT NULL,
        "source_entity_id" uuid NOT NULL,
        "evidence_role" varchar(24) NOT NULL,
        "observed_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memory_evidence_memory" ON "zuno_memory_evidence" ("memory_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memory_evidence_source" ON "zuno_memory_evidence" ("source_entity_type", "source_entity_id")`,
    );
    // Step 18 section 18: a pattern needs *distinct* evidence. Without this the
    // same observation could be inserted three times and satisfy the
    // three-evidence rule while being one event.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_memory_evidence_distinct"
      ON "zuno_memory_evidence" ("memory_id", "source_entity_type", "source_entity_id", "evidence_role")
    `);

    // =====================================================================
    // zuno_memory_conflicts - Step 20 section 53
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_memory_conflicts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "memory_a_id" uuid NOT NULL REFERENCES "zuno_memories"("id") ON DELETE CASCADE,
        "memory_b_id" uuid NOT NULL REFERENCES "zuno_memories"("id") ON DELETE CASCADE,
        "resolution_status" varchar(32) NOT NULL DEFAULT 'UNRESOLVED',
        "resolved_memory_id" uuid NULL,
        "authority_a" integer NULL,
        "authority_b" integer NULL,
        "resolved_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memory_conflicts_user_status" ON "zuno_memory_conflicts" ("user_id", "resolution_status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memory_conflicts_memory_a" ON "zuno_memory_conflicts" ("memory_a_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memory_conflicts_memory_b" ON "zuno_memory_conflicts" ("memory_b_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_memory_conflicts_resolved" ON "zuno_memory_conflicts" ("resolved_memory_id")`,
    );

    // =====================================================================
    // zuno_future_self_narratives - Step 20 section 54
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_future_self_narratives" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "challenge_id" uuid NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "mode" varchar(24) NOT NULL,
        "period_start" date NULL,
        "period_end" date NULL,
        "summary" text NOT NULL,
        "progress_themes" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "open_loops" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "strengths_observed" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "next_focus" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "generation_model_version" varchar(64) NULL,
        "engine_version" varchar(64) NOT NULL,
        "prompt_template_version" varchar(64) NULL,
        "ai_generation_run_id" uuid NULL,
        "safety_decision_id" uuid NULL,
        "boundary_version" varchar(32) NOT NULL,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        "redacted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_fs_narratives_user_created" ON "zuno_future_self_narratives" ("user_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_fs_narratives_challenge_mode" ON "zuno_future_self_narratives" ("challenge_id", "mode")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_fs_narratives_run" ON "zuno_future_self_narratives" ("ai_generation_run_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_fs_narratives_safety" ON "zuno_future_self_narratives" ("safety_decision_id")`,
    );
    // Lets a later boundary change find everything cleared under an older rule.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_fs_narratives_boundary" ON "zuno_future_self_narratives" ("boundary_version")`,
    );

    // =====================================================================
    // zuno_future_self_sources - Step 20 section 55
    // =====================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_future_self_sources" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "future_self_narrative_id" uuid NOT NULL REFERENCES "zuno_future_self_narratives"("id") ON DELETE CASCADE,
        "source_entity_type" varchar(64) NOT NULL,
        "source_entity_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_fs_sources_narrative" ON "zuno_future_self_sources" ("future_self_narrative_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zuno_fs_sources_entity" ON "zuno_future_self_sources" ("source_entity_type", "source_entity_id")`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_fs_sources_distinct"
      ON "zuno_future_self_sources" ("future_self_narrative_id", "source_entity_type", "source_entity_id")
    `);

    // =====================================================================
    // CHECK constraints - every one a separate ALTER TABLE. See the header.
    // =====================================================================

    /**
     * Step 18 section 25: confidence is a probability, and retrieval weights it
     * directly. A value outside 0..1 would silently distort every ranking it
     * participated in.
     */
    await this.addCheck(
      queryRunner,
      'zuno_memories',
      'chk_zuno_memories_confidence_range',
      `"confidence" >= 0 AND "confidence" <= 1`,
    );
    await this.addCheck(
      queryRunner,
      'zuno_memory_candidates',
      'chk_zuno_memory_candidates_confidence_range',
      `"confidence" >= 0 AND "confidence" <= 1`,
    );

    /**
     * Step 18 section 63: scope and challenge linkage must agree.
     *
     * A CHALLENGE-scoped memory with no challenge_id would be admitted by the
     * retrieval scope filter as though it belonged to whatever challenge was
     * being asked about - a challenge-private decision leaking into an
     * unrelated conversation, which is exactly what section 109 forbids.
     */
    await this.addCheck(
      queryRunner,
      'zuno_memories',
      'chk_zuno_memories_scope_challenge',
      `("scope" = 'CHALLENGE' AND "challenge_id" IS NOT NULL)
       OR ("scope" = 'GLOBAL' AND "challenge_id" IS NULL)`,
    );

    /**
     * Step 18 section 29 and Step 24 section 165.
     *
     * A row may not claim to be superseded without saying by what, and - the
     * part that matters - a DELETED memory must carry its privacy-deletion
     * timestamp. `redacted_at` is the second of the three independent barriers
     * MemoryService.deleteMemory raises; this constraint is what stops a future
     * code path setting the status without clearing the content.
     */
    await this.addCheck(
      queryRunner,
      'zuno_memories',
      'chk_zuno_memories_supersession_complete',
      `("status" <> 'SUPERSEDED')
       OR ("superseded_by_memory_id" IS NOT NULL AND "superseded_at" IS NOT NULL)`,
    );
    await this.addCheck(
      queryRunner,
      'zuno_memories',
      'chk_zuno_memories_deletion_redacted',
      `("status" <> 'DELETED') OR ("redacted_at" IS NOT NULL)`,
    );

    /** A memory cannot supersede or be superseded by itself. */
    await this.addCheck(
      queryRunner,
      'zuno_memories',
      'chk_zuno_memories_no_self_supersede',
      `("supersedes_memory_id" IS NULL OR "supersedes_memory_id" <> "id")
       AND ("superseded_by_memory_id" IS NULL OR "superseded_by_memory_id" <> "id")`,
    );

    /**
     * Step 18 section 30: a conflict is between two different memories.
     * A self-conflict row would satisfy every count-based quality metric while
     * describing no disagreement at all.
     */
    await this.addCheck(
      queryRunner,
      'zuno_memory_conflicts',
      'chk_zuno_memory_conflicts_distinct',
      `"memory_a_id" <> "memory_b_id"`,
    );

    /** A resolved conflict must name the memory that won. */
    await this.addCheck(
      queryRunner,
      'zuno_memory_conflicts',
      'chk_zuno_memory_conflicts_resolution',
      `("resolution_status" = 'UNRESOLVED')
       OR ("resolution_status" = 'DISMISSED')
       OR ("resolved_memory_id" IS NOT NULL AND "resolved_at" IS NOT NULL)`,
    );

    /**
     * Step 18 section 21: a candidate awaiting the user's answer must still
     * hold the thing being asked about. A NULL proposed_value in that state
     * would render as an empty confirmation prompt.
     */
    await this.addCheck(
      queryRunner,
      'zuno_memory_candidates',
      'chk_zuno_memory_candidates_pending_value',
      `("status" <> 'AWAITING_CONFIRMATION') OR ("proposed_value" IS NOT NULL)`,
    );

    /** A decided candidate records when, and an accepted one what it became. */
    await this.addCheck(
      queryRunner,
      'zuno_memory_candidates',
      'chk_zuno_memory_candidates_decided',
      `("status" IN ('PENDING', 'AWAITING_CONFIRMATION')) OR ("decided_at" IS NOT NULL)`,
    );

    /** Step 20 section 54: a period is either absent or ordered. */
    await this.addCheck(
      queryRunner,
      'zuno_future_self_narratives',
      'chk_zuno_fs_narratives_period_order',
      `"period_start" IS NULL OR "period_end" IS NULL OR "period_start" <= "period_end"`,
    );

    /**
     * Step 18 section 38 / roadmap section 71: a narrative must say which
     * boundary version cleared it, and must not be empty. An empty summary that
     * still counted as a generated narrative would report success for a
     * generation that produced nothing.
     */
    await this.addCheck(
      queryRunner,
      'zuno_future_self_narratives',
      'chk_zuno_fs_narratives_summary_present',
      `length(btrim("summary")) > 0`,
    );
  }

  /**
   * Rollback. Step 20 section 97.
   *
   * Reverse dependency order. This destroys the user's memory and every Future
   * Self reflection, so it is a development and staging facility - rolling back
   * a release that carried live memory needs a data-preserving plan, not this.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    const constraints: [string, string][] = [
      ['zuno_future_self_narratives', 'chk_zuno_fs_narratives_summary_present'],
      ['zuno_future_self_narratives', 'chk_zuno_fs_narratives_period_order'],
      ['zuno_memory_candidates', 'chk_zuno_memory_candidates_decided'],
      ['zuno_memory_candidates', 'chk_zuno_memory_candidates_pending_value'],
      ['zuno_memory_candidates', 'chk_zuno_memory_candidates_confidence_range'],
      ['zuno_memory_conflicts', 'chk_zuno_memory_conflicts_resolution'],
      ['zuno_memory_conflicts', 'chk_zuno_memory_conflicts_distinct'],
      ['zuno_memories', 'chk_zuno_memories_no_self_supersede'],
      ['zuno_memories', 'chk_zuno_memories_deletion_redacted'],
      ['zuno_memories', 'chk_zuno_memories_supersession_complete'],
      ['zuno_memories', 'chk_zuno_memories_scope_challenge'],
      ['zuno_memories', 'chk_zuno_memories_confidence_range'],
    ];
    for (const [table, name] of constraints) {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "${table}" DROP CONSTRAINT IF EXISTS "${name}"`,
      );
    }

    const tables = [
      'zuno_future_self_sources',
      'zuno_future_self_narratives',
      'zuno_memory_conflicts',
      'zuno_memory_evidence',
      'zuno_memory_candidates',
      'zuno_memories',
    ];
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
  }

  /**
   * Adds a CHECK constraint only if it is absent.
   *
   * PostgreSQL has no `ADD CONSTRAINT IF NOT EXISTS`, so existence is tested
   * against pg_constraint first. The table-existence guard matters as much: a
   * migration that throws on a database missing one ZUNO table would block
   * every later migration behind it.
   *
   * Same helper as 1757800000000-AddZunoCheckConstraints, duplicated rather
   * than shared because a migration should be a self-contained record of what
   * it did - importing a helper means a later edit to that helper silently
   * changes what an already-applied migration claims to have done.
   */
  private async addCheck(
    queryRunner: QueryRunner,
    table: string,
    constraintName: string,
    expression: string,
  ): Promise<void> {
    if (!(await this.tableExists(queryRunner, table))) return;

    const exists = await queryRunner.query(
      `SELECT 1 FROM pg_constraint WHERE conname = $1 AND conrelid = $2::regclass`,
      [constraintName, `public.${table}`],
    );
    if (exists?.length) return;

    await queryRunner.query(
      `ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" CHECK (${expression})`,
    );
  }

  /**
   * Adds a foreign key only if it is absent.
   *
   * Same reasoning as addCheck: `CREATE TABLE IF NOT EXISTS` skips inline
   * REFERENCES clauses on an existing table just as silently as it skips
   * CHECKs, and the self-references on `zuno_memories` are the ones most likely
   * to be missing on a synchronised database.
   */
  private async addForeignKey(
    queryRunner: QueryRunner,
    table: string,
    constraintName: string,
    column: string,
    referencedTable: string,
    referencedColumn: string,
    onDelete: 'CASCADE' | 'SET NULL',
  ): Promise<void> {
    if (!(await this.tableExists(queryRunner, table))) return;
    if (!(await this.tableExists(queryRunner, referencedTable))) return;

    const exists = await queryRunner.query(
      `SELECT 1 FROM pg_constraint WHERE conname = $1 AND conrelid = $2::regclass`,
      [constraintName, `public.${table}`],
    );
    if (exists?.length) return;

    await queryRunner.query(
      `ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" ` +
        `FOREIGN KEY (${column}) REFERENCES "${referencedTable}"(${referencedColumn}) ON DELETE ${onDelete}`,
    );
  }

  private async tableExists(
    queryRunner: QueryRunner,
    table: string,
  ): Promise<boolean> {
    const rows = await queryRunner.query(
      `SELECT to_regclass($1) IS NOT NULL AS present`,
      [`public.${table}`],
    );
    return Boolean(rows?.[0]?.present);
  }
}
