"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateZunoMkaPlan1758100000000 = void 0;
class CreateZunoMkaPlan1758100000000 {
    constructor() {
        this.name = 'CreateZunoMkaPlan1758100000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_user" ON "zuno_mka_programs" ("user_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_challenge" ON "zuno_mka_programs" ("challenge_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_period" ON "zuno_mka_programs" ("user_id", "start_date", "end_date")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_review" ON "zuno_mka_programs" ("status", "review_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_plan" ON "zuno_mka_programs" ("plan_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_rulebook" ON "zuno_mka_programs" ("rulebook_version_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_programs_superseded" ON "zuno_mka_programs" ("superseded_by_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_mka_programs_one_active"
         ON "zuno_mka_programs" ("challenge_id")
         WHERE "status" = 'ACTIVE' AND "deleted_at" IS NULL`);
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_items_program" ON "zuno_mka_items" ("mka_program_id", "display_order")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_items_user" ON "zuno_mka_items" ("user_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_items_dimension" ON "zuno_mka_items" ("mka_program_id", "dimension")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_items_plan_eligible" ON "zuno_mka_items" ("mka_program_id", "plan_eligible")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_items_rule" ON "zuno_mka_items" ("source_rule_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_items_validity" ON "zuno_mka_items" ("status", "valid_to")
         WHERE "valid_to" IS NOT NULL`);
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
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_mka_completions_item" ON "zuno_mka_completions" ("mka_item_id", "completion_date")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_completions_user" ON "zuno_mka_completions" ("user_id", "completion_date")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_mka_completions_program" ON "zuno_mka_completions" ("mka_program_id", "status")`);
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plans_user_status" ON "zuno_plans" ("user_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plans_challenge" ON "zuno_plans" ("challenge_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plans_type" ON "zuno_plans" ("challenge_id", "plan_type", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plans_window" ON "zuno_plans" ("user_id", "start_date")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plans_review" ON "zuno_plans" ("status", "review_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plans_mka" ON "zuno_plans" ("mka_program_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plans_superseded" ON "zuno_plans" ("superseded_by_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plans_realignment" ON "zuno_plans" ("generated_from_realignment_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_plans_one_active"
         ON "zuno_plans" ("challenge_id", "plan_type")
         WHERE "status" IN ('DRAFT', 'ACTIVE') AND "deleted_at" IS NULL`);
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_plan" ON "zuno_plan_items" ("plan_id", "display_order")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_user_status" ON "zuno_plan_items" ("user_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_plan_status" ON "zuno_plan_items" ("plan_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_scheduled" ON "zuno_plan_items" ("user_id", "scheduled_date", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_due" ON "zuno_plan_items" ("user_id", "due_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_mka" ON "zuno_plan_items" ("mka_item_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_parent" ON "zuno_plan_items" ("parent_item_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_source_ref" ON "zuno_plan_items" ("source_ref_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plan_items_capacity"
         ON "zuno_plan_items" ("plan_id", "is_practice", "priority")
         WHERE "status" IN ('PENDING', 'IN_PROGRESS', 'BLOCKED') AND "deleted_at" IS NULL`);
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plan_item_events_item" ON "zuno_plan_item_events" ("plan_item_id", "created_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plan_item_events_plan" ON "zuno_plan_item_events" ("plan_id", "created_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_plan_item_events_user" ON "zuno_plan_item_events" ("user_id", "event_type")`);
        await this.addCheck(queryRunner, 'zuno_mka_items', 'chk_zuno_mka_items_astro_provenance', `"source_type" NOT IN ('APPROVED_ASTRO_REMEDY', 'SME_APPROVED_PRACTICE')
       OR ("rulebook_version_id" IS NOT NULL
           AND ("source_remedy_key" IS NOT NULL OR "source_rule_key" IS NOT NULL))`);
        await this.addCheck(queryRunner, 'zuno_mka_items', 'chk_zuno_mka_items_validity_window', `"valid_from" IS NULL OR "valid_to" IS NULL OR "valid_to" >= "valid_from"`);
        await this.addCheck(queryRunner, 'zuno_mka_items', 'chk_zuno_mka_items_duration_positive', `"duration_minutes" IS NULL OR "duration_minutes" > 0`);
        await this.addCheck(queryRunner, 'zuno_mka_programs', 'chk_zuno_mka_programs_period', `"end_date" >= "start_date"`);
        await this.addCheck(queryRunner, 'zuno_mka_programs', 'chk_zuno_mka_programs_supersede_distinct', `"superseded_by_id" IS NULL OR "superseded_by_id" <> "id"`);
        await this.addCheck(queryRunner, 'zuno_plans', 'chk_zuno_plans_window', `"end_date" IS NULL OR "end_date" >= "start_date"`);
        await this.addCheck(queryRunner, 'zuno_plans', 'chk_zuno_plans_supersede_distinct', `"superseded_by_id" IS NULL OR "superseded_by_id" <> "id"`);
        await this.addCheck(queryRunner, 'zuno_plan_items', 'chk_zuno_plan_items_priority_rank', `("priority" = 'ESSENTIAL' AND "priority_rank" = 1)
       OR ("priority" = 'IMPORTANT' AND "priority_rank" = 2)
       OR ("priority" = 'OPTIONAL' AND "priority_rank" = 3)`);
        await this.addCheck(queryRunner, 'zuno_plan_items', 'chk_zuno_plan_items_parent_distinct', `"parent_item_id" IS NULL OR "parent_item_id" <> "id"`);
        await this.addCheck(queryRunner, 'zuno_plan_items', 'chk_zuno_plan_items_deferral_count', `"deferral_count" >= 0`);
        await this.addCheck(queryRunner, 'zuno_plan_items', 'chk_zuno_plan_items_estimate_positive', `"estimated_minutes" IS NULL OR "estimated_minutes" > 0`);
        await this.addCheck(queryRunner, 'zuno_plan_items', 'chk_zuno_plan_items_conditional_trigger', `"status" <> 'CONDITIONAL' OR "trigger_condition" IS NOT NULL`);
        await this.addCheck(queryRunner, 'zuno_plan_items', 'chk_zuno_plan_items_completed_at', `("status" = 'DONE' AND "completed_at" IS NOT NULL)
       OR ("status" <> 'DONE' AND "completed_at" IS NULL)`);
    }
    async down(queryRunner) {
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
    async addCheck(queryRunner, table, constraintName, expression) {
        const tableExists = await queryRunner.query(`SELECT to_regclass($1) IS NOT NULL AS present`, [`public.${table}`]);
        if (!tableExists?.[0]?.present)
            return;
        const exists = await queryRunner.query(`SELECT 1 FROM pg_constraint WHERE conname = $1 AND conrelid = $2::regclass`, [constraintName, `public.${table}`]);
        if (exists?.length)
            return;
        await queryRunner.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" CHECK (${expression})`);
    }
}
exports.CreateZunoMkaPlan1758100000000 = CreateZunoMkaPlan1758100000000;
//# sourceMappingURL=1758100000000-CreateZunoMkaPlan.js.map