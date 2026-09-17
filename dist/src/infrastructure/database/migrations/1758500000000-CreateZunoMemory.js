"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateZunoMemory1758500000000 = void 0;
class CreateZunoMemory1758500000000 {
    constructor() {
        this.name = 'CreateZunoMemory1758500000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
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
        await this.addForeignKey(queryRunner, 'zuno_memories', 'fk_zuno_memories_supersedes', '"supersedes_memory_id"', 'zuno_memories', '"id"', 'SET NULL');
        await this.addForeignKey(queryRunner, 'zuno_memories', 'fk_zuno_memories_superseded_by', '"superseded_by_memory_id"', 'zuno_memories', '"id"', 'SET NULL');
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memories_user_type_status" ON "zuno_memories" ("user_id", "memory_type", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memories_challenge_status" ON "zuno_memories" ("challenge_id", "status")`);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_zuno_memories_expiry"
      ON "zuno_memories" ("status", "expires_at")
      WHERE "expires_at" IS NOT NULL
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memories_supersedes" ON "zuno_memories" ("supersedes_memory_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memories_superseded_by" ON "zuno_memories" ("superseded_by_memory_id")`);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_memories_event_idempotency"
      ON "zuno_memories" ("user_id", "memory_key", "source_event_id")
      WHERE "source_event_id" IS NOT NULL AND "status" = 'ACTIVE'
    `);
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
        await this.addForeignKey(queryRunner, 'zuno_memory_candidates', 'fk_zuno_memory_candidates_memory', '"resulting_memory_id"', 'zuno_memories', '"id"', 'SET NULL');
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memory_candidates_user_status" ON "zuno_memory_candidates" ("user_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memory_candidates_challenge" ON "zuno_memory_candidates" ("challenge_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memory_candidates_event" ON "zuno_memory_candidates" ("user_id", "source_event_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memory_candidates_memory" ON "zuno_memory_candidates" ("resulting_memory_id")`);
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memory_evidence_memory" ON "zuno_memory_evidence" ("memory_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memory_evidence_source" ON "zuno_memory_evidence" ("source_entity_type", "source_entity_id")`);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_memory_evidence_distinct"
      ON "zuno_memory_evidence" ("memory_id", "source_entity_type", "source_entity_id", "evidence_role")
    `);
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memory_conflicts_user_status" ON "zuno_memory_conflicts" ("user_id", "resolution_status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memory_conflicts_memory_a" ON "zuno_memory_conflicts" ("memory_a_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memory_conflicts_memory_b" ON "zuno_memory_conflicts" ("memory_b_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_memory_conflicts_resolved" ON "zuno_memory_conflicts" ("resolved_memory_id")`);
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_fs_narratives_user_created" ON "zuno_future_self_narratives" ("user_id", "created_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_fs_narratives_challenge_mode" ON "zuno_future_self_narratives" ("challenge_id", "mode")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_fs_narratives_run" ON "zuno_future_self_narratives" ("ai_generation_run_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_fs_narratives_safety" ON "zuno_future_self_narratives" ("safety_decision_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_fs_narratives_boundary" ON "zuno_future_self_narratives" ("boundary_version")`);
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_fs_sources_narrative" ON "zuno_future_self_sources" ("future_self_narrative_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_fs_sources_entity" ON "zuno_future_self_sources" ("source_entity_type", "source_entity_id")`);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_fs_sources_distinct"
      ON "zuno_future_self_sources" ("future_self_narrative_id", "source_entity_type", "source_entity_id")
    `);
        await this.addCheck(queryRunner, 'zuno_memories', 'chk_zuno_memories_confidence_range', `"confidence" >= 0 AND "confidence" <= 1`);
        await this.addCheck(queryRunner, 'zuno_memory_candidates', 'chk_zuno_memory_candidates_confidence_range', `"confidence" >= 0 AND "confidence" <= 1`);
        await this.addCheck(queryRunner, 'zuno_memories', 'chk_zuno_memories_scope_challenge', `("scope" = 'CHALLENGE' AND "challenge_id" IS NOT NULL)
       OR ("scope" = 'GLOBAL' AND "challenge_id" IS NULL)`);
        await this.addCheck(queryRunner, 'zuno_memories', 'chk_zuno_memories_supersession_complete', `("status" <> 'SUPERSEDED')
       OR ("superseded_by_memory_id" IS NOT NULL AND "superseded_at" IS NOT NULL)`);
        await this.addCheck(queryRunner, 'zuno_memories', 'chk_zuno_memories_deletion_redacted', `("status" <> 'DELETED') OR ("redacted_at" IS NOT NULL)`);
        await this.addCheck(queryRunner, 'zuno_memories', 'chk_zuno_memories_no_self_supersede', `("supersedes_memory_id" IS NULL OR "supersedes_memory_id" <> "id")
       AND ("superseded_by_memory_id" IS NULL OR "superseded_by_memory_id" <> "id")`);
        await this.addCheck(queryRunner, 'zuno_memory_conflicts', 'chk_zuno_memory_conflicts_distinct', `"memory_a_id" <> "memory_b_id"`);
        await this.addCheck(queryRunner, 'zuno_memory_conflicts', 'chk_zuno_memory_conflicts_resolution', `("resolution_status" = 'UNRESOLVED')
       OR ("resolution_status" = 'DISMISSED')
       OR ("resolved_memory_id" IS NOT NULL AND "resolved_at" IS NOT NULL)`);
        await this.addCheck(queryRunner, 'zuno_memory_candidates', 'chk_zuno_memory_candidates_pending_value', `("status" <> 'AWAITING_CONFIRMATION') OR ("proposed_value" IS NOT NULL)`);
        await this.addCheck(queryRunner, 'zuno_memory_candidates', 'chk_zuno_memory_candidates_decided', `("status" IN ('PENDING', 'AWAITING_CONFIRMATION')) OR ("decided_at" IS NOT NULL)`);
        await this.addCheck(queryRunner, 'zuno_future_self_narratives', 'chk_zuno_fs_narratives_period_order', `"period_start" IS NULL OR "period_end" IS NULL OR "period_start" <= "period_end"`);
        await this.addCheck(queryRunner, 'zuno_future_self_narratives', 'chk_zuno_fs_narratives_summary_present', `length(btrim("summary")) > 0`);
    }
    async down(queryRunner) {
        const constraints = [
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
            await queryRunner.query(`ALTER TABLE IF EXISTS "${table}" DROP CONSTRAINT IF EXISTS "${name}"`);
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
    async addCheck(queryRunner, table, constraintName, expression) {
        if (!(await this.tableExists(queryRunner, table)))
            return;
        const exists = await queryRunner.query(`SELECT 1 FROM pg_constraint WHERE conname = $1 AND conrelid = $2::regclass`, [constraintName, `public.${table}`]);
        if (exists?.length)
            return;
        await queryRunner.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" CHECK (${expression})`);
    }
    async addForeignKey(queryRunner, table, constraintName, column, referencedTable, referencedColumn, onDelete) {
        if (!(await this.tableExists(queryRunner, table)))
            return;
        if (!(await this.tableExists(queryRunner, referencedTable)))
            return;
        const exists = await queryRunner.query(`SELECT 1 FROM pg_constraint WHERE conname = $1 AND conrelid = $2::regclass`, [constraintName, `public.${table}`]);
        if (exists?.length)
            return;
        await queryRunner.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" ` +
            `FOREIGN KEY (${column}) REFERENCES "${referencedTable}"(${referencedColumn}) ON DELETE ${onDelete}`);
    }
    async tableExists(queryRunner, table) {
        const rows = await queryRunner.query(`SELECT to_regclass($1) IS NOT NULL AS present`, [`public.${table}`]);
        return Boolean(rows?.[0]?.present);
    }
}
exports.CreateZunoMemory1758500000000 = CreateZunoMemory1758500000000;
//# sourceMappingURL=1758500000000-CreateZunoMemory.js.map