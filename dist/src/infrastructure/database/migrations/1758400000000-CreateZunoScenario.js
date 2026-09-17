"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateZunoScenario1758400000000 = void 0;
class CreateZunoScenario1758400000000 {
    constructor() {
        this.name = 'CreateZunoScenario1758400000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
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
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_scenario_sets_version" ON "zuno_scenario_sets" ("challenge_id", "version_number")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_scenario_sets_user" ON "zuno_scenario_sets" ("user_id", "created_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_scenario_sets_current" ON "zuno_scenario_sets" ("challenge_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_scenario_sets_safety_decision" ON "zuno_scenario_sets" ("safety_decision_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_scenario_sets_ai_run" ON "zuno_scenario_sets" ("ai_generation_run_id")`);
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_scenarios_set" ON "zuno_scenarios" ("scenario_set_id", "display_order")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_scenarios_challenge_status" ON "zuno_scenarios" ("challenge_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_scenarios_user" ON "zuno_scenarios" ("user_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_scenarios_relevance" ON "zuno_scenarios" ("challenge_id", "relevance", "impact")`);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_zuno_scenarios_rejected"
      ON "zuno_scenarios" ("challenge_id")
      WHERE "status" = 'USER_REJECTED'
    `);
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_scenario_conditions_scenario" ON "zuno_scenario_conditions" ("scenario_id", "condition_type")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_scenario_conditions_user" ON "zuno_scenario_conditions" ("user_id")`);
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_sessions_challenge" ON "zuno_what_if_sessions" ("challenge_id", "created_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_sessions_user_status" ON "zuno_what_if_sessions" ("user_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_sessions_expiry" ON "zuno_what_if_sessions" ("expires_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_sessions_safety_decision" ON "zuno_what_if_sessions" ("safety_decision_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_sessions_ai_run" ON "zuno_what_if_sessions" ("ai_generation_run_id")`);
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
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_assumptions_session" ON "zuno_what_if_assumptions" ("what_if_session_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_what_if_assumptions_user" ON "zuno_what_if_assumptions" ("user_id")`);
        await this.addCheck(queryRunner, 'zuno_scenarios', 'chk_zuno_scenarios_probability_label_not_numeric', `"probability_label" IS NULL OR "probability_label" !~ '[0-9]'`);
        await this.addCheck(queryRunner, 'zuno_scenarios', 'chk_zuno_scenarios_confidence_range', `"confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1)`);
        await this.addCheck(queryRunner, 'zuno_scenarios', 'chk_zuno_scenarios_hypothetical_type', `"hypothetical" = false OR "scenario_type" = 'USER_DEFINED_WHAT_IF'`);
        await this.addCheck(queryRunner, 'zuno_scenario_sets', 'chk_zuno_scenario_sets_user_facing_count', `"user_facing_count" >= 0 AND "user_facing_count" <= 4`);
        await this.addCheck(queryRunner, 'zuno_scenario_sets', 'chk_zuno_scenario_sets_version_positive', `"version_number" >= 1`);
        await this.addCheck(queryRunner, 'zuno_what_if_sessions', 'chk_zuno_what_if_sessions_hypothetical', `"is_hypothetical" = true`);
        await this.addCheck(queryRunner, 'zuno_what_if_sessions', 'chk_zuno_what_if_sessions_no_plan_change', `"current_plan_changed" = false`);
    }
    async down(queryRunner) {
        const constraints = [
            ['zuno_what_if_sessions', 'chk_zuno_what_if_sessions_no_plan_change'],
            ['zuno_what_if_sessions', 'chk_zuno_what_if_sessions_hypothetical'],
            ['zuno_scenario_sets', 'chk_zuno_scenario_sets_version_positive'],
            ['zuno_scenario_sets', 'chk_zuno_scenario_sets_user_facing_count'],
            ['zuno_scenarios', 'chk_zuno_scenarios_hypothetical_type'],
            ['zuno_scenarios', 'chk_zuno_scenarios_confidence_range'],
            ['zuno_scenarios', 'chk_zuno_scenarios_probability_label_not_numeric'],
        ];
        for (const [table, name] of constraints) {
            await queryRunner.query(`ALTER TABLE IF EXISTS "${table}" DROP CONSTRAINT IF EXISTS "${name}"`);
        }
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
    async addCheck(queryRunner, table, name, expression) {
        const existing = await queryRunner.query(`SELECT 1 FROM pg_constraint WHERE conname = $1`, [name]);
        if (Array.isArray(existing) && existing.length > 0)
            return;
        await queryRunner.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${name}" CHECK (${expression})`);
    }
}
exports.CreateZunoScenario1758400000000 = CreateZunoScenario1758400000000;
//# sourceMappingURL=1758400000000-CreateZunoScenario.js.map