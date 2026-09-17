"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateZunoFoundation1757600000000 = void 0;
class CreateZunoFoundation1757600000000 {
    constructor() {
        this.name = 'CreateZunoFoundation1757600000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "auth_subject" varchar(255) NOT NULL,
        "customer_id" bigint NULL,
        "status" varchar(32) NOT NULL DEFAULT 'ACTIVE',
        "timezone" varchar(64) NULL,
        "locale" varchar(16) NULL,
        "onboarding_status" varchar(32) NOT NULL DEFAULT 'NOT_STARTED',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_users_auth_subject" ON "zuno_users" ("auth_subject")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_users_status" ON "zuno_users" ("status")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_user_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "preferred_name" varchar(100) NULL,
        "display_name" varchar(200) NULL,
        "country_code" varchar(2) NULL,
        "city" varchar(120) NULL,
        "occupation" varchar(120) NULL,
        "preferred_language" varchar(16) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_user_profiles_user" ON "zuno_user_profiles" ("user_id")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_user_preferences" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "preference_key" varchar(100) NOT NULL,
        "preference_value" jsonb NOT NULL,
        "source" varchar(32) NOT NULL DEFAULT 'USER_EXPLICIT',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_user_prefs_lookup" ON "zuno_user_preferences" ("user_id", "preference_key", "is_active")`);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_user_prefs_active_unique"
      ON "zuno_user_preferences" ("user_id", "preference_key")
      WHERE "is_active" = true AND "deleted_at" IS NULL
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_user_consents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "consent_type" varchar(64) NOT NULL,
        "policy_version" varchar(32) NOT NULL,
        "granted" boolean NOT NULL DEFAULT false,
        "granted_at" timestamptz NULL,
        "revoked_at" timestamptz NULL,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_user_consents_user_type" ON "zuno_user_consents" ("user_id", "consent_type")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_birth_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "date_of_birth" date NOT NULL,
        "time_of_birth" time NULL,
        "time_accuracy" varchar(16) NOT NULL DEFAULT 'UNKNOWN',
        "place_name" varchar(200) NOT NULL,
        "place_country_code" varchar(2) NULL,
        "latitude" numeric(10,7) NULL,
        "longitude" numeric(10,7) NULL,
        "timezone_at_birth" varchar(64) NULL,
        "source" varchar(32) NOT NULL DEFAULT 'USER_PROVIDED',
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        -- Build Rule 53: uncertainty is preserved, never silently upgraded.
        -- A profile claiming EXACT/APPROXIMATE/RECTIFIED precision without a
        -- time would be a fabricated value reaching the astrology engine.
        CONSTRAINT "chk_zuno_birth_time_accuracy" CHECK (
          ("time_accuracy" = 'UNKNOWN' AND "time_of_birth" IS NULL)
          OR ("time_accuracy" <> 'UNKNOWN' AND "time_of_birth" IS NOT NULL)
        )
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_birth_profiles_user" ON "zuno_birth_profiles" ("user_id")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_challenges" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "zuno_users"("id") ON DELETE CASCADE,
        "title" varchar(200) NULL,
        "raw_user_statement" text NOT NULL,
        "primary_domain" varchar(32) NULL,
        "theme" varchar(64) NULL,
        "status" varchar(32) NOT NULL DEFAULT 'NEW',
        "mode" varchar(32) NULL,
        "urgency" varchar(16) NULL,
        "emotional_intensity" varchar(16) NULL,
        "priority" integer NULL,
        "context_version" integer NOT NULL DEFAULT 0,
        "opened_at" timestamptz NOT NULL,
        "resolved_at" timestamptz NULL,
        "resolution_note" text NULL,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_challenges_user_status" ON "zuno_challenges" ("user_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_challenges_user_opened" ON "zuno_challenges" ("user_id", "opened_at")`);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_zuno_challenges_active"
      ON "zuno_challenges" ("user_id", "opened_at" DESC)
      WHERE "deleted_at" IS NULL
        AND "status" IN ('NEW','UNDERSTANDING','ACTIVE','MONITORING','CHANGED','REALIGNMENT_REQUIRED')
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_challenge_contexts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "challenge_id" uuid NOT NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL,
        "version_number" integer NOT NULL,
        "summary" text NOT NULL,
        "payload" jsonb NOT NULL,
        "routing" jsonb NOT NULL,
        "confidence" numeric(4,3) NOT NULL,
        "clarification_required" boolean NOT NULL DEFAULT false,
        "extractor_version" varchar(64) NOT NULL,
        "ai_generation_run_id" uuid NULL,
        "created_reason" varchar(48) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_challenge_contexts_version" ON "zuno_challenge_contexts" ("challenge_id", "version_number")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_challenge_domains" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "challenge_id" uuid NOT NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL,
        "domain" varchar(32) NOT NULL,
        "risk_class" varchar(24) NOT NULL,
        "is_primary" boolean NOT NULL DEFAULT false,
        "confidence" numeric(4,3) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_challenge_domains_lookup" ON "zuno_challenge_domains" ("challenge_id", "domain")`);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_challenge_domains_primary"
      ON "zuno_challenge_domains" ("challenge_id")
      WHERE "is_primary" = true
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_challenge_links" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "source_challenge_id" uuid NOT NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "target_challenge_id" uuid NOT NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL,
        "relationship_type" varchar(32) NOT NULL,
        "reason" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "chk_zuno_challenge_links_distinct"
          CHECK ("source_challenge_id" <> "target_challenge_id")
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_challenge_links_unique" ON "zuno_challenge_links" ("source_challenge_id", "target_challenge_id", "relationship_type")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_challenge_links_target" ON "zuno_challenge_links" ("target_challenge_id")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_responses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "challenge_id" uuid NULL REFERENCES "zuno_challenges"("id") ON DELETE CASCADE,
        "conversation_id" uuid NULL,
        "response_type" varchar(32) NOT NULL,
        "structured_payload" jsonb NOT NULL,
        "rendered_text" text NULL,
        "context_version" integer NULL,
        "model_version" varchar(64) NULL,
        "prompt_version" varchar(64) NULL,
        "engine_version" varchar(64) NOT NULL,
        "rulebook_version_id" uuid NULL,
        "safety_decision_id" uuid NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_responses_challenge" ON "zuno_responses" ("challenge_id", "created_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_responses_user" ON "zuno_responses" ("user_id", "created_at")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_safety_decisions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "challenge_id" uuid NULL,
        "operation" varchar(48) NOT NULL,
        "risk_level" varchar(24) NOT NULL,
        "disposition" varchar(40) NOT NULL,
        "domains" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "flags" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "actions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "blocked_capabilities" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "matched_rule_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "policy_version" varchar(16) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_safety_decisions_user" ON "zuno_safety_decisions" ("user_id", "created_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_safety_decisions_challenge" ON "zuno_safety_decisions" ("challenge_id")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_safety_incidents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NULL,
        "safety_decision_id" uuid NULL,
        "related_response_id" uuid NULL,
        "source" varchar(48) NOT NULL,
        "domain" varchar(32) NULL,
        "severity" varchar(24) NOT NULL,
        "violations" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "status" varchar(24) NOT NULL DEFAULT 'OPEN',
        "policy_version" varchar(16) NOT NULL,
        "resolved_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_safety_incidents_status" ON "zuno_safety_incidents" ("status", "created_at")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_ai_generation_runs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NULL,
        "challenge_id" uuid NULL,
        "operation_type" varchar(48) NOT NULL,
        "model_provider" varchar(32) NOT NULL,
        "model_name" varchar(64) NOT NULL,
        "model_version" varchar(64) NULL,
        "prompt_template_version" varchar(64) NOT NULL,
        "input_reference" jsonb NOT NULL,
        "output_reference" jsonb NULL,
        "status" varchar(24) NOT NULL,
        "latency_ms" integer NULL,
        "attempt_count" integer NOT NULL DEFAULT 1,
        "token_usage" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_ai_runs_operation" ON "zuno_ai_generation_runs" ("operation_type", "created_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_ai_runs_challenge" ON "zuno_ai_generation_runs" ("challenge_id")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_engine_runs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "challenge_id" uuid NULL,
        "engine_type" varchar(32) NOT NULL,
        "status" varchar(24) NOT NULL DEFAULT 'PENDING',
        "input_reference" jsonb NOT NULL,
        "output_reference" jsonb NULL,
        "started_at" timestamptz NULL,
        "completed_at" timestamptz NULL,
        "error_code" varchar(48) NULL,
        "progress" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_engine_runs_challenge" ON "zuno_engine_runs" ("challenge_id", "engine_type")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_engine_runs_status" ON "zuno_engine_runs" ("status", "created_at")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_event_outbox" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "aggregate_type" varchar(32) NOT NULL,
        "aggregate_id" uuid NOT NULL,
        "event_type" varchar(64) NOT NULL,
        "event_version" varchar(16) NOT NULL DEFAULT '1',
        "payload" jsonb NOT NULL,
        "status" varchar(24) NOT NULL DEFAULT 'PENDING',
        "published_at" timestamptz NULL,
        "retry_count" integer NOT NULL DEFAULT 0,
        "last_error" text NULL,
        "request_id" varchar(128) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_outbox_aggregate" ON "zuno_event_outbox" ("aggregate_type", "aggregate_id")`);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_zuno_outbox_dispatch"
      ON "zuno_event_outbox" ("created_at")
      WHERE "status" = 'PENDING'
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_idempotency_keys" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NULL,
        "operation" varchar(64) NOT NULL,
        "idempotency_key" varchar(200) NOT NULL,
        "request_hash" varchar(64) NOT NULL,
        "response_reference" jsonb NULL,
        "status" varchar(24) NOT NULL DEFAULT 'IN_PROGRESS',
        "expires_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_zuno_idempotency_unique" ON "zuno_idempotency_keys" ("operation", "idempotency_key")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_idempotency_expiry" ON "zuno_idempotency_keys" ("expires_at")`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zuno_audit_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "actor_type" varchar(16) NOT NULL,
        "actor_id" uuid NULL,
        "user_id" uuid NULL,
        "action" varchar(64) NOT NULL,
        "entity_type" varchar(64) NOT NULL,
        "entity_id" uuid NULL,
        "before_hash" varchar(64) NULL,
        "after_hash" varchar(64) NULL,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "redacted_at" timestamptz NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_audit_entity" ON "zuno_audit_events" ("entity_type", "entity_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zuno_audit_user" ON "zuno_audit_events" ("user_id", "created_at")`);
    }
    async down(queryRunner) {
        const tables = [
            'zuno_audit_events',
            'zuno_idempotency_keys',
            'zuno_event_outbox',
            'zuno_engine_runs',
            'zuno_ai_generation_runs',
            'zuno_safety_incidents',
            'zuno_safety_decisions',
            'zuno_responses',
            'zuno_challenge_links',
            'zuno_challenge_domains',
            'zuno_challenge_contexts',
            'zuno_challenges',
            'zuno_birth_profiles',
            'zuno_user_consents',
            'zuno_user_preferences',
            'zuno_user_profiles',
            'zuno_users',
        ];
        for (const table of tables) {
            await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        }
    }
}
exports.CreateZunoFoundation1757600000000 = CreateZunoFoundation1757600000000;
//# sourceMappingURL=1757600000000-CreateZunoFoundation.js.map